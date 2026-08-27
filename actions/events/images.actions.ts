"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { validateSessionUser } from "@/actions/user";
import { Role } from "@/lib/types/definitions";
import {
  UploadImageInput,
  UpdateImageInput,
  ImageFilterOptions,
} from "@/lib/types/events.definitions";
import { deleteImageFromCloudinary } from "@/lib/utils/cloudinary";

// ============================================================================
// 1. SUBIDA DE IMÁGENES (PÚBLICO CON REGLA DE CURSOS)
// ============================================================================

/**
 * Sube y registra una imagen en el sistema.
 * 
 * REGLAS DE ACCESO:
 * 1. Si NO está asociada a un evento (eventId == null):
 *    - Cualquier persona (logueada o anónima) puede subirla.
 * 2. Si ESTÁ asociada a un evento sin curso (event.courseId == null):
 *    - Cualquier persona (logueada o anónima) puede subirla.
 * 3. Si el evento ESTÁ ASOCIADO A UN CURSO (event.courseId != null):
 *    - SOLO usuarios autenticados e INSCRIPTOS en ese curso (o Admins/SuperAdmins)
 *      tienen permiso para subir fotos a ese evento.
 */
export async function uploadImage(data: UploadImageInput) {
  try {
    if (!data.url || !data.publicId) {
      return { error: "La URL y el publicId de Cloudinary son requeridos." };
    }

    // 1. Obtener sesión si el usuario está autenticado (puede ser null para anónimos)
    const session = await validateSessionUser();

    let eventToAttach = null;

    // 2. Si se especificó un evento, validar sus restricciones
    if (data.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
        include: {
          course: {
            select: { id: true, name: true },
          },
        },
      });

      if (!event || !event.isActive) {
        return { error: "El evento seleccionado no existe o no está activo." };
      }

      eventToAttach = event;

      // 3. REGLA: Si el evento está vinculado a un curso
      if (event.courseId) {
        if (!session) {
          return {
            error: `Este evento pertenece al curso "${event.course?.name}". Debes iniciar sesión y estar inscripto para subir fotos a este evento.`,
          };
        }

        // Si es Admin o Superadmin, tiene permiso total
        const isAdminOrSuper =
          session.role === Role.admin || session.role === Role.superadmin;

        if (!isAdminOrSuper) {
          // Verificar si el usuario está inscripto en el curso
          const isEnrolled = await prisma.courseRegistration.findFirst({
            where: {
              userId: session.userId,
              courseId: event.courseId,
            },
          });

          if (!isEnrolled) {
            return {
              error: `Acceso restringido: Solo los alumnos inscriptos en el curso "${event.course?.name}" pueden subir imágenes a este evento.`,
            };
          }
        }
      }
    }

    // 4. Crear el registro de la imagen
    const newImage = await prisma.image.create({
      data: {
        url: data.url,
        publicId: data.publicId,
        tags: data.tags ? (data.tags as any) : [],
        isProtected: false, // Solo admin/superadmin pueden proteger
        isFavorite: false,  // Solo admin/superadmin pueden marcar favorita
        eventId: data.eventId || null,
        uploadedById: session?.userId || null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    revalidatePath("/eventos");
    revalidatePath("/galeria");
    revalidatePath("/admin/events");
    revalidatePath("/");

    return {
      success: "Imagen guardada exitosamente.",
      image: newImage,
    };
  } catch (error: any) {
    console.error("Error al subir imagen:", error);
    return {
      error: `Error al guardar la imagen: ${error instanceof Error ? error.message : "Error desconocido"}`,
    };
  }
}

// ============================================================================
// 2. CONSULTAS PÚBLICAS (ACCESO PARA TODOS CON O SIN SESIÓN)
// ============================================================================

/**
 * Obtiene el listado de imágenes públicas con filtros opcionales.
 * Accesible para cualquier visitante (con o sin sesión).
 */
export async function getImages(options?: ImageFilterOptions) {
  noStore();
  try {
    const whereCondition: any = {};

    // Filtro por evento (o imágenes sin evento si se pasa null)
    if (options?.eventId !== undefined) {
      whereCondition.eventId = options.eventId;
    }

    // Filtro por favoritos
    if (options?.isFavorite !== undefined) {
      whereCondition.isFavorite = options.isFavorite;
    }

    // Filtro por curso asociado al evento
    if (options?.courseId) {
      whereCondition.event = {
        courseId: options.courseId,
        isActive: true,
      };
    }

    const images = await prisma.image.findMany({
      where: whereCondition,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            course: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        uploadedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: [
        { isFavorite: "desc" },
        { createdAt: "desc" },
      ],
      take: options?.limit,
      skip: options?.skip,
    });

    return images;
  } catch (error) {
    console.error("Error al obtener imágenes:", error);
    return [];
  }
}

/**
 * Obtiene una imagen por su ID.
 * Accesible para cualquier visitante.
 */
export async function getImageById(id: string) {
  noStore();
  try {
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        event: true,
        uploadedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    return image;
  } catch (error) {
    console.error(`Error al obtener imagen con ID ${id}:`, error);
    return null;
  }
}

// ============================================================================
// 3. ACCIONES EXCLUSIVAS DE ADMIN Y SUPERADMIN
// ============================================================================

/**
 * Marca o desmarca una imagen como FAVORITA.
 * EXCLUSIVO: Solo 'admin' y 'superadmin'.
 */
export async function toggleFavoriteImage(imageId: string, forceFavorite?: boolean) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado. Se requieren permisos de administrador." };
    }

    const currentImage = await prisma.image.findUnique({
      where: { id: imageId },
      select: { isFavorite: true },
    });

    if (!currentImage) {
      return { error: "Imagen no encontrada." };
    }

    const newFavoriteState =
      forceFavorite !== undefined ? forceFavorite : !currentImage.isFavorite;

    const updated = await prisma.image.update({
      where: { id: imageId },
      data: {
        isFavorite: newFavoriteState,
      },
    });

    revalidatePath("/eventos");
    revalidatePath("/galeria");
    revalidatePath("/admin/events");
    revalidatePath("/");

    return {
      success: newFavoriteState
        ? "Imagen marcada como favorita."
        : "Imagen quitada de favoritos.",
      isFavorite: updated.isFavorite,
    };
  } catch (error) {
    console.error("Error al cambiar estado favorito:", error);
    return { error: "Error al actualizar la imagen." };
  }
}

/**
 * Marca o desmarca una imagen como PROTEGIDA.
 * EXCLUSIVO: Solo 'admin' y 'superadmin'.
 */
export async function toggleProtectedImage(imageId: string, forceProtected?: boolean) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado. Se requieren permisos de administrador." };
    }

    const currentImage = await prisma.image.findUnique({
      where: { id: imageId },
      select: { isProtected: true },
    });

    if (!currentImage) {
      return { error: "Imagen no encontrada." };
    }

    const newProtectedState =
      forceProtected !== undefined ? forceProtected : !currentImage.isProtected;

    const updated = await prisma.image.update({
      where: { id: imageId },
      data: {
        isProtected: newProtectedState,
      },
    });

    revalidatePath("/admin/events");
    return {
      success: newProtectedState
        ? "Imagen marcada como protegida."
        : "Imagen desprotegida.",
      isProtected: updated.isProtected,
    };
  } catch (error) {
    console.error("Error al cambiar protección:", error);
    return { error: "Error al actualizar la protección de la imagen." };
  }
}

/**
 * Edita los datos de una imagen (tags, evento asociado, favorita, protegida).
 * EXCLUSIVO: Solo 'admin' y 'superadmin'.
 */
export async function updateImage(imageId: string, data: UpdateImageInput) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado. Se requieren permisos de administrador." };
    }

    const existingImage = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!existingImage) {
      return { error: "Imagen no encontrada." };
    }

    // Si se reasigna a un evento, validar que exista
    if (data.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
      });
      if (!event) {
        return { error: "El evento especificado no existe." };
      }
    }

    const updatePayload: any = {};
    if (data.tags !== undefined) updatePayload.tags = data.tags as any;
    if (data.isProtected !== undefined) updatePayload.isProtected = data.isProtected;
    if (data.isFavorite !== undefined) updatePayload.isFavorite = data.isFavorite;
    if (data.eventId !== undefined) updatePayload.eventId = data.eventId || null;

    const updated = await prisma.image.update({
      where: { id: imageId },
      data: updatePayload,
      include: {
        event: true,
      },
    });

    revalidatePath("/eventos");
    revalidatePath("/galeria");
    revalidatePath("/admin/events");
    revalidatePath("/");

    return {
      success: "Imagen actualizada exitosamente.",
      image: updated,
    };
  } catch (error: any) {
    console.error("Error al editar imagen:", error);
    return {
      error: `Error al actualizar imagen: ${error instanceof Error ? error.message : "Error desconocido"}`,
    };
  }
}

/**
 * Elimina una imagen físicamente de Cloudinary y de la base de datos.
 * EXCLUSIVO: Solo 'admin' y 'superadmin'.
 */
export async function deleteImage(imageId: string) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado. Se requieren permisos de administrador." };
    }

    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return { error: "La imagen no existe." };
    }

    // 1. Eliminar de Cloudinary
    if (image.publicId) {
      await deleteImageFromCloudinary(image.publicId);
    }

    // 2. Eliminar de la base de datos
    await prisma.image.delete({
      where: { id: imageId },
    });

    revalidatePath("/eventos");
    revalidatePath("/galeria");
    revalidatePath("/admin/events");
    revalidatePath("/");

    return { success: "Imagen eliminada con éxito de Cloudinary y del sistema." };
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    return { error: "Error al eliminar la imagen." };
  }
}

/**
 * Obtiene el listado completo de imágenes para el panel de administración con estadísticas.
 * EXCLUSIVO: Solo 'admin' y 'superadmin'.
 */
export async function getAdminImages(options?: ImageFilterOptions) {
  noStore();
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "No autorizado", images: [] };
    }

    const whereCondition: any = {};
    if (options?.eventId !== undefined) whereCondition.eventId = options.eventId;
    if (options?.isFavorite !== undefined) whereCondition.isFavorite = options.isFavorite;

    const images = await prisma.image.findMany({
      where: whereCondition,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            course: { select: { id: true, name: true } },
          },
        },
        uploadedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      skip: options?.skip,
    });

    const [totalImages, totalFavorites, totalProtected] = await Promise.all([
      prisma.image.count(),
      prisma.image.count({ where: { isFavorite: true } }),
      prisma.image.count({ where: { isProtected: true } }),
    ]);

    return {
      success: true,
      images,
      stats: {
        totalImages,
        totalFavorites,
        totalProtected,
      },
    };
  } catch (error) {
    console.error("Error al obtener imágenes para admin:", error);
    return { error: "Error al cargar las imágenes.", images: [] };
  }
}
