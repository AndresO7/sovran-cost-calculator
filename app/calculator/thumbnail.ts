/** Ancho y alto de la miniatura que se guarda. */
export const THUMB_W = 640;
export const THUMB_H = 400;

export type CaptureFn = () => string | null;
export type CaptureRef = { current: CaptureFn | null };

/**
 * Reescala la captura del canvas a un WebP pequeño. Devuelve null ante
 * cualquier fallo: la miniatura es decoración y nunca debe impedir guardar.
 */
export async function dataUrlToThumbnailBlob(
  dataUrl: string,
  w = THUMB_W,
  h = THUMB_H
): Promise<Blob | null> {
  try {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // recorte centrado para llenar el encuadre sin deformar
    const scale = Math.max(w / image.width, h / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85)
    );
  } catch {
    return null;
  }
}
