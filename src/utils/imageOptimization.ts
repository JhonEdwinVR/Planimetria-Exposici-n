import { ExhibitionProject } from '../types/exhibition';

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

/**
 * Comprime una imagen en formato Base64 existente si excede dimensiones o tamaño razonable.
 */
export function compressBase64Image(
  dataUrl: string,
  maxDimension = 1200,
  quality = 0.75
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image') || dataUrl.startsWith('data:image/svg')) {
    return Promise.resolve(dataUrl);
  }

  // Si ya es liviana (< 100 KB), mantenerla
  if (dataUrl.length < 100000) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
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
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Sanea y comprime un proyecto completo (especialmente útil al importar JSONs
 * que contengan imágenes Base64 pesadas sin comprimir o snapshots duplicados).
 */
export async function sanitizeAndCompressProject(project: ExhibitionProject): Promise<ExhibitionProject> {
  const cloned = JSON.parse(JSON.stringify(project)) as ExhibitionProject;

  // 1. Comprimir plano de fondo
  if (cloned.backgroundPlan?.imageUrl) {
    cloned.backgroundPlan.imageUrl = await compressBase64Image(cloned.backgroundPlan.imageUrl, 1600, 0.75);
  }
  if (cloned.referenceImageUrl) {
    cloned.referenceImageUrl = await compressBase64Image(cloned.referenceImageUrl, 1600, 0.75);
  }

  // 2. Comprimir imágenes de obras individuales
  if (Array.isArray(cloned.items)) {
    for (const item of cloned.items) {
      if (item.imageUrl) {
        item.imageUrl = await compressBase64Image(item.imageUrl, 1200, 0.75);
      }
    }
  }

  // 3. Comprimir biblioteca
  if (Array.isArray(cloned.library)) {
    for (const lib of cloned.library) {
      if ((lib as any).dataUrl) {
        (lib as any).dataUrl = await compressBase64Image((lib as any).dataUrl, 800, 0.7);
      } else if ((lib as any).imageUrl) {
        (lib as any).imageUrl = await compressBase64Image((lib as any).imageUrl, 800, 0.7);
      }
    }
  }

  // 4. Limitar snapshots duplicados (cada snapshot duplica todos los muros e items)
  if (Array.isArray(cloned.snapshots) && cloned.snapshots.length > 2) {
    cloned.snapshots = cloned.snapshots.slice(-2);
  }

  // 5. Limpiar papelera antigua para no acumular basura pesada
  if (Array.isArray(cloned.trash) && cloned.trash.length > 8) {
    cloned.trash = cloned.trash.slice(-8);
  }

  cloned.updatedAt = new Date().toISOString();
  return cloned;
}
