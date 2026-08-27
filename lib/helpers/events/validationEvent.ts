import { CreateEventInput, UpdateEventInput } from "@/lib/types/events.definitions";

export function validateCreateEvent(data: CreateEventInput): {
  valid: boolean;
  error?: string;
} {
  if (!data.title || data.title.trim().length === 0) {
    return { valid: false, error: "El título del evento es obligatorio." };
  }

  if (data.title.trim().length < 3) {
    return {
      valid: false,
      error: "El título debe tener al menos 3 caracteres.",
    };
  }

  if (data.title.trim().length > 200) {
    return {
      valid: false,
      error: "El título no puede exceder los 200 caracteres.",
    };
  }

  if (data.description && data.description.length > 5000) {
    return {
      valid: false,
      error: "La descripción no puede superar los 5000 caracteres.",
    };
  }

  if (data.date) {
    const parsedDate = new Date(data.date);
    if (isNaN(parsedDate.getTime())) {
      return { valid: false, error: "La fecha del evento no es válida." };
    }
  }

  return { valid: true };
}

export function validateUpdateEvent(data: UpdateEventInput): {
  valid: boolean;
  error?: string;
} {
  if (data.title !== undefined) {
    if (data.title.trim().length === 0) {
      return { valid: false, error: "El título del evento no puede estar vacío." };
    }
    if (data.title.trim().length < 3) {
      return {
        valid: false,
        error: "El título debe tener al menos 3 caracteres.",
      };
    }
    if (data.title.trim().length > 200) {
      return {
        valid: false,
        error: "El título no puede exceder los 200 caracteres.",
      };
    }
  }

  if (data.description && data.description.length > 5000) {
    return {
      valid: false,
      error: "La descripción no puede superar los 5000 caracteres.",
    };
  }

  if (data.date) {
    const parsedDate = new Date(data.date);
    if (isNaN(parsedDate.getTime())) {
      return { valid: false, error: "La fecha del evento no es válida." };
    }
  }

  return { valid: true };
}
