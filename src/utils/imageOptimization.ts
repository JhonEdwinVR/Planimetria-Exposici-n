/**
 * Utilidad para optimizar y comprimir imágenes antes de almacenarlas en el estado y Firestore.
 * Firestore tiene un límite estricto de 1 MB por documento. Comprimir las imágenes en el cliente
 * a dimensiones adecuadas (ej. máx 1200px) y calidad 0.8 reduce archivos de 5-10 MB a ~60-120 KB,
 * manteniendo nitidez visual completa y garantizando la sincronización sin errores.
 */
export async function optimizeImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.8
): Promise<{ dataUrl: string; isVector: boolean }> {
  const isSvg = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml';

  if (isSvg) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result as string, isVector: true });
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: rawDataUrl, isVector: false });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compresión JPEG equilibrada
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve({ dataUrl: compressed, isVector: false });
      };
      img.onerror = () => {
        resolve({ dataUrl: rawDataUrl, isVector: false });
      };
      img.src = rawDataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
