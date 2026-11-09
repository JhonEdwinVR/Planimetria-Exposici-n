import { Wall } from '../types/exhibition';

/**
 * Returns the opposite cardinal facing direction for a wall or artwork.
 */
export const getOppositeSide = (
  side: 'top' | 'bottom' | 'left' | 'right'
): 'top' | 'bottom' | 'left' | 'right' => {
  if (side === 'top') return 'bottom';
  if (side === 'bottom') return 'top';
  if (side === 'left') return 'right';
  return 'left';
};

/**
 * Finds the linked counterpart wall (opposite face of a double-sided wall).
 *
 * Prioritizes:
 * 1. Direct explicit link (`w.id === wall.linkedWallId`)
 * 2. Inverse explicit link (`w.linkedWallId === wall.id`)
 * 3. Shared geometric vertices in both forward and reversed orientation,
 *    ensuring the thickness is consistent with a physical structural wall.
 */
export function getLinkedWall(
  wall: Wall | null | undefined,
  allWalls: Wall[]
): Wall | undefined {
  if (!wall || !allWalls || allWalls.length === 0) return undefined;

  // 1. Direct link: wall points directly to its opposite face
  if (wall.linkedWallId) {
    const directMatch = allWalls.find(
      (w) => w.id === wall.linkedWallId && w.id !== wall.id
    );
    if (directMatch) return directMatch;
  }

  // 2. Inverse link: another wall references this wall as its linked counterpart
  const inverseMatch = allWalls.find(
    (w) => w.id !== wall.id && w.linkedWallId === wall.id
  );
  if (inverseMatch) return inverseMatch;

  // 3. Fallback: shared geometric vertices (forward or reversed)
  if (wall.startVertexId && wall.endVertexId) {
    return allWalls.find(
      (other) =>
        other.id !== wall.id &&
        ((other.startVertexId === wall.startVertexId &&
          other.endVertexId === wall.endVertexId) ||
          (other.startVertexId === wall.endVertexId &&
            other.endVertexId === wall.startVertexId))
    );
  }

  return undefined;
}

/**
 * Determines whether the given wall is Cara B (the secondary or opposite face).
 */
export function isWallFaceB(wall: Wall, linkedWall?: Wall): boolean {
  if (!wall) return false;

  // Check explicit faceLabel first
  if (wall.faceLabel) {
    if (wall.faceLabel.includes('Cara B') || wall.faceLabel.includes('Posterior') || wall.faceLabel.includes('Contracara')) {
      return true;
    }
    if (wall.faceLabel.includes('Cara A') || wall.faceLabel.includes('Frontal')) {
      return false;
    }
  }

  // If the linked wall has an explicit label, infer from it
  if (linkedWall?.faceLabel) {
    if (linkedWall.faceLabel.includes('Cara A') || linkedWall.faceLabel.includes('Frontal')) {
      return true;
    }
    if (linkedWall.faceLabel.includes('Cara B') || linkedWall.faceLabel.includes('Posterior') || linkedWall.faceLabel.includes('Contracara')) {
      return false;
    }
  }

  // Fallback heuristic: generated IDs for rear face start with 'wall-back-'
  if (wall.id.startsWith('wall-back-')) return true;
  if (linkedWall?.id.startsWith('wall-back-')) return false;

  // Name check fallback
  if (wall.name.toLowerCase().includes('contracara')) return true;
  if (linkedWall?.name.toLowerCase().includes('contracara')) return false;

  return false;
}

/**
 * Returns all walls belonging to the physical partition group (both Cara A and Cara B if double-sided).
 */
export function getPhysicalWallGroup(wall: Wall, allWalls: Wall[]): Wall[] {
  if (!wall) return [];
  const linked = getLinkedWall(wall, allWalls);
  return linked ? [wall, linked] : [wall];
}
