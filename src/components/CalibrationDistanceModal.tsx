/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ruler, Check, X } from 'lucide-react';

interface CalibrationDistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointA: { x: number; y: number } | null;
  pointB: { x: number; y: number } | null;
  onApply: (realMeters: number) => void;
}

export const CalibrationDistanceModal: React.FC<CalibrationDistanceModalProps> = ({
  isOpen,
  onClose,
  pointA,
  pointB,
  onApply,
}) => {
  const [distanceStr, setDistanceStr] = useState<string>('3.00');

  if (!isOpen || !pointA || !pointB) return null;

  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointB.y;
  const pixelDist = Math.hypot(dx, dy);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(distanceStr);
    if (!isNaN(val) && val > 0) {
      onApply(val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA] dark:border-[#2D3748]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Ruler className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#171717] dark:text-[#F8FAFC]">
              Distancia real de calibración
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
          <p className="text-xs text-[#737373] dark:text-[#94A3B8] leading-relaxed">
            Has seleccionado 2 puntos de referencia en el plano ({pixelDist.toFixed(0)} px de distancia).
            Indica cuántos metros reales mide este segmento en el espacio:
          </p>

          <div>
            <label className="block text-[11px] font-medium text-[#525252] dark:text-[#CBD5E1] mb-1">
              Distancia en metros (m)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="100"
                value={distanceStr}
                onChange={(e) => setDistanceStr(e.target.value)}
                autoFocus
                className="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#737373]">m</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#525252] dark:text-[#94A3B8] hover:bg-[#F0EFEA] dark:hover:bg-[#334155] rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Calibrar escala</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
