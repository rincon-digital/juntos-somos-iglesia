import { Course } from "@/lib/types/definitions";

// Las fechas de los cursos son días de calendario en hora de Argentina (UTC-3, sin horario de verano).
// Guardarlas como "2026-11-20" a secas las deja a la medianoche UTC, que acá es el día anterior.
const CHURCH_OFFSET = "-03:00";
const CHURCH_OFFSET_MS = 3 * 60 * 60 * 1000;

// "YYYY-MM-DD" del día en Argentina (acepta el valor del input o una fecha)
export function toChurchDay(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(new Date(value).getTime() - CHURCH_OFFSET_MS).toISOString().slice(0, 10);
}

// La inscripción abre a las 00:00 del día elegido...
export function churchDayStart(value: string | Date): Date {
  return new Date(`${toChurchDay(value)}T00:00:00${CHURCH_OFFSET}`);
}

// ...y cierra a las 23:59 del día de cierre
export function churchDayEnd(value: string | Date): Date {
  return new Date(`${toChurchDay(value)}T23:59:59.999${CHURCH_OFFSET}`);
}

export async function validationDataCourse(data: Course) {
  const errors: Partial<Record<keyof Course, string>> = {};
  const today = toChurchDay(new Date());

  // 1. Validación de Nombre (mínimo 5 caracteres)
  if (!data.name || data.name.trim().length < 5) {
    errors.name = "El nombre debe tener al menos 5 caracteres.";
  }

  // 2. Validación de Descripción (mínimo 10 caracteres, máximo 5000)
  if (!data.description || data.description.trim().length < 10) {
    errors.description = "La descripción debe tener al menos 10 caracteres.";
  } else if (data.description.length > 5000) {
    errors.description = "La descripción no puede superar los 5000 caracteres.";
  }

  // 3. Validación de Cupo (mayor a 1)
  if (!data.quotaLimit || data.quotaLimit <= 1) {
    errors.quotaLimit = "El cupo debe ser mayor a 1.";
  }

  // 4. Validación de Fecha de Apertura (hoy o futura; se compara por día, no por hora)
  const openValid = !!data.openEnrollment && !isNaN(churchDayStart(data.openEnrollment as any).getTime());
  const openDay = openValid ? toChurchDay(data.openEnrollment as any) : "";
  if (!openValid) {
    errors.openEnrollment = "La fecha de apertura no es válida.";
  } else if (openDay < today) {
    errors.openEnrollment = "La fecha de apertura no puede ser anterior a hoy.";
  }

  // 5. Validación de Fecha Límite (puede ser el mismo día de apertura, no antes)
  const deadlineValid = !!data.deadline && !isNaN(churchDayEnd(data.deadline as any).getTime());
  if (!deadlineValid) {
    errors.deadline = "La fecha de cierre no es válida.";
  } else if (openValid && toChurchDay(data.deadline as any) < openDay) {
    errors.deadline =
      "La fecha de cierre no puede ser anterior a la de apertura.";
  }

  // Retornar resultado
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
