export function validationDataArticle(data: {
  title: string;
  content: string;
}) {
  if (!data.title || data.title.trim().length < 5) {
    return {
      valid: false,
      error: "El título es obligatorio y debe tener al menos 5 caracteres.",
    };
  }

  if (!data.content || data.content.trim().length < 10) {
    return {
      valid: false,
      error: "El contenido es demasiado corto. Añade más información.",
    };
  }

  return { valid: true, error: null };
}
