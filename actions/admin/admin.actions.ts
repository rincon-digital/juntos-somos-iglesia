"use server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { validateSessionUser } from "../user";
import { Role, Rank } from "@/lib/types/definitions";
import { validateAdmin } from "@/lib/helpers/user/validationRegister";
import { getUsernameSuggestions } from "@/lib/helpers/user/usernameSuggestions";

export async function createAdmin(
  username: string,
  password: string,
  fullName: string,
  role: Role,
) {
  try {
    //VALIDAR SESION
    const session = await validateSessionUser(Role.admin);

    if (!session) {
      return {
        ok: false,
        message: "No tienes permiso para realizar esta acción",
      };
    }

    //VALIDAR DATOS
    const validation = validateAdmin({ username, password, fullName, role });
    if (!validation.valid) {
      return {
        ok: false,
        message: typeof validation.errors === "object" ? JSON.stringify(validation.errors) : validation.errors,
      };
    }

    // VERIFICAR SI EL USUARIO YA EXISTE (INSENSIBLE A MAYÚSCULAS)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username.toLowerCase(),
        },
      },
    });

    if (existingUser) {
      const suggestions = await getUsernameSuggestions(username);
      return {
        ok: false,
        message: "El nombre de usuario ya existe.",
        suggestions, // Enviamos sugerencias al igual que en el registro de alumnos
      };
    }

    //CREAR ADMIN
    const hashedPassword = await hash(password, 10);
    const newAdmin = await prisma.user.create({
      data: {
        username: username.toLowerCase(), // Normalizamos a minúsculas
        fullName,
        password: hashedPassword,
        role,
        rank: Rank.miembro,
      },
    });

    return {
      ok: true,
      message: "Admin creado exitosamente",
      admin: newAdmin,
    };
  } catch (error: any) {
    console.error("Error en createAdmin:", error);
    return {
      ok: false,
      message: "Ocurrió un error inesperado al crear el administrador.",
    };
  }
}

export async function getAdminProfileData() {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true },
    });

    if (!user) return null;

    return {
      fullName: user.fullName,
      username: user.username,
      phone: user.profile?.phone || "",
      address: user.profile?.address || "",
    };
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return null;
  }
}

export async function updateAdminProfile(data: {
  fullName: string;
  username: string;
}) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) return { ok: false, message: "No autorizado." };

    const cleanUsername = data.username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      return { ok: false, message: "El nombre de usuario debe tener al menos 3 caracteres." };
    }

    if (!data.fullName.trim()) {
      return { ok: false, message: "El nombre completo es obligatorio." };
    }

    // Check if username exists and belongs to someone else
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUser && existingUser.id !== session.userId) {
      const suggestions = await getUsernameSuggestions(cleanUsername);
      return {
        ok: false,
        message: "El nombre de usuario ya está en uso.",
        suggestions,
      };
    }

    // Update User 
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        fullName: data.fullName.trim(),
        username: cleanUsername,
      },
    });

    return { ok: true, message: "Perfil actualizado con éxito." };
  } catch (error: any) {
    console.error("Error updating admin profile:", error);
    return { ok: false, message: "Error inesperado al actualizar el perfil." };
  }
}

export async function checkUsernameAvailability(username: string) {
  try {
    const session = await validateSessionUser(Role.admin);
    if (!session) return { available: false, suggestions: [] };

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) return { available: false, suggestions: [] };

    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUser && existingUser.id !== session.userId) {
      const suggestions = await getUsernameSuggestions(cleanUsername);
      return { available: false, suggestions };
    }

    return { available: true, suggestions: [] };
  } catch (error) {
    return { available: false, suggestions: [] };
  }
}

