import React, { useRef, useState } from 'react';
import {
  Compass,
  Upload,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sliders,
  Ruler,
  X,
  RotateCw,
} from 'lucide-react';
import { BackgroundPlanSettings } from '../types/exhibition';

interface BackgroundCalibrationModalProps {
  isOpen: boolean;
  backgroundPlan?: BackgroundPlanSettings;
  onClose: () => void;
  onUpdateBackgroundPlan: (patch: Partial<BackgroundPlanSettings>) => void;
  onStartTwoPointCalibration: () => void;
  onResetBackgroundPlan: () => void;
  onDeleteBackgroundImage: () => void;
  onUploadBackgroundImage: (dataUrl: string) => void;
}

export const BackgroundCalibrationModal: React.FC<BackgroundCalibrationModalProps> = ({
  isOpen,
  backgroundPlan,
  onClose,
  onUpdateBackgroundPlan,
  onStartTwoPointCalibration,
  onResetBackgroundPlan,
  onDeleteBackgroundImage,
  onUploadBackgroundImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const bg = backgroundPlan || {
    visible: true,
    locked: false,
    opacity: 0.35,
    scale: 1,
    xOffsetM: 0,
    yOffsetM: 0,
    rotationDeg: 0,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadBackgroundImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md bg-white border border-[#E6E4DD] rounded-lg shadow-xl overflow-hidden flex flex-col text-[#171717] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E6E4DD] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
              Capa: Plano Original de Fondo
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
          {/* Visibility and Lock toggles */}
          <div className="flex items-center justify-between bg-[#FAF8F5] p-3 rounded border border-[#E6E4DD]">
            <button
              onClick={() => onUpdateBackgroundPlan({ visible: !bg.visible })}
              className="flex items-center gap-1.5 text-xs text-[#171717] hover:text-[#2563EB] cursor-pointer font-medium"
            >
              {bg.visible ? (
                <>
                  <Eye className="w-4 h-4 text-[#2563EB]" />
                  <span>Plano Visible</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-[#737373]" />
                  <span>Plano Oculto</span>
                </>
              )}
            </button>

            <button
              onClick={() => onUpdateBackgroundPlan({ locked: !bg.locked })}
              className="flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#171717] cursor-pointer"
            >
              {bg.locked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="text-[#2563EB] font-medium">Posición Bloqueada</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Posición Desbloqueada</span>
                </>
              )}
            </button>
          </div>

          {/* Opacity Slider 0% - 100% */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[#737373]">
              <span>Opacidad del plano</span>
              <span className="font-mono text-[#171717] font-medium">
                {Math.round((bg.opacity ?? 0.35) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={bg.opacity ?? 0.35}
              onChange={(e) =>
                onUpdateBackgroundPlan({ opacity: Number(e.target.value) })
              }
              className="w-full accent-[#2563EB] cursor-pointer"
            />
          </div>

          {/* Scale & 2-point Calibration */}
          <div className="space-y-2 border-t border-[#E6E4DD] pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[#737373]">Escala de referencia</span>
              <span className="font-mono text-[#171717] font-medium">
                {Number((bg.scale ?? 1).toFixed(3))}×
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step={0.05}
                min={0.1}
                max={10}
                value={bg.scale ?? 1}
                onChange={(e) =>
                  onUpdateBackgroundPlan({ scale: Math.max(0.05, Number(e.target.value)) })
                }
                className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E6E4DD] bg-white font-mono"
              />
              <button
                onClick={() => {
                  onClose();
                  onStartTwoPointCalibration();
                }}
                className="px-2.5 py-1.5 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Selecciona dos puntos en el plano y escribe su distancia real"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Calibrar por 2 puntos</span>
              </button>
            </div>
          </div>

          {/* Position Offsets (X & Y in meters) & Rotation */}
          <div className="space-y-2 border-t border-[#E6E4DD] pt-3">
            <span className="block text-[#737373]">Ajuste de posición y rotación</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="block text-[10px] text-[#737373] mb-1">X (m)</span>
                <input
                  type="number"
                  step={0.1}
                  value={bg.xOffsetM ?? 0}
                  onChange={(e) =>
                    onUpdateBackgroundPlan({ xOffsetM: Number(e.target.value) })
                  }
                  className="w-full px-2 py-1 text-xs rounded border border-[#E6E4DD] bg-white font-mono"
                />
              </div>
              <div>
                <span className="block text-[10px] text-[#737373] mb-1">Y (m)</span>
                <input
                  type="number"
                  step={0.1}
                  value={bg.yOffsetM ?? 0}
                  onChange={(e) =>
                    onUpdateBackgroundPlan({ yOffsetM: Number(e.target.value) })
                  }
                  className="w-full px-2 py-1 text-xs rounded border border-[#E6E4DD] bg-white font-mono"
                />
              </div>
              <div>
                <span className="block text-[10px] text-[#737373] mb-1">Giro (°)</span>
                <input
                  type="number"
                  step={5}
                  value={bg.rotationDeg ?? 0}
                  onChange={(e) =>
                    onUpdateBackgroundPlan({ rotationDeg: Number(e.target.value) })
                  }
                  className="w-full px-2 py-1 text-xs rounded border border-[#E6E4DD] bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Actions: Reemplazar, Restablecer, Eliminar */}
          <div className="space-y-2 border-t border-[#E6E4DD] pt-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-2 rounded border border-[#E6E4DD] bg-white hover:bg-[#FAF8F5] text-[#171717] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Reemplazar imagen</span>
              </button>
              <button
                onClick={onResetBackgroundPlan}
                className="py-1.5 px-2 rounded border border-[#E6E4DD] bg-white hover:bg-[#FAF8F5] text-[#737373] hover:text-[#171717] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer posición</span>
              </button>
            </div>

            <button
              onClick={() => {
                onDeleteBackgroundImage();
                onClose();
              }}
              className="w-full py-1.5 px-2 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar imagen de fondo</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E6E4DD] bg-[#FAF8F5] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
