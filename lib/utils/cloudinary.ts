import "dotenv/config";

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  tags?: string[];
  [key: string]: any;
}

export async function uploadImageToCloudinary(
  file: File | string, // File o base64
  options?: {
    folder?: string;
    tags?: string[];
  },
): Promise<{ url: string; publicId: string; tags?: string[] } | null> {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.CLOUDINARY_UPLOAD_PRESET ||
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    console.error(
      "CRITICAL: CLOUDINARY_CLOUD_NAME no está definida en las variables de entorno.",
    );
    return null;
  }

  try {
    const formData = new FormData();

    if (typeof file === "string") {
      formData.append("file", file);
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
      formData.append("file", base64);
    }

    if (uploadPreset) {
      formData.append("upload_preset", uploadPreset);
    }

    if (options?.folder) {
      formData.append("folder", options.folder);
    }

    if (options?.tags && options.tags.length > 0) {
      formData.append("tags", options.tags.join(","));
    }

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = (await res.json()) as CloudinaryUploadResponse;

    if (!res.ok || !data.secure_url) {
      console.error("Error al subir a Cloudinary:", data);
      return null;
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      tags: data.tags || options?.tags,
    };
  } catch (error) {
    console.error("Error en uploadImageToCloudinary:", error);
    return null;
  }
}

export async function deleteImageFromCloudinary(
  publicId: string,
): Promise<boolean> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn(
      "Cloudinary credentials (API Key/Secret) not set. Skipping remote deletion.",
    );
    return false;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();
    return data.result === "ok";
  } catch (error) {
    console.error("Error en deleteImageFromCloudinary:", error);
    return false;
  }
}
