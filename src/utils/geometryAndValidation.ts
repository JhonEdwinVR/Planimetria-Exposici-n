import { ValidationIssue, Vertex, Wall, WallItem } from '../types/exhibition';

/**
 * Updates a wall's length in meters AND propagates the vertex shift along the connected wall chain
 * so adjacent walls remain joined at their shared vertices without gaps.
 */
export function updateWallLengthConnected(
  walls: Wall[],
  vertices: Vertex[],
  targetWallId: string,
  newLengthM: number
): { walls: Wall[]; vertices: Vertex[] } {
  const safeLength = Math.max(0.2, Math.min(25, Number(newLengthM.toFixed(2))));
  const wallIndex = walls.findIndex((w) => w.id === targetWallId);
  if (wallIndex === -1) return { walls, vertices };

  const targetWall = walls[wallIndex];
  const vStart = vertices.find((v) => v.id === targetWall.startVertexId);
  const vEnd = vertices.find((v) => v.id === targetWall.endVertexId);

  const formatDimLabel = (w: Wall, len: number) =>
    w.thicknessCm === 0 ? `Vano ${len.toFixed(2)} m` : `${len.toFixed(2)} m`;

  if (!vStart || !vEnd) {
    const nextWalls = walls.map((w) =>
      w.id === targetWallId || w.linkedWallId === targetWallId || targetWall.linkedWallId === w.id
        ? { ...w, lengthM: safeLength, dimensionLabel: formatDimLabel(w, safeLength) }
        : w
    );
    return { walls: nextWalls, vertices };
  }

  const dx = vEnd.x - vStart.x;
  const dy = vEnd.y - vStart.y;
  const currentDist = Math.hypot(dx, dy);

  let ux = 1;
  let uy = 0;
  if (currentDist > 0.0001) {
    ux = dx / currentDist;
    uy = dy / currentDist;
  } else if (targetWall.orientation === 'vertical') {
    ux = 0;
    uy = 1;
  }

  const newEndX = Number((vStart.x + ux * safeLength).toFixed(3));
  const newEndY = Number((vStart.y + uy * safeLength).toFixed(3));
  const deltaX = newEndX - vEnd.x;
  const deltaY = newEndY - vEnd.y;

  // Find all vertices downstream in the wall chain starting from endVertexId
  const downstreamVertexIds = new Set<string>([targetWall.endVertexId]);
  let added = true;
  while (added) {
    added = false;
    for (const w of walls) {
      if (w.id === targetWallId || w.linkedWallId === targetWallId || targetWall.linkedWallId === w.id) continue;
      if (
        downstreamVertexIds.has(w.startVertexId) &&
        !downstreamVertexIds.has(w.endVertexId) &&
        w.endVertexId !== targetWall.startVertexId
      ) {
        downstreamVertexIds.add(w.endVertexId);
        added = true;
      }
    }
  }

  const updatedVertices = vertices.map((v) => {
    if (downstreamVertexIds.has(v.id)) {
      return {
        ...v,
        x: Number((v.x + deltaX).toFixed(3)),
        y: Number((v.y + deltaY).toFixed(3)),
      };
    }
    return v;
  });

  const vMap = new Map(updatedVertices.map((v) => [v.id, v]));

  const updatedWalls = walls.map((w) => {
    const isSameOrLinked =
      w.id === targetWallId ||
      w.linkedWallId === targetWallId ||
      targetWall.linkedWallId === w.id ||
      (w.startVertexId === targetWall.startVertexId && w.endVertexId === targetWall.endVertexId);

    if (isSameOrLinked) {
      return {
        ...w,
        lengthM: safeLength,
        dimensionLabel: formatDimLabel(w, safeLength),
      };
    }

    const vs = vMap.get(w.startVertexId);
    const ve = vMap.get(w.endVertexId);
    if (vs && ve && (downstreamVertexIds.has(w.startVertexId) || downstreamVertexIds.has(w.endVertexId))) {
      const recalculated = Math.max(0.2, Number(Math.hypot(ve.x - vs.x, ve.y - vs.y).toFixed(2)));
      return {
        ...w,
        lengthM: recalculated,
        dimensionLabel: formatDimLabel(w, recalculated),
      };
    }
    return w;
  });

  return { walls: updatedWalls, vertices: updatedVertices };
}

/**
 * Validates all items on a given wall (or across the whole project) for:
 * 1. Exceeding wall width or height boundaries
 * 2. Overlapping with another artwork/element on the same wall
 */
export function validateWallItems(walls: Wall[], items: WallItem[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const wall of walls) {
    const wallWidthCm = Math.round(wall.lengthM * 100);
    const wallHeightCm = Math.round(wall.heightM * 100);
    const wallItems = items.filter((it) => it.wallId === wall.id && it.visible);

    for (const item of wallItems) {
      if (item.xCm < 0) {
        issues.push({
          id: `issue-left-${item.id}`,
          wallId: wall.id,
          itemIds: [item.id],
          type: 'overflow_left',
          severity: 'error',
          message: `«${item.name}» sobresale ${Math.abs(Math.round(item.xCm))} cm por el borde izquierdo de ${wall.name}.`,
        });
      }
      if (item.xCm + item.widthCm > wallWidthCm) {
        const excess = Math.round(item.xCm + item.widthCm - wallWidthCm);
        issues.push({
          id: `issue-right-${item.id}`,
          wallId: wall.id,
          itemIds: [item.id],
          type: 'overflow_right',
          severity: 'error',
          message: `«${item.name}» supera el ancho disponible de ${wall.name} por ${excess} cm.`,
        });
      }
      if (item.yCm < 0) {
        issues.push({
          id: `issue-bottom-${item.id}`,
          wallId: wall.id,
          itemIds: [item.id],
          type: 'overflow_bottom',
          severity: 'error',
          message: `«${item.name}» se encuentra ${Math.abs(Math.round(item.yCm))} cm por debajo del nivel del suelo.`,
        });
      }
      if (item.yCm + item.heightCm > wallHeightCm) {
        const excess = Math.round(item.yCm + item.heightCm - wallHeightCm);
        issues.push({
          id: `issue-top-${item.id}`,
          wallId: wall.id,
          itemIds: [item.id],
          type: 'overflow_top',
          severity: 'error',
          message: `«${item.name}» supera la altura del muro (${wall.heightM.toFixed(2)} m) por ${excess} cm.`,
        });
      }
    }

    // Check pairwise overlaps on the same wall
    for (let i = 0; i < wallItems.length; i++) {
      for (let j = i + 1; j < wallItems.length; j++) {
        const a = wallItems[i];
        const b = wallItems[j];
        // Ignore reference images in collision check
        if (a.type === 'reference' || b.type === 'reference') continue;

        const overlapX = a.xCm < b.xCm + b.widthCm && a.xCm + a.widthCm > b.xCm;
        const overlapY = a.yCm < b.yCm + b.heightCm && a.yCm + a.heightCm > b.yCm;

        if (overlapX && overlapY) {
          issues.push({
            id: `issue-overlap-${a.id}-${b.id}`,
            wallId: wall.id,
            itemIds: [a.id, b.id],
            type: 'overlap',
            severity: 'warning',
            message: `Superposición detectada entre «${a.name}» y «${b.name}» en ${wall.name}.`,
          });
        }
      }
    }
  }

  return issues;
}

export type AlignmentMode =
  | 'left'
  | 'center-x'
  | 'right'
  | 'top'
  | 'center-y'
  | 'bottom'
  | 'eye-level-150';

export type DistributionMode =
  | 'distribute-h-gaps'
  | 'distribute-h-centers'
  | 'distribute-v-gaps'
  | 'distribute-v-centers'
  | 'exact-spacing-h';

export type AlignmentReferenceMode = 'selection' | 'key_object' | 'wall';

export interface AlignmentOptions {
  reference?: AlignmentReferenceMode;
  keyItemId?: string;
  keyObjectId?: string;
  exactSpacingCm?: number;
}

/**
 * Advanced Illustrator/Figma style Alignment & Distribution engine.
 * Supports references: 'selection' (default), 'key_object', and 'wall'.
 */
export function alignAndDistributeItems(
  wall: Wall,
  allItems: WallItem[],
  targetItemIds: string[],
  action: AlignmentMode | DistributionMode,
  options: AlignmentOptions = {}
): WallItem[] {
  const wallWidthCm = wall.lengthM * 100;
  const wallHeightCm = wall.heightM * 100;
  const reference = options.reference || (targetItemIds.length <= 1 ? 'wall' : 'selection');
  const effectiveKeyId = options.keyItemId || options.keyObjectId;
  const keyItem = effectiveKeyId ? allItems.find((it) => it.id === effectiveKeyId) : undefined;

  const targets = allItems.filter(
    (it) => it.wallId === wall.id && targetItemIds.includes(it.id) && !it.locked
  );
  if (targets.length === 0) return allItems;

  const minX = Math.min(...targets.map((t) => t.xCm));
  const maxX = Math.max(...targets.map((t) => t.xCm + t.widthCm));
  const minY = Math.min(...targets.map((t) => t.yCm));
  const maxY = Math.max(...targets.map((t) => t.yCm + t.heightCm));
  const selCenterX = minX + (maxX - minX) / 2;
  const selCenterY = minY + (maxY - minY) / 2;

  const posMap = new Map<string, { xCm?: number; yCm?: number }>();

  // ALIGNMENT ACTIONS
  if (
    action === 'left' ||
    action === 'center-x' ||
    action === 'right' ||
    action === 'top' ||
    action === 'center-y' ||
    action === 'bottom' ||
    action === 'eye-level-150'
  ) {
    if (action === 'center-x' && reference === 'wall' && targets.length > 1) {
      // Center entire group as a whole on the wall
      const groupWidth = maxX - minX;
      const shiftX = (wallWidthCm / 2) - (minX + groupWidth / 2);
      targets.forEach((t) => {
        posMap.set(t.id, { xCm: Number(Math.max(0, t.xCm + shiftX).toFixed(1)) });
      });
    } else {
      targets.forEach((t) => {
        // Skip moving key object if aligning to key object
        if (reference === 'key_object' && keyItem && t.id === keyItem.id) {
          return;
        }

        let newX = t.xCm;
        let newY = t.yCm;

        switch (action) {
          case 'left':
            if (reference === 'wall') newX = 0;
            else if (reference === 'key_object' && keyItem) newX = keyItem.xCm;
            else newX = minX;
            break;
          case 'center-x':
            if (reference === 'wall') newX = (wallWidthCm - t.widthCm) / 2;
            else if (reference === 'key_object' && keyItem)
              newX = keyItem.xCm + (keyItem.widthCm - t.widthCm) / 2;
            else newX = selCenterX - t.widthCm / 2;
            break;
          case 'right':
            if (reference === 'wall') newX = wallWidthCm - t.widthCm;
            else if (reference === 'key_object' && keyItem)
              newX = keyItem.xCm + keyItem.widthCm - t.widthCm;
            else newX = maxX - t.widthCm;
            break;
          case 'top':
            if (reference === 'wall') newY = wallHeightCm - t.heightCm;
            else if (reference === 'key_object' && keyItem)
              newY = keyItem.yCm + keyItem.heightCm - t.heightCm;
            else newY = maxY - t.heightCm;
            break;
          case 'center-y':
            if (reference === 'wall') newY = (wallHeightCm - t.heightCm) / 2;
            else if (reference === 'key_object' && keyItem)
              newY = keyItem.yCm + (keyItem.heightCm - t.heightCm) / 2;
            else newY = selCenterY - t.heightCm / 2;
            break;
          case 'bottom':
            if (reference === 'wall') newY = 0;
            else if (reference === 'key_object' && keyItem) newY = keyItem.yCm;
            else newY = minY;
            break;
          case 'eye-level-150':
            newY = Math.max(0, 150 - t.heightCm / 2);
            break;
        }

        posMap.set(t.id, {
          xCm: Number(newX.toFixed(1)),
          yCm: Number(newY.toFixed(1)),
        });
      });
    }
  }

  // DISTRIBUTION ACTIONS
  else if (action === 'distribute-h-gaps' || action === 'exact-spacing-h') {
    const sorted = [...targets].sort((a, b) => a.xCm - b.xCm);
    if (sorted.length < 2) return allItems;

    const totalWidth = sorted.reduce((sum, item) => sum + item.widthCm, 0);
    const spacing =
      action === 'exact-spacing-h'
        ? Math.max(0, options.exactSpacingCm ?? wall.defaultSpacingCm ?? 10)
        : Math.max(2, (maxX - minX - totalWidth) / (sorted.length - 1));

    if (reference === 'wall') {
      const groupWidth = totalWidth + (sorted.length - 1) * spacing;
      let cursorX = Math.max(0, (wallWidthCm - groupWidth) / 2);
      sorted.forEach((item) => {
        posMap.set(item.id, { xCm: Number(cursorX.toFixed(1)) });
        cursorX += item.widthCm + spacing;
      });
    } else if (reference === 'key_object' && keyItem) {
      const keyIdx = sorted.findIndex((it) => it.id === keyItem.id);
      if (keyIdx !== -1) {
        // Distribute to the right of key object
        let rCursor = keyItem.xCm + keyItem.widthCm + spacing;
        for (let i = keyIdx + 1; i < sorted.length; i++) {
          posMap.set(sorted[i].id, { xCm: Number(rCursor.toFixed(1)) });
          rCursor += sorted[i].widthCm + spacing;
        }
        // Distribute to the left of key object
        let lCursor = keyItem.xCm - spacing;
        for (let i = keyIdx - 1; i >= 0; i--) {
          const itemX = lCursor - sorted[i].widthCm;
          posMap.set(sorted[i].id, { xCm: Number(itemX.toFixed(1)) });
          lCursor = itemX - spacing;
        }
      }
    } else {
      let cursorX = sorted[0].xCm;
      sorted.forEach((item, idx) => {
        if (idx > 0) {
          posMap.set(item.id, { xCm: Number(cursorX.toFixed(1)) });
        }
        cursorX += item.widthCm + spacing;
      });
    }
  } else if (action === 'distribute-v-gaps') {
    const sorted = [...targets].sort((a, b) => a.yCm - b.yCm);
    if (sorted.length < 2) return allItems;

    const totalHeight = sorted.reduce((sum, item) => sum + item.heightCm, 0);
    const gap = Math.max(2, (maxY - minY - totalHeight) / (sorted.length - 1));
    let cursorY = sorted[0].yCm;
    sorted.forEach((item, idx) => {
      if (idx > 0) {
        posMap.set(item.id, { yCm: Number(cursorY.toFixed(1)) });
      }
      cursorY += item.heightCm + gap;
    });
  }

  return allItems.map((it) => {
    const patch = posMap.get(it.id);
    if (!patch) return it;
    return {
      ...it,
      xCm: patch.xCm !== undefined ? patch.xCm : it.xCm,
      yCm: patch.yCm !== undefined ? patch.yCm : it.yCm,
    };
  });
}

/**
 * Assigns or groups selected items under a common groupId.
 */
export function groupWallItems(
  allItems: WallItem[],
  targetItemIds: string[],
  customGroupId?: string
): WallItem[] {
  const gId = customGroupId || `group-${Date.now()}`;
  return allItems.map((it) =>
    targetItemIds.includes(it.id) ? { ...it, groupId: gId } : it
  );
}

/**
 * Ungroups selected items by removing their groupId.
 */
export function ungroupWallItems(
  allItems: WallItem[],
  targetItemIds: string[]
): WallItem[] {
  return allItems.map((it) =>
    targetItemIds.includes(it.id) ? { ...it, groupId: undefined } : it
  );
}

/**
 * Automatically distributes target items horizontally across the wall with uniform equal margins.
 */
export function distributeHorizontallyUniform(
  wall: Wall,
  allItems: WallItem[],
  targetItemIds: string[]
): WallItem[] {
  const wallWidthCm = wall.lengthM * 100;
  const targets = allItems
    .filter((it) => it.wallId === wall.id && targetItemIds.includes(it.id) && !it.locked)
    .sort((a, b) => a.xCm - b.xCm);

  if (targets.length === 0) return allItems;

  const totalItemsWidth = targets.reduce((acc, it) => acc + it.widthCm, 0);
  const gap = Math.max(2, (wallWidthCm - totalItemsWidth) / (targets.length + 1));

  let cursorX = gap;
  const posMap = new Map<string, number>();
  for (const t of targets) {
    posMap.set(t.id, Number(cursorX.toFixed(1)));
    cursorX += t.widthCm + gap;
  }

  return allItems.map((it) =>
    posMap.has(it.id) ? { ...it, xCm: posMap.get(it.id)! } : it
  );
}

/**
 * Distributes target items horizontally with a fixed separation (in cm) and centers the ensemble on the wall.
 */
export function distributeWithExactSpacing(
  wall: Wall,
  allItems: WallItem[],
  targetItemIds: string[],
  spacingCm: number,
  centerEyeLevelCm?: number
): WallItem[] {
  const wallWidthCm = wall.lengthM * 100;
  const targets = allItems
    .filter((it) => it.wallId === wall.id && targetItemIds.includes(it.id) && !it.locked)
    .sort((a, b) => a.xCm - b.xCm);

  if (targets.length === 0) return allItems;

  const totalItemsWidth = targets.reduce((acc, it) => acc + it.widthCm, 0);
  const totalGroupWidth = totalItemsWidth + Math.max(0, targets.length - 1) * spacingCm;
  let cursorX = Math.max(0, (wallWidthCm - totalGroupWidth) / 2);

  const posMap = new Map<string, { x: number; y?: number }>();
  for (const t of targets) {
    const newY =
      centerEyeLevelCm !== undefined
        ? Math.max(0, Number((centerEyeLevelCm - t.heightCm / 2).toFixed(1)))
        : undefined;
    posMap.set(t.id, { x: Number(cursorX.toFixed(1)), y: newY });
    cursorX += t.widthCm + spacingCm;
  }

  return allItems.map((it) => {
    const p = posMap.get(it.id);
    if (!p) return it;
    return {
      ...it,
      xCm: p.x,
      yCm: p.y !== undefined ? p.y : it.yCm,
    };
  });
}

/**
 * Distributes target items vertically across the wall or between their current top/bottom bounds.
 */
export function distributeVerticallyUniform(
  wall: Wall,
  allItems: WallItem[],
  targetItemIds: string[]
): WallItem[] {
  const wallHeightCm = wall.heightM * 100;
  const targets = allItems
    .filter((it) => it.wallId === wall.id && targetItemIds.includes(it.id) && !it.locked)
    .sort((a, b) => a.yCm - b.yCm);

  if (targets.length < 2) return allItems;

  const totalHeight = targets.reduce((acc, it) => acc + it.heightCm, 0);
  const usableHeight = Math.min(wallHeightCm - 40, Math.max(totalHeight + 20, 180));
  const startY = Math.max(20, (wallHeightCm - usableHeight) / 2);
  const gap = Math.max(4, (usableHeight - totalHeight) / (targets.length + 1));

  let cursorY = startY + gap;
  const posMap = new Map<string, number>();
  for (const t of targets) {
    posMap.set(t.id, Number(cursorY.toFixed(1)));
    cursorY += t.heightCm + gap;
  }

  return allItems.map((it) =>
    posMap.has(it.id) ? { ...it, yCm: posMap.get(it.id)! } : it
  );
}

/**
 * Aligns multiple items by their edges or centers.
 */
export function alignWallItems(
  wall: Wall,
  allItems: WallItem[],
  targetItemIds: string[],
  mode: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom' | 'eye-level-150'
): WallItem[] {
  const targets = allItems.filter(
    (it) => it.wallId === wall.id && targetItemIds.includes(it.id) && !it.locked
  );
  if (targets.length === 0) return allItems;

  const minX = Math.min(...targets.map((t) => t.xCm));
  const maxX = Math.max(...targets.map((t) => t.xCm + t.widthCm));
  const minY = Math.min(...targets.map((t) => t.yCm));
  const maxY = Math.max(...targets.map((t) => t.yCm + t.heightCm));
  const avgCenterY =
    targets.reduce((acc, t) => acc + (t.yCm + t.heightCm / 2), 0) / targets.length;
  const wallCenterX = (wall.lengthM * 100) / 2;

  // If centering the entire group horizontally on the wall
  if (mode === 'center-x') {
    const groupWidth = maxX - minX;
    const shiftX = wallCenterX - (minX + groupWidth / 2);
    const idSet = new Set(targets.map((t) => t.id));
    return allItems.map((it) =>
      idSet.has(it.id) ? { ...it, xCm: Number(Math.max(0, it.xCm + shiftX).toFixed(1)) } : it
    );
  }

  const idSet = new Set(targets.map((t) => t.id));
  return allItems.map((it) => {
    if (!idSet.has(it.id)) return it;
    switch (mode) {
      case 'left':
        return { ...it, xCm: Number(minX.toFixed(1)) };
      case 'right':
        return { ...it, xCm: Number((maxX - it.widthCm).toFixed(1)) };
      case 'top':
        return { ...it, yCm: Number((maxY - it.heightCm).toFixed(1)) };
      case 'bottom':
        return { ...it, yCm: Number(minY.toFixed(1)) };
      case 'center-y':
        return { ...it, yCm: Number((avgCenterY - it.heightCm / 2).toFixed(1)) };
      case 'eye-level-150':
        return { ...it, yCm: Number(Math.max(0, 150 - it.heightCm / 2).toFixed(1)) };
      default:
        return it;
    }
  });
}

/**
 * Auto-fixes all boundary overflows and overlaps on a wall by fitting items cleanly inside the wall.
 */
export function autoFixWallIssues(wall: Wall, allItems: WallItem[]): WallItem[] {
  const wallItems = allItems
    .filter((it) => it.wallId === wall.id && it.visible)
    .sort((a, b) => a.xCm - b.xCm);

  if (wallItems.length === 0) return allItems;

  return distributeWithExactSpacing(
    wall,
    allItems,
    wallItems.map((i) => i.id),
    wall.defaultSpacingCm || 10,
    145
  );
}

/**
 * Creates a new wall segment with automatic vertex reuse if endpoints snap to existing vertices.
 */
export function createWallSegment(
  walls: Wall[],
  vertices: Vertex[],
  options: {
    spaceId: string;
    name: string;
    participant?: string;
    startPt: { x: number; y: number };
    endPt: { x: number; y: number };
    heightM?: number;
    thicknessCm?: number;
    material?: any;
    color?: string;
    source?: 'manual' | 'drawn' | 'dimension' | 'perimeter';
    snapToleranceM?: number;
  }
): { walls: Wall[]; vertices: Vertex[]; createdWall: Wall } {
  const snapTol = options.snapToleranceM ?? 0.15;
  const nextVertices = [...vertices];

  // Check snap for start vertex
  let startVid = '';
  const nearbyStart = nextVertices.find(
    (v) => Math.hypot(v.x - options.startPt.x, v.y - options.startPt.y) <= snapTol
  );
  if (nearbyStart) {
    startVid = nearbyStart.id;
  } else {
    startVid = `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    nextVertices.push({
      id: startVid,
      x: Number(options.startPt.x.toFixed(3)),
      y: Number(options.startPt.y.toFixed(3)),
    });
  }

  // Check snap for end vertex
  let endVid = '';
  const nearbyEnd = nextVertices.find(
    (v) =>
      v.id !== startVid &&
      Math.hypot(v.x - options.endPt.x, v.y - options.endPt.y) <= snapTol
  );
  if (nearbyEnd) {
    endVid = nearbyEnd.id;
  } else {
    endVid = `v-${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`;
    nextVertices.push({
      id: endVid,
      x: Number(options.endPt.x.toFixed(3)),
      y: Number(options.endPt.y.toFixed(3)),
    });
  }

  const vS = nextVertices.find((v) => v.id === startVid)!;
  const vE = nextVertices.find((v) => v.id === endVid)!;
  const dist = Math.max(0.2, Number(Math.hypot(vE.x - vS.x, vE.y - vS.y).toFixed(2)));

  const dx = Math.abs(vE.x - vS.x);
  const dy = Math.abs(vE.y - vS.y);
  let orientation: 'horizontal' | 'vertical' | 'angled' = 'angled';
  if (dy < 0.05 && dx >= 0.05) orientation = 'horizontal';
  else if (dx < 0.05 && dy >= 0.05) orientation = 'vertical';

  const newWallId = `wall-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const createdWall: Wall = {
    id: newWallId,
    zoneId: options.spaceId,
    name: options.name,
    participant: options.participant || 'General',
    startVertexId: startVid,
    endVertexId: endVid,
    lengthM: dist,
    heightM: options.heightM ?? 2.6,
    heightConfirmed: true,
    thicknessCm: options.thicknessCm ?? 15,
    color: options.color || '#FFFFFF',
    material: options.material || 'white',
    visible: true,
    locked: false,
    orientation,
    normalSide: 'top',
    defaultSpacingCm: 10,
    source: options.source || 'drawn',
  };

  return {
    walls: [...walls, createdWall],
    vertices: nextVertices,
    createdWall,
  };
}

/**
 * Splits an existing wall into two contiguous wall segments at the given ratio (default midpoint).
 */
export function splitWallSegment(
  walls: Wall[],
  vertices: Vertex[],
  items: WallItem[],
  wallId: string,
  splitRatio = 0.5
): { walls: Wall[]; vertices: Vertex[]; items: WallItem[]; newWallId: string } | null {
  const targetWall = walls.find((w) => w.id === wallId);
  if (!targetWall) return null;

  const vStart = vertices.find((v) => v.id === targetWall.startVertexId);
  const vEnd = vertices.find((v) => v.id === targetWall.endVertexId);
  if (!vStart || !vEnd) return null;

  const ratio = Math.max(0.1, Math.min(0.9, splitRatio));
  const midX = Number((vStart.x + (vEnd.x - vStart.x) * ratio).toFixed(3));
  const midY = Number((vStart.y + (vEnd.y - vStart.y) * ratio).toFixed(3));

  const midVertexId = `v-mid-${Date.now()}`;
  const newVertices: Vertex[] = [
    ...vertices,
    { id: midVertexId, x: midX, y: midY, label: 'Mid' },
  ];

  const firstLength = Number((targetWall.lengthM * ratio).toFixed(2));
  const secondLength = Number((targetWall.lengthM * (1 - ratio)).toFixed(2));

  const secondWallId = `wall-${Date.now()}-part2`;
  const updatedFirstWall: Wall = {
    ...targetWall,
    endVertexId: midVertexId,
    lengthM: firstLength,
    name: `${targetWall.name} (Parte 1)`,
  };

  const secondWall: Wall = {
    ...targetWall,
    id: secondWallId,
    startVertexId: midVertexId,
    endVertexId: targetWall.endVertexId,
    lengthM: secondLength,
    name: `${targetWall.name} (Parte 2)`,
  };

  const nextWalls = walls.map((w) => (w.id === wallId ? updatedFirstWall : w));
  nextWalls.push(secondWall);

  // Re-distribute items: items located beyond split point go to second wall
  const splitCutCm = firstLength * 100;
  const nextItems = items.map((it) => {
    if (it.wallId !== wallId) return it;
    if (it.xCm >= splitCutCm) {
      return {
        ...it,
        wallId: secondWallId,
        xCm: Number(Math.max(10, it.xCm - splitCutCm).toFixed(1)),
      };
    }
    return it;
  });

  return {
    walls: nextWalls,
    vertices: newVertices,
    items: nextItems,
    newWallId: secondWallId,
  };
}

/**
 * Duplicates a wall with a parallel offset.
 */
export function duplicateWallOffset(
  walls: Wall[],
  vertices: Vertex[],
  wallId: string,
  offsetM = 0.5
): { walls: Wall[]; vertices: Vertex[]; duplicatedWall: Wall } | null {
  const targetWall = walls.find((w) => w.id === wallId);
  if (!targetWall) return null;

  const vStart = vertices.find((v) => v.id === targetWall.startVertexId);
  const vEnd = vertices.find((v) => v.id === targetWall.endVertexId);
  if (!vStart || !vEnd) return null;

  const dx = vEnd.x - vStart.x;
  const dy = vEnd.y - vStart.y;
  const dist = Math.hypot(dx, dy) || 1;
  // Perpendicular unit vector
  const nx = -dy / dist;
  const ny = dx / dist;

  const newStartVid = `v-${Date.now()}-dup1`;
  const newEndVid = `v-${Date.now()}-dup2`;

  const newVertices: Vertex[] = [
    ...vertices,
    {
      id: newStartVid,
      x: Number((vStart.x + nx * offsetM).toFixed(3)),
      y: Number((vStart.y + ny * offsetM).toFixed(3)),
    },
    {
      id: newEndVid,
      x: Number((vEnd.x + nx * offsetM).toFixed(3)),
      y: Number((vEnd.y + ny * offsetM).toFixed(3)),
    },
  ];

  const newWallId = `wall-${Date.now()}-dup`;
  const duplicatedWall: Wall = {
    ...targetWall,
    id: newWallId,
    name: `${targetWall.name} (Copia)`,
    startVertexId: newStartVid,
    endVertexId: newEndVid,
  };

  return {
    walls: [...walls, duplicatedWall],
    vertices: newVertices,
    duplicatedWall,
  };
}

/**
 * Generates rectangular room walls for a space.
 */
export function generateRoomGeometry(
  spaceId: string,
  spaceName: string,
  participant: string,
  widthM: number,
  lengthM: number,
  originX = 2.0,
  originY = 2.0,
  activeSegments = [true, true, true, true] // [Norte, Este, Sur, Oeste]
): { walls: Wall[]; vertices: Vertex[] } {
  const ts = Date.now();
  const vA = { id: `v-${ts}-A`, x: originX, y: originY };
  const vB = { id: `v-${ts}-B`, x: originX + widthM, y: originY };
  const vC = { id: `v-${ts}-C`, x: originX + widthM, y: originY + lengthM };
  const vD = { id: `v-${ts}-D`, x: originX, y: originY + lengthM };

  const vertices = [vA, vB, vC, vD];
  const walls: Wall[] = [];

  const segmentDefs = [
    { start: vA, end: vB, name: 'Muro Norte (Frontal)', orient: 'horizontal' as const, len: widthM },
    { start: vB, end: vC, name: 'Muro Este (Lateral Der.)', orient: 'vertical' as const, len: lengthM },
    { start: vC, end: vD, name: 'Muro Sur (Posterior)', orient: 'horizontal' as const, len: widthM },
    { start: vD, end: vA, name: 'Muro Oeste (Lateral Izq.)', orient: 'vertical' as const, len: lengthM },
  ];

  segmentDefs.forEach((def, idx) => {
    if (activeSegments[idx]) {
      walls.push({
        id: `wall-${ts}-${idx}`,
        zoneId: spaceId,
        name: `${spaceName} - ${def.name}`,
        participant,
        startVertexId: def.start.id,
        endVertexId: def.end.id,
        lengthM: Number(def.len.toFixed(2)),
        heightM: 2.6,
        heightConfirmed: true,
        thicknessCm: 15,
        color: '#FFFFFF',
        material: 'white',
        visible: true,
        locked: false,
        orientation: def.orient,
        normalSide: 'top',
        defaultSpacingCm: 10,
        source: 'perimeter',
      });
    }
  });

  return { walls, vertices };
}
