/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowRightLeft, Check, X, Image as ImageIcon } from 'lucide-react';
import { Wall, WallItem } from '../types/exhibition';

interface AssignArtworkModalProps {
  isOpen: boolean;
  item: WallItem | null;
  walls: Wall[];
  onClose: () => void;
  onAssignToWall: (itemId: string, targetWallId: string, xCm: number, yCm: number) => void;
}

export const AssignArtworkModal: React.FC<AssignArtworkModalProps> = ({
  isOpen,
  item,
  walls,
  onClose,
  onAssignToWall,
}) => {
  const [targetWallId, setTargetWallId] = useState<string>('');
  const [xCm, setXCm] = useState<number>(40);
  const [yCm, setYCm] = useState<number>(115);

  React.useEffect(() => {
    if (walls.length > 0 && !targetWallId) {
      setTargetWallId(walls[0].id);
    }
  }, [walls, targetWallId]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWallId) return;
    onAssignToWall(item.id, targetWallId, xCm, yCm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA] dark:border-[#2D3748]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#171717] dark:text-[#F8FAFC]">
              Asignar obra a un muro
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#737373] hover:text-[#171717] dark:hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#0B0F17] border border-[#E6E4DD] dark:border-[#2D3748]">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-12 h-12 object-contain rounded bg-white border border-[#E6E4DD]"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC]">
                {item.name}
              </div>
              <div className="text-[11px] text-[#737373] dark:text-[#94A3B8]">
                {item.widthCm} × {item.heightCm} cm
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1">
              Seleccionar muro de destino:
            </label>
            <select
              value={targetWallId}
              onChange={(e) => setTargetWallId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white"
            >
              {walls.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.lengthM.toFixed(2)}m × {w.heightM.toFixed(2)}m)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Posición X (cm)
              </label>
              <input
                type="number"
                value={xCm}
                onChange={(e) => setXCm(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-[#E6E4DD] dark:border-[#334155]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Posición Y (cm)
              </label>
              <input
                type="number"
                value={yCm}
                onChange={(e) => setYCm(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-[#E6E4DD] dark:border-[#334155]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0EFEA] dark:border-[#2D3748]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#737373] hover:bg-[#F0EFEA] rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!targetWallId}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Montar en muro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
