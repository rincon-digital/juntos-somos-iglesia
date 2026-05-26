export function validateContent(content: unknown): string {
  if (typeof content !== "string") {
    throw new Error("El contenido debe ser un texto válido.");
  }
  if (content.trim().length < 10) {
    throw new Error("El contenido debe tener al menos 10 caracteres.");
  }
  return content.trim();
}
