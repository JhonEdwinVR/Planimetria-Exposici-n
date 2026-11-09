/**
 * Lightweight, robust ASCII DXF to SVG Converter for architectural blocks.
 * Parses standard AutoCAD entities (LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC)
 * and generates clean, scalable SVG vector markup.
 */

interface Point2D {
  x: number;
  y: number;
}

interface DxfEntity {
  type: string;
  points?: Point2D[];
  radius?: number;
  center?: Point2D;
  startAngle?: number;
  endAngle?: number;
  closed?: boolean;
}

export function parseDxfToSvg(dxfText: string): {
  svgDataUrl: string;
  widthUnits: number;
  heightUnits: number;
  isVector: boolean;
} | null {
  const lines = dxfText.split(/\r?\n/).map((l) => l.trim());
  if (lines.length < 4) return null;

  // Verify it looks like ASCII DXF (pairs of code and value)
  let isEntitiesSection = false;
  const entities: DxfEntity[] = [];

  let currentEntity: DxfEntity | null = null;
  let code = -1;

  for (let i = 0; i < lines.length - 1; i += 2) {
    const rawCode = lines[i];
    const val = lines[i + 1];
    code = parseInt(rawCode, 10);
    if (isNaN(code)) continue;

    if (code === 0) {
      if (val === 'SECTION') {
        // start of section
      } else if (val === 'ENDSEC') {
        if (isEntitiesSection) {
          if (currentEntity) entities.push(currentEntity);
          break; // done with ENTITIES
        }
      } else if (val === 'EOF') {
        break;
      } else if (isEntitiesSection) {
        if (currentEntity) {
          entities.push(currentEntity);
        }
        currentEntity = { type: val };
      }
    } else if (code === 2 && val === 'ENTITIES') {
      isEntitiesSection = true;
    } else if (isEntitiesSection && currentEntity) {
      const numVal = parseFloat(val);

      if (currentEntity.type === 'LINE') {
        if (!currentEntity.points) currentEntity.points = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
        if (code === 10) currentEntity.points[0].x = numVal;
        else if (code === 20) currentEntity.points[0].y = numVal;
        else if (code === 11) currentEntity.points[1].x = numVal;
        else if (code === 21) currentEntity.points[1].y = numVal;
      } else if (currentEntity.type === 'LWPOLYLINE' || currentEntity.type === 'POLYLINE') {
        if (!currentEntity.points) currentEntity.points = [];
        if (code === 70 && (parseInt(val, 10) & 1)) {
          currentEntity.closed = true;
        } else if (code === 10) {
          currentEntity.points.push({ x: numVal, y: 0 });
        } else if (code === 20 && currentEntity.points.length > 0) {
          currentEntity.points[currentEntity.points.length - 1].y = numVal;
        }
      } else if (currentEntity.type === 'CIRCLE') {
        if (!currentEntity.center) currentEntity.center = { x: 0, y: 0 };
        if (code === 10) currentEntity.center.x = numVal;
        else if (code === 20) currentEntity.center.y = numVal;
        else if (code === 40) currentEntity.radius = numVal;
      } else if (currentEntity.type === 'ARC') {
        if (!currentEntity.center) currentEntity.center = { x: 0, y: 0 };
        if (code === 10) currentEntity.center.x = numVal;
        else if (code === 20) currentEntity.center.y = numVal;
        else if (code === 40) currentEntity.radius = numVal;
        else if (code === 50) currentEntity.startAngle = numVal;
        else if (code === 51) currentEntity.endAngle = numVal;
      }
    }
  }

  if (currentEntity && isEntitiesSection) {
    entities.push(currentEntity);
  }

  if (entities.length === 0) {
    return null;
  }

  // Calculate bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const updateBounds = (x: number, y: number) => {
    if (!isFinite(x) || !isFinite(y)) return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  entities.forEach((ent) => {
    if (ent.points) {
      ent.points.forEach((p) => updateBounds(p.x, p.y));
    }
    if (ent.center && ent.radius) {
      updateBounds(ent.center.x - ent.radius, ent.center.y - ent.radius);
      updateBounds(ent.center.x + ent.radius, ent.center.y + ent.radius);
    }
  });

  if (!isFinite(minX) || !isFinite(maxX) || minX === maxX) {
    minX = 0;
    maxX = 100;
  }
  if (!isFinite(minY) || !isFinite(maxY) || minY === maxY) {
    minY = 0;
    maxY = 100;
  }

  const rawW = Math.max(1, maxX - minX);
  const rawH = Math.max(1, maxY - minY);
  const padding = Math.max(rawW, rawH) * 0.05;

  const boxMinX = minX - padding;
  const boxMinY = minY - padding;
  const boxW = rawW + padding * 2;
  const boxH = rawH + padding * 2;

  // Generate SVG elements (in CAD, Y axis points UP, in SVG Y axis points DOWN)
  // Flip Y: svgY = maxY - y + minY
  const flipY = (y: number) => maxY - (y - minY);

  const svgPaths: string[] = [];

  entities.forEach((ent) => {
    if (ent.type === 'LINE' && ent.points && ent.points.length >= 2) {
      const p1 = ent.points[0];
      const p2 = ent.points[1];
      svgPaths.push(
        `<line x1="${p1.x.toFixed(2)}" y1="${flipY(p1.y).toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${flipY(p2.y).toFixed(2)}" />`
      );
    } else if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.points && ent.points.length > 1) {
      const d = ent.points
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${flipY(p.y).toFixed(2)}`)
        .join(' ');
      svgPaths.push(`<path d="${d}${ent.closed ? ' Z' : ''}" />`);
    } else if (ent.type === 'CIRCLE' && ent.center && ent.radius) {
      svgPaths.push(
        `<circle cx="${ent.center.x.toFixed(2)}" cy="${flipY(ent.center.y).toFixed(2)}" r="${ent.radius.toFixed(2)}" />`
      );
    } else if (ent.type === 'ARC' && ent.center && ent.radius && ent.startAngle !== undefined && ent.endAngle !== undefined) {
      const cx = ent.center.x;
      const cy = ent.center.y;
      const r = ent.radius;
      const a1Rad = (ent.startAngle * Math.PI) / 180;
      const a2Rad = (ent.endAngle * Math.PI) / 180;

      const x1 = cx + r * Math.cos(a1Rad);
      const y1 = cy + r * Math.sin(a1Rad);
      const x2 = cx + r * Math.cos(a2Rad);
      const y2 = cy + r * Math.sin(a2Rad);

      let sweep = ent.endAngle - ent.startAngle;
      if (sweep < 0) sweep += 360;
      const largeArc = sweep > 180 ? 1 : 0;

      svgPaths.push(
        `<path d="M ${x1.toFixed(2)} ${flipY(y1).toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArc} 0 ${x2.toFixed(2)} ${flipY(y2).toFixed(2)}" />`
      );
    }
  });

  const strokeW = (Math.max(rawW, rawH) / 250).toFixed(2);

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${boxMinX.toFixed(2)} ${boxMinY.toFixed(2)} ${boxW.toFixed(2)} ${boxH.toFixed(2)}" width="${Math.round(boxW)}" height="${Math.round(boxH)}">
  <g fill="none" stroke="currentColor" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round">
    ${svgPaths.join('\n    ')}
  </g>
</svg>`.trim();

  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;

  return {
    svgDataUrl,
    widthUnits: rawW,
    heightUnits: rawH,
    isVector: true,
  };
}
