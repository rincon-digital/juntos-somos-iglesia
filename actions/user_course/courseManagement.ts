"use server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { userRegister } from "../../lib/types/definitions";
import { validateUser } from "@/lib/helpers/user/validationRegister";
import { getUsernameSuggestions } from "@/lib/helpers/user/usernameSuggestions";
import { getCurrentUser } from "../auth/auth";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "@/lib/utils/rateLimit";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

export async function registerCourse(data: userRegister) {
  try {
    const rateStatus = await checkRateLimit("register_course", data.dni);
    if (rateStatus.blocked) {
      return {
        error:
          rateStatus.message ||
          "Demasiados intentos fallidos. Intenta en 3 minutos.",
        blocked: true,
        remainingSeconds: rateStatus.remainingSeconds,
      };
    }

    if (data.fullName !== "EXISTING_USER") {
      const validation = validateUser(data);
      if (!validation.valid) {
        return { error: Object.values(validation.errors)[0] };
      }
    }
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      include: { _count: { select: { courseRegistration: true } } },
    });

    if (!course || !course.isActive) {
      return { error: "Este curso no se encuentra disponible actualmente." };
    }
    if (course.quotaLimit > 0 && course._count.courseRegistration >= course.quotaLimit) {
      return { error: "Lo sentimos, el cupo para este curso está lleno." };
    }
    if (course.accessCode.trim().toUpperCase() !== data.code.trim().toUpperCase()) {
      const attempt = await recordFailedAttempt("register_course", data.dni);
      if (attempt.blocked) {
        return {
          error:
            attempt.message ||
            "Has superado los 5 intentos. Bloqueado por 3 minutos.",
          blocked: true,
          remainingSeconds: attempt.remainingSeconds,
        };
      }
      return {
        error: `El código de acceso no coincide (${attempt.remainingAttempts} intento${attempt.remainingAttempts === 1 ? "" : "s"} restante${attempt.remainingAttempts === 1 ? "" : "s"}).`,
      };
    }

    // BUSCAMOS SI EL USUARIO YA EXISTE
    const existingUser = await prisma.profile.findUnique({
      where: { dni: data.dni },
      include: { user: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      let userId: string;
      let userRole: string;

      if (existingUser && existingUser.user) {
        // ESCENARIO: YA TIENE CUENTA
        const isPasswordCorrect = await bcrypt.compare(
          data.password,
          existingUser.user.password,
        );
        if (!isPasswordCorrect) {
          throw new Error("AUTH_FAILED");
        }

        const alreadyInCourse = await tx.courseRegistration.findFirst({
          where: { userId: existingUser.userId, courseId: course.id },
        });
        if (alreadyInCourse) throw new Error("ALREADY_REGISTERED");

        userId = existingUser.userId;
        userRole = existingUser.user.role;
      } else {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const cleanEmail = data.email?.trim().toLowerCase() || null;

        // BUSQUEDA INSENSIBLE A MAYÚSCULAS
        const existingUserByUsername = await tx.user.findFirst({
          where: {
            username: {
              equals: data.username.toLowerCase(),
            },
          },
        });

        // RECOMENDAMOS NOMBRES DE USUARIO
        if (existingUserByUsername) {
          const suggestions = await getUsernameSuggestions(data.username);
          throw new Error(
            JSON.stringify({ type: "USERNAME_TAKEN", suggestions }),
          );
        }

        if (cleanEmail) {
          const existingUserByEmail = await tx.user.findUnique({
            where: { email: cleanEmail },
          });
          if (existingUserByEmail) {
            throw new Error("EMAIL_TAKEN");
          }
        }

        const newUser = await tx.user.create({
          data: {
            username: data.username.toLowerCase(),
            email: cleanEmail,
            fullName: data.fullName,
            password: hashedPassword,
            profile: {
              create: {
                dni: data.dni,
                phone: data.phone,
                address: data.address,
              },
            },
          },
        });
        userId = newUser.id;
        userRole = newUser.role;
      }

      await tx.courseRegistration.create({
        data: { courseId: course.id, userId: userId },
      });

      const token = await new SignJWT({ userId, role: userRole })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(secretKey);

      (await cookies()).set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });

      revalidatePath("/admin/courses");
      revalidatePath("/dashboard-estudiante");

      return {
        success: existingUser
          ? "¡Bienvenido de nuevo! Inscripción vinculada."
          : "Registro exitoso",
        error: undefined,
      };
    });

    await clearRateLimit("register_course", data.dni);
    return result;
  } catch (error: any) {
    if (error.message === "AUTH_FAILED") {
      const attempt = await recordFailedAttempt("register_course", data.dni);
      if (attempt.blocked) {
        return {
          error:
            attempt.message ||
            "Has superado los 5 intentos. Bloqueado por 3 minutos.",
          blocked: true,
          remainingSeconds: attempt.remainingSeconds,
        };
      }
      return {
        error: `Este DNI ya existe. Ingresa la contraseña correcta de tu cuenta anterior (${attempt.remainingAttempts} intento${attempt.remainingAttempts === 1 ? "" : "s"} restante${attempt.remainingAttempts === 1 ? "" : "s"}).`,
      };
    }

    if (error.message === "EMAIL_TAKEN") {
      return {
        error: "Este correo electrónico ya está registrado en otra cuenta.",
      };
    }

    try {
      const parsedError = JSON.parse(error.message);
      if (parsedError.type === "USERNAME_TAKEN") {
        return {
          error: "El nombre de usuario ya existe.",
          suggestions: parsedError.suggestions,
        };
      }
    } catch (e) {
      // No era un JSON, seguir con las validaciones normales
    }

    if (error.message === "ALREADY_REGISTERED")
      return { error: "Ya estás inscrito en este curso." };
    return { error: "Error al procesar la inscripción." };
  }
}

export async function checkUsernameAvailability(username: string) {
  try {
    const existing = await prisma.user.findFirst({
      where: {
        username: {
          equals: username.toLowerCase(),
        },
      },
    });

    if (existing) {
      const suggestions = await getUsernameSuggestions(username);
      return { available: false, suggestions };
    }

    return { available: true };
  } catch (error) {
    return { error: "Error al verificar disponibilidad." };
  }
}

export async function verifyCourseCodeOnly(courseId: string, code: string) {
  try {
    const rateStatus = await checkRateLimit("verify_course_code", courseId);
    if (rateStatus.blocked) {
      return {
        error:
          rateStatus.message ||
          "Demasiados intentos fallidos. Intenta en 3 minutos.",
        blocked: true,
        remainingSeconds: rateStatus.remainingSeconds,
      };
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { accessCode: true, isActive: true },
    });

    if (!course || !course.isActive) {
      return { error: "Este curso no se encuentra disponible." };
    }

    if (course.accessCode.trim().toUpperCase() !== code.trim().toUpperCase()) {
      const attempt = await recordFailedAttempt("verify_course_code", courseId);
      if (attempt.blocked) {
        return {
          error:
            attempt.message ||
            "Has superado los 5 intentos. Bloqueado por 3 minutos.",
          blocked: true,
          remainingSeconds: attempt.remainingSeconds,
        };
      }
      return {
        error: `El código de acceso es incorrecto (${attempt.remainingAttempts} intento${attempt.remainingAttempts === 1 ? "" : "s"} restante${attempt.remainingAttempts === 1 ? "" : "s"}).`,
      };
    }

    await clearRateLimit("verify_course_code", courseId);
    return { success: true };
  } catch (error) {
    console.error("VERIFY CODE ERROR:", error);
    return { error: "Error al verificar el código." };
  }
}

export async function getAvailableCoursesForStudent() {
  noStore();
  try {
    const session = await getCurrentUser();
    if (!session) return { error: "No autorizado", courses: [] };

    // Obtenemos los cursos a los que YA está inscripto
    const enrolledCourses = await prisma.courseRegistration.findMany({
      where: { userId: session.id },
      select: { courseId: true }
    });

    const enrolledIds = enrolledCourses.map(e => e.courseId);

    // Obtenemos los cursos DISPONIBLES y ACTIVOS (que no esté inscripto)
    const availableCourses = await prisma.course.findMany({
      where: {
        id: { notIn: enrolledIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        deadline: true,
        _count: { select: { courseRegistration: true } },
        quotaLimit: true
      },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, courses: availableCourses };
  } catch (error) {
    return { error: "Error al obtener cursos", courses: [] };
  }
}

export async function quickEnrollCourse(courseId: string, code: string) {
  try {
    const session = await getCurrentUser();
    if (!session) return { error: "No autorizado" };

    const rateKey = `${session.id}:${courseId}`;
    const rateStatus = await checkRateLimit("quick_enroll", rateKey);
    if (rateStatus.blocked) {
      return {
        error:
          rateStatus.message ||
          "Demasiados intentos fallidos. Intenta en 3 minutos.",
        blocked: true,
        remainingSeconds: rateStatus.remainingSeconds,
      };
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { courseRegistration: true } } },
    });

    if (!course || !course.isActive) {
      return { error: "Este curso no se encuentra disponible." };
    }

    // Permitir límite 0 como infinito
    if (course.quotaLimit > 0 && course._count.courseRegistration >= course.quotaLimit) {
      return { error: "El cupo para este curso está lleno." };
    }
    
    if (course.accessCode.trim().toUpperCase() !== code.trim().toUpperCase()) {
      const attempt = await recordFailedAttempt("quick_enroll", rateKey);
      if (attempt.blocked) {
        return {
          error:
            attempt.message ||
            "Has superado los 5 intentos. Bloqueado por 3 minutos.",
          blocked: true,
          remainingSeconds: attempt.remainingSeconds,
        };
      }
      return {
        error: `El código de acceso es incorrecto (${attempt.remainingAttempts} intento${attempt.remainingAttempts === 1 ? "" : "s"} restante${attempt.remainingAttempts === 1 ? "" : "s"}).`,
      };
    }

    const alreadyInCourse = await prisma.courseRegistration.findFirst({
      where: { userId: session.id, courseId: courseId }
    });

    if (alreadyInCourse) return { error: "Ya estás inscripto en este curso." };

    await prisma.courseRegistration.create({
      data: {
        userId: session.id,
        courseId: courseId,
      }
    });

    await clearRateLimit("quick_enroll", rateKey);
    revalidatePath("/dashboard-estudiante");
    return { success: "¡Inscripción exitosa!" };
  } catch (error) {
    console.error("ERROR EN QUICK ENROLL:", error);
    return { error: "Error al inscribirse." };
  }
}
