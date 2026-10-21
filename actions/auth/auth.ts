"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { unstable_noStore as noStore } from "next/cache";
import "dotenv/config";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "@/lib/utils/rateLimit";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function login(identifier: string, password: string) {
  const cleanIdentifier = identifier?.trim().toLowerCase() || "";

  try {
    // 1. Verificar si la petición está bloqueada por intentos fallidos
    const rateStatus = await checkRateLimit("login", cleanIdentifier);
    if (rateStatus.blocked) {
      return {
        error: rateStatus.message || "Demasiados intentos fallidos. Intenta en 3 minutos.",
        blocked: true,
        remainingSeconds: rateStatus.remainingSeconds,
        remainingAttempts: 0,
      };
    }

    if (!cleanIdentifier || !password) {
      return { error: "Debes ingresar tu usuario/email y contraseña." };
    }

    // 2. Buscar por nombre de usuario o por email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanIdentifier }, { email: cleanIdentifier }],
      },
    });

    if (!user) {
      const attempt = await recordFailedAttempt("login", cleanIdentifier);
      if (attempt.blocked) {
        return {
          error: attempt.message || "Has superado los 5 intentos. Bloqueado por 3 minutos.",
          blocked: true,
          remainingSeconds: attempt.remainingSeconds,
          remainingAttempts: 0,
        };
      }
      return {
        error: `El usuario o email es incorrecto (${attempt.remainingAttempts} intento${attempt.remainingAttempts === 1 ? "" : "s"} restante${attempt.remainingAttempts === 1 ? "" : "s"})`,
        blocked: false,
        remainingAttempts: attempt.remainingAttempts,
      };
    }

    if (!(await bcrypt.compare(password, user.password))) {
      const attempt = await recordFailedAttempt("login", cleanIdentifier);
      if (attempt.blocked) {
        return {
          error: attempt.message || "Has superado los 5 intentos. Bloqueado por 3 minutos.",
          blocked: true,
          remainingSeconds: attempt.remainingSeconds,
          remainingAttempts: 0,
        };
      }
      return {
        error: `La contraseña es incorrecta (${attempt.remainingAttempts} intento${attempt.remainingAttempts === 1 ? "" : "s"} restante${attempt.remainingAttempts === 1 ? "" : "s"})`,
        blocked: false,
        remainingAttempts: attempt.remainingAttempts,
      };
    }

    // 3. Limpiar intentos fallidos al iniciar sesión con éxito
    await clearRateLimit("login", cleanIdentifier);

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
        email: true,
        fullName: true,
        profile: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

// OBTENER ESTUDIANTE LOGUEADO CON SUS CURSOS ACTIVOS Y VIDEOS
export async function getCurrentStudent() {
  noStore();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) return null;

    // 1. Verificar el JWT del alumno
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.userId as string;

    // 2. Buscar en la DB incluyendo sus inscripciones a cursos ACTIVOS y los videos de esos cursos
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        role: true,
        rank: true,
        username: true,
        email: true,
        profile: {
          select: {
            dni: true,
            phone: true,
            address: true,
          },
        },
        // Traemos solo los cursos activos en los que está inscripto y sus videos
        courseRegistration: {
          where: {
            course: {
              isActive: true,
            },
          },
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
