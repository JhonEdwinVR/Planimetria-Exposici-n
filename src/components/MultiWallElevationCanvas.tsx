import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowLeft,
  SlidersHorizontal,
  Layers,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  MoveHorizontal,
  User,
  Check,
} from 'lucide-react';
import {
  Wall,
  WallItem,
  Zone,
  GraphicResource,
  LayerKey,
  LayerState,
  WallMaterial,
} from '../types/exhibition';
import { exportSvgElementAsPng } from '../utils/storageAndExport';

interface MultiWallElevationCanvasProps {
  walls: Wall[];
  allWalls: Wall[];
  items: WallItem[];
  zones: Zone[];
  artistName?: string;
  isPresentationMode?: boolean;
  selectedItemIds: string[];
  layerStates?: LayerState[];
  onSelectItem: (itemId: string, multi: boolean) => void;
  onClearSelection: () => void;
  onUpdateItem: (
    itemId: string,
    updates: Partial<WallItem>,
    recordHistory?: boolean
  ) => void;
  onBackToSingleWall?: () => void;
  onSelectWall?: (wallId: string) => void;
  onSwitchArtist?: (artist: string) => void;
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
      return 'url(#multi-pat-concrete)';
    case 'brick':
      return 'url(#multi-pat-brick)';
    case 'parchment':
      return 'url(#multi-pat-parchment)';
    case 'wood':
      return 'url(#multi-pat-wood)';
    case 'custom':
      return customColor || '#FFFFFF';
    default:
      return '#FFFFFF';
  }
}

export const MultiWallElevationCanvas: React.FC<MultiWallElevationCanvasProps> = ({
  walls,
  allWalls,
  items,
  zones,
  artistName,
  isPresentationMode = false,
  selectedItemIds,
  layerStates,
  onSelectItem,
  onClearSelection,
  onUpdateItem,
  onBackToSingleWall,
  onSelectWall,
  onSwitchArtist,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Active / included wall IDs within the composite
  const [activeWallIds, setActiveWallIds] = useState<string[]>(() =>
    walls.map((w) => w.id)
  );

  // Sync if input walls change
  useEffect(() => {
    setActiveWallIds(walls.map((w) => w.id));
  }, [walls]);

  // Default separation based on artist: Jhon Villarraga walls are contiguous in reality (0 cm), Andrea has columns (45 cm)
  const defaultGap = useMemo(() => {
    if (
      artistName &&
      (artistName.toLowerCase().includes('villarraga') ||
        artistName.toLowerCase().includes('jhon'))
    ) {
      return 0;
    }
    return 45;
  }, [artistName]);

  // Visual distance between walls in centimeters (default for all walls)
  const [visualGapCm, setVisualGapCm] = useState<number>(defaultGap);

  // Per-gap custom overrides: key is `${prevWallId}__${nextWallId}` -> separation in cm
  const [customGaps, setCustomGaps] = useState<Record<string, number>>({});
  const [editingGapKey, setEditingGapKey] = useState<string | null>(null);
  const [gapInputValue, setGapInputValue] = useState<number>(0);
  const [showGapsManager, setShowGapsManager] = useState<boolean>(false);

  // Sync when artist changes
  useEffect(() => {
    setVisualGapCm(defaultGap);
    setCustomGaps({});
    setEditingGapKey(null);
  }, [defaultGap]);

  const [showDimensions, setShowDimensions] = useState<boolean>(!isPresentationMode);
  const [showSeparationPill, setShowSeparationPill] = useState<boolean>(true);

  // Pan & Zoom
  const [zoom, setZoom] = useState(0.65);
  const [pan, setPan] = useState({ x: 80, y: 80 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Spacebar panning listener
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

  // Dragging item state
  const [dragState, setDragState] = useState<{
    itemId: string;
    wallId: string;
    startClientX: number;
    startClientY: number;
    initialXCm: number;
    initialYCm: number;
    initialWCm: number;
    initialHCm: number;
  } | null>(null);

  // Filtered and ordered walls for this composite
  const compositeWalls = useMemo(() => {
    const map = new Map<string, Wall>();
    walls.forEach((w) => map.set(w.id, w));
    return activeWallIds
      .map((id) => map.get(id))
      .filter((w): w is Wall => Boolean(w));
  }, [walls, activeWallIds]);

  // Max wall height in cm for aligning on floor baseline
  const maxWallHeightCm = useMemo(() => {
    if (compositeWalls.length === 0) return 300;
    return Math.max(...compositeWalls.map((w) => w.heightM * 100));
  }, [compositeWalls]);

  const maxHPx = maxWallHeightCm * PX_PER_CM;

  // Calculate horizontal positions of each wall in composite
  const wallLayout = useMemo(() => {
    let currentXCm = 0;
    return compositeWalls.map((w, index) => {
      const lengthCm = w.lengthM * 100;
      const startXCm = currentXCm;
      const startXPx = startXCm * PX_PER_CM;
      const widthPx = lengthCm * PX_PER_CM;
      const heightCm = w.heightM * 100;
      const heightPx = heightCm * PX_PER_CM;
      const topYPx = maxHPx - heightPx; // Ground baseline aligned

      let gapAfterCm = 0;
      let arePhysicallyConnected = false;
      if (index < compositeWalls.length - 1) {
        const nextW = compositeWalls[index + 1];
        arePhysicallyConnected =
          w.startVertexId === nextW.startVertexId ||
          w.startVertexId === nextW.endVertexId ||
          w.endVertexId === nextW.startVertexId ||
          w.endVertexId === nextW.endVertexId;
        const gapKey = `${w.id}__${nextW.id}`;
        if (customGaps[gapKey] !== undefined) {
          gapAfterCm = customGaps[gapKey];
        } else if (arePhysicallyConnected && visualGapCm === defaultGap) {
          gapAfterCm = 0; // Walls touch physically at corner/vertex -> 0 cm
        } else {
          gapAfterCm = visualGapCm;
        }
      }

      currentXCm += lengthCm + gapAfterCm;

      return {
        wall: w,
        startXCm,
        startXPx,
        lengthCm,
        widthPx,
        heightCm,
        heightPx,
        topYPx,
        gapAfterCm,
        arePhysicallyConnected,
      };
    });
  }, [compositeWalls, visualGapCm, customGaps, maxHPx]);

  const totalCompositeWidthCm = useMemo(() => {
    if (wallLayout.length === 0) return 0;
    const last = wallLayout[wallLayout.length - 1];
    return last.startXCm + last.lengthCm;
  }, [wallLayout]);

  const totalCompositeWidthPx = totalCompositeWidthCm * PX_PER_CM;

  // Fit all walls to screen
  const fitAllToScreen = () => {
    if (!containerRef.current || totalCompositeWidthPx <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pad = isPresentationMode ? 60 : 120;
    const scaleX = (rect.width - pad) / totalCompositeWidthPx;
    const scaleY = (rect.height - pad) / maxHPx;
    const newZoom = Math.min(1.8, Math.max(0.2, Math.min(scaleX, scaleY)));

    setZoom(Number(newZoom.toFixed(2)));
    setPan({
      x: Math.round((rect.width - totalCompositeWidthPx * newZoom) / 2),
      y: Math.round((rect.height - maxHPx * newZoom) / 2 + 30),
    });
  };

  useEffect(() => {
    fitAllToScreen();
  }, [compositeWalls.length, visualGapCm, customGaps]);

  // Wall reordering
  const moveWall = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeWallIds.length) return;
    const next = [...activeWallIds];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setActiveWallIds(next);
  };

  // Toggle wall in composite
  const toggleWallIncluded = (wallId: string) => {
    if (activeWallIds.includes(wallId)) {
      if (activeWallIds.length <= 1) return; // keep at least one
      setActiveWallIds((prev) => prev.filter((id) => id !== wallId));
    } else {
      setActiveWallIds((prev) => [...prev, wallId]);
    }
  };

  // Mouse interaction for Panning
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (editingGapKey) {
      setEditingGapKey(null);
    }
    if (dragState) return;
    if (isSpacePressed || e.button === 1 || e.altKey || (e.buttons & 4)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    if (e.button === 0) {
      onClearSelection();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (dragState && !isPresentationMode) {
      const dxPx = (e.clientX - dragState.startClientX) / zoom;
      const dyPx = (e.clientY - dragState.startClientY) / zoom;
      const dxCm = dxPx / PX_PER_CM;
      const dyCm = dyPx / PX_PER_CM;

      const targetWall = compositeWalls.find((w) => w.id === dragState.wallId);
      const wallW = targetWall ? targetWall.lengthM * 100 : 400;
      const nextX = Math.round(
        Math.max(
          0,
          Math.min(
            wallW - dragState.initialWCm,
            dragState.initialXCm + dxCm
          )
        )
      );
      const nextY = Math.round(
        Math.max(
          0,
          dragState.initialYCm - dyCm
        )
      );

      onUpdateItem(dragState.itemId, { xCm: nextX, yCm: nextY }, false);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragState(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const delta = e.deltaY < 0 ? 0.06 : -0.06;
    const nextZoom = Math.min(2.5, Math.max(0.2, Number((zoom + delta).toFixed(2))));
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
    const nextZoom = Math.min(2.5, Math.max(0.2, Number((zoom + delta).toFixed(2))));
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const scale = nextZoom / zoom;
    setPan((prev) => ({
      x: Math.round(centerX - (centerX - prev.x) * scale),
      y: Math.round(centerY - (centerY - prev.y) * scale),
    }));
    setZoom(nextZoom);
  };

  return (
    <div
      className="relative flex-1 h-full overflow-hidden bg-[#FAF8F5] select-none flex flex-col"
    >
      {/* Top Header Toolbar for Multi-Wall Mode */}
      {!isPresentationMode && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="h-11 px-4 bg-[#FAF8F5] border-b border-[#E6E4DD] flex items-center justify-between gap-3 z-30 shrink-0 text-xs relative select-none"
        >
          <div className="flex items-center gap-2 shrink-0">
            {onBackToSingleWall && (
              <button
                type="button"
                onClick={onBackToSingleWall}
                className="text-[#737373] hover:text-[#171717] flex items-center gap-1 transition-colors cursor-pointer font-medium whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Muro individual</span>
              </button>
            )}

            <span className="text-[#E6E4DD]">/</span>

            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-semibold text-[#171717]">Vista conjunta:</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] font-medium border border-blue-100 text-[11px] flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{artistName || 'Artista'}</span>
              </span>
              <span className="text-[11px] text-[#737373]">
                ({compositeWalls.length} de {walls.length} muros)
              </span>
            </div>
          </div>

          {/* Center Wall Checkbox Pills */}
          <div className="flex items-center gap-1 max-w-[45vw] overflow-x-auto py-1 shrink-0">
            {walls.map((w) => {
              const isIncluded = activeWallIds.includes(w.id);
              const artCount = items.filter(
                (i) =>
                  i.wallId === w.id &&
                  i.visible &&
                  (i.type === 'photo' ||
                    i.type === 'frame' ||
                    i.type === 'portrait_stand' ||
                    i.category === 'artworks' ||
                    i.type === 'text')
              ).length;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => toggleWallIncluded(w.id)}
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer border ${
                    isIncluded
                      ? 'bg-white border-[#2563EB] text-[#2563EB] font-medium shadow-2xs'
                      : 'bg-[#F0EFEA] border-transparent text-[#737373] hover:text-[#171717]'
                  }`}
                  title={`${w.name} (${artCount} obras). Clic para incluir/excluir de la vista conjunta.`}
                >
                  {isIncluded && <Check className="w-2.5 h-2.5" />}
                  <span className="truncate max-w-[120px]">{w.name}</span>
                  <span className="opacity-75 font-mono">({artCount})</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Visual Gap, Dimensions, Fit, Export */}
          <div className="flex items-center gap-2">
            {/* Visual Gap Selector with Quick Presets */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-[#E6E4DD] text-[11px] shadow-2xs">
              <MoveHorizontal className="w-3 h-3 text-[#2563EB]" />
              <span className="text-[#525252] font-medium">Separación:</span>
              <input
                type="number"
                min={0}
                max={300}
                step={5}
                value={visualGapCm}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    setVisualGapCm(val);
                    setCustomGaps({});
                  }
                }}
                className="w-10 text-center font-mono font-semibold text-[#171717] bg-[#F4F4F5] rounded px-1 py-0.5 outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                title="Distancia visual o física entre muros (0 cm = muros pegados)"
              />
              <span className="text-[#737373]">cm</span>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 border-l border-[#E6E4DD] pl-1.5 ml-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setVisualGapCm(0);
                    setCustomGaps({});
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    visualGapCm === 0
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#F4F4F5] hover:bg-[#E5E5E5] text-[#525252]'
                  }`}
                  title="Pegar muros contiguos sin separación (0 cm, ej. Jhon Villarraga)"
                >
                  0 cm (Pegadas)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVisualGapCm(45);
                    setCustomGaps({});
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    visualGapCm === 45
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#F4F4F5] hover:bg-[#E5E5E5] text-[#525252]'
                  }`}
                  title="Separación estándar para columnas o resaltes (45 cm, ej. Andrea)"
                >
                  45 cm (Columna)
                </button>
              </div>

              {/* Individual Wall Union Gaps Breakdown */}
              {compositeWalls.length > 2 && (
                <div className="relative border-l border-[#E6E4DD] pl-1.5 ml-0.5">
                  <button
                    type="button"
                    onClick={() => setShowGapsManager((v) => !v)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      showGapsManager
                        ? 'bg-[#1E293B] text-white'
                        : 'bg-[#F4F4F5] hover:bg-[#E5E5E5] text-[#525252]'
                    }`}
                    title="Editar la separación individual de cada unión entre muros"
                  >
                    <span>Uniones ({compositeWalls.length - 1})</span>
                  </button>

                  {/* Popover dropdown for individual gap overrides */}
                  {showGapsManager && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowGapsManager(false)}
                      />
                      <div className="absolute top-full right-0 mt-1.5 w-72 bg-white rounded-lg border border-[#E6E4DD] shadow-xl p-3 z-50 text-xs space-y-2.5">
                        <div className="flex items-center justify-between border-b border-[#E6E4DD] pb-1.5">
                          <span className="font-semibold text-[#171717] text-[11px]">
                            Separación por unión
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowGapsManager(false)}
                            className="text-[#737373] hover:text-[#171717] text-xs font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {compositeWalls.slice(0, -1).map((w, idx) => {
                          const nextW = compositeWalls[idx + 1];
                          const gapKey = `${w.id}__${nextW.id}`;
                          const layoutItem = wallLayout[idx];
                          const currentGap = layoutItem ? layoutItem.gapAfterCm : visualGapCm;

                          return (
                            <div
                              key={gapKey}
                              className="p-2 rounded bg-[#FAF8F5] border border-[#E6E4DD] space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[10px] text-[#525252]">
                                <span className="truncate max-w-[110px] font-medium" title={w.name}>
                                  {w.name}
                                </span>
                                <span className="text-[#A3A3A3]">⟷</span>
                                <span className="truncate max-w-[110px] font-medium" title={nextW.name}>
                                  {nextW.name}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={300}
                                    step={5}
                                    value={currentGap}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                                      if (!isNaN(val) && val >= 0) {
                                        setCustomGaps((prev) => ({
                                          ...prev,
                                          [gapKey]: val,
                                        }));
                                      }
                                    }}
                                    className="w-12 text-center font-mono font-semibold text-[#171717] bg-white border border-[#D4D4D4] rounded px-1 py-0.5 text-xs outline-hidden focus:border-[#2563EB]"
                                  />
                                  <span className="text-[10px] text-[#737373]">cm</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomGaps((prev) => ({
                                        ...prev,
                                        [gapKey]: 0,
                                      }));
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer ${
                                      currentGap === 0
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-white border border-[#E6E4DD] text-[#525252] hover:bg-emerald-50'
                                    }`}
                                  >
                                    0 (Pegar)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomGaps((prev) => ({
                                        ...prev,
                                        [gapKey]: 45,
                                      }));
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer ${
                                      currentGap === 45
                                        ? 'bg-[#2563EB] text-white'
                                        : 'bg-white border border-[#E6E4DD] text-[#525252] hover:bg-blue-50'
                                    }`}
                                  >
                                    45 (Col.)
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Toggle Cotas */}
            <button
              type="button"
              onClick={() => setShowDimensions((v) => !v)}
              className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                showDimensions
                  ? 'bg-white border-[#2563EB] text-[#2563EB] font-medium'
                  : 'bg-white border-[#E6E4DD] text-[#737373] hover:text-[#171717]'
              }`}
              title="Mostrar u ocultar cotas arquitectónicas"
            >
              {showDimensions ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Cotas</span>
            </button>

            {/* Export PNG */}
            <button
              type="button"
              onClick={() =>
                exportSvgElementAsPng(
                  svgRef.current,
                  `vista-conjunta-${(artistName || 'artista')
                    .toLowerCase()
                    .replace(/\s+/g, '-')}.png`
                )
              }
              className="p-1 rounded bg-white border border-[#E6E4DD] text-[#737373] hover:text-[#171717] hover:bg-[#F0EFEA] cursor-pointer"
              title="Exportar imagen de la composición conjunta"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Composite SVG Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 overflow-hidden z-10 ${
          isSpacePressed
            ? isPanning
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-default'
        }`}
      >
        <svg
          ref={svgRef}
          className="w-full h-full block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="multi-pat-concrete"
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
              id="multi-pat-brick"
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
              id="multi-pat-parchment"
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
              id="multi-pat-wood"
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
              id="multi-pat-separation-hatch"
              width="10"
              height="10"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="10"
                stroke="#A3A3A3"
                strokeWidth="0.8"
                opacity="0.4"
              />
            </pattern>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Global Floor Baseline Line */}
            <line
              x1={-60}
              y1={maxHPx}
              x2={totalCompositeWidthPx + 60}
              y2={maxHPx}
              stroke="#171717"
              strokeWidth="2.5"
            />

            {/* Continuous Ground Hatching beneath floor baseline */}
            <rect
              x={-60}
              y={maxHPx}
              width={totalCompositeWidthPx + 120}
              height={32}
              fill="url(#multi-pat-separation-hatch)"
            />

            {/* Render Each Wall in Composite Layout */}
            {wallLayout.map((layout, wallIndex) => {
              const {
                wall,
                startXCm,
                startXPx,
                lengthCm,
                widthPx,
                heightCm,
                heightPx,
                topYPx,
              } = layout;

              const wallItems = items.filter(
                (it) => it.wallId === wall.id && it.visible
              );

              return (
                <g key={wall.id} transform={`translate(${startXPx}, 0)`}>
                  {/* Wall Header Label & Dimensions */}
                  {!isPresentationMode && (
                    <g transform={`translate(0, ${topYPx - 24})`}>
                      <rect
                        x={0}
                        y={0}
                        width={Math.max(120, widthPx)}
                        height={18}
                        rx={3}
                        fill="#FFFFFF"
                        stroke="#E6E4DD"
                        strokeWidth="0.8"
                      />
                      <text
                        x={8}
                        y={12}
                        fontSize="9.5"
                        fontWeight="600"
                        fill="#171717"
                        fontFamily="ui-sans-serif, system-ui, sans-serif"
                      >
                        {wall.name}
                      </text>
                      <text
                        x={Math.max(112, widthPx - 8)}
                        y={12}
                        textAnchor="end"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fill="#737373"
                      >
                        {wall.lengthM.toFixed(2)} m × {wall.heightM.toFixed(2)} m
                      </text>

                      {/* Wall Reorder Arrows */}
                      <g
                        transform={`translate(${widthPx / 2 - 20}, -18)`}
                        className="cursor-pointer"
                      >
                        {wallIndex > 0 && (
                          <g
                            onClick={() => moveWall(wallIndex, 'left')}
                            className="cursor-pointer"
                          >
                            <title>Mover muro a la izquierda</title>
                            <circle cx={-10} cy={8} r={8} fill="#FFFFFF" stroke="#E6E4DD" />
                            <text
                              x={-10}
                              y={11}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#171717"
                            >
                              ◀
                            </text>
                          </g>
                        )}
                        {wallIndex < wallLayout.length - 1 && (
                          <g
                            onClick={() => moveWall(wallIndex, 'right')}
                            className="cursor-pointer"
                          >
                            <title>Mover muro a la derecha</title>
                            <circle cx={25} cy={8} r={8} fill="#FFFFFF" stroke="#E6E4DD" />
                            <text
                              x={25}
                              y={11}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#171717"
                            >
                              ▶
                            </text>
                          </g>
                        )}
                      </g>
                    </g>
                  )}

                  {/* Wall Face Surface */}
                  <rect
                    x={0}
                    y={topYPx}
                    width={widthPx}
                    height={heightPx}
                    fill={getWallFill(wall.material, wall.color)}
                    stroke="#171717"
                    strokeWidth="1.2"
                  />

                  {/* Eye-level 1.50m visual guide line */}
                  {heightCm >= 150 && (
                    <g transform={`translate(0, ${maxHPx - 150 * PX_PER_CM})`}>
                      <line
                        x1={0}
                        y1={0}
                        x2={widthPx}
                        y2={0}
                        stroke="#737373"
                        strokeWidth="0.7"
                        strokeDasharray="4,4"
                        opacity={isPresentationMode ? 0.25 : 0.45}
                      />
                      {!isPresentationMode && (
                        <text
                          x={widthPx - 6}
                          y={-3}
                          textAnchor="end"
                          fontSize="7.5"
                          fontFamily="JetBrains Mono, monospace"
                          fill="#737373"
                          opacity="0.8"
                        >
                          Eje 1.50m
                        </text>
                      )}
                    </g>
                  )}

                  {/* Horizontal Cota Ruler */}
                  {showDimensions && (
                    <g transform={`translate(0, ${topYPx - 8})`}>
                      <line
                        x1={0}
                        y1={0}
                        x2={widthPx}
                        y2={0}
                        stroke="#DC2626"
                        strokeWidth="0.8"
                      />
                      <line x1={0} y1={-3} x2={0} y2={3} stroke="#DC2626" strokeWidth="0.8" />
                      <line
                        x1={widthPx}
                        y1={-3}
                        x2={widthPx}
                        y2={3}
                        stroke="#DC2626"
                        strokeWidth="0.8"
                      />
                      <text
                        x={widthPx / 2}
                        y={-4}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontFamily="JetBrains Mono, monospace"
                        fill="#DC2626"
                      >
                        {wall.lengthM.toFixed(2)} m
                      </text>
                    </g>
                  )}

                  {/* Mounted Items for this Wall */}
                  {wallItems.map((item) => {
                    const ix = item.xCm * PX_PER_CM;
                    const iy = maxHPx - (item.yCm + item.heightCm) * PX_PER_CM;
                    const iw = item.widthCm * PX_PER_CM;
                    const ih = item.heightCm * PX_PER_CM;
                    const isSelected = selectedItemIds.includes(item.id);
                    const isText =
                      item.type === 'text' ||
                      item.type === 'title' ||
                      item.type === 'description';

                    return (
                      <g
                        key={item.id}
                        transform={`translate(${ix}, ${iy})`}
                        className={isPresentationMode ? '' : isSpacePressed ? 'cursor-grab' : 'cursor-move'}
                        onMouseDown={(e) => {
                          if (isPresentationMode) return;
                          if (isSpacePressed || e.button === 1 || e.altKey) {
                            return; // Allow canvas pan
                          }
                          e.stopPropagation();
                          onSelectItem(item.id, e.shiftKey || e.metaKey);
                          setDragState({
                            itemId: item.id,
                            wallId: wall.id,
                            startClientX: e.clientX,
                            startClientY: e.clientY,
                            initialXCm: item.xCm,
                            initialYCm: item.yCm,
                            initialWCm: item.widthCm,
                            initialHCm: item.heightCm,
                          });
                        }}
                      >
                        {isText ? (
                          <g>
                            {(item.showBackground || item.showBorder || (isSelected && !isPresentationMode)) && (
                              <rect
                                width={iw}
                                height={ih}
                                fill={
                                  item.showBackground
                                    ? item.backgroundColor || '#FFFFFF'
                                    : 'transparent'
                                }
                                stroke={
                                  isSelected && !isPresentationMode
                                    ? '#2563EB'
                                    : item.showBorder
                                    ? item.borderColor || '#E5E5E5'
                                    : 'transparent'
                                }
                                strokeWidth={isSelected ? 1.5 : item.borderWidth || 1}
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
                                      ? 'ui-serif, Georgia, serif'
                                      : item.fontFamily === 'mono'
                                      ? 'ui-monospace, monospace'
                                      : 'ui-sans-serif, system-ui, sans-serif',
                                  fontSize: `${Math.max(
                                    8,
                                    (item.fontSizePt || 11) * 1.15
                                  )}px`,
                                  fontWeight:
                                    item.fontWeight === 'bold' ? 700 : 400,
                                  fontStyle: item.italic ? 'italic' : 'normal',
                                  lineHeight: item.lineHeight || 1.35,
                                  padding: `${(item.paddingCm || 0) * PX_PER_CM}px`,
                                  boxSizing: 'border-box',
                                }}
                              >
                                {item.textTitle && (
                                  <div className="font-semibold text-[1.05em] mb-0.5">
                                    {item.textTitle}
                                  </div>
                                )}
                                {item.textAuthor && (
                                  <div className="text-[0.9em] opacity-90">
                                    {item.textAuthor}
                                  </div>
                                )}
                                <div>
                                  {item.textContent ||
                                    item.description ||
                                    item.name}
                                </div>
                              </div>
                            </foreignObject>
                          </g>
                        ) : item.type === 'photo' || item.type === 'frame' || item.type === 'portrait_stand' ? (
                          <g>
                            {/* Artwork Frame / Portrait Stand */}
                            <rect
                              width={iw}
                              height={ih}
                              fill="#FAF8F5"
                              stroke={item.frameStyle === 'none' ? '#D4D4D4' : '#171717'}
                              strokeWidth={item.frameStyle === 'none' ? 1 : 2}
                            />
                            {item.imageUrl ? (
                              <image
                                href={item.imageUrl}
                                x={Math.min(iw * 0.1, (item.matWidthCm || 0) * PX_PER_CM)}
                                y={Math.min(ih * 0.1, (item.matWidthCm || 0) * PX_PER_CM)}
                                width={Math.max(
                                  4,
                                  iw - Math.min(iw * 0.2, (item.matWidthCm || 0) * PX_PER_CM * 2)
                                )}
                                height={Math.max(
                                  4,
                                  ih - Math.min(ih * 0.2, (item.matWidthCm || 0) * PX_PER_CM * 2)
                                )}
                                preserveAspectRatio="none"
                              />
                            ) : (
                              <rect
                                x={4}
                                y={4}
                                width={iw - 8}
                                height={ih - 8}
                                fill="#E5E5E5"
                              />
                            )}
                          </g>
                        ) : (
                          /* Other Graphic Resources (People, Vitrines, Sculptures) */
                          <g>
                            {item.imageUrl ? (
                              <image
                                href={item.imageUrl}
                                width={iw}
                                height={ih}
                                preserveAspectRatio={
                                  item.category?.startsWith('people')
                                    ? 'xMidYBottom meet'
                                    : 'xMidYMid meet'
                                }
                              />
                            ) : (
                              <rect width={iw} height={ih} fill="#E5E5E5" />
                            )}
                          </g>
                        )}

                        {/* Selection Highlight */}
                        {isSelected && !isPresentationMode && (
                          <rect
                            x={-2}
                            y={-2}
                            width={iw + 4}
                            height={ih + 4}
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="2"
                          />
                        )}

                        {/* Dimension Label */}
                        {showDimensions && (
                          <text
                            x={iw / 2}
                            y={ih + 10}
                            textAnchor="middle"
                            fontSize="8"
                            fontFamily="JetBrains Mono, monospace"
                            fill="#737373"
                          >
                            {item.widthCm}×{item.heightCm}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Physical Separation Column Hatch between this wall and next */}
                  {wallIndex < wallLayout.length - 1 && layout.gapAfterCm > 0 && (
                    <g transform={`translate(${widthPx}, 0)`}>
                      <rect
                        x={0}
                        y={topYPx}
                        width={layout.gapAfterCm * PX_PER_CM}
                        height={heightPx}
                        fill="url(#multi-pat-separation-hatch)"
                        stroke="#D4D4D4"
                        strokeWidth="0.8"
                        strokeDasharray="3,3"
                      />
                    </g>
                  )}
                </g>
              );
            })}

            {/* OVERLAY LAYER: Separation Badges & Popovers (rendered after all walls so nothing ever cuts them off) */}
            {showSeparationPill && !isPresentationMode && (
              <g className="separation-controls-overlay">
                {wallLayout.map((layout, wallIndex) => {
                  if (wallIndex >= wallLayout.length - 1) return null;
                  const nextWall = wallLayout[wallIndex + 1].wall;
                  const gapKey = `${layout.wall.id}__${nextWall.id}`;
                  const gapAfterCm = layout.gapAfterCm;
                  const gapAfterPx = gapAfterCm * PX_PER_CM;
                  const seamXPx = layout.startXPx + layout.widthPx + gapAfterPx / 2;
                  const isEditing = editingGapKey === gapKey;

                  if (gapAfterCm > 0) {
                    return (
                      <g key={`sep-${gapKey}`} transform={`translate(${seamXPx}, ${maxHPx / 2})`}>
                        {isEditing ? (
                          <foreignObject
                            x={-75}
                            y={-36}
                            width={150}
                            height={72}
                            className="overflow-visible"
                          >
                            <div
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full h-full bg-white rounded-lg border-2 border-[#2563EB] shadow-2xl p-1.5 flex flex-col items-center justify-between select-none"
                            >
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  autoFocus
                                  min={0}
                                  max={300}
                                  step={5}
                                  value={gapInputValue}
                                  onChange={(e) => setGapInputValue(Number(e.target.value) || 0)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setCustomGaps((prev) => ({ ...prev, [gapKey]: gapInputValue }));
                                      setEditingGapKey(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingGapKey(null);
                                    }
                                  }}
                                  className="w-14 text-center font-mono font-bold text-xs bg-[#F4F4F5] rounded border border-[#CBD5E1] p-0.5 outline-hidden"
                                />
                                <span className="text-[10px] text-[#525252]">cm</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomGaps((prev) => ({ ...prev, [gapKey]: gapInputValue }));
                                    setEditingGapKey(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-[10px] font-semibold cursor-pointer"
                                >
                                  ✓
                                </button>
                              </div>
                              <div className="flex items-center gap-1 w-full justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomGaps((prev) => ({ ...prev, [gapKey]: 0 }));
                                    setEditingGapKey(null);
                                  }}
                                  className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium cursor-pointer"
                                >
                                  Pegar (0)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomGaps((prev) => ({ ...prev, [gapKey]: 45 }));
                                    setEditingGapKey(null);
                                  }}
                                  className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium cursor-pointer"
                                >
                                  Columna (45)
                                </button>
                              </div>
                            </div>
                          </foreignObject>
                        ) : (
                          <g
                            className="cursor-pointer"
                            onClick={() => {
                              setEditingGapKey(gapKey);
                              setGapInputValue(gapAfterCm);
                            }}
                            onDoubleClick={() => {
                              setCustomGaps((prev) => ({
                                ...prev,
                                [gapKey]: gapAfterCm === 0 ? 45 : 0,
                              }));
                            }}
                          >
                            <title>Separación de {gapAfterCm} cm. Clic para editar cm exactos. Doble clic para alternar con 0 cm.</title>
                            <rect
                              x={-45}
                              y={-12}
                              width={90}
                              height={24}
                              rx={12}
                              fill="#FFFFFF"
                              stroke="#2563EB"
                              strokeWidth="1.2"
                              className="shadow-xs hover:fill-blue-50 transition-colors"
                            />
                            <text
                              x={0}
                              y={4}
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight="600"
                              fill="#2563EB"
                              fontFamily="JetBrains Mono, monospace"
                            >
                              ⟷ {gapAfterCm} cm
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  }

                  // Gap is 0 cm (walls are touching / "pegadas")
                  return (
                    <g key={`sep-${gapKey}`} transform={`translate(${seamXPx}, ${maxHPx / 2})`}>
                      {isEditing ? (
                        <foreignObject
                          x={-75}
                          y={-36}
                          width={150}
                          height={72}
                          className="overflow-visible"
                        >
                          <div
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-full bg-white rounded-lg border-2 border-emerald-600 shadow-2xl p-1.5 flex flex-col items-center justify-between select-none"
                          >
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                autoFocus
                                min={0}
                                max={300}
                                step={5}
                                value={gapInputValue}
                                onChange={(e) => setGapInputValue(Number(e.target.value) || 0)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setCustomGaps((prev) => ({ ...prev, [gapKey]: gapInputValue }));
                                    setEditingGapKey(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingGapKey(null);
                                  }
                                }}
                                className="w-14 text-center font-mono font-bold text-xs bg-[#F4F4F5] rounded border border-[#CBD5E1] p-0.5 outline-hidden"
                              />
                              <span className="text-[10px] text-[#525252]">cm</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomGaps((prev) => ({ ...prev, [gapKey]: gapInputValue }));
                                  setEditingGapKey(null);
                                }}
                                className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                              >
                                ✓
                              </button>
                            </div>
                            <div className="flex items-center gap-1 w-full justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomGaps((prev) => ({ ...prev, [gapKey]: 0 }));
                                  setEditingGapKey(null);
                                }}
                                className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium cursor-pointer"
                              >
                                Pegar (0)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomGaps((prev) => ({ ...prev, [gapKey]: 45 }));
                                  setEditingGapKey(null);
                                }}
                                className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium cursor-pointer"
                              >
                                Columna (45)
                              </button>
                            </div>
                          </div>
                        </foreignObject>
                      ) : (
                        <g
                          className="cursor-pointer"
                          onClick={() => {
                            setEditingGapKey(gapKey);
                            setGapInputValue(0);
                          }}
                          onDoubleClick={() => {
                            setCustomGaps((prev) => ({
                              ...prev,
                              [gapKey]: 45,
                            }));
                          }}
                        >
                          <title>Muros pegados (0 cm). Clic para editar cm. Doble clic para alternar con 45 cm.</title>
                          <line y1={-24} y2={24} stroke="#10B981" strokeWidth="2.5" strokeDasharray="4,2" />
                          <rect
                            x={-44}
                            y={-10}
                            width={88}
                            height={20}
                            rx={10}
                            fill="#10B981"
                            stroke="#FFFFFF"
                            strokeWidth={1.2}
                            className="shadow-xs hover:fill-emerald-600 transition-colors"
                          />
                          <text
                            x={0}
                            y={3.5}
                            textAnchor="middle"
                            fontSize="8.5"
                            fontWeight="bold"
                            fill="#FFFFFF"
                            fontFamily="ui-sans-serif, system-ui, sans-serif"
                          >
                            Pegadas (0 cm)
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        </svg>

        {/* Floating Zoom Bar at Bottom */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 border border-[#E6E4DD] text-xs text-[#171717] shadow-md backdrop-blur-xs"
        >
          <button
            onClick={() => handleButtonZoom(-0.08)}
            title="Alejar"
            className="p-1 rounded hover:bg-[#FAF8F5] text-[#737373] hover:text-[#171717] cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 text-[11px] font-mono tabular-nums text-[#404040]">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => handleButtonZoom(0.08)}
            title="Acercar"
            className="p-1 rounded hover:bg-[#FAF8F5] text-[#737373] hover:text-[#171717] cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#E6E4DD] mx-1" />

          <button
            onClick={fitAllToScreen}
            className="px-2 py-0.5 rounded hover:bg-[#FAF8F5] text-[11px] text-[#2563EB] font-medium flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Ajustar todos ({compositeWalls.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
