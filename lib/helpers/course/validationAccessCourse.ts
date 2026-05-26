import prisma from "@/lib/prisma";
import { Role, RoleInCourse } from "../../types/definitions";

/**
 * Valida si un usuario tiene permisos de gestión sobre un curso.
 * Por defecto, permite acceso si es SUPERADMIN o si es el OWNER del curso.
 * Si se pasa allowEditor = true, también permite acceso a los EDITORES.
 */
export async function validationCollaboratorCourse(
  courseId: string, 
  userId: string,
  allowEditor: boolean = false
) {
  // 1. Verificar si el usuario es Superadmin globalmente
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (user?.role === Role.superadmin) return true;

  // 2. Verificar su rol dentro del curso
  const manager = await prisma.courseManager.findUnique({
    where: {
      courseId_userId: {
        courseId: courseId,
        userId: userId,
      },
    },
  });

  if (!manager) return false;

  // Si es dueño, siempre tiene acceso
  if (manager.roleInCourse === RoleInCourse.owner) return true;

  // Si es editor, depende de si lo permitimos en la llamada
  if (allowEditor && manager.roleInCourse === RoleInCourse.editor) return true;

  return false;
}
