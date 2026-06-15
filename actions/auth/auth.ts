"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { unstable_noStore as noStore } from "next/cache";
import "dotenv/config";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function login(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      console.log("El nombre de usuario es incorrecto");
      return { error: "El nombre de usuario es incorrecto" };
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return { error: "La contraseña es incorrecta" };
    }

    // --- Generar TOKEN---
    const token = await new SignJWT({
      userId: user.id,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(SECRET);

    // --- Guardar en JWT en la Cookie ---
    (await cookies()).set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return { success: true, role: user.role };
  } catch (error) {
    console.error("Error detallado en login:", error);
    return { error: "Error en el servidor" };
  }
}

// FUNCION PARA CERRAR SESION
export async function logout() {
  (await cookies()).delete("session_token");
}

// OBTENER USUARIO LOGUEADO
export async function getCurrentUser() {
  noStore();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) return null;

    // 1. Verificar el JWT
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.userId as string;

    // 2. Buscar en la DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        username: true,
        fullName: true,
        profile: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

// OBTENER ESTUDIANTE LOGUEADO CON SUS CURSOS Y VIDEOS
export async function getCurrentStudent() {
  noStore();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) return null;

    // 1. Verificar el JWT del alumno
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.userId as string;

    // 2. Buscar en la DB incluyendo sus inscripciones y los videos de esos cursos
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        role: true,
        rank: true,
        // 👇 ¡AQUÍ AGREGAMOS LOS CAMPOS FALTANTES! 👇
        username: true,
        profile: {
          select: {
            dni: true,
            phone: true,
            address: true,
          },
        },
        // Traemos los cursos en los que está inscripto y sus videos
        courseRegistration: {
          include: {
            course: {
              include: {
                video: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    return student;
  } catch (error) {
    console.error("Error al obtener estudiante:", error);
    return null;
  }
}
