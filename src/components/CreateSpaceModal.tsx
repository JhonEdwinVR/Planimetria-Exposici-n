/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FolderPlus,
  PenTool,
  Ruler,
  Maximize2,
  FolderOpen,
  ArrowRight,
  X,
  Palette,
} from 'lucide-react';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSpace: (
    name: string,
    description: string,
    color: string,
    constructionMethod: 'draw' | 'dimensions' | 'perimeter' | 'empty'
  ) => void;
}

const PRESET_COLORS = [
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#DC2626', // Red
  '#4B5563', // Slate
];

export const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({
  isOpen,
  onClose,
  onCreateSpace,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [method, setMethod] = useState<'draw' | 'dimensions' | 'perimeter' | 'empty'>('draw');

  if (!isOpen) return null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  };

  const handleFinish = () => {
    if (!name.trim()) return;
    onCreateSpace(name.trim(), description.trim(), color, method);
    setName('');
    setDescription('');
    setStep(1);
    onClose();
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EFEA] dark:border-[#2D3748]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#171717] dark:text-[#F8FAFC]">
                Crear nuevo espacio
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#94A3B8]">
                Paso {step} de 2 — {step === 1 ? 'Información básica' : 'Método de construcción'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] dark:hover:text-white hover:bg-[#F0EFEA] dark:hover:bg-[#252D3D] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                  Nombre del espacio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sala de prueba, Pasillo Central, Entrada..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white text-sm focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                  Descripción curatorial o ubicación (opcional)
                </label>
                <textarea
                  placeholder="Ej. Sector dedicado a fotografía monocromática y textos de sala."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E6E4DD] dark:border-[#334155] bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-white text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#404040] dark:text-[#E2E8F0] mb-1.5">
                  Color identificador
                </label>
                <div className="flex items-center gap-2.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                        color === c
                          ? 'scale-125 ring-2 ring-offset-2 ring-[#2563EB] shadow-xs'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F0EFEA] dark:border-[#2D3748]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#737373] hover:bg-[#F0EFEA] dark:hover:bg-[#252D3D] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#737373] dark:text-[#94A3B8]">
                ¿Cómo deseas comenzar a construir las paredes de <strong>«{name}»</strong>?
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Method A: Draw */}
                <button
                  type="button"
                  onClick={() => setMethod('draw')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    method === 'draw'
                      ? 'border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]'
                      : 'border-[#E6E4DD] dark:border-[#2D3748] hover:bg-[#FAF8F5] dark:hover:bg-[#1E2533]'
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 ${method === 'draw' ? 'bg-[#2563EB] text-white' : 'bg-gray-100 dark:bg-gray-800 text-[#737373]'}`}>
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC]">
                      Dibujar geometría en el plano
                    </h4>
                    <p className="text-[11px] text-[#737373] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                      Define la posición y forma de los muros haciendo clic directamente sobre el plano arquitectónico.
                    </p>
                  </div>
                </button>

                {/* Method B: Dimensions */}
                <button
                  type="button"
                  onClick={() => setMethod('dimensions')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    method === 'dimensions'
                      ? 'border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]'
                      : 'border-[#E6E4DD] dark:border-[#2D3748] hover:bg-[#FAF8F5] dark:hover:bg-[#1E2533]'
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 ${method === 'dimensions' ? 'bg-[#2563EB] text-white' : 'bg-gray-100 dark:bg-gray-800 text-[#737373]'}`}>
                    <Ruler className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC]">
                      Definir medidas manualmente
                    </h4>
                    <p className="text-[11px] text-[#737373] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                      Introduce longitud, altura, grosor y posición para crear el muro con precisión numérica inmediata.
                    </p>
                  </div>
                </button>

                {/* Method C: Perimeter */}
                <button
                  type="button"
                  onClick={() => setMethod('perimeter')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    method === 'perimeter'
                      ? 'border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]'
                      : 'border-[#E6E4DD] dark:border-[#2D3748] hover:bg-[#FAF8F5] dark:hover:bg-[#1E2533]'
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 ${method === 'perimeter' ? 'bg-[#2563EB] text-white' : 'bg-gray-100 dark:bg-gray-800 text-[#737373]'}`}>
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC]">
                      Generar muros desde el perímetro
                    </h4>
                    <p className="text-[11px] text-[#737373] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                      Genera automáticamente una sala rectangular o poligonal con todos sus muros conectados.
                    </p>
                  </div>
                </button>

                {/* Method D: Empty space */}
                <button
                  type="button"
                  onClick={() => setMethod('empty')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    method === 'empty'
                      ? 'border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]'
                      : 'border-[#E6E4DD] dark:border-[#2D3748] hover:bg-[#FAF8F5] dark:hover:bg-[#1E2533]'
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 ${method === 'empty' ? 'bg-[#2563EB] text-white' : 'bg-gray-100 dark:bg-gray-800 text-[#737373]'}`}>
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#171717] dark:text-[#F8FAFC]">
                      Crear espacio vacío
                    </h4>
                    <p className="text-[11px] text-[#737373] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                      Crea el espacio primero y abre su panel para añadir los muros posteriormente a tu propio ritmo.
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#F0EFEA] dark:border-[#2D3748]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#737373] hover:bg-[#F0EFEA] dark:hover:bg-[#252D3D] cursor-pointer"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Confirmar y comenzar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
