"use server";

import prisma from "@/lib/prisma";
import { Role, Rank } from "@/lib/types/definitions";
import { getCurrentUser } from "../auth/auth";

const MONTHS_BACK = 6;

// Métricas del panel: series mensuales, KPIs del mes y actividad reciente
export async function getDashboardAnalytics() {
  const session = await getCurrentUser();
  if (
    !session ||
    (session.role !== Role.admin && session.role !== Role.superadmin)
  ) {
    throw new Error("No autorizado");
  }

  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1), 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalMembers,
    totalRegistrations,
    totalArticles,
    totalTestimonies,
    completedVideos,
    answers,
    correctAnswers,
    membersSince,
    registrationsSince,
    recentRegistrations,
    recentTestimonies,
    recentArticles,
    recentMembers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.user } }),
    prisma.courseRegistration.count(),
    prisma.article.count(),
    prisma.testimony.count(),
    prisma.userVideoProgress.count({ where: { isCompleted: true } }),
    prisma.examAnswers.count({ where: { isArchived: false } }),
    prisma.examAnswers.count({ where: { isArchived: false, isCorrect: true } }),
    prisma.user.findMany({
      where: { role: Role.user, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.courseRegistration.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.courseRegistration.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        user: { select: { fullName: true } },
        course: { select: { name: true } },
      },
    }),
    prisma.testimony.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, author: { select: { fullName: true } } },
    }),
    prisma.article.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, title: true },
    }),
    prisma.user.findMany({
      where: { role: Role.user },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, fullName: true },
    }),
  ]);

  // Un bucket por mes, del más viejo al actual
  const months = Array.from({ length: MONTHS_BACK }, (_, i) => {
    const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""),
      members: 0,
      registrations: 0,
    };
  });
  const bucket = (date: Date) =>
    months.find((m) => m.key === `${date.getFullYear()}-${date.getMonth()}`);
  membersSince.forEach((u) => {
    const m = bucket(u.createdAt);
    if (m) m.members++;
  });
  registrationsSince.forEach((r) => {
    const m = bucket(r.createdAt);
    if (m) m.registrations++;
  });

  const inRange = (d: Date, from: Date, to?: Date) => d >= from && (!to || d < to);
  const membersThisMonth = membersSince.filter((u) => inRange(u.createdAt, monthStart)).length;
  const membersPrevMonth = membersSince.filter((u) => inRange(u.createdAt, prevMonthStart, monthStart)).length;
  const registrationsThisMonth = registrationsSince.filter((r) => inRange(r.createdAt, monthStart)).length;
  const registrationsPrevMonth = registrationsSince.filter((r) => inRange(r.createdAt, prevMonthStart, monthStart)).length;

  const activity = [
    ...recentRegistrations.map((r) => ({
      type: "registration" as const,
      date: r.createdAt,
      title: r.user.fullName,
      detail: `Se inscribió en ${r.course.name}`,
    })),
    ...recentTestimonies.map((t) => ({
      type: "testimony" as const,
      date: t.createdAt,
      title: t.author.fullName,
      detail: "Compartió un testimonio",
    })),
    ...recentArticles.map((a) => ({
      type: "article" as const,
      date: a.createdAt,
      title: a.title,
      detail: "Artículo publicado",
    })),
    ...recentMembers.map((u) => ({
      type: "member" as const,
      date: u.createdAt,
      title: u.fullName,
      detail: "Se sumó a la comunidad",
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6)
    .map((e) => ({ ...e, date: e.date.toISOString() }));

  return {
    series: months.map(({ label, members, registrations }) => ({ label, members, registrations })),
    kpis: {
      totalMembers,
      membersThisMonth,
      membersPrevMonth,
      totalRegistrations,
      registrationsThisMonth,
      registrationsPrevMonth,
      completedVideos,
      answers,
      accuracy: answers > 0 ? Math.round((correctAnswers / answers) * 100) : null,
      totalArticles,
      totalTestimonies,
    },
    activity,
  };
}

export async function getCoursesWithCount() {
  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: { courseRegistration: true },
      },
      managers: {
        include: {
          user: {
            select: { id: true, fullName: true, username: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    quotaLimit: course.quotaLimit,
    studentCount: course._count.courseRegistration,
    openEnrollment: course.openEnrollment,
    deadline: course.deadline,
    createdBy: course.managers[0]?.user.fullName || "Sistema",
    createdById: course.managers[0]?.user.id || null,
  }));
}

async function requireSuperadmin() {
  const session = await getCurrentUser();
  if (!session || session.role !== Role.superadmin) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function getAdmins() {
  await requireSuperadmin();
  const admins = await prisma.user.findMany({
    where: {
      role: Role.admin,
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      rank: true,
      createdAt: true,
      _count: { select: { managedCourses: true, articles: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return admins;
}

// Le saca el acceso al panel sin borrar la cuenta ni sus cursos: pasa a ser usuario común
export async function revokeAdminAccess(adminId: string) {
  const session = await requireSuperadmin();
  if (session.id === adminId) {
    throw new Error("No puedes quitarte el acceso a ti mismo");
  }
  const target = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true } });
  if (!target || target.role !== Role.admin) {
    throw new Error("Solo se puede quitar el acceso a administradores");
  }
  await prisma.user.update({ where: { id: adminId }, data: { role: Role.user } });
  return { success: true };
}

export async function getAdminCourses(adminId: string) {
  await requireSuperadmin();
  // 1. Buscamos todas las relaciones de este admin con los cursos
  const userWithCourses = await prisma.user.findUnique({
    where: { id: adminId },
    include: {
      managedCourses: {
        include: {
          course: {
            include: {
              _count: { select: { courseRegistration: true } },
              managers: {
                include: {
                  user: { select: { id: true, fullName: true, role: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userWithCourses) {
    return { created: [], collaborating: [] };
  }

  // 2. Separamos los cursos donde es OWNER de donde es EDITOR (Colaborador)
  const created = userWithCourses.managedCourses
    .filter((mc) => mc.roleInCourse === "owner")
    .map((mc) => ({
      id: mc.course.id,
      name: mc.course.name,
      quotaLimit: mc.course.quotaLimit,
      studentCount: mc.course._count.courseRegistration,
      deadline: mc.course.deadline,
      roleInCourse: mc.roleInCourse,
      // Aquí está la magia: Listamos a TODOS los que NO sean el dueño actual
      collaborators:
        mc.course.managers
          .filter((m) => m.userId !== adminId)
          .map((m) => m.user.fullName)
          .join(", ") || null,
    }));

  const collaborating = userWithCourses.managedCourses
    .filter((mc) => mc.roleInCourse === "editor")
    .map((mc) => {
      // Para los cursos donde colabora, buscamos quién es el dueño (owner)
      const owner = mc.course.managers.find((m) => m.roleInCourse === "owner");
      return {
        id: mc.course.id,
        name: mc.course.name,
        quotaLimit: mc.course.quotaLimit,
        studentCount: mc.course._count.courseRegistration,
        deadline: mc.course.deadline,
        role: "editor",
        createdBy: owner?.user.fullName || "Sistema",
      };
    });

  return { created, collaborating };
}

export async function deleteAdmin(adminId: string) {
  const session = await getCurrentUser();
  if (!session || session.role !== Role.superadmin) {
    throw new Error("No autorizado");
  }

  if (session.id === adminId) {
    throw new Error("No puedes eliminarte a ti mismo");
  }

  await prisma.user.delete({ where: { id: adminId } });
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  const session = await getCurrentUser();
  if (
    !session ||
    (session.role !== Role.admin && session.role !== Role.superadmin)
  ) {
    throw new Error("No autorizado");
  }

  await prisma.course.delete({ where: { id: courseId } });
  return { success: true };
}

// "Para revisar": alumnos trabados (2 intentos activos fallidos en una pregunta),
// agrupados por curso y clase. El superadmin ve todos los cursos; el admin, los suyos.
export async function getStuckStudents() {
  const session = await getCurrentUser();
  if (!session || (session.role !== Role.admin && session.role !== Role.superadmin)) return [];

  const videos = await prisma.courseVideo.findMany({
    where:
      session.role === Role.superadmin
        ? {}
        : { course: { managers: { some: { userId: session.id } } } },
    orderBy: [{ courseId: "asc" }, { order: "asc" }],
    select: {
      id: true,
      title: true,
      order: true,
      course: { select: { id: true, name: true } },
      videoProgress: { where: { isCompleted: true }, select: { userId: true } },
      videoReview: {
        select: {
          examAnswers: {
            where: { isArchived: false },
            select: { userId: true, isCorrect: true, createdAt: true, user: { select: { fullName: true } } },
          },
        },
      },
    },
  });

  const groups = [];
  for (const v of videos) {
    const approved = new Set(v.videoProgress.map((p) => p.userId));
    const stuck = new Map<string, { name: string; since: Date }>();
    for (const r of v.videoReview) {
      const byUser = new Map<string, { tries: number; correct: boolean; name: string; last: Date }>();
      for (const a of r.examAnswers) {
        const u = byUser.get(a.userId) || { tries: 0, correct: false, name: a.user?.fullName || "Alumno", last: a.createdAt };
        u.tries++;
        u.correct ||= a.isCorrect;
        if (a.createdAt > u.last) u.last = a.createdAt;
        byUser.set(a.userId, u);
      }
      byUser.forEach((u, userId) => {
        if (u.tries >= 2 && !u.correct && !approved.has(userId)) stuck.set(userId, { name: u.name, since: u.last });
      });
    }
    if (stuck.size > 0) {
      const students = [...stuck.values()].sort((a, b) => b.since.getTime() - a.since.getTime());
      groups.push({
        courseId: v.course.id,
        courseName: v.course.name,
        videoId: v.id,
        order: v.order,
        title: v.title,
        count: students.length,
        names: students.map((s) => s.name),
        lastAt: students[0].since.toISOString(),
      });
    }
  }
  // Lo más reciente primero
  return groups.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}
