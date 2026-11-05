import React, { useRef, useState } from 'react';
import {
  Search,
  Upload,
  Plus,
  Package,
  Layers,
  Sparkles,
  Info,
  X,
  FileArchive,
  Check,
} from 'lucide-react';
import {
  GraphicResource,
  GraphicResourceCategory,
  LayerKey,
} from '../types/exhibition';
import {
  GRAPHIC_CATEGORIES,
  extractZipGraphicResources,
  guessCategoryFromFilename,
  saveGraphicResourcesToDB,
} from '../data/graphicLibrary';

interface GraphicLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resources: GraphicResource[];
  onAddResourceToWall: (resource: GraphicResource) => void;
  onAddResourceToPlan?: (resource: GraphicResource) => void;
  onImportResources: (newResources: GraphicResource[]) => void;
  activeLayerFilter?: LayerKey | null;
  defaultMode?: 'plan' | 'elevation';
}

export const GraphicLibraryDrawer: React.FC<GraphicLibraryDrawerProps> = ({
  isOpen,
  onClose,
  resources,
  onAddResourceToWall,
  onAddResourceToPlan,
  onImportResources,
  defaultMode = 'elevation',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GraphicResourceCategory | 'all'>('all');
  const [selectedGallery, setSelectedGallery] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Quick Custom Block Creator (Mesa, Cuadrado decorativo, Repisa)
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [customName, setCustomName] = useState('Cuadrado de decoración');
  const [customCategory, setCustomCategory] = useState<GraphicResourceCategory>('decor_squares');
  const [customWidthCm, setCustomWidthCm] = useState(80);
  const [customDepthCm, setCustomDepthCm] = useState(80);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Extract unique galleries from resources
  const availableGalleries = React.useMemo(() => {
    const map = new Map<string, number>();
    resources.forEach((res) => {
      const gName = res.galleryName || 'Colección General';
      map.set(gName, (map.get(gName) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [resources]);

  if (!isOpen) return null;

  // Filter resources by gallery, category, and search query
  const filteredResources = resources.filter((res) => {
    const resGallery = res.galleryName || 'Colección General';
    const matchesGallery =
      selectedGallery === 'all' || resGallery === selectedGallery;
    const matchesCategory =
      selectedCategory === 'all' || res.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      res.name.toLowerCase().includes(q) ||
      resGallery.toLowerCase().includes(q) ||
      res.tags?.some((t) => t.toLowerCase().includes(q)) ||
      res.sourceLicense.toLowerCase().includes(q);
    return matchesGallery && matchesCategory && matchesQuery;
  });

  const handleCreateCustomBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const template =
      resources.find((r) => r.category === customCategory) || resources[0];
    const newRes: GraphicResource = {
      id: `res-custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      previewUrl: template?.previewUrl || '',
      fileDataUrl: template?.fileDataUrl || template?.previewUrl || '',
      planSvgUrl: template?.planSvgUrl || template?.previewUrl || '',
      fileType: 'svg',
      sourceLicense: 'Bloque personalizado · Banco Virtual CAD',
      defaultWidthCm: Math.max(15, Number(customWidthCm) || 80),
      defaultHeightCm: customCategory === 'shelves' ? 45 : 80,
      defaultDepthCm: Math.max(15, Number(customDepthCm) || 80),
      tags: [customCategory, customName.toLowerCase(), 'personalizado'],
      isVector: true,
      galleryName: 'Banco Virtual CAD y Decoración',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onImportResources([newRes]);
    if (defaultMode === 'plan' && onAddResourceToPlan) {
      onAddResourceToPlan(newRes);
    } else {
      onAddResourceToWall(newRes);
    }
    setShowCustomCreator(false);
    setImportNotification(`«${newRes.name}» creado y añadido`);
    setTimeout(() => setImportNotification(null), 3000);
  };

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    const newItems: GraphicResource[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lower = file.name.toLowerCase();

      // If it's a zip file, extract it
      if (lower.endsWith('.zip')) {
        try {
          const extracted = await extractZipGraphicResources(file);
          newItems.push(...extracted);
        } catch (err) {
          console.error('Error extracting zip:', err);
        }
        continue;
      }

      // Read image file
      const isSvg = lower.endsWith('.svg');
      const isPng = lower.endsWith('.png');
      const isJpg = lower.endsWith('.jpg') || lower.endsWith('.jpeg');
      const isWebp = lower.endsWith('.webp');

      if (!isSvg && !isPng && !isJpg && !isWebp) continue;

      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const category = guessCategoryFromFilename(cleanName);
      let fileType: 'svg' | 'png' | 'jpg' | 'webp' = 'png';
      if (isSvg) fileType = 'svg';
      else if (isJpg) fileType = 'jpg';
      else if (isWebp) fileType = 'webp';

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const dataUrl = reader.result;
            let dw = 80;
            let dh = 80;
            if (category.startsWith('people')) {
              dw = 50;
              dh = 170;
            } else if (category === 'vitrines') {
              dw = 100;
              dh = 140;
            } else if (category === 'furniture' || category === 'shelves') {
              dw = 120;
              dh = 45;
            }

            newItems.push({
              id: `res-upload-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
              name: cleanName,
              category,
              previewUrl: dataUrl,
              fileDataUrl: dataUrl,
              planSvgUrl: dataUrl,
              fileType,
              sourceLicense: `Importado: ${file.name}`,
              defaultWidthCm: dw,
              defaultHeightCm: dh,
              defaultDepthCm: dw,
              tags: [category, fileType, cleanName.toLowerCase()],
              isVector: fileType === 'svg',
              defaultTintColor: fileType === 'svg' ? '#171717' : undefined,
              createdAt: new Date().toISOString().slice(0, 10),
            });
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    if (newItems.length > 0) {
      onImportResources(newItems);
      saveGraphicResourcesToDB(newItems);
      setImportNotification(`${newItems.length} recurso(s) importado(s) correctamente`);
      setTimeout(() => setImportNotification(null), 3500);
    }

    setIsImporting(false);
    e.target.value = '';
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute top-11 right-0 bottom-0 w-88 bg-white border-l border-[#E6E4DD] shadow-xl z-30 flex flex-col text-[#171717]"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#E6E4DD] flex items-center justify-between bg-[#FAF8F5]">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#2563EB]" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
              Banco Virtual CAD y Decoración
            </h3>
            <p className="text-[10px] text-[#737373]">
              Mesas de restaurante, cuadrados decorativos, repisas y escalas
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#737373] hover:text-[#171717] hover:bg-[#E6E4DD]/50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Import Notification Banner */}
      {importNotification && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-xs flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{importNotification}</span>
        </div>
      )}

      {/* Search Input & Action Buttons */}
      <div className="p-3 border-b border-[#E6E4DD] space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar mesa, cuadrado, repisa, planta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded bg-[#FAF8F5] border border-[#E6E4DD] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        {/* Gallery Selector Dropdown */}
        {availableGalleries.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-semibold text-[#737373] shrink-0">Colección:</span>
            <select
              value={selectedGallery}
              onChange={(e) => setSelectedGallery(e.target.value)}
              className="flex-1 px-2 py-1 text-xs rounded bg-[#FAF8F5] border border-[#E6E4DD] text-[#171717] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="all">Todas las colecciones ({resources.length})</option>
              {availableGalleries.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name} ({g.count})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCustomCreator((v) => !v)}
            className="flex-1 py-1.5 px-2 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>+ Bloque a medida</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="py-1.5 px-2 rounded bg-[#FAF8F5] hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
            title="Importar archivos SVG/PNG/JPG"
          >
            <Upload className="w-3 h-3 text-[#2563EB]" />
            <span>Subir</span>
          </button>

          <button
            onClick={() => zipInputRef.current?.click()}
            disabled={isImporting}
            title="Importar paquete ZIP con gráficos SVG/PNG/JPG/WEBP"
            className="py-1.5 px-2 rounded bg-[#FAF8F5] hover:bg-[#F0EFEA] border border-[#E6E4DD] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <FileArchive className="w-3 h-3 text-[#D97706]" />
            <span>ZIP</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.webp,.zip"
            multiple
            className="hidden"
            onChange={handleFilesUpload}
          />

          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={handleFilesUpload}
          />
        </div>

        {/* Inline Custom Block Creator */}
        {showCustomCreator && (
          <form
            onSubmit={handleCreateCustomBlock}
            className="p-2.5 rounded-lg bg-[#FAF8F5] border border-blue-200 space-y-2 text-xs"
          >
            <div className="font-semibold text-[#2563EB] flex items-center justify-between">
              <span>Crear elemento a medida</span>
              <button
                type="button"
                onClick={() => setShowCustomCreator(false)}
                className="text-[#737373] hover:text-[#171717]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <label className="block text-[10px] text-[#737373] mb-0.5">Tipo de elemento</label>
              <select
                value={customCategory}
                onChange={(e) => {
                  const cat = e.target.value as GraphicResourceCategory;
                  setCustomCategory(cat);
                  if (cat === 'restaurant_tables') {
                    setCustomName('Mesa de restaurante');
                    setCustomWidthCm(90);
                    setCustomDepthCm(90);
                  } else if (cat === 'decor_squares') {
                    setCustomName('Cuadrado con decoración');
                    setCustomWidthCm(80);
                    setCustomDepthCm(80);
                  } else if (cat === 'shelves') {
                    setCustomName('Repisa con decoración');
                    setCustomWidthCm(120);
                    setCustomDepthCm(30);
                  } else {
                    setCustomName('Elemento decorativo');
                    setCustomWidthCm(70);
                    setCustomDepthCm(70);
                  }
                }}
                className="w-full px-2 py-1 rounded bg-white border border-[#E6E4DD] text-xs"
              >
                <option value="decor_squares">Cuadrado donde hay decoración</option>
                <option value="restaurant_tables">Mesa de restaurante / cafetería</option>
                <option value="shelves">Repisa / Estantería</option>
                <option value="decor">Decoración / Planta / Macetero</option>
                <option value="furniture">Mobiliario / Sillón / Banca</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#737373] mb-0.5">Nombre / Etiqueta</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-2 py-1 rounded bg-white border border-[#E6E4DD] text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#737373] mb-0.5">Ancho (cm)</label>
                <input
                  type="number"
                  min={15}
                  max={600}
                  value={customWidthCm}
                  onChange={(e) => setCustomWidthCm(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-white border border-[#E6E4DD] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#737373] mb-0.5">Fondo / Largo (cm)</label>
                <input
                  type="number"
                  min={15}
                  max={600}
                  value={customDepthCm}
                  onChange={(e) => setCustomDepthCm(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-white border border-[#E6E4DD] text-xs font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs cursor-pointer"
            >
              Crear e insertar ahora
            </button>
          </form>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="px-3 py-2 border-b border-[#E6E4DD] overflow-x-auto flex items-center gap-1 bg-[#FAF8F5]">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#2563EB] text-white font-medium'
              : 'text-[#737373] hover:text-[#171717]'
          }`}
        >
          Todos ({resources.length})
        </button>
        {GRAPHIC_CATEGORIES.map((cat) => {
          const count = resources.filter((r) => r.category === cat.id).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#2563EB] text-white font-medium'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              {cat.shortName} ({count})
            </button>
          );
        })}
      </div>

      {/* Resources Grid View */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredResources.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#737373] space-y-2">
            <Info className="w-6 h-6 mx-auto opacity-50" />
            <p>No se encontraron elementos en esta categoría.</p>
            <p className="text-[11px]">
              Usa el botón «+ Bloque a medida» o importa tus propios archivos SVG/PNG.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                className="group border border-[#E6E4DD] rounded-lg bg-white hover:border-[#2563EB] transition-all flex flex-col justify-between overflow-hidden text-left shadow-2xs"
              >
                {/* Visual Preview Box */}
                <div className="aspect-4/3 bg-[#FAF8F5] relative flex items-center justify-center p-2 overflow-hidden border-b border-[#F0EFEA]">
                  <img
                    src={defaultMode === 'plan' ? res.planSvgUrl || res.previewUrl : res.previewUrl}
                    alt={res.name}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain pointer-events-none"
                    style={{
                      color: res.defaultTintColor || '#171717',
                    }}
                  />
                </div>

                {/* Metadata & Action Buttons */}
                <div className="p-2 space-y-1.5">
                  <div>
                    <div className="text-[11px] font-semibold text-[#171717] leading-tight line-clamp-2" title={res.name}>
                      {res.name}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#737373] font-mono tabular-nums mt-0.5">
                      <span>
                        {res.defaultWidthCm} × {res.defaultDepthCm || res.defaultHeightCm} cm
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pt-0.5">
                    {onAddResourceToPlan && (
                      <button
                        onClick={() => onAddResourceToPlan(res)}
                        className="flex-1 py-1 px-1.5 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[10px] font-semibold flex items-center justify-center gap-0.5 cursor-pointer transition-colors"
                        title="Colocar libremente en el plano 2D"
                      >
                        <Plus className="w-3 h-3" />
                        <span>En Planta</span>
                      </button>
                    )}
                    <button
                      onClick={() => onAddResourceToWall(res)}
                      className={`${
                        onAddResourceToPlan
                          ? 'py-1 px-1.5 bg-[#FAF8F5] hover:bg-[#F0EFEA] text-[#171717] border border-[#E6E4DD]'
                          : 'w-full py-1 px-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                      } rounded text-[10px] font-medium flex items-center justify-center gap-0.5 cursor-pointer transition-colors`}
                      title="Montar sobre el muro seleccionado en elevación"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{onAddResourceToPlan ? 'Muro' : 'Añadir al muro'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#E6E4DD] bg-[#FAF8F5] text-[11px] text-[#737373] flex items-center justify-between">
        <span>Planta CAD + Elevación</span>
        <span className="font-mono">{filteredResources.length} bloques</span>
      </div>
    </div>
  );
};
