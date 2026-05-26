"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateSessionUser } from "../user";
import { Role } from "@/lib/types/definitions";
import { RankType } from "@/lib/types/user.type";
import { isValidRank } from "@/lib/helpers/user/validationUser";
// ACTUALIZAR RANGO POR USUARIO
export async function updateUserRank(userId: string, newRank: string) {
  try {
    // 1. Validar que quien ejecuta la acción es Administrador
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Solo el administrador puede modificar el rango." };
    }

    // 2. Validar que el nuevo rango sea válido (Type Guard)
    const validRanks = isValidRank(newRank);

    if (!validRanks) {
      return { error: "Los rangos disponibles son: concurre o miembro." };
    }

    // 2.1. Validar el usuario a modificar existe
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true },
    });

    if (!userToUpdate) {
      return { error: "El usuario que intentas modificar no existe." };
    }

    // 4. Actualizar el rango en la base de datos
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { rank: newRank as RankType },
    });

    // 5. Revalidar la ruta para que los cambios se vean reflejados (ej. en la lista de usuarios)
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return {
      success: `Rango de ${updatedUser.fullName} actualizado a ${newRank}.`,
    };
  } catch (error) {
    console.error("Error updating user rank:", error);
    return { error: "Ocurrió un error inesperado al actualizar el rango." };
  }
}

//ACTUALIZACION DE RANGO +1 USUARIO
export async function updateMultipleUsersRank(
  userIds: string[],
  newRank: string,
) {
  try {
    // 1. Validar Administrador
    const session = await validateSessionUser(Role.admin);
    if (!session) {
      return { error: "Solo el administrador puede modificar los rangos." };
    }

    // 2. Validar que el array de IDs no esté vacío
    if (!userIds || userIds.length === 0) {
      return { error: "No se proporcionaron IDs de usuario." };
    }

    // 3. Validar el rango
    const validRank = isValidRank(newRank);
    if (!validRank) {
      return { error: "Los rangos disponibles son: concurre o miembro." };
    }

    // 4. Actualización Masiva
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        rank: newRank as RankType,
      },
    });

    // 5. Feedback y Revalidación
    if (result.count === 0) {
      return { error: "No se encontraron usuarios para actualizar." };
    }

    revalidatePath("/admin/users");

    return {
      success: `Se actualizó el rango a ${newRank} para ${result.count} usuarios correctamente.`,
    };
  } catch (error) {
    console.error("Error updating multiple users rank:", error);
    return { error: "Error al realizar la actualización." };
  }
}
