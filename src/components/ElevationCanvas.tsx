import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Upload,
  Link2,
  Type,
  Heading,
  FileText,
  Frame,
  RectangleVertical,
  Lamp,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  SlidersHorizontal,
  Wand2,
  ChevronDown,
  Package,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUp,
  ArrowDown,
  Key,
  Group,
  Ungroup,
  MoveHorizontal,
  MoveVertical,
} from 'lucide-react';
import { optimizeImageFile } from '../utils/imageOptimization';
import { parseDxfToSvg } from '../utils/dxfParser';
import {
  GraphicResource,
  ItemType,
  LayerKey,
  LayerState,
  LayerVisibility,
  TextBlockType,
  ValidationIssue,
  Wall,
  WallItem,
  WallMaterial,
  Zone,
} from '../types/exhibition';
import { createArtworkSvgDataUrl } from '../data/initialProject';
import { GraphicLibraryDrawer } from './GraphicLibraryDrawer';
import {
  AlignmentMode,
  DistributionMode,
  AlignmentReferenceMode,
  AlignmentOptions,
  alignAndDistributeItems,
  groupWallItems,
  ungroupWallItems,
} from '../utils/geometryAndValidation';
import { getLinkedWall, isWallFaceB } from '../utils/wallHelpers';

export type WallFilterMode = 'with_artworks' | 'with_content' | 'all';

interface ElevationCanvasProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  wall: Wall;
  allWalls: Wall[];
  items: WallItem[];
  zones?: Zone[];
  wallFilterMode?: WallFilterMode;
  onSetWallFilterMode?: (mode: WallFilterMode) => void;
  layers: LayerVisibility;
  layerStates?: LayerState[];
  graphicResources?: GraphicResource[];
  selectedItemIds: string[];
  validationIssues: ValidationIssue[];
  isDark: boolean;
  isPresentationMode?: boolean;
  onBackToPlan: () => void;
  onSwitchWall: (wallId: string) => void;
  onOpenSpaceAdmin?: () => void;
  onSelectItem: (itemId: string, multi?: boolean) => void;
  onClearSelection: () => void;
  onUpdateItem: (
    itemId: string,
    patch: Partial<WallItem>,
    recordHistory?: boolean
  ) => void;
  onAddItem: (newItem: Omit<WallItem, 'id'>) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onDistributeUniformH: () => void;
  onDistributeFixedSpacing: (spacingCm: number) => void;
  onDistributeUniformV: () => void;
  onAlignItems: (
    mode:
      | 'left'
      | 'center-x'
      | 'right'
      | 'top'
      | 'center-y'
      | 'bottom'
      | 'eye-level-150'
  ) => void;
  onAlignAndDistribute?: (
    action: AlignmentMode | DistributionMode,
    options?: AlignmentOptions
  ) => void;
  onGroupSelected?: () => void;
  onUngroupSelected?: () => void;
  onAutoFixWall: () => void;
  onToggleLayerState?: (layerId: LayerKey) => void;
  onToggleLayerLock?: (layerId: LayerKey) => void;
  onImportGraphicResources?: (newResources: GraphicResource[]) => void;
  onOpenMultiWallView?: (artistName: string, wallIds?: string[]) => void;
}

const PX_PER_CM = 2.4;

function getWallFill(material: WallMaterial, customColor: string): string {
  switch (material) {
    case 'white':
      return '#FFFFFF';
    case 'gray':
      return '#E5E5E5';
    case 'black':
      return '#171717';
    case 'concrete':
      return 'url(#pat-concrete)';
    case 'brick':
      return 'url(#pat-brick)';
    case 'parchment':
      return 'url(#pat-parchment)';
    case 'wood':
      return 'url(#pat-wood)';
    case 'custom':
      return customColor || '#FFFFFF';
    default:
      return '#FFFFFF';
  }
}

function mapCategoryToLayer(category?: string, itemType?: ItemType): LayerKey {
  if (category) {
    if (category.startsWith('people')) return 'people';
    if (category === 'vitrines' || category === 'pedestals' || category === 'sculptures') return 'objects';
    if (category === 'furniture') return 'furniture';
    if (category === 'artworks' || category === 'frames') return 'artworks';
    if (category === 'signage') return 'texts';
    if (category === 'architecture') return 'architecture';
    if (category === 'decor') return 'decor';
  }
  if (itemType === 'text' || itemType === 'title' || itemType === 'description') return 'texts';
  if (itemType === 'decor') return 'decor';
  if (itemType === 'reference') return 'references';
  return 'artworks';
}

export const ElevationCanvas: React.FC<ElevationCanvasProps> = ({
  svgRef,
  wall,
  allWalls,
  items,
  zones = [],
  wallFilterMode,
  onSetWallFilterMode,
  layers,
  layerStates,
  graphicResources = [],
  selectedItemIds,
  validationIssues,
  isPresentationMode = false,
  onBackToPlan,
  onSwitchWall,
  onOpenSpaceAdmin,
  onSelectItem,
  onClearSelection,
  onUpdateItem,
  onAddItem,
  onDuplicateSelected,
  onDeleteSelected,
  onDistributeUniformH,
  onDistributeFixedSpacing,
  onDistributeUniformV,
  onAlignItems,
  onAlignAndDistribute,
  onGroupSelected,
  onUngroupSelected,
  onAutoFixWall,
  onToggleLayerState,
  onToggleLayerLock,
  onImportGraphicResources,
  onOpenMultiWallView,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [libraryDrawerOpen, setLibraryDrawerOpen] = useState(false);

  const [urlPromptOpen, setUrlPromptOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Alignment, Distribution & Key Object State
  const [alignReference, setAlignReference] = useState<AlignmentReferenceMode>('selection');
  const [keyObjectId, setKeyObjectId] = useState<string | null>(null);
  const [exactSpacingInput, setExactSpacingInput] = useState<number>(wall.defaultSpacingCm || 10);

  // Smart Guides State
  const [activeGuides, setActiveGuides] = useState<
    { type: 'vertical' | 'horizontal'; posCm: number; label: string }[]
  >([]);

  // Ghost Placement Engine State (Module 7: Precisión de colocación del cursor)
  const [placementItem, setPlacementItem] = useState<Omit<WallItem, 'id'> | null>(null);
  const [cursorPosCm, setCursorPosCm] = useState<{
    xCm: number;
    yCm: number;
    snappedX: boolean;
    snappedY: boolean;
    snapLabel?: string;
  }>({ xCm: 0, yCm: 0, snappedX: false, snappedY: false });
  const [magneticSnapEnabled, setMagneticSnapEnabled] = useState(true);

  // Marquee Selection Box State
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);

  const [dragState, setDragState] = useState<{
    itemId: string;
    mode: 'move' | 'resize-br';
    startClientX: number;
    startClientY: number;
    initialXCm: number;
    initialYCm: number;
    initialWCm: number;
    initialHCm: number;
    aspectRatio: number;
    initialMultiPositions?: { id: string; xCm: number; yCm: number }[];
  } | null>(null);

  // Review Mode Filter State ('with_artworks' | 'with_content' | 'all') with persistence
  const [localWallFilter, setLocalWallFilter] = useState<WallFilterMode>('with_artworks');
  const wallFilter = wallFilterMode !== undefined ? wallFilterMode : localWallFilter;
  const setWallFilter = (mode: WallFilterMode) => {
    if (onSetWallFilterMode) {
      onSetWallFilterMode(mode);
    } else {
      setLocalWallFilter(mode);
    }
  };

  // Zones lookup map
  const zonesMap = React.useMemo(() => {
    const map = new Map<string, Zone>();
    (zones || []).forEach((z) => map.set(z.id, z));
    return map;
  }, [zones]);

  // Wall items and artworks count map
  const wallStatsMap = React.useMemo(() => {
    const map = new Map<string, { artworks: number; content: number }>();
    allWalls.forEach((w) => map.set(w.id, { artworks: 0, content: 0 }));
    items.forEach((it) => {
      if (!it.visible) return;
      const stats = map.get(it.wallId);
      if (stats) {
        stats.content += 1;
        const isArt =
          it.type === 'photo' ||
          it.type === 'frame' ||
          it.type === 'portrait_stand' ||
          it.category === 'artworks';
        if (isArt) {
          stats.artworks += 1;
        }
      }
    });
    return map;
  }, [allWalls, items]);

  // Identify current wall's linked counterpart (opposite face)
  const currentLinkedWall = React.useMemo(
    () => getLinkedWall(wall, allWalls),
    [wall, allWalls]
  );

  // Identify all walls belonging to current participant that have artworks or active content
  const currentParticipant = wall.participant;
  const artistWallsWithArt = React.useMemo(() => {
    if (!currentParticipant) return [];
    return allWalls.filter((w) => {
      const matchP =
        (w.participant &&
          w.participant.trim().toLowerCase() === currentParticipant.trim().toLowerCase()) ||
        (w.secondaryParticipant &&
          w.secondaryParticipant.trim().toLowerCase() === currentParticipant.trim().toLowerCase()) ||
        w.name.toLowerCase().includes(currentParticipant.toLowerCase().trim());
      if (!matchP) return false;
      const stats = wallStatsMap.get(w.id);
      return stats && (stats.artworks > 0 || stats.content > 0);
    });
  }, [allWalls, currentParticipant, wallStatsMap]);

  // Group walls into distinct physical partitions (deduplicating double-sided walls)
  const physicalPartitions = React.useMemo(() => {
    const visited = new Set<string>();
    const list: {
      partitionKey: string;
      zoneId: string;
      zoneName: string;
      zoneOrder: number;
      wallA: Wall;
      wallB: Wall | null;
      artworksCount: number;
      contentCount: number;
    }[] = [];

    allWalls.forEach((w) => {
      if (visited.has(w.id)) return;
      const linked = getLinkedWall(w, allWalls);
      const partitionKey = linked
        ? [w.id, linked.id].sort().join('::')
        : w.id;

      visited.add(w.id);
      if (linked) visited.add(linked.id);

      const zone = zonesMap.get(w.zoneId);
      const statsA = wallStatsMap.get(w.id) || { artworks: 0, content: 0 };
      const statsB = linked ? wallStatsMap.get(linked.id) : null;
      const artworksCount = statsA.artworks + (statsB ? statsB.artworks : 0);
      const contentCount = statsA.content + (statsB ? statsB.content : 0);

      list.push({
        partitionKey,
        zoneId: w.zoneId,
        zoneName: zone?.name || w.participant || 'General',
        zoneOrder: zone?.order ?? 999,
        wallA: w,
        wallB: linked || null,
        artworksCount,
        contentCount,
      });
    });

    return list;
  }, [allWalls, zonesMap, wallStatsMap]);

  // Overall partition counts for review mode tabs
  const partitionCounts = React.useMemo(() => {
    let withArtworks = 0;
    let withContent = 0;
    physicalPartitions.forEach((p) => {
      if (p.artworksCount > 0) withArtworks++;
      if (p.contentCount > 0) withContent++;
    });
    return {
      withArtworks,
      withContent,
      all: physicalPartitions.length,
    };
  }, [physicalPartitions]);

  // Filter partitions by active review mode
  const filteredPartitions = React.useMemo(() => {
    return physicalPartitions.filter((p) => {
      if (wallFilter === 'with_artworks') {
        return p.artworksCount > 0;
      }
      if (wallFilter === 'with_content') {
        return p.contentCount > 0;
      }
      return true;
    });
  }, [physicalPartitions, wallFilter]);

  // Group filtered partitions by Sector/Zone in order
  const groupedSectors = React.useMemo(() => {
    const map = new Map<
      string,
      {
        zoneId: string;
        zoneName: string;
        zoneOrder: number;
        partitions: typeof physicalPartitions;
      }
    >();

    filteredPartitions.forEach((p) => {
      if (!map.has(p.zoneId)) {
        map.set(p.zoneId, {
          zoneId: p.zoneId,
          zoneName: p.zoneName,
          zoneOrder: p.zoneOrder,
          partitions: [],
        });
      }
      map.get(p.zoneId)!.partitions.push(p);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.zoneOrder !== b.zoneOrder) return a.zoneOrder - b.zoneOrder;
      return a.zoneName.localeCompare(b.zoneName);
    });
  }, [filteredPartitions]);

  // Handle explicit filter tab button clicks
  const handleFilterTabClick = (newMode: WallFilterMode) => {
    setWallFilter(newMode);
    if (newMode !== 'all') {
      const currentStats = wallStatsMap.get(wall.id) || { artworks: 0, content: 0 };
      const meetsCriteria =
        newMode === 'with_artworks'
          ? currentStats.artworks > 0
          : currentStats.content > 0;
      if (!meetsCriteria) {
        const valid = physicalPartitions.filter((p) =>
          newMode === 'with_artworks' ? p.artworksCount > 0 : p.contentCount > 0
        );
        if (valid.length > 0) {
          onSwitchWall(valid[0].wallA.id);
        }
      }
    }
  };

  // If the active wall belongs to a broader category (e.g. content only or empty),
  // gracefully promote the filter mode so the wall remains selected and visible without reverting!
  useEffect(() => {
    const currentStats = wallStatsMap.get(wall.id) || { artworks: 0, content: 0 };
    if (wallFilter === 'with_artworks' && currentStats.artworks === 0) {
      if (currentStats.content > 0) {
        setWallFilter('with_content');
      } else {
        setWallFilter('all');
      }
    } else if (wallFilter === 'with_content' && currentStats.content === 0) {
      setWallFilter('all');
    }
  }, [wall.id, wallStatsMap, wallFilter]);

  const wallWidthCm = Math.round(wall.lengthM * 100);
  const wallHeightCm = Math.round(wall.heightM * 100);

  // Filter items on this wall
  const wallItems = items.filter((it) => it.wallId === wall.id && it.visible);
  const wallIssues = validationIssues.filter((iss) => iss.wallId === wall.id);

  // Layer visibility map
  const layerVisibilityMap = React.useMemo(() => {
    const map = new Map<LayerKey, boolean>();
    if (layerStates) {
      layerStates.forEach((l) => map.set(l.id, l.visible));
    } else {
      map.set('architecture', true);
      map.set('artworks', layers.photos);
      map.set('people', true);
      map.set('furniture', true);
      map.set('objects', true);
      map.set('texts', layers.texts);
      map.set('decor', layers.decor);
      map.set('dimensions', layers.dimensions);
      map.set('references', true);
    }
    return map;
  }, [layerStates, layers]);

  const layerLockedMap = React.useMemo(() => {
    const map = new Map<LayerKey, boolean>();
    if (layerStates) {
      layerStates.forEach((l) => map.set(l.id, l.locked));
    }
    return map;
  }, [layerStates]);

  const fitWallToScreen = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const wPx = wallWidthCm * PX_PER_CM;
    const hPx = wallHeightCm * PX_PER_CM;
    const fitZ = Math.min(
      1.3,
      Math.max(0.42, Math.min((rect.width - 180) / wPx, (rect.height - 180) / hPx))
    );
    setZoom(Number(fitZ.toFixed(2)));
    setPan({
      x: Math.round((rect.width - wPx * fitZ) / 2),
      y: Math.round((rect.height - hPx * fitZ) / 2),
    });
  };

  useEffect(() => {
    fitWallToScreen();
  }, [wall.id, wallWidthCm, wallHeightCm]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const nextZoom = Math.min(2.5, Math.max(0.3, Number((zoom + delta).toFixed(2))));
    // Anchor zoom to cursor position so the point under the mouse stays fixed
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const scale = nextZoom / zoom;
    setPan((prev) => ({
      x: Math.round(mouseX - (mouseX - prev.x) * scale),
      y: Math.round(mouseY - (mouseY - prev.y) * scale),
    }));
    setZoom(nextZoom);
  };

  const handleButtonZoom = (delta: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nextZoom = Math.min(2.5, Math.max(0.3, Number((zoom + delta).toFixed(2))));
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const scale = nextZoom / zoom;
    setPan((prev) => ({
      x: Math.round(centerX - (centerX - prev.x) * scale),
      y: Math.round(centerY - (centerY - prev.y) * scale),
    }));
    setZoom(nextZoom);
  };

  // Cancel placement on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && placementItem) {
        setPlacementItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placementItem]);

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    // If in Ghost Placement Mode, clicking on the canvas confirms item placement
    if (placementItem) {
      onAddItem({
        ...placementItem,
        xCm: cursorPosCm.xCm,
        yCm: cursorPosCm.yCm,
      });
      setPlacementItem(null);
      return;
    }

    if (dragState) return;

    // Pan with Spacebar, Middle Click, Alt key, or Ctrl+drag
    if (isSpacePressed || e.button === 1 || e.altKey || (e.buttons & 4)) {
      onClearSelection();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return;

    // Otherwise Marquee Selection
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
      onClearSelection();
      setKeyObjectId(null);
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setMarquee({
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });
    setIsMarqueeActive(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 0. Ghost Placement Mode Tracking (Module 7: Precisión de colocación del cursor)
    if (placementItem && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseXPx = (e.clientX - rect.left - pan.x) / zoom;
      const mouseYPx = (e.clientY - rect.top - pan.y) / zoom;
      const rawXCm = mouseXPx / PX_PER_CM;
      const rawYCm = (wallHeightCm * PX_PER_CM - mouseYPx) / PX_PER_CM;

      let targetX = Math.round(rawXCm - placementItem.widthCm / 2);
      let targetY = Math.round(rawYCm - placementItem.heightCm / 2);

      let snappedX = false;
      let snappedY = false;
      let snapLabel: string | undefined = undefined;

      const isFloorItem =
        placementItem.category?.startsWith('people') ||
        placementItem.category === 'furniture' ||
        placementItem.category === 'pedestals' ||
        placementItem.category === 'sculptures';

      if (isFloorItem) {
        targetY = 0;
        snappedY = true;
        snapLabel = 'Fijado al suelo (0 cm)';
      }

      const snapActive = magneticSnapEnabled && !e.altKey;
      if (snapActive && !isFloorItem) {
        const SNAP_THRESHOLD = 8;
        const itemCenterX = targetX + placementItem.widthCm / 2;
        const itemCenterY = targetY + placementItem.heightCm / 2;

        if (Math.abs(itemCenterX - wallWidthCm / 2) < SNAP_THRESHOLD) {
          targetX = Math.round(wallWidthCm / 2 - placementItem.widthCm / 2);
          snappedX = true;
          snapLabel = 'Centro del muro';
        }

        if (Math.abs(itemCenterY - 150) < SNAP_THRESHOLD) {
          targetY = Math.round(150 - placementItem.heightCm / 2);
          snappedY = true;
          snapLabel = snapLabel ? `${snapLabel} + Eje 1.50 m` : 'Eje a nivel de ojos (1.50 m)';
        }

        if (Math.abs(targetY) < SNAP_THRESHOLD) {
          targetY = 0;
          snappedY = true;
          snapLabel = 'Suelo (0 cm)';
        }

        for (const other of wallItems) {
          if (!other.visible) continue;
          const otherCenterX = other.xCm + other.widthCm / 2;
          const otherCenterY = other.yCm + other.heightCm / 2;
          const otherTop = other.yCm + other.heightCm;

          if (Math.abs(itemCenterX - otherCenterX) < SNAP_THRESHOLD) {
            targetX = Math.round(otherCenterX - placementItem.widthCm / 2);
            snappedX = true;
            snapLabel = `Eje con ${other.name}`;
            break;
          }
          if (Math.abs(itemCenterY - otherCenterY) < SNAP_THRESHOLD) {
            targetY = Math.round(otherCenterY - placementItem.heightCm / 2);
            snappedY = true;
            snapLabel = `Nivel con ${other.name}`;
            break;
          }
          if (Math.abs(targetY + placementItem.heightCm - otherTop) < SNAP_THRESHOLD) {
            targetY = Math.round(otherTop - placementItem.heightCm);
            snappedY = true;
            snapLabel = `Cabecera con ${other.name}`;
            break;
          }
          if (Math.abs(targetY - other.yCm) < SNAP_THRESHOLD) {
            targetY = Math.round(other.yCm);
            snappedY = true;
            snapLabel = `Base con ${other.name}`;
            break;
          }
        }
      }

      targetX = Math.max(0, Math.min(wallWidthCm - placementItem.widthCm, targetX));
      targetY = Math.max(0, Math.min(wallHeightCm - placementItem.heightCm, targetY));

      setCursorPosCm({
        xCm: targetX,
        yCm: targetY,
        snappedX,
        snappedY,
        snapLabel,
      });
      return;
    }

    // 1. Marquee Selection Box
    if (isMarqueeActive && marquee && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      setMarquee((prev) => (prev ? { ...prev, currentX, currentY } : null));

      const boxLeft = Math.min(marquee.startX, currentX);
      const boxRight = Math.max(marquee.startX, currentX);
      const boxTop = Math.min(marquee.startY, currentY);
      const boxBottom = Math.max(marquee.startY, currentY);

      if (boxRight - boxLeft > 6 || boxBottom - boxTop > 6) {
        const hPx = wallHeightCm * PX_PER_CM;
        const intersectingIds = wallItems
          .filter((item) => {
            const ix = item.xCm * PX_PER_CM;
            const iy = hPx - (item.yCm + item.heightCm) * PX_PER_CM;
            const iw = item.widthCm * PX_PER_CM;
            const ih = item.heightCm * PX_PER_CM;

            const screenLeft = pan.x + ix * zoom;
            const screenRight = pan.x + (ix + iw) * zoom;
            const screenTop = pan.y + iy * zoom;
            const screenBottom = pan.y + (iy + ih) * zoom;

            return (
              screenLeft < boxRight &&
              screenRight > boxLeft &&
              screenTop < boxBottom &&
              screenBottom > boxTop
            );
          })
          .map((it) => it.id);

        intersectingIds.forEach((id) => {
          if (!selectedItemIds.includes(id)) {
            onSelectItem(id, true);
          }
        });
      }
      return;
    }

    // 2. Dragging items with Smart Guides & Snapping
    if (dragState) {
      const dxPx = (e.clientX - dragState.startClientX) / zoom;
      const dyPx = (e.clientY - dragState.startClientY) / zoom;
      const dxCm = dxPx / PX_PER_CM;
      const dyCm = dyPx / PX_PER_CM;

      if (dragState.mode === 'move') {
        let nextX = Math.round((dragState.initialXCm + dxCm) * 2) / 2;
        let nextY = Math.round((dragState.initialYCm - dyCm) * 2) / 2;

        const guides: {
          type: 'vertical' | 'horizontal';
          posCm: number;
          label: string;
        }[] = [];
        const SNAP_THRESHOLD = 2.5; // cm

        // 1. Snap to wall center X
        const wallCenterX = wallWidthCm / 2;
        const curCenterX = nextX + dragState.initialWCm / 2;
        if (Math.abs(curCenterX - wallCenterX) < SNAP_THRESHOLD) {
          nextX = Number((wallCenterX - dragState.initialWCm / 2).toFixed(1));
          guides.push({
            type: 'vertical',
            posCm: wallCenterX,
            label: `Centro del muro (${wallCenterX.toFixed(0)} cm)`,
          });
        }

        // 2. Snap to floor (y = 0)
        if (Math.abs(nextY) < SNAP_THRESHOLD + 1) {
          nextY = 0;
          guides.push({
            type: 'horizontal',
            posCm: 0,
            label: 'Suelo (0 cm)',
          });
        }

        // 3. Snap to 150 cm visual eye level
        const centerFromFloor = nextY + dragState.initialHCm / 2;
        if (Math.abs(centerFromFloor - 150) < SNAP_THRESHOLD) {
          nextY = Number((150 - dragState.initialHCm / 2).toFixed(1));
          guides.push({
            type: 'horizontal',
            posCm: 150,
            label: 'Eje visual estándar (150 cm)',
          });
        }

        // 4. Snap against other items on this wall
        const movingIds = new Set(
          dragState.initialMultiPositions
            ? dragState.initialMultiPositions.map((p) => p.id)
            : [dragState.itemId]
        );
        const otherItems = wallItems.filter((i) => !movingIds.has(i.id));

        for (const other of otherItems) {
          const otherCenterX = other.xCm + other.widthCm / 2;
          const otherTop = other.yCm + other.heightCm;
          const otherCenterY = other.yCm + other.heightCm / 2;

          // X Snaps: Left edge, Right edge, Center
          if (Math.abs(nextX - other.xCm) < SNAP_THRESHOLD) {
            nextX = other.xCm;
            guides.push({
              type: 'vertical',
              posCm: other.xCm,
              label: `Alineado con borde izq.`,
            });
          } else if (
            Math.abs(
              nextX + dragState.initialWCm - (other.xCm + other.widthCm)
            ) < SNAP_THRESHOLD
          ) {
            nextX = other.xCm + other.widthCm - dragState.initialWCm;
            guides.push({
              type: 'vertical',
              posCm: other.xCm + other.widthCm,
              label: `Alineado con borde der.`,
            });
          } else if (Math.abs(curCenterX - otherCenterX) < SNAP_THRESHOLD) {
            nextX = Number((otherCenterX - dragState.initialWCm / 2).toFixed(1));
            guides.push({
              type: 'vertical',
              posCm: otherCenterX,
              label: `Centros alineados`,
            });
          }

          // Y Snaps: Top edge, Base/Floor edge, Center
          if (Math.abs(nextY + dragState.initialHCm - otherTop) < SNAP_THRESHOLD) {
            nextY = otherTop - dragState.initialHCm;
            guides.push({
              type: 'horizontal',
              posCm: otherTop,
              label: `Borde superior alineado`,
            });
          } else if (Math.abs(nextY - other.yCm) < SNAP_THRESHOLD) {
            nextY = other.yCm;
            guides.push({
              type: 'horizontal',
              posCm: other.yCm,
              label: `Base alineada`,
            });
          } else if (Math.abs(nextY + dragState.initialHCm / 2 - otherCenterY) < SNAP_THRESHOLD) {
            nextY = Number((otherCenterY - dragState.initialHCm / 2).toFixed(1));
            guides.push({
              type: 'horizontal',
              posCm: otherCenterY,
              label: `Centro vertical alineado`,
            });
          }
        }

        setActiveGuides(guides);

        const deltaX = nextX - dragState.initialXCm;
        const deltaY = nextY - dragState.initialYCm;

        if (
          dragState.initialMultiPositions &&
          dragState.initialMultiPositions.length > 1
        ) {
          dragState.initialMultiPositions.forEach((pos) => {
            onUpdateItem(
              pos.id,
              {
                xCm: Number((pos.xCm + deltaX).toFixed(1)),
                yCm: Number((pos.yCm + deltaY).toFixed(1)),
              },
              false
            );
          });
        } else {
          onUpdateItem(dragState.itemId, { xCm: nextX, yCm: nextY }, false);
        }
      } else if (dragState.mode === 'resize-br') {
        const targetItem = wallItems.find((i) => i.id === dragState.itemId);
        const nextW = Math.max(10, Math.round(dragState.initialWCm + dxCm));
        let nextH = Math.max(10, Math.round(dragState.initialHCm + dyCm));
        if (targetItem?.aspectRatioLocked) {
          nextH = Math.max(10, Math.round(nextW / dragState.aspectRatio));
        }
        onUpdateItem(
          dragState.itemId,
          { widthCm: nextW, heightCm: nextH },
          false
        );
      }
      return;
    }

    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragState(null);
    setActiveGuides([]);
    setIsMarqueeActive(false);
    setMarquee(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setDragState(null);
      setActiveGuides([]);
      setIsMarqueeActive(false);
      setMarquee(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropClientX = e.clientX - rect.left;
    const dropClientY = e.clientY - rect.top;
    const wallXPx = (dropClientX - pan.x) / zoom;
    const wallYPx = (dropClientY - pan.y) / zoom;
    const dropXCm = Math.max(
      0,
      Math.min(wallWidthCm - 20, Math.round(wallXPx / PX_PER_CM))
    );
    const dropYCm = Math.max(
      0,
      Math.min(
        wallHeightCm - 20,
        Math.round((wallHeightCm * PX_PER_CM - wallYPx) / PX_PER_CM)
      )
    );

    // 1. Dropped from GraphicLibraryDrawer
    const rawResource = e.dataTransfer.getData('application/json');
    if (rawResource) {
      try {
        const res: GraphicResource = JSON.parse(rawResource);
        if (res && res.name) {
          const isPerson = res.category.startsWith('people');
          const isFloor =
            isPerson ||
            res.category === 'furniture' ||
            res.category === 'pedestals' ||
            res.category === 'sculptures';
          const finalY = isFloor ? 0 : dropYCm;
          const assignedLayer = mapCategoryToLayer(res.category, 'decor');

          onAddItem({
            wallId: wall.id,
            zoneId: wall.zoneId,
            name: res.name,
            code: `REC-${wallItems.length + 1}`,
            type: res.category === 'artworks' ? 'photo' : 'decor',
            category: res.category,
            layerId: assignedLayer,
            widthCm: res.defaultWidthCm,
            heightCm: res.defaultHeightCm,
            depthCm: res.defaultDepthCm,
            xCm: Math.max(
              0,
              Math.min(wallWidthCm - res.defaultWidthCm, dropXCm)
            ),
            yCm: finalY,
            rotation: 0,
            frameStyle: 'none',
            matWidthCm: 0,
            description: `${res.name} (${res.sourceLicense})`,
            imageUrl: res.fileDataUrl,
            isVector: res.isVector,
            tintColor: res.defaultTintColor,
            flipHorizontal: false,
            opacity: 1,
            isPendingReplacement: false,
            locked: false,
            visible: true,
            aspectRatioLocked: true,
            zOrder: wallItems.length + 1,
          });
          return;
        }
      } catch (err) {
        console.warn('Drop error parsing resource:', err);
      }
    }

    // 2. Dropped files from computer (SVG, DXF, PNG, JPG, WEBP)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        const lower = file.name.toLowerCase();
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const isDxf = lower.endsWith('.dxf');
        const isSvg = lower.endsWith('.svg');
        const isPng = lower.endsWith('.png');
        const isJpg = lower.endsWith('.jpg') || lower.endsWith('.jpeg');
        const isWebp = lower.endsWith('.webp');

        if (isDxf) {
          try {
            const text = await file.text();
            const parsed = parseDxfToSvg(text);
            if (parsed) {
              onAddItem({
                wallId: wall.id,
                zoneId: wall.zoneId,
                name: cleanName,
                code: `CAD-${wallItems.length + 1}`,
                type: 'decor',
                category: 'architecture',
                layerId: 'architecture',
                widthCm: Math.min(
                  250,
                  Math.max(20, Math.round(parsed.widthUnits))
                ),
                heightCm: Math.min(
                  250,
                  Math.max(20, Math.round(parsed.heightUnits))
                ),
                xCm: dropXCm,
                yCm: dropYCm,
                rotation: 0,
                frameStyle: 'none',
                matWidthCm: 0,
                description: `Importado CAD DXF: ${file.name}`,
                imageUrl: parsed.svgDataUrl,
                isVector: true,
                tintColor: '#171717',
                locked: false,
                visible: true,
                aspectRatioLocked: true,
                zOrder: wallItems.length + 1,
              });
            }
          } catch (err) {
            console.warn('Error importando archivo DXF soltado:', err);
          }
        } else if (isSvg || isPng || isJpg || isWebp) {
          try {
            const { dataUrl, isVector } = await optimizeImageFile(
              file,
              1200,
              0.8
            );
            onAddItem({
              wallId: wall.id,
              zoneId: wall.zoneId,
              name: cleanName,
              code: `OBR-${wallItems.length + 1}`,
              type: 'photo',
              category: 'artworks',
              layerId: 'artworks',
              widthCm: 50,
              heightCm: 70,
              xCm: dropXCm,
              yCm: dropYCm,
              rotation: 0,
              frameStyle: 'black',
              matWidthCm: 2,
              description: `Importado: ${file.name}`,
              imageUrl: dataUrl,
              isVector,
              locked: false,
              visible: true,
              aspectRatioLocked: true,
              zOrder: wallItems.length + 1,
            });
          } catch (err) {
            console.warn('Error importando imagen soltada:', err);
          }
        }
      }
    }
  };

  // Add Graphic Resource to Wall from Drawer
  const handleAddGraphicResource = (res: GraphicResource) => {
    const isPerson = res.category.startsWith('people');
    const isFurnitureOrFloor =
      isPerson ||
      res.category === 'furniture' ||
      res.category === 'pedestals' ||
      res.category === 'sculptures';
    const isArch = res.category === 'architecture';

    const defaultX = Math.min(
      Math.max(15, wallWidthCm / 2 - res.defaultWidthCm / 2),
      Math.max(10, wallWidthCm - res.defaultWidthCm - 10)
    );

    let defaultY = 0;
    if (isArch && res.name.toLowerCase().includes('carril')) {
      defaultY = Math.max(0, wallHeightCm - 30);
    } else if (!isFurnitureOrFloor) {
      defaultY = Math.max(0, 150 - res.defaultHeightCm / 2);
    }

    const assignedLayer = mapCategoryToLayer(res.category, 'decor');

    setLibraryDrawerOpen(false);
    const itemToPlace: Omit<WallItem, 'id'> = {
      wallId: wall.id,
      zoneId: wall.zoneId,
      name: res.name,
      code: `REC-${wallItems.length + 1}`,
      type: res.category === 'artworks' ? 'photo' : 'decor',
      category: res.category,
      layerId: assignedLayer,
      widthCm: res.defaultWidthCm,
      heightCm: res.defaultHeightCm,
      depthCm: res.defaultDepthCm,
      xCm: Math.round(defaultX),
      yCm: Math.round(defaultY),
      rotation: 0,
      frameStyle: 'none',
      matWidthCm: 0,
      description: `${res.name} (${res.sourceLicense})`,
      imageUrl: res.fileDataUrl,
      isVector: res.isVector,
      tintColor: res.defaultTintColor,
      flipHorizontal: false,
      opacity: 1,
      isPendingReplacement: false,
      locked: false,
      visible: true,
      aspectRatioLocked: true,
      zOrder: wallItems.length + 1,
    };
    setPlacementItem(itemToPlace);
    setCursorPosCm({
      xCm: Math.round(defaultX),
      yCm: Math.round(defaultY),
      snappedX: false,
      snappedY: false,
    });
  };

  const handleQuickAdd = (type: ItemType) => {
    setShowAddMenu(false);
    const count = wallItems.length + 1;
    const defaultX = Math.min(
      Math.max(15, wallWidthCm / 2 - 25),
      Math.max(10, wallWidthCm - 60)
    );

    let itemToPlace: Omit<WallItem, 'id'> | null = null;
    let initialY = 115;

    if (type === 'photo') {
      itemToPlace = {
        wallId: wall.id,
        zoneId: wall.zoneId,
        name: `Fotografía #${count}`,
        code: `OBR-${count}`,
        type: 'photo',
        category: 'artworks',
        layerId: 'artworks',
        widthCm: 50,
        heightCm: 70,
        xCm: Math.round(defaultX),
        yCm: 115,
        rotation: 0,
        frameStyle: wall.material === 'parchment' ? 'parchment' : 'black',
        matWidthCm: 3,
        description: 'Fotografía montada a escala.',
        imageUrl: createArtworkSvgDataUrl(
          `Obra ${count}`,
          wall.participant,
          count,
          50,
          70
        ),
        locked: false,
        visible: true,
        aspectRatioLocked: true,
        zOrder: count,
      };
      initialY = 115;
    } else if (type === 'title') {
      itemToPlace = {
        wallId: wall.id,
        zoneId: wall.zoneId,
        name: `Título #${count}`,
        code: `TIT-${count}`,
        type: 'title',
        category: 'signage',
        layerId: 'texts',
        widthCm: 120,
        heightCm: 24,
        xCm: Math.round(defaultX),
        yCm: 195,
        rotation: 0,
        frameStyle: 'none',
        matWidthCm: 0,
        description: 'Título mural en vinilo de corte.',
        textContent: wall.participant.toUpperCase(),
        locked: false,
        visible: true,
        aspectRatioLocked: false,
        zOrder: count,
      };
      initialY = 195;
    } else if (type === 'text' || type === 'description') {
      itemToPlace = {
        wallId: wall.id,
        zoneId: wall.zoneId,
        name: type === 'text' ? `Texto de sala #${count}` : `Ficha técnica #${count}`,
        code: `TXT-${count}`,
        type,
        category: 'signage',
        layerId: 'texts',
        widthCm: type === 'text' ? 50 : 28,
        heightCm: type === 'text' ? 70 : 18,
        xCm: Math.round(defaultX),
        yCm: 120,
        rotation: 0,
        frameStyle: 'none',
        matWidthCm: 0,
        description: 'Texto curatorial o panel didáctico.',
        textContent:
          type === 'text'
            ? `${wall.participant}\nTexto curatorial de sala.`
            : 'Ficha técnica · 2026',
        locked: false,
        visible: true,
        aspectRatioLocked: false,
        zOrder: count,
      };
      initialY = 120;
    } else if (type === 'frame' || type === 'portrait_stand') {
      itemToPlace = {
        wallId: wall.id,
        zoneId: wall.zoneId,
        name:
          type === 'portrait_stand'
            ? `Portarretrato #${count}`
            : `Marco #${count}`,
        code: `MRC-${count}`,
        type,
        category: 'frames',
        layerId: 'artworks',
        widthCm: 30,
        heightCm: 40,
        xCm: Math.round(defaultX),
        yCm: 125,
        rotation: 0,
        frameStyle: type === 'portrait_stand' ? 'portrait_stand' : 'wood',
        matWidthCm: 3,
        description: 'Obra con marco moldurado.',
        imageUrl: createArtworkSvgDataUrl(
          `Retrato ${count}`,
          wall.participant,
          count + 2,
          30,
          40
        ),
        locked: false,
        visible: true,
        aspectRatioLocked: true,
        zOrder: count,
      };
      initialY = 125;
    }

    if (itemToPlace) {
      onAddItem(itemToPlace);
    }
  };

  const handleCreateText = (textType: TextBlockType) => {
    setShowTextMenu(false);
    setShowAddMenu(false);
    const count = wallItems.length + 1;
    const defaultX = Math.min(
      Math.max(15, wallWidthCm / 2 - 25),
      Math.max(10, wallWidthCm - 60)
    );

    let defaultTitle = '';
    let defaultContent = '';
    let defaultAuthor = '';
    let defaultDate = '';
    let defaultTechnique = '';
    let wCm = 40;
    let hCm = 25;
    let fontSize = 12;
    let fontFamily = 'sans';
    let lineHeight = 1.4;
    let textAlign: 'left' | 'center' | 'right' | 'justify' = 'left';

    if (textType === 'curatorial') {
      defaultTitle = 'Texto curatorial de sala';
      defaultContent =
        'Esta exposición reúne una selección de imágenes que exploran la memoria, los espacios y las huellas que permanecen en el territorio.';
      wCm = 65;
      hCm = 42;
      fontSize = 14;
      fontFamily = 'serif';
      lineHeight = 1.55;
    } else if (textType === 'cedula') {
      defaultTitle = 'Sin título';
      defaultAuthor = wall.participant || 'Autor';
      defaultDate = '2024';
      defaultTechnique = 'Fotografía fine-art sobre papel baritado';
      defaultContent =
        'Copia de autor firmada al dorso. Medidas originales de toma analógica.';
      wCm = 22;
      hCm = 15;
      fontSize = 10;
      fontFamily = 'sans';
      lineHeight = 1.35;
    } else {
      defaultTitle = 'Nota de sala';
      defaultContent =
        'Anotación complementaria o leyenda informativa instalada directamente sobre la pared.';
      wCm = 35;
      hCm = 20;
      fontSize = 11;
      fontFamily = 'sans';
      lineHeight = 1.4;
    }

    const textToPlace: Omit<WallItem, 'id'> = {
      wallId: wall.id,
      zoneId: wall.zoneId,
      name:
        textType === 'curatorial'
          ? `Texto curatorial #${count}`
          : textType === 'cedula'
          ? `Cédula de obra #${count}`
          : `Texto libre #${count}`,
      code: `TXT-${count}`,
      type: 'text',
      category: 'signage',
      layerId: 'texts',
      widthCm: wCm,
      heightCm: hCm,
      xCm: Math.round(defaultX),
      yCm: 125,
      rotation: 0,
      frameStyle: 'none',
      matWidthCm: 0,
      description: defaultContent,
      textContent: defaultContent,
      textType,
      textTitle: defaultTitle,
      textAuthor: defaultAuthor,
      textDate: defaultDate,
      textTechnique: defaultTechnique,
      fontFamily,
      fontSizePt: fontSize,
      fontWeight: 'normal',
      italic: false,
      lineHeight,
      letterSpacing: 0,
      textAlign,
      verticalAlign: 'top',
      textColor: '#171717',
      showBackground: false,
      backgroundColor: '#FFFFFF',
      showBorder: false,
      borderColor: '#E6E4DD',
      borderWidth: 1,
      paddingCm: 0,
      locked: false,
      visible: true,
      aspectRatioLocked: false,
      zOrder: count,
    };

    onAddItem(textToPlace);
  };

  const handleUploadFromComputer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      try {
        const { dataUrl } = await optimizeImageFile(file, 1200, 0.8);
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        onAddItem({
          wallId: wall.id,
          zoneId: wall.zoneId,
          name: cleanName,
          code: `FOT-${wallItems.length + idx + 1}`,
          type: 'photo',
          category: 'artworks',
          layerId: 'artworks',
          widthCm: 50,
          heightCm: 70,
          xCm: Math.min(wallWidthCm - 55, 25 + idx * 60),
          yCm: 115,
          rotation: 0,
          frameStyle: 'black',
          matWidthCm: 2,
          description: `Fotografía cargada (${file.name}).`,
          imageUrl: dataUrl,
          locked: false,
          visible: true,
          aspectRatioLocked: true,
          zOrder: wallItems.length + idx + 1,
        });
      } catch (err) {
        console.error('Error optimizando foto subida:', err);
      }
    }
    e.target.value = '';
    setShowAddMenu(false);
  };

  const wPx = wallWidthCm * PX_PER_CM;
  const hPx = wallHeightCm * PX_PER_CM;

  // Measurement ticks
  const xTicks: number[] = [];
  for (let cm = 0; cm <= wallWidthCm; cm += 50) xTicks.push(cm);
  if (xTicks[xTicks.length - 1] !== wallWidthCm) xTicks.push(wallWidthCm);

  const yTicks: number[] = [];
  for (let cm = 0; cm <= wallHeightCm; cm += 50) yTicks.push(cm);
  if (yTicks[yTicks.length - 1] !== wallHeightCm) yTicks.push(wallHeightCm);

  // Sorted items by Z-order
  const sortedItems = [...wallItems].sort((a, b) => (a.zOrder || 0) - (b.zOrder || 0));

  return (
    <div
      className="relative flex-1 h-full overflow-hidden bg-[#FAF8F5] select-none flex flex-col"
    >
      {/* Minimalist Sub-Header for Elevation View */}
      {!isPresentationMode && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="h-11 px-3 bg-[#FAF8F5] border-b border-[#E6E4DD] flex items-center justify-between gap-2 z-30 shrink-0 text-xs relative select-none"
        >
          <div className="flex items-center gap-2 shrink min-w-0">
            <button
              onClick={onBackToPlan}
              className="text-[#737373] hover:text-[#171717] flex items-center gap-1.5 transition-colors cursor-pointer font-medium shrink-0 whitespace-nowrap"
              title="Volver a la vista de plano"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Plano</span>
            </button>

            <span className="text-[#E6E4DD] shrink-0">/</span>

            {/* Filter Mode Toggle with embedded counts */}
            <div className="flex items-center bg-[#EFECE6] p-0.5 rounded text-[11px] shrink-0 whitespace-nowrap">
              <button
                type="button"
                onClick={() => handleFilterTabClick('with_artworks')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap ${
                  wallFilter === 'with_artworks'
                    ? 'bg-white text-[#171717] font-semibold shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
                title="Mostrar únicamente muros con fotografías u obras montadas"
              >
                Con obras ({partitionCounts.withArtworks})
              </button>
              <button
                type="button"
                onClick={() => handleFilterTabClick('with_content')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap ${
                  wallFilter === 'with_content'
                    ? 'bg-white text-[#171717] font-semibold shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
                title="Mostrar muros con obras, textos o elementos expositivos"
              >
                Con contenido ({partitionCounts.withContent})
              </button>
              <button
                type="button"
                onClick={() => handleFilterTabClick('all')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap ${
                  wallFilter === 'all'
                    ? 'bg-white text-[#171717] font-semibold shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
                title="Mostrar todos los muros del proyecto"
              >
                Todos ({partitionCounts.all})
              </button>
            </div>

            {/* Wall Selector Grouped by Sector */}
            <select
              aria-label="Seleccionar muro"
              value={wall.id}
              onChange={(e) => onSwitchWall(e.target.value)}
              className="py-1 px-2 rounded bg-white border border-[#E6E4DD] text-[#171717] font-medium cursor-pointer max-w-[210px] sm:max-w-[240px] truncate shrink text-xs"
            >
              {!filteredPartitions.some(
                (p) => p.wallA.id === wall.id || (p.wallB && p.wallB.id === wall.id)
              ) && (
                <optgroup label="Muro actual">
                  <option value={wall.id}>
                    {wall.name} (Actual)
                  </option>
                </optgroup>
              )}
              {groupedSectors.length === 0 ? (
                <option value={wall.id}>
                  {wall.name} (Sin coincidencias)
                </option>
              ) : (
                groupedSectors.map((group) => (
                  <optgroup
                    key={group.zoneId}
                    label={`Sector: ${group.zoneName}`}
                  >
                    {group.partitions.map((part) => {
                      const statsA = wallStatsMap.get(part.wallA.id) || {
                        artworks: 0,
                        content: 0,
                      };
                      const statsB = part.wallB
                        ? wallStatsMap.get(part.wallB.id)
                        : null;

                      const labelCount =
                        wallFilter === 'with_content'
                          ? statsB
                            ? `${statsA.content + statsB.content} elem.`
                            : `${statsA.content} elem.`
                          : statsB
                          ? `${statsA.artworks + statsB.artworks} obras`
                          : `${statsA.artworks} obras`;

                      const isCurrentInPart =
                        wall.id === part.wallA.id ||
                        (part.wallB && wall.id === part.wallB.id);
                      const targetValue = isCurrentInPart
                        ? wall.id
                        : part.wallA.id;

                      return (
                        <option key={part.partitionKey} value={targetValue}>
                          {part.wallA.name}{' '}
                          {part.wallB ? '(2 caras)' : ''} — {labelCount}
                        </option>
                      );
                    })}
                  </optgroup>
                ))
              )}
            </select>

            {/* Double-sided Wall Face Selector */}
            {currentLinkedWall && (
              <div className="flex items-center bg-[#EFECE6] p-0.5 rounded text-[11px] gap-0.5">
                {(() => {
                  const currentIsFaceB = isWallFaceB(wall, currentLinkedWall);
                  const wallA = currentIsFaceB ? currentLinkedWall : wall;
                  const wallB = currentIsFaceB ? wall : currentLinkedWall;
                  const statsA = wallStatsMap.get(wallA.id) || {
                    artworks: 0,
                    content: 0,
                  };
                  const statsB = wallStatsMap.get(wallB.id) || {
                    artworks: 0,
                    content: 0,
                  };

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => onSwitchWall(wallA.id)}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          !currentIsFaceB
                            ? 'bg-white text-[#2563EB] font-semibold shadow-xs'
                            : 'text-[#737373] hover:text-[#171717]'
                        }`}
                        title={`Cara A: ${wallA.participant || wallA.name}`}
                      >
                        Cara A ({statsA.artworks} obr.)
                      </button>
                      <button
                        type="button"
                        onClick={() => onSwitchWall(wallB.id)}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          currentIsFaceB
                            ? 'bg-white text-[#2563EB] font-semibold shadow-xs'
                            : 'text-[#737373] hover:text-[#171717]'
                        }`}
                        title={`Cara B: ${wallB.participant || wallB.name}`}
                      >
                        Cara B ({statsB.artworks} obr.)
                      </button>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Multi-Wall Composite View Button for current artist */}
            {artistWallsWithArt.length > 1 && onOpenMultiWallView && (
              <button
                type="button"
                onClick={() =>
                  onOpenMultiWallView(
                    wall.participant,
                    artistWallsWithArt.map((w) => w.id)
                  )
                }
                className="px-2.5 py-1 rounded bg-[#2563EB]/10 hover:bg-[#2563EB]/20 text-[#2563EB] border border-[#2563EB]/30 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                title={`Ver la composición conjunta de los ${artistWallsWithArt.length} muros con obras de ${wall.participant}`}
              >
                <MoveHorizontal className="w-3.5 h-3.5" />
                <span>Ver todos sus muros ({artistWallsWithArt.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Graphic Resources Library Drawer Toggle */}
            <button
              onClick={() => setLibraryDrawerOpen((v) => !v)}
              className={`px-2.5 py-1 rounded border flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                libraryDrawerOpen
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white border-[#E6E4DD] text-[#171717] hover:bg-[#F0EFEA]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Biblioteca ({graphicResources.length})</span>
            </button>

            {/* Layers Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowLayersMenu((v) => !v);
                  setShowLayoutMenu(false);
                  setShowTextMenu(false);
                  setShowAddMenu(false);
                }}
                className={`px-2.5 py-1 rounded border flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                  showLayersMenu
                    ? 'bg-[#FAF8F5] border-[#2563EB] text-[#2563EB]'
                    : 'bg-white border-[#E6E4DD] text-[#171717] hover:bg-[#F0EFEA]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#737373]" />
                <span>Capas</span>
                <ChevronDown className="w-3 h-3 text-[#737373]" />
              </button>

              {showLayersMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLayersMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#E6E4DD] rounded-lg shadow-xl py-2 z-50 text-xs text-[#171717] space-y-1">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#737373] border-b border-[#F0EFEA]">
                      Capas de Elevación (8+)
                    </div>
                    {(layerStates || []).map((l) => (
                      <div
                        key={l.id}
                        className="px-3 py-1.5 flex items-center justify-between hover:bg-[#FAF8F5]"
                      >
                        <button
                          onClick={() => onToggleLayerState?.(l.id)}
                          className="flex items-center gap-2 text-left flex-1 cursor-pointer truncate mr-2"
                        >
                          {l.visible ? (
                            <Eye className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-[#A3A3A3] shrink-0" />
                          )}
                          <span
                            className={
                              l.visible
                                ? 'text-[#171717] font-medium'
                                : 'text-[#737373] line-through'
                            }
                          >
                            {l.name}
                          </span>
                        </button>

                        <button
                          onClick={() => onToggleLayerLock?.(l.id)}
                          className="p-1 rounded text-[#737373] hover:text-[#171717] cursor-pointer"
                          title={l.locked ? 'Desbloquear capa' : 'Bloquear capa'}
                        >
                          {l.locked ? (
                            <Lock className="w-3 h-3 text-[#2563EB]" />
                          ) : (
                            <Unlock className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Discreet Composition / Alignment Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowLayoutMenu((v) => !v);
                  setShowLayersMenu(false);
                  setShowTextMenu(false);
                  setShowAddMenu(false);
                }}
                className={`px-2.5 py-1 rounded border flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                  showLayoutMenu
                    ? 'bg-[#FAF8F5] border-[#2563EB] text-[#2563EB]'
                    : 'bg-white border-[#E6E4DD] text-[#171717] hover:bg-[#F0EFEA]'
                }`}
                title="Distribuir y alinear elementos"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#737373]" />
                <span>Alinear</span>
                <ChevronDown className="w-3 h-3 text-[#737373]" />
              </button>

              {showLayoutMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLayoutMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-[#E6E4DD] rounded-lg shadow-xl py-1.5 z-50 text-xs text-[#171717]">
                    <button
                      onClick={() => {
                        setShowLayoutMenu(false);
                        onDistributeUniformH();
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Distribuir horizontalmente
                    </button>
                    <button
                      onClick={() => {
                        setShowLayoutMenu(false);
                        onDistributeFixedSpacing(wall.defaultSpacingCm || 10);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Centrar con separación ({wall.defaultSpacingCm || 10} cm)
                    </button>
                    <button
                      onClick={() => {
                        setShowLayoutMenu(false);
                        onDistributeUniformV();
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Distribuir verticalmente
                    </button>
                    <div className="my-1 border-t border-[#F0EFEA]" />
                    <button
                      onClick={() => {
                        setShowLayoutMenu(false);
                        onAlignItems('eye-level-150');
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Alinear al eje visual (150 cm)
                    </button>
                    <button
                      onClick={() => {
                        setShowLayoutMenu(false);
                        onAlignItems('center-x');
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Centrar conjunto en el muro
                    </button>
                    <button
                      onClick={() => {
                        setShowLayoutMenu(false);
                        onAlignItems('bottom');
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Alinear al suelo (borde inferior)
                    </button>
                    <button
                      onClick={() => {
                        setShowLayoutMenu(false);
                        onAlignItems('top');
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Alinear por borde superior
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Dedicated Add Text Button with Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowTextMenu((v) => !v);
                  setShowLayersMenu(false);
                  setShowLayoutMenu(false);
                  setShowAddMenu(false);
                }}
                className={`px-2.5 py-1 rounded border font-medium flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                  showTextMenu
                    ? 'bg-[#FAF8F5] border-[#2563EB] text-[#2563EB]'
                    : 'bg-white border-[#E6E4DD] text-[#171717] hover:bg-[#F0EFEA]'
                }`}
                title="Añadir bloque de texto, cédula o nota a la pared"
              >
                <Type className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Texto</span>
                <ChevronDown className="w-3 h-3 text-[#737373]" />
              </button>

              {showTextMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTextMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#E6E4DD] rounded-lg shadow-xl py-1.5 z-50 text-xs text-[#171717]">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#737373] border-b border-[#F0EFEA]">
                      Tipos de texto independiente
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCreateText('curatorial')}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-medium text-[#171717] flex items-center gap-2">
                        <Type className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Texto curatorial</span>
                      </span>
                      <span className="text-[11px] text-[#737373] pl-5.5">
                        Explicación general de la exposición o sector
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateText('cedula')}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-medium text-[#171717] flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cédula de obra</span>
                      </span>
                      <span className="text-[11px] text-[#737373] pl-5.5">
                        Ficha con título, autor, técnica, fecha y notas
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateText('free')}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-medium text-[#171717] flex items-center gap-2">
                        <Heading className="w-3.5 h-3.5 text-[#525252]" />
                        <span>Texto libre / Anotación</span>
                      </span>
                      <span className="text-[11px] text-[#737373] pl-5.5">
                        Leyendas, señalética o notas curatoriales
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Add Element Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu((v) => !v);
                  setShowLayersMenu(false);
                  setShowLayoutMenu(false);
                  setShowTextMenu(false);
                }}
                className="px-2.5 py-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar obra</span>
              </button>

              {showAddMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAddMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-[#E6E4DD] rounded-lg shadow-xl py-1.5 z-50 text-xs text-[#171717]">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Fotografía desde computador</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowAddMenu(false);
                        setUrlPromptOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5 text-[#737373]" />
                      <span>Fotografía mediante URL</span>
                    </button>
                    <button
                      onClick={() => handleQuickAdd('photo')}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#737373]" />
                      <span>Fotografía a escala (50 × 70 cm)</span>
                    </button>
                    <div className="my-1 border-t border-[#F0EFEA]" />
                    <button
                      onClick={() => handleQuickAdd('title')}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Heading className="w-3.5 h-3.5 text-[#737373]" />
                      <span>Título mural</span>
                    </button>
                    <button
                      onClick={() => handleQuickAdd('text')}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Type className="w-3.5 h-3.5 text-[#737373]" />
                      <span>Texto curatorial de sala</span>
                    </button>
                    <button
                      onClick={() => handleQuickAdd('description')}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#737373]" />
                      <span>Ficha técnica de obra</span>
                    </button>
                    <div className="my-1 border-t border-[#F0EFEA]" />
                    <button
                      onClick={() => handleQuickAdd('frame')}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Frame className="w-3.5 h-3.5 text-[#737373]" />
                      <span>Marco moldurado</span>
                    </button>
                    <button
                      onClick={() => handleQuickAdd('portrait_stand')}
                      className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                    >
                      <RectangleVertical className="w-3.5 h-3.5 text-[#737373]" />
                      <span>Portarretrato de mesa</span>
                    </button>
                  </div>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUploadFromComputer}
              />
            </div>
          </div>
        </div>
      )}

      {/* URL Modal */}
      {urlPromptOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-14 right-5 z-50 w-72 p-3 rounded bg-white border border-[#E6E4DD] shadow-sm space-y-2 text-xs"
        >
          <div className="font-medium text-[#171717]">
            Agregar fotografía mediante URL
          </div>
          <input
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-[#E6E4DD]"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setUrlPromptOpen(false)}
              className="px-2.5 py-1 rounded border border-[#E6E4DD] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (customUrl.trim()) {
                  onAddItem({
                    wallId: wall.id,
                    zoneId: wall.zoneId,
                    name: `Obra URL #${wallItems.length + 1}`,
                    code: `URL-${wallItems.length + 1}`,
                    type: 'photo',
                    category: 'artworks',
                    layerId: 'artworks',
                    widthCm: 50,
                    heightCm: 70,
                    xCm: 40,
                    yCm: 115,
                    rotation: 0,
                    frameStyle: 'black',
                    matWidthCm: 2,
                    description: 'Fotografía desde URL.',
                    imageUrl: customUrl.trim(),
                    locked: false,
                    visible: true,
                    aspectRatioLocked: true,
                    zOrder: wallItems.length + 1,
                  });
                }
                setCustomUrl('');
                setUrlPromptOpen(false);
              }}
              className="px-3 py-1 rounded bg-[#2563EB] text-white cursor-pointer"
            >
              Añadir
            </button>
          </div>
        </div>
      )}

      {/* MAIN ELEVATION SVG */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex-1 overflow-hidden z-10 ${
          isSpacePressed
            ? isPanning
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-default'
        }`}
      >
        {/* Empty state when no walls match the review filter */}
        {filteredPartitions.length === 0 && (
          <div className="absolute inset-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md bg-white border border-[#E6E4DD] rounded-lg p-6 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#171717]">
                  {wallFilter === 'with_artworks'
                    ? 'No hay muros con obras asignadas'
                    : 'No hay muros con contenido'}
                </h3>
                <p className="text-xs text-[#737373] mt-1.5 leading-relaxed">
                  {wallFilter === 'with_artworks'
                    ? 'La revisión de montaje muestra únicamente los muros que contienen obras o fotografías instaladas. Puedes asignar obras a los muros desde el plano o revisar todos los espacios.'
                    : 'Actualmente ningún muro tiene elementos asignados bajo este filtro.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {onOpenSpaceAdmin && (
                  <button
                    type="button"
                    onClick={onOpenSpaceAdmin}
                    className="px-3.5 py-1.5 rounded bg-[#2563EB] text-white text-xs font-medium hover:bg-[#1D4ED8] transition-colors cursor-pointer"
                  >
                    Gestión de espacios
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setWallFilter('all')}
                  className="px-3.5 py-1.5 rounded bg-[#F0EFEA] text-[#171717] text-xs font-medium hover:bg-[#E6E4DD] transition-colors cursor-pointer"
                >
                  Ver todos los muros
                </button>
              </div>
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          className="w-full h-full block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="pat-concrete"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <rect width="80" height="80" fill="#E5E4E0" />
              <path
                d="M 0 40 L 80 40 M 40 0 L 40 80"
                stroke="#D4D2CC"
                strokeWidth="0.6"
              />
            </pattern>
            <pattern
              id="pat-brick"
              width="48"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <rect width="48" height="24" fill="#EFECE6" />
              <path
                d="M 0 0 L 48 0 M 0 12 L 48 12 M 0 0 L 0 12 M 24 0 L 24 12 M 12 12 L 12 24 M 36 12 L 36 24"
                stroke="#D6CEBE"
                strokeWidth="0.8"
              />
            </pattern>
            <pattern
              id="pat-parchment"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <rect width="60" height="60" fill="#F6F1E3" />
              <path
                d="M 0 20 Q 30 18 60 20"
                stroke="#E8DEC6"
                strokeWidth="0.6"
                fill="none"
              />
            </pattern>
            <pattern
              id="pat-wood"
              width="40"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <rect width="40" height="120" fill="#E6D5B8" />
              <line
                x1="20"
                y1="0"
                x2="20"
                y2="120"
                stroke="#D4BE98"
                strokeWidth="0.7"
              />
            </pattern>
            <pattern
              id="elev-grid-50"
              width={50 * PX_PER_CM}
              height={50 * PX_PER_CM}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${50 * PX_PER_CM} 0 L 0 0 0 ${50 * PX_PER_CM}`}
                fill="none"
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="0.8"
              />
            </pattern>

            {/* Architectural ground hatch pattern */}
            <pattern
              id="pat-ground-hatch"
              width="14"
              height="14"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="14" stroke="#737373" strokeWidth="0.9" opacity="0.4" />
            </pattern>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Red Horizontal Cota Ruler */}
            {!isPresentationMode && layerVisibilityMap.get('dimensions') && (
              <g transform="translate(0, -14)">
                <line
                  x1={0}
                  y1={0}
                  x2={wPx}
                  y2={0}
                  stroke="#DC2626"
                  strokeWidth="0.75"
                  strokeOpacity="0.8"
                />
                {xTicks.map((cm) => {
                  const tx = cm * PX_PER_CM;
                  return (
                    <g key={`xt-${cm}`} transform={`translate(${tx}, 0)`}>
                      <line
                        x1={0}
                        y1={-4}
                        x2={0}
                        y2={3}
                        stroke="#DC2626"
                        strokeWidth="0.75"
                      />
                      <text
                        x={0}
                        y={-7}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontFamily="JetBrains Mono, monospace"
                        fill="#DC2626"
                      >
                        {cm}cm
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Red Vertical Cota Ruler */}
            {!isPresentationMode && layerVisibilityMap.get('dimensions') && (
              <g transform="translate(-14, 0)">
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={hPx}
                  stroke="#DC2626"
                  strokeWidth="0.75"
                  strokeOpacity="0.8"
                />
                {yTicks.map((cm) => {
                  const ty = hPx - cm * PX_PER_CM;
                  return (
                    <g key={`yt-${cm}`} transform={`translate(0, ${ty})`}>
                      <line
                        x1={-4}
                        y1={0}
                        x2={3}
                        y2={0}
                        stroke="#DC2626"
                        strokeWidth="0.75"
                      />
                      <text
                        x={-7}
                        y={3}
                        textAnchor="end"
                        fontSize="8.5"
                        fontFamily="JetBrains Mono, monospace"
                        fill="#DC2626"
                      >
                        {cm}cm
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Subtle Wall Return Thickness Indications (Left & Right) */}
            {layerVisibilityMap.get('architecture') && (
              <>
                <rect
                  x={-15 * PX_PER_CM}
                  y={0}
                  width={15 * PX_PER_CM}
                  height={hPx}
                  fill="#F0EFEA"
                  stroke="#A3A3A3"
                  strokeWidth="0.8"
                  strokeDasharray="3,3"
                />
                <rect
                  x={wPx}
                  y={0}
                  width={15 * PX_PER_CM}
                  height={hPx}
                  fill="#F0EFEA"
                  stroke="#A3A3A3"
                  strokeWidth="0.8"
                  strokeDasharray="3,3"
                />
              </>
            )}

            {/* Main Wall Surface with Crisp Architectural Linework */}
            <rect
              x={0}
              y={0}
              width={wPx}
              height={hPx}
              fill={getWallFill(wall.material, wall.color)}
              stroke="#171717"
              strokeWidth="1.5"
            />

            {!isPresentationMode && layers.grid && (
              <rect
                x={0}
                y={0}
                width={wPx}
                height={hPx}
                fill="url(#elev-grid-50)"
                className="pointer-events-none"
              />
            )}

            {/* Subtle Skirting Board (Rodapié 10 cm) */}
            {layerVisibilityMap.get('architecture') && (
              <line
                x1={0}
                y1={hPx - 10 * PX_PER_CM}
                x2={wPx}
                y2={hPx - 10 * PX_PER_CM}
                stroke="#D4D4D4"
                strokeWidth="0.75"
              />
            )}

            {/* Floor Datum & Foundation Line (N.P.T. ±0.00) */}
            <g transform={`translate(0, ${hPx})`}>
              {/* Heavy architectural ground line */}
              <line
                x1={-35}
                y1={0}
                x2={wPx + 35}
                y2={0}
                stroke="#171717"
                strokeWidth="2.2"
              />
              {/* Ground hatching box beneath floor */}
              <rect
                x={-35}
                y={0}
                width={wPx + 70}
                height={16}
                fill="url(#pat-ground-hatch)"
                stroke="none"
              />
              {/* Datum label */}
              {layerVisibilityMap.get('dimensions') && (
                <g transform="translate(10, 24)">
                  <path d="M 0,-10 L 4,-3 L -4,-3 Z" fill="#171717" />
                  <text
                    x={8}
                    y={-3}
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                    fill="#171717"
                  >
                    N.P.T. ±0.00
                  </text>
                </g>
              )}
            </g>

            {/* Ceiling Datum Line (N.C.T. +2.60m) */}
            <g transform="translate(0, 0)">
              <line
                x1={-35}
                y1={0}
                x2={wPx + 35}
                y2={0}
                stroke="#525252"
                strokeWidth="1.5"
              />
              {layerVisibilityMap.get('dimensions') && (
                <g transform="translate(10, -8)">
                  <path d="M 0,0 L 4,-7 L -4,-7 Z" fill="#525252" />
                  <text
                    x={8}
                    y={-2}
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                    fill="#525252"
                  >
                    N.C.T. +{wall.heightM.toFixed(2)} m
                  </text>
                </g>
              )}
            </g>

            {/* Subtle 150 cm Eye-Level Reference Line */}
            {!isPresentationMode && layers.guides && wallHeightCm >= 150 && (
              <g transform={`translate(0, ${hPx - 150 * PX_PER_CM})`}>
                <line
                  x1={0}
                  y1={0}
                  x2={wPx}
                  y2={0}
                  stroke="#737373"
                  strokeWidth="0.7"
                  strokeDasharray="4,4"
                  opacity="0.5"
                  className="pointer-events-none"
                />
                <text
                  x={wPx - 8}
                  y={-4}
                  textAnchor="end"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  fill="#737373"
                  opacity="0.8"
                >
                  Eje visual 1.50 m
                </text>
              </g>
            )}

            {/* MOUNTED ARTWORKS & MUSEOGRAPHIC GRAPHIC RESOURCES */}
            {sortedItems.map((item) => {
              const assignedLayer = item.layerId || mapCategoryToLayer(item.category, item.type);
              const isLayerVisible = layerVisibilityMap.get(assignedLayer) ?? true;
              const isLayerLocked = layerLockedMap.get(assignedLayer) ?? false;
              if (!isLayerVisible) return null;

              const ix = item.xCm * PX_PER_CM;
              const iy = hPx - (item.yCm + item.heightCm) * PX_PER_CM;
              const iw = item.widthCm * PX_PER_CM;
              const ih = item.heightCm * PX_PER_CM;

              const isSelected = selectedItemIds.includes(item.id);
              const isEffectiveLocked = item.locked || isLayerLocked;

              const isText =
                item.type === 'text' ||
                item.type === 'title' ||
                item.type === 'description';

              let frameStroke = '#171717';
              let frameStrokeW = 2;
              let matFill = '#FAF8F5';

              if (item.frameStyle === 'none') {
                frameStroke = '#D4D4D4';
                frameStrokeW = 1;
              } else if (item.frameStyle === 'wood') {
                frameStroke = '#78350F';
                frameStrokeW = 3.5;
              } else if (item.frameStyle === 'white') {
                frameStroke = '#D4D4D4';
                frameStrokeW = 3;
              } else if (item.frameStyle === 'aluminum') {
                frameStroke = '#737373';
                frameStrokeW = 2.5;
              } else if (item.frameStyle === 'parchment') {
                frameStroke = '#A16207';
                frameStrokeW = 1.2;
                matFill = '#F6F1E3';
              }

              const matPx = Math.min(
                Math.min(iw, ih) * 0.25,
                item.matWidthCm * PX_PER_CM
              );

              // Scale figure / cutout positioning: standing on base
              const isFigure =
                item.category?.startsWith('people') ||
                item.category === 'vitrines' ||
                item.category === 'furniture' ||
                item.category === 'pedestals' ||
                item.category === 'sculptures';

              const transformString = [
                `translate(${ix}, ${iy})`,
                item.rotation ? `rotate(${item.rotation}, ${iw / 2}, ${ih / 2})` : '',
                item.flipHorizontal ? `translate(${iw}, 0) scale(-1, 1)` : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <g
                  key={item.id}
                  transform={transformString}
                  opacity={item.opacity ?? (item.type === 'reference' ? 0.65 : 1)}
                  className={isEffectiveLocked ? 'cursor-not-allowed' : isSpacePressed ? 'cursor-grab' : 'cursor-move'}
                  onMouseDown={(e) => {
                    if (isSpacePressed || e.button === 1 || e.altKey) {
                      return; // Allow canvas pan
                    }
                    if (placementItem) {
                      onAddItem({
                        ...placementItem,
                        xCm: cursorPosCm.xCm,
                        yCm: cursorPosCm.yCm,
                      });
                      setPlacementItem(null);
                      return;
                    }
                    e.stopPropagation();
                    const isMulti = e.shiftKey || e.metaKey || e.ctrlKey;
                    if (isMulti) {
                      onSelectItem(item.id, true);
                    } else {
                      // Clicking an item already selected in a multi-selection designates it as Key Object
                      if (selectedItemIds.includes(item.id) && selectedItemIds.length > 1) {
                        setKeyObjectId((prev) => (prev === item.id ? null : item.id));
                        setAlignReference((prev) => (keyObjectId === item.id ? 'selection' : 'key_object'));
                      } else {
                        onSelectItem(item.id, false);
                        if (keyObjectId !== item.id) {
                          setKeyObjectId(null);
                        }
                      }
                    }

                    if (!isEffectiveLocked && !isPresentationMode) {
                      const willBeSelected = isMulti
                        ? !selectedItemIds.includes(item.id)
                          ? [...selectedItemIds, item.id]
                          : selectedItemIds
                        : selectedItemIds.includes(item.id)
                        ? selectedItemIds
                        : [item.id];

                      const movingItems = wallItems.filter((it) =>
                        willBeSelected.includes(it.id)
                      );

                      setDragState({
                        itemId: item.id,
                        mode: 'move',
                        startClientX: e.clientX,
                        startClientY: e.clientY,
                        initialXCm: item.xCm,
                        initialYCm: item.yCm,
                        initialWCm: item.widthCm,
                        initialHCm: item.heightCm,
                        aspectRatio: item.widthCm / Math.max(1, item.heightCm),
                        initialMultiPositions: movingItems.map((it) => ({
                          id: it.id,
                          xCm: it.xCm,
                          yCm: it.yCm,
                        })),
                      });
                    }
                  }}
                >
                  {isText ? (
                    <g>
                      {/* Optional Background & Border or Selection Outline */}
                      {(item.showBackground || item.showBorder || isSelected) && (
                        <rect
                          width={iw}
                          height={ih}
                          fill={
                            item.showBackground
                              ? item.backgroundColor || '#FFFFFF'
                              : 'transparent'
                          }
                          stroke={
                            isSelected
                              ? '#2563EB'
                              : item.showBorder
                              ? item.borderColor || '#E5E5E5'
                              : 'transparent'
                          }
                          strokeWidth={isSelected ? 1.5 : item.borderWidth || 1}
                          strokeDasharray={
                            isSelected && !item.showBorder ? '4,3' : undefined
                          }
                          rx={2}
                        />
                      )}

                      <foreignObject
                        x={0}
                        y={0}
                        width={iw}
                        height={ih}
                        className="select-none pointer-events-none"
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent:
                              item.verticalAlign === 'middle'
                                ? 'center'
                                : item.verticalAlign === 'bottom'
                                ? 'flex-end'
                                : 'flex-start',
                            textAlign: item.textAlign || 'left',
                            color: item.textColor || '#171717',
                            fontFamily:
                              item.fontFamily === 'serif'
                                ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
                                : item.fontFamily === 'mono'
                                ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                                : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fontSize: `${Math.max(
                              9,
                              (item.fontSizePt || 11) * 1.15
                            )}px`,
                            fontWeight:
                              item.fontWeight === 'bold'
                                ? 700
                                : item.fontWeight === 'semibold'
                                ? 600
                                : item.fontWeight === 'medium'
                                ? 500
                                : 400,
                            fontStyle: item.italic ? 'italic' : 'normal',
                            lineHeight: item.lineHeight || 1.4,
                            letterSpacing: `${item.letterSpacing || 0}px`,
                            padding: `${(item.paddingCm || 0) * PX_PER_CM}px`,
                            boxSizing: 'border-box',
                          }}
                        >
                          {item.textType === 'curatorial' ? (
                            <div>
                              {item.textTitle && (
                                <div className="font-bold text-[1.15em] mb-1 leading-snug">
                                  {item.textTitle}
                                </div>
                              )}
                              <div className="opacity-95 leading-relaxed">
                                {item.textContent || item.description}
                              </div>
                            </div>
                          ) : item.textType === 'cedula' ? (
                            <div className="space-y-0.5">
                              {item.textTitle && (
                                <div className="font-semibold text-[1.05em] leading-tight">
                                  {item.textTitle}
                                </div>
                              )}
                              {item.textAuthor && (
                                <div className="text-[0.95em] opacity-90">
                                  {item.textAuthor}
                                </div>
                              )}
                              {(item.textDate || item.textTechnique) && (
                                <div className="text-[0.85em] opacity-75">
                                  {[item.textDate, item.textTechnique]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </div>
                              )}
                              {(item.textContent || item.description) && (
                                <div className="text-[0.9em] pt-1 opacity-90 leading-normal">
                                  {item.textContent || item.description}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              {item.textTitle && (
                                <div className="font-semibold text-[1.05em] mb-0.5">
                                  {item.textTitle}
                                </div>
                              )}
                              <div>
                                {item.textContent ||
                                  item.description ||
                                  item.name}
                              </div>
                            </div>
                          )}
                        </div>
                      </foreignObject>
                    </g>
                  ) : item.type === 'photo' || item.type === 'frame' || item.type === 'portrait_stand' ? (
                    <g>
                      {item.frameStyle !== 'none' && (
                        <rect
                          width={iw}
                          height={ih}
                          fill={matFill}
                          stroke={frameStroke}
                          strokeWidth={frameStrokeW}
                        />
                      )}
                      {item.imageUrl ? (
                        <image
                          href={item.imageUrl}
                          x={matPx}
                          y={matPx}
                          width={Math.max(4, iw - matPx * 2)}
                          height={Math.max(4, ih - matPx * 2)}
                          preserveAspectRatio="none"
                        />
                      ) : (
                        <rect
                          x={matPx}
                          y={matPx}
                          width={Math.max(4, iw - matPx * 2)}
                          height={Math.max(4, ih - matPx * 2)}
                          fill="#E5E5E5"
                        />
                      )}
                    </g>
                  ) : (
                    /* Museographic Graphic Resource (Silhouettes, Vitrines, Bench, Architecture) */
                    <g>
                      {item.imageUrl ? (
                        <image
                          href={item.imageUrl}
                          x={0}
                          y={0}
                          width={iw}
                          height={ih}
                          preserveAspectRatio={
                            isFigure ? 'xMidYBottom meet' : 'xMidYMid meet'
                          }
                          style={{
                            color: item.tintColor || '#171717',
                          }}
                        />
                      ) : (
                        <rect
                          width={iw}
                          height={ih}
                          fill="#F0EFEA"
                          stroke="#737373"
                          strokeWidth="1.2"
                        />
                      )}
                    </g>
                  )}

                  {/* Provisional / Pending Replacement Indicator */}
                  {item.isPendingReplacement && !isPresentationMode && (
                    <g>
                      <rect
                        x={-2}
                        y={-2}
                        width={iw + 4}
                        height={ih + 4}
                        fill="none"
                        stroke="#D97706"
                        strokeWidth="1.5"
                        strokeDasharray="4,3"
                      />
                      <g transform={`translate(${iw / 2 - 40}, -16)`}>
                        <rect
                          width={80}
                          height={14}
                          rx={2}
                          fill="#FEF3C7"
                          stroke="#F59E0B"
                          strokeWidth="0.8"
                        />
                        <text
                          x={40}
                          y={10}
                          textAnchor="middle"
                          fontSize="8"
                          fontWeight="600"
                          fill="#B45309"
                        >
                          PROVISIONAL
                        </text>
                      </g>
                    </g>
                  )}

                  {/* Blue Selection Highlight */}
                  {isSelected && !isPresentationMode && (
                    <>
                      <rect
                        x={-2}
                        y={-2}
                        width={iw + 4}
                        height={ih + 4}
                        fill="none"
                        stroke={keyObjectId === item.id ? '#4F46E5' : '#2563EB'}
                        strokeWidth={keyObjectId === item.id ? 2.5 : 2}
                      />
                      {keyObjectId === item.id && (
                        <g transform={`translate(${iw / 2 - 40}, -20)`} className="pointer-events-none">
                          <rect
                            width={80}
                            height={15}
                            rx={3}
                            fill="#4F46E5"
                          />
                          <text
                            x={40}
                            y={11}
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="600"
                            fill="#FFFFFF"
                            fontFamily="ui-sans-serif, system-ui, sans-serif"
                          >
                            🔑 Objeto clave
                          </text>
                        </g>
                      )}
                      {!isEffectiveLocked && (
                        <rect
                          x={iw - 5}
                          y={ih - 5}
                          width={9}
                          height={9}
                          fill="#2563EB"
                          stroke="#FFFFFF"
                          strokeWidth="1.2"
                          className="cursor-nwse-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              itemId: item.id,
                              mode: 'resize-br',
                              startClientX: e.clientX,
                              startClientY: e.clientY,
                              initialXCm: item.xCm,
                              initialYCm: item.yCm,
                              initialWCm: item.widthCm,
                              initialHCm: item.heightCm,
                              aspectRatio:
                                item.widthCm / Math.max(1, item.heightCm),
                            });
                          }}
                        />
                      )}
                    </>
                  )}

                  {/* Discreet Dimension Label beneath Item */}
                  {!isPresentationMode && layerVisibilityMap.get('dimensions') && (
                    <text
                      x={iw / 2}
                      y={ih + 12}
                      textAnchor="middle"
                      fontSize="8.5"
                      fontFamily="JetBrains Mono, monospace"
                      fill={isSelected ? '#2563EB' : '#DC2626'}
                      className="pointer-events-none"
                    >
                      {item.widthCm}×{item.heightCm}
                      {item.category?.startsWith('people') && ' (1.70m)'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Dynamic Magnetic Guides & Snap Lines */}
            {!isPresentationMode &&
              activeGuides.map((guide, idx) => {
                if (guide.type === 'vertical') {
                  const gx = guide.posCm * PX_PER_CM;
                  return (
                    <g
                      key={`guide-v-${idx}-${guide.posCm}`}
                      className="pointer-events-none"
                    >
                      <line
                        x1={gx}
                        y1={-30}
                        x2={gx}
                        y2={hPx + 30}
                        stroke="#2563EB"
                        strokeWidth="1.2"
                        strokeDasharray="4,3"
                      />
                      <rect
                        x={gx - 45}
                        y={-28}
                        width={90}
                        height={16}
                        rx={3}
                        fill="#2563EB"
                        fillOpacity="0.9"
                      />
                      <text
                        x={gx}
                        y={-17}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fill="#FFFFFF"
                        fontWeight="500"
                      >
                        {guide.label}
                      </text>
                    </g>
                  );
                } else {
                  const gy = hPx - guide.posCm * PX_PER_CM;
                  return (
                    <g
                      key={`guide-h-${idx}-${guide.posCm}`}
                      className="pointer-events-none"
                    >
                      <line
                        x1={-30}
                        y1={gy}
                        x2={wPx + 30}
                        y2={gy}
                        stroke="#2563EB"
                        strokeWidth="1.2"
                        strokeDasharray="4,3"
                      />
                      <rect
                        x={wPx + 8}
                        y={gy - 8}
                        width={110}
                        height={16}
                        rx={3}
                        fill="#2563EB"
                        fillOpacity="0.9"
                      />
                      <text
                        x={wPx + 63}
                        y={gy + 3}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fill="#FFFFFF"
                        fontWeight="500"
                      >
                        {guide.label}
                      </text>
                    </g>
                  );
                }
              })}

            {/* Ghost Placement Preview (Module 7: Precisión de colocación del cursor) */}
            {placementItem && (() => {
              const gx = cursorPosCm.xCm * PX_PER_CM;
              const gy = hPx - (cursorPosCm.yCm + placementItem.heightCm) * PX_PER_CM;
              const gw = placementItem.widthCm * PX_PER_CM;
              const gh = placementItem.heightCm * PX_PER_CM;
              const centerX = gx + gw / 2;
              const centerY = gy + gh / 2;

              return (
                <g className="pointer-events-none z-30">
                  {/* Snap guidelines */}
                  {cursorPosCm.snappedX && (
                    <line
                      x1={centerX}
                      y1={-40}
                      x2={centerX}
                      y2={hPx + 40}
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                  )}
                  {cursorPosCm.snappedY && (
                    <line
                      x1={-40}
                      y1={gy + gh}
                      x2={wPx + 40}
                      y2={gy + gh}
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                  )}

                  {/* Semi-transparent ghost box */}
                  <rect
                    x={gx}
                    y={gy}
                    width={gw}
                    height={gh}
                    fill={placementItem.type === 'text' ? '#FFFFFF' : '#2563EB'}
                    fillOpacity={0.25}
                    stroke="#2563EB"
                    strokeWidth={2}
                    strokeDasharray="5,4"
                    rx={2}
                  />

                  {/* Image preview inside ghost if available */}
                  {placementItem.imageUrl && (
                    <image
                      href={placementItem.imageUrl}
                      x={gx}
                      y={gy}
                      width={gw}
                      height={gh}
                      opacity={0.65}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  )}

                  {/* Center crosshair */}
                  <line
                    x1={centerX - 10}
                    y1={centerY}
                    x2={centerX + 10}
                    y2={centerY}
                    stroke="#2563EB"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={centerX}
                    y1={centerY - 10}
                    x2={centerX}
                    y2={centerY + 10}
                    stroke="#2563EB"
                    strokeWidth="1.5"
                  />

                  {/* Dimensions & Coordinates Pill Tag */}
                  <g transform={`translate(${centerX}, ${gy - 12})`}>
                    <rect
                      x={-100}
                      y={-14}
                      width={200}
                      height={20}
                      rx={10}
                      fill="#171717"
                      fillOpacity={0.92}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="DM Sans, sans-serif"
                      fill="#FFFFFF"
                      fontWeight="600"
                    >
                      {`${cursorPosCm.xCm} cm, ${cursorPosCm.yCm} cm · ${placementItem.widthCm}×${placementItem.heightCm} cm`}
                    </text>
                  </g>
                  {cursorPosCm.snapLabel && (
                    <g transform={`translate(${centerX}, ${gy + gh + 16})`}>
                      <rect
                        x={-80}
                        y={-10}
                        width={160}
                        height={18}
                        rx={9}
                        fill="#2563EB"
                        fillOpacity={0.92}
                      />
                      <text
                        x={0}
                        y={2}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="DM Sans, sans-serif"
                        fill="#FFFFFF"
                        fontWeight="600"
                      >
                        {cursorPosCm.snapLabel}
                      </text>
                    </g>
                  )}
                </g>
              );
            })()}
          </g>
        </svg>

        {/* Floating Placement Mode Notification Bar */}
        {placementItem && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#171717]/95 text-white px-4 py-2 rounded-full shadow-lg border border-[#333] flex items-center gap-3 text-xs backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>
                Colocando: <strong>{placementItem.name}</strong> ({placementItem.widthCm} × {placementItem.heightCm} cm)
              </span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="text-[11px] text-[#A3A3A3] flex items-center gap-2">
              <span>Clic para fijar en el muro</span>
              <span>·</span>
              <button
                type="button"
                onClick={() => setMagneticSnapEnabled((v) => !v)}
                className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                  magneticSnapEnabled
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-[#333] text-[#A3A3A3]'
                }`}
                title="Activar o desactivar imán inteligente (o mantén Alt)"
              >
                Imán: {magneticSnapEnabled ? 'Activo' : 'Libre'}
              </button>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <button
              type="button"
              onClick={() => setPlacementItem(null)}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold cursor-pointer transition-colors"
            >
              Cancelar (Esc)
            </button>
          </div>
        )}

        {/* Marquee Selection Rectangle Overlay */}
        {isMarqueeActive && marquee && (
          <div
            className="absolute pointer-events-none z-30 border border-blue-500 bg-blue-500/15"
            style={{
              left: Math.min(marquee.startX, marquee.currentX),
              top: Math.min(marquee.startY, marquee.currentY),
              width: Math.abs(marquee.currentX - marquee.startX),
              height: Math.abs(marquee.currentY - marquee.startY),
              borderStyle: 'dashed',
            }}
          />
        )}

        {/* Floating Alignment & Distribution Dock (Illustrator / Figma style) */}
        {selectedItemIds.length > 0 && !isPresentationMode && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-lg bg-white/95 border border-[#E6E4DD] text-xs text-[#171717] shadow-lg backdrop-blur-xs max-w-[95vw] overflow-x-auto"
          >
            {/* Selection Count Badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#F0EFEA] text-[11px] font-medium text-[#404040] shrink-0">
              <span>
                {selectedItemIds.length}{' '}
                {selectedItemIds.length === 1 ? 'sel.' : 'objs.'}
              </span>
            </div>

            <div className="h-4 w-px bg-[#E6E4DD] shrink-0" />

            {/* Reference Mode Selector */}
            <div className="flex items-center bg-[#F0EFEA] p-0.5 rounded text-[11px] shrink-0">
              <button
                type="button"
                onClick={() => setAlignReference('selection')}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  alignReference === 'selection'
                    ? 'bg-white text-[#2563EB] font-semibold shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
                title="Alinear respecto a la selección combinada"
              >
                Selección
              </button>
              <button
                type="button"
                onClick={() => setAlignReference('wall')}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  alignReference === 'wall'
                    ? 'bg-white text-[#2563EB] font-semibold shadow-2xs'
                    : 'text-[#737373] hover:text-[#171717]'
                }`}
                title="Alinear respecto al muro completo"
              >
                Muro
              </button>
              {selectedItemIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setAlignReference('key_object');
                    if (!keyObjectId && selectedItemIds.length > 0) {
                      setKeyObjectId(selectedItemIds[0]);
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                    alignReference === 'key_object'
                      ? 'bg-white text-indigo-600 font-semibold shadow-2xs'
                      : 'text-[#737373] hover:text-[#171717]'
                  }`}
                  title="Alinear respecto a un objeto clave fijo"
                >
                  <Key className="w-2.5 h-2.5" />
                  <span>Clave</span>
                </button>
              )}
            </div>

            <div className="h-4 w-px bg-[#E6E4DD] shrink-0" />

            {/* Horizontal Alignment Group */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onAlignAndDistribute?.('left', {
                    reference: alignReference,
                    keyObjectId: keyObjectId || undefined,
                  })
                }
                title="Alinear a la izquierda"
                className="p-1 rounded hover:bg-[#FAF8F5] text-[#525252] hover:text-[#171717] cursor-pointer"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onAlignAndDistribute?.('center-x', {
                    reference: alignReference,
                    keyObjectId: keyObjectId || undefined,
                  })
                }
                title="Centrar horizontalmente"
                className="p-1 rounded hover:bg-[#FAF8F5] text-[#525252] hover:text-[#171717] cursor-pointer"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onAlignAndDistribute?.('right', {
                    reference: alignReference,
                    keyObjectId: keyObjectId || undefined,
                  })
                }
                title="Alinear a la derecha"
                className="p-1 rounded hover:bg-[#FAF8F5] text-[#525252] hover:text-[#171717] cursor-pointer"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-[#E6E4DD] shrink-0" />

            {/* Vertical Alignment Group */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onAlignAndDistribute?.('top', {
                    reference: alignReference,
                    keyObjectId: keyObjectId || undefined,
                  })
                }
                title="Alinear por arriba"
                className="p-1 rounded hover:bg-[#FAF8F5] text-[#525252] hover:text-[#171717] cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onAlignAndDistribute?.('center-y', {
                    reference: alignReference,
                    keyObjectId: keyObjectId || undefined,
                  })
                }
                title="Centrar verticalmente"
                className="p-1 rounded hover:bg-[#FAF8F5] text-[#525252] hover:text-[#171717] cursor-pointer"
              >
                <MoveVertical className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onAlignAndDistribute?.('bottom', {
                    reference: alignReference,
                    keyObjectId: keyObjectId || undefined,
                  })
                }
                title="Alinear por abajo / suelo"
                className="p-1 rounded hover:bg-[#FAF8F5] text-[#525252] hover:text-[#171717] cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onAlignAndDistribute?.('eye-level-150', {
                    reference: alignReference,
                    keyObjectId: keyObjectId || undefined,
                  })
                }
                title="Alinear al eje visual estándar (150 cm del suelo)"
                className="px-1.5 py-0.5 rounded hover:bg-[#FAF8F5] text-[10px] font-mono font-medium text-amber-700 bg-amber-50 cursor-pointer"
              >
                150 cm
              </button>
            </div>

            {/* Distribution Controls (when 2+ selected) */}
            {selectedItemIds.length >= 2 && (
              <>
                <div className="h-4 w-px bg-[#E6E4DD] shrink-0" />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onAlignAndDistribute?.('distribute-h-gaps', {
                        reference: alignReference,
                        keyObjectId: keyObjectId || undefined,
                      })
                    }
                    title="Distribuir horizontalmente (espacio uniforme)"
                    className="p-1 rounded hover:bg-[#FAF8F5] text-[#525252] hover:text-[#171717] cursor-pointer"
                  >
                    <MoveHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onAlignAndDistribute?.('distribute-v-gaps', {
                        reference: alignReference,
                        keyObjectId: keyObjectId || undefined,
                      })
                    }
                    title="Distribuir verticalmente (espacio uniforme)"
                    className="p-1 rounded hover:bg-[#FAF8F5] text-[#525252] hover:text-[#171717] cursor-pointer"
                  >
                    <MoveVertical className="w-3.5 h-3.5 rotate-90" />
                  </button>

                  {/* Exact Spacing cm Input */}
                  <div className="flex items-center gap-1 pl-1 bg-[#FAF8F5] rounded border border-[#E6E4DD] px-1 py-0.5">
                    <span className="text-[10px] text-[#737373]">Sep:</span>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={exactSpacingInput}
                      onChange={(e) =>
                        setExactSpacingInput(Number(e.target.value) || 0)
                      }
                      className="w-9 text-[10px] font-mono text-center bg-transparent border-0 outline-hidden"
                      title="Separación exacta entre elementos en centímetros"
                    />
                    <span className="text-[10px] text-[#737373]">cm</span>
                    <button
                      type="button"
                      onClick={() =>
                        onAlignAndDistribute?.('exact-spacing-h', {
                          reference: alignReference,
                          keyObjectId: keyObjectId || undefined,
                          exactSpacingCm: exactSpacingInput,
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-white text-[10px] font-medium border border-[#D4D4D4] hover:bg-[#F0EFEA] text-[#171717] cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="h-4 w-px bg-[#E6E4DD] shrink-0" />

            {/* Quick Centrar en Muro */}
            <button
              type="button"
              onClick={() =>
                onAlignAndDistribute?.('center-x', {
                  reference: 'wall',
                })
              }
              title="Centrar conjunto en la pared"
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAF8F5] hover:bg-[#F0EFEA] text-[#171717] cursor-pointer shrink-0"
            >
              Centrar en muro
            </button>

            {/* Group / Ungroup buttons */}
            {onGroupSelected && onUngroupSelected && (
              <>
                <div className="h-4 w-px bg-[#E6E4DD] shrink-0" />
                <div className="flex items-center gap-0.5 shrink-0">
                  {selectedItemIds.length >= 2 && (
                    <button
                      type="button"
                      onClick={onGroupSelected}
                      title="Agrupar elementos seleccionados"
                      className="p-1 rounded hover:bg-[#FAF8F5] text-[#525252] hover:text-[#171717] cursor-pointer"
                    >
                      <Group className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {wallItems.some(
                    (it) => selectedItemIds.includes(it.id) && !!it.groupId
                  ) && (
                    <button
                      type="button"
                      onClick={onUngroupSelected}
                      title="Desagrupar elementos seleccionados"
                      className="p-1 rounded hover:bg-[#FAF8F5] text-[#525252] hover:text-[#171717] cursor-pointer"
                    >
                      <Ungroup className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Discreet Bottom Bar: Zoom, Fit & Contextual Auto-Fix */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1 rounded bg-white/95 border border-[#E6E4DD] text-xs text-[#171717] shadow-sm"
        >
          <button
            onClick={() => handleButtonZoom(-0.1)}
            title="Alejar"
            className="p-1 rounded hover:bg-[#FAF8F5] text-[#737373] hover:text-[#171717] cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 text-[11px] font-mono tabular-nums text-[#404040]">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => handleButtonZoom(0.1)}
            title="Acercar"
            className="p-1 rounded hover:bg-[#FAF8F5] text-[#737373] hover:text-[#171717] cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#E6E4DD] mx-0.5" />

          <button
            onClick={fitWallToScreen}
            title="Ajustar muro a pantalla"
            className="px-2 py-0.5 rounded hover:bg-[#FAF8F5] text-[11px] text-[#737373] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Ajustar</span>
          </button>

          {wallIssues.length > 0 && (
            <>
              <div className="h-3.5 w-px bg-[#E6E4DD] mx-0.5" />
              <button
                onClick={onAutoFixWall}
                title={wallIssues[0].message}
                className="px-2 py-0.5 rounded bg-[#2563EB] text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
              >
                <Wand2 className="w-3 h-3" />
                <span>Ajustar obras al muro</span>
              </button>
            </>
          )}
        </div>

        {/* Lateral Graphic Resources Drawer */}
        <GraphicLibraryDrawer
          isOpen={libraryDrawerOpen}
          onClose={() => setLibraryDrawerOpen(false)}
          resources={graphicResources}
          onAddResourceToWall={handleAddGraphicResource}
          onImportResources={(newItems) => {
            onImportGraphicResources?.(newItems);
          }}
        />
      </div>
    </div>
  );
};
