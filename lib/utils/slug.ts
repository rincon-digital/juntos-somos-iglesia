export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
    .replace(/\s+/g, '-') // Reemplaza espacios por guiones
    .replace(/[^\w-]+/g, '') // Elimina caracteres no alfanuméricos (excepto guiones)
    .replace(/--+/g, '-') // Reemplaza múltiples guiones por uno solo
    .concat('-' + Math.random().toString(36).substring(2, 7)); // Añade un sufijo aleatorio para evitar colisiones
}
