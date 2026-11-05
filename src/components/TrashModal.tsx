import React from 'react';
import {
  Trash2,
  RotateCcw,
  X,
  Layers,
  Square,
  Image as ImageIcon,
  Type,
  FolderMinus,
  CheckCheck,
} from 'lucide-react';
import { TrashItem } from '../types/exhibition';

interface TrashModalProps {
  isOpen: boolean;
  trash: TrashItem[];
  onClose: () => void;
  onRestoreItem: (trashId: string) => void;
  onRestoreAll: () => void;
  onEmptyTrash: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  trash,
  onClose,
  onRestoreItem,
  onRestoreAll,
  onEmptyTrash,
}) => {
  if (!isOpen) return null;

  const getTypeIcon = (type: TrashItem['type']) => {
    switch (type) {
      case 'zone':
        return <FolderMinus className="w-3.5 h-3.5 text-blue-600" />;
      case 'wall':
        return <Square className="w-3.5 h-3.5 text-neutral-700" />;
      case 'item':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />;
      case 'layer':
        return <Layers className="w-3.5 h-3.5 text-purple-600" />;
      case 'annotation':
        return <Type className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Trash2 className="w-3.5 h-3.5 text-neutral-500" />;
    }
  };

  const getTypeName = (type: TrashItem['type']) => {
    switch (type) {
      case 'zone':
        return 'Sector';
      case 'wall':
        return 'Muro';
      case 'item':
        return 'Obra / Recurso';
      case 'layer':
        return 'Capa';
      case 'annotation':
        return 'Etiqueta';
      default:
        return 'Elemento';
    }
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-lg bg-white border border-[#E6E4DD] rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh] text-[#171717] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E6E4DD] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#737373]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
              Papelera de Elementos ({trash.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#737373] hover:text-[#171717] hover:bg-[#F0EFEA] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {trash.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#737373] space-y-1">
              <CheckCheck className="w-8 h-8 mx-auto text-[#A3A3A3] mb-2" />
              <p className="font-medium text-[#171717]">La papelera está vacía</p>
              <p className="text-[11px] text-[#737373]">
                Los elementos eliminados del proyecto aparecerán aquí y podrán restaurarse.
              </p>
            </div>
          ) : (
            trash.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded border border-[#E6E4DD] bg-[#FAF8F5] hover:bg-white transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded bg-white border border-[#E6E4DD] shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#171717] truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EFECE6] text-[#737373] font-mono shrink-0">
                        {getTypeName(item.type)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#737373] truncate">
                      {item.description || `Eliminado el ${item.deletedAt}`}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRestoreItem(item.id)}
                  title="Restaurar elemento al proyecto"
                  className="px-2.5 py-1 text-xs rounded bg-white hover:bg-[#2563EB] hover:text-white border border-[#E6E4DD] text-[#2563EB] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {trash.length > 0 && (
          <div className="px-5 py-3 border-t border-[#E6E4DD] bg-[#FAF8F5] flex items-center justify-between">
            <button
              onClick={onEmptyTrash}
              className="text-xs text-[#DC2626] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar papelera</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs rounded border border-[#E6E4DD] bg-white hover:bg-[#F0EFEA] text-[#171717] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={onRestoreAll}
                className="px-3 py-1.5 text-xs rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar todo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
