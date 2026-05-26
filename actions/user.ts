"use server";
import { SignJWT, jwtVerify } from "jose";
import "dotenv/config";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@/lib/types/definitions";

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

//EDITAR INFORMACION DE CONTACTO
export async function updateContactInfo(data: {
  phone?: string;
  address?: string;
}) {
  try {
    const session = await validateSessionUser();
    if (!session) return { error: "No autorizado." };

    const updateData: any = {};

    // Si el usuario envía el campo, lo limpiamos. Si está vacío, guardamos null.
    if (data.phone !== undefined) {
      const cleanPhone = data.phone.trim();
      updateData.phone = cleanPhone === "" ? null : cleanPhone;
    }

    if (data.address !== undefined) {
      const cleanAddress = data.address.trim();
      updateData.address = cleanAddress === "" ? null : cleanAddress;
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    revalidatePath("/profile");
    return { success: "Información de contacto actualizada." };
  } catch (error) {
    console.error(error);
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

    // 1. Validar longitud mínima
    if (!newPassword || newPassword.length < 8) {
      return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
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
      return { error: "La contraseña actual es incorrecta." };
    }

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
