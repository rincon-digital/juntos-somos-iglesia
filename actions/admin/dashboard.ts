"use server";

import prisma from "@/lib/prisma";
import { Role, Rank } from "@/lib/types/definitions";
import { getCurrentUser } from "../auth/auth";

export async function getDashboardStats() {
  const [totalUsers, totalCourses, totalArticles, totalTestimonies] =
    await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.article.count(),
      prisma.testimony.count(),
    ]);

  return {
    totalUsers,
    totalCourses,
    totalArticles,
    totalTestimonies,
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

export async function getAdmins() {
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
    },
    orderBy: { createdAt: "desc" },
  });
  return admins;
}

export async function getAdminCourses(adminId: string) {
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

export async function getCourseCollaborators(courseId: string) {
  const managers = await prisma.courseManager.findMany({
    where: { courseId },
    include: {
      user: {
        select: { id: true, fullName: true, username: true },
      },
    },
  });

  return managers.map((m) => ({
    id: m.user.id,
    fullName: m.user.fullName,
    username: m.user.username,
    roleInCourse: m.roleInCourse,
  }));
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
