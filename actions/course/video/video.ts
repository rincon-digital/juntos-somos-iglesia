"use server";
import {
  getYouTubeID,
  validationDataVideo,
} from "@/lib/helpers/course/validationVideo";
import prisma from "@/lib/prisma";
import type { createVideo, updateVideo } from "@/lib/types/video.definitions";
import { validateSessionUser } from "../../user";
import { Role } from "@/lib/types/definitions";
import { validationCollaboratorCourse } from "@/lib/helpers/course/validationAccessCourse";
import { revalidatePath } from "next/cache";

export async function createCourseVideo(formData: createVideo) {
  const session = await validateSessionUser(Role.admin);
  if (!session) {
    return { error: "Solo el administrador puede acceder a estas funciones." };
  }

  // VALIDAR PERMISOS EN EL CURSO
  const hasAccess = await validationCollaboratorCourse(
    formData.courseId,
    session.userId,
  );
  if (!hasAccess) {
    return { error: "No tienes permisos para añadir videos a este curso." };
  }

  const videoId = getYouTubeID(formData.videoUrl);
  if (!videoId) return { error: "URL de YouTube no válida." };

  const { valid, error } = validationDataVideo({
    title: formData.title,
    order: formData.order,
  });
  if (!valid) return { error: error };

  // Aseguramos que el orden sea un entero limpio
  const cleanOrder = Math.floor(Number(formData.order));

  try {
    // Buscamos si el orden ya existe ESTRICTAMENTE en este curso
    const existingVideo = await prisma.courseVideo.findFirst({
      where: {
        courseId: formData.courseId,
        order: cleanOrder,
      },
    });

    if (existingVideo)
      return {
        error: `El número de orden ${cleanOrder} ya existe en este curso.`,
      };

    const newVideo = await prisma.courseVideo.create({
      data: {
        title: formData.title,
        order: cleanOrder,
        videoId: videoId,
        courseId: formData.courseId,
        authorId: session.userId,
      },
    });

    revalidatePath("/admin/courses");
    return { success: "Video añadido correctamente", videoId: newVideo.id };
  } catch (err) {
    console.error("Error al crear video:", err);
    return { error: "Error interno al almacenar el video" };
  }
}
export async function updateVideo(data: updateVideo) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) return { error: "No autorizado." };

    const videoExists = await prisma.courseVideo.findUnique({
      where: { id: data.id },
      select: { id: true, authorId: true, courseId: true },
    });

    if (!videoExists) return { error: "El video no existe." };

    const { valid, error } = validationDataVideo({
      title: data.title,
      order: data.order,
    });
    if (!valid) return { error: error };

    // VALIDAR QUE EL ORDEN NO EXISTA EN EL MISMO CURSO (excluyendo el video actual)
    const orderConflict = await prisma.courseVideo.findFirst({
      where: {
        courseId: videoExists.courseId,
        order: Number(data.order),
        NOT: { id: data.id },
      },
    });

    if (orderConflict)
      return { error: `El orden ${data.order} ya existe en este curso.` };

    const hasAccess = await validationCollaboratorCourse(
      videoExists.courseId,
      session.userId,
    );
    if (!hasAccess) return { error: "No tienes permisos de edición." };

    await prisma.courseVideo.update({
      where: { id: data.id },
      data: {
        title: data.title,
        order: Number(data.order),
      },
    });

    revalidatePath("/admin/courses");
    return { success: "Se actualizó correctamente" };
  } catch (error) {
    return { error: "Error al actualizar" };
  }
}

export async function deleteVideo(id: string) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) return { error: "No autorizado." };

    const videoExists = await prisma.courseVideo.findUnique({
      where: { id },
      select: { id: true, courseId: true },
    });

    if (!videoExists) return { error: "El video no existe." };

    const hasAccess = await validationCollaboratorCourse(
      videoExists.courseId,
      session.userId,
    );
    if (!hasAccess) return { error: "No tienes permisos de edición." };

    await prisma.courseVideo.delete({ where: { id } });

    revalidatePath("/admin/courses");
    return { success: "Video eliminado correctamente" };
  } catch (error) {
    return { error: "Error al eliminar" };
  }
}

// ── Dónde quedó el alumno en el video (para "Seguir desde…") ──

export async function getVideoPosition(videoId: string): Promise<number> {
  const session = await validateSessionUser();
  if (!session?.userId || !videoId) return 0;
  const progress = await prisma.userVideoProgress.findUnique({
    where: { userId_videoId: { userId: session.userId, videoId } },
    select: { lastPosition: true },
  });
  return progress?.lastPosition ?? 0;
}

export async function saveVideoPosition(videoId: string, seconds: number) {
  const session = await validateSessionUser();
  if (!session?.userId || !videoId) return { error: "Sesión no válida" };
  const lastPosition = Math.max(0, Math.floor(Number(seconds) || 0));
  try {
    await prisma.userVideoProgress.upsert({
      where: { userId_videoId: { userId: session.userId, videoId } },
      update: { lastPosition },
      create: { userId: session.userId, videoId, lastPosition },
    });
    return { success: true };
  } catch {
    return { error: "No se pudo guardar el avance" };
  }
}

// ── Opinión del alumno al aprobar una clase ──

const RATINGS = ["like", "regular", "dislike"] as const;

export async function saveClassFeedback(videoId: string, rating: string, comment?: string) {
  const session = await validateSessionUser();
  if (!session?.userId || !videoId) return { error: "Sesión no válida" };
  if (!RATINGS.includes(rating as any)) return { error: "Opinión no válida" };
  const text = (comment || "").trim().slice(0, 500) || null;
  try {
    await prisma.classFeedback.upsert({
      where: { userId_videoId: { userId: session.userId, videoId } },
      update: { rating, comment: text },
      create: { userId: session.userId, videoId, rating, comment: text },
    });
    return { success: true };
  } catch {
    return { error: "No se pudo guardar tu opinión" };
  }
}
