import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Layers,
  Map,
  Square,
  Users,
  Compass,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  ExhibitionProject,
  Wall,
  Zone,
  WallItem,
  PresentationModeKind,
} from '../types/exhibition';
import { ElevationCanvas } from './ElevationCanvas';
import { MultiWallElevationCanvas } from './MultiWallElevationCanvas';
import { FloorPlanCanvas } from './FloorPlanCanvas';

interface ArtistGroup {
  artist: string;
  walls: Wall[];
  totalArtworks: number;
}

interface ExhibitionPresentationViewProps {
  project: ExhibitionProject;
  activeWallId: string | null;
  activeZoneId: string | null;
  initialMode?: PresentationModeKind;
  onExit: () => void;
  onSelectWall: (wallId: string) => void;
}

export const ExhibitionPresentationView: React.FC<ExhibitionPresentationViewProps> = ({
  project,
  activeWallId,
  activeZoneId,
  initialMode = 'single_wall',
  onExit,
  onSelectWall,
}) => {
  const [mode, setMode] = useState<PresentationModeKind>(initialMode);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Identify all active artists with mounted artworks
  const artistsWithArtworks: ArtistGroup[] = useMemo(() => {
    const artistMap: Record<string, Wall[]> = {};
    project.walls.forEach((w) => {
      const artCount = project.items.filter(
        (it) =>
          it.wallId === w.id &&
          it.visible &&
          (it.type === 'photo' || it.type === 'frame' || it.category === 'artworks')
      ).length;
      if (artCount > 0 && w.participant) {
        if (!artistMap[w.participant]) artistMap[w.participant] = [];
        artistMap[w.participant].push(w);
      }
    });
    return Object.entries(artistMap).map(([artist, walls]): ArtistGroup => ({
      artist,
      walls,
      totalArtworks: walls.reduce((sum: number, w: Wall) => {
        return (
          sum +
          project.items.filter(
            (it) =>
              it.wallId === w.id &&
              it.visible &&
              (it.type === 'photo' || it.type === 'frame' || it.category === 'artworks')
          ).length
        );
      }, 0),
    }));
  }, [project.walls, project.items]);

  // Selected artist for multi-wall mode
  const currentWall = useMemo(() => {
    return project.walls.find((w) => w.id === activeWallId) || project.walls[0];
  }, [project.walls, activeWallId]);

  const [selectedArtist, setSelectedArtist] = useState<string>(() => {
    return (
      currentWall?.participant ||
      artistsWithArtworks[0]?.artist ||
      'Andrea'
    );
  });

  // Guided Tour sequence: ordered spaces and walls with artworks
  const tourSequence = useMemo(() => {
    const list: {
      id: string;
      title: string;
      subtitle: string;
      type: 'wall' | 'zone';
      wall?: Wall;
      zone?: Zone;
    }[] = [];

    // Order zones by zone.order or appearance
    const sortedZones = [...project.zones].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    sortedZones.forEach((z) => {
      const zoneWalls = project.walls.filter(
        (w) =>
          w.zoneId === z.id &&
          project.items.some(
            (it) =>
              it.wallId === w.id &&
              it.visible &&
              (it.type === 'photo' || it.type === 'frame' || it.category === 'artworks')
          )
      );

      zoneWalls.forEach((w) => {
        const artCount = project.items.filter(
          (it) =>
            it.wallId === w.id &&
            it.visible &&
            (it.type === 'photo' || it.type === 'frame' || it.category === 'artworks')
        ).length;
        list.push({
          id: w.id,
          title: w.name,
          subtitle: `${z.name} · ${w.participant} (${artCount} obras)`,
          type: 'wall',
          wall: w,
          zone: z,
        });
      });
    });

    return list;
  }, [project.zones, project.walls, project.items]);

  const [tourIndex, setTourIndex] = useState(0);

  // Sync active wall with tour when in guided tour mode
  useEffect(() => {
    if (mode === 'guided_tour' && tourSequence[tourIndex]?.wall) {
      onSelectWall(tourSequence[tourIndex].wall!.id);
    }
  }, [mode, tourIndex, tourSequence, onSelectWall]);

  // Keyboard navigation & Fullscreen handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onExit();
        }
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, tourIndex, tourSequence, onExit]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleNext = () => {
    if (mode === 'guided_tour') {
      setTourIndex((idx) => (idx + 1) % Math.max(1, tourSequence.length));
    } else if (mode === 'single_wall') {
      const wallsWithArt = project.walls.filter((w) =>
        project.items.some(
          (it) =>
            it.wallId === w.id &&
            it.visible &&
            (it.type === 'photo' || it.type === 'frame' || it.category === 'artworks')
        )
      );
      const curIdx = wallsWithArt.findIndex((w) => w.id === currentWall?.id);
      const nextWall = wallsWithArt[(curIdx + 1) % wallsWithArt.length];
      if (nextWall) onSelectWall(nextWall.id);
    } else if (mode === 'multi_wall') {
      const artIdx = artistsWithArtworks.findIndex((a) => a.artist === selectedArtist);
      const nextArtist = artistsWithArtworks[(artIdx + 1) % artistsWithArtworks.length];
      if (nextArtist) setSelectedArtist(nextArtist.artist);
    }
  };

  const handlePrev = () => {
    if (mode === 'guided_tour') {
      setTourIndex((idx) => (idx - 1 + tourSequence.length) % Math.max(1, tourSequence.length));
    } else if (mode === 'single_wall') {
      const wallsWithArt = project.walls.filter((w) =>
        project.items.some(
          (it) =>
            it.wallId === w.id &&
            it.visible &&
            (it.type === 'photo' || it.type === 'frame' || it.category === 'artworks')
        )
      );
      const curIdx = wallsWithArt.findIndex((w) => w.id === currentWall?.id);
      const prevWall =
        wallsWithArt[(curIdx - 1 + wallsWithArt.length) % wallsWithArt.length];
      if (prevWall) onSelectWall(prevWall.id);
    } else if (mode === 'multi_wall') {
      const artIdx = artistsWithArtworks.findIndex((a) => a.artist === selectedArtist);
      const prevArtist =
        artistsWithArtworks[
          (artIdx - 1 + artistsWithArtworks.length) % artistsWithArtworks.length
        ];
      if (prevArtist) setSelectedArtist(prevArtist.artist);
    }
  };

  // Artist's walls for multi-wall presentation
  const artistWalls = useMemo(() => {
    return project.walls.filter(
      (w) =>
        w.participant === selectedArtist &&
        project.items.some(
          (it) =>
            it.wallId === w.id &&
            it.visible &&
            (it.type === 'photo' || it.type === 'frame' || it.category === 'artworks')
        )
    );
  }, [project.walls, project.items, selectedArtist]);

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F5F0] flex flex-col overflow-hidden select-none">
      {/* Top Subtle Exit Button (Discreet) */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-white/80 hover:bg-white text-[#525252] hover:text-[#171717] shadow-sm backdrop-blur-xs transition-colors cursor-pointer"
          title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onExit}
          className="p-2 rounded-full bg-white/80 hover:bg-white text-[#525252] hover:text-[#171717] shadow-sm backdrop-blur-xs transition-colors cursor-pointer"
          title="Salir de la presentación (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Exhibition Viewport */}
      <div className="relative flex-1 overflow-hidden">
        {mode === 'single_wall' || mode === 'guided_tour' ? (
          currentWall ? (
            <ElevationCanvas
              svgRef={{ current: null }}
              wall={currentWall}
              allWalls={project.walls}
              items={project.items}
              zones={project.zones}
              isDark={false}
              layers={{
                walls: true,
                dimensions: false,
                participants: true,
                photos: true,
                texts: true,
                decor: true,
                grid: false,
                guides: false,
                referenceOverlay: false,
              }}
              selectedItemIds={[]}
              validationIssues={[]}
              isPresentationMode={true}
              onBackToPlan={onExit}
              onSwitchWall={onSelectWall}
              onSelectItem={() => {}}
              onClearSelection={() => {}}
              onUpdateItem={() => {}}
              onAddItem={() => {}}
              onDuplicateSelected={() => {}}
              onDeleteSelected={() => {}}
              onDistributeUniformH={() => {}}
              onDistributeFixedSpacing={() => {}}
              onDistributeUniformV={() => {}}
              onAlignItems={() => {}}
              onAutoFixWall={() => {}}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-[#737373]">
              No hay muro seleccionado para presentar.
            </div>
          )
        ) : mode === 'multi_wall' ? (
          artistWalls.length > 0 ? (
            <MultiWallElevationCanvas
              walls={artistWalls}
              allWalls={project.walls}
              items={project.items}
              zones={project.zones}
              artistName={selectedArtist}
              isPresentationMode={true}
              selectedItemIds={[]}
              onSelectItem={() => {}}
              onClearSelection={() => {}}
              onUpdateItem={() => {}}
              onBackToSingleWall={() => setMode('single_wall')}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-[#737373]">
              No se encontraron muros con obras para este artista.
            </div>
          )
        ) : (
          /* Clean Floor Plan Presentation */
          <FloorPlanCanvas
            svgRef={{ current: null }}
            zones={project.zones}
            vertices={project.vertices}
            walls={project.walls}
            items={project.items}
            layers={{
              walls: true,
              dimensions: false,
              participants: true,
              photos: true,
              texts: true,
              decor: true,
              grid: false,
              guides: false,
              referenceOverlay: false,
            }}
            backgroundPlan={project.backgroundPlan}
            verifications={[]}
            validationIssues={[]}
            referenceOpacity={0.8}
            focusZoneTrigger={null}
            fitTrigger={0}
            selectedWallId={activeWallId}
            selectedItemIds={[]}
            isDark={false}
            onSelectWall={(wId) => {
              if (wId) onSelectWall(wId);
            }}
            onSelectItem={() => {}}
            onSelectMultiple={() => {}}
            onMoveVertex={() => {}}
            onUpdateZoneLabelPosition={() => {}}
            onCopyItem={() => {}}
            onPasteItem={() => {}}
            onDuplicateSelected={() => {}}
            onDeleteSelected={() => {}}
            onPromptDeleteWall={() => {}}
            onFlipWallDirection={() => {}}
            onFlipItemDirection={() => {}}
            onToggleLockSelected={() => {}}
            selectedZoneIds={activeZoneId ? [activeZoneId] : []}
            onSelectZone={() => {}}
            onMoveWall={() => {}}
            onMoveZones={() => {}}
            onToggleReferenceVisible={() => {}}
            onUpdateBackgroundPlan={() => {}}
            onDeleteBackgroundImage={() => {}}
            onUploadReferenceImage={() => {}}
            planElements={project.planElements || []}
            selectedPlanElementId={null}
            onSelectPlanElement={() => {}}
            onUpdatePlanElement={() => {}}
            onDeletePlanElement={() => {}}
            graphicResources={project.graphicLibrary || []}
            onPlaceGraphicResourceInPlan={() => {}}
            onMountGraphicResourceOnWall={() => {}}
          />
        )}
      </div>

      {/* Floating Translucent Control Bar at Bottom */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-[#E6E4DD] shadow-lg backdrop-blur-md text-xs text-[#171717]">
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="p-1 rounded-full hover:bg-[#F0EFEA] text-[#525252] hover:text-[#171717] cursor-pointer transition-colors"
          title="Anterior (Flecha izquierda)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Current Target Title Pill */}
        <div className="px-3 py-0.5 text-center min-w-[200px] max-w-[320px]">
          <div className="font-semibold text-xs text-[#171717] truncate">
            {mode === 'guided_tour'
              ? tourSequence[tourIndex]?.title || 'Recorrido'
              : mode === 'multi_wall'
              ? `Conjunto: ${selectedArtist} (${artistWalls.length} muros)`
              : mode === 'plan'
              ? 'Plano general de la exposición'
              : currentWall?.name || 'Muro'}
          </div>
          <div className="text-[10px] text-[#737373] truncate">
            {mode === 'guided_tour'
              ? `Paso ${tourIndex + 1} de ${tourSequence.length} · ${
                  tourSequence[tourIndex]?.subtitle || ''
                }`
              : mode === 'multi_wall'
              ? `${artistWalls.reduce(
                  (sum, w) =>
                    sum +
                    project.items.filter(
                      (it) =>
                        it.wallId === w.id &&
                        it.visible &&
                        (it.type === 'photo' ||
                          it.type === 'frame' ||
                          it.category === 'artworks')
                    ).length,
                  0
                )} obras montadas en total`
              : mode === 'plan'
              ? `${project.zones.length} sectores arquitectónicos`
              : `${currentWall?.participant || ''} · ${
                  currentWall?.lengthM.toFixed(2) || ''
                } m`}
          </div>
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          className="p-1 rounded-full hover:bg-[#F0EFEA] text-[#525252] hover:text-[#171717] cursor-pointer transition-colors"
          title="Siguiente (Flecha derecha / Espacio)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#E6E4DD] mx-1" />

        {/* Mode Selector Segmented Buttons */}
        <div className="flex items-center bg-[#F0EFEA] p-0.5 rounded-full text-[11px]">
          <button
            type="button"
            onClick={() => setMode('single_wall')}
            className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
              mode === 'single_wall'
                ? 'bg-white text-[#2563EB] font-semibold shadow-2xs'
                : 'text-[#737373] hover:text-[#171717]'
            }`}
            title="Presentar muro individual proporcionalmente"
          >
            Muro
          </button>

          <button
            type="button"
            onClick={() => setMode('multi_wall')}
            className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
              mode === 'multi_wall'
                ? 'bg-white text-[#2563EB] font-semibold shadow-2xs'
                : 'text-[#737373] hover:text-[#171717]'
            }`}
            title="Presentar conjunto de muros del artista"
          >
            Conjunto
          </button>

          <button
            type="button"
            onClick={() => setMode('guided_tour')}
            className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer flex items-center gap-1 ${
              mode === 'guided_tour'
                ? 'bg-white text-emerald-700 font-semibold shadow-2xs'
                : 'text-[#737373] hover:text-[#171717]'
            }`}
            title="Recorrer progresivamente todos los sectores y obras"
          >
            <Compass className="w-3 h-3 text-emerald-600" />
            <span>Recorrido</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('plan')}
            className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
              mode === 'plan'
                ? 'bg-white text-[#2563EB] font-semibold shadow-2xs'
                : 'text-[#737373] hover:text-[#171717]'
            }`}
            title="Presentar plano arquitectónico general"
          >
            Plano
          </button>
        </div>

        {/* Artist Selector dropdown when in multi_wall mode */}
        {mode === 'multi_wall' && artistsWithArtworks.length > 1 && (
          <select
            value={selectedArtist}
            onChange={(e) => setSelectedArtist(e.target.value)}
            className="px-2 py-0.5 text-[11px] rounded bg-white border border-[#E6E4DD] text-[#171717] outline-hidden cursor-pointer"
          >
            {artistsWithArtworks.map((a) => (
              <option key={a.artist} value={a.artist}>
                {a.artist} ({a.walls.length} muros · {a.totalArtworks} obr.)
              </option>
            ))}
          </select>
        )}

        <div className="h-4 w-px bg-[#E6E4DD] mx-1" />

        {/* Exit Presentation */}
        <button
          type="button"
          onClick={onExit}
          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#171717] hover:bg-[#262626] text-white transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>Salir</span>
          <span className="text-[9px] opacity-60 font-mono">Esc</span>
        </button>
      </div>
    </div>
  );
};
