/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ruler, Check, X, Layers, MoveRight, ArrowDownRight, ArrowDown } from 'lucide-react';
import { WallMaterial, Zone } from '../types/exhibition';

interface CreateWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Zone[];
  defaultZoneId?: string;
  onCreateWall: (data: {
    spaceId: string;
    name: string;
    lengthM: number;
    heightM: number;
    thicknessCm: number;
    orientation: 'horizontal' | 'vertical' | 'angled';
    posX: number;
    posY: number;
    material: WallMaterial;
    color: string;
    source: 'manual' | 'dimension';
  }) => void;
}

const MATERIAL_OPTIONS: { id: WallMaterial; label: string; bg: string }[] = [
  { id: 'white', label: 'Blanco Galería', bg: '#FFFFFF' },
  { id: 'gray', label: 'Gris Neutro', bg: '#E5E5E5' },
  { id: 'concrete', label: 'Hormigón', bg: '#9CA3AF' },
  { id: 'brick', label: 'Ladrillo Visto', bg: '#B45309' },
  { id: 'wood', label: 'Madera Cálida', bg: '#D97706' },
  { id: 'parchment', label: 'Pergamino', bg: '#FEF3C7' },
  { id: 'black', label: 'Negro Mate', bg: '#171717' },
];

export const CreateWallModal: React.FC<CreateWallModalProps> = ({
  isOpen,
  onClose,
  zones,
  defaultZoneId,
  onCreateWall,
}) => {
  const [spaceId, setSpaceId] = useState(defaultZoneId || zones[0]?.id || '');
  const [name, setName] = useState('Muro 01 – Principal');
  const [lengthM, setLengthM] = useState('4.00');
  const [heightM, setHeightM] = useState('2.60');
  const [thicknessCm, setThicknessCm] = useState('15');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical' | 'angled'>('horizontal');
  const [posX, setPosX] = useState('3.50');
  const [posY, setPosY] = useState('2.50');
  const [material, setMaterial] = useState<WallMaterial>('white');

  // Keep selected space updated if defaultZoneId changes
  React.useEffect(() => {
    if (defaultZoneId) setSpaceId(defaultZoneId);
    else if (zones.length > 0 && !spaceId) setSpaceId(zones[0].id);
  }, [defaultZoneId, zones]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const len = parseFloat(lengthM);
    const h = parseFloat(heightM);
    const th = parseFloat(thicknessCm);
    const x = parseFloat(posX);
    const y = parseFloat(posY);

    if (isNaN(len) || len <= 0 || !spaceId) return;

    onCreateWall({
      spaceId,
      name: name.trim() || 'Nuevo Muro',
      lengthM: Number(len.toFixed(2)),
      heightM: !isNaN(h) && h > 0 ? Number(h.toFixed(2)) : 2.6,
      thicknessCm: !isNaN(th) && th > 0 ? Number(th.toFixed(0)) : 15,
      orientation,
      posX: !isNaN(x) ? Number(x.toFixed(2)) : 2.0,
      posY: !isNaN(y) ? Number(y.toFixed(2)) : 2.0,
      material,
      color: MATERIAL_OPTIONS.find((m) => m.id === material)?.bg || '#FFFFFF',
      source: 'dimension',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EFEA] dark:border-[#2D3748]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#171717] dark:text-[#F8FAFC]">
                Crear muro con dimensiones
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#94A3B8]">
                Define las medidas exactas y posición del muro
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Space Assignment */}
            <div className="sm:col-span-2">
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

            {/* Wall Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Nombre del muro
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Length */}
            <div>
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Longitud (metros)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="0.2"
                  max="30"
                  value={lengthM}
                  onChange={(e) => setLengthM(e.target.value)}
                  required
                  className="w-full pl-3 pr-8 py-2 text-sm font-mono rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#737373]">m</span>
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Altura (metros)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="10"
                  value={heightM}
                  onChange={(e) => setHeightM(e.target.value)}
                  required
                  className="w-full pl-3 pr-8 py-2 text-sm font-mono rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#737373]">m</span>
              </div>
            </div>

            {/* Thickness */}
            <div>
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Grosor (cm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="80"
                  value={thicknessCm}
                  onChange={(e) => setThicknessCm(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-sm font-mono rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#737373]">cm</span>
              </div>
            </div>

            {/* Orientation */}
            <div>
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Orientación
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setOrientation('horizontal')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 border cursor-pointer ${
                    orientation === 'horizontal'
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'border-[#E6E4DD] text-[#737373] hover:bg-[#F0EFEA]'
                  }`}
                >
                  <MoveRight className="w-3.5 h-3.5" />
                  <span>Horiz.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('vertical')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 border cursor-pointer ${
                    orientation === 'vertical'
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'border-[#E6E4DD] text-[#737373] hover:bg-[#F0EFEA]'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Vert.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('angled')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 border cursor-pointer ${
                    orientation === 'angled'
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'border-[#E6E4DD] text-[#737373] hover:bg-[#F0EFEA]'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Diag.</span>
                </button>
              </div>
            </div>

            {/* Position X and Y */}
            <div>
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Posición X (m en el plano)
              </label>
              <input
                type="number"
                step="0.25"
                value={posX}
                onChange={(e) => setPosX(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Posición Y (m en el plano)
              </label>
              <input
                type="number"
                step="0.25"
                value={posY}
                onChange={(e) => setPosY(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Material */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                Acabado y Material
              </label>
              <div className="flex flex-wrap gap-2">
                {MATERIAL_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMaterial(m.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 border cursor-pointer transition-all ${
                      material === m.id
                        ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-900/30 text-[#2563EB] font-medium'
                        : 'border-[#E6E4DD] dark:border-[#334155] text-[#525252] hover:bg-[#F0EFEA]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-gray-300"
                      style={{ backgroundColor: m.bg }}
                    />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F0EFEA] dark:border-[#2D3748]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#737373] hover:bg-[#F0EFEA] dark:hover:bg-[#252D3D] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Crear muro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
