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
