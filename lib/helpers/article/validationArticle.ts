import { getYouTubeID } from "@/lib/helpers/course/validationVideo";

export { getYouTubeID };

export function getYouTubeThumbnail(
  urlOrId: string,
  quality: "mqdefault" | "hqdefault" | "maxresdefault" = "hqdefault",
): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  const id = trimmed.length === 11 && !trimmed.includes("/") ? trimmed : getYouTubeID(trimmed);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}

export function parseArticleYouTubeUrls(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim());
      }
    } catch {
      if (getYouTubeID(raw)) return [raw.trim()];
    }
  }
  return [];
}

export function validationDataArticle(data: {
  title: string;
  content: string;
  youtubeUrls?: string[];
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

  if (data.youtubeUrls && data.youtubeUrls.length > 0) {
    for (const url of data.youtubeUrls) {
      if (!getYouTubeID(url)) {
        return {
          valid: false,
          error: `URL de YouTube no válida: "${url}"`,
        };
      }
    }
  }

  return { valid: true, error: null };
}
