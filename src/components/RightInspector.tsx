import React, { useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  Upload,
  Plus,
  Minus,
  ArrowLeftRight,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  FileText,
  User,
  Sliders,
  Layers,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  RotateCw,
  Ruler,
  Compass,
  Folder,
  FolderOpen,
  PenTool,
  Scissors,
} from 'lucide-react';
import { optimizeImageFile } from '../utils/imageOptimization';
import {
  BackgroundPlanSettings,
  FloorPlanElement,
  FrameStyle,
  LayerKey,
  PendingVerification,
  ValidationIssue,
  ViewMode,
  Wall,
  WallItem,
  WallMaterial,
  Zone,
} from '../types/exhibition';

interface RightInspectorProps {
  viewMode: ViewMode;
  selectedWall: Wall | null;
  selectedItems: WallItem[];
  allWallItems: WallItem[];
  verifications: PendingVerification[];
  validationIssues: ValidationIssue[];
  referenceOpacity: number;
  referenceVisible: boolean;
  backgroundPlan?: BackgroundPlanSettings;
  selectedZone?: Zone | null;
  onUpdateZone?: (zoneId: string, patch: Partial<Zone>) => void;
  onUpdateBackgroundPlan?: (patch: Partial<BackgroundPlanSettings>) => void;
  onStartTwoPointCalibration?: () => void;
  onResetBackgroundPlan?: () => void;
  onDeleteBackgroundImage?: () => void;
  onUpdateWallLength: (wallId: string, newLengthM: number) => void;
  onUpdateWall: (wallId: string, patch: Partial<Wall>) => void;
  onUpdateItem: (itemId: string, patch: Partial<WallItem>) => void;
  onUpdateMultipleItems: (itemIds: string[], patch: Partial<WallItem>) => void;
  onSetWallPhotoCount: (wall: Wall, targetCount: number) => void;
  onOpenWallElevation: (wallId: string) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onResolveVerification: (verId: string, chosenValue: number) => void;
  onChangeReferenceOpacity: (opacity: number) => void;
  onToggleReferenceVisible: () => void;
  onUploadReferenceImage: (dataUrl: string) => void;
  onExportWallPdf: (wall: Wall) => void;
  allZones?: Zone[];
  allWalls?: Wall[];
  onSelectWall?: (wallId: string) => void;
  onOpenSpaceAdmin?: (zone: Zone) => void;
  onStartDrawingWall?: (zoneId: string) => void;
  onOpenCreateWallModal?: (zoneId: string) => void;
  onDuplicateWall?: (wallId: string) => void;
  onSplitWall?: (wallId: string) => void;
  onPromptDeleteWall?: (wall: Wall) => void;
  onFlipWallDirection?: (wallId: string) => void;
  onFlipItemDirection?: (itemId: string) => void;
  onCreateOppositeWallFace?: (wallId: string, targetZoneId: string) => void;
  onRemoveOppositeWallFace?: (wallId: string) => void;
  selectedZoneIds?: string[];
  onSelectZone?: (zoneId: string | null, multi?: boolean) => void;
  onMoveZones?: (zoneIds: string[], deltaX: number, deltaY: number) => void;
  onMoveWall?: (wallId: string, deltaX: number, deltaY: number) => void;
  onReassignWallZone?: (wallId: string, targetZoneId: string) => void;
  selectedPlanElement?: FloorPlanElement | null;
  onUpdatePlanElement?: (id: string, patch: Partial<FloorPlanElement>) => void;
  onDuplicatePlanElement?: (id: string) => void;
  onDeletePlanElement?: (id: string) => void;
}

const MATERIALS: { value: WallMaterial; label: string }[] = [
  { value: 'white', label: 'Blanco' },
  { value: 'gray', label: 'Gris' },
  { value: 'black', label: 'Negro' },
  { value: 'parchment', label: 'Papel pergamino' },
  { value: 'concrete', label: 'Concreto' },
  { value: 'brick', label: 'Ladrillo' },
  { value: 'wood', label: 'Madera' },
  { value: 'custom', label: 'Color personalizado' },
];

const FRAME_STYLES: { value: FrameStyle; label: string }[] = [
  { value: 'none', label: 'Sin marco' },
  { value: 'black', label: 'Negro' },
  { value: 'white', label: 'Blanco' },
  { value: 'wood', label: 'Madera' },
  { value: 'aluminum', label: 'Aluminio' },
  { value: 'parchment', label: 'Papel pergamino' },
  { value: 'portrait_stand', label: 'Portarretrato' },
];

const LAYER_OPTIONS: { id: LayerKey; label: string }[] = [
  { id: 'architecture', label: 'Arquitectura' },
  { id: 'artworks', label: 'Fotografías y obras' },
  { id: 'people', label: 'Personas y siluetas' },
  { id: 'furniture', label: 'Mobiliario museográfico' },
  { id: 'objects', label: 'Vitrinas y pedestales' },
  { id: 'texts', label: 'Textos y señalética' },
  { id: 'decor', label: 'Decoración y vegetación' },
  { id: 'references', label: 'Referencias auxiliares' },
];

const SILHOUETTE_COLORS = [
  { name: 'Negro carbón', color: '#171717' },
  { name: 'Gris grafito', color: '#374151' },
  { name: 'Gris neutro', color: '#6B7280' },
  { name: 'Gris suave', color: '#9CA3AF' },
  { name: 'Azul técnico', color: '#1E3A8A' },
];

export const RightInspector: React.FC<RightInspectorProps> = ({
  selectedWall,
  selectedItems,
  allWallItems,
  verifications,
  referenceOpacity,
  referenceVisible,
  backgroundPlan,
  selectedZone,
  onUpdateZone,
  onUpdateBackgroundPlan,
  onStartTwoPointCalibration,
  onResetBackgroundPlan,
  onDeleteBackgroundImage,
  onUpdateWallLength,
  onUpdateWall,
  onUpdateItem,
  onUpdateMultipleItems,
  onSetWallPhotoCount,
  onOpenWallElevation,
  onDuplicateSelected,
  onDeleteSelected,
  onResolveVerification,
  onChangeReferenceOpacity,
  onToggleReferenceVisible,
  onUploadReferenceImage,
  onExportWallPdf,
  allZones = [],
  allWalls = [],
  onSelectWall,
  onOpenSpaceAdmin,
  onStartDrawingWall,
  onOpenCreateWallModal,
  onDuplicateWall,
  onSplitWall,
  onPromptDeleteWall,
  onFlipWallDirection,
  onFlipItemDirection,
  onCreateOppositeWallFace,
  onRemoveOppositeWallFace,
  selectedZoneIds = [],
  onSelectZone,
  onMoveZones,
  onMoveWall,
  onReassignWallZone,
  selectedPlanElement,
  onUpdatePlanElement,
  onDuplicatePlanElement,
  onDeletePlanElement,
}) => {
  const [moreWallOpen, setMoreWallOpen] = useState(false);
  const [moreItemOpen, setMoreItemOpen] = useState(false);
  const [oppositeFaceZoneId, setOppositeFaceZoneId] = useState<string>('');

  const itemImageInputRef = useRef<HTMLInputElement>(null);
  const refBlueprintInputRef = useRef<HTMLInputElement>(null);

  const primaryItem = selectedItems.length === 1 ? selectedItems[0] : null;

  // 0. FLOOR PLAN ELEMENT (MESA DE RESTAURANTE, CUADRADO DECORACIÓN, REPISA, MOBILIARIO EN PLANTA)
  if (selectedPlanElement && onUpdatePlanElement) {
    const categoryLabel =
      selectedPlanElement.category === 'restaurant_tables'
        ? 'Mesa / Restaurante'
        : selectedPlanElement.category === 'decor_squares'
        ? 'Cuadrado Decoración / Isla'
        : selectedPlanElement.category === 'shelves'
        ? 'Repisa / Estantería'
        : 'Elemento en Planta';

    return (
      <aside className="w-72 bg-[#FAF8F5] border-l border-[#E6E4DD] flex flex-col h-full overflow-y-auto px-5 py-5 space-y-5 select-none shrink-0 text-[#171717]">
        {/* Header & Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded">
              {categoryLabel}
            </span>
            <span className="text-[10px] font-mono text-[#737373]">
              {(selectedPlanElement.widthCm / 100).toFixed(2)}×{(selectedPlanElement.depthCm / 100).toFixed(2)} m
            </span>
          </div>

          <div className="w-full h-36 bg-white border border-[#E6E4DD] rounded-lg flex items-center justify-center p-3 overflow-hidden relative">
            {selectedPlanElement.planSvgUrl || selectedPlanElement.imageUrl ? (
              <img
                src={selectedPlanElement.planSvgUrl || selectedPlanElement.imageUrl}
                alt={selectedPlanElement.name}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain transition-transform"
                style={{
                  transform: `rotate(${selectedPlanElement.rotation || 0}deg)`,
                }}
              />
            ) : (
              <div className="text-xs text-[#737373] text-center px-3">
                {selectedPlanElement.name}
              </div>
            )}
          </div>
        </div>

        {/* Nombre */}
        <div className="space-y-1.5 border-t border-[#E6E4DD] pt-4">
          <label className="block text-xs text-[#737373]">Nombre del elemento</label>
          <input
            type="text"
            value={selectedPlanElement.name}
            onChange={(e) =>
              onUpdatePlanElement(selectedPlanElement.id, { name: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        {/* Asignar a Espacio / Sección */}
        {allZones.length > 0 && (
          <div className="space-y-1.5 border-t border-[#E6E4DD] pt-4">
            <label className="block text-xs text-[#737373]">
              Espacio / Sección asignada
            </label>
            <select
              value={selectedPlanElement.zoneId || ''}
              onChange={(e) =>
                onUpdatePlanElement(selectedPlanElement.id, {
                  zoneId: e.target.value || undefined,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">Sin espacio específico (General)</option>
              {allZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.participant})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dimensiones en Planta (Ancho y Fondo en cm) */}
        <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#171717]">
              Dimensiones en Planta (cm)
            </span>
            <button
              onClick={() =>
                onUpdatePlanElement(selectedPlanElement.id, {
                  widthCm: selectedPlanElement.depthCm,
                  depthCm: selectedPlanElement.widthCm,
                })
              }
              className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Intercambiar</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <span className="block text-[11px] text-[#737373] mb-1">
                Ancho (cm)
              </span>
              <input
                type="number"
                min={20}
                max={800}
                step={5}
                value={selectedPlanElement.widthCm}
                onChange={(e) =>
                  onUpdatePlanElement(selectedPlanElement.id, {
                    widthCm: Math.max(20, Number(e.target.value)),
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded bg-white border border-[#E6E4DD] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <span className="block text-[11px] text-[#737373] mb-1">
                Fondo / Largo (cm)
              </span>
              <input
                type="number"
                min={20}
                max={800}
                step={5}
                value={selectedPlanElement.depthCm}
                onChange={(e) =>
                  onUpdatePlanElement(selectedPlanElement.id, {
                    depthCm: Math.max(20, Number(e.target.value)),
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded bg-white border border-[#E6E4DD] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-3 gap-1 pt-1">
            {[
              { label: '80×80 cm', w: 80, d: 80 },
              { label: '100×100 cm', w: 100, d: 100 },
              { label: '120×120 cm', w: 120, d: 120 },
              { label: '120×40 cm', w: 120, d: 40 },
              { label: '160×80 cm', w: 160, d: 80 },
              { label: '200×90 cm', w: 200, d: 90 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() =>
                  onUpdatePlanElement(selectedPlanElement.id, {
                    widthCm: preset.w,
                    depthCm: preset.d,
                  })
                }
                className="py-1 px-1.5 rounded border border-[#E6E4DD] bg-white hover:border-[#2563EB] text-[10px] font-mono text-[#404040] cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Posición y Rotación */}
        <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#171717]">
              Posición y Rotación
            </span>
            <button
              onClick={() =>
                onUpdatePlanElement(selectedPlanElement.id, {
                  rotation: ((selectedPlanElement.rotation || 0) + 45) % 360,
                })
              }
              className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCw className="w-3 h-3" />
              <span>Girar +45°</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="block text-[10px] text-[#737373] mb-1">X (m)</span>
              <input
                type="number"
                step={0.1}
                value={selectedPlanElement.xM}
                onChange={(e) =>
                  onUpdatePlanElement(selectedPlanElement.id, {
                    xM: Number(e.target.value),
                  })
                }
                className="w-full px-2 py-1 text-xs font-mono rounded bg-white border border-[#E6E4DD]"
              />
            </div>
            <div>
              <span className="block text-[10px] text-[#737373] mb-1">Y (m)</span>
              <input
                type="number"
                step={0.1}
                value={selectedPlanElement.yM}
                onChange={(e) =>
                  onUpdatePlanElement(selectedPlanElement.id, {
                    yM: Number(e.target.value),
                  })
                }
                className="w-full px-2 py-1 text-xs font-mono rounded bg-white border border-[#E6E4DD]"
              />
            </div>
            <div>
              <span className="block text-[10px] text-[#737373] mb-1">Ángulo (°)</span>
              <input
                type="number"
                step={15}
                value={selectedPlanElement.rotation || 0}
                onChange={(e) =>
                  onUpdatePlanElement(selectedPlanElement.id, {
                    rotation: Number(e.target.value) % 360,
                  })
                }
                className="w-full px-2 py-1 text-xs font-mono rounded bg-white border border-[#E6E4DD]"
              />
            </div>
          </div>
        </div>

        {/* Acciones (Duplicar, Bloquear, Eliminar) */}
        <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
          <span className="block text-xs text-[#737373]">Acciones</span>
          <div className="grid grid-cols-3 gap-1.5">
            {onDuplicatePlanElement && (
              <button
                onClick={() => onDuplicatePlanElement(selectedPlanElement.id)}
                className="py-1.5 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3 text-[#737373]" />
                <span>Duplicar</span>
              </button>
            )}
            <button
              onClick={() =>
                onUpdatePlanElement(selectedPlanElement.id, {
                  locked: !selectedPlanElement.locked,
                })
              }
              className="py-1.5 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              {selectedPlanElement.locked ? (
                <>
                  <Lock className="w-3 h-3 text-[#2563EB]" />
                  <span>Fijo</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 text-[#737373]" />
                  <span>Bloquear</span>
                </>
              )}
            </button>
            {onDeletePlanElement && (
              <button
                onClick={() => onDeletePlanElement(selectedPlanElement.id)}
                className="py-1.5 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-red-50 text-xs text-[#737373] hover:text-[#DC2626] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Eliminar</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // 1. PHOTOGRAPH OR GRAPHIC RESOURCE SELECTED
  if (selectedItems.length > 0) {
    const itemIds = selectedItems.map((i) => i.id);
    const activeItem = primaryItem || selectedItems[0];
    const isPerson =
      activeItem.category?.startsWith('people') ||
      activeItem.name.toLowerCase().includes('escala') ||
      activeItem.name.toLowerCase().includes('visitante') ||
      activeItem.name.toLowerCase().includes('persona');

    const handleSwapOrientation = () => {
      selectedItems.forEach((it) => {
        onUpdateItem(it.id, {
          widthCm: it.heightCm,
          heightCm: it.widthCm,
        });
      });
    };

    const handleItemImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const { dataUrl, isVector } = await optimizeImageFile(file, 1200, 0.8);
        onUpdateMultipleItems(itemIds, {
          imageUrl: dataUrl,
          isVector,
        });
      } catch (err) {
        console.error('Error optimizando imagen de obra:', err);
      }
      e.target.value = '';
    };

    // Quick set human scale height
    const handleSetHumanHeight = (hM: number) => {
      const targetHCm = Math.round(hM * 100);
      selectedItems.forEach((it) => {
        const ratio = it.widthCm / Math.max(1, it.heightCm);
        const newWCm = Math.max(15, Math.round(targetHCm * ratio));
        onUpdateItem(it.id, {
          heightCm: targetHCm,
          widthCm: newWCm,
          yCm: 0, // Align feet to floor
        });
      });
    };

    // Z-Order actions
    const handleBringToFront = () => {
      const maxZ = Math.max(...allWallItems.map((i) => i.zOrder || 0), 0);
      selectedItems.forEach((it, idx) => {
        onUpdateItem(it.id, { zOrder: maxZ + 1 + idx });
      });
    };

    const handleSendToBack = () => {
      const minZ = Math.min(...allWallItems.map((i) => i.zOrder || 0), 0);
      selectedItems.forEach((it, idx) => {
        onUpdateItem(it.id, { zOrder: minZ - 1 - idx });
      });
    };

    return (
      <aside className="w-72 bg-[#FAF8F5] border-l border-[#E6E4DD] flex flex-col h-full overflow-y-auto px-5 py-5 space-y-5 select-none shrink-0 text-[#171717]">
        {/* Category Header & Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] bg-[#EFECE6] px-1.5 py-0.5 rounded">
              {activeItem.category
                ? activeItem.category.replace('_', ' ')
                : activeItem.type === 'photo'
                ? 'Fotografía'
                : 'Elemento'}
            </span>
            {activeItem.isPendingReplacement && (
              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Provisional</span>
              </span>
            )}
          </div>

          <div className="w-full h-36 bg-white border border-[#E6E4DD] rounded flex items-center justify-center p-3 overflow-hidden relative">
            {activeItem.imageUrl ? (
              <img
                src={activeItem.imageUrl}
                alt={activeItem.name}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain"
                style={{
                  color: activeItem.tintColor || '#171717',
                  transform: activeItem.flipHorizontal ? 'scaleX(-1)' : 'none',
                }}
              />
            ) : (
              <div className="text-xs text-[#737373] text-center px-3 line-clamp-3">
                {activeItem.textContent || activeItem.name}
              </div>
            )}
          </div>
        </div>

        {/* Nombre */}
        <div className="space-y-1.5 border-t border-[#E6E4DD] pt-4">
          <label className="block text-xs text-[#737373]">Nombre</label>
          <input
            type="text"
            value={
              primaryItem
                ? primaryItem.name
                : `${selectedItems.length} elementos seleccionados`
            }
            disabled={!primaryItem}
            onChange={(e) =>
              primaryItem &&
              onUpdateItem(primaryItem.id, { name: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        {/* Human Silhouette Physical Scale Presets */}
        {isPerson && (
          <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#171717] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Escala humana</span>
              </span>
              <span className="text-[11px] font-mono text-[#2563EB]">
                {(activeItem.heightCm / 100).toFixed(2)} m
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleSetHumanHeight(1.7)}
                className={`py-1 px-2 rounded text-[11px] border text-left cursor-pointer transition-colors ${
                  activeItem.heightCm === 170
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white border-[#E6E4DD] hover:border-[#2563EB]'
                }`}
              >
                1.70 m (Adulto)
              </button>
              <button
                onClick={() => handleSetHumanHeight(1.8)}
                className={`py-1 px-2 rounded text-[11px] border text-left cursor-pointer transition-colors ${
                  activeItem.heightCm === 180
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white border-[#E6E4DD] hover:border-[#2563EB]'
                }`}
              >
                1.80 m (Alto)
              </button>
              <button
                onClick={() => handleSetHumanHeight(1.6)}
                className={`py-1 px-2 rounded text-[11px] border text-left cursor-pointer transition-colors ${
                  activeItem.heightCm === 160
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white border-[#E6E4DD] hover:border-[#2563EB]'
                }`}
              >
                1.60 m (Baja)
              </button>
              <button
                onClick={() => handleSetHumanHeight(1.3)}
                className={`py-1 px-2 rounded text-[11px] border text-left cursor-pointer transition-colors ${
                  activeItem.heightCm === 130
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white border-[#E6E4DD] hover:border-[#2563EB]'
                }`}
              >
                1.30 m (Silla)
              </button>
            </div>
          </div>
        )}

        {/* Dimensiones Físicas (Ancho, Alto, Aspect Ratio, Orientación) */}
        <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#737373]">Dimensiones (cm)</span>
            <button
              onClick={handleSwapOrientation}
              className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Girar</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <span className="block text-[11px] text-[#737373] mb-1">Ancho</span>
              <input
                type="number"
                min={5}
                max={800}
                value={activeItem.widthCm}
                onChange={(e) => {
                  const val = Math.max(5, Number(e.target.value));
                  selectedItems.forEach((it) => {
                    if (it.aspectRatioLocked) {
                      const ratio = it.heightCm / Math.max(1, it.widthCm);
                      onUpdateItem(it.id, {
                        widthCm: val,
                        heightCm: Math.max(5, Math.round(val * ratio)),
                      });
                    } else {
                      onUpdateItem(it.id, { widthCm: val });
                    }
                  });
                }}
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded bg-white border border-[#E6E4DD] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <span className="block text-[11px] text-[#737373] mb-1">Alto</span>
              <input
                type="number"
                min={5}
                max={500}
                value={activeItem.heightCm}
                onChange={(e) => {
                  const val = Math.max(5, Number(e.target.value));
                  selectedItems.forEach((it) => {
                    if (it.aspectRatioLocked) {
                      const ratio = it.widthCm / Math.max(1, it.heightCm);
                      onUpdateItem(it.id, {
                        heightCm: val,
                        widthCm: Math.max(5, Math.round(val * ratio)),
                      });
                    } else {
                      onUpdateItem(it.id, { heightCm: val });
                    }
                  });
                }}
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded bg-white border border-[#E6E4DD] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-[11px] text-[#737373] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={activeItem.aspectRatioLocked}
              onChange={(e) =>
                onUpdateMultipleItems(itemIds, {
                  aspectRatioLocked: e.target.checked,
                })
              }
              className="accent-[#2563EB]"
            />
            <span>Conservar proporción</span>
          </label>
        </div>

        {/* Posición (X e Y desde suelo) + Quick Alignments */}
        {primaryItem && (
          <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#737373]">Posición (cm)</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateItem(primaryItem.id, { yCm: 0 })}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-[#E6E4DD] bg-white hover:bg-[#FAF8F5] text-[#171717] cursor-pointer"
                  title="Alinear base al suelo (Y = 0)"
                >
                  Suelo
                </button>
                <button
                  onClick={() =>
                    onUpdateItem(primaryItem.id, {
                      yCm: Number((150 - primaryItem.heightCm / 2).toFixed(1)),
                    })
                  }
                  className="text-[10px] px-1.5 py-0.5 rounded border border-[#E6E4DD] bg-white hover:bg-[#FAF8F5] text-[#171717] cursor-pointer"
                  title="Alinear centro al eje visual de 150 cm"
                >
                  150 cm
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <span className="block text-[11px] text-[#737373] mb-1">
                  Horizontal (X)
                </span>
                <input
                  type="number"
                  step={0.5}
                  value={primaryItem.xCm}
                  onChange={(e) =>
                    onUpdateItem(primaryItem.id, {
                      xCm: Number(e.target.value),
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded bg-white border border-[#E6E4DD] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <span className="block text-[11px] text-[#737373] mb-1">
                  Desde suelo (Y)
                </span>
                <input
                  type="number"
                  step={0.5}
                  value={primaryItem.yCm}
                  onChange={(e) =>
                    onUpdateItem(primaryItem.id, {
                      yCm: Number(e.target.value),
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded bg-white border border-[#E6E4DD] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Vector Tint Color / Silhouette Finish */}
        {(activeItem.isVector || isPerson) && (
          <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
            <label className="block text-xs text-[#737373]">
              Color de silueta / recurso vectorial
            </label>
            <div className="flex items-center gap-2">
              {SILHOUETTE_COLORS.map((c) => (
                <button
                  key={c.color}
                  onClick={() =>
                    onUpdateMultipleItems(itemIds, { tintColor: c.color })
                  }
                  title={c.name}
                  className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${
                    activeItem.tintColor === c.color
                      ? 'scale-110 ring-2 ring-[#2563EB]'
                      : 'border-[#E6E4DD]'
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
              <input
                type="color"
                value={activeItem.tintColor || '#171717'}
                onChange={(e) =>
                  onUpdateMultipleItems(itemIds, { tintColor: e.target.value })
                }
                className="w-6 h-6 rounded border border-[#E6E4DD] cursor-pointer"
                title="Color personalizado"
              />
            </div>
          </div>
        )}

        {/* Dirección de la Obra en el Plano (Hacia dónde mira) */}
        <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-[#171717]">
              Dirección de la obra (Hacia dónde mira)
            </label>
            {onFlipItemDirection && (
              <button
                onClick={() => itemIds.forEach((id) => onFlipItemDirection(id))}
                className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                title="Invertir al lado opuesto del muro"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Invertir lado</span>
              </button>
            )}
          </div>
          {(() => {
            const currentSide =
              activeItem.normalSide || selectedWall?.normalSide || 'bottom';
            const sides: { id: 'top' | 'bottom' | 'left' | 'right'; label: string }[] = [
              { id: 'top', label: '↑ Arriba' },
              { id: 'bottom', label: '↓ Abajo' },
              { id: 'left', label: '← Izq.' },
              { id: 'right', label: '→ Der.' },
            ];
            return (
              <div className="grid grid-cols-4 gap-1">
                {sides.map((s) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      onUpdateMultipleItems(itemIds, { normalSide: s.id })
                    }
                    className={`py-1.5 px-1 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                      currentSide === s.id
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-white border-[#E6E4DD] text-[#404040] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            );
          })()}
          <p className="text-[10px] text-[#737373] leading-tight">
            Define de qué lado del muro se monta y hacia qué espacio mira esta obra.
          </p>
        </div>

        {/* Layer Assignment */}
        <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
          <label className="block text-xs text-[#737373]">Capa asignada</label>
          <select
            value={activeItem.layerId || 'artworks'}
            onChange={(e) =>
              onUpdateMultipleItems(itemIds, {
                layerId: e.target.value as LayerKey,
              })
            }
            className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
          >
            {LAYER_OPTIONS.map((ly) => (
              <option key={ly.id} value={ly.id}>
                {ly.label}
              </option>
            ))}
          </select>
        </div>

        {/* Frame / Marco (For photos) */}
        {(activeItem.type === 'photo' ||
          activeItem.type === 'frame' ||
          activeItem.type === 'portrait_stand') && (
          <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
            <label className="block text-xs text-[#737373]">Marco</label>
            <select
              value={activeItem.frameStyle}
              onChange={(e) =>
                onUpdateMultipleItems(itemIds, {
                  frameStyle: e.target.value as FrameStyle,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
            >
              {FRAME_STYLES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Transform & Stacking (Flip, Z-Order, Opacity) */}
        <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
          <span className="block text-xs text-[#737373]">
            Transformación y orden
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                onUpdateMultipleItems(itemIds, {
                  flipHorizontal: !activeItem.flipHorizontal,
                })
              }
              className={`py-1.5 px-2 rounded border text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                activeItem.flipHorizontal
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white border-[#E6E4DD] hover:bg-[#FAF8F5]'
              }`}
            >
              <RotateCw className="w-3 h-3" />
              <span>Invertir H</span>
            </button>

            <button
              onClick={() =>
                onUpdateMultipleItems(itemIds, {
                  isPendingReplacement: !activeItem.isPendingReplacement,
                })
              }
              className={`py-1.5 px-2 rounded border text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                activeItem.isPendingReplacement
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white border-[#E6E4DD] hover:bg-[#FAF8F5]'
              }`}
              title="Marcar como medida o recurso pendiente de confirmación"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Provisional</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleBringToFront}
              className="py-1 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-[#FAF8F5] text-[11px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowUp className="w-3 h-3 text-[#737373]" />
              <span>Al frente</span>
            </button>
            <button
              onClick={handleSendToBack}
              className="py-1 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-[#FAF8F5] text-[11px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowDown className="w-3 h-3 text-[#737373]" />
              <span>Al fondo</span>
            </button>
          </div>
        </div>

        {/* Acciones de Edición */}
        <div className="space-y-2 border-t border-[#E6E4DD] pt-4">
          <span className="block text-xs text-[#737373]">Acciones</span>

          <button
            onClick={() => itemImageInputRef.current?.click()}
            className="w-full py-2 px-3 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Reemplazar gráfico / imagen</span>
          </button>
          <input
            ref={itemImageInputRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={handleItemImageFile}
          />

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={onDuplicateSelected}
              className="py-1.5 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3 text-[#737373]" />
              <span>Duplicar</span>
            </button>

            <button
              onClick={() =>
                onUpdateMultipleItems(itemIds, { locked: !activeItem.locked })
              }
              className="py-1.5 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              {activeItem.locked ? (
                <>
                  <Lock className="w-3 h-3 text-[#2563EB]" />
                  <span>Fijo</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 text-[#737373]" />
                  <span>Bloquear</span>
                </>
              )}
            </button>

            <button
              onClick={onDeleteSelected}
              className="py-1.5 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-red-50 text-xs text-[#737373] hover:text-[#DC2626] flex items-center justify-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>

        {/* Más Propiedades (Paspartú, rotación, opacidad, texto) */}
        <div className="border-t border-[#E6E4DD] pt-3">
          <button
            onClick={() => setMoreItemOpen((v) => !v)}
            className="w-full flex items-center justify-between text-xs text-[#737373] hover:text-[#171717] py-1 cursor-pointer"
          >
            <span>Más propiedades</span>
            {moreItemOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {moreItemOpen && (
            <div className="pt-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[11px] text-[#737373] mb-1">
                    Paspartú (cm)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    value={activeItem.matWidthCm}
                    onChange={(e) =>
                      onUpdateMultipleItems(itemIds, {
                        matWidthCm: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2 py-1 text-xs font-mono rounded bg-white border border-[#E6E4DD]"
                  />
                </div>
                {primaryItem && (
                  <div>
                    <span className="block text-[11px] text-[#737373] mb-1">
                      Rotación (°)
                    </span>
                    <input
                      type="number"
                      step={5}
                      value={primaryItem.rotation}
                      onChange={(e) =>
                        onUpdateItem(primaryItem.id, {
                          rotation: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 text-xs font-mono rounded bg-white border border-[#E6E4DD]"
                    />
                  </div>
                )}
              </div>

              {/* Opacity slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#737373] mb-1">
                  <span>Opacidad</span>
                  <span>{Math.round((activeItem.opacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={activeItem.opacity ?? 1}
                  onChange={(e) =>
                    onUpdateMultipleItems(itemIds, {
                      opacity: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>

              {primaryItem && (
                <div>
                  <span className="block text-[11px] text-[#737373] mb-1">
                    Descripción / Texto de sala
                  </span>
                  <textarea
                    rows={3}
                    value={primaryItem.textContent || primaryItem.description}
                    onChange={(e) =>
                      onUpdateItem(primaryItem.id, {
                        textContent: e.target.value,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded bg-white border border-[#E6E4DD]"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    );
  }

  // 1.5 MULTI-ZONE / MULTI-SPACE GROUP SELECTED
  if (selectedZoneIds.length > 1 && selectedItems.length === 0) {
    const selectedZonesList = allZones.filter((z) => selectedZoneIds.includes(z.id));
    return (
      <aside className="w-72 bg-[#FAF8F5] border-l border-[#E6E4DD] flex flex-col h-full overflow-y-auto px-5 py-5 space-y-5 select-none shrink-0 text-[#171717]">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              Selección Múltiple
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-semibold">
              {selectedZoneIds.length} Espacios
            </span>
          </div>
          <p className="text-xs text-[#737373]">
            Puedes arrastrar directamente los espacios en el plano o usar los controles de desplazamiento a continuación para moverlos juntos libremente.
          </p>
        </div>

        {/* Selected Spaces Chips */}
        <div className="space-y-1.5 border-t border-[#E6E4DD] pt-3">
          <span className="block text-[11px] font-medium text-[#737373]">
            Espacios seleccionados:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedZonesList.map((z) => (
              <span
                key={z.id}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-[#E6E4DD] text-xs font-medium"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: z.color }}
                />
                <span className="truncate max-w-[120px]">{z.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Group Movement Controls (Nudge Pad) */}
        {onMoveZones && (
          <div className="space-y-2.5 border-t border-[#E6E4DD] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#171717]">
                Mover espacios en grupo
              </span>
              <span className="text-[10px] text-[#737373] font-mono">X / Y</span>
            </div>

            {/* Quick step buttons */}
            <div className="space-y-2">
              <span className="block text-[11px] text-[#737373]">Paso fino (0.2 m):</span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => onMoveZones(selectedZoneIds, -0.2, 0)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 20 cm a la izquierda"
                >
                  ← 0.2m
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0.2, 0)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 20 cm a la derecha"
                >
                  → 0.2m
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0, -0.2)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 20 cm hacia arriba"
                >
                  ↑ 0.2m
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0, 0.2)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 20 cm hacia abajo"
                >
                  ↓ 0.2m
                </button>
              </div>

              <span className="block text-[11px] text-[#737373] pt-1">Paso estándar (0.5 m):</span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => onMoveZones(selectedZoneIds, -0.5, 0)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 50 cm a la izquierda"
                >
                  ← 0.5m
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0.5, 0)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 50 cm a la derecha"
                >
                  → 0.5m
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0, -0.5)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 50 cm hacia arriba"
                >
                  ↑ 0.5m
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0, 0.5)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 50 cm hacia abajo"
                >
                  ↓ 0.5m
                </button>
              </div>

              <span className="block text-[11px] text-[#737373] pt-1">Paso grande (1.0 m):</span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => onMoveZones(selectedZoneIds, -1.0, 0)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 1 metro a la izquierda"
                >
                  ← 1m
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 1.0, 0)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 1 metro a la derecha"
                >
                  → 1m
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0, -1.0)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 1 metro hacia arriba"
                >
                  ↑ 1m
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0, 1.0)}
                  className="py-1.5 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover grupo 1 metro hacia abajo"
                >
                  ↓ 1m
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deselect button */}
        <div className="border-t border-[#E6E4DD] pt-4">
          <button
            onClick={() => onSelectZone?.(null)}
            className="w-full py-1.5 px-3 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-medium text-[#737373] hover:text-[#171717] cursor-pointer"
          >
            Deseleccionar espacios
          </button>
        </div>
      </aside>
    );
  }

  // 2. WALL SELECTED
  if (selectedWall) {
    const wallPhotos = allWallItems.filter(
      (it) =>
        it.wallId === selectedWall.id &&
        (it.type === 'photo' ||
          it.type === 'portrait_stand' ||
          it.type === 'frame')
    );
    const pendingVer = verifications.find(
      (v) => v.id === selectedWall.pendingVerificationId
    );

    return (
      <aside className="w-72 bg-[#FAF8F5] border-l border-[#E6E4DD] flex flex-col h-full overflow-y-auto px-5 py-5 space-y-5 select-none shrink-0 text-[#171717]">
        {/* Header & Nombre / Participante */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
              {selectedWall.thicknessCm === 0 ? 'Vano de acceso' : 'Muro seleccionado'}
            </div>
            {selectedWall.thicknessCm === 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Paso libre
              </span>
            )}
          </div>

          {selectedWall.thicknessCm === 0 && (
            <div className="p-2 rounded bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[11px] leading-tight flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span>Vano de paso arquitectónico ({selectedWall.lengthM.toFixed(2)} m). Conecta espacios contiguos.</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs text-[#737373]">Nombre del muro</label>
            <input
              type="text"
              value={selectedWall.name}
              onChange={(e) =>
                onUpdateWall(selectedWall.id, { name: e.target.value })
              }
              className="w-full px-2.5 py-1.5 text-xs font-medium rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Área / Sección Asignada (Top-level selector) */}
          {allZones.length > 0 && (
            <div className="space-y-1 pt-1">
              <label className="block text-xs text-[#737373]">
                Área / Sección asignada
              </label>
              <select
                value={selectedWall.zoneId}
                onChange={(e) => {
                  const newZoneId = e.target.value;
                  if (onReassignWallZone) {
                    onReassignWallZone(selectedWall.id, newZoneId);
                  } else {
                    const newZone = allZones.find((z) => z.id === newZoneId);
                    onUpdateWall(selectedWall.id, {
                      zoneId: newZoneId,
                      participant: newZone
                        ? newZone.participant
                        : selectedWall.participant,
                    });
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs font-medium rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                {allZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.participant})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Participante / Artista (Editable Input + Quick Selector) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-[#737373]">
                Participante / Artista
              </label>
              {allZones.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    onUpdateWall(selectedWall.id, {
                      participant: e.target.value,
                    });
                  }}
                  className="text-[11px] text-[#2563EB] bg-transparent border-none focus:outline-none cursor-pointer font-medium"
                  title="Elegir un participante de la lista"
                >
                  <option value="">Elegir de lista...</option>
                  {Array.from(
                    new Set(allZones.map((z) => z.participant).filter(Boolean))
                  ).map((pName) => (
                    <option key={pName} value={pName}>
                      {pName}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <input
              type="text"
              value={selectedWall.participant}
              placeholder="Nombre del participante o artista..."
              onChange={(e) =>
                onUpdateWall(selectedWall.id, { participant: e.target.value })
              }
              className="w-full px-2.5 py-1.5 text-xs font-medium rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Move Whole Wall in Canvas */}
          {onMoveWall && !selectedWall.locked && (
            <div className="space-y-1.5 pt-2 border-t border-[#E6E4DD]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#171717]">
                  {selectedWall.thicknessCm === 0 ? 'Mover vano entero' : 'Mover muro entero'}
                </span>
                <span className="text-[10px] text-[#737373]">±0.1m / ±0.5m</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => onMoveWall(selectedWall.id, -0.1, 0)}
                  className="py-1 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover muro 10 cm a la izquierda"
                >
                  ← 10cm
                </button>
                <button
                  onClick={() => onMoveWall(selectedWall.id, 0.1, 0)}
                  className="py-1 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover muro 10 cm a la derecha"
                >
                  → 10cm
                </button>
                <button
                  onClick={() => onMoveWall(selectedWall.id, 0, -0.1)}
                  className="py-1 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover muro 10 cm hacia arriba"
                >
                  ↑ 10cm
                </button>
                <button
                  onClick={() => onMoveWall(selectedWall.id, 0, 0.1)}
                  className="py-1 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-mono font-medium flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover muro 10 cm hacia abajo"
                >
                  ↓ 10cm
                </button>
              </div>
            </div>
          )}

          {/* Dirección de las obras en este muro (Hacia dónde miran) */}
          {selectedWall.thicknessCm > 0 && (
            <div className="space-y-2 pt-3 border-t border-[#E6E4DD]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#171717]">
                  Dirección de las obras
                </span>
                {onFlipWallDirection && (
                  <button
                    onClick={() => onFlipWallDirection(selectedWall.id)}
                    className="text-[11px] text-[#059669] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    title="Invertir hacia qué lado miran las obras de este muro"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Invertir cara (⇄)</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    { id: 'top', label: '↑ Arriba' },
                    { id: 'bottom', label: '↓ Abajo' },
                    { id: 'left', label: '← Izq.' },
                    { id: 'right', label: '→ Der.' },
                  ] as const
                ).map((side) => (
                  <button
                    key={side.id}
                    onClick={() => {
                      const nextDimOffset =
                        side.id === 'bottom' || side.id === 'right'
                          ? Math.abs(selectedWall.dimOffset || 22)
                          : -Math.abs(selectedWall.dimOffset || 22);
                      onUpdateWall(selectedWall.id, {
                        normalSide: side.id,
                        dimOffset: nextDimOffset,
                      });
                      const wallItemIds = allWallItems
                        .filter((i) => i.wallId === selectedWall.id)
                        .map((i) => i.id);
                      if (wallItemIds.length > 0) {
                        onUpdateMultipleItems(wallItemIds, { normalSide: side.id });
                      }
                    }}
                    className={`py-1.5 px-1 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                      selectedWall.normalSide === side.id
                        ? 'bg-[#059669] text-white border-[#059669]'
                        : 'bg-white border-[#E6E4DD] text-[#404040] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {side.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Muro de Doble Cara (Aparece en las 2 secciones) */}
          {selectedWall.thicknessCm > 0 && onCreateOppositeWallFace && (
            <div className="space-y-2 pt-3 border-t border-[#E6E4DD]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#171717] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Muro de Doble Cara</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] font-medium">
                  2 Secciones
                </span>
              </div>
              {(() => {
                const linkedWall = allWalls.find(
                  (w) =>
                    w.id !== selectedWall.id &&
                    (w.id === selectedWall.linkedWallId ||
                      w.linkedWallId === selectedWall.id ||
                      (w.startVertexId === selectedWall.startVertexId &&
                        w.endVertexId === selectedWall.endVertexId))
                );

                const currentZone = allZones.find((z) => z.id === selectedWall.zoneId);

                if (linkedWall) {
                  const linkedZone = allZones.find((z) => z.id === linkedWall.zoneId);
                  return (
                    <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2.5 text-xs">
                      <div className="text-[11px] text-[#1E3A8A] leading-snug">
                        Este muro aparece en <strong>2 secciones</strong> simultáneamente:
                      </div>

                      {/* Cara Actual */}
                      <div className="p-1.5 rounded bg-white/90 border border-blue-100 text-[11px]">
                        <span className="font-semibold text-[#2563EB]">Cara actual:</span>{' '}
                        <span className="font-medium text-[#171717]">
                          {currentZone?.name || selectedWall.participant}
                        </span>{' '}
                        <span className="text-[#737373]">({selectedWall.participant})</span>
                      </div>

                      {/* Cambiar 2da Sección (Cara Opuesta) */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#1E3A8A]">
                          2ª Sección (Cara opuesta / Contracara)
                        </label>
                        <select
                          value={linkedWall.zoneId}
                          onChange={(e) => {
                            onCreateOppositeWallFace(selectedWall.id, e.target.value);
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded bg-white border border-blue-200 text-[#171717] font-medium cursor-pointer"
                        >
                          {allZones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.name} ({z.participant})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cambiar Participante de la Cara Opuesta */}
                      <div className="space-y-1">
                        <label className="block text-[10px] text-[#1E3A8A]">
                          Participante en 2ª sección ({linkedZone?.name || 'Contracara'})
                        </label>
                        <input
                          type="text"
                          value={linkedWall.participant}
                          onChange={(e) => {
                            onUpdateWall(linkedWall.id, {
                              participant: e.target.value,
                            });
                            onUpdateWall(selectedWall.id, {
                              secondaryParticipant: e.target.value,
                            });
                          }}
                          className="w-full px-2 py-1 text-xs rounded bg-white border border-blue-200 text-[#171717]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        {onSelectWall && (
                          <button
                            onClick={() => onSelectWall(linkedWall.id)}
                            className="py-1.5 px-2 rounded bg-white hover:bg-blue-50 border border-blue-300 text-[#2563EB] text-[11px] font-medium cursor-pointer"
                          >
                            Ir a otra cara
                          </button>
                        )}
                        <button
                          onClick={() => onOpenWallElevation(linkedWall.id)}
                          className="py-1.5 px-2 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-medium cursor-pointer"
                        >
                          Elevación Cara B
                        </button>
                      </div>

                      {onRemoveOppositeWallFace && (
                        <button
                          onClick={() => onRemoveOppositeWallFace(selectedWall.id)}
                          className="w-full py-1 px-2 rounded text-[11px] text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer"
                        >
                          Quitar segunda cara (Dejar en 1 sola sección)
                        </button>
                      )}
                    </div>
                  );
                }

                const defaultTargetZone =
                  oppositeFaceZoneId ||
                  selectedWall.secondaryZoneId ||
                  allZones.find((z) => z.id !== selectedWall.zoneId)?.id ||
                  selectedWall.zoneId;

                return (
                  <div className="p-2.5 rounded-lg bg-white border border-[#E6E4DD] space-y-2 text-xs">
                    <p className="text-[11px] text-[#737373] leading-snug">
                      Elige la <strong>segunda sección</strong> para que este muro aparezca en ambas secciones y pueda montar obras por ambos lados:
                    </p>
                    <select
                      value={defaultTargetZone}
                      onChange={(e) => setOppositeFaceZoneId(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded bg-[#FAF8F5] border border-[#E6E4DD] text-[#171717] cursor-pointer"
                    >
                      {allZones.map((z) => (
                        <option key={z.id} value={z.id}>
                          2ª Sección: {z.name} ({z.participant})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        onCreateOppositeWallFace(selectedWall.id, defaultTargetZone)
                      }
                      className="w-full py-1.5 px-2.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Mostrar en las 2 secciones (Doble cara)</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Longitud y Altura */}
        <div className="space-y-3 border-t border-[#E6E4DD] pt-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs text-[#737373] mb-1">
                Longitud (m)
              </label>
              <input
                type="number"
                min={0.2}
                max={20}
                step={0.05}
                value={selectedWall.lengthM}
                onChange={(e) =>
                  onUpdateWallLength(selectedWall.id, Number(e.target.value))
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#737373] mb-1">
                Altura (m)
              </label>
              <input
                type="number"
                min={1.0}
                max={6.0}
                step={0.05}
                value={selectedWall.heightM}
                onChange={(e) =>
                  onUpdateWall(selectedWall.id, {
                    heightM: Math.max(1, Number(e.target.value)),
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Estado de confirmación de medidas */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[#737373]">Estado de medidas</span>
            <button
              onClick={() =>
                onUpdateWall(selectedWall.id, {
                  heightConfirmed: !selectedWall.heightConfirmed,
                })
              }
              className={`text-xs font-medium cursor-pointer ${
                selectedWall.heightConfirmed &&
                (!pendingVer || pendingVer.resolved)
                  ? 'text-[#171717]'
                  : 'text-[#2563EB] hover:underline'
              }`}
            >
              {selectedWall.heightConfirmed &&
              (!pendingVer || pendingVer.resolved)
                ? 'Confirmadas'
                : 'Por definir (Confirmar)'}
            </button>
          </div>

          {pendingVer && !pendingVer.resolved && (
            <div className="pt-1 space-y-1.5">
              <div className="text-[11px] text-[#737373] leading-normal">
                {pendingVer.description}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pendingVer.options.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() =>
                      onResolveVerification(pendingVer.id, opt.value)
                    }
                    className="px-2 py-1 rounded text-[11px] bg-white border border-[#E6E4DD] hover:border-[#2563EB] text-[#171717] cursor-pointer"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Obras asociadas */}
        <div className="flex items-center justify-between border-t border-[#E6E4DD] pt-4 text-xs">
          <span className="text-[#737373]">Obras asociadas</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onSetWallPhotoCount(
                  selectedWall,
                  Math.max(0, wallPhotos.length - 1)
                )
              }
              className="p-1 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center font-mono tabular-nums font-medium">
              {wallPhotos.length}
            </span>
            <button
              onClick={() =>
                onSetWallPhotoCount(selectedWall, wallPhotos.length + 1)
              }
              className="p-1 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Acceso a más propiedades mediante desplegable */}
        <div className="border-t border-[#E6E4DD] pt-3">
          <button
            onClick={() => setMoreWallOpen((v) => !v)}
            className="w-full flex items-center justify-between text-xs text-[#737373] hover:text-[#171717] py-1 cursor-pointer"
          >
            <span>Más propiedades</span>
            {moreWallOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {moreWallOpen && (
            <div className="pt-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#737373] mb-1">
                    Grosor (cm)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={selectedWall.thicknessCm}
                    onChange={(e) =>
                      onUpdateWall(selectedWall.id, {
                        thicknessCm: Math.max(5, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2 py-1 text-xs font-mono rounded bg-white border border-[#E6E4DD]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#737373] mb-1">
                    Separación (cm)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={selectedWall.defaultSpacingCm}
                    onChange={(e) =>
                      onUpdateWall(selectedWall.id, {
                        defaultSpacingCm: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2 py-1 text-xs font-mono rounded bg-white border border-[#E6E4DD]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#737373] mb-1">
                  Material de pared
                </label>
                <select
                  value={selectedWall.material}
                  onChange={(e) =>
                    onUpdateWall(selectedWall.id, {
                      material: e.target.value as WallMaterial,
                    })
                  }
                  className="w-full px-2 py-1.5 text-xs rounded bg-white border border-[#E6E4DD]"
                >
                  {MATERIALS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedWall.material === 'custom' && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#737373]">Color</span>
                  <input
                    type="color"
                    value={selectedWall.color}
                    onChange={(e) =>
                      onUpdateWall(selectedWall.id, { color: e.target.value })
                    }
                    className="w-8 h-6 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* Reasignar espacio */}
              {allZones.length > 0 && (
                <div>
                  <label className="block text-[11px] text-[#737373] mb-1">
                    Espacio asignado
                  </label>
                  <select
                    value={selectedWall.zoneId}
                    onChange={(e) => {
                      const newZoneId = e.target.value;
                      if (onReassignWallZone) {
                        onReassignWallZone(selectedWall.id, newZoneId);
                      } else {
                        const newZone = allZones.find((z) => z.id === newZoneId);
                        onUpdateWall(selectedWall.id, {
                          zoneId: newZoneId,
                          participant: newZone ? newZone.participant : selectedWall.participant,
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 text-xs rounded bg-white border border-[#E6E4DD]"
                  >
                    {allZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.participant})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Acciones de modificación geométrica */}
              <div className="space-y-1.5 pt-1">
                <span className="block text-[11px] text-[#737373]">Operaciones de muro</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {onSplitWall && (
                    <button
                      onClick={() => onSplitWall(selectedWall.id)}
                      className="py-1 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      title="Dividir este muro en dos segmentos contiguos"
                    >
                      <Scissors className="w-3 h-3 text-[#737373]" />
                      <span>Dividir en 2</span>
                    </button>
                  )}
                  {onDuplicateWall && (
                    <button
                      onClick={() => onDuplicateWall(selectedWall.id)}
                      className="py-1 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      title="Duplicar muro en paralelo"
                    >
                      <Copy className="w-3 h-3 text-[#737373]" />
                      <span>Duplicar</span>
                    </button>
                  )}
                </div>

                {onPromptDeleteWall && (
                  <button
                    onClick={() => onPromptDeleteWall(selectedWall)}
                    className="w-full py-1.5 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-red-50 text-[11px] text-[#737373] hover:text-[#DC2626] flex items-center justify-center gap-1 cursor-pointer mt-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar este muro...</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() =>
                    onUpdateWall(selectedWall.id, {
                      visible: !selectedWall.visible,
                    })
                  }
                  className="text-[#737373] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
                >
                  {selectedWall.visible ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Oculto</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    onUpdateWall(selectedWall.id, {
                      locked: !selectedWall.locked,
                    })
                  }
                  className="text-[#737373] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
                >
                  {selectedWall.locked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloqueado</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Desbloqueado</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => onExportWallPdf(selectedWall)}
                className="w-full py-1.5 px-2.5 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#737373]" />
                <span>Descargar ficha PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Botón principal «Abrir elevación» y Eliminar Muro */}
        <div className="pt-2 space-y-2">
          <button
            onClick={() => onOpenWallElevation(selectedWall.id)}
            className="w-full py-2.5 px-4 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Abrir elevación
          </button>

          {onPromptDeleteWall && (
            <button
              onClick={() => onPromptDeleteWall(selectedWall)}
              className="w-full py-2 px-3 rounded bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {selectedWall.thicknessCm === 0
                  ? 'Eliminar este vano...'
                  : 'Eliminar este muro...'}
              </span>
            </button>
          )}
        </div>
      </aside>
    );
  }

  // 3. SECTOR / ZONE SELECTED
  if (selectedZone && onUpdateZone) {
    return (
      <aside className="w-72 bg-[#FAF8F5] border-l border-[#E6E4DD] flex flex-col h-full overflow-y-auto px-5 py-5 space-y-5 select-none shrink-0 text-[#171717]">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#737373]">
            <Folder className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Sector Seleccionado</span>
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-[#737373]">Nombre del sector</label>
            <input
              type="text"
              value={selectedZone.name}
              onChange={(e) => onUpdateZone(selectedZone.id, { name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs font-medium rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-[#737373]">Participante / Artista</label>
            <input
              type="text"
              value={selectedZone.participant}
              onChange={(e) =>
                onUpdateZone(selectedZone.id, { participant: e.target.value })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-[#737373]">Descripción o notas</label>
            <textarea
              rows={2}
              value={selectedZone.roleOrNote}
              onChange={(e) =>
                onUpdateZone(selectedZone.id, { roleOrNote: e.target.value })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Quick Actions for Space */}
          <div className="pt-2 space-y-1.5">
            {onOpenSpaceAdmin && (
              <button
                onClick={() => onOpenSpaceAdmin(selectedZone)}
                className="w-full py-2 px-3 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Abrir ficha de administración</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {onStartDrawingWall && (
                <button
                  onClick={() => onStartDrawingWall(selectedZone.id)}
                  className="py-1.5 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                  title="Dibujar muro interactivo sobre el plano"
                >
                  <PenTool className="w-3 h-3 text-[#2563EB]" />
                  <span>Dibujar muro</span>
                </button>
              )}
              {onOpenCreateWallModal && (
                <button
                  onClick={() => onOpenCreateWallModal(selectedZone.id)}
                  className="py-1.5 px-2 rounded bg-white border border-[#E6E4DD] hover:bg-[#F0EFEA] text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                  title="Añadir muro especificando dimensiones"
                >
                  <Plus className="w-3 h-3 text-[#2563EB]" />
                  <span>+ Con medidas</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Space Label Properties on Floor Plan */}
        <div className="space-y-3 border-t border-[#E6E4DD] pt-4">
          <div className="text-xs font-medium text-[#171717] flex items-center justify-between">
            <span>Etiqueta en el plano</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  onUpdateZone(selectedZone.id, {
                    labelVisible: selectedZone.labelVisible === false ? true : false,
                  })
                }
                title={selectedZone.labelVisible === false ? 'Mostrar etiqueta' : 'Ocultar etiqueta'}
                className="text-[#737373] hover:text-[#171717] cursor-pointer"
              >
                {selectedZone.labelVisible !== false ? (
                  <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() =>
                  onUpdateZone(selectedZone.id, {
                    labelLocked: !selectedZone.labelLocked,
                  })
                }
                title={selectedZone.labelLocked ? 'Desbloquear posición de etiqueta' : 'Bloquear posición'}
                className="text-[#737373] hover:text-[#171717] cursor-pointer"
              >
                {selectedZone.labelLocked ? (
                  <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="block text-[11px] text-[#737373] mb-1">Tamaño letra (px)</span>
              <input
                type="number"
                min={8}
                max={32}
                value={selectedZone.labelFontSize || 11}
                onChange={(e) =>
                  onUpdateZone(selectedZone.id, {
                    labelFontSize: Math.max(8, Number(e.target.value)),
                  })
                }
                className="w-full px-2 py-1 rounded border border-[#E6E4DD] bg-white font-mono text-xs"
              />
            </div>
            <div>
              <span className="block text-[11px] text-[#737373] mb-1">Rotación (°)</span>
              <input
                type="number"
                step={15}
                value={selectedZone.labelRotation || 0}
                onChange={(e) =>
                  onUpdateZone(selectedZone.id, {
                    labelRotation: Number(e.target.value),
                  })
                }
                className="w-full px-2 py-1 rounded border border-[#E6E4DD] bg-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="block text-[11px] text-[#737373] mb-1">X (m en plano)</span>
              <input
                type="number"
                step={0.1}
                value={selectedZone.labelX ?? 0}
                onChange={(e) =>
                  onUpdateZone(selectedZone.id, { labelX: Number(e.target.value) })
                }
                className="w-full px-2 py-1 rounded border border-[#E6E4DD] bg-white font-mono text-xs"
              />
            </div>
            <div>
              <span className="block text-[11px] text-[#737373] mb-1">Y (m en plano)</span>
              <input
                type="number"
                step={0.1}
                value={selectedZone.labelY ?? 0}
                onChange={(e) =>
                  onUpdateZone(selectedZone.id, { labelY: Number(e.target.value) })
                }
                className="w-full px-2 py-1 rounded border border-[#E6E4DD] bg-white font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 4. NO ELEMENT SELECTED -> CLEAN MINIMALIST PROMPT + PLAN BACKGROUND CONTROLS + VERIFICATIONS
  const bg = backgroundPlan || {
    visible: referenceVisible,
    locked: false,
    opacity: referenceOpacity,
    scale: 1,
    xOffsetM: 0,
    yOffsetM: 0,
    rotationDeg: 0,
  };

  return (
    <aside className="w-72 bg-[#FAF8F5] border-l border-[#E6E4DD] flex flex-col h-full overflow-y-auto px-5 py-5 space-y-5 select-none shrink-0 text-[#171717]">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
          Inspector
        </div>
        <p className="text-xs text-[#737373] leading-relaxed">
          Selecciona un muro, sector o elemento en el plano para consultar y editar sus propiedades.
        </p>
      </div>

      {/* Capa: Plano Original de Fondo Controls */}
      <div className="border-t border-[#E6E4DD] pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#737373]">
            <Compass className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Plano original de fondo</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (onUpdateBackgroundPlan) {
                  onUpdateBackgroundPlan({ visible: !bg.visible });
                } else {
                  onToggleReferenceVisible();
                }
              }}
              title={bg.visible ? 'Ocultar plano de fondo' : 'Mostrar plano de fondo'}
              className="text-[#737373] hover:text-[#171717] cursor-pointer"
            >
              {bg.visible ? (
                <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
            </button>

            {onUpdateBackgroundPlan && (
              <button
                onClick={() => onUpdateBackgroundPlan({ locked: !bg.locked })}
                title={bg.locked ? 'Desbloquear posición' : 'Bloquear posición'}
                className="text-[#737373] hover:text-[#171717] cursor-pointer"
              >
                {bg.locked ? (
                  <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {bg.visible && (
          <div className="space-y-3 text-xs">
            {/* Opacity slider 0% to 100% */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[#737373]">
                <span>Opacidad</span>
                <span className="font-mono text-[#171717] font-medium">
                  {Math.round((bg.opacity ?? 0.35) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={bg.opacity ?? 0.35}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChangeReferenceOpacity(val);
                  onUpdateBackgroundPlan?.({ opacity: val });
                }}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
            </div>

            {/* Scale and Calibration */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[#737373]">
                <span>Escala</span>
                <span className="font-mono text-[#171717]">
                  {Number((bg.scale ?? 1).toFixed(2))}×
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step={0.05}
                  min={0.1}
                  max={10}
                  value={bg.scale ?? 1}
                  onChange={(e) =>
                    onUpdateBackgroundPlan?.({
                      scale: Math.max(0.05, Number(e.target.value)),
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-[#E6E4DD] bg-white font-mono text-xs"
                />
                {onStartTwoPointCalibration && (
                  <button
                    onClick={onStartTwoPointCalibration}
                    className="px-2 py-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                    title="Calibrar usando 2 puntos medidos en el plano"
                  >
                    <Ruler className="w-3 h-3" />
                    <span>Calibrar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Position and rotation */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div>
                <span className="block text-[10px] text-[#737373] mb-0.5">X (m)</span>
                <input
                  type="number"
                  step={0.1}
                  value={bg.xOffsetM ?? 0}
                  onChange={(e) =>
                    onUpdateBackgroundPlan?.({ xOffsetM: Number(e.target.value) })
                  }
                  className="w-full px-1.5 py-1 text-[11px] rounded border border-[#E6E4DD] bg-white font-mono"
                />
              </div>
              <div>
                <span className="block text-[10px] text-[#737373] mb-0.5">Y (m)</span>
                <input
                  type="number"
                  step={0.1}
                  value={bg.yOffsetM ?? 0}
                  onChange={(e) =>
                    onUpdateBackgroundPlan?.({ yOffsetM: Number(e.target.value) })
                  }
                  className="w-full px-1.5 py-1 text-[11px] rounded border border-[#E6E4DD] bg-white font-mono"
                />
              </div>
              <div>
                <span className="block text-[10px] text-[#737373] mb-0.5">Giro (°)</span>
                <input
                  type="number"
                  step={15}
                  value={bg.rotationDeg ?? 0}
                  onChange={(e) =>
                    onUpdateBackgroundPlan?.({ rotationDeg: Number(e.target.value) })
                  }
                  className="w-full px-1.5 py-1 text-[11px] rounded border border-[#E6E4DD] bg-white font-mono"
                />
              </div>
            </div>

            {/* Actions: Reemplazar, Restablecer, Eliminar */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => refBlueprintInputRef.current?.click()}
                className="py-1 px-2 rounded bg-white hover:bg-[#FAF8F5] border border-[#E6E4DD] text-[11px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3 text-[#2563EB]" />
                <span>Reemplazar</span>
              </button>

              {onResetBackgroundPlan && (
                <button
                  onClick={onResetBackgroundPlan}
                  className="py-1 px-2 rounded bg-white hover:bg-[#FAF8F5] border border-[#E6E4DD] text-[11px] text-[#737373] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Restablecer</span>
                </button>
              )}
            </div>

            {onDeleteBackgroundImage && (bg.imageUrl || referenceVisible) && (
              <button
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas eliminar la foto de referencia del plano?')) {
                    onDeleteBackgroundImage();
                  }
                }}
                className="w-full py-1.5 px-2 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-[11px] font-medium text-red-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Eliminar la imagen de referencia del plano"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Eliminar foto de referencia</span>
              </button>
            )}

            <input
              ref={refBlueprintInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const { dataUrl } = await optimizeImageFile(file, 1600, 0.75);
                  onUploadReferenceImage(dataUrl);
                } catch (err) {
                  console.error('Error cargando plano de referencia:', err);
                }
                e.target.value = '';
              }}
            />
          </div>
        )}
      </div>

      {/* 3 Pending Verifications */}
      <div className="space-y-2.5 border-t border-[#E6E4DD] pt-4 text-xs">
        <div className="text-[11px] font-medium text-[#737373]">
          Medidas por verificar en sala
        </div>
        {verifications.map((ver) => (
          <div
            key={ver.id}
            className="p-2.5 rounded bg-white border border-[#E6E4DD] space-y-1.5"
          >
            <div className="font-medium text-[#171717] text-[11px]">
              {ver.title}
            </div>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {ver.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => onResolveVerification(ver.id, opt.value)}
                  className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                    ver.currentValue === opt.value && ver.resolved
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-[#FAF8F5] border-[#E6E4DD] text-[#404040]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
