export function getYouTubeID(url: string): string | null {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  return match && match[2].length === 11 ? match[2] : null;
}

export function validationDataVideo(data: { title: string; order: number }) {
  if (!data.title || data.title.length < 3) {
    return {
      error: "El título es obligatorio y debe tener al menos 3 caracteres.",
    };
  }

  // Validación de Orden
  const order = Number(data.order);
  if (isNaN(order) || !Number.isInteger(order) || order < 0) {
    return { error: "El orden debe ser un número entero válido (0, 1, 2...)." };
  }

  return { valid: true };
}
