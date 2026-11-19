"use server";
import prisma from "@/lib/prisma";
import { validateSessionUser } from "@/actions/user";
import { Role } from "@/lib/types/definitions";

// Por clase: cuántos alumnos la aprobaron y cuántos quedaron trabados
// (trabado = 2 intentos activos fallidos en una pregunta, la misma regla que bloquea al alumno)
export async function getVideoErrorStats(courseId: string) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session || !courseId) return [];

    const [videos, enrolled] = await Promise.all([
      prisma.courseVideo.findMany({
        where: { courseId },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          videoProgress: { where: { isCompleted: true }, select: { userId: true } },
          videoReview: {
            select: {
              examAnswers: {
                where: { isArchived: false },
                select: { userId: true, isCorrect: true },
              },
            },
          },
        },
      }),
      prisma.courseRegistration.count({ where: { courseId } }),
    ]);

    return videos.map((video) => {
      const approved = new Set(video.videoProgress.map((p) => p.userId));
      const stuck = new Set<string>();

      for (const review of video.videoReview) {
        const byUser = new Map<string, { tries: number; correct: boolean }>();
        for (const a of review.examAnswers) {
          const u = byUser.get(a.userId) || { tries: 0, correct: false };
          u.tries++;
          u.correct ||= a.isCorrect;
          byUser.set(a.userId, u);
        }
        byUser.forEach((u, userId) => {
          if (u.tries >= 2 && !u.correct && !approved.has(userId)) stuck.add(userId);
        });
      }

      return {
        videoId: video.id,
        clase: `Clase ${video.order}`,
        titulo: video.title,
        aprobados: approved.size,
        trabados: stuck.size,
        inscriptos: enrolled,
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}
