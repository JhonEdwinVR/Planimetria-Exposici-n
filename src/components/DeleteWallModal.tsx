/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, Trash2, ArrowRightLeft, X, ShieldAlert } from 'lucide-react';
import { Wall, WallItem } from '../types/exhibition';

interface DeleteWallModalProps {
  isOpen: boolean;
  wall: Wall | null;
  items: WallItem[];
  onClose: () => void;
  onConfirmDelete: (
    wallId: string,
    action: 'keep_unassigned' | 'delete_all'
  ) => void;
}

export const DeleteWallModal: React.FC<DeleteWallModalProps> = ({
  isOpen,
  wall,
  items,
  onClose,
  onConfirmDelete,
}) => {
  const [action, setAction] = useState<'keep_unassigned' | 'delete_all'>('keep_unassigned');

  if (!isOpen || !wall) return null;

  const wallItems = items.filter((it) => it.wallId === wall.id);

  const handleConfirm = () => {
    onConfirmDelete(wall.id, action);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#F0EFEA] dark:border-[#2D3748]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#171717] dark:text-[#F8FAFC]">
                Eliminar muro
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#94A3B8]">
                {wall.name} ({wall.lengthM.toFixed(2)} m × {wall.heightM.toFixed(2)} m)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737373] hover:text-[#171717] dark:hover:text-white rounded-lg hover:bg-[#F0EFEA] dark:hover:bg-[#252D3D]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          <p className="text-xs text-[#525252] dark:text-[#CBD5E1] leading-relaxed">
            Este muro contiene actualmente <strong>{wallItems.length}</strong> obra(s) y elementos montados.
            Selecciona cómo deseas proceder:
          </p>

          <div className="space-y-2.5">
            {/* Option 1: Keep artworks unassigned */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                action === 'keep_unassigned'
                  ? 'border-[#2563EB] bg-blue-50/40 dark:bg-blue-900/20'
                  : 'border-[#E6E4DD] dark:border-[#334155] hover:bg-[#FAF8F5]'
              }`}
            >
              <input
                type="radio"
                name="wall_delete_action"
                checked={action === 'keep_unassigned'}
                onChange={() => setAction('keep_unassigned')}
                className="mt-0.5 text-[#2563EB]"
              />
              <div className="text-xs">
                <div className="font-semibold text-[#171717] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Conservar obras en «Sin muro asignado»</span>
                </div>
                <div className="text-[#737373] dark:text-[#94A3B8] text-[11px] mt-0.5 leading-relaxed">
                  Elimina el muro pero mantiene las fotografías y textos en el espacio, listos para montarse en otra pared.
                </div>
              </div>
            </label>

            {/* Option 2: Delete wall and all artworks to trash */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                action === 'delete_all'
                  ? 'border-red-500 bg-red-50/40 dark:bg-red-900/20'
                  : 'border-[#E6E4DD] dark:border-[#334155] hover:bg-[#FAF8F5]'
              }`}
            >
              <input
                type="radio"
                name="wall_delete_action"
                checked={action === 'delete_all'}
                onChange={() => setAction('delete_all')}
                className="mt-0.5 text-red-600"
              />
              <div className="text-xs">
                <div className="font-semibold text-[#DC2626] dark:text-red-400 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar muro y todas sus obras (a papelera)</span>
                </div>
                <div className="text-[#737373] dark:text-[#94A3B8] text-[11px] mt-0.5 leading-relaxed">
                  Envía el muro y sus {wallItems.length} obras a la papelera temporal. Podrás restaurarlos más tarde.
                </div>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0EFEA] dark:border-[#2D3748]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#737373] hover:bg-[#F0EFEA] dark:hover:bg-[#252D3D] rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirmar eliminación</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
