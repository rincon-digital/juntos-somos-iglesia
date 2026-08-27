"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { validateSessionUser } from "@/actions/user";
import { Role } from "@/lib/types/definitions";
import {
  CreateEventInput,
  UpdateEventInput,
  EventFilterOptions,
} from "@/lib/types/events.definitions";
import {
  validateCreateEvent,
  validateUpdateEvent,
} from "@/lib/helpers/events/validationEvent";

// ============================================================================
// 1. FUNCIONES PÚBLICAS (ACCESO PARA TODOS CON O SIN SESIÓN)
// ============================================================================

/**
 * Obtiene todos los eventos activos (baja lógica respetada: isActive = true).
 * Accesible públicamente por cualquier visitante (con o sin sesión).
 */
export async function getEvents(options?: {
  courseId?: string;
  limit?: number;
}) {
  noStore();
  try {
    const whereCondition: any = {
      isActive: true,
    };

    if (options?.courseId) {
      whereCondition.courseId = options.courseId;
    }

    const events = await prisma.event.findMany({
      where: whereCondition,
      include: {
        images: {
          select: {
            id: true,
            url: true,
            publicId: true,
            tags: true,
            isProtected: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
      take: options?.limit,
    });

    return events;
  } catch (error) {
    console.error("Error al obtener eventos públicos:", error);
    return [];
  }
}

/**
 * Obtiene el detalle de un evento público por su ID.
 * Accesible públicamente por cualquier visitante (con o sin sesión).
 */
export async function getEventById(id: string) {
  noStore();
  try {
    const event = await prisma.event.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        images: true,
        course: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return event;
  } catch (error) {
    console.error(`Error al obtener evento con ID ${id}:`, error);
    return null;
  }
}

// ============================================================================
// 2. FUNCIONES ADMINISTRATIVAS (PERMITIDAS PARA ADMIN Y SUPERADMIN)
// ============================================================================

/**
 * Crea un nuevo evento.
 * Permitido únicamente para roles 'admin' y 'superadmin'.
 * Soporta vinculación opcional con un curso y múltiples imágenes Cloudinary.
 */
export async function createEvent(data: CreateEventInput) {
  try {
    // 1. Validación de sesión con jerarquía (admin y superadmin)
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado. Se requieren permisos de administrador." };
    }

    // 2. Validación de datos de entrada
    const { valid, error } = validateCreateEvent(data);
    if (!valid) {
      return { error };
    }

    // 3. Si se especificó un curso, verificar que exista
    if (data.courseId) {
      const courseExists = await prisma.course.findUnique({
        where: { id: data.courseId },
      });
      if (!courseExists) {
        return { error: "El curso seleccionado no existe." };
      }
    }

    // 4. Parsear fecha
    const eventDate = data.date ? new Date(data.date) : new Date();

    // 5. Creación atómica del evento y sus imágenes asociadas
    const newEvent = await prisma.event.create({
      data: {
        title: data.title.trim(),
        description: data.description ? data.description.trim() : null,
        date: eventDate,
        courseId: data.courseId || null,
        isActive: true,
        images: data.images && data.images.length > 0
          ? {
              create: data.images.map((img) => ({
                url: img.url,
                publicId: img.publicId,
                tags: img.tags ? (img.tags as any) : [],
                isProtected: img.isProtected ?? false,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/eventos");
    revalidatePath("/");

    return {
      success: "Evento creado exitosamente.",
      event: newEvent,
    };
  } catch (error: any) {
    console.error("Error al crear evento:", error);
    return {
      error: `Error al guardar el evento: ${error instanceof Error ? error.message : "Error desconocido"}`,
    };
  }
}

/**
 * Edita un evento existente.
 * Permitido únicamente para roles 'admin' y 'superadmin'.
 */
export async function updateEvent(eventId: string, data: UpdateEventInput) {
  try {
    // 1. Validación de permisos
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado. Se requieren permisos de administrador." };
    }

    // 2. Verificar existencia del evento
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!existingEvent) {
      return { error: "El evento no existe." };
    }

    // 3. Validar datos
    const { valid, error } = validateUpdateEvent(data);
    if (!valid) {
      return { error };
    }

    // 4. Si se modifica o añade curso, verificar existencia
    if (data.courseId) {
      const courseExists = await prisma.course.findUnique({
        where: { id: data.courseId },
      });
      if (!courseExists) {
        return { error: "El curso seleccionado no existe." };
      }
    }

    // 5. Preparar objeto de actualización
    const updatePayload: any = {};

    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.description !== undefined) updatePayload.description = data.description ? data.description.trim() : null;
    if (data.date !== undefined) updatePayload.date = new Date(data.date);
    if (data.courseId !== undefined) updatePayload.courseId = data.courseId || null;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    // Si se envían nuevas imágenes para agregar
    if (data.images && data.images.length > 0) {
      updatePayload.images = {
        create: data.images.map((img) => ({
          url: img.url,
          publicId: img.publicId,
          tags: img.tags ? (img.tags as any) : [],
          isProtected: img.isProtected ?? false,
        })),
      };
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updatePayload,
      include: {
        images: true,
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/eventos");
    revalidatePath("/");

    return {
      success: "Evento actualizado correctamente.",
      event: updatedEvent,
    };
  } catch (error: any) {
    console.error("Error al actualizar evento:", error);
    return {
      error: `Error al actualizar el evento: ${error instanceof Error ? error.message : "Error desconocido"}`,
    };
  }
}

/**
 * Eliminación de evento con BAJA LÓGICA (isActive = false).
 * Permitido únicamente para roles 'admin' y 'superadmin'.
 */
export async function deleteEvent(eventId: string) {
  try {
    // 1. Validación de permisos
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado. Se requieren permisos de administrador." };
    }

    // 2. Verificar existencia
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { error: "Evento no encontrado." };
    }

    // 3. Ejecutar baja lógica
    await prisma.event.update({
      where: { id: eventId },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/eventos");
    revalidatePath("/");

    return { success: "Evento dado de baja correctamente (baja lógica)." };
  } catch (error: any) {
    console.error("Error al dar de baja el evento:", error);
    return { error: "Error al procesar la baja del evento." };
  }
}

/**
 * Restaura un evento que fue dado de baja lógica (isActive = true).
 * Permitido únicamente para roles 'admin' y 'superadmin'.
 */
export async function restoreEvent(eventId: string) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado. Se requieren permisos de administrador." };
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { error: "Evento no encontrado." };
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        isActive: true,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/eventos");
    revalidatePath("/");

    return { success: "Evento restaurado correctamente." };
  } catch (error: any) {
    console.error("Error al restaurar el evento:", error);
    return { error: "Error al restaurar el evento." };
  }
}

/**
 * Obtiene el listado de eventos para el panel de administración.
 * Permite listar activos, inactivos (archivados) o ambos.
 * Permitido únicamente para roles 'admin' y 'superadmin'.
 */
export async function getAdminEvents(options?: EventFilterOptions) {
  noStore();
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "No autorizado", events: [] };
    }

    const whereCondition: any = {};

    if (!options?.includeInactive) {
      whereCondition.isActive = true;
    }

    if (options?.courseId) {
      whereCondition.courseId = options.courseId;
    }

    const events = await prisma.event.findMany({
      where: whereCondition,
      include: {
        images: true,
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: options?.limit,
      skip: options?.skip,
    });

    const [totalActive, totalInactive] = await Promise.all([
      prisma.event.count({ where: { isActive: true } }),
      prisma.event.count({ where: { isActive: false } }),
    ]);

    return {
      success: true,
      events,
      stats: {
        totalActive,
        totalInactive,
        total: totalActive + totalInactive,
      },
    };
  } catch (error) {
    console.error("Error al obtener eventos administrativos:", error);
    return { error: "Error al cargar los eventos.", events: [] };
  }
}
