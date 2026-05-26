"use server";

import prisma from "@/lib/prisma";
import { validationDataArticle } from "@/lib/helpers/article/validationArticle";
import { uploadToImgBB } from "@/lib/utils/uploadImage";
import { revalidatePath } from "next/cache";
import { validateSessionUser } from "../user";
import { Role } from "@/lib/types/definitions";
import { getCurrentUser } from "@/actions/auth/auth";
import { generateSlug } from "@/lib/utils/slug";
// CREAR ARTICULO

export async function createArticle(formData: FormData) {
  // 1. VALIDACION DE USUARIO
  const session = await validateSessionUser(Role.admin);
  if (!session) {
    return { error: "Acceso no autorizado." };
  }

  // 2. Obtener datos del FormData
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const imageFile = formData.get("image") as File | null;

  console.log("Datos recibidos en createArticle:", { title, content: content.substring(0, 20) + "..." });
  console.log("Archivo de imagen recibido:", imageFile ? { name: imageFile.name, size: imageFile.size, type: imageFile.type } : "Sin imagen");

  // 3. Validaciones de datos de texto
  const { valid, error } = validationDataArticle({ title, content });
  if (!valid) return { error };

  // 2. Obtener usuario logueado
  const user = await getCurrentUser();
  if (!user) return { error: "No se pudo identificar al autor." };

  try {
    let imageUrl: string | null = null;

    // 4. Lógica de imagen
    if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
      try {
        const uploadedUrl = await uploadToImgBB(imageFile);

        if (!uploadedUrl) {
          return { error: "Error al subir la imagen a ImgBB. Revisa los logs del servidor." };
        }

        imageUrl = uploadedUrl;
      } catch (uploadErr) {
        console.error("Error detallado en uploadToImgBB:", uploadErr);
        return { error: "Fallo la conexión con el servicio de imágenes." };
      }
    }

    // 5. Crear articulo
    await prisma.article.create({
      data: {
        title,
        slug: generateSlug(title),
        content,
        imageUrl: imageUrl,
        authorId: user.id,
      },
    });

    return { success: "Artículo publicado correctamente" };
  } catch (err) {
    console.error("Error detallado al crear artículo:", err);
    return { error: `Error al guardar en DB: ${err instanceof Error ? err.message : 'Error desconocido'}` };
  }
}

//OBTENER ARTICULOS
// @/actions/articles/articles.ts
export async function getArticles(limit?: number) {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        author: { select: { fullName: true } },
      },
    });
    return articles;
  } catch (err) {
    console.error(err);
    return [];
  }
}

//OBTENER ARTICULO POR ID
export async function getArticleById(id: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
    });
    return article;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// OBTENER ARTICULO POR SLUG
export async function getArticleBySlug(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: { select: { fullName: true } },
      },
    });
    return article;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// EDITAR ARTICULO (Solo dueño o Admin)
export async function updateArticle(
  articleId: string,
  formData: { title: string; content: string },
) {
  try {
    // 1. VALIDACION DE USUARIO
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Solo el administrador puede modificar ." };
    }

    // 1. Buscar el artículo para verificar propiedad
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: { authorId: true },
    });

    if (!existingArticle) return { error: "El artículo no existe." };

    // 2. VALIDACIÓN DE IDENTIDAD
    const isOwner = existingArticle.authorId === session.userId;

    if (!isOwner)
      return { error: "Solo el dueño del artículo puede modificarlo." };

    // 3. Obtener y validar datos del formData
    const title = formData.title;
    const content = formData.content;

    const { valid, error } = validationDataArticle({ title, content });
    if (!valid) return { error };

    // 5. Actualizar
    await prisma.article.update({
      where: { id: articleId },
      data: { title, content },
    });

    revalidatePath("/articles");
    return { success: "Artículo actualizado correctamente" };
  } catch (err) {
    console.error(err);
    return { error: "Se produjo un error al actualizar el artículo" };
  }
}

// ELIMINAR ARTICULO
export async function deleteArticle(id: string) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Acceso no autorizado." };
    }
    // 1. Buscar el artículo
    const article = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!article) return { error: "Artículo no encontrado." };

    // 2. VALIDACIÓN: ¿Es el dueño O es Admin?
    const isOwner = article.authorId === session.userId;
    if (!isOwner) {
      return { error: "Solo el dueño del articulo puede eliminarlo." };
    }

    // 3. Eliminar
    await prisma.article.delete({
      where: { id },
    });

    revalidatePath("/articles");
    return { success: "Artículo eliminado con éxito" };
  } catch (err) {
    console.error(err);
    return { error: "Error al intentar eliminar el artículo." };
  }
}
