"use server";

import prisma from "@/lib/prisma";
import { Role } from "../../../lib/types/definitions";
import { validateSessionUser } from "../../user";

// ELIMINAR TODOS LOS ESTUDIANTES DE UN CURSO
export async function deleteStudents(courseId: string) {
  try {
    // VALIDAR SESIÓN
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado." };
    }

    // VALIDAR PERMISOS DEL ADMIN SOBRE EL CURSO
    const hasAccess = await prisma.courseManager.findUnique({
      where: {
        courseId_userId: {
          courseId: courseId,
          userId: session.userId,
        },
      },
    });

    if (!hasAccess) {
      return {
        error: "No tienes permisos para eliminar estudiantes de este curso.",
      };
    }

    // ELIMINAR ESTUDIANTES
    await prisma.courseRegistration.deleteMany({
      where: { courseId: courseId },
    });
    return { success: "Estudiantes eliminados correctamente" };
  } catch (error) {
    console.log(error);
    return { error: "Se produjo un error al eliminar el curso" };
  }
}

// ELIMINAR ESTUDIANTE INDIVIDUAL
export async function deleteStudent(courseId: string, userId: string) {
  try {
    // VALIDAR SESIÓN
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado." };
    }

    // VALIDAR PERMISOS DEL ADMIN SOBRE EL CURSO
    const hasAccess = await prisma.courseManager.findUnique({
      where: {
        courseId_userId: {
          courseId: courseId,
          userId: session.userId,
        },
      },
    });

    if (!hasAccess) {
      return {
        error: "No tienes permisos para eliminar estudiantes de este curso.",
      };
    }

    // VALIDAR EXISTENCIA DEL ESTUDIANTE
    const student = await prisma.courseRegistration.findUnique({
      where: {
        courseId_userId: { courseId: courseId, userId: userId },
      },
    });

    if (!student) {
      return { error: "El estudiante no esta registrado en el curso." };
    }

    // ELIMINAR ESTUDIANTE
    await prisma.courseRegistration.delete({
      where: {
        courseId_userId: { courseId: courseId, userId: userId },
      },
    });
    return { success: "Estudiante eliminado correctamente" };
  } catch (error) {
    console.log(error);
    return { error: "Se produjo un error al eliminar el estudiante" };
  }
}

// OBTENER DETALLE DE EXÁMENES DE UN ESTUDIANTE
export async function getStudentDetailedProgress(
  courseId: string,
  userId: string,
) {
  try {
    const progress = await prisma.courseVideo.findMany({
      where: { courseId: courseId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        order: true,
        videoReview: {
          select: {
            question: true,
            correctOption: true,
            examAnswers: {
              where: { userId: userId },
              select: {
                response: true,
                isCorrect: true,
                isArchived: true,
                createdAt: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        videoProgress: {
          where: { userId: userId },
          select: { isCompleted: true },
        },
      },
    });
    return progress;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// OBTENER EL PROGRESO DEL MAPA PARA EL ALUMNO
export async function getStudentCoursePath(courseId: string, userId: string) {
  try {
    const coursePath = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        name: true,
        video: {
          orderBy: { order: "asc" },
          include: {
            videoReview: {
              include: { examAnswers: { where: { userId: userId, isArchived: false } } },
            },
            videoProgress: { where: { userId: userId } },
          },
        },
      },
    });

    if (!coursePath) return null;

    // Esta variable DEBE inicializarse en true para que la Etapa 1 siempre esté abierta
    let previousStepCompleted = true;

    const roadmap = coursePath.video.map((vid, index) => {
      // 1. ¿Vio el video?
      const watchedVideo =
        vid.videoProgress &&
        vid.videoProgress.length > 0 &&
        vid.videoProgress[0].isCompleted;

      // 2. ¿Tiene examen configurado?
      const hasExam = vid.videoReview && vid.videoReview.length > 0;

      // 3. ¿Pasó el examen?
      // Si no hay examen, lo damos por aprobado automáticamente para no bloquear
      const passedExam = hasExam
        ? vid.videoReview.every((q) =>
            q.examAnswers.some((a) => a.response === q.correctOption),
          )
        : true;

      // 4. DESBLOQUEO: Una etapa se desbloquea si la ANTERIOR fue completada
      const isLocked = !previousStepCompleted;

      // 5. COMPLETADO: Se considera completada si se cumplieron AMBAS (ver video y pasar examen)
      const isCompleted = watchedVideo && passedExam;

      // ACTUALIZAMOS para la siguiente iteración
      previousStepCompleted = isCompleted;

      return {
        id: vid.id,
        videoId: vid.videoId.trim(),
        title: vid.title,
        order: vid.order,
        isCompleted: !!isCompleted,
        isLocked: isLocked, // Aquí es donde se define si el alumno ve el candado o no
        videoReview: vid.videoReview,
      };
    });

    return { courseName: coursePath.name, roadmap };
  } catch (error) {
    console.error("Error en getStudentCoursePath:", error);
    return null;
  }
}
