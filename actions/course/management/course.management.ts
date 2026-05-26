"use server";

import prisma from "@/lib/prisma";
import { Role, RoleInCourse } from "../../../lib/types/definitions";
import { validateSessionUser } from "../../user";
import { validationCollaboratorCourse } from "@/lib/helpers/course/validationAccessCourse";

export async function addContributor(courseId: string, userId: string) {
  try {
    // VALIDAR SESIÓN
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado." };
    }

    //VALIDAR PERMISOS EN EL CURSO (Solo Owner o Superadmin pueden añadir)
    const hasAccess = await validationCollaboratorCourse(
      courseId,
      session.userId,
    );

    if (!hasAccess) {
      return {
        error: "Solo el dueño del curso puede agregar colaboradores.",
      };
    }

    //VALIDAR QUE EL USUARIO NO SEA COLABORADOR
    const isContributor = await prisma.courseManager.findUnique({
      where: {
        courseId_userId: {
          courseId: courseId,
          userId: userId,
        },
      },
    });

    if (isContributor) {
      return { error: "El usuario ya es colaborador del curso." };
    }

    const existUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existUser) {
      return { error: "El usuario que desea agregar no existe." };
    }

    await prisma.courseManager.create({
      data: {
        courseId: courseId,
        userId: userId,
        roleInCourse: RoleInCourse.editor,
      },
    });
    return { success: "Colaborador agregado correctamente" };
  } catch (error) {
    console.log(error);
    return { error: "Se produjo un error al agregar el colaborador" };
  }
}

export async function removeContributor(courseId: string, userId: string) {
  try {
    // VALIDAR SESIÓN
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado." };
    }

    //VALIDAR PERMISOS EN EL CURSO
    const hasAccess = await validationCollaboratorCourse(
      courseId,
      session.userId,
    );

    if (!hasAccess) {
      return {
        error: "Solo el dueño del curso puede eliminar colaboradores.",
      };
    }

    //VALIDAR QUE EL USUARIO SEA COLABORADOR
    const isContributor = await prisma.courseManager.findUnique({
      where: {
        courseId_userId: {
          courseId: courseId,
          userId: userId,
        },
      },
    });

    if (!isContributor) {
      return { error: "El usuario no es colaborador del curso." };
    }

    await prisma.courseManager.delete({
      where: {
        courseId_userId: {
          courseId: courseId,
          userId: userId,
        },
      },
    });
    return { success: "Colaborador eliminado correctamente" };
  } catch (error) {
    console.log(error);
    return { error: "Se produjo un error al eliminar el colaborador" };
  }
}

export async function searchPotentialCollaborators(
  courseId: string,
  query: string,
) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) return { error: "No autorizado" };

    if (!query || query.length < 3) return [];

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: query } },
          { username: { contains: query } },
        ],
        managedCourses: {
          none: {
            courseId: courseId,
          },
        },
        // Opcionalmente podrías filtrar por rol si solo quieres admins
        // role: { in: [Role.admin, Role.superadmin] }
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
      },
      take: 5,
    });

    return users;
  } catch (error) {
    console.error(error);
    return { error: "Error al buscar usuarios" };
  }
}

export async function getAvailableUsers(courseId: string) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) return { error: "No autorizado" };

    const users = await prisma.user.findMany({
      where: {
        role: { in: [Role.admin, Role.superadmin] },
        managedCourses: {
          none: {
            courseId: courseId,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        username: true,
      },
      orderBy: { fullName: "asc" },
    });

    return users;
  } catch (error) {
    console.error(error);
    return { error: "Error al obtener usuarios disponibles" };
  }
}

export async function getCoursesManagement() {
  // 1. Validamos la sesión.
  // Nota: validateSessionUser ya permite que Superadmin pase aunque pidamos Role.admin
  const session = await validateSessionUser(Role.admin);

  if (!session || !session.userId) {
    return { error: "Acceso no autorizado o sesión expirada." };
  }

  try {
    // 2. Consulta con filtro estricto por userId
    const courses = await prisma.course.findMany({
      where: {
        managers: {
          some: {
            userId: session.userId, // Filtramos SÍ O SÍ por el ID del usuario logueado
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        openEnrollment: true,
        quotaLimit: true,
        deadline: true,
        accessCode: true,
        createdAt: true,
        _count: {
          select: { courseRegistration: true },
        },
        managers: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Opcional: mostrar los más nuevos primero
      },
    });

    return courses;
  } catch (error) {
    console.error("Error en getCoursesManagement:", error);
    return { error: "Ocurrió un error al obtener tus cursos." };
  }
}
