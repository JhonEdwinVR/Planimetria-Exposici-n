import React, { useState } from 'react';
import { AlertTriangle, Trash2, ArrowRightLeft, X } from 'lucide-react';
import { Wall, WallItem, Zone } from '../types/exhibition';

interface ConfirmDeleteZoneModalProps {
  isOpen: boolean;
  zone: Zone | null;
  allZones: Zone[];
  walls: Wall[];
  items: WallItem[];
  onClose: () => void;
  onConfirmDelete: (
    zoneId: string,
    action: 'delete_contents' | 'reassign',
    targetZoneId?: string
  ) => void;
}

export const ConfirmDeleteZoneModal: React.FC<ConfirmDeleteZoneModalProps> = ({
  isOpen,
  zone,
  allZones,
  walls,
  items,
  onClose,
  onConfirmDelete,
}) => {
  const [action, setAction] = useState<'delete_contents' | 'reassign'>('delete_contents');
  const [targetZoneId, setTargetZoneId] = useState<string>('');

  if (!isOpen || !zone) return null;

  const zoneWalls = walls.filter((w) => w.zoneId === zone.id);
  const zoneItems = items.filter((it) => it.zoneId === zone.id);
  const otherZones = allZones.filter((z) => z.id !== zone.id);

  // Default target zone if reassigning
  const effectiveTargetZone = targetZoneId || (otherZones[0]?.id ?? '');

  const handleConfirm = () => {
    onConfirmDelete(zone.id, action, action === 'reassign' ? effectiveTargetZone : undefined);
    onClose();
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md bg-white border border-[#E6E4DD] rounded-lg shadow-xl overflow-hidden flex flex-col text-[#171717] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E6E4DD] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
              Eliminar Sector: {zone.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#737373] hover:text-[#171717] hover:bg-[#F0EFEA] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-[#404040] leading-relaxed">
            Este sector contiene{' '}
            <span className="font-semibold text-[#171717]">
              {zoneWalls.length} muro(s)
            </span>{' '}
            y{' '}
            <span className="font-semibold text-[#171717]">
              {zoneItems.length} obra(s) o elemento(s)
            </span>
            . Elige cómo deseas gestionar su contenido antes de continuar:
          </p>

          <div className="space-y-2.5">
            {/* Option 1: Delete all contents to trash */}
            <label
              className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                action === 'delete_contents'
                  ? 'border-[#2563EB] bg-[#2563EB]/5'
                  : 'border-[#E6E4DD] hover:bg-[#FAF8F5]'
              }`}
            >
              <input
                type="radio"
                name="delete_zone_action"
                checked={action === 'delete_contents'}
                onChange={() => setAction('delete_contents')}
                className="mt-0.5 accent-[#2563EB]"
              />
              <div className="space-y-0.5">
                <div className="font-medium text-[#171717] flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Eliminar sector y todos sus muros y obras</span>
                </div>
                <p className="text-[11px] text-[#737373] leading-normal">
                  Se trasladarán a la Papelera temporal, desde donde podrás restaurarlos en cualquier momento.
                </p>
              </div>
            </label>

            {/* Option 2: Reassign contents to another zone */}
            {otherZones.length > 0 && (
              <label
                className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  action === 'reassign'
                    ? 'border-[#2563EB] bg-[#2563EB]/5'
                    : 'border-[#E6E4DD] hover:bg-[#FAF8F5]'
                }`}
              >
                <input
                  type="radio"
                  name="delete_zone_action"
                  checked={action === 'reassign'}
                  onChange={() => setAction('reassign')}
                  className="mt-0.5 accent-[#2563EB]"
                />
                <div className="space-y-2 flex-1">
                  <div className="font-medium text-[#171717] flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Reasignar muros y obras a otro sector</span>
                  </div>
                  <p className="text-[11px] text-[#737373] leading-normal">
                    Los muros y obras conservarán sus posiciones y se vincularán al nuevo sector seleccionado:
                  </p>

                  {action === 'reassign' && (
                    <select
                      value={effectiveTargetZone}
                      onChange={(e) => setTargetZoneId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded bg-white border border-[#E6E4DD] text-[#171717] font-medium focus:outline-none focus:border-[#2563EB]"
                    >
                      {otherZones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.participant})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#E6E4DD] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs rounded border border-[#E6E4DD] bg-white hover:bg-[#F0EFEA] text-[#171717] font-medium cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 text-xs rounded bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirmar eliminación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
