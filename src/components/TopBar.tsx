import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  Check,
  FileText,
  Image as ImageIcon,
  FileJson,
  RotateCcw,
  Eye,
  Columns,
  Undo2,
  Redo2,
  ChevronDown,
  Edit2,
  Trash2,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  AlertCircle,
  Loader2,
  CheckCircle2,
  PenTool,
} from 'lucide-react';
import { ViewMode, Wall } from '../types/exhibition';

interface TopBarProps {
  projectName: string;
  subtitle?: string;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  gridActive: boolean;
  onToggleGrid: () => void;
  onFitView: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSaveNow: () => void;
  saveStatus: 'saved' | 'saving' | 'error' | 'pending';
  selectedWall?: Wall;
  unresolvedVerificationsCount: number;
  validationIssuesCount: number;
  trashCount?: number;
  onOpenTrash?: () => void;
  isLeftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  isRightInspectorOpen?: boolean;
  onToggleRightInspector?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onUpdateProjectName: (newName: string) => void;
  onUpdateSubtitle?: (newSubtitle: string) => void;
  onExportWallPdf: () => void;
  onExportAllPdf: () => void;
  onExportPng: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetDefault: () => void;
  onOpenGuidedTest?: () => void;
  testProgress?: { completed: number; total: number };
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  subtitle = 'Estudio Digital de Montaje Expositivo',
  viewMode,
  onSelectViewMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveNow,
  saveStatus,
  selectedWall,
  trashCount = 0,
  onOpenTrash,
  isLeftSidebarOpen = true,
  onToggleLeftSidebar,
  isRightInspectorOpen = true,
  onToggleRightInspector,
  isFullscreen = false,
  onToggleFullscreen,
  onUpdateProjectName,
  onUpdateSubtitle,
  onExportWallPdf,
  onExportAllPdf,
  onExportPng,
  onExportJson,
  onImportJson,
  onResetDefault,
  onOpenGuidedTest,
  testProgress,
}) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectName);
  const [subtitleInput, setSubtitleInput] = useState(subtitle);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateProjectName(titleInput.trim());
    } else {
      setTitleInput(projectName);
    }
    if (onUpdateSubtitle && subtitleInput !== subtitle) {
      onUpdateSubtitle(subtitleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleKeyDownTitle = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitleInput(projectName);
      setSubtitleInput(subtitle);
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4 bg-[#FAF8F5] border-b border-[#E6E4DD] text-[#171717] select-none z-30 shrink-0">
      {/* Zone 1: Sidebar Toggle & Editable Project Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleLeftSidebar && (
          <button
            onClick={onToggleLeftSidebar}
            title={isLeftSidebarOpen ? 'Minimizar panel de sectores (Ctrl+B)' : 'Mostrar panel de sectores'}
            className="p-1.5 rounded hover:bg-[#F0EFEA] text-[#737373] hover:text-[#171717] cursor-pointer transition-colors"
          >
            {isLeftSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-[#2563EB]" />
            )}
          </button>
        )}

        {isEditingTitle ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={titleInput}
              autoFocus
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDownTitle}
              className="text-xs font-semibold px-2 py-1 rounded bg-white border border-[#2563EB] text-[#171717] focus:outline-none w-48"
            />
            <button
              onClick={handleSaveTitle}
              className="px-2 py-1 bg-[#2563EB] text-white text-[10px] font-medium rounded cursor-pointer"
            >
              Guardar
            </button>
          </div>
        ) : (
          <div
            onDoubleClick={() => setIsEditingTitle(true)}
            title="Doble clic para cambiar el nombre del proyecto"
            className="flex items-center gap-1.5 group cursor-pointer"
          >
            <span className="text-sm font-semibold tracking-tight text-[#171717] truncate max-w-[200px] sm:max-w-[280px]">
              {projectName}
            </span>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-1 opacity-0 group-hover:opacity-100 text-[#737373] hover:text-[#171717] rounded hover:bg-[#F0EFEA] transition-opacity cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Zone 2: Primary Navigation Tabs (Plano, Elevación, Inventario) */}
      <nav
        aria-label="Vistas principales"
        className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-medium"
      >
        <button
          onClick={() => onSelectViewMode('plan')}
          className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            viewMode === 'plan'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#737373] hover:text-[#171717]'
          }`}
        >
          Plano
        </button>

        <button
          onClick={() => onSelectViewMode('elevation')}
          className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            viewMode === 'elevation' || viewMode === 'presentation'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#737373] hover:text-[#171717]'
          }`}
        >
          Elevación
        </button>

        <button
          onClick={() => onSelectViewMode('inventory')}
          className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            viewMode === 'inventory' || viewMode === 'compare'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#737373] hover:text-[#171717]'
          }`}
        >
          Inventario
        </button>
      </nav>

      {/* Zone 3: Undo/Redo, Trash, Save Status, Fullscreen, Inspector Toggle & Export */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Undo / Redo Quick Buttons */}
        <div className="hidden md:flex items-center gap-0.5 border-r border-[#E6E4DD] pr-3">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-[#F0EFEA] text-[#737373] hover:text-[#171717] disabled:opacity-25 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Shift+Z)"
            className="p-1.5 rounded hover:bg-[#F0EFEA] text-[#737373] hover:text-[#171717] disabled:opacity-25 cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Trash Icon Button */}
        {onOpenTrash && (
          <button
            onClick={onOpenTrash}
            title={`Papelera temporal (${trashCount} elementos eliminados)`}
            className={`p-1.5 rounded relative cursor-pointer transition-colors ${
              trashCount > 0
                ? 'text-[#737373] hover:text-[#171717] hover:bg-[#F0EFEA]'
                : 'text-[#A3A3A3] hover:text-[#737373] hover:bg-[#F0EFEA]'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {trashCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#2563EB] text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {trashCount > 9 ? '9+' : trashCount}
              </span>
            )}
          </button>
        )}

        {/* Fullscreen Button */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="hidden sm:block p-1.5 rounded hover:bg-[#F0EFEA] text-[#737373] hover:text-[#171717] cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Guided Test Checklist (11 Pasos) */}
        {onOpenGuidedTest && (
          <button
            onClick={onOpenGuidedTest}
            title="Abrir comprobación guiada (11 pasos del protocolo de aceptación)"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-[#E6E4DD] bg-white hover:bg-[#F0EFEA] text-[#171717] transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Verificación</span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#EFECE6] text-[#2563EB]">
              {testProgress ? `${testProgress.completed}/${testProgress.total}` : '0/11'}
            </span>
          </button>
        )}

        {/* Save Status */}
        <button
          onClick={onSaveNow}
          title="Guardado automático activo. Haz clic para forzar guardado inmediato (Ctrl+S)"
          className="text-xs text-[#737373] hover:text-[#171717] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-[#2563EB] animate-spin" />
              <span className="hidden sm:inline">Guardando...</span>
            </>
          ) : saveStatus === 'error' ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
              <span className="hidden sm:inline text-[#DC2626]">Error</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Guardado</span>
            </>
          )}
        </button>

        {/* Export Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setExportMenuOpen((v) => !v)}
            className="px-3 sm:px-3.5 py-1.5 text-xs font-medium bg-[#2563EB] text-white rounded hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Exportar</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {exportMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setExportMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E6E4DD] rounded shadow-md py-1.5 z-50 text-xs text-[#171717]">
                <div className="px-3.5 py-1.5 text-[11px] text-[#737373] border-b border-[#F0EFEA]">
                  Exportación y documentos
                </div>

                {selectedWall && (
                  <button
                    onClick={() => {
                      setExportMenuOpen(false);
                      onExportWallPdf();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">
                      Ficha PDF · {selectedWall.name}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    onExportAllPdf();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>Catálogo PDF completo</span>
                </button>

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    onExportPng();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>Descargar vista en PNG</span>
                </button>

                <div className="my-1 border-t border-[#F0EFEA]" />

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    onExportJson();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>Guardar archivo de proyecto (.JSON)</span>
                </button>

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>Cargar proyecto (.JSON)</span>
                </button>

                <div className="my-1 border-t border-[#F0EFEA]" />

                <div className="px-3.5 py-1 text-[11px] text-[#737373]">
                  Vistas de apoyo
                </div>

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    onSelectViewMode('presentation');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>Modo presentación limpia</span>
                </button>

                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    onSelectViewMode('compare');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 cursor-pointer"
                >
                  <Columns className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span>Comparar propuestas de montaje</span>
                </button>

                <div className="border-t border-[#F0EFEA] pt-1">
                  <button
                    onClick={() => {
                      setExportMenuOpen(false);
                      onResetDefault();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] flex items-center gap-2.5 text-[#737373] hover:text-[#171717] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Restaurar plano original</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportJson(file);
                e.target.value = '';
              }
            }}
          />
        </div>

        {/* Right Inspector Toggle */}
        {onToggleRightInspector && (
          <button
            onClick={onToggleRightInspector}
            title={isRightInspectorOpen ? 'Minimizar inspector de propiedades' : 'Mostrar inspector de propiedades'}
            className="p-1.5 rounded hover:bg-[#F0EFEA] text-[#737373] hover:text-[#171717] cursor-pointer transition-colors"
          >
            {isRightInspectorOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-[#2563EB]" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
