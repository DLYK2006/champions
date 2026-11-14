// Browser only: shrink a photo to max 1024 px JPEG (BUILD_PLAN) and return base64 without the data: prefix.
export async function resizeToJpegBase64(file: File, max = 1024, quality = 0.7): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality).split(",")[1];
}
