"use server";
import prisma from "@/lib/prisma";
import { Answer } from "@/lib/types/answers.exam";
import { validateSessionUser } from "@/actions/user";
import { Role } from "@/lib/types/definitions";
import { validationCollaboratorCourse } from "@/lib/helpers/course/validationAccessCourse";

export async function userEvaluations(data: Answer) {
  try {
    console.log("Iniciando userEvaluations con data:", data);
    const session = await validateSessionUser();
    console.log("Sesión obtenida:", session);
    if (!session) return { error: "Sesión no válida", isHardBlocked: false };

    // 1. Buscamos la evaluación para saber la respuesta correcta
    const currentEvaluation = await prisma.videoReview.findUnique({
      where: { id: data.questionId },
      include: { video: true },
    });

    console.log("Evaluación encontrada:", currentEvaluation);

    if (!currentEvaluation)
      return { error: "Evaluación no encontrada", isHardBlocked: false };

    // 2. Contar intentos PREVIOS ACTIVOS (no archivados)
    const attempts = await prisma.examAnswers.findMany({
      where: { 
        userId: session.userId, 
        questionId: data.questionId,
        isArchived: false 
      },
    });

    console.log("Intentos previos encontrados:", attempts.length);

    if (attempts.length >= 2) {
      return { error: "Límite de intentos alcanzado.", isHardBlocked: true };
    }

    const isCorrect = data.response === currentEvaluation.correctOption;
    console.log("¿Es correcto?:", isCorrect);
    const isFinalFailure = !isCorrect && attempts.length + 1 >= 2;

    const result = await prisma.$transaction(async (tx) => {
      // REGISTRAMOS EL INTENTO
      const newAnswer = await tx.examAnswers.create({
        data: {
          questionId: data.questionId,
          userId: session.userId,
          response: data.response,
          isCorrect: isCorrect,
          isArchived: false,
        },
      });
      console.log("Nueva respuesta creada:", newAnswer.id);

      // ACTUALIZAMOS EL PROGRESO DEL VIDEO
      await tx.userVideoProgress.upsert({
        where: {
          userId_videoId: {
            userId: session.userId,
            videoId: currentEvaluation.videoId,
          },
        },
        update: { isCompleted: isCorrect },
        create: {
          userId: session.userId,
          videoId: currentEvaluation.videoId,
          isCompleted: isCorrect,
        },
      });

      return {
        success: isCorrect ? "Correcto" : "Incorrecto",
        attemptsLeft: isCorrect ? 0 : Math.max(0, 1 - attempts.length),
        isHardBlocked: isFinalFailure,
      };
    });

    console.log("Resultado final de la transacción:", result);
    return result;
  } catch (error) {
    console.error("Error DETALLADO en userEvaluations:", error);
    return { error: "Error en el servidor", isHardBlocked: false };
  }
}

export async function resetStudentAttempts(userId: string, videoId: string) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) return { error: "No autorizado" };

    const hasAccess = await validationCollaboratorCourse(videoId, session.userId);
    if (!hasAccess && session.role !== Role.superadmin) {
      return { error: "No tienes acceso a este curso" };
    }

    // 1. Archivar respuestas anteriores para no perder el historial
    await prisma.examAnswers.updateMany({
      where: {
        userId: userId,
        question: { videoId: videoId },
      },
      data: { isArchived: true },
    });

    // 2. Resetear el progreso del video para obligar a verlo de nuevo
    await prisma.userVideoProgress.updateMany({
      where: {
        userId: userId,
        videoId: videoId,
      },
      data: { isCompleted: false },
    });

    return {
      success: "Alumno liberado correctamente. Deberá ver el video nuevamente para reintentar el examen.",
    };
  } catch (error) {
    console.error(error);
    return { error: "No se pudo liberar al alumno" };
  }
}

// OBTENER HISTORIAL DE EXÁMENES DEL ALUMNO
export async function getStudentExamHistory(userId: string, courseId: string) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) return { error: "No autorizado" };

    const history = await prisma.examAnswers.findMany({
      where: {
        userId: userId,
        question: { video: { courseId: courseId } },
      },
      include: {
        question: {
          include: { video: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return history;
  } catch (error) {
    console.error(error);
    return [];
  }
}
