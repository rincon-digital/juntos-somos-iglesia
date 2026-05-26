"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateSessionUser } from "../user";
import { validateContent } from "@/lib/helpers/testimony/validationTestimony";
import { Role } from "@/lib/types/definitions";

// CREAR TESTIMONIO
export async function createTestimony(content: string) {
  try {
    const session = await validateSessionUser();
    if (!session) throw new Error("No autenticado");
    const userId = session.userId;

    const cleanContent = validateContent(content);

    const testimony = await prisma.testimony.create({
      data: {
        content: cleanContent,
        authorId: userId,
      },
    });

    revalidatePath("/");
    return testimony;
  } catch (error) {
    console.error("Error creating testimony:", error);
    throw error;
  }
}

// ELIMINAR TESTIMONIO (USUARIO)
export async function deleteTestimony(id: string) {
  try {
    const session = await validateSessionUser();
    if (!session) throw new Error("No autorizado");
    const userId = session.userId;

    // Buscamos el testimonio para verificar autoría
    const existing = await prisma.testimony.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existing) throw new Error("Testimonio no encontrado");

    // Verificación de seguridad: ¿Es el dueño?
    if (existing.authorId !== userId) {
      throw new Error("No tienes permiso para eliminar este testimonio");
    }

    await prisma.testimony.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    console.error("Error deleting testimony:", error);
    throw error;
  }
}

// ELIMINAR TESTIMONIO (COMO ADMIN)
export async function adminDeleteTestimony(id: string) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) throw new Error("No autorizado");

    await prisma.testimony.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error in adminDeleteTestimony:", error);
    throw error;
  }
}

// ACTUALIZAR TESTIMONIO (USUARIO)
export async function updateTestimony(id: string, content: string) {
  try {
    const session = await validateSessionUser();
    if (!session) throw new Error("No autorizado");
    const userId = session.userId;

    const cleanContent = validateContent(content);

    const existing = await prisma.testimony.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existing || existing.authorId !== userId) {
      throw new Error("No tienes permiso para editar este testimonio");
    }

    const testimony = await prisma.testimony.update({
      where: { id },
      data: { content: cleanContent },
    });

    return testimony;
  } catch (error) {
    console.error("Error updating testimony:", error);
    throw error;
  }
}

// OBTENER TESTIMONIOS
export async function getTestimonies(limit?: number) {
  try {
    const testimonies = await prisma.testimony.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            rank: true,
          },
        },
      },
    });
    return testimonies;
  } catch (error) {
    console.error("Error fetching testimonies:", error);
    return [];
  }
}

// OBTENER TESTIMONIO DEL USUARIO LOGUEADO
export async function getUserTestimony() {
  try {
    const session = await validateSessionUser();
    if (!session) throw new Error("No autorizado");
    const userId = session.userId;

    const testimonies = await prisma.testimony.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            rank: true,
          },
        },
      },
    });

    return testimonies;
  } catch (error) {
    console.error("Error al obtener los testimonios:", error);
    throw error;
  }
}
