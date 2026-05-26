import { Course } from "@/lib/types/definitions";

export async function validationDataCourse(data: Course) {
  const errors: Partial<Record<keyof Course, string>> = {};
  const now = new Date();
  // Normalizamos 'now' a medianoche si quieres permitir inscripciones desde hoy temprano
  now.setHours(0, 0, 0, 0);

  // 1. Validación de Nombre (mínimo 5 caracteres)
  if (!data.name || data.name.trim().length < 5) {
    errors.name = "El nombre debe tener al menos 5 caracteres.";
  }

  // 2. Validación de Descripción (mínimo 10 caracteres)
  if (!data.description || data.description.trim().length < 10) {
    errors.description = "La descripción debe tener al menos 10 caracteres.";
  }

  // 3. Validación de Cupo (mayor a 1)
  if (!data.quotaLimit || data.quotaLimit <= 1) {
    errors.quotaLimit = "El cupo debe ser mayor a 1.";
  }

  // 4. Validación de Fecha de Apertura (Actual o Futura)
  const openDate = new Date(data.openEnrollment);
  if (isNaN(openDate.getTime()) || openDate < now) {
    errors.openEnrollment = "La fecha de apertura no puede ser anterior a hoy.";
  }

  // 5. Validación de Fecha Límite (No menor a la de apertura)
  const deadlineDate = new Date(data.deadline);
  if (isNaN(deadlineDate.getTime())) {
    errors.deadline = "La fecha de cierre no es válida.";
  } else if (deadlineDate < openDate) {
    errors.deadline =
      "La fecha de cierre no puede ser anterior a la de apertura.";
  }

  // Retornar resultado
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
