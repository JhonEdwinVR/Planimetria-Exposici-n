import { jsPDF } from 'jspdf';
import { ExhibitionProject, Wall } from '../types/exhibition';

const DB_NAME = 'SpaguettyHouseDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const PROJECT_KEY = 'active_spaguetty_house_project_v1';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProjectToIndexedDB(project: ExhibitionProject): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(project, PROJECT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Fallback to localStorage due to IndexedDB error:', err);
    localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
  }
}

export async function loadProjectFromIndexedDB(): Promise<ExhibitionProject | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(PROJECT_KEY);
      req.onsuccess = () => resolve((req.result as ExhibitionProject) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const raw = localStorage.getItem(PROJECT_KEY);
    return raw ? (JSON.parse(raw) as ExhibitionProject) : null;
  }
}

export function exportProjectJson(project: ExhibitionProject): void {
  const dataStr = JSON.stringify(project, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spaguetty-house-proyecto-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSvgElementAsPng(svgElement: SVGSVGElement | null, filename: string): void {
  if (!svgElement) return;
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const bbox = svgElement.getBoundingClientRect();
  const width = Math.max(1600, Math.round(bbox.width * 2));
  const height = Math.max(1000, Math.round(bbox.height * 2));
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  const xml = new XMLSerializer().serializeToString(clone);
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const image64 = `data:image/svg+xml;base64,${svg64}`;

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FBF9F5';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  img.src = image64;
}

/**
 * Generates a museum-grade PDF Technical Mounting Sheet (Ficha Técnica de Montaje)
 * for either a single selected wall or all walls in Spaguetty House.
 */
export function exportTechnicalSheetPdf(
  project: ExhibitionProject,
  targetWall?: Wall
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const wallsToRender = targetWall ? [targetWall] : project.walls;

  wallsToRender.forEach((wall, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage('a4', 'landscape');
    }

    const wallItems = project.items
      .filter((it) => it.wallId === wall.id && it.visible)
      .sort((a, b) => a.xCm - b.xCm);

    // Architectural Page Border & Header
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, 277, 190);

    // Header Block
    doc.setFillColor(248, 246, 242);
    doc.rect(10, 10, 277, 22, 'F');
    doc.line(10, 32, 287, 32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(28, 25, 23);
    doc.text('SPAGUETTY HOUSE — FICHA TÉCNICA DE MONTAJE EXPOSITIVO', 16, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(87, 83, 78);
    doc.text(
      `Muro: ${wall.name}  |  Participante / Sector: ${wall.participant}  |  Material: ${wall.material.toUpperCase()}`,
      16,
      26
    );

    const heightLabel = wall.heightConfirmed
      ? `${wall.heightM.toFixed(2)} m (Confirmada)`
      : `${wall.heightM.toFixed(2)} m (Provisional / Por definir)`;

    const artCount = wallItems.filter(
      (it) =>
        it.type === 'photo' ||
        it.type === 'frame' ||
        it.type === 'portrait_stand' ||
        it.category === 'artworks'
    ).length;
    const textCount = wallItems.filter(
      (it) =>
        it.type === 'text' ||
        it.type === 'title' ||
        it.type === 'description'
    ).length;
    const countSummary =
      textCount > 0
        ? `OBRAS: ${artCount}  TEXTOS: ${textCount}`
        : `OBRAS: ${artCount}`;

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(28, 25, 23);
    doc.text(
      `ANCHO: ${wall.lengthM.toFixed(2)}m (${Math.round(wall.lengthM * 100)}cm)  ALT: ${heightLabel}  ${countSummary}`,
      155,
      19
    );
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(
      `Separación ref.: ${wall.defaultSpacingCm} cm  |  Grosor muro: ${wall.thicknessCm} cm`,
      165,
      26
    );

    // Proportional Elevation Diagram Box (Left/Top Area)
    const boxX = 18;
    const boxY = 39;
    const maxDrawW = 155;
    const maxDrawH = 82;

    const wallWcm = wall.lengthM * 100;
    const wallHcm = wall.heightM * 100;
    const scale = Math.min(maxDrawW / wallWcm, maxDrawH / wallHcm);

    const drawW = wallWcm * scale;
    const drawH = wallHcm * scale;
    const startX = boxX + (maxDrawW - drawW) / 2;
    const startY = boxY + (maxDrawH - drawH) / 2;

    // Wall surface
    doc.setFillColor(245, 243, 239);
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.4);
    doc.rect(startX, startY, drawW, drawH, 'FD');

    // Eye level reference line (150 cm from floor)
    if (wallHcm >= 150) {
      const eyeY = startY + drawH - 150 * scale;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.2);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(startX, eyeY, startX + drawW, eyeY);
      doc.setLineDashPattern([], 0);
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(37, 99, 235);
      doc.text('Eje 150 cm', startX + drawW + 2, eyeY + 1);
    }

    // Draw each item on wall
    wallItems.forEach((item, idx) => {
      const ix = startX + item.xCm * scale;
      const iy = startY + drawH - (item.yCm + item.heightCm) * scale;
      const iw = item.widthCm * scale;
      const ih = item.heightCm * scale;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(28, 25, 23);
      doc.setLineWidth(0.35);
      doc.rect(ix, iy, iw, ih, 'FD');

      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(28, 25, 23);
      const label = item.code || `#${idx + 1}`;
      doc.text(label, ix + iw / 2, iy + ih / 2 + 1, { align: 'center' });
    });

    // Wall dimensions labels around elevation
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `0 cm (Borde Izq.)`,
      startX,
      startY + drawH + 5
    );
    doc.text(
      `${Math.round(wallWcm)} cm (${wall.lengthM.toFixed(2)} m)`,
      startX + drawW,
      startY + drawH + 5,
      { align: 'right' }
    );

    // Summary & Notes Box on the Right
    doc.setDrawColor(210, 205, 198);
    doc.setFillColor(252, 251, 249);
    doc.rect(185, 39, 95, 82, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(28, 25, 23);
    doc.text('NOTAS TÉCNICAS DEL MURO', 190, 46);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    const splitNotes = doc.splitTextToSize(
      wall.notes || 'Sin observaciones adicionales.',
      85
    );
    doc.text(splitNotes, 190, 53);

    // Coordinates & Mounting Table at bottom
    let tableY = 132;
    doc.setFillColor(235, 232, 226);
    doc.rect(16, tableY, 265, 7, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(28, 25, 23);
    doc.text('CÓD.', 19, tableY + 4.8);
    doc.text('OBRA / ELEMENTO', 38, tableY + 4.8);
    doc.text('TIPO', 105, tableY + 4.8);
    doc.text('FORMATO (An×Al)', 132, tableY + 4.8);
    doc.text('POS. X (Izq)', 170, tableY + 4.8);
    doc.text('POS. Y (Suelo)', 202, tableY + 4.8);
    doc.text('MARCO / SOPORTE', 236, tableY + 4.8);

    tableY += 7;
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);

    wallItems.slice(0, 8).forEach((it, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(250, 248, 245);
        doc.rect(16, tableY, 265, 6.2, 'F');
      }
      doc.setTextColor(28, 25, 23);
      doc.text(it.code || `#${idx + 1}`, 19, tableY + 4.3);
      doc.text(it.name.slice(0, 34), 38, tableY + 4.3);
      const typeLabel =
        it.type === 'text'
          ? `TEXTO (${it.textType || 'sala'})`
          : it.category === 'artworks' || it.type === 'photo'
          ? 'FOTOGRAFÍA'
          : it.type.toUpperCase();
      doc.text(typeLabel.slice(0, 15), 105, tableY + 4.3);
      doc.text(`${it.widthCm} × ${it.heightCm} cm`, 132, tableY + 4.3);
      doc.text(`${it.xCm.toFixed(1)} cm`, 170, tableY + 4.3);
      doc.text(`${it.yCm.toFixed(1)} cm`, 202, tableY + 4.3);
      doc.text(`${it.frameStyle} (margen ${it.matWidthCm}cm)`, 236, tableY + 4.3);
      tableY += 6.2;
    });

    if (wallItems.length > 8) {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `+ ${wallItems.length - 8} elementos adicionales registrados en este muro.`,
        19,
        tableY + 4
      );
    }
  });

  const slug = targetWall
    ? targetWall.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : 'catalogo-completo';
  doc.save(`spaguetty-house-ficha-${slug}.pdf`);
}
