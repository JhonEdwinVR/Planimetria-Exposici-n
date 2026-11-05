import React, { useRef, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Image as ImageIcon,
  Plus,
  Upload,
  Link2,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Palette,
  Check,
  Compass,
  Sliders,
  FolderPlus,
  Folder,
  FolderOpen,
  PenTool,
  Ruler,
  Maximize2,
  ArrowLeftRight,
} from 'lucide-react';
import { optimizeImageFile } from '../utils/imageOptimization';
import {
  BackgroundPlanSettings,
  FloorPlanElement,
  GraphicResource,
  GraphicResourceCategory,
  LayerState,
  LayerVisibility,
  LibraryImage,
  ViewMode,
  Wall,
  WallItem,
  Zone,
} from '../types/exhibition';
import { GRAPHIC_CATEGORIES } from '../data/graphicLibrary';

interface LeftSidebarProps {
  zones: Zone[];
  walls: Wall[];
  items: WallItem[];
  library: LibraryImage[];
  layers: LayerVisibility;
  layerStates?: LayerState[];
  backgroundPlan?: BackgroundPlanSettings;
  selectedWallId: string | null;
  selectedItemIds: string[];
  viewMode: ViewMode;
  onSelectPlanRoot: () => void;
  onSelectWall: (wallId: string, openElevation?: boolean) => void;
  onSelectItem: (itemId: string, multi?: boolean) => void;
  onToggleZoneExpand: (zoneId: string) => void;
  onToggleZoneVisible: (zoneId: string) => void;
  onToggleZoneLock: (zoneId: string) => void;
  onToggleWallVisible: (wallId: string) => void;
  onToggleWallLock: (wallId: string) => void;
  onToggleItemVisible: (itemId: string) => void;
  onToggleItemLock: (itemId: string) => void;
  onToggleLayer: (layerKey: keyof LayerVisibility) => void;
  onToggleLayerState?: (layerId: string) => void;
  onToggleLayerLock?: (layerId: string) => void;
  onRenameLayer?: (layerId: string, newName: string) => void;
  onDeleteLayer?: (layerId: string) => void;
  onReorderLayer?: (layerId: string, direction: 'up' | 'down') => void;
  onCreateCustomLayer?: (name: string) => void;
  onSelectLayerElements?: (layerId: string) => void;
  onAddLibraryImage: (name: string, dataUrl: string, wCm: number, hCm: number) => void;
  onMountLibraryImageOnWall: (libImg: LibraryImage) => void;
  onCenterZoneInPlan: (zoneId: string) => void;
  selectedZoneIds?: string[];
  onSelectZone?: (zoneId: string, multi?: boolean) => void;
  onMoveZones?: (zoneIds: string[], deltaX: number, deltaY: number) => void;
  onDeleteBackgroundImage?: () => void;
  graphicResources?: GraphicResource[];
  onMountGraphicResourceOnWall?: (res: GraphicResource) => void;
  onPlaceGraphicResourceInPlan?: (res: GraphicResource) => void;
  planElements?: FloorPlanElement[];
  selectedPlanElementId?: string | null;
  onSelectPlanElement?: (id: string | null) => void;
  onTogglePlanElementVisible?: (id: string) => void;
  onDeletePlanElement?: (id: string) => void;

  // Space / Sector Management CRUD
  onCreateZone: (name: string, participant: string, color: string) => void;
  onDeleteZonePrompt: (zone: Zone) => void;
  onRenameZone: (zoneId: string, newName: string) => void;
  onDuplicateZone: (zoneId: string) => void;
  onUpdateZoneColor: (zoneId: string, newColor: string) => void;
  onReorderZone: (zoneId: string, direction: 'up' | 'down') => void;
  onOpenBackgroundPlanModal?: () => void;
  onOpenCreateSpaceModal?: () => void;
  onOpenSpaceAdmin?: (zone: Zone) => void;
  onStartDrawingWall?: (zoneId: string) => void;
  onOpenCreateWallModal?: (zoneId: string) => void;
  onOpenGeneratePerimeterModal?: (zoneId: string) => void;
  onPromptDeleteWall?: (wall: Wall) => void;
  onDeleteItem?: (itemId: string) => void;
  onFlipWallDirection?: (wallId: string) => void;
}

const PRESET_ZONE_COLORS = [
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#DC2626', // Red
  '#0891B2', // Cyan
  '#4F46E5', // Indigo
  '#57534E', // Stone
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  zones,
  walls,
  items,
  library,
  layers,
  layerStates = [],
  backgroundPlan,
  selectedWallId,
  selectedItemIds,
  onSelectWall,
  onSelectItem,
  onToggleZoneExpand,
  onToggleZoneVisible,
  onToggleZoneLock,
  onToggleWallVisible,
  onToggleItemVisible,
  onToggleItemLock,
  onToggleLayerState,
  onToggleLayerLock,
  onRenameLayer,
  onDeleteLayer,
  onReorderLayer,
  onCreateCustomLayer,
  onSelectLayerElements,
  onAddLibraryImage,
  onMountLibraryImageOnWall,
  onCenterZoneInPlan,
  onCreateZone,
  onDeleteZonePrompt,
  onRenameZone,
  onDuplicateZone,
  onUpdateZoneColor,
  onReorderZone,
  onOpenBackgroundPlanModal,
  onOpenCreateSpaceModal,
  onOpenSpaceAdmin,
  onStartDrawingWall,
  onOpenCreateWallModal,
  onOpenGeneratePerimeterModal,
  onPromptDeleteWall,
  onDeleteItem,
  onFlipWallDirection,
  selectedZoneIds = [],
  onSelectZone,
  onMoveZones,
  onDeleteBackgroundImage,
  graphicResources = [],
  onMountGraphicResourceOnWall,
  onPlaceGraphicResourceInPlan,
  planElements = [],
  selectedPlanElementId = null,
  onSelectPlanElement,
  onTogglePlanElementVisible,
  onDeletePlanElement,
}) => {
  const [activeTab, setActiveTab] = useState<'zones' | 'layers' | 'library'>('zones');

  // Sector Menu State
  const [menuZoneId, setMenuZoneId] = useState<string | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingZoneName, setEditingZoneName] = useState('');

  // New Zone Inline Form
  const [showNewZoneForm, setShowNewZoneForm] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneParticipant, setNewZoneParticipant] = useState('');
  const [newZoneColor, setNewZoneColor] = useState('#2563EB');

  // Layer editing
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState('');
  const [newLayerName, setNewLayerName] = useState('');
  const [showNewLayerForm, setShowNewLayerForm] = useState(false);

  // Library state & filters
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryGalleryFilter, setLibraryGalleryFilter] = useState('all');
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<GraphicResourceCategory | 'all'>('all');
  const [urlInput, setUrlInput] = useState('');
  const [urlName, setUrlName] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Handle Sector Renaming
  const handleStartRename = (zone: Zone) => {
    setEditingZoneId(zone.id);
    setEditingZoneName(zone.name);
    setMenuZoneId(null);
  };

  const handleSaveRename = () => {
    if (editingZoneId && editingZoneName.trim()) {
      onRenameZone(editingZoneId, editingZoneName.trim());
    }
    setEditingZoneId(null);
  };

  const handleCreateZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    onCreateZone(
      newZoneName.trim(),
      newZoneParticipant.trim() || 'Participante',
      newZoneColor
    );
    setNewZoneName('');
    setNewZoneParticipant('');
    setShowNewZoneForm(false);
  };

  const handleCreateCustomLayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim() || !onCreateCustomLayer) return;
    onCreateCustomLayer(newLayerName.trim());
    setNewLayerName('');
    setShowNewLayerForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { dataUrl } = await optimizeImageFile(file, 1200, 0.8);
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        onAddLibraryImage(cleanName, dataUrl, 50, 70);
      } catch (err) {
        console.error('Error optimizando imagen de biblioteca:', err);
      }
    }
    e.target.value = '';
  };

  return (
    <aside className="w-64 sm:w-72 bg-[#FAF8F5] border-r border-[#E6E4DD] flex flex-col h-full select-none shrink-0 text-[#171717] transition-all">
      {/* Navigation Sub-Tabs: Sectores | Capas | Biblioteca */}
      <div className="flex items-center border-b border-[#E6E4DD] text-xs font-medium bg-[#F5F3ED]">
        <button
          onClick={() => setActiveTab('zones')}
          className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'zones'
              ? 'bg-[#FAF8F5] text-[#2563EB] font-semibold border-b-2 border-[#2563EB]'
              : 'text-[#737373] hover:text-[#171717]'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Sectores ({zones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'layers'
              ? 'bg-[#FAF8F5] text-[#2563EB] font-semibold border-b-2 border-[#2563EB]'
              : 'text-[#737373] hover:text-[#171717]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Capas</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'library'
              ? 'bg-[#FAF8F5] text-[#2563EB] font-semibold border-b-2 border-[#2563EB]'
              : 'text-[#737373] hover:text-[#171717]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Biblioteca</span>
        </button>
      </div>

      {/* TAB 1: ZONES / SECTORES */}
      {activeTab === 'zones' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header & New Sector Button */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-[#E6E4DD]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
              Gestión de Espacios
            </span>
            <button
              onClick={() => {
                if (onOpenCreateSpaceModal) {
                  onOpenCreateSpaceModal();
                } else {
                  setShowNewZoneForm((v) => !v);
                }
              }}
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Espacio</span>
            </button>
          </div>

          {/* Inline New Sector Form */}
          {showNewZoneForm && (
            <form
              onSubmit={handleCreateZoneSubmit}
              className="p-3 bg-white border-b border-[#E6E4DD] space-y-2.5 text-xs animate-in slide-in-from-top-2 duration-150"
            >
              <div className="font-medium text-[#171717]">Crear nuevo sector</div>
              <input
                type="text"
                placeholder="Nombre (ej. Sector – Marta)"
                value={newZoneName}
                autoFocus
                onChange={(e) => setNewZoneName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[#E6E4DD] bg-[#FAF8F5]"
              />
              <input
                type="text"
                placeholder="Participante / Rol (ej. Marta)"
                value={newZoneParticipant}
                onChange={(e) => setNewZoneParticipant(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[#E6E4DD] bg-[#FAF8F5]"
              />
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-[#737373] mr-1">Color:</span>
                {PRESET_ZONE_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setNewZoneColor(c)}
                    className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                      newZoneColor === c ? 'scale-125 ring-2 ring-[#2563EB]' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewZoneForm(false)}
                  className="px-2.5 py-1 rounded border border-[#E6E4DD] text-[#737373]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newZoneName.trim()}
                  className="px-3 py-1 rounded bg-[#2563EB] text-white font-medium disabled:opacity-40"
                >
                  Crear
                </button>
              </div>
            </form>
          )}

          {/* Multi-Zone Selection Action Banner */}
          {selectedZoneIds.length > 0 && onMoveZones && (
            <div className="mx-2 my-2 p-2 bg-[#2563EB]/10 border border-[#2563EB]/30 rounded text-xs space-y-1.5">
              <div className="flex items-center justify-between font-medium text-[#2563EB]">
                <span>{selectedZoneIds.length} espacios seleccionados</span>
                <button
                  onClick={() => onSelectZone?.('', false)}
                  className="text-[10px] underline hover:text-[#1D4ED8] cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => onMoveZones(selectedZoneIds, -0.2, 0)}
                  className="py-1 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#2563EB]/20 text-[10px] font-mono flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover seleccionados 20cm a la izquierda"
                >
                  ← 20cm
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0.2, 0)}
                  className="py-1 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#2563EB]/20 text-[10px] font-mono flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover seleccionados 20cm a la derecha"
                >
                  → 20cm
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0, -0.2)}
                  className="py-1 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#2563EB]/20 text-[10px] font-mono flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover seleccionados 20cm hacia arriba"
                >
                  ↑ 20cm
                </button>
                <button
                  onClick={() => onMoveZones(selectedZoneIds, 0, 0.2)}
                  className="py-1 px-1 rounded bg-white hover:bg-[#F0EFEA] border border-[#2563EB]/20 text-[10px] font-mono flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Mover seleccionados 20cm hacia abajo"
                >
                  ↓ 20cm
                </button>
              </div>
            </div>
          )}

          {/* Zones List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {zones.map((zone, zIdx) => {
              const zoneWalls = walls.filter(
                (w) =>
                  w.zoneId === zone.id ||
                  (w.secondaryZoneId === zone.id &&
                    !walls.some(
                      (other) =>
                        other.zoneId === zone.id &&
                        (other.id === w.linkedWallId || other.linkedWallId === w.id)
                    ))
              );
              const zoneItems = items.filter((it) => it.zoneId === zone.id);
              const isZoneSelected = selectedZoneIds.includes(zone.id);
              const hasSelectedWall = zoneWalls.some(
                (w) => w.id === selectedWallId
              );

              return (
                <div
                  key={zone.id}
                  className={`rounded-md border transition-all ${
                    isZoneSelected
                      ? 'border-[#2563EB] bg-[#2563EB]/10'
                      : hasSelectedWall
                      ? 'border-[#2563EB]/40 bg-[#2563EB]/5'
                      : 'border-transparent hover:border-[#E6E4DD] hover:bg-white'
                  }`}
                >
                  {/* Zone Header Item */}
                  <div className="flex items-center justify-between px-2.5 py-2 group">
                    {/* Left: Checkbox, Expand, Color & Title */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {onSelectZone && (
                        <input
                          type="checkbox"
                          checked={isZoneSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectZone(zone.id, true);
                          }}
                          className="w-3.5 h-3.5 rounded border-[#E6E4DD] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer shrink-0"
                          title="Seleccionar para mover en grupo"
                        />
                      )}

                      <button
                        onClick={() => onToggleZoneExpand(zone.id)}
                        className="text-[#737373] hover:text-[#171717] cursor-pointer shrink-0"
                      >
                        {zone.expanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: zone.color }}
                      />

                      {editingZoneId === zone.id ? (
                        <input
                          type="text"
                          value={editingZoneName}
                          autoFocus
                          onChange={(e) => setEditingZoneName(e.target.value)}
                          onBlur={handleSaveRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename();
                            if (e.key === 'Escape') setEditingZoneId(null);
                          }}
                          className="text-xs font-medium px-1.5 py-0.5 rounded bg-white border border-[#2563EB] w-full"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            onToggleZoneExpand(zone.id);
                            onCenterZoneInPlan(zone.id);
                          }}
                          onDoubleClick={() => handleStartRename(zone)}
                          className={`text-xs font-medium truncate text-left cursor-pointer flex-1 ${
                            zone.visible ? 'text-[#171717]' : 'text-[#A3A3A3] line-through'
                          }`}
                          title={`${zone.name} (Doble clic para renombrar)`}
                        >
                          {zone.name}
                        </button>
                      )}
                    </div>

                    {/* Right: Works count & 3-dots Context Menu */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <span className="text-[11px] text-[#737373] font-mono tabular-nums">
                        {zoneItems.length}
                      </span>

                      {/* 3-dots Context Menu Button */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuZoneId(menuZoneId === zone.id ? null : zone.id);
                          }}
                          className="p-1 rounded text-[#737373] hover:text-[#171717] hover:bg-[#F0EFEA] cursor-pointer"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {menuZoneId === zone.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setMenuZoneId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-52 bg-white border border-[#E6E4DD] rounded-md shadow-lg py-1.5 z-50 text-xs text-[#171717] space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                              {onOpenSpaceAdmin && (
                                <button
                                  onClick={() => {
                                    setMenuZoneId(null);
                                    onOpenSpaceAdmin(zone);
                                  }}
                                  className="w-full px-3 py-1.5 text-left hover:bg-blue-50 flex items-center gap-2 cursor-pointer font-medium text-[#2563EB]"
                                >
                                  <FolderOpen className="w-3.5 h-3.5" />
                                  <span>Ficha de administración</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleStartRename(zone)}
                                className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#737373]" />
                                <span>Renombrar</span>
                              </button>

                              <button
                                onClick={() => {
                                  setMenuZoneId(null);
                                  onDuplicateZone(zone.id);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-[#737373]" />
                                <span>Duplicar sector</span>
                              </button>

                              <button
                                onClick={() => {
                                  setMenuZoneId(null);
                                  onToggleZoneVisible(zone.id);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                              >
                                {zone.visible ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-[#737373]" />
                                    <span>Ocultar en plano</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                                    <span>Mostrar en plano</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  setMenuZoneId(null);
                                  onToggleZoneLock(zone.id);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                              >
                                {zone.locked ? (
                                  <>
                                    <Unlock className="w-3.5 h-3.5 text-[#737373]" />
                                    <span>Desbloquear</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                                    <span>Bloquear edición</span>
                                  </>
                                )}
                              </button>

                              <div className="px-3 py-1 text-[10px] text-[#737373] uppercase tracking-wider border-t border-[#F0EFEA] mt-1 pt-1">
                                Color identificador
                              </div>
                              <div className="px-3 py-1 flex items-center gap-1.5">
                                {PRESET_ZONE_COLORS.map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => {
                                      onUpdateZoneColor(zone.id, c);
                                      setMenuZoneId(null);
                                    }}
                                    className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                                      zone.color === c ? 'scale-125 ring-2 ring-[#2563EB]' : ''
                                    }`}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>

                              <div className="border-t border-[#F0EFEA] my-1" />

                              {/* Reorder Buttons */}
                              <div className="px-3 py-1 flex items-center justify-between text-[#737373]">
                                <span>Posición</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    disabled={zIdx === 0}
                                    onClick={() => {
                                      onReorderZone(zone.id, 'up');
                                      setMenuZoneId(null);
                                    }}
                                    className="p-1 rounded hover:bg-[#F0EFEA] disabled:opacity-20 cursor-pointer"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    disabled={zIdx === zones.length - 1}
                                    onClick={() => {
                                      onReorderZone(zone.id, 'down');
                                      setMenuZoneId(null);
                                    }}
                                    className="p-1 rounded hover:bg-[#F0EFEA] disabled:opacity-20 cursor-pointer"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="border-t border-[#F0EFEA] my-1" />

                              <button
                                onClick={() => {
                                  setMenuZoneId(null);
                                  onDeleteZonePrompt(zone);
                                }}
                                className="w-full px-3 py-1.5 text-left text-[#DC2626] hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar sector...</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Collapsed Elements: Walls & Items inside this Zone */}
                  {zone.expanded && (
                    <div className="pl-6 pr-2 pb-2 space-y-1 border-t border-[#F0EFEA] pt-1">
                      {zoneWalls.length === 0 ? (
                        <div className="p-2.5 rounded-lg border border-dashed border-[#E6E4DD] dark:border-[#334155] bg-white dark:bg-[#121620] space-y-1.5 text-center my-1">
                          <div className="text-[11px] font-semibold text-[#171717] dark:text-[#F8FAFC]">
                            Sin muros todavía
                          </div>
                          <p className="text-[10px] text-[#737373]">
                            Crea paredes para comenzar a montar la exposición.
                          </p>
                          <div className="grid grid-cols-1 gap-1 pt-1">
                            {onStartDrawingWall && (
                              <button
                                onClick={() => onStartDrawingWall(zone.id)}
                                className="w-full py-1 px-2 rounded border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 text-[10px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <PenTool className="w-3 h-3" />
                                <span>Dibujar en plano</span>
                              </button>
                            )}
                            {onOpenCreateWallModal && (
                              <button
                                onClick={() => onOpenCreateWallModal(zone.id)}
                                className="w-full py-1 px-2 rounded bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-[10px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Ruler className="w-3 h-3" />
                                <span>Con dimensiones</span>
                              </button>
                            )}
                            {onOpenGeneratePerimeterModal && (
                              <button
                                onClick={() => onOpenGeneratePerimeterModal(zone.id)}
                                className="w-full py-1 px-2 rounded border border-[#E6E4DD] hover:bg-[#F0EFEA] text-[10px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>Desde perímetro</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {zoneWalls.map((wall) => {
                            const wallItems = items.filter(
                              (it) => it.wallId === wall.id
                            );
                            const isWallSelected = selectedWallId === wall.id;
                            const dirSymbol =
                              wall.normalSide === 'bottom'
                                ? '↓'
                                : wall.normalSide === 'top'
                                ? '↑'
                                : wall.normalSide === 'left'
                                ? '←'
                                : '→';

                            const linkedWall = walls.find(
                              (w) =>
                                w.id !== wall.id &&
                                (w.id === wall.linkedWallId ||
                                  w.linkedWallId === wall.id ||
                                  (w.startVertexId === wall.startVertexId &&
                                    w.endVertexId === wall.endVertexId))
                            );
                            const otherZoneId =
                              linkedWall?.zoneId ||
                              (wall.secondaryZoneId !== zone.id
                                ? wall.secondaryZoneId
                                : wall.zoneId !== zone.id
                                ? wall.zoneId
                                : undefined);
                            const otherZone = otherZoneId
                              ? zones.find((z) => z.id === otherZoneId)
                              : undefined;

                            return (
                              <div key={`${zone.id}-${wall.id}`} className="space-y-0.5">
                                <div
                                  className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-colors group cursor-pointer ${
                                    isWallSelected
                                      ? 'bg-[#2563EB] text-white font-medium'
                                      : 'text-[#404040] hover:bg-[#F0EFEA]'
                                  }`}
                                >
                                  <button
                                    onClick={() => onSelectWall(wall.id, false)}
                                    onDoubleClick={() => onSelectWall(wall.id, true)}
                                    className="truncate flex-1 text-left cursor-pointer"
                                    title={`${wall.name} · Participante: ${wall.participant} (Doble clic para abrir elevación)`}
                                  >
                                    <span>{wall.name}</span>
                                    {wall.participant &&
                                      wall.participant !== zone.participant && (
                                        <span
                                          className={`ml-1 text-[10px] ${
                                            isWallSelected
                                              ? 'text-blue-100'
                                              : 'text-[#2563EB]'
                                          }`}
                                        >
                                          ({wall.participant})
                                        </span>
                                      )}
                                  </button>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {(linkedWall || otherZone) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (linkedWall) {
                                            onSelectWall(linkedWall.id, false);
                                          } else {
                                            onSelectWall(wall.id, false);
                                          }
                                        }}
                                        title={`Muro de doble cara compartido con ${otherZone?.name || linkedWall?.participant || 'otra sección'}. Clic para ver la otra cara.`}
                                        className={`px-1 py-0.5 rounded text-[9px] font-semibold flex items-center gap-0.5 cursor-pointer ${
                                          isWallSelected
                                            ? 'bg-blue-800 text-blue-100 hover:bg-blue-900'
                                            : 'bg-blue-50 text-[#2563EB] border border-blue-200 hover:bg-blue-100'
                                        }`}
                                      >
                                        <ArrowLeftRight className="w-2.5 h-2.5" />
                                        <span>2C</span>
                                      </button>
                                    )}

                                    <span
                                      className={`text-[10px] tabular-nums ${
                                        isWallSelected ? 'text-blue-100' : 'text-[#737373]'
                                      }`}
                                    >
                                      {wall.lengthM.toFixed(2)}m
                                    </span>

                                    {wall.thicknessCm > 0 && onFlipWallDirection && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onFlipWallDirection(wall.id);
                                        }}
                                        title={`Dirección obras: ${dirSymbol} (Clic para invertir cara ⇄)`}
                                        className={`px-1 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                          isWallSelected
                                            ? 'bg-blue-700 text-white hover:bg-blue-800'
                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        }`}
                                      >
                                        {dirSymbol}
                                      </button>
                                    )}

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleWallVisible(wall.id);
                                      }}
                                      title={
                                        wall.visible ? 'Ocultar muro' : 'Mostrar muro'
                                      }
                                      className="p-0.5 cursor-pointer"
                                    >
                                      {wall.visible ? (
                                        <Eye className="w-3 h-3" />
                                      ) : (
                                        <EyeOff className="w-3 h-3" />
                                      )}
                                    </button>

                                    {onPromptDeleteWall && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onPromptDeleteWall(wall);
                                        }}
                                        title="Eliminar este muro"
                                        className={`p-0.5 rounded cursor-pointer transition-colors ${
                                          isWallSelected
                                            ? 'text-red-200 hover:text-white hover:bg-red-600'
                                            : 'text-[#A3A3A3] hover:text-red-600 hover:bg-red-50'
                                        }`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Sub-badge when double-sided */}
                                {(linkedWall || otherZone) && (
                                  <div className="pl-2.5 pr-1 py-0.5 flex items-center justify-between text-[10px] text-[#2563EB] bg-blue-50/60 rounded ml-1.5">
                                    <span className="truncate">
                                      ⇄ Doble cara con:{' '}
                                      <strong>
                                        {otherZone?.name || linkedWall?.participant}
                                      </strong>
                                    </span>
                                    {linkedWall && (
                                      <button
                                        onClick={() => onSelectWall(linkedWall.id, false)}
                                        className="underline font-semibold ml-1 shrink-0 cursor-pointer hover:text-[#1D4ED8]"
                                      >
                                        Ver otra cara
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Mounted elements in wall */}
                                {wallItems.length > 0 && (
                                  <div className="pl-2.5 space-y-0.5 border-l border-[#E6E4DD] ml-1.5">
                                    {wallItems.map((item) => {
                                      const isSel = selectedItemIds.includes(item.id);
                                      return (
                                        <div
                                          key={item.id}
                                          className={`flex items-center justify-between px-2 py-0.5 rounded text-[11px] group/item ${
                                            isSel
                                              ? 'bg-[#2563EB]/10 text-[#2563EB] font-medium'
                                              : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAF8F5]'
                                          }`}
                                        >
                                          <button
                                            onClick={(e) =>
                                              onSelectItem(item.id, e.shiftKey || e.metaKey)
                                            }
                                            className="truncate flex-1 text-left cursor-pointer"
                                            title={`${item.name} (${item.widthCm}×${item.heightCm} cm)`}
                                          >
                                            {item.name}
                                          </button>
                                          <div className="flex items-center gap-1 shrink-0 ml-1">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleItemVisible(item.id);
                                              }}
                                              title={item.visible ? 'Ocultar elemento' : 'Mostrar elemento'}
                                              className="cursor-pointer text-[#737373] hover:text-[#171717]"
                                            >
                                              {item.visible ? (
                                                <Eye className="w-2.5 h-2.5" />
                                              ) : (
                                                <EyeOff className="w-2.5 h-2.5" />
                                              )}
                                            </button>
                                            {onDeleteItem && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onDeleteItem(item.id);
                                                }}
                                                title="Eliminar este elemento"
                                                className="cursor-pointer text-[#A3A3A3] hover:text-red-600 p-0.5 rounded hover:bg-red-50"
                                              >
                                                <Trash2 className="w-2.5 h-2.5" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Floor Plan Elements (Tables, Decorative Squares, Shelves, Decor) in this Zone */}
                          {(() => {
                            const zonePlanElems = planElements.filter(
                              (pe) => pe.zoneId === zone.id
                            );
                            if (zonePlanElems.length === 0) return null;
                            return (
                              <div className="pt-1.5 mt-1 border-t border-dashed border-[#E6E4DD] space-y-0.5">
                                <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                                  Mobiliario y decoración en planta ({zonePlanElems.length})
                                </div>
                                {zonePlanElems.map((pe) => {
                                  const isPeSel = selectedPlanElementId === pe.id;
                                  return (
                                    <div
                                      key={pe.id}
                                      className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                                        isPeSel
                                          ? 'bg-[#2563EB] text-white font-medium'
                                          : 'text-[#404040] hover:bg-[#F0EFEA]'
                                      }`}
                                    >
                                      <button
                                        onClick={() => onSelectPlanElement?.(pe.id)}
                                        className="truncate flex-1 text-left cursor-pointer text-[11px]"
                                        title={`${pe.name} (${pe.widthCm}×${pe.depthCm} cm)`}
                                      >
                                        <span>▣ {pe.name}</span>
                                      </button>
                                      <div className="flex items-center gap-1 shrink-0 ml-1">
                                        <span
                                          className={`text-[10px] font-mono ${
                                            isPeSel ? 'text-blue-100' : 'text-[#737373]'
                                          }`}
                                        >
                                          {(pe.widthCm / 100).toFixed(2)}×{(pe.depthCm / 100).toFixed(2)}m
                                        </span>
                                        {onTogglePlanElementVisible && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onTogglePlanElementVisible(pe.id);
                                            }}
                                            title={pe.visible ? 'Ocultar elemento' : 'Mostrar elemento'}
                                            className="p-0.5 cursor-pointer"
                                          >
                                            {pe.visible ? (
                                              <Eye className="w-3 h-3" />
                                            ) : (
                                              <EyeOff className="w-3 h-3" />
                                            )}
                                          </button>
                                        )}
                                        {onDeletePlanElement && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeletePlanElement(pe.id);
                                            }}
                                            title="Eliminar elemento de la planta"
                                            className={`p-0.5 rounded cursor-pointer ${
                                              isPeSel
                                                ? 'text-red-200 hover:text-white hover:bg-red-600'
                                                : 'text-[#A3A3A3] hover:text-red-600 hover:bg-red-50'
                                            }`}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          {/* Permanent + Añadir muro a este espacio */}
                          {onOpenCreateWallModal && (
                            <button
                              onClick={() => onOpenCreateWallModal(zone.id)}
                              className="w-full py-1.5 px-2 rounded border border-dashed border-[#E6E4DD] hover:border-[#2563EB] text-[10px] text-[#2563EB] font-medium flex items-center justify-center gap-1 mt-1 cursor-pointer hover:bg-blue-50/50"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Añadir muro a este espacio</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: REORGANIZED LAYERS (9 Base + Custom) */}
      {activeTab === 'layers' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[#E6E4DD]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
              Capas del Proyecto
            </span>
            <button
              onClick={() => setShowNewLayerForm((v) => !v)}
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva capa</span>
            </button>
          </div>

          {/* New Custom Layer Inline Form */}
          {showNewLayerForm && (
            <form
              onSubmit={handleCreateCustomLayerSubmit}
              className="p-3 bg-white border-b border-[#E6E4DD] space-y-2 text-xs"
            >
              <div className="font-medium text-[#171717]">Nueva capa personalizada</div>
              <input
                type="text"
                placeholder="Nombre de la capa..."
                value={newLayerName}
                autoFocus
                onChange={(e) => setNewLayerName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-[#E6E4DD] bg-[#FAF8F5]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewLayerForm(false)}
                  className="px-2 py-1 rounded border border-[#E6E4DD] text-[#737373]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newLayerName.trim()}
                  className="px-3 py-1 rounded bg-[#2563EB] text-white font-medium disabled:opacity-40"
                >
                  Añadir
                </button>
              </div>
            </form>
          )}

          {/* Layer Quick Action: Background Plan Settings */}
          {onOpenBackgroundPlanModal && (
            <div className="px-3 py-2 border-b border-[#E6E4DD] bg-[#F5F3ED]">
              <button
                onClick={onOpenBackgroundPlanModal}
                className="w-full py-1.5 px-2.5 rounded bg-white hover:bg-[#FAF8F5] border border-[#E6E4DD] text-xs font-medium text-[#171717] flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Calibrar Plano Original</span>
                </div>
                <span className="text-[10px] text-[#737373] font-mono">
                  {Math.round((backgroundPlan?.opacity ?? 0.35) * 100)}%
                </span>
              </button>
            </div>
          )}

          {/* Layer Rows */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {layerStates.map((layer, lIdx) => (
              <div
                key={layer.id}
                className="p-2 rounded border border-[#E6E4DD] bg-white hover:border-[#2563EB] transition-colors flex items-center justify-between gap-2 text-xs"
              >
                {/* Visibility Toggle & Layer Name */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    onClick={() => onToggleLayerState?.(layer.id)}
                    className="p-0.5 text-[#737373] hover:text-[#171717] cursor-pointer shrink-0"
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-[#A3A3A3]" />
                    )}
                  </button>

                  {editingLayerId === layer.id ? (
                    <input
                      type="text"
                      value={editingLayerName}
                      autoFocus
                      onChange={(e) => setEditingLayerName(e.target.value)}
                      onBlur={() => {
                        if (editingLayerName.trim() && onRenameLayer) {
                          onRenameLayer(layer.id, editingLayerName.trim());
                        }
                        setEditingLayerId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editingLayerName.trim() && onRenameLayer) {
                            onRenameLayer(layer.id, editingLayerName.trim());
                          }
                          setEditingLayerId(null);
                        }
                        if (e.key === 'Escape') setEditingLayerId(null);
                      }}
                      className="text-xs px-1 py-0.5 rounded border border-[#2563EB] w-full"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => {
                        setEditingLayerId(layer.id);
                        setEditingLayerName(layer.name);
                      }}
                      title="Doble clic para renombrar capa"
                      className={`truncate cursor-pointer font-medium ${
                        layer.visible ? 'text-[#171717]' : 'text-[#737373] line-through'
                      }`}
                    >
                      {layer.name}
                    </span>
                  )}
                </div>

                {/* Right controls: Select, Lock, Reorder, Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  {onSelectLayerElements && (
                    <button
                      onClick={() => onSelectLayerElements(layer.id)}
                      title="Seleccionar todos los elementos de esta capa"
                      className="text-[10px] px-1 py-0.5 rounded text-[#737373] hover:text-[#2563EB] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Sel.
                    </button>
                  )}

                  <button
                    onClick={() => onToggleLayerLock?.(layer.id)}
                    title={layer.locked ? 'Desbloquear capa' : 'Bloquear capa'}
                    className="p-1 rounded text-[#737373] hover:text-[#171717] cursor-pointer"
                  >
                    {layer.locked ? (
                      <Lock className="w-3 h-3 text-[#2563EB]" />
                    ) : (
                      <Unlock className="w-3 h-3 opacity-40 hover:opacity-100" />
                    )}
                  </button>

                  {/* Reorder Buttons */}
                  {onReorderLayer && (
                    <div className="flex items-center">
                      <button
                        disabled={lIdx === 0}
                        onClick={() => onReorderLayer(layer.id, 'up')}
                        className="p-0.5 text-[#737373] hover:text-[#171717] disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                      </button>
                      <button
                        disabled={lIdx === layerStates.length - 1}
                        onClick={() => onReorderLayer(layer.id, 'down')}
                        className="p-0.5 text-[#737373] hover:text-[#171717] disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  {/* Delete button: for backgroundPlan if reference image exists, or for custom non-structural layers */}
                  {layer.id === 'backgroundPlan' && onDeleteBackgroundImage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('¿Seguro que deseas eliminar la foto de referencia del plano?')) {
                          onDeleteBackgroundImage();
                        }
                      }}
                      title="Eliminar foto de referencia del plano"
                      className="p-1 rounded text-[#DC2626] hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  )}

                  {!layer.isStructural && onDeleteLayer && (
                    <button
                      onClick={() => onDeleteLayer(layer.id)}
                      title="Eliminar capa personalizada"
                      className="p-1 rounded text-[#DC2626] hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT LIBRARY & GRAPHIC GALLERIES */}
      {activeTab === 'library' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-[#E6E4DD]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] block">
                Biblioteca y Galerías
              </span>
              <span className="text-[10px] text-[#737373]">
                {graphicResources.length + library.length} recursos disponibles
              </span>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Cargar</span>
            </button>
          </div>

          {/* Filters: Gallery Selector + Search */}
          <div className="p-3 border-b border-[#E6E4DD] space-y-2 bg-[#FAF8F5]">
            {/* Gallery Dropdown */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#737373] mb-1">
                Galería / Colección
              </label>
              <select
                value={libraryGalleryFilter}
                onChange={(e) => setLibraryGalleryFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded bg-white border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="all">Todas las galerías ({graphicResources.length + library.length})</option>
                <option value="user-library">Mis imágenes del proyecto ({library.length})</option>
                {Array.from(new Set(graphicResources.map((r) => r.galleryName || 'Galería Spaguetty House'))).map(
                  (gName) => {
                    const count = graphicResources.filter(
                      (r) => (r.galleryName || 'Galería Spaguetty House') === gName
                    ).length;
                    return (
                      <option key={gName} value={gName}>
                        {gName} ({count})
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Buscar mesa, cuadrado, repisa, planta..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              className="w-full px-2.5 py-1 text-xs rounded bg-white border border-[#E6E4DD] focus:outline-none focus:border-[#2563EB]"
            />

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5">
              <button
                onClick={() => setLibraryCategoryFilter('all')}
                className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap cursor-pointer ${
                  libraryCategoryFilter === 'all'
                    ? 'bg-[#2563EB] text-white font-semibold'
                    : 'bg-white border border-[#E6E4DD] text-[#737373] hover:text-[#171717]'
                }`}
              >
                Todos
              </button>
              {GRAPHIC_CATEGORIES.map((cat) => {
                const count = graphicResources.filter((r) => r.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setLibraryCategoryFilter(cat.id)}
                    className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap cursor-pointer ${
                      libraryCategoryFilter === cat.id
                        ? 'bg-[#2563EB] text-white font-semibold'
                        : 'bg-white border border-[#E6E4DD] text-[#737373] hover:text-[#171717]'
                    }`}
                  >
                    {cat.shortName} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Combined Resources Grid */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(() => {
              const q = librarySearch.toLowerCase().trim();

              // Filter graphic resources
              const filteredGraphics = (
                libraryGalleryFilter === 'user-library' ? [] : graphicResources
              ).filter((res) => {
                const gName = res.galleryName || 'Galería Spaguetty House';
                const matchesGal =
                  libraryGalleryFilter === 'all' || libraryGalleryFilter === gName;
                const matchesCat =
                  libraryCategoryFilter === 'all' || res.category === libraryCategoryFilter;
                const matchesQ =
                  !q ||
                  res.name.toLowerCase().includes(q) ||
                  gName.toLowerCase().includes(q) ||
                  res.category.toLowerCase().includes(q) ||
                  res.tags?.some((t) => t.toLowerCase().includes(q));
                return matchesGal && matchesCat && matchesQ;
              });

              // Filter user library images
              const filteredUserLib = (
                (libraryGalleryFilter !== 'all' && libraryGalleryFilter !== 'user-library') ||
                (libraryCategoryFilter !== 'all' && libraryCategoryFilter !== 'artworks')
                  ? []
                  : library
              ).filter((img) => !q || img.name.toLowerCase().includes(q));

              const totalCount = filteredGraphics.length + filteredUserLib.length;

              if (totalCount === 0) {
                return (
                  <div className="py-8 text-center text-xs text-[#737373] space-y-1">
                    <p>No se encontraron elementos en esta categoría o búsqueda.</p>
                    <p className="text-[11px]">Puedes cargar imágenes adicionales con el botón superior.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 gap-2">
                  {/* Graphic Resources Cards */}
                  {filteredGraphics.map((res) => (
                    <div
                      key={res.id}
                      className="border border-[#E6E4DD] rounded bg-white hover:border-[#2563EB] p-2 flex flex-col justify-between group text-xs shadow-2xs"
                    >
                      <div className="aspect-4/3 bg-[#FAF8F5] rounded overflow-hidden flex items-center justify-center mb-1.5 p-1 relative">
                        <img
                          src={res.planSvgUrl || res.previewUrl}
                          alt={res.name}
                          className="max-h-full max-w-full object-contain pointer-events-none"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-medium text-[#171717] line-clamp-2 leading-tight text-[11px]" title={res.name}>
                          {res.name}
                        </div>
                        <div className="text-[10px] text-[#737373] font-mono">
                          {res.defaultWidthCm} × {res.defaultDepthCm || res.defaultHeightCm} cm
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1">
                        {onPlaceGraphicResourceInPlan && (
                          <button
                            onClick={() => onPlaceGraphicResourceInPlan(res)}
                            className="flex-1 py-1 px-1 text-[10px] bg-[#2563EB] text-white rounded font-semibold hover:bg-[#1D4ED8] cursor-pointer transition-colors"
                            title="Colocar libremente en el plano 2D"
                          >
                            + Planta
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (onMountGraphicResourceOnWall) {
                              onMountGraphicResourceOnWall(res);
                            } else {
                              onMountLibraryImageOnWall({
                                id: res.id,
                                name: res.name,
                                participant: res.category,
                                dataUrl: res.fileDataUrl || res.previewUrl,
                                defaultWidthCm: res.defaultWidthCm,
                                defaultHeightCm: res.defaultHeightCm,
                                createdAt: res.createdAt,
                              });
                            }
                          }}
                          className={`${
                            onPlaceGraphicResourceInPlan
                              ? 'py-1 px-1.5 bg-[#FAF8F5] hover:bg-[#F0EFEA] text-[#171717] border border-[#E6E4DD]'
                              : 'w-full py-1 bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                          } text-[10px] rounded font-medium cursor-pointer transition-colors`}
                          title="Montar en el muro seleccionado (Elevación)"
                        >
                          {onPlaceGraphicResourceInPlan ? 'Muro' : 'Montar en muro'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* User Library Cards */}
                  {filteredUserLib.map((libImg) => (
                    <div
                      key={libImg.id}
                      className="border border-[#E6E4DD] rounded bg-white hover:border-[#2563EB] p-2 flex flex-col justify-between group text-xs shadow-2xs"
                    >
                      <div className="aspect-4/3 bg-[#FAF8F5] rounded overflow-hidden flex items-center justify-center mb-1.5 p-1">
                        <img
                          src={libImg.dataUrl}
                          alt={libImg.name}
                          className="max-h-full max-w-full object-contain pointer-events-none"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-medium text-[#171717] truncate text-[11px]" title={libImg.name}>
                          {libImg.name}
                        </div>
                        <div className="text-[9px] text-[#059669] truncate">
                          Mis imágenes
                        </div>
                        <div className="text-[10px] text-[#737373] font-mono">
                          {libImg.defaultWidthCm} × {libImg.defaultHeightCm} cm
                        </div>
                      </div>
                      <button
                        onClick={() => onMountLibraryImageOnWall(libImg)}
                        className="mt-1.5 w-full py-1 text-[10px] bg-[#2563EB] text-white rounded font-medium hover:bg-[#1D4ED8] cursor-pointer transition-colors"
                      >
                        Montar en muro
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}
    </aside>
  );
};
