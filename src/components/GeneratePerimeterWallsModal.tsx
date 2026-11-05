/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Maximize2, Check, X, Box, CheckSquare, Square } from 'lucide-react';
import { Zone } from '../types/exhibition';

interface GeneratePerimeterWallsModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Zone[];
  defaultZoneId?: string;
  onGenerateRoom: (
    spaceId: string,
    widthM: number,
    lengthM: number,
    originX: number,
    originY: number,
    activeSegments: [boolean, boolean, boolean, boolean]
  ) => void;
}

export const GeneratePerimeterWallsModal: React.FC<GeneratePerimeterWallsModalProps> = ({
  isOpen,
  onClose,
  zones,
  defaultZoneId,
  onGenerateRoom,
}) => {
  const [spaceId, setSpaceId] = useState(defaultZoneId || zones[0]?.id || '');
  const [widthM, setWidthM] = useState('4.00');
  const [lengthM, setLengthM] = useState('5.00');
  const [originX, setOriginX] = useState('3.00');
  const [originY, setOriginY] = useState('2.00');
  const [activeSegments, setActiveSegments] = useState<[boolean, boolean, boolean, boolean]>([
    true,
    true,
    true,
    true,
  ]); // [Norte, Este, Sur, Oeste]

  React.useEffect(() => {
    if (defaultZoneId) setSpaceId(defaultZoneId);
    else if (zones.length > 0 && !spaceId) setSpaceId(zones[0].id);
  }, [defaultZoneId, zones]);

  if (!isOpen) return null;

  const toggleSegment = (index: 0 | 1 | 2 | 3) => {
    const next: [boolean, boolean, boolean, boolean] = [...activeSegments];
    next[index] = !next[index];
    setActiveSegments(next);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(widthM);
    const l = parseFloat(lengthM);
    const ox = parseFloat(originX);
    const oy = parseFloat(originY);

    if (isNaN(w) || isNaN(l) || w <= 0 || l <= 0 || !spaceId) return;

    onGenerateRoom(
      spaceId,
      Number(w.toFixed(2)),
      Number(l.toFixed(2)),
      !isNaN(ox) ? Number(ox.toFixed(2)) : 3.0,
      !isNaN(oy) ? Number(oy.toFixed(2)) : 2.0,
      activeSegments
    );

    onClose();
  };

  const selectedCount = activeSegments.filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EFEA] dark:border-[#2D3748]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#171717] dark:text-[#F8FAFC]">
                Generar muros desde perímetro
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#94A3B8]">
                Genera una sala completa o perímetro con muros conectados
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

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
              Espacio de destino
            </label>
            <select
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.participant})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Ancho del perímetro (m)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  min="1"
                  max="30"
                  value={widthM}
                  onChange={(e) => setWidthM(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-sm font-mono rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#737373]">m</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Largo del perímetro (m)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  min="1"
                  max="30"
                  value={lengthM}
                  onChange={(e) => setLengthM(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-sm font-mono rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#737373]">m</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Posición X origen (m)
              </label>
              <input
                type="number"
                step="0.25"
                value={originX}
                onChange={(e) => setOriginX(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Posición Y origen (m)
              </label>
              <input
                type="number"
                step="0.25"
                value={originY}
                onChange={(e) => setOriginY(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Segment Selection */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-2">
              Segmentos que se convertirán en muros físicos:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => toggleSegment(0)}
                className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                  activeSegments[0]
                    ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB] font-medium'
                    : 'border-[#E6E4DD] text-[#737373]'
                }`}
              >
                <span>Muro Norte (Frontal · {widthM}m)</span>
                {activeSegments[0] ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => toggleSegment(1)}
                className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                  activeSegments[1]
                    ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB] font-medium'
                    : 'border-[#E6E4DD] text-[#737373]'
                }`}
              >
                <span>Muro Este (Lateral Der. · {lengthM}m)</span>
                {activeSegments[1] ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => toggleSegment(2)}
                className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                  activeSegments[2]
                    ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB] font-medium'
                    : 'border-[#E6E4DD] text-[#737373]'
                }`}
              >
                <span>Muro Sur (Posterior · {widthM}m)</span>
                {activeSegments[2] ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => toggleSegment(3)}
                className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                  activeSegments[3]
                    ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB] font-medium'
                    : 'border-[#E6E4DD] text-[#737373]'
                }`}
              >
                <span>Muro Oeste (Lateral Izq. · {lengthM}m)</span>
                {activeSegments[3] ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#F0EFEA] dark:border-[#2D3748]">
            <span className="text-xs text-[#737373]">
              Se generarán <strong>{selectedCount}</strong> muros conectados
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#737373] hover:bg-[#F0EFEA] dark:hover:bg-[#252D3D] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={selectedCount === 0}
                className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Generar {selectedCount} muros</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
