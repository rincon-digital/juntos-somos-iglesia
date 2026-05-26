"use server";
import prisma from "@/lib/prisma";

// ESTADISTICAS DE EVALUACIONES ERRONEAS
export async function getVideoErrorStats(courseId: string) {
  try {
    const videos = await prisma.courseVideo.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        videoReview: {
          include: {
            examAnswers: true, // Traemos todas las respuestas de los alumnos
          },
        },
      },
    });

    const errorData = videos.map((video) => {
      let totalAnswers = 0;
      let incorrectAnswers = 0;

      video.videoReview.forEach((review) => {
        review.examAnswers.forEach((answer) => {
          totalAnswers++;
          if (answer.response !== review.correctOption) {
            incorrectAnswers++;
          }
        });
      });

      return {
        clase: `Clase ${video.order}`,
        titulo: video.title,
        erróneas: incorrectAnswers,
        totales: totalAnswers,
        tasaError:
          totalAnswers > 0
            ? Math.round((incorrectAnswers / totalAnswers) * 100)
            : 0,
      };
    });

    return errorData;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// ESTADISTICAS DE DISTRIBUCION DE ALUMNOS
export async function getStudentDistribution(courseId: string) {
  try {
    const totalVideos = await prisma.courseVideo.count({ where: { courseId } });

    const students = await prisma.courseRegistration.findMany({
      where: { courseId },
      include: {
        user: {
          include: {
            _count: {
              select: {
                videoProgress: {
                  where: { isCompleted: true, video: { courseId } },
                },
              },
            },
          },
        },
      },
    });

    // 3. Inicializar rangos
    const ranges = {
      "0-20%": 0,
      "21-40%": 0,
      "41-60%": 0,
      "61-80%": 0,
      "81-100%": 0,
    };

    students.forEach((reg) => {
      const completed = reg.user._count.videoProgress;
      const progress = totalVideos > 0 ? (completed / totalVideos) * 100 : 0;

      if (progress <= 20) ranges["0-20%"]++;
      else if (progress <= 40) ranges["21-40%"]++;
      else if (progress <= 60) ranges["41-60%"]++;
      else if (progress <= 80) ranges["61-80%"]++;
      else ranges["81-100%"]++;
    });

    // Formatea para el gráfico
    return Object.entries(ranges).map(([name, value]) => ({
      rango: name,
      alumnos: value,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}
