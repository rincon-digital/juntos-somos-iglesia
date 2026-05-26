"use server";
import prisma from "@/lib/prisma";
import { EvaluationValidation } from "@/lib/helpers/course/validationEvaluation";
import { createEvaluation } from "@/lib/types/evaluations.video.definitios";

import { validateSessionUser } from "@/actions/user";
import { Role } from "@/lib/types/definitions";
import { validationCollaboratorCourse } from "@/lib/helpers/course/validationAccessCourse";

export async function createEvaluationVideo(data: createEvaluation) {
  try {
    // VALIDAR SESION
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado." };
    }

    const validation = EvaluationValidation(data);
    if (validation) {
      return validation;
    }
    // VALIDAR ACCESO (Obtenemos el courseId del video primero)
    const video = await prisma.courseVideo.findUnique({
      where: { id: data.videoId },
      select: { courseId: true }
    });

    if (!video) return { error: "Video no encontrado." };

    const hasAccess = await validationCollaboratorCourse(
      video.courseId,
      session.userId,
    );
    if (!hasAccess) {
      return { error: "No tienes permisos para gestionar este curso." };
    }
    await prisma.videoReview.create({
      data: {
        question: data.question.trim(),
        optionA: data.optionA.trim(),
        optionB: data.optionB.trim(),
        optionC: data.optionC.trim(),
        correctOption: data.correctOption,
        videoId: data.videoId,
      },
    });

    return { success: "Evaluación creada exitosamente." };
  } catch (error) {
    console.log(error);
    return { error: "Error al crear la evaluación." };
  }
}

export async function getEvaluationForVideo(videoId: string) {
  try {
    const evaluation = await prisma.videoReview.findMany({
      where: {
        videoId: videoId,
      },
    });
    return evaluation;
  } catch (error) {
    console.log(error);
    return { error: "Error al obtener las evaluaciones." };
  }
}

export async function updateEvaluationVideo(
  id: string,
  data: createEvaluation,
) {
  try {
    // VALIDAR SESION
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado." };
    }

    // VALIDAR ACCESO (Obtenemos el courseId del video primero)
    const video = await prisma.courseVideo.findUnique({
      where: { id: data.videoId },
      select: { courseId: true }
    });

    if (!video) return { error: "Video no encontrado." };

    const hasAccess = await validationCollaboratorCourse(
      video.courseId,
      session.userId,
    );
    if (!hasAccess) {
      return { error: "No tienes permisos para gestionar este curso." };
    }

    await prisma.videoReview.update({
      where: { id },
      data: {
        question: data.question.trim(),
        optionA: data.optionA.trim(),
        optionB: data.optionB.trim(),
        optionC: data.optionC.trim(),
        correctOption: data.correctOption,
      },
    });

    return { success: "Evaluación actualizada correctamente." };
  } catch (error) {
    return { error: "Error al actualizar la evaluación." };
  }
}
