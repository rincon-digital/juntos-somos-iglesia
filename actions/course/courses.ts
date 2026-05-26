"use server";

import prisma from "@/lib/prisma";
import {
  CreateCourse,
  UpdateCourse,
  Role,
  RoleInCourse,
} from "../../lib/types/definitions";
import generateAccessCode from "@/lib/utils/generatorsCode";
import { getCurrentUser } from "../auth/auth";
import { validationCollaboratorCourse } from "@/lib/helpers/course/validationAccessCourse";
import { validationDataCourse } from "@/lib/helpers/course/validationCourse";
import { revalidatePath } from "next/cache";

export async function updateCourse(data: UpdateCourse) {
  try {
    const session = await getCurrentUser();
    // Validamos que sea admin o superadmin
    if (
      !session ||
      (session.role !== Role.admin && session.role !== Role.superadmin)
    ) {
      return { error: "No autorizado." };
    }

    const { id, ...updateData } = data;
    if (!id) return { error: "ID de curso faltante." };

    const hasAccess = await validationCollaboratorCourse(id, session.id);
    if (!hasAccess && session.role !== Role.superadmin) {
      return { error: "No tienes permisos para modificar este curso." };
    }

    await prisma.course.update({
      where: { id: id },
      data: {
        name: updateData.name || undefined,
        description: (updateData as any).description || undefined,
        quotaLimit: updateData.quotaLimit
          ? Number(updateData.quotaLimit)
          : undefined,
        openEnrollment: (updateData as any).openEnrollment
          ? new Date((updateData as any).openEnrollment)
          : undefined,
        deadline: updateData.deadline
          ? new Date(updateData.deadline)
          : undefined,
      },
    });

    revalidatePath("/admin/courses");
    return { success: "Curso actualizado correctamente" };
  } catch (error) {
    return { error: "Error al actualizar el curso" };
  }
}

export async function updateCodeCourse(courseId: string) {
  try {
    const session = await getCurrentUser();
    if (
      !session ||
      (session.role !== Role.admin && session.role !== Role.superadmin)
    ) {
      return { error: "No autorizado." };
    }

    const hasAccess = await validationCollaboratorCourse(courseId, session.id);
    if (!hasAccess && session.role !== Role.superadmin) {
      return { error: "No tienes permisos de gestión." };
    }

    const newCode = generateAccessCode(6);
    await prisma.course.update({
      where: { id: courseId },
      data: { accessCode: newCode },
    });

    revalidatePath("/admin/courses");
    return { success: "Código regenerado exitosamente", code: newCode };
  } catch (error) {
    return { error: "Error al actualizar el código." };
  }
}

export async function getInfoCourses(filterAll: boolean = false) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.id) return { error: "Acceso no autorizado." };

    // Permitir acceso si es admin o superadmin
    if (session.role !== Role.admin && session.role !== Role.superadmin) {
      return { error: "Rol no permitido." };
    }

    const isSuperAdmin = session.role === Role.superadmin;
    const whereClause =
      filterAll && isSuperAdmin
        ? {}
        : // 🔥 CORRECCIÓN CRÍTICA: Usar session.id (no session.userId)
          { managers: { some: { userId: session.id } } };

    const courses = await prisma.course.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        managers: {
          select: {
            userId: true,
            roleInCourse: true,
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
          },
        },
        video: {
          orderBy: { order: "asc" },
          include: {
            videoReview: true,
          },
        },
        courseRegistration: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                rank: true,
                profile: {
                  select: {
                    dni: true,
                    phone: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
        _count: { select: { courseRegistration: true } },
      },
    });
    return courses.map((course) => {
      // Buscamos al dueño original (owner)
      const ownerManager = course.managers.find(
        (m) => m.roleInCourse === RoleInCourse.owner,
      );

      // Aplanamos la estructura de courseRegistration para que el frontend la reciba como esperaba
      const formattedStudents = course.courseRegistration.map((reg) => ({
        ...reg,
        user: {
          ...reg.user,
          dni: reg.user.profile?.dni,
          phone: reg.user.profile?.phone,
          address: reg.user.profile?.address,
        },
      }));

      return {
        ...course,
        courseRegistration: formattedStudents,
        isOwner: ownerManager?.userId === session.id,
        creator: ownerManager?.user?.fullName || "Admin Sistema",
        collaborators: course.managers
          .filter((m) => m.roleInCourse !== RoleInCourse.owner)
          .map((m) => ({
            fullName: m.user?.fullName || "Usuario",
          })),
        roleInSession: session.role,
      };
    });
  } catch (error) {
    return { error: "Error al obtener datos" };
  }
}

import { unstable_noStore as noStore } from "next/cache";

export async function getCourses(limit?: number) {
  noStore();
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        openEnrollment: true,
        quotaLimit: true,
        deadline: true,
        createdAt: true,
        _count: { select: { courseRegistration: true } },
      },
    });
    return courses;
  } catch (error) {
    return [];
  }
}

export async function getStudentCoursePath(courseId: string, userId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { name: true },
    });

    if (!course) return { error: "Curso no encontrado", roadmap: [] };

    const videos = await prisma.courseVideo.findMany({
      where: { courseId: courseId },
      orderBy: { order: "asc" },
      include: {
        videoReview: {
          include: {
            examAnswers: { where: { userId: userId, isArchived: false } },
          },
        },
        videoProgress: { where: { userId: userId } },
      },
    });

    const roadmap = videos.map((v, idx) => {
      const isCompleted = v.videoProgress?.[0]?.isCompleted || false;
      const isLocked =
        idx > 0 && !videos[idx - 1].videoProgress?.[0]?.isCompleted;

      return {
        id: v.id,
        title: v.title,
        order: v.order,
        videoId: v.videoId.trim(),
        videoReview: v.videoReview,
        isCompleted,
        isLocked,
      };
    });

    return { courseName: course.name, roadmap };
  } catch (error: any) {
    return { error: `Error: ${error.message}`, roadmap: [] };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const session = await getCurrentUser();
    if (!session) return { error: "No autorizado." };

    const managerInfo = await prisma.courseManager.findUnique({
      where: { courseId_userId: { courseId, userId: session.id } },
    });

    if (
      managerInfo?.roleInCourse !== RoleInCourse.owner &&
      session.role !== Role.superadmin
    ) {
      return { error: "Sin permisos." };
    }

    await prisma.course.delete({ where: { id: courseId } });
    revalidatePath("/admin/courses");
    return { success: "Curso eliminado." };
  } catch (error) {
    return { error: "Error al eliminar." };
  }
}

export async function createCourse(data: CreateCourse) {
  try {
    const session = await getCurrentUser();
    if (
      !session ||
      (session.role !== Role.admin && session.role !== Role.superadmin)
    ) {
      return { error: "No autorizado." };
    }

    const validation = await validationDataCourse(data);
    if (!validation.isValid) return { error: validation.errors };

    const accessCode = generateAccessCode(6);
    await prisma.course.create({
      data: {
        name: data.name,
        description: data.description,
        quotaLimit: Number(data.quotaLimit),
        openEnrollment: new Date(data.openEnrollment),
        deadline: new Date(data.deadline),
        accessCode: accessCode,
        managers: {
          create: { roleInCourse: RoleInCourse.owner, userId: session.id },
        },
      },
    });
    revalidatePath("/admin/courses");
    return { success: "Curso creado", code: accessCode };
  } catch (error) {
    return { error: "Error al crear." };
  }
}
