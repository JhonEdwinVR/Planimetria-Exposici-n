/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Folder,
  Ruler,
  Maximize2,
  PenTool,
  Plus,
  Trash2,
  Copy,
  Scissors,
  ExternalLink,
  Edit2,
  Image as ImageIcon,
  ArrowRightLeft,
  X,
  Eye,
  Check,
  FolderOpen,
  DoorOpen,
  ArrowRight,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Wall, WallItem, Zone } from '../types/exhibition';
import { getLinkedWall } from '../utils/wallHelpers';

interface SpaceAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: Zone | null;
  allZones: Zone[];
  walls: Wall[];
  items: WallItem[];
  onOpenElevation: (wallId: string) => void;
  onSelectWall: (wallId: string) => void;
  onStartDrawingWall: (zoneId: string) => void;
  onOpenCreateWallModal: (zoneId: string) => void;
  onOpenGeneratePerimeterModal: (zoneId: string) => void;
  onDuplicateWall: (wallId: string) => void;
  onSplitWall: (wallId: string) => void;
  onPromptDeleteWall: (wall: Wall) => void;
  onUpdateZone: (zoneId: string, patch: Partial<Zone>) => void;
  onOpenAssignArtworkModal: (item: WallItem) => void;
  onReassignWallZone: (wallId: string, targetZoneId: string) => void;
  onReassignMultipleWalls?: (wallIds: string[], targetZoneId: string) => void;
  onFlipWallDirection?: (wallId: string) => void;
  onCreateOppositeWallFace?: (wallId: string, targetZoneId: string) => void;
  onUpdateWall?: (wallId: string, patch: Partial<Wall>) => void;
  onDeleteItem?: (itemId: string) => void;
}

export const SpaceAdminModal: React.FC<SpaceAdminModalProps> = ({
  isOpen,
  onClose,
  zone,
  allZones = [],
  walls,
  items,
  onOpenElevation,
  onSelectWall,
  onStartDrawingWall,
  onOpenCreateWallModal,
  onOpenGeneratePerimeterModal,
  onDuplicateWall,
  onSplitWall,
  onPromptDeleteWall,
  onUpdateZone,
  onOpenAssignArtworkModal,
  onReassignWallZone,
  onReassignMultipleWalls,
  onFlipWallDirection,
  onCreateOppositeWallFace,
  onUpdateWall,
  onDeleteItem,
}) => {
  const [activeTab, setActiveTab] = useState<'walls' | 'items' | 'summary'>('walls');
  const [wallFilter, setWallFilter] = useState<'all' | 'vanos' | 'with_art'>('all');
  const [selectedWallIds, setSelectedWallIds] = useState<string[]>([]);
  const [batchTargetZoneId, setBatchTargetZoneId] = useState<string>('');
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [descVal, setDescVal] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  React.useEffect(() => {
    if (zone) {
      setNameVal(zone.name);
      setDescVal(zone.description || '');
      setSelectedWallIds([]);
    }
  }, [zone]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  if (!isOpen || !zone) return null;

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
  const zoneWallIds = new Set(zoneWalls.map((w) => w.id));
  const assignedItems = items.filter((it) => it.wallId !== 'unassigned' && zoneWallIds.has(it.wallId));
  const unassignedItems = items.filter(
    (it) => it.zoneId === zone.id && (it.wallId === 'unassigned' || !it.wallId)
  );

  const totalLengthM = zoneWalls.reduce((sum, w) => sum + w.lengthM, 0);

  const otherZones = allZones.filter((z) => z.id !== zone.id);

  // Filtered walls
  const filteredWalls = zoneWalls.filter((w) => {
    const isVano = w.thicknessCm === 0 || w.name.toLowerCase().includes('vano') || w.name.toLowerCase().includes('acceso');
    const wallItems = items.filter((it) => it.wallId === w.id);
    if (wallFilter === 'vanos') return isVano;
    if (wallFilter === 'with_art') return wallItems.length > 0;
    return true;
  });

  const vanosCount = zoneWalls.filter(
    (w) => w.thicknessCm === 0 || w.name.toLowerCase().includes('vano') || w.name.toLowerCase().includes('acceso')
  ).length;

  const handleSaveInfo = () => {
    if (nameVal.trim()) {
      onUpdateZone(zone.id, {
        name: nameVal.trim(),
        participant: nameVal.trim(),
        description: descVal.trim(),
      });
      setEditingName(false);
      showToast('Información del espacio guardada');
    }
  };

  const handleTransferSingle = (wallId: string, targetZoneId: string) => {
    const target = allZones.find((z) => z.id === targetZoneId);
    if (!target) return;
    onReassignWallZone(wallId, targetZoneId);
    showToast(`Muro transferido a «${target.name}» correctamente`);
  };

  const handleBatchTransfer = () => {
    if (selectedWallIds.length === 0 || !batchTargetZoneId) return;
    const target = allZones.find((z) => z.id === batchTargetZoneId);
    if (!target) return;

    if (onReassignMultipleWalls) {
      onReassignMultipleWalls(selectedWallIds, batchTargetZoneId);
    } else {
      selectedWallIds.forEach((wId) => onReassignWallZone(wId, batchTargetZoneId));
    }

    showToast(`${selectedWallIds.length} muro(s) transferido(s) a «${target.name}»`);
    setSelectedWallIds([]);
    setBatchTargetZoneId('');
  };

  const toggleSelectWall = (wId: string) => {
    setSelectedWallIds((prev) =>
      prev.includes(wId) ? prev.filter((id) => id !== wId) : [...prev, wId]
    );
  };

  const selectAllFiltered = () => {
    if (selectedWallIds.length === filteredWalls.length) {
      setSelectedWallIds([]);
    } else {
      setSelectedWallIds(filteredWalls.map((w) => w.id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-xl bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EFEA] dark:border-[#2D3748] bg-[#FAF8F5] dark:bg-[#121620]">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full shadow-xs shrink-0 ring-2 ring-white dark:ring-gray-800"
              style={{ backgroundColor: zone.color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#171717] dark:text-[#F8FAFC]">
                  {zone.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#2563EB] dark:bg-blue-900/40 dark:text-blue-300">
                  {zoneWalls.length} muros · {assignedItems.length} obras
                </span>
                {vanosCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {vanosCount} vano(s) de acceso
                  </span>
                )}
              </div>
              <p className="text-xs text-[#737373] dark:text-[#94A3B8] mt-0.5 line-clamp-1">
                {zone.description || 'Espacio museográfico activo en Spaguetty House'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] dark:hover:text-white hover:bg-[#F0EFEA] dark:hover:bg-[#252D3D] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-100">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#E6E4DD] dark:border-[#2D3748] bg-[#F5F3ED] dark:bg-[#181D28] text-xs font-medium">
          <button
            onClick={() => setActiveTab('walls')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'walls'
                ? 'bg-white dark:bg-[#1A1F2C] text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                : 'text-[#737373] hover:text-[#171717]'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>Muros y Vanos de Acceso ({zoneWalls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'items'
                ? 'bg-white dark:bg-[#1A1F2C] text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                : 'text-[#737373] hover:text-[#171717]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Obras y Montaje ({assignedItems.length + unassignedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-[#1A1F2C] text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                : 'text-[#737373] hover:text-[#171717]'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Resumen del Espacio</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: WALLS & PASSAGE SPANS */}
          {activeTab === 'walls' && (
            <div className="space-y-4">
              {/* Permanent Action Bar for Adding Walls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0EFEA] dark:border-[#2D3748]">
                <div>
                  <h4 className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC]">
                    Paredes y vanos de este espacio
                  </h4>
                  <p className="text-[11px] text-[#737373] dark:text-[#94A3B8]">
                    {zoneWalls.length} elementos · {totalLengthM.toFixed(2)} m lineales totales
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onStartDrawingWall(zone.id);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-medium flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Dibujar segmento libremente en el plano"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Dibujar en plano</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateWallModal(zone.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Crear pared con medidas numéricas"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir muro</span>
                  </button>
                </div>
              </div>

              {/* Sub-Filters: Todos, Vanos de acceso, Con obras */}
              {zoneWalls.length > 0 && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setWallFilter('all')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                        wallFilter === 'all'
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#FAF8F5] text-[#737373] hover:text-[#171717] border border-[#E6E4DD]'
                      }`}
                    >
                      Todos ({zoneWalls.length})
                    </button>
                    {vanosCount > 0 && (
                      <button
                        onClick={() => setWallFilter('vanos')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                          wallFilter === 'vanos'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <DoorOpen className="w-3 h-3" />
                        <span>Vanos de acceso ({vanosCount})</span>
                      </button>
                    )}
                    <button
                      onClick={() => setWallFilter('with_art')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                        wallFilter === 'with_art'
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#FAF8F5] text-[#737373] hover:text-[#171717] border border-[#E6E4DD]'
                      }`}
                    >
                      Con obras montadas
                    </button>
                  </div>

                  {filteredWalls.length > 0 && (
                    <button
                      onClick={selectAllFiltered}
                      className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {selectedWallIds.length === filteredWalls.length ? (
                        <CheckSquare className="w-3.5 h-3.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {selectedWallIds.length === filteredWalls.length
                          ? 'Deseleccionar todos'
                          : 'Seleccionar todos'}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Batch Action Bar if any walls selected */}
              {selectedWallIds.length > 0 && otherZones.length > 0 && (
                <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC]">
                      {selectedWallIds.length} muro(s) seleccionado(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#525252]">Pasar a espacio:</span>
                    <select
                      value={batchTargetZoneId}
                      onChange={(e) => setBatchTargetZoneId(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-[#E6E4DD] bg-white font-medium"
                    >
                      <option value="">Selecciona espacio destino...</option>
                      {otherZones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.participant})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleBatchTransfer}
                      disabled={!batchTargetZoneId}
                      className="px-3 py-1 text-xs rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Transferir</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state if 0 walls */}
              {zoneWalls.length === 0 ? (
                <div className="py-8 px-6 rounded-xl border-2 border-dashed border-[#E6E4DD] dark:border-[#334155] text-center space-y-4 bg-[#FAF8F5]/50 dark:bg-[#151922]">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] flex items-center justify-center">
                    <Ruler className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#171717] dark:text-[#F8FAFC]">
                      Este espacio todavía no tiene muros ni vanos asignados
                    </h4>
                    <p className="text-xs text-[#737373] dark:text-[#94A3B8] max-w-md mx-auto mt-1 leading-relaxed">
                      Crea las paredes o pasa muros/vanos de acceso desde otro espacio para comenzar a organizar la exposición.
                    </p>
                  </div>

                  {/* 3 Prominent Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onStartDrawingWall(zone.id);
                      }}
                      className="p-3.5 rounded-xl border border-[#2563EB] bg-blue-50/50 hover:bg-blue-50 text-[#2563EB] text-left space-y-1 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <PenTool className="w-4 h-4" />
                        <span>Dibujar en plano</span>
                      </div>
                      <p className="text-[11px] text-[#525252] leading-tight">
                        Haz clic en el plano para definir punto inicial y final.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenCreateWallModal(zone.id);
                      }}
                      className="p-3.5 rounded-xl border border-[#2563EB] bg-blue-50/50 hover:bg-blue-50 text-[#2563EB] text-left space-y-1 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Ruler className="w-4 h-4" />
                        <span>Con dimensiones</span>
                      </div>
                      <p className="text-[11px] text-[#525252] leading-tight">
                        Introduce longitud, altura y orientación numérica.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenGeneratePerimeterModal(zone.id);
                      }}
                      className="p-3.5 rounded-xl border border-[#2563EB] bg-blue-50/50 hover:bg-blue-50 text-[#2563EB] text-left space-y-1 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Maximize2 className="w-4 h-4" />
                        <span>Desde perímetro</span>
                      </div>
                      <p className="text-[11px] text-[#525252] leading-tight">
                        Genera una sala completa rectangular con 4 muros.
                      </p>
                    </button>
                  </div>
                </div>
              ) : (
                /* Walls List */
                <div className="space-y-3">
                  {filteredWalls.map((wall, idx) => {
                    const wallItems = items.filter((it) => it.wallId === wall.id);
                    const isVano = wall.thicknessCm === 0 || wall.name.toLowerCase().includes('vano') || wall.name.toLowerCase().includes('acceso');
                    const isSelected = selectedWallIds.includes(wall.id);

                    const linkedWall = getLinkedWall(wall, walls);
                    const otherZoneId =
                      linkedWall?.zoneId ||
                      (wall.secondaryZoneId !== zone.id
                        ? wall.secondaryZoneId
                        : wall.zoneId !== zone.id
                        ? wall.zoneId
                        : undefined);
                    const otherZone = otherZoneId
                      ? allZones.find((z) => z.id === otherZoneId)
                      : undefined;

                    return (
                      <div
                        key={`${zone.id}-${wall.id}`}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-[#2563EB] bg-blue-50/30 dark:bg-blue-900/20 shadow-xs'
                            : isVano
                            ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                            : 'border-[#E6E4DD] dark:border-[#2D3748] hover:border-[#2563EB]/60 bg-[#FAF8F5] dark:bg-[#121620]'
                        }`}
                      >
                        {/* Top row: Checkbox, Name, Badges, Dimension, Actions */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectWall(wall.id)}
                              className="rounded border-[#E6E4DD] text-[#2563EB] accent-[#2563EB] cursor-pointer"
                            />

                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC] truncate">
                                  {wall.name}
                                </h5>

                                {isVano && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center gap-1">
                                    <DoorOpen className="w-3 h-3" />
                                    <span>Vano de acceso</span>
                                  </span>
                                )}

                                {(linkedWall || otherZone) && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-[#2563EB] flex items-center gap-1">
                                    <ArrowRightLeft className="w-3 h-3" />
                                    <span>
                                      Doble cara: {otherZone?.name || linkedWall?.participant}
                                    </span>
                                  </span>
                                )}

                                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[#737373] font-mono">
                                  {wall.lengthM.toFixed(2)} m {wall.thicknessCm > 0 ? `× ${wall.heightM.toFixed(2)} m` : ''}
                                </span>
                              </div>

                              <div className="text-[11px] text-[#737373] dark:text-[#94A3B8] flex items-center gap-2 mt-0.5">
                                <span>Participante: <strong className="text-[#171717] dark:text-[#F8FAFC]">{wall.participant}</strong></span>
                                <span>·</span>
                                <span>{wallItems.length} obras montadas</span>
                                <span>·</span>
                                <span className="capitalize">{wall.material}</span>
                                <span>·</span>
                                <span className="capitalize">{wall.orientation}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Wall Action Icons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {wall.thicknessCm > 0 && onFlipWallDirection && (
                              <button
                                onClick={() => {
                                  onFlipWallDirection(wall.id);
                                  showToast(`Dirección de obras invertida en «${wall.name}»`);
                                }}
                                className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                title="Invertir hacia qué lado miran las obras de este muro"
                              >
                                <span>
                                  {wall.normalSide === 'bottom'
                                    ? '↓ Cara'
                                    : wall.normalSide === 'top'
                                    ? '↑ Cara'
                                    : wall.normalSide === 'left'
                                    ? '← Cara'
                                    : '→ Cara'}
                                </span>
                              </button>
                            )}

                            {wall.thicknessCm > 0 && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenElevation(wall.id);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Abrir editor de elevación frontal para montaje"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Elevación</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                onClose();
                                onSelectWall(wall.id);
                              }}
                              className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] dark:hover:text-white hover:bg-white dark:hover:bg-[#252D3D] border border-transparent hover:border-[#E6E4DD] cursor-pointer"
                              title="Seleccionar en plano"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDuplicateWall(wall.id)}
                              className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] dark:hover:text-white hover:bg-white dark:hover:bg-[#252D3D] border border-transparent hover:border-[#E6E4DD] cursor-pointer"
                              title="Duplicar muro"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onSplitWall(wall.id)}
                              className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] dark:hover:text-white hover:bg-white dark:hover:bg-[#252D3D] border border-transparent hover:border-[#E6E4DD] cursor-pointer"
                              title="Dividir muro"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onPromptDeleteWall(wall)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                              title="Eliminar muro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Dedicated Participant, Transfer & Double-Sided Back-Face Bar */}
                        <div className="mt-2.5 pt-2 border-t border-[#F0EFEA] dark:border-[#2D3748] flex flex-wrap items-center justify-between gap-2 text-xs">
                          {/* Cambiar Participante */}
                          {onUpdateWall && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-[#737373]">
                                Participante:
                              </span>
                              <input
                                type="text"
                                value={wall.participant}
                                onChange={(e) =>
                                  onUpdateWall(wall.id, { participant: e.target.value })
                                }
                                className="px-2 py-0.5 w-32 text-xs rounded bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#334155] font-medium text-[#171717] dark:text-[#F8FAFC]"
                              />
                            </div>
                          )}

                          {otherZones.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-[#737373] flex items-center gap-1">
                                <ArrowRightLeft className="w-3 h-3 text-[#2563EB]" />
                                <span>Pasar a sección:</span>
                              </span>
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleTransferSingle(wall.id, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="px-2 py-1 text-xs rounded bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#334155] cursor-pointer font-medium text-[#171717] dark:text-[#F8FAFC]"
                              >
                                <option value="" disabled>
                                  Mover a...
                                </option>
                                {otherZones.map((z) => (
                                  <option key={z.id} value={z.id}>
                                    → {z.name} ({z.participant})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {wall.thicknessCm > 0 && onCreateOppositeWallFace && otherZones.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-[#737373]">
                                2ª Sección (Doble cara):
                              </span>
                              <select
                                value={linkedWall?.zoneId || otherZoneId || ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const targetZ = allZones.find((z) => z.id === e.target.value);
                                    onCreateOppositeWallFace(wall.id, e.target.value);
                                    showToast(
                                      `Muro de doble cara activo también en «${targetZ?.name || ''}»`
                                    );
                                  }
                                }}
                                className="px-2 py-1 text-xs rounded bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 cursor-pointer font-medium text-[#2563EB]"
                              >
                                <option value="">
                                  + Elegir 2ª sección...
                                </option>
                                {otherZones.map((z) => (
                                  <option key={z.id} value={z.id}>
                                    ⇄ {z.name} ({z.participant})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ITEMS & ARTWORKS */}
          {activeTab === 'items' && (
            <div className="space-y-5">
              {/* Unassigned Artworks Section */}
              {unassignedItems.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Obras sin muro asignado ({unassignedItems.length})
                      </h4>
                    </div>
                    <span className="text-[11px] text-amber-700 dark:text-amber-300">
                      Conservadas tras eliminar muros
                    </span>
                  </div>

                  <div className="space-y-2">
                    {unassignedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-[#1A1F2C] border border-amber-200 dark:border-amber-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-9 h-9 object-contain rounded bg-[#FAF8F5] border"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC]">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-[#737373]">
                              {item.widthCm} × {item.heightCm} cm · {item.type}
                            </div>
                          </div>
                        </div>

                        {zoneWalls.length > 0 ? (
                          <button
                            onClick={() => onOpenAssignArtworkModal(item)}
                            className="px-2.5 py-1 text-xs rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Asignar a muro</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-medium">
                            Crea un muro primero
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Works per Wall */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC]">
                  Obras montadas en los muros de este espacio ({assignedItems.length})
                </h4>

                {assignedItems.length === 0 ? (
                  <p className="text-xs text-[#737373] py-4 text-center">
                    Aún no hay obras montadas en las paredes de este espacio. Abre la elevación de un muro para colocar fotografías.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignedItems.map((item) => {
                      const wall = zoneWalls.find((w) => w.id === item.wallId);
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg border border-[#E6E4DD] dark:border-[#2D3748] bg-[#FAF8F5] dark:bg-[#121620] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 object-contain rounded bg-white border shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC] truncate">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-[#737373] dark:text-[#94A3B8]">
                                {item.widthCm}×{item.heightCm}cm · En {wall?.name || 'Muro'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {wall && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenElevation(wall.id);
                                }}
                                className="p-1.5 rounded-lg text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer"
                                title="Ver en elevación"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteItem && (
                              <button
                                onClick={() => {
                                  onDeleteItem(item.id);
                                  showToast(`«${item.name}» enviado a la papelera`);
                                }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                title="Eliminar obra o elemento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[#E6E4DD] dark:border-[#2D3748] bg-[#FAF8F5] dark:bg-[#121620] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#171717] dark:text-[#F8FAFC]">
                    Información y Ficha Curatorial
                  </h4>
                  {!editingName ? (
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar datos</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveInfo}
                      className="px-2.5 py-1 text-xs rounded bg-[#2563EB] text-white flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Check className="w-3 h-3" />
                      <span>Guardar</span>
                    </button>
                  )}
                </div>

                {editingName ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-medium text-[#737373] mb-1">
                        Nombre del espacio
                      </label>
                      <input
                        type="text"
                        value={nameVal}
                        onChange={(e) => setNameVal(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded border border-[#E6E4DD] dark:border-[#334155] bg-white dark:bg-[#0B0F17]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#737373] mb-1">
                        Descripción curatorial
                      </label>
                      <textarea
                        value={descVal}
                        onChange={(e) => setDescVal(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-1.5 text-xs rounded border border-[#E6E4DD] dark:border-[#334155] bg-white dark:bg-[#0B0F17]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[#737373]">Nombre:</span>{' '}
                      <strong className="text-[#171717] dark:text-[#F8FAFC]">{zone.name}</strong>
                    </div>
                    <div>
                      <span className="text-[#737373]">Participante / Artista:</span>{' '}
                      <span className="text-[#404040] dark:text-[#CBD5E1]">
                        {zone.participant || zone.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#737373]">Descripción:</span>{' '}
                      <span className="text-[#404040] dark:text-[#CBD5E1]">
                        {zone.description || 'Sin descripción curatorial registrada.'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#737373]">Metros lineales de exhibición:</span>{' '}
                      <strong className="text-[#2563EB]">{totalLengthM.toFixed(2)} metros</strong>
                    </div>
                    <div>
                      <span className="text-[#737373]">Paredes activas:</span>{' '}
                      <span className="font-semibold">{zoneWalls.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
