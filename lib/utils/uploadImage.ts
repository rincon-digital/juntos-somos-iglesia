import "dotenv/config";

export async function uploadToImgBB(file: File) {
  if (!process.env.IMGBB_API_KEY) {
    console.error("CRITICAL: IMGBB_API_KEY is not defined in environment variables.");
    return null;
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    const imgbbFormData = new FormData();
    imgbbFormData.append("image", base64Image);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      {
        method: "POST",
        body: imgbbFormData,
      },
    );

    const data = await response.json();

    if (data.success) {
      console.log("ImgBB Upload Success:", data.data.url);
      return data.data.url;
    } else {
      console.error("ImgBB Error:", data.error);
      return null;
    }
  } catch (error) {
    console.error("Error al procesar la imagen para ImgBB:", error);
    return null;
  }
}
