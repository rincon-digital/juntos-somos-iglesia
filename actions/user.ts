"use server";
import { SignJWT, jwtVerify } from "jose";
import "dotenv/config";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@/lib/types/definitions";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "@/lib/utils/rateLimit";

// CLAVE DEL TOKEN
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

export async function validateSessionUser(requiredRole?: Role) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) return null;

  try {
    // 1. Verificamos el token
    const { payload } = await jwtVerify(token, secretKey);

    const userId = payload.userId as string;
    const userRole = payload.role as Role;

    // 2. Lógica de Jerarquía de Roles
    if (requiredRole) {
      // Si el rol del usuario es SUPERADMIN, permitimos el paso siempre.
      // Si no es superadmin, entonces verificamos si coincide con el rol requerido.
      const isSuperAdmin = userRole === Role.superadmin;
      const hasRequiredRole = userRole === requiredRole;

      if (!isSuperAdmin && !hasRequiredRole) {
        console.error(
          `Acceso denegado: Se requiere ${requiredRole}, pero el usuario tiene rango ${userRole}`,
        );
        return null;
      }
    }

    return { userId, role: userRole };
  } catch (e) {
    return null;
  }
}

//EDITAR INFORMACION DE CONTACTO (EMAIL, TELEFONO, DIRECCION)
export async function updateContactInfo(data: {
  email?: string;
  phone?: string;
  address?: string;
}) {
  try {
    const session = await validateSessionUser();
    if (!session) return { error: "No autorizado." };

    const userUpdateData: { email?: string | null } = {};
    const profileUpdateData: { phone?: string; address?: string } = {};

    if (data.email !== undefined) {
      const cleanEmail = data.email.trim().toLowerCase();
      if (
        cleanEmail !== "" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
      ) {
        return { error: "El formato del correo electrónico no es válido." };
      }
      userUpdateData.email = cleanEmail === "" ? null : cleanEmail;
    }

    if (data.phone !== undefined) {
      profileUpdateData.phone = data.phone.trim();
    }

    if (data.address !== undefined) {
      profileUpdateData.address = data.address.trim();
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...userUpdateData,
        ...(Object.keys(profileUpdateData).length > 0
          ? {
              profile: {
                update: profileUpdateData,
              },
            }
          : {}),
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard-estudiante");
    return { success: "Información de contacto actualizada." };
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return { error: "Este correo electrónico ya está en uso." };
    }
    return { error: "Error al actualizar el contacto." };
  }
}

// EDITAR NOMBRE DE USUARIO
export async function updateUsername(newUsername: string) {
  try {
    const session = await validateSessionUser();
    if (!session) return { error: "No autorizado." };

    // 1. Validar que no venga vacío
    const cleanUsername = newUsername?.trim().toLowerCase();
    if (!cleanUsername) {
      return { error: "El nombre de usuario es obligatorio." };
    }

    // 2. Validar longitud mínima opcional (ej. 3 caracteres)
    if (cleanUsername.length < 3) {
      return {
        error: "El nombre de usuario debe tener al menos 3 caracteres.",
      };
    }

    // 3. Intentar actualizar
    await prisma.user.update({
      where: { id: session.userId },
      data: { username: cleanUsername },
    });

    revalidatePath("/profile");
    return { success: "Nombre de usuario actualizado correctamente." };
  } catch (error: any) {
    // Manejo específico para el error @unique de Prisma
    if (error.code === "P2002") {
      return { error: "Este nombre de usuario ya está en uso. Elige otro." };
    }
    return { error: "Error al cambiar el nombre de usuario." };
  }
}

// EDITAR CONTRASEÑA
export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  try {
    const session = await validateSessionUser();
    if (!session) return { error: "Sesión expirada." };

    // Verificar bloqueo por intentos fallidos
    const rateStatus = await checkRateLimit("change_password", session.userId);
    if (rateStatus.blocked) {
      return {
        error:
          rateStatus.message ||
          "Demasiados intentos fallidos. Intenta en 3 minutos.",
        blocked: true,
        remainingSeconds: rateStatus.remainingSeconds,
      };
    }

    // 1. Validar longitud mínima y composición
    if (!newPassword || newPassword.length < 8) {
      return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return { error: "La contraseña debe contener al menos una letra mayúscula y un número." };
    }

    // 2. Buscar usuario para obtener el hash actual
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { password: true },
    });

    if (!user) return { error: "Usuario no encontrado." };

    // 3. Verificar si la contraseña actual es correcta
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const attempt = await recordFailedAttempt("change_password", session.userId);
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
        error: `La contraseña actual es incorrecta (${attempt.remainingAttempts} intento${attempt.remainingAttempts === 1 ? "" : "s"} restante${attempt.remainingAttempts === 1 ? "" : "s"}).`,
      };
    }

    await clearRateLimit("change_password", session.userId);

    // 4. Encriptar la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 5. Guardar en la base de datos
    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedNewPassword },
    });

    return { success: "Contraseña actualizada con éxito." };
  } catch (error) {
    console.error(error);
    return { error: "Error al cambiar la contraseña." };
  }
}
