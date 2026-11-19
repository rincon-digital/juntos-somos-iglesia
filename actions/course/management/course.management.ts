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
