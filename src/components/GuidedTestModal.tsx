/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, Circle, RotateCcw, X, Sparkles, CheckSquare, Award } from 'lucide-react';
import { ExhibitionProject } from '../types/exhibition';

interface GuidedTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ExhibitionProject;
}

interface TestStep {
  id: number;
  label: string;
  autoCheck: (p: ExhibitionProject) => boolean;
}

const TEST_STEPS: TestStep[] = [
  {
    id: 1,
    label: 'Crear un espacio llamado «Sala de prueba»',
    autoCheck: (p) => p.zones.some((z) => z.name.toLowerCase().includes('sala de prueba')),
  },
  {
    id: 2,
    label: 'Dibujar un muro de 4 metros',
    autoCheck: (p) => p.walls.some((w) => Math.abs(w.lengthM - 4.0) <= 0.15),
  },
  {
    id: 3,
    label: 'Crear un segundo muro de 3 metros',
    autoCheck: (p) => p.walls.some((w) => Math.abs(w.lengthM - 3.0) <= 0.15),
  },
  {
    id: 4,
    label: 'Modificar el primer muro a 5 metros',
    autoCheck: (p) => p.walls.some((w) => Math.abs(w.lengthM - 5.0) <= 0.15),
  },
  {
    id: 5,
    label: 'Abrir la elevación del primer muro',
    autoCheck: () => true, // Interactive check
  },
  {
    id: 6,
    label: 'Agregar tres fotografías de diferentes formatos',
    autoCheck: (p) => {
      const counts = p.walls.map((w) => p.items.filter((i) => i.wallId === w.id && i.type === 'photo').length);
      return Math.max(0, ...counts) >= 3;
    },
  },
  {
    id: 7,
    label: 'Cambiar la altura del muro y comprobar la elevación',
    autoCheck: (p) => p.walls.some((w) => w.heightM !== 2.6),
  },
  {
    id: 8,
    label: 'Eliminar el segundo muro',
    autoCheck: () => true,
  },
  {
    id: 9,
    label: 'Crear nuevamente el segundo muro',
    autoCheck: (p) => p.walls.length >= 2,
  },
  {
    id: 10,
    label: 'Mover una fotografía al nuevo muro',
    autoCheck: () => true,
  },
  {
    id: 11,
    label: 'Recargar la aplicación y comprobar que todo permanece guardado',
    autoCheck: () => true,
  },
];

export const GuidedTestModal: React.FC<GuidedTestModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [manualChecks, setManualChecks] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const toggleCheck = (id: number) => {
    setManualChecks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isStepDone = (step: TestStep) => {
    return Boolean(manualChecks[step.id] || step.autoCheck(project));
  };

  const completedCount = TEST_STEPS.filter(isStepDone).length;
  const allCompleted = completedCount === TEST_STEPS.length;

  const handleReset = () => {
    setManualChecks({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA] dark:border-[#2D3748]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#2563EB]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171717] dark:text-[#F8FAFC]">
                Prueba de funcionamiento
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#94A3B8]">
                {completedCount} de {TEST_STEPS.length} completadas
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

        {/* Progress bar */}
        <div className="mt-4 mb-4">
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-[#2563EB] transition-all duration-300 rounded-full"
              style={{ width: `${(completedCount / TEST_STEPS.length) * 100}%` }}
            />
          </div>
          {allCompleted && (
            <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Excelente! Todas las pruebas del escenario han sido validadas exitosamente.</span>
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {TEST_STEPS.map((step) => {
            const done = isStepDone(step);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleCheck(step.id)}
                className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  done
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                    : 'border-[#E6E4DD] dark:border-[#334155] hover:bg-[#FAF8F5] dark:hover:bg-[#1E2533] text-[#404040] dark:text-[#CBD5E1]'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="font-mono text-[11px] text-[#737373] w-5">
                    {step.id}.
                  </span>
                  <span className={done ? 'font-medium line-through opacity-85' : 'font-normal'}>
                    {step.label}
                  </span>
                </div>
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F0EFEA] dark:border-[#2D3748]">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-[#737373] hover:text-[#171717] dark:hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar prueba</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg shadow-xs cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
