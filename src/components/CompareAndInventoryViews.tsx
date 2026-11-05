import React, { useState } from 'react';
import {
  Camera,
  Download,
  FileText,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import {
  ExhibitionProject,
  ProposalSnapshot,
  Wall,
  WallItem,
} from '../types/exhibition';

interface CompareViewProps {
  project: ExhibitionProject;
  selectedWallId: string | null;
  onSelectWallId: (wallId: string) => void;
  onCreateSnapshot: (name: string, description: string) => void;
  onApplySnapshot: (snapshot: ProposalSnapshot) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  project,
  selectedWallId,
  onSelectWallId,
  onCreateSnapshot,
  onApplySnapshot,
}) => {
  const activeWall =
    project.walls.find((w) => w.id === selectedWallId) || project.walls[2];
  const [leftSnapId, setLeftSnapId] = useState<string>(
    project.snapshots[0]?.id || 'current'
  );
  const [rightSnapId, setRightSnapId] = useState<string>('current');
  const [newSnapName, setNewSnapName] = useState('');

  const getItemsForSide = (snapId: string, wallId: string): WallItem[] => {
    if (snapId === 'current') {
      return project.items.filter((i) => i.wallId === wallId && i.visible);
    }
    const snap = project.snapshots.find((s) => s.id === snapId);
    return (snap?.items || []).filter((i) => i.wallId === wallId && i.visible);
  };

  const leftItems = getItemsForSide(leftSnapId, activeWall.id);
  const rightItems = getItemsForSide(rightSnapId, activeWall.id);

  const renderMiniElevation = (
    title: string,
    wall: Wall,
    wallItems: WallItem[]
  ) => {
    const wCm = wall.lengthM * 100;
    const hCm = wall.heightM * 100;

    return (
      <div className="flex-1 rounded border border-[#E6E4DD] bg-white p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-2 text-xs">
          <span className="font-medium text-[#171717]">{title}</span>
          <span className="font-mono text-[#737373]">
            {wallItems.length} obras
          </span>
        </div>

        <div className="flex-1 min-h-[240px] flex items-center justify-center bg-[#FAF8F5] rounded p-4">
          <svg
            viewBox={`-20 -20 ${wCm + 40} ${hCm + 40}`}
            className="w-full h-full max-h-[300px]"
          >
            <rect
              x={0}
              y={0}
              width={wCm}
              height={hCm}
              fill="#FFFFFF"
              stroke="#171717"
              strokeWidth="1.5"
            />
            {wallItems.map((it) => (
              <g
                key={it.id}
                transform={`translate(${it.xCm}, ${hCm - it.yCm - it.heightCm})`}
              >
                <rect
                  width={it.widthCm}
                  height={it.heightCm}
                  fill="#FAF8F5"
                  stroke="#171717"
                  strokeWidth="1.5"
                />
                {it.imageUrl && (
                  <image
                    href={it.imageUrl}
                    x={2}
                    y={2}
                    width={Math.max(2, it.widthCm - 4)}
                    height={Math.max(2, it.heightCm - 4)}
                    preserveAspectRatio="none"
                  />
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 bg-[#FAF8F5] text-[#171717]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E4DD] pb-4">
        <h1 className="text-base font-semibold">
          Comparar propuestas — {activeWall.name}
        </h1>

        <select
          value={activeWall.id}
          onChange={(e) => onSelectWallId(e.target.value)}
          className="px-3 py-1.5 rounded text-xs bg-white border border-[#E6E4DD]"
        >
          {project.walls.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.participant})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2 flex flex-col">
          <select
            value={leftSnapId}
            onChange={(e) => setLeftSnapId(e.target.value)}
            className="px-2.5 py-1.5 rounded text-xs bg-white border border-[#E6E4DD]"
          >
            <option value="current">Montaje actual</option>
            {project.snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {renderMiniElevation(
            leftSnapId === 'current'
              ? 'Montaje actual'
              : project.snapshots.find((s) => s.id === leftSnapId)?.name || '',
            activeWall,
            leftItems
          )}
        </div>

        <div className="space-y-2 flex flex-col">
          <select
            value={rightSnapId}
            onChange={(e) => setRightSnapId(e.target.value)}
            className="px-2.5 py-1.5 rounded text-xs bg-white border border-[#E6E4DD]"
          >
            <option value="current">Montaje actual</option>
            {project.snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {renderMiniElevation(
            rightSnapId === 'current'
              ? 'Montaje actual'
              : project.snapshots.find((s) => s.id === rightSnapId)?.name || '',
            activeWall,
            rightItems
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-[#E6E4DD] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nombre de nueva propuesta..."
            value={newSnapName}
            onChange={(e) => setNewSnapName(e.target.value)}
            className="px-3 py-1.5 text-xs rounded bg-white border border-[#E6E4DD]"
          />
          <button
            onClick={() => {
              if (!newSnapName.trim()) return;
              onCreateSnapshot(newSnapName.trim(), 'Propuesta guardada');
              setNewSnapName('');
            }}
            className="px-3.5 py-1.5 rounded bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Guardar propuesta actual</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {project.snapshots.map((snap) => (
            <button
              key={snap.id}
              onClick={() => onApplySnapshot(snap)}
              className="px-2.5 py-1 rounded text-xs bg-white border border-[#E6E4DD] hover:border-[#2563EB] cursor-pointer"
            >
              Cargar {snap.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface InventoryViewProps {
  project: ExhibitionProject;
  onOpenWallElevation: (wallId: string) => void;
  onExportWallPdf: (wall: Wall) => void;
  onExportAllPdf: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  project,
  onOpenWallElevation,
  onExportWallPdf,
  onExportAllPdf,
}) => {
  const [participantFilter, setParticipantFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const wallMap = new Map<string, Wall>();
  project.walls.forEach((w) => wallMap.set(w.id, w));

  const participants = Array.from(
    new Set(project.zones.map((z) => z.participant))
  );

  const filteredItems = project.items.filter((item) => {
    const wall = wallMap.get(item.wallId);
    const matchesParticipant =
      participantFilter === 'all' || wall?.participant === participantFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${item.widthCm}x${item.heightCm}`.includes(searchQuery.toLowerCase());
    return matchesParticipant && matchesSearch;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 bg-[#FAF8F5] text-[#171717]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E4DD] pb-4">
        <div>
          <h1 className="text-base font-semibold text-[#171717]">
            Inventario de obras y fichas técnicas ({filteredItems.length})
          </h1>
        </div>

        <button
          onClick={onExportAllPdf}
          className="px-3.5 py-1.5 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar catálogo PDF</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setParticipantFilter('all')}
            className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
              participantFilter === 'all'
                ? 'bg-[#2563EB] text-white font-medium'
                : 'text-[#737373] hover:text-[#171717]'
            }`}
          >
            Todos ({project.items.length})
          </button>
          {participants.map((p) => (
            <button
              key={p}
              onClick={() => setParticipantFilter(p)}
              className={`px-3 py-1 rounded text-xs transition-colors whitespace-nowrap cursor-pointer ${
                participantFilter === p
                  ? 'bg-[#2563EB] text-white font-medium'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="relative w-60">
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar obra o medida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded bg-white border border-[#E6E4DD]"
          />
        </div>
      </div>

      {/* Minimalist Table */}
      <div className="rounded border border-[#E6E4DD] overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E6E4DD] bg-[#FAF8F5] text-[#737373] font-normal">
              <th className="py-2.5 px-3">Código</th>
              <th className="py-2.5 px-3">Obra</th>
              <th className="py-2.5 px-3">Participante</th>
              <th className="py-2.5 px-3">Muro</th>
              <th className="py-2.5 px-3 text-right">Dimensiones</th>
              <th className="py-2.5 px-3 text-right">Posición (X, Y)</th>
              <th className="py-2.5 px-3">Marco</th>
              <th className="py-2.5 px-3 text-right">Ficha / Vista</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EFEA]">
            {filteredItems.map((item) => {
              const wall = wallMap.get(item.wallId);
              return (
                <tr key={item.id} className="hover:bg-[#FAF8F5]">
                  <td className="py-2.5 px-3 font-mono text-[#737373] tabular-nums">
                    {item.code}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#171717]">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 text-[#737373]">
                    {wall?.participant || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-[#737373]">
                    {wall?.name || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#DC2626]">
                    {item.widthCm} × {item.heightCm} cm
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#737373]">
                    {item.xCm.toFixed(0)} · {item.yCm.toFixed(0)} cm
                  </td>
                  <td className="py-2.5 px-3 text-[#737373]">
                    {item.frameStyle}
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-3">
                    {wall && (
                      <button
                        onClick={() => onExportWallPdf(wall)}
                        title="Descargar ficha PDF del muro"
                        className="inline-flex items-center gap-1 text-[#737373] hover:text-[#171717] cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    )}
                    <button
                      onClick={() => onOpenWallElevation(item.wallId)}
                      className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-medium cursor-pointer"
                    >
                      <span>Abrir</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
