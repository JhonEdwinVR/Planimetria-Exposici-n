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
} from 'lucide-react';
import { optimizeImageFile } from '../utils/imageOptimization';
import {
  GraphicResource,
  ItemType,
  LayerKey,
  LayerState,
  LayerVisibility,
  ValidationIssue,
  Wall,
  WallItem,
  WallMaterial,
} from '../types/exhibition';
import { createArtworkSvgDataUrl } from '../data/initialProject';
import { GraphicLibraryDrawer } from './GraphicLibraryDrawer';

interface ElevationCanvasProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  wall: Wall;
  allWalls: Wall[];
  items: WallItem[];
  layers: LayerVisibility;
  layerStates?: LayerState[];
  graphicResources?: GraphicResource[];
  selectedItemIds: string[];
  validationIssues: ValidationIssue[];
  isDark: boolean;
  isPresentationMode?: boolean;
  onBackToPlan: () => void;
  onSwitchWall: (wallId: string) => void;
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
  onAutoFixWall: () => void;
  onToggleLayerState?: (layerId: LayerKey) => void;
  onToggleLayerLock?: (layerId: LayerKey) => void;
  onImportGraphicResources?: (newResources: GraphicResource[]) => void;
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
  layers,
  layerStates,
  graphicResources = [],
  selectedItemIds,
  validationIssues,
  isPresentationMode = false,
  onBackToPlan,
  onSwitchWall,
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
  onAutoFixWall,
  onToggleLayerState,
  onToggleLayerLock,
  onImportGraphicResources,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [libraryDrawerOpen, setLibraryDrawerOpen] = useState(false);

  const [urlPromptOpen, setUrlPromptOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

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
  } | null>(null);

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
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((z) =>
      Math.min(2.5, Math.max(0.3, Number((z + delta).toFixed(2))))
    );
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (dragState) return;
    if (e.button !== 0) return;
    onClearSelection();
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState) {
      const dxPx = (e.clientX - dragState.startClientX) / zoom;
      const dyPx = (e.clientY - dragState.startClientY) / zoom;
      const dxCm = dxPx / PX_PER_CM;
      const dyCm = dyPx / PX_PER_CM;

      if (dragState.mode === 'move') {
        let nextX = Math.round((dragState.initialXCm + dxCm) * 2) / 2;
        let nextY = Math.round((dragState.initialYCm - dyCm) * 2) / 2;

        // Snap to floor if within 3 cm
        if (Math.abs(nextY) < 3.5) {
          nextY = 0;
        }

        // Snap to 150 cm visual eye level if within 3 cm
        const centerFromFloor = nextY + dragState.initialHCm / 2;
        if (Math.abs(centerFromFloor - 150) < 3) {
          nextY = Number((150 - dragState.initialHCm / 2).toFixed(1));
        }

        onUpdateItem(dragState.itemId, { xCm: nextX, yCm: nextY }, false);
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
    });
  };

  const handleQuickAdd = (type: ItemType) => {
    setShowAddMenu(false);
    const count = wallItems.length + 1;
    const defaultX = Math.min(
      Math.max(15, wallWidthCm / 2 - 25),
      Math.max(10, wallWidthCm - 60)
    );

    if (type === 'photo') {
      onAddItem({
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
      });
    } else if (type === 'title') {
      onAddItem({
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
      });
    } else if (type === 'text' || type === 'description') {
      onAddItem({
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
      });
    } else if (type === 'frame' || type === 'portrait_stand') {
      onAddItem({
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
      });
    }
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
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative flex-1 h-full overflow-hidden bg-[#FAF8F5] cursor-grab active:cursor-grabbing select-none flex flex-col"
    >
      {/* Minimalist Sub-Header for Elevation View */}
      {!isPresentationMode && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="h-11 px-5 bg-[#FAF8F5] border-b border-[#E6E4DD] flex items-center justify-between gap-4 z-20 shrink-0 text-xs"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPlan}
              className="text-[#737373] hover:text-[#171717] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Plano</span>
            </button>

            <span className="text-[#E6E4DD]">/</span>

            <select
              aria-label="Seleccionar muro"
              value={wall.id}
              onChange={(e) => onSwitchWall(e.target.value)}
              className="py-1 px-2 rounded bg-white border border-[#E6E4DD] text-[#171717] font-medium cursor-pointer"
            >
              {allWalls.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.lengthM.toFixed(2)} m · {w.participant})
                </option>
              ))}
            </select>

            {(() => {
              const linkedWall = allWalls.find(
                (w) =>
                  w.id !== wall.id &&
                  (w.id === wall.linkedWallId ||
                    w.linkedWallId === wall.id ||
                    (w.startVertexId === wall.startVertexId &&
                      w.endVertexId === wall.endVertexId))
              );
              if (!linkedWall) return null;
              return (
                <button
                  onClick={() => onSwitchWall(linkedWall.id)}
                  className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2563EB] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title={`Cambiar a la otra cara de este muro (${linkedWall.name})`}
                >
                  <span>⇄ Otra cara: {linkedWall.participant}</span>
                </button>
              );
            })()}
          </div>

          <div className="flex items-center gap-2">
            {/* Graphic Resources Library Drawer Toggle */}
            <button
              onClick={() => setLibraryDrawerOpen((v) => !v)}
              className={`px-3 py-1 rounded border flex items-center gap-1.5 cursor-pointer transition-colors ${
                libraryDrawerOpen
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white border-[#E6E4DD] text-[#171717] hover:bg-[#F0EFEA]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Biblioteca ({graphicResources.length})</span>
            </button>

            {/* Layers Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLayersMenu((v) => !v)}
                className={`px-3 py-1 rounded border flex items-center gap-1.5 cursor-pointer transition-colors ${
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
                  <div className="absolute right-0 mt-1.5 w-64 bg-white border border-[#E6E4DD] rounded shadow-md py-2 z-50 text-xs text-[#171717] space-y-1">
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
            <div className="relative">
              <button
                onClick={() => setShowLayoutMenu((v) => !v)}
                className="px-3 py-1 rounded border border-[#E6E4DD] bg-white text-[#171717] hover:bg-[#F0EFEA] flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#737373]" />
                <span>Distribuir y alinear</span>
                <ChevronDown className="w-3 h-3 text-[#737373]" />
              </button>

              {showLayoutMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLayoutMenu(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-56 bg-white border border-[#E6E4DD] rounded shadow-sm py-1.5 z-50 text-xs text-[#171717]">
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

            {/* Add Element Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu((v) => !v)}
                className="px-3 py-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium flex items-center gap-1.5 cursor-pointer"
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
                  <div className="absolute right-0 mt-1.5 w-60 bg-white border border-[#E6E4DD] rounded shadow-sm py-1.5 z-50 text-xs text-[#171717]">
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
      <div className="relative flex-1 overflow-hidden">
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
                  className={isEffectiveLocked ? 'cursor-not-allowed' : 'cursor-move'}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onSelectItem(item.id, e.shiftKey || e.metaKey);
                    if (!isEffectiveLocked && !isPresentationMode) {
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
                      });
                    }
                  }}
                >
                  {isText ? (
                    <g>
                      <rect
                        width={iw}
                        height={ih}
                        fill={
                          item.frameStyle === 'black' ? '#171717' : '#FAF8F5'
                        }
                        stroke={isSelected ? '#2563EB' : '#D4D4D4'}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                      <foreignObject
                        x={6}
                        y={6}
                        width={Math.max(10, iw - 12)}
                        height={Math.max(10, ih - 12)}
                      >
                        <div
                          className={`w-full h-full overflow-hidden whitespace-pre-wrap leading-snug text-[11px] ${
                            item.frameStyle === 'black'
                              ? 'text-white'
                              : 'text-[#171717]'
                          }`}
                        >
                          {item.textContent || item.name}
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
                        stroke="#2563EB"
                        strokeWidth="2"
                      />
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
          </g>
        </svg>

        {/* Discreet Bottom Bar: Zoom, Fit & Contextual Auto-Fix */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1 rounded bg-white/95 border border-[#E6E4DD] text-xs text-[#171717] shadow-sm"
        >
          <button
            onClick={() =>
              setZoom((z) => Math.max(0.3, Number((z - 0.1).toFixed(2))))
            }
            title="Alejar"
            className="p-1 rounded hover:bg-[#FAF8F5] text-[#737373] hover:text-[#171717] cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 text-[11px] font-mono tabular-nums text-[#404040]">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() =>
              setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(2))))
            }
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
