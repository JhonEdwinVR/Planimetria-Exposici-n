import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Clipboard,
  Trash2,
  Lock,
  Unlock,
  Eye,
  ExternalLink,
  Ruler,
  Layers,
  Check,
  PenTool,
  EyeOff,
  Upload,
  ArrowLeftRight,
  Package,
  Plus,
  RotateCw,
} from 'lucide-react';
import { optimizeImageFile } from '../utils/imageOptimization';
import {
  BackgroundPlanSettings,
  FloorPlanElement,
  GraphicResource,
  LayerState,
  LayerVisibility,
  PendingVerification,
  PlanAnnotation,
  ValidationIssue,
  Vertex,
  Wall,
  WallItem,
  Zone,
} from '../types/exhibition';
import { GraphicLibraryDrawer } from './GraphicLibraryDrawer';

interface FloorPlanCanvasProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  zones: Zone[];
  vertices: Vertex[];
  walls: Wall[];
  items: WallItem[];
  annotations?: PlanAnnotation[];
  layers: LayerVisibility;
  layerStates?: LayerState[];
  verifications: PendingVerification[];
  validationIssues: ValidationIssue[];
  selectedWallId: string | null;
  selectedItemIds: string[];
  selectedZoneIds?: string[];
  backgroundPlan?: BackgroundPlanSettings;
  referenceImageUrl?: string;
  referenceOpacity: number;
  isDark: boolean;
  focusZoneTrigger: { zoneId: string; ts: number } | null;
  fitTrigger: number;
  clipboardItem?: WallItem | null;
  onSelectWall: (wallId: string | null, openElevation?: boolean) => void;
  onSelectItem: (itemId: string, multi?: boolean) => void;
  onSelectZone?: (zoneId: string, multi?: boolean) => void;
  onSelectMultiple: (wallIds: string[], itemIds: string[]) => void;
  onMoveVertex: (vertexId: string, newX: number, newY: number) => void;
  onMoveWall?: (wallId: string, deltaX: number, deltaY: number) => void;
  onMoveZones?: (zoneIds: string[], deltaX: number, deltaY: number) => void;
  onUpdateZoneLabelPosition?: (zoneId: string, xM: number, yM: number) => void;
  onUpdateAnnotation?: (annotationId: string, patch: Partial<PlanAnnotation>) => void;
  onCopyItem?: (itemId: string) => void;
  onPasteItem?: () => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  onPromptDeleteWall?: (wall: Wall) => void;
  onFlipWallDirection?: (wallId: string) => void;
  onFlipItemDirection?: (itemId: string) => void;
  onToggleLockSelected?: () => void;
  onToggleReferenceVisible?: () => void;
  onUpdateBackgroundPlan?: (patch: Partial<BackgroundPlanSettings>) => void;
  onDeleteBackgroundImage?: () => void;
  onUploadReferenceImage?: (dataUrl: string) => void;
  isCalibratingBackground?: boolean;
  onFinishTwoPointCalibration?: (realMeters: number, ptA: { x: number; y: number }, ptB: { x: number; y: number }) => void;
  onCancelCalibration?: () => void;
  isDrawingWall?: boolean;
  drawingSpaceId?: string | null;
  drawingSpaceName?: string;
  onFinishDrawingWall?: (
    spaceId: string,
    startPt: { x: number; y: number },
    endPt: { x: number; y: number },
    isChained?: boolean
  ) => void;
  onCancelDrawingWall?: () => void;
  planElements?: FloorPlanElement[];
  selectedPlanElementId?: string | null;
  onSelectPlanElement?: (id: string | null) => void;
  onUpdatePlanElement?: (id: string, patch: Partial<FloorPlanElement>) => void;
  onDuplicatePlanElement?: (id: string) => void;
  onDeletePlanElement?: (id: string) => void;
  graphicResources?: GraphicResource[];
  onPlaceGraphicResourceInPlan?: (res: GraphicResource) => void;
  onMountGraphicResourceOnWall?: (res: GraphicResource) => void;
  onImportGraphicResources?: (newResources: GraphicResource[]) => void;
}

const SCALE_PX_PER_M = 85;

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  svgRef,
  zones,
  vertices,
  walls,
  items,
  annotations = [],
  layers,
  layerStates = [],
  selectedWallId,
  selectedItemIds,
  selectedZoneIds = [],
  backgroundPlan,
  referenceImageUrl,
  referenceOpacity,
  focusZoneTrigger,
  fitTrigger,
  clipboardItem,
  onSelectWall,
  onSelectItem,
  onSelectZone,
  onSelectMultiple,
  onMoveVertex,
  onMoveWall,
  onMoveZones,
  onUpdateZoneLabelPosition,
  onCopyItem,
  onPasteItem,
  onDuplicateSelected,
  onDeleteSelected,
  onPromptDeleteWall,
  onFlipWallDirection,
  onFlipItemDirection,
  onToggleLockSelected,
  onToggleReferenceVisible,
  onUpdateBackgroundPlan,
  onDeleteBackgroundImage,
  onUploadReferenceImage,
  isCalibratingBackground = false,
  onFinishTwoPointCalibration,
  onCancelCalibration,
  isDrawingWall = false,
  drawingSpaceId = null,
  drawingSpaceName = '',
  onFinishDrawingWall,
  onCancelDrawingWall,
  planElements = [],
  selectedPlanElementId = null,
  onSelectPlanElement,
  onUpdatePlanElement,
  onDuplicatePlanElement,
  onDeletePlanElement,
  graphicResources = [],
  onPlaceGraphicResourceInPlan,
  onMountGraphicResourceOnWall,
  onImportGraphicResources,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(0.92);
  const [pan, setPan] = useState({ x: 95, y: 85 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPlanLibraryOpen, setIsPlanLibraryOpen] = useState(false);

  // Dragging vertex or zone label
  const [draggingVertexId, setDraggingVertexId] = useState<string | null>(null);
  const [draggingLabelZoneId, setDraggingLabelZoneId] = useState<string | null>(null);

  // Dragging or resizing FloorPlanElement (Mesa, Cuadrado decorativo, Repisa, etc.)
  const [draggingPlanElemState, setDraggingPlanElemState] = useState<{
    id: string;
    mode: 'move' | 'resize';
    startXM: number;
    startYM: number;
    initXM: number;
    initYM: number;
    initWidthCm: number;
    initDepthCm: number;
  } | null>(null);

  // Dragging whole wall
  const [draggingWallId, setDraggingWallId] = useState<string | null>(null);
  const [wallDragStart, setWallDragStart] = useState<{ x: number; y: number } | null>(null);
  const [accumulatedWallDelta, setAccumulatedWallDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging zone / multi-zones
  const [draggingZoneIds, setDraggingZoneIds] = useState<string[]>([]);
  const [zoneDragStart, setZoneDragStart] = useState<{ x: number; y: number } | null>(null);
  const [accumulatedZoneDelta, setAccumulatedZoneDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Wall Drawing State
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [drawingHover, setDrawingHover] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSnapVertex, setHoveredSnapVertex] = useState<Vertex | null>(null);
  const [drawnSegmentsCount, setDrawnSegmentsCount] = useState(0);

  // Reset drawing states when mode toggles
  useEffect(() => {
    if (!isDrawingWall) {
      setDrawingStart(null);
      setDrawingHover(null);
      setHoveredSnapVertex(null);
      setDrawnSegmentsCount(0);
    }
  }, [isDrawingWall]);

  // Marquee Selection Box
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<{ x: number; y: number } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    wallId?: string;
    itemId?: string;
    overlappingItems: { id: string; name: string; type: 'wall' | 'item' }[];
  } | null>(null);

  // 2-Point Background Calibration Clicks
  const [calibrationPointA, setCalibrationPointA] = useState<{ x: number; y: number } | null>(null);
  const [calibrationPointB, setCalibrationPointB] = useState<{ x: number; y: number } | null>(null);
  const [showDistPrompt, setShowDistPrompt] = useState(false);
  const [measuredDistInput, setMeasuredDistInput] = useState('5.50');

  const vertexMap = new Map<string, Vertex>();
  vertices.forEach((v) => vertexMap.set(v.id, v));

  const zoneMap = new Map<string, Zone>();
  zones.forEach((z) => zoneMap.set(z.id, z));

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

  const fitToScreen = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const planW = 11.2 * SCALE_PX_PER_M;
    const planH = 6.0 * SCALE_PX_PER_M;
    const nextZoom = Math.min(
      1.3,
      Math.max(0.45, Math.min((rect.width - 140) / planW, (rect.height - 140) / planH))
    );
    setZoom(Number(nextZoom.toFixed(2)));
    setPan({
      x: Math.round((rect.width - planW * nextZoom) / 2),
      y: Math.round((rect.height - planH * nextZoom) / 2),
    });
  };

  useEffect(() => {
    fitToScreen();
  }, [fitTrigger]);

  useEffect(() => {
    if (!focusZoneTrigger || !containerRef.current) return;
    const zoneWalls = walls.filter((w) => w.zoneId === focusZoneTrigger.zoneId);
    if (zoneWalls.length === 0) return;

    const pts: { x: number; y: number }[] = [];
    zoneWalls.forEach((w) => {
      const vs = vertexMap.get(w.startVertexId);
      const ve = vertexMap.get(w.endVertexId);
      if (vs) pts.push(vs);
      if (ve) pts.push(ve);
    });
    if (pts.length === 0) return;

    const avgX = (pts.reduce((s, p) => s + p.x, 0) / pts.length) * SCALE_PX_PER_M;
    const avgY = (pts.reduce((s, p) => s + p.y, 0) / pts.length) * SCALE_PX_PER_M;
    const rect = containerRef.current.getBoundingClientRect();
    const targetZoom = 1.15;
    setZoom(targetZoom);
    setPan({
      x: Math.round(rect.width / 2 - avgX * targetZoom),
      y: Math.round(rect.height / 2 - avgY * targetZoom),
    });
  }, [focusZoneTrigger]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const nextZoom = Math.min(2.8, Math.max(0.3, Number((zoom + delta).toFixed(2))));
    setZoom(nextZoom);
  };

  // Convert client viewport coordinates to plan meters
  const clientToMeters = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = (clientX - rect.left - pan.x) / zoom / SCALE_PX_PER_M;
    const rawY = (clientY - rect.top - pan.y) / zoom / SCALE_PX_PER_M;
    return { x: rawX, y: rawY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setContextMenu(null);

    // If Wall Drawing mode is active:
    if (isDrawingWall && drawingSpaceId && onFinishDrawingWall) {
      if (e.button !== 0) return; // Only left click draws
      const rawPt = clientToMeters(e.clientX, e.clientY);
      let clickPt = rawPt;
      if (hoveredSnapVertex) {
        clickPt = { x: hoveredSnapVertex.x, y: hoveredSnapVertex.y };
      } else {
        clickPt = {
          x: Math.round(rawPt.x * 20) / 20,
          y: Math.round(rawPt.y * 20) / 20,
        };
      }

      if (!drawingStart) {
        // Point 1 (start vertex)
        setDrawingStart(clickPt);
      } else {
        // Point 2 (end vertex)
        const dist = Math.hypot(clickPt.x - drawingStart.x, clickPt.y - drawingStart.y);
        if (dist >= 0.2) {
          const isChained = e.detail < 2;
          onFinishDrawingWall(drawingSpaceId, drawingStart, clickPt, isChained);
          setDrawnSegmentsCount((c) => c + 1);
          if (e.detail >= 2) {
            setDrawingStart(null);
            setDrawingHover(null);
          } else {
            setDrawingStart(clickPt); // Next segment starts from this endpoint
          }
        }
      }
      return;
    }

    // If 2-Point Calibration is active:
    if (isCalibratingBackground) {
      const pt = clientToMeters(e.clientX, e.clientY);
      if (!calibrationPointA) {
        setCalibrationPointA(pt);
      } else if (!calibrationPointB) {
        setCalibrationPointB(pt);
        setShowDistPrompt(true);
      }
      return;
    }

    if (draggingWallId || draggingZoneIds.length > 0 || draggingVertexId || draggingLabelZoneId) return;

    // Middle click or space+click or left click on empty canvas
    if (e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button === 0) {
      // Start marquee selection if clicking empty canvas without shift/ctrl
      const pt = clientToMeters(e.clientX, e.clientY);
      setIsMarqueeSelecting(true);
      setMarqueeStart(pt);
      setMarqueeCurrent(pt);

      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        onSelectWall(null);
        onSelectPlanElement?.(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // FloorPlanElement move or resize
    if (draggingPlanElemState && onUpdatePlanElement) {
      const pt = clientToMeters(e.clientX, e.clientY);
      const dxM = pt.x - draggingPlanElemState.startXM;
      const dyM = pt.y - draggingPlanElemState.startYM;
      if (draggingPlanElemState.mode === 'move') {
        const nextXM = Math.round((draggingPlanElemState.initXM + dxM) * 20) / 20;
        const nextYM = Math.round((draggingPlanElemState.initYM + dyM) * 20) / 20;
        onUpdatePlanElement(draggingPlanElemState.id, {
          xM: Number(nextXM.toFixed(2)),
          yM: Number(nextYM.toFixed(2)),
        });
      } else {
        const nextW = Math.max(
          20,
          Math.round((draggingPlanElemState.initWidthCm + dxM * 200) / 5) * 5
        );
        const nextD = Math.max(
          15,
          Math.round((draggingPlanElemState.initDepthCm + dyM * 200) / 5) * 5
        );
        onUpdatePlanElement(draggingPlanElemState.id, {
          widthCm: nextW,
          depthCm: nextD,
        });
      }
      return;
    }

    // Whole wall dragging
    if (draggingWallId && wallDragStart && onMoveWall) {
      const pt = clientToMeters(e.clientX, e.clientY);
      const rawDx = pt.x - wallDragStart.x;
      const rawDy = pt.y - wallDragStart.y;
      const snapDx = Math.round(rawDx * 20) / 20;
      const snapDy = Math.round(rawDy * 20) / 20;
      if (snapDx !== accumulatedWallDelta.x || snapDy !== accumulatedWallDelta.y) {
        const stepDx = snapDx - accumulatedWallDelta.x;
        const stepDy = snapDy - accumulatedWallDelta.y;
        onMoveWall(draggingWallId, stepDx, stepDy);
        setAccumulatedWallDelta({ x: snapDx, y: snapDy });
      }
      return;
    }

    // Zone or multi-zones dragging
    if (draggingZoneIds.length > 0 && zoneDragStart && onMoveZones) {
      const pt = clientToMeters(e.clientX, e.clientY);
      const rawDx = pt.x - zoneDragStart.x;
      const rawDy = pt.y - zoneDragStart.y;
      const snapDx = Math.round(rawDx * 20) / 20;
      const snapDy = Math.round(rawDy * 20) / 20;
      if (snapDx !== accumulatedZoneDelta.x || snapDy !== accumulatedZoneDelta.y) {
        const stepDx = snapDx - accumulatedZoneDelta.x;
        const stepDy = snapDy - accumulatedZoneDelta.y;
        onMoveZones(draggingZoneIds, stepDx, stepDy);
        setAccumulatedZoneDelta({ x: snapDx, y: snapDy });
      }
      return;
    }

    if (isDrawingWall) {
      const rawPt = clientToMeters(e.clientX, e.clientY);
      const snapTol = 0.22;
      const nearbyV = vertices.find(
        (v) => Math.hypot(v.x - rawPt.x, v.y - rawPt.y) <= snapTol
      );
      let targetPt = rawPt;
      if (nearbyV) {
        setHoveredSnapVertex(nearbyV);
        targetPt = { x: nearbyV.x, y: nearbyV.y };
      } else {
        setHoveredSnapVertex(null);
        targetPt = {
          x: Math.round(rawPt.x * 20) / 20,
          y: Math.round(rawPt.y * 20) / 20,
        };
      }

      if (drawingStart && e.shiftKey) {
        const dx = Math.abs(targetPt.x - drawingStart.x);
        const dy = Math.abs(targetPt.y - drawingStart.y);
        if (dx >= dy) {
          targetPt = { x: targetPt.x, y: drawingStart.y };
        } else {
          targetPt = { x: drawingStart.x, y: targetPt.y };
        }
      }

      setDrawingHover(targetPt);
      return;
    }

    if (draggingVertexId && containerRef.current) {
      const pt = clientToMeters(e.clientX, e.clientY);
      const snappedX = Math.round(pt.x * 20) / 20;
      const snappedY = Math.round(pt.y * 20) / 20;
      onMoveVertex(draggingVertexId, snappedX, snappedY);
      return;
    }

    if (draggingLabelZoneId && onUpdateZoneLabelPosition) {
      const pt = clientToMeters(e.clientX, e.clientY);
      onUpdateZoneLabelPosition(
        draggingLabelZoneId,
        Number(pt.x.toFixed(2)),
        Number(pt.y.toFixed(2))
      );
      return;
    }

    if (isMarqueeSelecting && marqueeStart) {
      const pt = clientToMeters(e.clientX, e.clientY);
      setMarqueeCurrent(pt);
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
    setDraggingPlanElemState(null);
    setDraggingWallId(null);
    setWallDragStart(null);
    setAccumulatedWallDelta({ x: 0, y: 0 });
    setDraggingZoneIds([]);
    setZoneDragStart(null);
    setAccumulatedZoneDelta({ x: 0, y: 0 });
    setDraggingVertexId(null);
    setDraggingLabelZoneId(null);

    // Complete marquee selection
    if (isMarqueeSelecting && marqueeStart && marqueeCurrent) {
      const minX = Math.min(marqueeStart.x, marqueeCurrent.x);
      const maxX = Math.max(marqueeStart.x, marqueeCurrent.x);
      const minY = Math.min(marqueeStart.y, marqueeCurrent.y);
      const maxY = Math.max(marqueeStart.y, marqueeCurrent.y);

      // Only perform marquee selection if drag distance was meaningful (> 0.2m)
      if (Math.hypot(maxX - minX, maxY - minY) > 0.2) {
        const selectedWalls: string[] = [];
        const selectedItemsList: string[] = [];

        walls.forEach((w) => {
          const vs = vertexMap.get(w.startVertexId);
          const ve = vertexMap.get(w.endVertexId);
          if (vs && ve) {
            const midX = (vs.x + ve.x) / 2;
            const midY = (vs.y + ve.y) / 2;
            if (midX >= minX && midX <= maxX && midY >= minY && midY <= maxY) {
              selectedWalls.push(w.id);
            }
          }
        });

        items.forEach((it) => {
          const w = walls.find((wall) => wall.id === it.wallId);
          if (w) {
            const vs = vertexMap.get(w.startVertexId);
            const ve = vertexMap.get(w.endVertexId);
            if (vs && ve) {
              const ratio = it.xCm / 100 / w.lengthM;
              const ix = vs.x + (ve.x - vs.x) * ratio;
              const iy = vs.y + (ve.y - vs.y) * ratio;
              if (ix >= minX && ix <= maxX && iy >= minY && iy <= maxY) {
                selectedItemsList.push(it.id);
              }
            }
          }
        });

        if (selectedWalls.length > 0 || selectedItemsList.length > 0) {
          onSelectMultiple(selectedWalls, selectedItemsList);
        }
      }

      setIsMarqueeSelecting(false);
      setMarqueeStart(null);
      setMarqueeCurrent(null);
    }
  };

  // Right-click context menu handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCalibratingBackground) return;

    const pt = clientToMeters(e.clientX, e.clientY);
    const overlapping: { id: string; name: string; type: 'wall' | 'item' }[] = [];

    // Find nearby walls within 0.35m
    walls.forEach((w) => {
      const vs = vertexMap.get(w.startVertexId);
      const ve = vertexMap.get(w.endVertexId);
      if (vs && ve) {
        const midX = (vs.x + ve.x) / 2;
        const midY = (vs.y + ve.y) / 2;
        if (Math.hypot(pt.x - midX, pt.y - midY) < 0.6) {
          overlapping.push({ id: w.id, name: w.name, type: 'wall' });
        }
      }
    });

    // Find nearby items within 0.35m
    items.forEach((it) => {
      const w = walls.find((wall) => wall.id === it.wallId);
      if (w) {
        const vs = vertexMap.get(w.startVertexId);
        const ve = vertexMap.get(w.endVertexId);
        if (vs && ve) {
          const ratio = it.xCm / 100 / w.lengthM;
          const ix = vs.x + (ve.x - vs.x) * ratio;
          const iy = vs.y + (ve.y - vs.y) * ratio;
          if (Math.hypot(pt.x - ix, pt.y - iy) < 0.5) {
            overlapping.push({ id: it.id, name: it.name, type: 'item' });
          }
        }
      }
    });

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      wallId: overlapping.find((o) => o.type === 'wall')?.id,
      itemId: overlapping.find((o) => o.type === 'item')?.id,
      overlappingItems: overlapping,
    });
  };

  // Layer visibility helper synchronized with project.layerStates
  const isLayerActive = (layerKey: string, fallback = true): boolean => {
    const found = layerStates.find((l) => l.id === layerKey);
    if (found !== undefined) return found.visible;
    return fallback;
  };

  // Background Plan Settings
  const bgImg = backgroundPlan?.imageUrl || referenceImageUrl;
  const bgOpacity = backgroundPlan?.opacity ?? referenceOpacity;
  const bgScale = backgroundPlan?.scale ?? 1;
  const bgX = (backgroundPlan?.xOffsetM ?? 0) * SCALE_PX_PER_M;
  const bgY = (backgroundPlan?.yOffsetM ?? 0) * SCALE_PX_PER_M;
  const bgRot = backgroundPlan?.rotationDeg ?? 0;
  const bgVisible = Boolean(
    bgImg &&
      isLayerActive('backgroundPlan', true) &&
      backgroundPlan?.visible !== false &&
      layers.referenceOverlay !== false
  );

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      className={`relative flex-1 h-full overflow-hidden bg-[#FAF8F5] select-none ${
        isSpacePressed || isPanning
          ? 'cursor-grab active:cursor-grabbing'
          : isCalibratingBackground
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
    >
      {/* Floating Left Quick-Insert HUD: Banco Virtual (Mesas, Cuadrados Decorativos, Repisas) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 select-none"
      >
        <button
          onClick={() => setIsPlanLibraryOpen((v) => !v)}
          className={`px-3 py-1.5 rounded-xl border shadow-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
            isPlanLibraryOpen
              ? 'bg-[#2563EB] text-white border-[#2563EB]'
              : 'bg-white/95 dark:bg-[#1A1F2C]/95 text-[#171717] dark:text-[#F8FAFC] border-[#E6E4DD] dark:border-[#334155] hover:border-[#2563EB]'
          }`}
          title="Abrir Banco Virtual de Mesas de Restaurante, Cuadrados Decorativos, Repisas y Escalas"
        >
          <Package className="w-3.5 h-3.5 text-[#2563EB] group-hover:text-white" />
          <span>Banco Virtual CAD</span>
        </button>

        {onPlaceGraphicResourceInPlan && graphicResources.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 bg-white/95 dark:bg-[#1A1F2C]/95 border border-[#E6E4DD] dark:border-[#334155] rounded-xl px-2 py-1 shadow-md text-[11px]">
            <button
              onClick={() => {
                const table =
                  graphicResources.find((r) => r.id === 'res-table-4p-square') ||
                  graphicResources.find((r) => r.category === 'restaurant_tables');
                if (table) onPlaceGraphicResourceInPlan(table);
              }}
              className="px-2 py-0.5 rounded hover:bg-blue-50 text-[#171717] hover:text-[#2563EB] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Insertar mesa de restaurante en planta"
            >
              <Plus className="w-3 h-3 text-[#2563EB]" />
              <span>Mesa restaurante</span>
            </button>
            <div className="h-3 w-px bg-[#E6E4DD]" />
            <button
              onClick={() => {
                const sq =
                  graphicResources.find((r) => r.id === 'res-decor-square-botanical') ||
                  graphicResources.find((r) => r.category === 'decor_squares');
                if (sq) onPlaceGraphicResourceInPlan(sq);
              }}
              className="px-2 py-0.5 rounded hover:bg-blue-50 text-[#171717] hover:text-[#2563EB] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Insertar cuadrado donde hay decoración"
            >
              <Plus className="w-3 h-3 text-[#059669]" />
              <span>Cuadrado decoración</span>
            </button>
            <div className="h-3 w-px bg-[#E6E4DD]" />
            <button
              onClick={() => {
                const shelf =
                  graphicResources.find((r) => r.id === 'res-shelf-floating-decor') ||
                  graphicResources.find((r) => r.category === 'shelves');
                if (shelf) onPlaceGraphicResourceInPlan(shelf);
              }}
              className="px-2 py-0.5 rounded hover:bg-blue-50 text-[#171717] hover:text-[#2563EB] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Insertar repisa con decoración"
            >
              <Plus className="w-3 h-3 text-[#D97706]" />
              <span>Repisa</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Reference Photo HUD */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#1A1F2C]/95 border border-[#E6E4DD] dark:border-[#334155] shadow-md text-xs select-none"
      >
        <span className="font-semibold text-[#171717] dark:text-[#F8FAFC] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Foto de Referencia</span>
        </span>

        {bgImg ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (onUpdateBackgroundPlan) {
                  onUpdateBackgroundPlan({ visible: !bgVisible });
                } else if (onToggleReferenceVisible) {
                  onToggleReferenceVisible();
                }
              }}
              title={bgVisible ? 'Ocultar foto de referencia' : 'Mostrar foto de referencia'}
              className={`p-1 rounded cursor-pointer transition-colors ${
                bgVisible
                  ? 'bg-blue-50 text-[#2563EB] dark:bg-blue-900/40'
                  : 'text-[#A3A3A3] hover:text-[#171717]'
              }`}
            >
              {bgVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            <span className="text-[11px] font-mono text-[#737373] tabular-nums">
              {Math.round(bgOpacity * 100)}%
            </span>

            {onDeleteBackgroundImage && (
              <button
                onClick={() => {
                  if (window.confirm('¿Deseas eliminar la foto de referencia del plano?')) {
                    onDeleteBackgroundImage();
                  }
                }}
                title="Eliminar foto de referencia"
                className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => bgFileInputRef.current?.click()}
            className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-[11px] font-medium flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>Subir foto</span>
          </button>
        )}

        <input
          ref={bgFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const { dataUrl } = await optimizeImageFile(file, 1600, 0.75);
              onUploadReferenceImage?.(dataUrl);
            } catch (err) {
              console.error('Error optimizando foto de referencia:', err);
            }
            e.target.value = '';
          }}
        />
      </div>
      {/* 2-Point Calibration Mode Floating Banner */}
      {isCalibratingBackground && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 border border-[#2563EB] shadow-lg px-4 py-2.5 rounded-lg flex items-center gap-3 text-xs text-[#171717]">
          <Ruler className="w-4 h-4 text-[#2563EB] shrink-0" />
          <div>
            <div className="font-semibold text-[#171717]">
              Modo Calibración de Escala del Plano
            </div>
            <div className="text-[11px] text-[#737373]">
              {!calibrationPointA
                ? 'Paso 1: Haz clic en el primer punto de referencia conocido (Punto A).'
                : !calibrationPointB
                ? 'Paso 2: Haz clic en el segundo punto de referencia (Punto B).'
                : 'Paso 3: Introduce la distancia real.'}
            </div>
          </div>
          <button
            onClick={() => {
              setCalibrationPointA(null);
              setCalibrationPointB(null);
              onCancelCalibration?.();
            }}
            className="px-2.5 py-1 rounded bg-[#FAF8F5] hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-medium cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Calibration Distance Prompt Modal */}
      {showDistPrompt && calibrationPointA && calibrationPointB && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-white border border-[#2563EB] shadow-2xl p-4 rounded-lg w-80 text-xs space-y-3"
        >
          <div className="font-semibold text-[#171717] flex items-center gap-1.5">
            <Ruler className="w-4 h-4 text-[#2563EB]" />
            <span>Distancia Real de Referencia</span>
          </div>
          <p className="text-[11px] text-[#737373]">
            Introduce la medida real en metros entre los 2 puntos que acabas de marcar en el plano:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step={0.05}
              min={0.1}
              value={measuredDistInput}
              autoFocus
              onChange={(e) => setMeasuredDistInput(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded border border-[#E6E4DD] font-mono text-xs"
            />
            <span className="font-medium text-[#171717]">metros</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setShowDistPrompt(false);
                setCalibrationPointA(null);
                setCalibrationPointB(null);
                onCancelCalibration?.();
              }}
              className="px-3 py-1 rounded border border-[#E6E4DD] text-[#737373] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const realDist = Number(measuredDistInput);
                if (realDist > 0 && onFinishTwoPointCalibration) {
                  onFinishTwoPointCalibration(realDist, calibrationPointA, calibrationPointB);
                }
                setShowDistPrompt(false);
                setCalibrationPointA(null);
                setCalibrationPointB(null);
              }}
              className="px-3 py-1 rounded bg-[#2563EB] text-white font-medium cursor-pointer"
            >
              Aplicar escala
            </button>
          </div>
        </div>
      )}

      {/* Main Architectural Vector SVG Viewport */}
      <svg
        ref={svgRef}
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="clean-grid"
            width={SCALE_PX_PER_M}
            height={SCALE_PX_PER_M}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${SCALE_PX_PER_M} 0 L 0 0 0 ${SCALE_PX_PER_M}`}
              fill="none"
              stroke="#ECEAE4"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Subtle Technical Grid */}
          {layers.grid && (
            <rect
              x={-SCALE_PX_PER_M * 4}
              y={-SCALE_PX_PER_M * 4}
              width={SCALE_PX_PER_M * 22}
              height={SCALE_PX_PER_M * 16}
              fill="url(#clean-grid)"
            />
          )}

          {/* CAPA 1: Background Plan Overlay with Pan, Scale & Rotation */}
          {bgVisible && bgImg && (
            <g
              transform={`translate(${bgX}, ${bgY}) rotate(${bgRot}) scale(${bgScale})`}
              className={backgroundPlan?.locked ? 'pointer-events-none' : ''}
            >
              <image
                href={bgImg}
                xlinkHref={bgImg}
                x={-85}
                y={-85}
                width={1105}
                height={807}
                opacity={bgOpacity}
                preserveAspectRatio="none"
              />
            </g>
          )}

          {/* 2-Point Calibration Visual Markers */}
          {calibrationPointA && (
            <g transform={`translate(${calibrationPointA.x * SCALE_PX_PER_M}, ${calibrationPointA.y * SCALE_PX_PER_M})`}>
              <circle r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              <text y="-10" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2563EB">
                Punto A
              </text>
            </g>
          )}

          {calibrationPointB && (
            <g transform={`translate(${calibrationPointB.x * SCALE_PX_PER_M}, ${calibrationPointB.y * SCALE_PX_PER_M})`}>
              <circle r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              <text y="-10" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2563EB">
                Punto B
              </text>
              {calibrationPointA && (
                <line
                  x1={(calibrationPointA.x - calibrationPointB.x) * SCALE_PX_PER_M}
                  y1={(calibrationPointA.y - calibrationPointB.y) * SCALE_PX_PER_M}
                  x2={0}
                  y2={0}
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
              )}
            </g>
          )}

          {/* Note: Removed self-intersecting polygon of raw vertices array to prevent white triangular shards when moving/forking walls */}

          {/* Minimalist Entrance Arrow */}
          <g transform={`translate(0, ${2.1 * SCALE_PX_PER_M})`}>
            <path
              d="M -22,0 L 18,0 M 10,-5 L 18,0 L 10,5"
              stroke="#737373"
              strokeWidth="1.2"
              fill="none"
            />
            <text
              x="-28"
              y="3"
              textAnchor="end"
              fill="#737373"
              fontSize="9"
              fontFamily="DM Sans, sans-serif"
            >
              Acceso
            </text>
          </g>

          {/* Selected Zones Highlight Outlines / Group Hull */}
          {selectedZoneIds.length > 0 && (
            <g className="pointer-events-none">
              {selectedZoneIds.map((zId) => {
                const zWalls = walls.filter((w) => w.zoneId === zId && w.visible);
                const z = zoneMap.get(zId);
                if (zWalls.length === 0 || !z) return null;
                return (
                  <g key={`sel-zone-hull-${zId}`}>
                    {zWalls.map((w) => {
                      const vs = vertexMap.get(w.startVertexId);
                      const ve = vertexMap.get(w.endVertexId);
                      if (!vs || !ve) return null;
                      return (
                        <line
                          key={`hull-w-${w.id}`}
                          x1={vs.x * SCALE_PX_PER_M}
                          y1={vs.y * SCALE_PX_PER_M}
                          x2={ve.x * SCALE_PX_PER_M}
                          y2={ve.y * SCALE_PX_PER_M}
                          stroke="#2563EB"
                          strokeWidth="20"
                          strokeOpacity="0.16"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </g>
                );
              })}
            </g>
          )}

          {/* CAPA 3: Space / Zone Labels with Independent Drag & Position */}
          {isLayerActive('zoneLabels', layers.participants) &&
            zones
              .filter((z) => z.visible && (z.labelVisible !== false))
              .map((zone) => {
                const zWalls = walls.filter((w) => w.zoneId === zone.id && w.visible);
                if (zWalls.length === 0) return null;

                const isZoneSelected = selectedZoneIds.includes(zone.id);

                // Calculate default center if custom label position is not set
                let lx = zone.labelX;
                let ly = zone.labelY;

                if (lx === undefined || ly === undefined) {
                  let sumX = 0;
                  let sumY = 0;
                  zWalls.forEach((w) => {
                    const vs = vertexMap.get(w.startVertexId);
                    const ve = vertexMap.get(w.endVertexId);
                    if (vs && ve) {
                      sumX += (vs.x + ve.x) / 2;
                      sumY += (vs.y + ve.y) / 2;
                    }
                  });
                  lx = sumX / zWalls.length;
                  ly = sumY / zWalls.length;

                  const firstNorm = zWalls[0].normalSide;
                  if (firstNorm === 'left') lx -= 0.65;
                  else if (firstNorm === 'right') lx += 0.65;
                  else if (firstNorm === 'bottom') ly += 0.55;
                  else if (firstNorm === 'top') ly -= 0.55;
                }

                const labelColor = isZoneSelected ? '#2563EB' : zone.labelColor || '#171717';
                const fontSize = zone.labelFontSize || 11;
                const rot = zone.labelRotation || 0;

                return (
                  <g
                    key={`label-${zone.id}`}
                    transform={`translate(${lx * SCALE_PX_PER_M}, ${ly * SCALE_PX_PER_M}) rotate(${rot})`}
                    className={zone.labelLocked ? 'cursor-default' : 'cursor-move'}
                    onMouseDown={(e) => {
                      if (!zone.labelLocked) {
                        e.stopPropagation();
                        if (e.button === 0) {
                          if (e.shiftKey || e.metaKey || e.ctrlKey) {
                            onSelectZone?.(zone.id, true);
                          } else {
                            onSelectZone?.(zone.id, false);
                          }
                          const pt = clientToMeters(e.clientX, e.clientY);
                          const targets =
                            selectedZoneIds.includes(zone.id) && selectedZoneIds.length > 1
                              ? selectedZoneIds
                              : [zone.id];
                          setDraggingZoneIds(targets);
                          setZoneDragStart(pt);
                          setAccumulatedZoneDelta({ x: 0, y: 0 });
                        }
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onSelectWall(zWalls[0]?.id || null, true);
                    }}
                  >
                    <rect
                      x={-zone.name.length * 3.5 - 8}
                      y={-fontSize + 1}
                      width={zone.name.length * 7 + 16}
                      height={fontSize + 6}
                      fill={isZoneSelected ? '#EFF6FF' : '#FFFFFF'}
                      fillOpacity="0.9"
                      rx="4"
                      stroke={isZoneSelected ? '#2563EB' : '#E6E4DD'}
                      strokeWidth={isZoneSelected ? '1.5' : '0.5'}
                    />
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      fill={labelColor}
                      fontSize={fontSize}
                      fontWeight="600"
                      fontFamily="DM Sans, sans-serif"
                    >
                      {zone.name}
                    </text>
                  </g>
                );
              })}

          {/* Independent Floor Plan Annotations */}
          {isLayerActive('texts', layers.texts) &&
            annotations
              .filter((a) => a.visible)
              .map((ann) => {
                const lines = ann.text.split('\n');
                return (
                  <g
                    key={ann.id}
                    transform={`translate(${ann.xM * SCALE_PX_PER_M}, ${ann.yM * SCALE_PX_PER_M}) rotate(${ann.rotation})`}
                    className="pointer-events-none select-none"
                  >
                    <text
                      x="0"
                      y="0"
                      fill={ann.color}
                      fontSize={ann.fontSize}
                      fontFamily="DM Sans, sans-serif"
                      fontWeight="500"
                    >
                      {lines.map((line, idx) => (
                        <tspan
                          key={idx}
                          x="0"
                          dy={idx === 0 ? 0 : ann.fontSize * 1.25}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}

          {/* CAPA 2: Walls, Artworks & Dimensions (Each sub-layer checked independently) */}
          {[...walls]
            .sort((a, b) =>
              a.id === selectedWallId ? 1 : b.id === selectedWallId ? -1 : 0
            )
            .map((wall) => {
              const zone = zoneMap.get(wall.zoneId);
              if (!wall.visible || (zone && !zone.visible)) return null;

              const vs = vertexMap.get(wall.startVertexId);
              const ve = vertexMap.get(wall.endVertexId);
              if (!vs || !ve) return null;

              const x1 = vs.x * SCALE_PX_PER_M;
              const y1 = vs.y * SCALE_PX_PER_M;
              const x2 = ve.x * SCALE_PX_PER_M;
              const y2 = ve.y * SCALE_PX_PER_M;

              const dx = x2 - x1;
              const dy = y2 - y1;
              const segLenPx = Math.hypot(dx, dy) || 1;
              const ux = dx / segLenPx;
              const uy = dy / segLenPx;

              let nx = 0;
              let ny = 1;
              if (wall.normalSide === 'bottom') {
                nx = 0;
                ny = 1;
              } else if (wall.normalSide === 'top') {
                nx = 0;
                ny = -1;
              } else if (wall.normalSide === 'left') {
                nx = -1;
                ny = 0;
              } else if (wall.normalSide === 'right') {
                nx = 1;
                ny = 0;
              }

              const isSelected = selectedWallId === wall.id;
              const strokeWidthPx = Math.max(
                6,
                (wall.thicknessCm / 100) * SCALE_PX_PER_M * 0.75
              );
              const wallColor = isSelected ? '#2563EB' : '#171717';

              const wallItems = items.filter(
                (it) => it.wallId === wall.id && it.visible
              );

              // Discreet Red Dimension Line (Cota)
              const dimOffset = wall.dimOffset !== undefined ? wall.dimOffset : -18;
              const dimX1 = x1 + nx * dimOffset;
              const dimY1 = y1 + ny * dimOffset;
              const dimX2 = x2 + nx * dimOffset;
              const dimY2 = y2 + ny * dimOffset;
              const midDimX = (dimX1 + dimX2) / 2;
              const midDimY = (dimY1 + dimY2) / 2;

              const showWallGeometry = isLayerActive('walls', layers.walls);
              const isSecondaryUnselectedFace =
                Boolean(wall.faceLabel?.includes('Cara B')) && !isSelected;
              const showDimensions =
                isLayerActive('dimensions', layers.dimensions) &&
                !isSecondaryUnselectedFace;

              const linkedWall = walls.find(
                (w) =>
                  w.id !== wall.id &&
                  (w.id === wall.linkedWallId ||
                    w.linkedWallId === wall.id ||
                    (w.startVertexId === wall.startVertexId &&
                      w.endVertexId === wall.endVertexId))
              );

              return (
                <g key={wall.id}>
                  {/* Invisible Hit Area for solid walls */}
                  {showWallGeometry && wall.thicknessCm > 0 && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth={strokeWidthPx + 18}
                      strokeLinecap="square"
                      className={wall.locked ? 'cursor-pointer' : 'cursor-move'}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (e.button === 0) {
                          onSelectWall(wall.id, false);
                          if (!wall.locked && onMoveWall) {
                            const pt = clientToMeters(e.clientX, e.clientY);
                            setDraggingWallId(wall.id);
                            setWallDragStart(pt);
                            setAccumulatedWallDelta({ x: 0, y: 0 });
                          }
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onSelectWall(wall.id, true);
                      }}
                    />
                  )}

                  {/* Vano de Acceso (thicknessCm === 0) */}
                  {showWallGeometry && wall.thicknessCm === 0 && (
                    <g>
                      {/* Large Hit Area for Vano */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="transparent"
                        strokeWidth={26}
                        className={wall.locked ? 'cursor-pointer' : 'cursor-move'}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (e.button === 0) {
                            onSelectWall(wall.id, false);
                            if (!wall.locked && onMoveWall) {
                              const pt = clientToMeters(e.clientX, e.clientY);
                              setDraggingWallId(wall.id);
                              setWallDragStart(pt);
                              setAccumulatedWallDelta({ x: 0, y: 0 });
                            }
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          onSelectWall(wall.id, true);
                        }}
                      />

                      {/* Selection glow for Vano */}
                      {isSelected && (
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#2563EB"
                          strokeOpacity={0.25}
                          strokeWidth={14}
                          className="pointer-events-none"
                        />
                      )}

                      {/* Dashed Architectural Opening Line */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isSelected ? '#2563EB' : '#059669'}
                        strokeWidth={isSelected ? 3.5 : 2.5}
                        strokeDasharray="6,4"
                        strokeLinecap="round"
                        className="pointer-events-none"
                      />
                      <circle cx={x1} cy={y1} r={3.5} fill={isSelected ? '#2563EB' : '#059669'} />
                      <circle cx={x2} cy={y2} r={3.5} fill={isSelected ? '#2563EB' : '#059669'} />
                    </g>
                  )}

                  {/* Selection Glow */}
                  {showWallGeometry && isSelected && wall.thicknessCm > 0 && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#2563EB"
                      strokeOpacity={0.18}
                      strokeWidth={strokeWidthPx + 10}
                      strokeLinecap="square"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Clean Wall Line */}
                  {showWallGeometry && wall.thicknessCm > 0 && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={wallColor}
                      strokeWidth={strokeWidthPx}
                      strokeLinecap="square"
                      className={`${wall.locked ? 'cursor-pointer' : 'cursor-move'} transition-colors`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (e.button === 0) {
                          onSelectWall(wall.id, false);
                          if (!wall.locked && onMoveWall) {
                            const pt = clientToMeters(e.clientX, e.clientY);
                            setDraggingWallId(wall.id);
                            setWallDragStart(pt);
                            setAccumulatedWallDelta({ x: 0, y: 0 });
                          }
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onSelectWall(wall.id, true);
                      }}
                    />
                  )}

                  {/* Simplified Architectural Artworks along Wall */}
                  {wallItems.map((it) => {
                    const isText =
                      it.type === 'text' ||
                      it.type === 'title' ||
                      it.type === 'description';
                    const isPerson = Boolean(it.category?.startsWith('people'));
                    const isFurniture =
                      it.category === 'furniture' ||
                      it.category === 'vitrines' ||
                      it.category === 'pedestals' ||
                      it.type === 'decor';
                    const isReference = it.type === 'reference';

                    // Check custom layer assignment first if present
                    if (it.layerId && layerStates.some((l) => l.id === it.layerId)) {
                      if (!isLayerActive(it.layerId, true)) return null;
                    } else if (isText) {
                      if (!isLayerActive('texts', layers.texts)) return null;
                    } else if (isPerson) {
                      if (!isLayerActive('people', true)) return null;
                    } else if (isFurniture) {
                      if (!isLayerActive('furniture', true)) return null;
                    } else if (isReference) {
                      if (!isLayerActive('references', true)) return null;
                    } else {
                      if (!isLayerActive('artworks', layers.photos)) return null;
                    }

                    // Individual item direction override or fallback to wall.normalSide
                    const effectiveSide = it.normalSide || wall.normalSide;
                    let itemNx = nx;
                    let itemNy = ny;
                    if (effectiveSide === 'bottom') {
                      itemNx = 0;
                      itemNy = 1;
                    } else if (effectiveSide === 'top') {
                      itemNx = 0;
                      itemNy = -1;
                    } else if (effectiveSide === 'left') {
                      itemNx = -1;
                      itemNy = 0;
                    } else if (effectiveSide === 'right') {
                      itemNx = 1;
                      itemNy = 0;
                    }

                    const ratioStart = it.xCm / 100 / Math.max(0.1, wall.lengthM);
                    const ratioWidth = it.widthCm / 100 / Math.max(0.1, wall.lengthM);
                    const itemStartDist = ratioStart * segLenPx;
                    const itemLenPx = Math.max(5, ratioWidth * segLenPx);

                    const offsetFromWallCenter = strokeWidthPx / 2 + 2;
                    const boxDepth = 7; // depth protruding from wall

                    const p1x = x1 + ux * itemStartDist + itemNx * offsetFromWallCenter;
                    const p1y = y1 + uy * itemStartDist + itemNy * offsetFromWallCenter;
                    const p2x = p1x + ux * itemLenPx;
                    const p2y = p1y + uy * itemLenPx;
                    const p3x = p2x + itemNx * boxDepth;
                    const p3y = p2y + itemNy * boxDepth;
                    const p4x = p1x + itemNx * boxDepth;
                    const p4y = p1y + itemNy * boxDepth;

                    // Center front of artwork for subtle viewing direction tick
                    const frontMidX = (p3x + p4x) / 2;
                    const frontMidY = (p3y + p4y) / 2;
                    const arrowTipX = frontMidX + itemNx * 4.5;
                    const arrowTipY = frontMidY + itemNy * 4.5;

                    const isItemSel = selectedItemIds.includes(it.id);

                    // Category palette matching the original blueprint colors
                    let boxStroke = '#525252';
                    let boxFill = '#F5F5F4';

                    if (isItemSel) {
                      boxStroke = '#2563EB';
                      boxFill = '#DBEAFE';
                    } else if (it.zoneId === 'zone-carlos') {
                      boxStroke = '#D97706';
                      boxFill = '#FEF3C7';
                    } else if (it.zoneId === 'zone-andrea') {
                      boxStroke = '#2563EB';
                      boxFill = '#EFF6FF';
                    } else if (it.zoneId === 'zone-clara' || it.zoneId === 'zone-clarena') {
                      boxStroke = '#DB2777';
                      boxFill = '#FDF2F8';
                    } else if (it.zoneId === 'zone-villamaga' || it.zoneId === 'zone-jhon-villarraga') {
                      boxStroke = '#059669';
                      boxFill = '#ECFDF5';
                    } else if (it.zoneId === 'zone-pasillo-cata' || it.zoneId === 'zone-catalina') {
                      boxStroke = '#0D9488';
                      boxFill = '#CCFBF1';
                    } else if (it.zoneId === 'zone-jhon-edwin' || it.zoneId === 'zone-jhon') {
                      boxStroke = '#D97706';
                      boxFill = '#FEF3C7';
                    } else if (isText) {
                      boxStroke = '#64748B';
                      boxFill = '#F1F5F9';
                    } else {
                      boxStroke = '#D97706';
                      boxFill = '#FEF9C3';
                    }

                    return (
                      <g key={it.id}>
                        <polygon
                          points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`}
                          stroke={boxStroke}
                          strokeWidth={isItemSel ? 2 : 1.2}
                          fill={boxFill}
                          fillOpacity={0.9}
                          className="cursor-pointer transition-all hover:opacity-100"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onSelectWall(wall.id, false);
                            onSelectItem(it.id, e.shiftKey || e.metaKey || e.ctrlKey);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            onSelectWall(wall.id, true);
                            onSelectItem(it.id, false);
                          }}
                        >
                          <title>{`${it.name} (${it.widthCm} × ${it.heightCm} cm) · Mira hacia: ${effectiveSide === 'bottom' ? 'Abajo (↓)' : effectiveSide === 'top' ? 'Arriba (↑)' : effectiveSide === 'left' ? 'Izquierda (←)' : 'Derecha (→)'}`}</title>
                        </polygon>
                        {/* Viewing Direction Tick on Selected or Hovered Artworks */}
                        {isItemSel && (
                          <line
                            x1={frontMidX}
                            y1={frontMidY}
                            x2={arrowTipX}
                            y2={arrowTipY}
                            stroke="#2563EB"
                            strokeWidth={1.8}
                            strokeLinecap="round"
                            className="pointer-events-none"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Discreet Red Dimension Line (Cota roja con extremos en cruz y líneas de cota) */}
                  {showDimensions && (
                    <g className="pointer-events-none">
                      {/* Witness lines from wall corners */}
                      {Math.abs(dimOffset) > 6 && (
                        <>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={dimX1 + nx * 3}
                            y2={dimY1 + ny * 3}
                            stroke="#DC2626"
                            strokeWidth="0.5"
                            strokeOpacity="0.4"
                          />
                          <line
                            x1={x2}
                            y1={y2}
                            x2={dimX2 + nx * 3}
                            y2={dimY2 + ny * 3}
                            stroke="#DC2626"
                            strokeWidth="0.5"
                            strokeOpacity="0.4"
                          />
                        </>
                      )}
                      <line
                        x1={dimX1}
                        y1={dimY1}
                        x2={dimX2}
                        y2={dimY2}
                        stroke="#DC2626"
                        strokeWidth="0.85"
                        strokeOpacity="0.85"
                      />
                      <line
                        x1={dimX1 - nx * 3.5}
                        y1={dimY1 - ny * 3.5}
                        x2={dimX1 + nx * 3.5}
                        y2={dimY1 + ny * 3.5}
                        stroke="#DC2626"
                        strokeWidth="0.85"
                      />
                      <line
                        x1={dimX2 - nx * 3.5}
                        y1={dimY2 - ny * 3.5}
                        x2={dimX2 + nx * 3.5}
                        y2={dimY2 + ny * 3.5}
                        stroke="#DC2626"
                        strokeWidth="0.85"
                      />
                      {(() => {
                        // Always use live wall.lengthM so resizing/moving vertices updates the red dimension badge immediately
                        const labelText =
                          wall.dimensionLabel === 'Longitud Total'
                            ? `Longitud Total (${wall.lengthM.toFixed(2)} m)`
                            : wall.thicknessCm === 0
                            ? `Vano ${wall.lengthM.toFixed(2)} m`
                            : `${wall.lengthM.toFixed(2)} m`;
                        const badgeWidth = Math.max(38, labelText.length * 6.2 + 10);
                        return (
                          <g>
                            <rect
                              x={midDimX - badgeWidth / 2}
                              y={midDimY - 6.5}
                              width={badgeWidth}
                              height={13}
                              fill="#FAF8F5"
                              stroke="#DC2626"
                              strokeWidth="0.3"
                              rx="1.5"
                            />
                            <text
                              x={midDimX}
                              y={midDimY + 3.2}
                              textAnchor="middle"
                              fontSize="8.5"
                              fontFamily="JetBrains Mono, monospace"
                              fill="#DC2626"
                              fontWeight="600"
                            >
                              {labelText}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  )}

                  {/* Selected Wall Interactive Handles & Center Move Gizmo + Flip Artwork Direction Handle */}
                  {isSelected && !wall.locked && (
                    <g>
                      {/* Start Vertex Drag Handle */}
                      <circle
                        cx={x1}
                        cy={y1}
                        r={7}
                        fill="#2563EB"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        className="cursor-move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (e.button === 0) {
                            setDraggingVertexId(wall.startVertexId);
                          }
                        }}
                      >
                        <title>Arrastrar extremo inicial del muro</title>
                      </circle>

                      {/* End Vertex Drag Handle */}
                      <circle
                        cx={x2}
                        cy={y2}
                        r={7}
                        fill="#2563EB"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        className="cursor-move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (e.button === 0) {
                            setDraggingVertexId(wall.endVertexId);
                          }
                        }}
                      >
                        <title>Arrastrar extremo final del muro</title>
                      </circle>

                      {/* Center Wall Move Gizmo Handle */}
                      <g
                        transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}
                        className="cursor-move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (e.button === 0 && onMoveWall) {
                            const pt = clientToMeters(e.clientX, e.clientY);
                            setDraggingWallId(wall.id);
                            setWallDragStart(pt);
                            setAccumulatedWallDelta({ x: 0, y: 0 });
                          }
                        }}
                      >
                        <circle
                          r={13}
                          fill="#2563EB"
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        />
                        <path
                          d="M 0,-7 L -3,-3 L 3,-3 Z M 0,7 L -3,3 L 3,3 Z M -7,0 L -3,-3 L -3,3 Z M 7,0 L 3,-3 L 3,3 Z M 0,-4 L 0,4 M -4,0 L 4,0"
                          stroke="#FFFFFF"
                          strokeWidth={1.4}
                          fill="#FFFFFF"
                        />
                        <title>Arrastrar para mover el muro completo</title>
                      </g>

                      {/* Artwork Facing Direction Arrow & Click-to-Flip Button */}
                      {wall.thicknessCm > 0 && onFlipWallDirection && (
                        <g
                          transform={`translate(${(x1 + x2) / 2 + nx * 28}, ${(y1 + y2) / 2 + ny * 28})`}
                          className="cursor-pointer"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (e.button === 0) {
                              onFlipWallDirection(wall.id);
                            }
                          }}
                        >
                          <line
                            x1={-nx * 14}
                            y1={-ny * 14}
                            x2={0}
                            y2={0}
                            stroke="#059669"
                            strokeWidth={2}
                            strokeDasharray="2,2"
                          />
                          <rect
                            x={-24}
                            y={-9}
                            width={48}
                            height={18}
                            rx={9}
                            fill="#059669"
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                          />
                          <text
                            x={0}
                            y={3.5}
                            textAnchor="middle"
                            fontSize="8.5"
                            fontWeight="bold"
                            fontFamily="DM Sans, sans-serif"
                            fill="#FFFFFF"
                          >
                            {wall.normalSide === 'bottom'
                              ? '↓ Cara'
                              : wall.normalSide === 'top'
                              ? '↑ Cara'
                              : wall.normalSide === 'left'
                              ? '← Cara'
                              : '→ Cara'}
                          </text>
                          <title>Hacer clic para invertir hacia dónde miran las obras de este muro (⇄)</title>
                        </g>
                      )}

                      {/* Double-Sided Wall Opposite Face Switcher Pill on Canvas */}
                      {linkedWall && (
                        <g
                          transform={`translate(${(x1 + x2) / 2 - nx * 28}, ${(y1 + y2) / 2 - ny * 28})`}
                          className="cursor-pointer"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (e.button === 0) {
                              onSelectWall(linkedWall.id, false);
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            onSelectWall(linkedWall.id, true);
                          }}
                        >
                          <line
                            x1={nx * 14}
                            y1={ny * 14}
                            x2={0}
                            y2={0}
                            stroke="#2563EB"
                            strokeWidth={1.8}
                            strokeDasharray="2,2"
                          />
                          <rect
                            x={-44}
                            y={-9}
                            width={88}
                            height={18}
                            rx={9}
                            fill="#2563EB"
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                          />
                          <text
                            x={0}
                            y={3.5}
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="DM Sans, sans-serif"
                            fill="#FFFFFF"
                          >
                            {`⇄ ${linkedWall.participant.slice(0, 12)}`}
                          </text>
                          <title>{`Cambiar a la otra cara del muro (${linkedWall.name} · ${linkedWall.participant})`}</title>
                        </g>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

          {/* CAPA 4: Freestanding Floor Plan Elements (Mesas de Restaurante, Cuadrados Decorativos, Repisas, Plantas) */}
          {planElements
            .filter((pe) => {
              if (!pe.visible) return false;
              const lKey =
                pe.layerId ||
                (pe.category === 'restaurant_tables' || pe.category === 'furniture'
                  ? 'furniture'
                  : 'decor');
              return isLayerActive(lKey, true);
            })
            .map((pe) => {
              const cxPx = pe.xM * SCALE_PX_PER_M;
              const cyPx = pe.yM * SCALE_PX_PER_M;
              const wPx = Math.max(16, (pe.widthCm / 100) * SCALE_PX_PER_M);
              const dPx = Math.max(12, (pe.depthCm / 100) * SCALE_PX_PER_M);
              const isPeSelected = selectedPlanElementId === pe.id;
              const imgUrl = pe.planSvgUrl || pe.previewUrl;

              return (
                <g
                  key={pe.id}
                  transform={`translate(${cxPx}, ${cyPx}) rotate(${pe.rotation || 0})`}
                  className={pe.locked ? 'cursor-pointer' : 'cursor-move'}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (e.button === 0) {
                      onSelectPlanElement?.(pe.id);
                      if (!pe.locked) {
                        const pt = clientToMeters(e.clientX, e.clientY);
                        setDraggingPlanElemState({
                          id: pe.id,
                          mode: 'move',
                          startXM: pt.x,
                          startYM: pt.y,
                          initXM: pe.xM,
                          initYM: pe.yM,
                          initWidthCm: pe.widthCm,
                          initDepthCm: pe.depthCm,
                        });
                      }
                    }
                  }}
                >
                  {/* Selection Highlight Aura */}
                  {isPeSelected && (
                    <rect
                      x={-wPx / 2 - 4}
                      y={-dPx / 2 - 4}
                      width={wPx + 8}
                      height={dPx + 8}
                      rx={6}
                      fill="#2563EB"
                      fillOpacity={0.12}
                      stroke="#2563EB"
                      strokeWidth={1.8}
                      strokeDasharray="4,2"
                    />
                  )}

                  {/* CAD Symbol or Fallback Geometric Box */}
                  {imgUrl ? (
                    <image
                      href={imgUrl}
                      xlinkHref={imgUrl}
                      x={-wPx / 2}
                      y={-dPx / 2}
                      width={wPx}
                      height={dPx}
                      preserveAspectRatio="none"
                    />
                  ) : (
                    <rect
                      x={-wPx / 2}
                      y={-dPx / 2}
                      width={wPx}
                      height={dPx}
                      rx={4}
                      fill={pe.color || '#F5F3ED'}
                      stroke="#171717"
                      strokeWidth={1.8}
                    />
                  )}

                  {/* Label & Dimensions Tag below Element */}
                  <g transform={`translate(0, ${dPx / 2 + 10})`}>
                    <rect
                      x={-Math.max(36, pe.name.length * 2.8 + 8)}
                      y={-7}
                      width={Math.max(72, pe.name.length * 5.6 + 16)}
                      height={13}
                      rx={3}
                      fill={isPeSelected ? '#2563EB' : '#FFFFFF'}
                      fillOpacity={0.92}
                      stroke={isPeSelected ? '#1D4ED8' : '#E6E4DD'}
                      strokeWidth={0.8}
                    />
                    <text
                      x={0}
                      y={2.5}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="600"
                      fontFamily="DM Sans, sans-serif"
                      fill={isPeSelected ? '#FFFFFF' : '#171717'}
                    >
                      {`${pe.name.slice(0, 22)} (${(pe.widthCm / 100).toFixed(2)}×${(pe.depthCm / 100).toFixed(2)}m)`}
                    </text>
                  </g>

                  {/* Interactive Controls when Selected: Rotate +45°, Delete, and Corner Resize */}
                  {isPeSelected && !pe.locked && (
                    <g>
                      {/* Top Action Pill: Rotate 45° */}
                      <g
                        transform={`translate(-24, ${-dPx / 2 - 18})`}
                        className="cursor-pointer"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          onUpdatePlanElement?.(pe.id, {
                            rotation: ((pe.rotation || 0) + 45) % 360,
                          });
                        }}
                      >
                        <rect
                          x={-22}
                          y={-8}
                          width={44}
                          height={16}
                          rx={8}
                          fill="#2563EB"
                          stroke="#FFFFFF"
                          strokeWidth={1.2}
                        />
                        <text
                          x={0}
                          y={3}
                          textAnchor="middle"
                          fontSize="7.5"
                          fontWeight="bold"
                          fill="#FFFFFF"
                        >
                          ↻ 45°
                        </text>
                        <title>Rotar elemento 45°</title>
                      </g>

                      {/* Top Action Pill: Delete */}
                      {onDeletePlanElement && (
                        <g
                          transform={`translate(24, ${-dPx / 2 - 18})`}
                          className="cursor-pointer"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onDeletePlanElement(pe.id);
                          }}
                        >
                          <rect
                            x={-20}
                            y={-8}
                            width={40}
                            height={16}
                            rx={8}
                            fill="#DC2626"
                            stroke="#FFFFFF"
                            strokeWidth={1.2}
                          />
                          <text
                            x={0}
                            y={3}
                            textAnchor="middle"
                            fontSize="7.5"
                            fontWeight="bold"
                            fill="#FFFFFF"
                          >
                            Eliminar
                          </text>
                          <title>Eliminar este elemento del plano</title>
                        </g>
                      )}

                      {/* Bottom-Right Resize Handle */}
                      <circle
                        cx={wPx / 2}
                        cy={dPx / 2}
                        r={6}
                        fill="#2563EB"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        className="cursor-nwse-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (e.button === 0) {
                            const pt = clientToMeters(e.clientX, e.clientY);
                            setDraggingPlanElemState({
                              id: pe.id,
                              mode: 'resize',
                              startXM: pt.x,
                              startYM: pt.y,
                              initXM: pe.xM,
                              initYM: pe.yM,
                              initWidthCm: pe.widthCm,
                              initDepthCm: pe.depthCm,
                            });
                          }
                        }}
                      >
                        <title>Arrastrar para cambiar dimensiones (Ancho × Fondo)</title>
                      </circle>
                    </g>
                  )}
                </g>
              );
            })}

          {/* Marquee Selection Rectangle Box */}
          {isMarqueeSelecting && marqueeStart && marqueeCurrent && (
            <rect
              x={Math.min(marqueeStart.x, marqueeCurrent.x) * SCALE_PX_PER_M}
              y={Math.min(marqueeStart.y, marqueeCurrent.y) * SCALE_PX_PER_M}
              width={Math.abs(marqueeCurrent.x - marqueeStart.x) * SCALE_PX_PER_M}
              height={Math.abs(marqueeCurrent.y - marqueeStart.y) * SCALE_PX_PER_M}
              fill="#2563EB"
              fillOpacity="0.12"
              stroke="#2563EB"
              strokeWidth="1.2"
              strokeDasharray="3,3"
            />
          )}

          {/* Active Drawing Preview Line & Length Badge */}
          {isDrawingWall && drawingStart && drawingHover && (
            <g className="pointer-events-none">
              <line
                x1={drawingStart.x * SCALE_PX_PER_M}
                y1={drawingStart.y * SCALE_PX_PER_M}
                x2={drawingHover.x * SCALE_PX_PER_M}
                y2={drawingHover.y * SCALE_PX_PER_M}
                stroke="#2563EB"
                strokeWidth="4"
                strokeDasharray="6,4"
                strokeLinecap="round"
              />
              <circle
                cx={drawingStart.x * SCALE_PX_PER_M}
                cy={drawingStart.y * SCALE_PX_PER_M}
                r="5"
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <circle
                cx={drawingHover.x * SCALE_PX_PER_M}
                cy={drawingHover.y * SCALE_PX_PER_M}
                r="5"
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {(() => {
                const dist = Math.hypot(
                  drawingHover.x - drawingStart.x,
                  drawingHover.y - drawingStart.y
                );
                const midX =
                  ((drawingStart.x + drawingHover.x) / 2) * SCALE_PX_PER_M;
                const midY =
                  ((drawingStart.y + drawingHover.y) / 2) * SCALE_PX_PER_M;
                return (
                  <g>
                    <rect
                      x={midX - 28}
                      y={midY - 18}
                      width="56"
                      height="16"
                      rx="4"
                      fill="#2563EB"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <text
                      x={midX}
                      y={midY - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                      fill="#FFFFFF"
                    >
                      {dist.toFixed(2)} m
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Hovered Magnetic Snap Vertex Ring */}
          {isDrawingWall && hoveredSnapVertex && (
            <circle
              cx={hoveredSnapVertex.x * SCALE_PX_PER_M}
              cy={hoveredSnapVertex.y * SCALE_PX_PER_M}
              r="12"
              fill="#2563EB"
              fillOpacity="0.2"
              stroke="#2563EB"
              strokeWidth="2"
              strokeDasharray="3,3"
              className="pointer-events-none"
            />
          )}
        </g>
      </svg>

      {/* Floating Drawing Mode Banner HUD */}
      {isDrawingWall && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/95 dark:bg-[#1A1F2C]/95 border border-[#2563EB] shadow-lg text-xs animate-in slide-in-from-top-3 duration-150"
        >
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-[#2563EB]">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-[#171717] dark:text-[#F8FAFC]">
              Dibujando muro para «{drawingSpaceName || 'Espacio'}»
            </div>
            <div className="text-[11px] text-[#737373] dark:text-[#94A3B8]">
              {!drawingStart
                ? 'Haz clic en el plano para el punto inicial'
                : 'Haz clic para el punto final · Shift para ortogonal · Doble clic para finalizar'}
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            {drawnSegmentsCount > 0 && onCancelDrawingWall && (
              <button
                onClick={onCancelDrawingWall}
                className="px-2.5 py-1 rounded bg-[#2563EB] text-white font-medium hover:bg-[#1D4ED8] cursor-pointer"
              >
                Finalizar
              </button>
            )}
            {onCancelDrawingWall && (
              <button
                onClick={onCancelDrawingWall}
                className="px-2.5 py-1 rounded border border-[#E6E4DD] dark:border-[#334155] text-[#737373] hover:text-[#171717] dark:hover:text-white cursor-pointer"
              >
                Cancelar (Esc)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Right Click Context Menu */}
      {contextMenu && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-50 bg-white border border-[#E6E4DD] rounded-lg shadow-xl py-1.5 w-52 text-xs text-[#171717] animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 220),
            top: Math.min(contextMenu.y, window.innerHeight - 250),
          }}
        >
          {/* Overlapping items picker */}
          {contextMenu.overlappingItems.length > 1 && (
            <div className="border-b border-[#F0EFEA] pb-1 mb-1">
              <div className="px-3 py-1 text-[10px] text-[#737373] uppercase tracking-wider font-semibold">
                Objetos superpuestos
              </div>
              {contextMenu.overlappingItems.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => {
                    if (obj.type === 'wall') {
                      onSelectWall(obj.id);
                    } else {
                      onSelectItem(obj.id);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1 text-left hover:bg-[#FAF8F5] flex items-center justify-between text-[11px] cursor-pointer"
                >
                  <span className="truncate">{obj.name}</span>
                  <span className="text-[9px] text-[#737373] uppercase">
                    {obj.type === 'wall' ? 'Muro' : 'Obra'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Standard Actions */}
          {contextMenu.wallId && (
            <button
              onClick={() => {
                onSelectWall(contextMenu.wallId!, true);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer font-medium text-[#2563EB]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir elevación</span>
            </button>
          )}

          {contextMenu.itemId && onFlipItemDirection && (
            <button
              onClick={() => {
                onFlipItemDirection(contextMenu.itemId!);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer font-medium text-emerald-700"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Invertir dirección de obra (⇄)</span>
            </button>
          )}

          {contextMenu.wallId && onFlipWallDirection && (
            <button
              onClick={() => {
                onFlipWallDirection(contextMenu.wallId!);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer font-medium text-emerald-700"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Invertir cara del muro (⇄)</span>
            </button>
          )}

          {contextMenu.itemId && onCopyItem && (
            <button
              onClick={() => {
                onCopyItem(contextMenu.itemId!);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#737373]" />
              <span>Copiar obra (Ctrl+C)</span>
            </button>
          )}

          {clipboardItem && onPasteItem && (
            <button
              onClick={() => {
                onPasteItem();
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5 text-[#737373]" />
              <span>Pegar obra (Ctrl+V)</span>
            </button>
          )}

          {onDuplicateSelected && (
            <button
              onClick={() => {
                onDuplicateSelected();
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#737373]" />
              <span>Duplicar (Ctrl+D)</span>
            </button>
          )}

          {onToggleLockSelected && (
            <button
              onClick={() => {
                onToggleLockSelected();
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#737373]" />
              <span>Bloquear / Desbloquear</span>
            </button>
          )}

          {(onDeleteSelected || onPromptDeleteWall) && (
            <div className="border-t border-[#F0EFEA] pt-1 mt-1">
              <button
                onClick={() => {
                  if (contextMenu.itemId) {
                    onSelectItem(contextMenu.itemId, false);
                    setTimeout(() => onDeleteSelected?.(), 0);
                  } else if (selectedItemIds.length > 0 && onDeleteSelected) {
                    onDeleteSelected();
                  } else if ((contextMenu.wallId || selectedWallId) && onPromptDeleteWall) {
                    const wId = contextMenu.wallId || selectedWallId;
                    const targetW = walls.find((w) => w.id === wId);
                    if (targetW) onPromptDeleteWall(targetW);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {contextMenu.itemId || selectedItemIds.length > 0
                    ? 'Eliminar obra (Supr)'
                    : 'Eliminar muro (Supr)'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Bar: Zoom & Fit */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1 rounded bg-white/95 border border-[#E6E4DD] text-xs text-[#171717] shadow-sm"
      >
        <button
          onClick={() =>
            setZoom((z) => Math.max(0.3, Number((z - 0.1).toFixed(2))))
          }
          title="Alejar plano"
          className="p-1 rounded hover:bg-[#FAF8F5] text-[#737373] hover:text-[#171717] cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="px-2 text-[11px] font-mono tabular-nums text-[#404040]">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() =>
            setZoom((z) => Math.min(2.8, Number((z + 0.1).toFixed(2))))
          }
          title="Acercar plano"
          className="p-1 rounded hover:bg-[#FAF8F5] text-[#737373] hover:text-[#171717] cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-[#E6E4DD] mx-0.5" />

        <button
          onClick={fitToScreen}
          title="Ajustar plano a pantalla"
          className="px-2 py-0.5 rounded hover:bg-[#FAF8F5] text-[11px] text-[#737373] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Ajustar</span>
        </button>
      </div>

      {/* Banco Virtual CAD Drawer in Floor Plan View */}
      <GraphicLibraryDrawer
        isOpen={isPlanLibraryOpen}
        onClose={() => setIsPlanLibraryOpen(false)}
        resources={graphicResources}
        defaultMode="plan"
        onAddResourceToPlan={(res) => {
          onPlaceGraphicResourceInPlan?.(res);
        }}
        onAddResourceToWall={(res) => {
          onMountGraphicResourceOnWall?.(res);
          setIsPlanLibraryOpen(false);
        }}
        onImportResources={(newRes) => {
          onImportGraphicResources?.(newRes);
        }}
      />
    </div>
  );
};
