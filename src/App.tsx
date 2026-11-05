/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Minimize2,
} from 'lucide-react';
import {
  BackgroundPlanSettings,
  ExhibitionProject,
  FloorPlanElement,
  GraphicResource,
  LayerKey,
  LayerState,
  LayerVisibility,
  LibraryImage,
  ProposalSnapshot,
  TrashItem,
  ViewMode,
  Wall,
  WallItem,
  WallMaterial,
  Zone,
} from './types/exhibition';
import {
  createArtworkSvgDataUrl,
  DEFAULT_BACKGROUND_PLAN,
  INITIAL_LAYER_STATES,
  INITIAL_PROJECT,
} from './data/initialProject';
import {
  INITIAL_GRAPHIC_LIBRARY,
  loadGraphicResourcesFromDB,
  saveGraphicResourcesToDB,
} from './data/graphicLibrary';
import {
  alignWallItems,
  autoFixWallIssues,
  createWallSegment,
  distributeHorizontallyUniform,
  distributeVerticallyUniform,
  distributeWithExactSpacing,
  duplicateWallOffset,
  generateRoomGeometry,
  splitWallSegment,
  updateWallLengthConnected,
  validateWallItems,
} from './utils/geometryAndValidation';
import {
  exportProjectJson,
  exportSvgElementAsPng,
  exportTechnicalSheetPdf,
  loadProjectFromIndexedDB,
  saveProjectToIndexedDB,
} from './utils/storageAndExport';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { FloorPlanCanvas } from './components/FloorPlanCanvas';
import { ElevationCanvas } from './components/ElevationCanvas';
import { RightInspector } from './components/RightInspector';
import {
  CompareView,
  InventoryView,
} from './components/CompareAndInventoryViews';
import { ConfirmDeleteZoneModal } from './components/ConfirmDeleteZoneModal';
import { TrashModal } from './components/TrashModal';
import { BackgroundCalibrationModal } from './components/BackgroundCalibrationModal';
import { CreateSpaceModal } from './components/CreateSpaceModal';
import { CreateWallModal } from './components/CreateWallModal';
import { GeneratePerimeterWallsModal } from './components/GeneratePerimeterWallsModal';
import { DeleteWallModal } from './components/DeleteWallModal';
import { AssignArtworkModal } from './components/AssignArtworkModal';
import { SpaceAdminModal } from './components/SpaceAdminModal';
import { GuidedTestModal } from './components/GuidedTestModal';

export default function App() {
  const [project, setProject] = useState<ExhibitionProject>(INITIAL_PROJECT);
  const [past, setPast] = useState<ExhibitionProject[]>([]);
  const [future, setFuture] = useState<ExhibitionProject[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>('plan');
  const [selectedWallId, setSelectedWallId] = useState<string | null>('wall-carlos-main');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedPlanElementId, setSelectedPlanElementId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'pending'>('saved');

  // Collapsible panels with localStorage persistence
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('spaguetty_sidebar_open');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isRightInspectorOpen, setIsRightInspectorOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('spaguetty_inspector_open');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals state
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [isTrashOpen, setIsTrashOpen] = useState<boolean>(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState<boolean>(false);

  // New Space & Wall Construction Modals State
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState<boolean>(false);
  const [isCreateWallOpen, setIsCreateWallOpen] = useState<boolean>(false);
  const [isGeneratePerimeterOpen, setIsGeneratePerimeterOpen] = useState<boolean>(false);
  const [targetZoneIdForWall, setTargetZoneIdForWall] = useState<string | null>(null);

  // Safe Wall Deletion Modal State
  const [isDeleteWallModalOpen, setIsDeleteWallModalOpen] = useState<boolean>(false);
  const [wallToDelete, setWallToDelete] = useState<Wall | null>(null);

  // Space Administration Modal State
  const [isSpaceAdminOpen, setIsSpaceAdminOpen] = useState<boolean>(false);
  const [adminZone, setAdminZone] = useState<Zone | null>(null);

  // Assign Artwork Modal State
  const [isAssignArtworkOpen, setIsAssignArtworkOpen] = useState<boolean>(false);
  const [itemToAssign, setItemToAssign] = useState<WallItem | null>(null);

  // Guided Verification Acceptance Test Modal State (11 Pasos)
  const [isGuidedTestOpen, setIsGuidedTestOpen] = useState<boolean>(false);
  const [testCompletedSteps, setTestCompletedSteps] = useState<number[]>([]);

  // Interactive Wall Drawing State
  const [isDrawingWall, setIsDrawingWall] = useState<boolean>(false);
  const [drawingSpaceId, setDrawingSpaceId] = useState<string | null>(null);

  // 2-point calibration state
  const [isCalibratingBackground, setIsCalibratingBackground] = useState<boolean>(false);

  // Clipboard for copy/paste
  const [clipboardItem, setClipboardItem] = useState<WallItem | null>(null);

  const [layers, setLayers] = useState<LayerVisibility>({
    walls: true,
    dimensions: true,
    participants: true,
    photos: true,
    texts: true,
    decor: true,
    grid: true,
    guides: true,
    referenceOverlay: true,
  });

  const [focusZoneTrigger, setFocusZoneTrigger] = useState<{
    zoneId: string;
    ts: number;
  } | null>(null);
  const [fitTrigger, setFitTrigger] = useState<number>(0);

  const activeSvgRef = useRef<SVGSVGElement | null>(null);

  // Sync panel persistence
  useEffect(() => {
    try {
      localStorage.setItem('spaguetty_sidebar_open', String(isLeftSidebarOpen));
    } catch {
      // ignore
    }
  }, [isLeftSidebarOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('spaguetty_inspector_open', String(isRightInspectorOpen));
    } catch {
      // ignore
    }
  }, [isRightInspectorOpen]);

  // Sync fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Sync dark mode class on <html>
  useEffect(() => {
    const rootEl = document.documentElement;
    if (isDark) {
      rootEl.classList.add('dark');
    } else {
      rootEl.classList.remove('dark');
    }
  }, [isDark]);

  // Load persisted project from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    Promise.all([loadProjectFromIndexedDB(), loadGraphicResourcesFromDB()]).then(
      ([saved, dbResources]) => {
        if (!mounted) return;
        setProject((prev) => {
          const isSameVersion = saved && saved.version === INITIAL_PROJECT.version;
          const base = isSameVersion && saved.walls && saved.walls.length > 0 ? saved : INITIAL_PROJECT;
          const layerStates =
            base.layerStates && base.layerStates.length > 0
              ? base.layerStates
              : INITIAL_LAYER_STATES;

          const backgroundPlan = base.backgroundPlan || DEFAULT_BACKGROUND_PLAN;
          const annotations = base.annotations && base.annotations.length > 0 ? base.annotations : INITIAL_PROJECT.annotations;
          const trash = base.trash || [];

          const existingIds = new Set<string>();
          const combined: GraphicResource[] = [];

          [
            ...(base.graphicLibrary || []),
            ...INITIAL_GRAPHIC_LIBRARY,
            ...(dbResources || []),
          ].forEach((r) => {
            if (!existingIds.has(r.id)) {
              existingIds.add(r.id);
              combined.push(r);
            }
          });

          return {
            ...base,
            backgroundPlan,
            annotations,
            trash,
            layerStates,
            graphicLibrary: combined,
          };
        });
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-save to IndexedDB whenever project changes
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveProjectToIndexedDB(project)
        .then(() => {
          setSaveStatus('saved');
        })
        .catch(() => {
          setSaveStatus('error');
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [project]);

  // Helper to commit a state change with Undo/Redo support
  const commitProjectChange = useCallback(
    (
      updater: (prev: ExhibitionProject) => ExhibitionProject,
      recordHistory = true
    ) => {
      setProject((prev) => {
        const next = updater(prev);
        if (recordHistory) {
          setPast((p) => [...p.slice(-29), prev]);
          setFuture([]);
        }
        return {
          ...next,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      setFuture((f) => [project, ...f]);
      setProject(previous);
      return prevPast.slice(0, -1);
    });
  }, [project]);

  const handleRedo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      setPast((p) => [...p, project]);
      setProject(next);
      return prevFuture.slice(1);
    });
  }, [project]);

  // Handlers for Items
  const handleAddItem = useCallback(
    (newItem: Omit<WallItem, 'id'>) => {
      const newId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      commitProjectChange((prev) => ({
        ...prev,
        items: [...prev.items, { ...newItem, id: newId }],
      }));
      setSelectedItemIds([newId]);
    },
    [commitProjectChange]
  );

  const handleDuplicateSelected = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const newIds: string[] = [];
    commitProjectChange((prev) => {
      const clones: WallItem[] = [];
      prev.items.forEach((it) => {
        if (selectedItemIds.includes(it.id)) {
          const cloneId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          newIds.push(cloneId);
          clones.push({
            ...it,
            id: cloneId,
            name: `${it.name} (Copia)`,
            xCm: Number((it.xCm + 15).toFixed(1)),
            yCm: Number(Math.max(0, it.yCm - 5).toFixed(1)),
            locked: false,
          });
        }
      });
      return { ...prev, items: [...prev.items, ...clones] };
    });
    setSelectedItemIds(newIds);
  }, [selectedItemIds, commitProjectChange]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    commitProjectChange((prev) => {
      const toDelete = prev.items.filter(
        (it) => selectedItemIds.includes(it.id) && !it.locked
      );
      if (toDelete.length === 0) return prev;

      const trashEntries: TrashItem[] = toDelete.map((it) => ({
        id: `trash-${Date.now()}-${it.id}`,
        type: 'item',
        name: it.name,
        deletedAt: new Date().toISOString(),
        description: `Elemento de ${it.widthCm}×${it.heightCm} cm en ${it.wallId}`,
        data: it,
      }));

      const deleteIds = new Set(toDelete.map((it) => it.id));
      return {
        ...prev,
        items: prev.items.filter((it) => !deleteIds.has(it.id)),
        trash: [...trashEntries, ...(prev.trash || [])],
      };
    });
    setSelectedItemIds([]);
  }, [selectedItemIds, commitProjectChange]);

  const handleDeleteItemById = useCallback(
    (itemId: string) => {
      commitProjectChange((prev) => {
        const target = prev.items.find((it) => it.id === itemId);
        if (!target) return prev;

        const trashEntry: TrashItem = {
          id: `trash-${Date.now()}-${target.id}`,
          type: 'item',
          name: target.name,
          deletedAt: new Date().toISOString(),
          description: `Elemento de ${target.widthCm}×${target.heightCm} cm en ${target.wallId}`,
          data: target,
        };

        return {
          ...prev,
          items: prev.items.filter((it) => it.id !== itemId),
          trash: [trashEntry, ...(prev.trash || [])],
        };
      });
      setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));
    },
    [commitProjectChange]
  );

  // Handlers for 2D Floor Plan Elements (Restaurant tables, Decorative squares, Shelves, Furniture)
  const handlePlaceGraphicResourceInPlan = useCallback(
    (res: GraphicResource) => {
      const newId = `plan-el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const targetZone =
        (selectedZoneId && project.zones.find((z) => z.id === selectedZoneId)) ||
        (selectedWallId &&
          project.zones.find(
            (z) =>
              z.id === project.walls.find((w) => w.id === selectedWallId)?.zoneId
          )) ||
        project.zones[0];

      const offsetCount = (project.planElements || []).length % 6;
      const baseX = targetZone?.labelX ?? 5.5;
      const baseY = targetZone?.labelY ?? 4.5;

      const newElement: FloorPlanElement = {
        id: newId,
        zoneId: targetZone?.id,
        name: res.name,
        category: res.category,
        xM: Number((baseX + (offsetCount % 3) * 0.6 - 0.5).toFixed(2)),
        yM: Number((baseY + Math.floor(offsetCount / 3) * 0.6 + 0.5).toFixed(2)),
        widthCm: res.defaultWidthCm,
        depthCm: res.defaultHeightCm,
        rotation: 0,
        planSvgUrl: res.planSvgUrl || res.previewUrl,
        imageUrl: res.fileDataUrl || res.previewUrl,
        tintColor: '#171717',
        locked: false,
        visible: true,
        layerId: 'furniture',
      };

      commitProjectChange((prev) => ({
        ...prev,
        planElements: [...(prev.planElements || []), newElement],
      }));
      setSelectedPlanElementId(newId);
      setSelectedItemIds([]);
      setViewMode('plan');
    },
    [selectedZoneId, selectedWallId, project.zones, project.walls, project.planElements, commitProjectChange]
  );

  const handleUpdatePlanElement = useCallback(
    (id: string, patch: Partial<FloorPlanElement>) => {
      commitProjectChange((prev) => ({
        ...prev,
        planElements: (prev.planElements || []).map((el) =>
          el.id === id ? { ...el, ...patch } : el
        ),
      }));
    },
    [commitProjectChange]
  );

  const handleDuplicatePlanElement = useCallback(
    (id: string) => {
      const newId = `plan-el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      commitProjectChange((prev) => {
        const source = (prev.planElements || []).find((el) => el.id === id);
        if (!source) return prev;
        const clone: FloorPlanElement = {
          ...source,
          id: newId,
          name: `${source.name} (Copia)`,
          xM: Number((source.xM + 0.5).toFixed(2)),
          yM: Number((source.yM + 0.5).toFixed(2)),
          locked: false,
        };
        return {
          ...prev,
          planElements: [...(prev.planElements || []), clone],
        };
      });
      setSelectedPlanElementId(newId);
    },
    [commitProjectChange]
  );

  const handleDeletePlanElement = useCallback(
    (id: string) => {
      commitProjectChange((prev) => ({
        ...prev,
        planElements: (prev.planElements || []).filter((el) => el.id !== id),
      }));
      setSelectedPlanElementId((prev) => (prev === id ? null : prev));
    },
    [commitProjectChange]
  );

  const handleTogglePlanElementVisible = useCallback(
    (id: string) => {
      commitProjectChange((prev) => ({
        ...prev,
        planElements: (prev.planElements || []).map((el) =>
          el.id === id ? { ...el, visible: !el.visible } : el
        ),
      }));
    },
    [commitProjectChange]
  );

  const handleToggleLockSelected = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    commitProjectChange((prev) => {
      const selected = prev.items.filter((it) => selectedItemIds.includes(it.id));
      const allLocked = selected.every((it) => it.locked);
      return {
        ...prev,
        items: prev.items.map((it) =>
          selectedItemIds.includes(it.id) ? { ...it, locked: !allLocked } : it
        ),
      };
    });
  }, [selectedItemIds, commitProjectChange]);

  const handleCopyItem = useCallback((item: WallItem) => {
    setClipboardItem(item);
  }, []);

  const handlePasteItem = useCallback(() => {
    if (!clipboardItem) return;
    const targetWallId = selectedWallId || clipboardItem.wallId;
    const targetWall = project.walls.find((w) => w.id === targetWallId) || project.walls[0];
    const newId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const pasted: WallItem = {
      ...clipboardItem,
      id: newId,
      wallId: targetWall.id,
      zoneId: targetWall.zoneId,
      name: `${clipboardItem.name} (Pegado)`,
      xCm: Number((clipboardItem.xCm + 20).toFixed(1)),
      yCm: Number(clipboardItem.yCm.toFixed(1)),
      locked: false,
    };
    commitProjectChange((prev) => ({
      ...prev,
      items: [...prev.items, pasted],
    }));
    setSelectedItemIds([newId]);
  }, [clipboardItem, selectedWallId, project.walls, commitProjectChange]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isCtrlOrMeta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (isCtrlOrMeta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (isCtrlOrMeta && e.key.toLowerCase() === 'c' && selectedItemIds.length > 0) {
        const itemToCopy = project.items.find((i) => i.id === selectedItemIds[0]);
        if (itemToCopy) {
          handleCopyItem(itemToCopy);
        }
      } else if (isCtrlOrMeta && e.key.toLowerCase() === 'v' && clipboardItem) {
        e.preventDefault();
        handlePasteItem();
      } else if (isCtrlOrMeta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSaveStatus('saving');
        saveProjectToIndexedDB(project).then(() => setSaveStatus('saved'));
      } else if (isCtrlOrMeta && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsLeftSidebarOpen((o) => !o);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPlanElementId) {
          e.preventDefault();
          handleDeletePlanElement(selectedPlanElementId);
        } else if (selectedItemIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        } else if (selectedWallId) {
          const targetW = project.walls.find((w) => w.id === selectedWallId);
          if (targetW && !targetW.locked) {
            e.preventDefault();
            setWallToDelete(targetW);
            setIsDeleteWallModalOpen(true);
          }
        }
      } else if (e.key === 'Escape') {
        if (isCalibratingBackground) {
          setIsCalibratingBackground(false);
        } else if (selectedPlanElementId) {
          setSelectedPlanElementId(null);
        } else if (selectedItemIds.length > 0) {
          setSelectedItemIds([]);
        } else if (selectedZoneId) {
          setSelectedZoneId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDuplicateSelected,
    handleDeleteSelected,
    handleDeletePlanElement,
    handleCopyItem,
    handlePasteItem,
    selectedPlanElementId,
    selectedItemIds,
    selectedWallId,
    clipboardItem,
    project,
    isCalibratingBackground,
    selectedZoneId,
  ]);

  // Real-time spatial validation across all walls
  const validationIssues = useMemo(
    () => validateWallItems(project.walls, project.items),
    [project.walls, project.items]
  );

  const selectedWall = useMemo(
    () =>
      project.walls.find((w) => w.id === selectedWallId) ||
      project.walls[0] ||
      null,
    [project.walls, selectedWallId]
  );

  const selectedZone = useMemo(
    () => (selectedZoneId ? project.zones.find((z) => z.id === selectedZoneId) || null : null),
    [project.zones, selectedZoneId]
  );

  const selectedItems = useMemo(
    () => project.items.filter((it) => selectedItemIds.includes(it.id)),
    [project.items, selectedItemIds]
  );

  const selectedPlanElement = useMemo(
    () =>
      selectedPlanElementId
        ? (project.planElements || []).find((el) => el.id === selectedPlanElementId) || null
        : null,
    [project.planElements, selectedPlanElementId]
  );

  const unresolvedVerificationsCount = useMemo(
    () => project.verifications.filter((v) => !v.resolved).length,
    [project.verifications]
  );

  // Sector CRUD Handlers
  const handleCreateZone = (name: string, participant?: string, color?: string) => {
    const newId = `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const zoneColor =
      color ||
      ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'][
        project.zones.length % 6
      ];

    const newZone: Zone = {
      id: newId,
      name,
      participant: participant || name,
      roleOrNote: 'Sector museográfico',
      color: zoneColor,
      order: project.zones.length + 1,
      expanded: true,
      visible: true,
      locked: false,
      labelX: 4.0,
      labelY: 3.5,
      labelFontSize: 13,
      labelColor: zoneColor,
      labelRotation: 0,
      labelLocked: false,
      labelVisible: true,
    };

    commitProjectChange((prev) => ({
      ...prev,
      zones: [...prev.zones, newZone],
    }));
    setSelectedZoneId(newId);
  };

  // --- Handlers for Space Creation Wizard & Administration ---
  const handleStartDrawingWall = useCallback((zoneId: string) => {
    setDrawingSpaceId(zoneId);
    setSelectedZoneId(zoneId);
    setIsDrawingWall(true);
    setViewMode('plan');
  }, []);

  const handleCancelDrawingWall = useCallback(() => {
    setIsDrawingWall(false);
    setDrawingSpaceId(null);
  }, []);

  const handleFinishDrawingWall = useCallback(
    (
      spaceId: string,
      startPt: { x: number; y: number },
      endPt: { x: number; y: number },
      isChained = false
    ) => {
      const targetZone = project.zones.find((z) => z.id === spaceId) || project.zones[0];
      const spaceName = targetZone ? targetZone.name : 'Espacio';
      const participant = targetZone ? targetZone.participant : 'Artista';

      const result = createWallSegment(project.walls, project.vertices, {
        spaceId: targetZone?.id || spaceId,
        name: `${spaceName} - Muro`,
        participant,
        startPt,
        endPt,
        source: 'drawn',
      });

      commitProjectChange((prev) => ({
        ...prev,
        walls: result.walls,
        vertices: result.vertices,
      }));

      setSelectedWallId(result.createdWall.id);
      if (!isChained) {
        setIsDrawingWall(false);
        setDrawingSpaceId(null);
      }
    },
    [project.zones, project.walls, project.vertices, commitProjectChange]
  );

  const handleOpenCreateWallModal = useCallback(
    (zoneId?: string) => {
      const zid = zoneId || selectedZoneId || project.zones[0]?.id || '';
      setTargetZoneIdForWall(zid);
      setIsCreateWallOpen(true);
    },
    [selectedZoneId, project.zones]
  );

  const handleCreateWallWithDimensions = useCallback(
    (params: {
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
    }) => {
      const targetZone = project.zones.find((z) => z.id === params.spaceId) || project.zones[0];
      const spaceName = targetZone ? targetZone.name : 'Espacio';
      const participant = targetZone ? targetZone.participant : 'Artista';

      let angleRad = 0;
      if (params.orientation === 'horizontal') angleRad = 0;
      else if (params.orientation === 'vertical') angleRad = Math.PI / 2;
      else angleRad = Math.PI / 4;

      const endPt = {
        x: Number((params.posX + params.lengthM * Math.cos(angleRad)).toFixed(3)),
        y: Number((params.posY + params.lengthM * Math.sin(angleRad)).toFixed(3)),
      };

      const result = createWallSegment(project.walls, project.vertices, {
        spaceId: params.spaceId,
        name: params.name || `${spaceName} - Muro`,
        participant,
        startPt: { x: params.posX, y: params.posY },
        endPt,
        heightM: params.heightM,
        thicknessCm: params.thicknessCm,
        material: params.material,
        color: params.color,
        source: 'dimension',
      });

      const updatedWalls = result.walls.map((w) =>
        w.id === result.createdWall.id ? { ...w, name: params.name || w.name } : w
      );

      commitProjectChange((prev) => ({
        ...prev,
        walls: updatedWalls,
        vertices: result.vertices,
      }));

      setSelectedWallId(result.createdWall.id);
      setIsCreateWallOpen(false);
    },
    [project.zones, project.walls, project.vertices, commitProjectChange]
  );

  const handleOpenGeneratePerimeterModal = useCallback(
    (zoneId?: string) => {
      const zid = zoneId || selectedZoneId || project.zones[0]?.id || '';
      setTargetZoneIdForWall(zid);
      setIsGeneratePerimeterOpen(true);
    },
    [selectedZoneId, project.zones]
  );

  const handleGeneratePerimeterWalls = useCallback(
    (
      spaceId: string,
      widthM: number,
      lengthM: number,
      originX: number,
      originY: number,
      activeSegments: [boolean, boolean, boolean, boolean]
    ) => {
      const targetZone = project.zones.find((z) => z.id === spaceId) || project.zones[0];
      const spaceName = targetZone ? targetZone.name : 'Espacio';
      const participant = targetZone ? targetZone.participant : 'Artista';

      const result = generateRoomGeometry(
        spaceId,
        spaceName,
        participant,
        widthM,
        lengthM,
        originX,
        originY,
        activeSegments
      );

      commitProjectChange((prev) => ({
        ...prev,
        walls: [...prev.walls, ...result.walls],
        vertices: [...prev.vertices, ...result.vertices],
      }));

      if (result.walls.length > 0) {
        setSelectedWallId(result.walls[0].id);
      }
      setIsGeneratePerimeterOpen(false);
    },
    [project.zones, commitProjectChange]
  );

  const handleSplitWall = useCallback(
    (wallId: string) => {
      const result = splitWallSegment(
        project.walls,
        project.vertices,
        project.items,
        wallId,
        0.5
      );
      if (!result) return;

      commitProjectChange((prev) => ({
        ...prev,
        walls: result.walls,
        vertices: result.vertices,
        items: result.items,
      }));

      setSelectedWallId(result.newWallId);
    },
    [project.walls, project.vertices, project.items, commitProjectChange]
  );

  const handleDuplicateWall = useCallback(
    (wallId: string) => {
      const result = duplicateWallOffset(project.walls, project.vertices, wallId, 0.6);
      if (!result) return;

      commitProjectChange((prev) => ({
        ...prev,
        walls: result.walls,
        vertices: result.vertices,
      }));

      setSelectedWallId(result.duplicatedWall.id);
    },
    [project.walls, project.vertices, commitProjectChange]
  );

  const handlePromptDeleteWall = useCallback((wall: Wall) => {
    setWallToDelete(wall);
    setIsDeleteWallModalOpen(true);
  }, []);

  const handleConfirmDeleteWall = useCallback(
    (wallId: string, action: 'keep_unassigned' | 'delete_all') => {
      const targetWall = project.walls.find((w) => w.id === wallId);
      if (!targetWall) return;

      const wallItems = project.items.filter((it) => it.wallId === wallId);

      commitProjectChange((prev) => {
        let nextItems: WallItem[];
        const trashEntries: TrashItem[] = [
          {
            id: `trash-${Date.now()}-${targetWall.id}`,
            type: 'wall',
            name: targetWall.name,
            deletedAt: new Date().toISOString(),
            description: `Muro de ${targetWall.lengthM}m (${targetWall.participant})`,
            data: targetWall,
          },
        ];

        if (action === 'keep_unassigned') {
          nextItems = prev.items.map((it) =>
            it.wallId === wallId ? { ...it, wallId: 'unassigned' as any } : it
          );
        } else {
          wallItems.forEach((it) => {
            trashEntries.push({
              id: `trash-${Date.now()}-${it.id}`,
              type: 'item',
              name: it.name,
              deletedAt: new Date().toISOString(),
              description: `Obra de ${it.widthCm}×${it.heightCm} cm en ${targetWall.name}`,
              data: it,
            });
          });
          const itemIdsToDelete = new Set(wallItems.map((it) => it.id));
          nextItems = prev.items.filter((it) => !itemIdsToDelete.has(it.id));
        }

        return {
          ...prev,
          walls: prev.walls.filter((w) => w.id !== wallId),
          items: nextItems,
          trash: [...trashEntries, ...(prev.trash || [])],
        };
      });

      if (selectedWallId === wallId) {
        setSelectedWallId(null);
      }
      setIsDeleteWallModalOpen(false);
      setWallToDelete(null);
    },
    [project.walls, project.items, selectedWallId, commitProjectChange]
  );

  const handleOpenSpaceAdmin = useCallback((zone: Zone) => {
    setAdminZone(zone);
    setIsSpaceAdminOpen(true);
  }, []);

  const handleOpenAssignArtwork = useCallback((item: WallItem) => {
    setItemToAssign(item);
    setIsAssignArtworkOpen(true);
  }, []);

  const handleAssignArtworkToWall = useCallback(
    (itemId: string, targetWallId: string, xCm: number, yCm: number) => {
      const targetWall = project.walls.find((w) => w.id === targetWallId);
      if (!targetWall) return;

      commitProjectChange((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId
            ? {
                ...it,
                wallId: targetWallId,
                zoneId: targetWall.zoneId,
                xCm,
                yCm,
              }
            : it
        ),
      }));

      setIsAssignArtworkOpen(false);
      setItemToAssign(null);
      setSelectedWallId(targetWallId);
    },
    [project.walls, commitProjectChange]
  );

  const handleCreateSpaceFromModal = useCallback(
    (
      name: string,
      description: string,
      color: string,
      constructionMethod: 'draw' | 'dimensions' | 'perimeter' | 'empty'
    ) => {
      const newZoneId = `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newZone: Zone = {
        id: newZoneId,
        name,
        participant: name,
        description,
        roleOrNote: description || '',
        color,
        order: project.zones.length + 1,
        expanded: true,
        visible: true,
        locked: false,
        labelX: 4.5 + (project.zones.length % 3) * 2,
        labelY: 3.5 + Math.floor(project.zones.length / 3) * 2,
        labelFontSize: 13,
        labelColor: color,
        labelRotation: 0,
        labelLocked: false,
        labelVisible: true,
      };

      commitProjectChange((prev) => ({
        ...prev,
        zones: [...prev.zones, newZone],
      }));

      setSelectedZoneId(newZoneId);
      setIsCreateSpaceOpen(false);

      if (constructionMethod === 'draw') {
        handleStartDrawingWall(newZoneId);
      } else if (constructionMethod === 'dimensions') {
        handleOpenCreateWallModal(newZoneId);
      } else if (constructionMethod === 'perimeter') {
        handleOpenGeneratePerimeterModal(newZoneId);
      } else {
        handleOpenSpaceAdmin(newZone);
      }
    },
    [
      project.zones.length,
      commitProjectChange,
      handleStartDrawingWall,
      handleOpenCreateWallModal,
      handleOpenGeneratePerimeterModal,
      handleOpenSpaceAdmin,
    ]
  );

  const handleDeleteZonePrompt = (zone: Zone) => {
    setZoneToDelete(zone);
  };

  const handleConfirmDeleteZone = (
    zoneId: string,
    deleteContents: boolean,
    targetZoneId?: string
  ) => {
    const targetZone = project.zones.find((z) => z.id === zoneId);
    if (!targetZone) return;

    commitProjectChange((prev) => {
      const zoneWalls = prev.walls.filter((w) => w.zoneId === targetZone.id);
      const zoneWallIds = new Set(zoneWalls.map((w) => w.id));
      const zoneItems = prev.items.filter(
        (it) => it.zoneId === targetZone.id || zoneWallIds.has(it.wallId)
      );

      const trashEntries: TrashItem[] = [
        {
          id: `trash-${Date.now()}-${targetZone.id}`,
          type: 'zone',
          name: targetZone.name,
          deletedAt: new Date().toISOString(),
          description: `Sector con ${zoneWalls.length} muros y ${zoneItems.length} obras`,
          data: {
            zone: targetZone,
            walls: deleteContents ? zoneWalls : [],
            items: deleteContents ? zoneItems : [],
          },
        },
      ];

      let nextWalls = prev.walls;
      let nextItems = prev.items;

      if (deleteContents) {
        nextWalls = prev.walls.filter((w) => w.zoneId !== targetZone.id);
        nextItems = prev.items.filter(
          (it) => it.zoneId !== targetZone.id && !zoneWallIds.has(it.wallId)
        );
      } else if (targetZoneId) {
        nextWalls = prev.walls.map((w) =>
          w.zoneId === targetZone.id ? { ...w, zoneId: targetZoneId } : w
        );
        nextItems = prev.items.map((it) =>
          it.zoneId === targetZone.id ? { ...it, zoneId: targetZoneId } : it
        );
      }

      return {
        ...prev,
        zones: prev.zones.filter((z) => z.id !== targetZone.id),
        walls: nextWalls,
        items: nextItems,
        trash: [...trashEntries, ...(prev.trash || [])],
      };
    });

    if (selectedZoneId === targetZone.id) {
      setSelectedZoneId(null);
    }
    setZoneToDelete(null);
  };

  const handleRenameZone = (zoneId: string, newName: string) => {
    commitProjectChange((prev) => ({
      ...prev,
      zones: prev.zones.map((z) =>
        z.id === zoneId ? { ...z, name: newName, participant: newName } : z
      ),
    }));
  };

  const handleDuplicateZone = (zoneId: string) => {
    const sourceZone = project.zones.find((z) => z.id === zoneId);
    if (!sourceZone) return;

    const newZoneId = `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newZone: Zone = {
      ...sourceZone,
      id: newZoneId,
      name: `${sourceZone.name} (Copia)`,
      participant: `${sourceZone.participant} (Copia)`,
      order: project.zones.length + 1,
      labelX: (sourceZone.labelX || 4) + 0.5,
      labelY: (sourceZone.labelY || 4) + 0.5,
    };

    const sourceWalls = project.walls.filter((w) => w.zoneId === zoneId);
    const wallIdMap = new Map<string, string>();
    const clonedWalls: Wall[] = sourceWalls.map((w) => {
      const newWId = `wall-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      wallIdMap.set(w.id, newWId);
      return {
        ...w,
        id: newWId,
        zoneId: newZoneId,
        name: `${w.name} (Copia)`,
      };
    });

    const clonedItems: WallItem[] = project.items
      .filter((it) => it.zoneId === zoneId || wallIdMap.has(it.wallId))
      .map((it) => ({
        ...it,
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        wallId: wallIdMap.get(it.wallId) || it.wallId,
        zoneId: newZoneId,
        name: `${it.name} (Copia)`,
      }));

    commitProjectChange((prev) => ({
      ...prev,
      zones: [...prev.zones, newZone],
      walls: [...prev.walls, ...clonedWalls],
      items: [...prev.items, ...clonedItems],
    }));
  };

  const handleUpdateZoneColor = (zoneId: string, color: string) => {
    commitProjectChange((prev) => ({
      ...prev,
      zones: prev.zones.map((z) =>
        z.id === zoneId ? { ...z, color, labelColor: color } : z
      ),
    }));
  };

  const handleReorderZone = (zoneId: string, direction: 'up' | 'down') => {
    commitProjectChange((prev) => {
      const idx = prev.zones.findIndex((z) => z.id === zoneId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.zones.length) return prev;

      const nextZones = [...prev.zones];
      const temp = nextZones[idx];
      nextZones[idx] = nextZones[targetIdx];
      nextZones[targetIdx] = temp;

      return {
        ...prev,
        zones: nextZones.map((z, i) => ({ ...z, order: i + 1 })),
      };
    });
  };

  const handleMoveZoneLabel = (zoneId: string, newX: number, newY: number) => {
    commitProjectChange(
      (prev) => ({
        ...prev,
        zones: prev.zones.map((z) =>
          z.id === zoneId ? { ...z, labelX: newX, labelY: newY } : z
        ),
      }),
      false
    );
  };

  const handleUpdateZone = (zoneId: string, patch: Partial<Zone>) => {
    commitProjectChange((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => (z.id === zoneId ? { ...z, ...patch } : z)),
    }));
  };

  // Layer Management Handlers
  const handleToggleLayerState = useCallback(
    (layerId: LayerKey) => {
      commitProjectChange(
        (prev) => {
          const currentLayers = prev.layerStates || INITIAL_LAYER_STATES;
          const targetLayer = currentLayers.find((l) => l.id === layerId);
          const nextVis = targetLayer ? !targetLayer.visible : false;

          const updatedLayers = currentLayers.map((l) =>
            l.id === layerId ? { ...l, visible: nextVis } : l
          );

          let nextBg = prev.backgroundPlan;
          if (layerId === 'backgroundPlan') {
            nextBg = {
              ...(prev.backgroundPlan || DEFAULT_BACKGROUND_PLAN),
              visible: nextVis,
            };
          }

          // Also keep legacy layers state in sync for ElevationCanvas and FloorPlanCanvas
          setLayers((old) => {
            const patch: Partial<LayerVisibility> = {};
            if (layerId === 'backgroundPlan') patch.referenceOverlay = nextVis;
            else if (layerId === 'walls') patch.walls = nextVis;
            else if (layerId === 'zoneLabels') patch.participants = nextVis;
            else if (layerId === 'dimensions') patch.dimensions = nextVis;
            else if (layerId === 'artworks') patch.photos = nextVis;
            else if (layerId === 'texts') patch.texts = nextVis;
            else if (layerId === 'furniture') patch.decor = nextVis;
            return { ...old, ...patch };
          });

          return {
            ...prev,
            layerStates: updatedLayers,
            backgroundPlan: nextBg,
          };
        },
        false
      );
    },
    [commitProjectChange]
  );

  const handleToggleLayerLock = useCallback(
    (layerId: LayerKey) => {
      commitProjectChange(
        (prev) => ({
          ...prev,
          layerStates: (prev.layerStates || INITIAL_LAYER_STATES).map((l) =>
            l.id === layerId ? { ...l, locked: !l.locked } : l
          ),
        }),
        false
      );
    },
    [commitProjectChange]
  );

  const handleRenameLayer = useCallback(
    (layerId: LayerKey, newName: string) => {
      commitProjectChange((prev) => ({
        ...prev,
        layerStates: (prev.layerStates || INITIAL_LAYER_STATES).map((l) =>
          l.id === layerId ? { ...l, name: newName } : l
        ),
      }));
    },
    [commitProjectChange]
  );

  const handleDeleteLayer = useCallback(
    (layerId: LayerKey) => {
      commitProjectChange((prev) => {
        const target = (prev.layerStates || INITIAL_LAYER_STATES).find((l) => l.id === layerId);
        if (!target || target.isStructural) return prev;

        const trashEntry: TrashItem = {
          id: `trash-layer-${Date.now()}-${layerId}`,
          type: 'layer',
          name: target.name,
          deletedAt: new Date().toISOString(),
          description: `Capa personalizada eliminada`,
          data: target,
        };

        return {
          ...prev,
          layerStates: (prev.layerStates || INITIAL_LAYER_STATES).filter((l) => l.id !== layerId),
          trash: [trashEntry, ...(prev.trash || [])],
        };
      });
    },
    [commitProjectChange]
  );

  const handleCreateCustomLayer = useCallback(
    (name: string) => {
      const customId = `custom-layer-${Date.now()}`;
      const newLayer: LayerState = {
        id: customId,
        name,
        visible: true,
        locked: false,
        opacity: 100,
        isCustom: true,
        isStructural: false,
        order: (project.layerStates?.length || 9) + 1,
      };

      commitProjectChange((prev) => ({
        ...prev,
        layerStates: [...(prev.layerStates || INITIAL_LAYER_STATES), newLayer],
      }));
    },
    [project.layerStates, commitProjectChange]
  );

  const handleReorderLayer = useCallback(
    (layerId: LayerKey, direction: 'up' | 'down') => {
      commitProjectChange((prev) => {
        const layersList = [...(prev.layerStates || INITIAL_LAYER_STATES)];
        const idx = layersList.findIndex((l) => l.id === layerId);
        if (idx === -1) return prev;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= layersList.length) return prev;

        const temp = layersList[idx];
        layersList[idx] = layersList[targetIdx];
        layersList[targetIdx] = temp;

        return {
          ...prev,
          layerStates: layersList.map((l, i) => ({ ...l, order: i + 1 })),
        };
      });
    },
    [commitProjectChange]
  );

  const handleSelectLayerElements = useCallback(
    (layerId: LayerKey) => {
      if (layerId === 'artworks') {
        const ids = project.items
          .filter((i) => i.type === 'photo' || i.type === 'frame' || i.type === 'portrait_stand')
          .map((i) => i.id);
        setSelectedItemIds(ids);
      } else if (layerId === 'furniture') {
        const ids = project.items
          .filter(
            (i) =>
              i.category === 'furniture' ||
              i.category === 'vitrines' ||
              i.category === 'pedestals' ||
              i.type === 'decor'
          )
          .map((i) => i.id);
        setSelectedItemIds(ids);
      } else if (layerId === 'people') {
        const ids = project.items
          .filter(
            (i) =>
              i.category === 'people_standing' ||
              i.category === 'people_seated' ||
              i.category === 'people_wheelchair'
          )
          .map((i) => i.id);
        setSelectedItemIds(ids);
      } else if (layerId === 'texts') {
        const ids = project.items
          .filter((i) => i.type === 'text' || i.type === 'title' || i.type === 'description')
          .map((i) => i.id);
        setSelectedItemIds(ids);
      }
    },
    [project.items]
  );

  // Background Plan Settings Handlers
  const handleUpdateBackgroundPlan = (patch: Partial<BackgroundPlanSettings>) => {
    commitProjectChange((prev) => ({
      ...prev,
      backgroundPlan: {
        ...(prev.backgroundPlan || DEFAULT_BACKGROUND_PLAN),
        ...patch,
      },
    }));
  };

  const handleResetBackgroundPlan = () => {
    commitProjectChange((prev) => ({
      ...prev,
      backgroundPlan: {
        ...DEFAULT_BACKGROUND_PLAN,
        imageUrl: prev.backgroundPlan?.imageUrl || DEFAULT_BACKGROUND_PLAN.imageUrl,
      },
    }));
  };

  const handleDeleteBackgroundImage = useCallback(() => {
    commitProjectChange((prev) => ({
      ...prev,
      backgroundPlan: {
        ...(prev.backgroundPlan || DEFAULT_BACKGROUND_PLAN),
        imageUrl: undefined,
        visible: false,
      },
      referenceImageUrl: undefined,
      layerStates: (prev.layerStates || INITIAL_LAYER_STATES).map((l) =>
        l.id === 'backgroundPlan' ? { ...l, visible: false } : l
      ),
    }));
    setLayers((l) => ({ ...l, referenceOverlay: false }));
  }, [commitProjectChange]);

  // Two-point calibration
  const handleApplyCalibrationDistance = (
    realMeters: number,
    ptA: { x: number; y: number },
    ptB: { x: number; y: number }
  ) => {
    const pixelDist = Math.hypot(ptB.x - ptA.x, ptB.y - ptA.y);
    const virtualMetersAtScale1 = pixelDist / 85; // 85 px per meter
    if (virtualMetersAtScale1 <= 0) return;

    const currentScale = project.backgroundPlan?.scale || 1;
    const scaleFactor = (realMeters / virtualMetersAtScale1) * currentScale;

    commitProjectChange((prev) => ({
      ...prev,
      backgroundPlan: {
        ...(prev.backgroundPlan || DEFAULT_BACKGROUND_PLAN),
        scale: Number(Math.max(0.1, Math.min(10, scaleFactor)).toFixed(3)),
        calibratedDistanceM: realMeters,
      },
    }));
    setIsCalibratingBackground(false);
  };

  // Trash & Restore Handlers
  const handleRestoreFromTrash = (trashId: string) => {
    commitProjectChange((prev) => {
      const item = (prev.trash || []).find((t) => t.id === trashId);
      if (!item) return prev;

      let nextZones = prev.zones;
      let nextWalls = prev.walls;
      let nextItems = prev.items;
      let nextLayers = prev.layerStates || INITIAL_LAYER_STATES;

      if (item.type === 'zone') {
        const { zone, walls, items } = item.data as {
          zone: Zone;
          walls?: Wall[];
          items?: WallItem[];
        };
        if (zone) nextZones = [...nextZones, zone];
        if (walls && walls.length > 0) nextWalls = [...nextWalls, ...walls];
        if (items && items.length > 0) nextItems = [...nextItems, ...items];
      } else if (item.type === 'wall') {
        nextWalls = [...nextWalls, item.data as Wall];
      } else if (item.type === 'item') {
        nextItems = [...nextItems, item.data as WallItem];
      } else if (item.type === 'layer') {
        nextLayers = [...nextLayers, item.data as LayerState];
      }

      return {
        ...prev,
        zones: nextZones,
        walls: nextWalls,
        items: nextItems,
        layerStates: nextLayers,
        trash: (prev.trash || []).filter((t) => t.id !== trashId),
      };
    });
  };

  const handleRestoreAllTrash = () => {
    commitProjectChange((prev) => {
      let nextZones = [...prev.zones];
      let nextWalls = [...prev.walls];
      let nextItems = [...prev.items];
      let nextLayers = [...(prev.layerStates || INITIAL_LAYER_STATES)];

      (prev.trash || []).forEach((item) => {
        if (item.type === 'zone') {
          const { zone, walls, items } = item.data as {
            zone: Zone;
            walls?: Wall[];
            items?: WallItem[];
          };
          if (zone) nextZones.push(zone);
          if (walls) nextWalls.push(...walls);
          if (items) nextItems.push(...items);
        } else if (item.type === 'wall') {
          nextWalls.push(item.data as Wall);
        } else if (item.type === 'item') {
          nextItems.push(item.data as WallItem);
        } else if (item.type === 'layer') {
          nextLayers.push(item.data as LayerState);
        }
      });

      return {
        ...prev,
        zones: nextZones,
        walls: nextWalls,
        items: nextItems,
        layerStates: nextLayers,
        trash: [],
      };
    });
  };

  const handleEmptyTrash = () => {
    commitProjectChange((prev) => ({
      ...prev,
      trash: [],
    }));
  };

  // Handlers for Wall & Vertex Geometry
  const handleUpdateWallLength = (wallId: string, newLengthM: number) => {
    commitProjectChange((prev) => {
      const { walls, vertices } = updateWallLengthConnected(
        prev.walls,
        prev.vertices,
        wallId,
        newLengthM
      );
      return { ...prev, walls, vertices };
    });
  };

  const handleMoveVertex = (vertexId: string, newX: number, newY: number) => {
    commitProjectChange((prev) => {
      const nextVertices = prev.vertices.map((v) =>
        v.id === vertexId ? { ...v, x: newX, y: newY } : v
      );
      const vMap = new Map(nextVertices.map((v) => [v.id, v]));
      const nextWalls = prev.walls.map((w) => {
        if (w.startVertexId === vertexId || w.endVertexId === vertexId) {
          const vs = vMap.get(w.startVertexId);
          const ve = vMap.get(w.endVertexId);
          if (vs && ve) {
            const dist = Math.max(
              0.2,
              Number(Math.hypot(ve.x - vs.x, ve.y - vs.y).toFixed(2))
            );
            const updatedDimLabel =
              w.dimensionLabel === 'Longitud Total'
                ? 'Longitud Total'
                : w.thicknessCm === 0
                ? `Vano ${dist.toFixed(2)} m`
                : `${dist.toFixed(2)} m`;
            return { ...w, lengthM: dist, dimensionLabel: updatedDimLabel };
          }
        }
        return w;
      });
      return { ...prev, vertices: nextVertices, walls: nextWalls };
    }, false);
  };

  const handleSelectZone = useCallback((zoneId: string | null, multi = false) => {
    if (!zoneId) {
      setSelectedZoneId(null);
      setSelectedZoneIds([]);
      return;
    }
    setSelectedZoneId(zoneId);
    setSelectedZoneIds((prev) => {
      if (!multi) return [zoneId];
      return prev.includes(zoneId)
        ? prev.filter((id) => id !== zoneId)
        : [...prev, zoneId];
    });
  }, []);

  const handleMoveWall = useCallback(
    (wallId: string, deltaX: number, deltaY: number) => {
      if (Math.abs(deltaX) < 0.001 && Math.abs(deltaY) < 0.001) return;
      commitProjectChange((prev) => {
        const wall = prev.walls.find((w) => w.id === wallId);
        if (!wall || wall.locked) return prev;

        // Include any double-sided linked walls sharing the same physical structure
        const movingWallGroupIds = new Set<string>([wall.id]);
        prev.walls.forEach((w) => {
          if (
            w.linkedWallId === wall.id ||
            wall.linkedWallId === w.id ||
            (w.startVertexId === wall.startVertexId &&
              w.endVertexId === wall.endVertexId)
          ) {
            movingWallGroupIds.add(w.id);
          }
        });

        const otherWallsUsingStart = prev.walls.filter(
          (w) =>
            !movingWallGroupIds.has(w.id) &&
            (w.startVertexId === wall.startVertexId ||
              w.endVertexId === wall.startVertexId)
        );
        const otherWallsUsingEnd = prev.walls.filter(
          (w) =>
            !movingWallGroupIds.has(w.id) &&
            (w.startVertexId === wall.endVertexId ||
              w.endVertexId === wall.endVertexId)
        );

        let nextVertices = [...prev.vertices];
        let newStartId = wall.startVertexId;
        let newEndId = wall.endVertexId;

        const startV = prev.vertices.find((v) => v.id === wall.startVertexId);
        const endV = prev.vertices.find((v) => v.id === wall.endVertexId);
        if (!startV || !endV) return prev;

        if (otherWallsUsingStart.length > 0) {
          newStartId = `v-fork-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          nextVertices.push({
            id: newStartId,
            x: Number((startV.x + deltaX).toFixed(3)),
            y: Number((startV.y + deltaY).toFixed(3)),
          });
        } else {
          nextVertices = nextVertices.map((v) =>
            v.id === startV.id
              ? {
                  ...v,
                  x: Number((v.x + deltaX).toFixed(3)),
                  y: Number((v.y + deltaY).toFixed(3)),
                }
              : v
          );
        }

        if (otherWallsUsingEnd.length > 0) {
          newEndId = `v-fork-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          nextVertices.push({
            id: newEndId,
            x: Number((endV.x + deltaX).toFixed(3)),
            y: Number((endV.y + deltaY).toFixed(3)),
          });
        } else {
          nextVertices = nextVertices.map((v) =>
            v.id === endV.id
              ? {
                  ...v,
                  x: Number((v.x + deltaX).toFixed(3)),
                  y: Number((v.y + deltaY).toFixed(3)),
                }
              : v
          );
        }

        const nextWalls = prev.walls.map((w) =>
          movingWallGroupIds.has(w.id)
            ? { ...w, startVertexId: newStartId, endVertexId: newEndId }
            : w
        );

        return {
          ...prev,
          vertices: nextVertices,
          walls: nextWalls,
        };
      }, false);
    },
    [commitProjectChange]
  );

  const handleMoveZones = useCallback(
    (zoneIds: string[], deltaX: number, deltaY: number) => {
      if (
        zoneIds.length === 0 ||
        (Math.abs(deltaX) < 0.001 && Math.abs(deltaY) < 0.001)
      )
        return;
      commitProjectChange((prev) => {
        const zoneIdSet = new Set(zoneIds);
        const movingWalls = prev.walls.filter(
          (w) => zoneIdSet.has(w.zoneId) && !w.locked
        );

        if (movingWalls.length === 0) {
          return {
            ...prev,
            zones: prev.zones.map((z) =>
              zoneIdSet.has(z.id) && !z.locked
                ? {
                    ...z,
                    labelX: Number(((z.labelX || 0) + deltaX).toFixed(3)),
                    labelY: Number(((z.labelY || 0) + deltaY).toFixed(3)),
                  }
                : z
            ),
          };
        }

        const movingWallIds = new Set(movingWalls.map((w) => w.id));
        const stationaryWalls = prev.walls.filter(
          (w) => !movingWallIds.has(w.id)
        );

        const stationaryVertexIds = new Set<string>();
        stationaryWalls.forEach((w) => {
          stationaryVertexIds.add(w.startVertexId);
          stationaryVertexIds.add(w.endVertexId);
        });

        const movingVertexIds = new Set<string>();
        movingWalls.forEach((w) => {
          movingVertexIds.add(w.startVertexId);
          movingVertexIds.add(w.endVertexId);
        });

        let nextVertices = [...prev.vertices];
        const vertexReplacementMap = new Map<string, string>();

        movingVertexIds.forEach((vId) => {
          const v = prev.vertices.find((item) => item.id === vId);
          if (!v) return;
          if (stationaryVertexIds.has(vId)) {
            const forkedId = `v-fork-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            vertexReplacementMap.set(vId, forkedId);
            nextVertices.push({
              id: forkedId,
              x: Number((v.x + deltaX).toFixed(3)),
              y: Number((v.y + deltaY).toFixed(3)),
            });
          } else {
            nextVertices = nextVertices.map((vert) =>
              vert.id === vId
                ? {
                    ...vert,
                    x: Number((vert.x + deltaX).toFixed(3)),
                    y: Number((vert.y + deltaY).toFixed(3)),
                  }
                : vert
            );
          }
        });

        const nextWalls = prev.walls.map((w) => {
          if (!movingWallIds.has(w.id)) return w;
          const newStart =
            vertexReplacementMap.get(w.startVertexId) || w.startVertexId;
          const newEnd =
            vertexReplacementMap.get(w.endVertexId) || w.endVertexId;
          return {
            ...w,
            startVertexId: newStart,
            endVertexId: newEnd,
          };
        });

        const nextZones = prev.zones.map((z) =>
          zoneIdSet.has(z.id) && !z.locked
            ? {
                ...z,
                labelX: Number(((z.labelX || 0) + deltaX).toFixed(3)),
                labelY: Number(((z.labelY || 0) + deltaY).toFixed(3)),
              }
            : z
        );

        return {
          ...prev,
          zones: nextZones,
          walls: nextWalls,
          vertices: nextVertices,
        };
      }, false);
    },
    [commitProjectChange]
  );

  const handleReassignWallZone = useCallback(
    (wallId: string, targetZoneId: string) => {
      const targetZone = project.zones.find((z) => z.id === targetZoneId);
      if (!targetZone) return;

      commitProjectChange((prev) => {
        const wall = prev.walls.find((w) => w.id === wallId);
        const linkedId = wall?.linkedWallId;

        return {
          ...prev,
          zones: prev.zones.map((z) =>
            z.id === targetZoneId ? { ...z, expanded: true } : z
          ),
          walls: prev.walls.map((w) => {
            if (w.id === wallId) {
              return {
                ...w,
                zoneId: targetZoneId,
                participant: targetZone.participant,
              };
            }
            if (linkedId && w.id === linkedId) {
              return {
                ...w,
                secondaryZoneId: targetZoneId,
                secondaryParticipant: targetZone.participant,
              };
            }
            return w;
          }),
          items: prev.items.map((it) =>
            it.wallId === wallId ? { ...it, zoneId: targetZoneId } : it
          ),
        };
      });
    },
    [project.zones, commitProjectChange]
  );

  const handleReassignMultipleWalls = useCallback(
    (wallIds: string[], targetZoneId: string) => {
      const targetZone = project.zones.find((z) => z.id === targetZoneId);
      if (!targetZone) return;
      const wallIdSet = new Set(wallIds);

      commitProjectChange((prev) => ({
        ...prev,
        walls: prev.walls.map((w) =>
          wallIdSet.has(w.id)
            ? {
                ...w,
                zoneId: targetZoneId,
                participant: targetZone.participant,
              }
            : w
        ),
        items: prev.items.map((it) =>
          wallIdSet.has(it.wallId) ? { ...it, zoneId: targetZoneId } : it
        ),
      }));
    },
    [project.zones, commitProjectChange]
  );

  const handleUpdateWall = (wallId: string, patch: Partial<Wall>) => {
    commitProjectChange((prev) => ({
      ...prev,
      walls: prev.walls.map((w) => (w.id === wallId ? { ...w, ...patch } : w)),
    }));
  };

  const getOppositeSide = (
    side: 'top' | 'bottom' | 'left' | 'right'
  ): 'top' | 'bottom' | 'left' | 'right' => {
    if (side === 'top') return 'bottom';
    if (side === 'bottom') return 'top';
    if (side === 'left') return 'right';
    return 'left';
  };

  const handleFlipWallDirection = useCallback(
    (wallId: string) => {
      commitProjectChange((prev) => {
        const target = prev.walls.find((w) => w.id === wallId);
        if (!target) return prev;
        const nextSide = getOppositeSide(target.normalSide);
        const nextDimOffset =
          nextSide === 'bottom' || nextSide === 'right'
            ? Math.abs(target.dimOffset || 22)
            : -Math.abs(target.dimOffset || 22);

        return {
          ...prev,
          walls: prev.walls.map((w) =>
            w.id === wallId
              ? { ...w, normalSide: nextSide, dimOffset: nextDimOffset }
              : w
          ),
          items: prev.items.map((it) =>
            it.wallId === wallId
              ? { ...it, normalSide: getOppositeSide(it.normalSide || target.normalSide) }
              : it
          ),
        };
      });
    },
    [commitProjectChange]
  );

  const handleFlipItemDirection = useCallback(
    (itemId: string) => {
      commitProjectChange((prev) => {
        const item = prev.items.find((i) => i.id === itemId);
        if (!item) return prev;
        const wall = prev.walls.find((w) => w.id === item.wallId);
        const currentSide = item.normalSide || wall?.normalSide || 'bottom';
        const nextSide = getOppositeSide(currentSide);
        return {
          ...prev,
          items: prev.items.map((it) =>
            it.id === itemId ? { ...it, normalSide: nextSide } : it
          ),
        };
      });
    },
    [commitProjectChange]
  );

  const handleCreateOppositeWallFace = useCallback(
    (wallId: string, targetZoneId: string) => {
      const sourceWall = project.walls.find((w) => w.id === wallId);
      const targetZone =
        project.zones.find((z) => z.id === targetZoneId) || project.zones[0];
      if (!sourceWall || !targetZone) return;

      // Check if an opposite face already exists
      const existingOpposite = project.walls.find(
        (w) =>
          w.id !== wallId &&
          (w.id === sourceWall.linkedWallId ||
            w.linkedWallId === wallId ||
            (w.startVertexId === sourceWall.startVertexId &&
              w.endVertexId === sourceWall.endVertexId))
      );

      if (existingOpposite) {
        const cleanBaseName = sourceWall.name.replace(/ \(Contracara.*\)$/i, '');
        commitProjectChange((prev) => ({
          ...prev,
          zones: prev.zones.map((z) =>
            z.id === sourceWall.zoneId || z.id === targetZone.id
              ? { ...z, expanded: true }
              : z
          ),
          walls: prev.walls.map((w) => {
            if (w.id === existingOpposite.id) {
              return {
                ...w,
                zoneId: targetZone.id,
                participant: targetZone.participant,
                name: `${cleanBaseName} (Contracara – ${targetZone.name})`,
                linkedWallId: sourceWall.id,
                secondaryZoneId: sourceWall.zoneId,
                secondaryParticipant: sourceWall.participant,
                faceLabel: 'Cara B (Posterior)',
              };
            }
            if (w.id === sourceWall.id) {
              return {
                ...w,
                linkedWallId: existingOpposite.id,
                secondaryZoneId: targetZone.id,
                secondaryParticipant: targetZone.participant,
                faceLabel: 'Cara A (Frontal)',
              };
            }
            return w;
          }),
          items: prev.items.map((it) =>
            it.wallId === existingOpposite.id
              ? { ...it, zoneId: targetZone.id }
              : it
          ),
        }));
        return;
      }

      const oppositeSide = getOppositeSide(sourceWall.normalSide);
      const newWallId = `wall-back-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const cleanBaseName = sourceWall.name.replace(/ \(Contracara.*\)$/i, '');
      const oppositeWall: Wall = {
        ...sourceWall,
        id: newWallId,
        zoneId: targetZone.id,
        participant: targetZone.participant,
        name: `${cleanBaseName} (Contracara – ${targetZone.name})`,
        normalSide: oppositeSide,
        dimOffset: -(sourceWall.dimOffset || 22),
        linkedWallId: sourceWall.id,
        secondaryZoneId: sourceWall.zoneId,
        secondaryParticipant: sourceWall.participant,
        faceLabel: 'Cara B (Posterior)',
      };

      commitProjectChange((prev) => ({
        ...prev,
        zones: prev.zones.map((z) =>
          z.id === sourceWall.zoneId || z.id === targetZone.id
            ? { ...z, expanded: true }
            : z
        ),
        walls: [
          ...prev.walls.map((w) =>
            w.id === sourceWall.id
              ? {
                  ...w,
                  linkedWallId: newWallId,
                  secondaryZoneId: targetZone.id,
                  secondaryParticipant: targetZone.participant,
                  faceLabel: 'Cara A (Frontal)',
                }
              : w
          ),
          oppositeWall,
        ],
      }));
    },
    [project.walls, project.zones, commitProjectChange]
  );

  const handleRemoveOppositeWallFace = useCallback(
    (wallId: string) => {
      commitProjectChange((prev) => {
        const wall = prev.walls.find((w) => w.id === wallId);
        if (!wall) return prev;
        const linkedWall = prev.walls.find(
          (w) =>
            w.id !== wallId &&
            (w.id === wall.linkedWallId ||
              w.linkedWallId === wallId ||
              (w.startVertexId === wall.startVertexId &&
                w.endVertexId === wall.endVertexId))
        );

        const wallToRemoveId =
          wall.faceLabel?.includes('Cara B') && linkedWall
            ? wall.id
            : linkedWall?.id;
        const wallToKeepId =
          wallToRemoveId === wall.id && linkedWall ? linkedWall.id : wall.id;

        if (!wallToRemoveId) {
          return {
            ...prev,
            walls: prev.walls.map((w) =>
              w.id === wall.id
                ? {
                    ...w,
                    linkedWallId: undefined,
                    secondaryZoneId: undefined,
                    secondaryParticipant: undefined,
                    faceLabel: undefined,
                  }
                : w
            ),
          };
        }

        if (selectedWallId === wallToRemoveId) {
          setSelectedWallId(wallToKeepId);
        }

        return {
          ...prev,
          walls: prev.walls
            .filter((w) => w.id !== wallToRemoveId)
            .map((w) =>
              w.id === wallToKeepId
                ? {
                    ...w,
                    linkedWallId: undefined,
                    secondaryZoneId: undefined,
                    secondaryParticipant: undefined,
                    faceLabel: undefined,
                  }
                : w
            ),
          items: prev.items.map((it) =>
            it.wallId === wallToRemoveId
              ? { ...it, wallId: 'unassigned' as any }
              : it
          ),
        };
      });
    },
    [selectedWallId, commitProjectChange]
  );

  const handleSetWallPhotoCount = (wall: Wall, targetCount: number) => {
    commitProjectChange((prev) => {
      const currentWallPhotos = prev.items
        .filter(
          (it) =>
            it.wallId === wall.id &&
            (it.type === 'photo' ||
              it.type === 'portrait_stand' ||
              it.type === 'frame')
        )
        .sort((a, b) => a.xCm - b.xCm);

      if (targetCount === currentWallPhotos.length) return prev;

      let nextItems = [...prev.items];

      if (targetCount < currentWallPhotos.length) {
        const toRemoveCount = currentWallPhotos.length - targetCount;
        const removeIds = new Set(
          currentWallPhotos.slice(-toRemoveCount).map((i) => i.id)
        );
        nextItems = nextItems.filter((it) => !removeIds.has(it.id));
      } else {
        const toAdd = targetCount - currentWallPhotos.length;
        const template = currentWallPhotos[currentWallPhotos.length - 1];
        const wCm = template ? template.widthCm : 50;
        const hCm = template ? template.heightCm : 70;
        const frame =
          template?.frameStyle ||
          (wall.material === 'parchment' ? 'parchment' : 'black');

        for (let i = 0; i < toAdd; i++) {
          const num = currentWallPhotos.length + i + 1;
          nextItems.push({
            id: `item-${wall.id}-auto-${Date.now()}-${i}`,
            wallId: wall.id,
            zoneId: wall.zoneId,
            name: `${wall.participant} #${num}`,
            code: `${wall.participant.slice(0, 3).toUpperCase()}-0${num}`,
            type: 'photo',
            widthCm: wCm,
            heightCm: hCm,
            xCm: 20 + num * 15,
            yCm: 115,
            rotation: 0,
            frameStyle: frame,
            matWidthCm: template ? template.matWidthCm : 2,
            description: `Fotografía ${wCm} × ${hCm} cm en ${wall.name}.`,
            imageUrl: createArtworkSvgDataUrl(
              `Obra ${num}`,
              wall.participant,
              num,
              wCm,
              hCm
            ),
            locked: false,
            visible: true,
            aspectRatioLocked: true,
          });
        }
      }

      const updatedPhotoIds = nextItems
        .filter((it) => it.wallId === wall.id && it.type === 'photo')
        .map((it) => it.id);

      nextItems = distributeWithExactSpacing(
        wall,
        nextItems,
        updatedPhotoIds,
        wall.defaultSpacingCm || 10,
        150
      );

      return { ...prev, items: nextItems };
    });
  };

  const handleUpdateItem = (
    itemId: string,
    patch: Partial<WallItem>,
    recordHistory = true
  ) => {
    commitProjectChange(
      (prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId ? { ...it, ...patch } : it
        ),
      }),
      recordHistory
    );
  };

  const handleUpdateMultipleItems = (
    itemIds: string[],
    patch: Partial<WallItem>
  ) => {
    const idSet = new Set(itemIds);
    commitProjectChange((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        idSet.has(it.id) ? { ...it, ...patch } : it
      ),
    }));
  };

  const handleResolveVerification = (verId: string, chosenValue: number) => {
    commitProjectChange((prev) => {
      const ver = prev.verifications.find((v) => v.id === verId);
      if (!ver) return prev;

      let nextWalls = prev.walls;
      let nextVertices = prev.vertices;

      if (
        ver.id === 'ver-clara-290' &&
        chosenValue === 2.9 &&
        ver.currentValue === 2.9
      ) {
        nextWalls = prev.walls.map((w) =>
          w.zoneId === 'zone-clara'
            ? { ...w, heightM: 2.9, heightConfirmed: true }
            : w
        );
      } else {
        const res = updateWallLengthConnected(
          prev.walls,
          prev.vertices,
          ver.wallId,
          chosenValue
        );
        nextWalls = res.walls;
        nextVertices = res.vertices;
      }

      const nextVers = prev.verifications.map((v) =>
        v.id === verId
          ? { ...v, currentValue: chosenValue, resolved: true }
          : v
      );

      return {
        ...prev,
        walls: nextWalls,
        vertices: nextVertices,
        verifications: nextVers,
      };
    });
  };

  const handleImportGraphicResources = useCallback(
    (newResources: GraphicResource[]) => {
      commitProjectChange((prev) => {
        const existingIds = new Set(
          (prev.graphicLibrary || []).map((r) => r.id)
        );
        const toAdd = newResources.filter((r) => !existingIds.has(r.id));
        const nextLib = [...(prev.graphicLibrary || []), ...toAdd];
        saveGraphicResourcesToDB(toAdd);
        return {
          ...prev,
          graphicLibrary: nextLib,
        };
      });
    },
    [commitProjectChange]
  );

  const getTargetItemIdsOnWall = (wall: Wall): string[] => {
    const onWallSelected = project.items.filter(
      (i) => i.wallId === wall.id && selectedItemIds.includes(i.id)
    );
    if (onWallSelected.length >= 2) {
      return onWallSelected.map((i) => i.id);
    }
    return project.items
      .filter((i) => i.wallId === wall.id && i.visible && !i.locked)
      .map((i) => i.id);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#FAF8F5] dark:bg-[#0B0F17] text-[#171717] dark:text-[#F8FAFC]">
      {/* TOP BAR */}
      <TopBar
        projectName={project.projectName}
        subtitle={project.subtitle}
        onUpdateProjectName={(name) =>
          commitProjectChange((prev) => ({ ...prev, projectName: name }))
        }
        onUpdateSubtitle={(sub) =>
          commitProjectChange((prev) => ({ ...prev, subtitle: sub }))
        }
        viewMode={viewMode}
        onSelectViewMode={(mode) => {
          if (mode === 'elevation' && !selectedWallId) {
            setSelectedWallId(project.walls[0]?.id || null);
          }
          setViewMode(mode);
        }}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        gridActive={layers.grid}
        onToggleGrid={() => setLayers((l) => ({ ...l, grid: !l.grid }))}
        onFitView={() => setFitTrigger((n) => n + 1)}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onSaveNow={() => {
          setSaveStatus('saving');
          saveProjectToIndexedDB(project)
            .then(() => setSaveStatus('saved'))
            .catch(() => setSaveStatus('error'));
        }}
        saveStatus={saveStatus}
        selectedWall={selectedWall || undefined}
        unresolvedVerificationsCount={unresolvedVerificationsCount}
        validationIssuesCount={validationIssues.length}
        onExportWallPdf={() => {
          if (selectedWall) exportTechnicalSheetPdf(project, selectedWall);
        }}
        onExportAllPdf={() => exportTechnicalSheetPdf(project)}
        onExportPng={() =>
          exportSvgElementAsPng(
            activeSvgRef.current,
            `spaguetty-house-${viewMode}.png`
          )
        }
        onExportJson={() => exportProjectJson(project)}
        onImportJson={(file) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const parsed = JSON.parse(reader.result as string) as ExhibitionProject;
              if (parsed && Array.isArray(parsed.walls)) {
                commitProjectChange(() => parsed);
              }
            } catch (e) {
              console.error('Invalid project JSON:', e);
            }
          };
          reader.readAsText(file);
        }}
        onResetDefault={() => {
          commitProjectChange(() => INITIAL_PROJECT);
          setSelectedWallId('wall-carlos-main');
          setSelectedZoneId(null);
          setSelectedItemIds([]);
        }}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((o) => !o)}
        isRightInspectorOpen={isRightInspectorOpen}
        onToggleRightInspector={() => setIsRightInspectorOpen((o) => !o)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        trashCount={project.trash?.length || 0}
        onOpenTrash={() => setIsTrashOpen(true)}
        onOpenGuidedTest={() => setIsGuidedTestOpen(true)}
        testProgress={{ completed: testCompletedSteps.length, total: 11 }}
      />

      {/* MAIN WORKSPACE AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR (Collapsible) */}
        {viewMode !== 'presentation' && isLeftSidebarOpen && (
          <LeftSidebar
            zones={project.zones}
            walls={project.walls}
            items={project.items}
            library={project.library}
            layers={layers}
            layerStates={project.layerStates || INITIAL_LAYER_STATES}
            selectedWallId={selectedWallId}
            selectedItemIds={selectedItemIds}
            viewMode={viewMode}
            onSelectPlanRoot={() => {
              setViewMode('plan');
              setSelectedWallId(null);
              setSelectedZoneId(null);
              setSelectedItemIds([]);
            }}
            onSelectWall={(wallId, openElev) => {
              setSelectedWallId(wallId);
              const w = project.walls.find((x) => x.id === wallId);
              if (w) setSelectedZoneId(w.zoneId);
              setSelectedItemIds([]);
              if (openElev) {
                setViewMode('elevation');
              }
            }}
            onSelectItem={(itemId, multi) => {
              const item = project.items.find((i) => i.id === itemId);
              if (item) {
                setSelectedWallId(item.wallId);
                setSelectedZoneId(item.zoneId);
              }
              setSelectedItemIds((prev) =>
                multi
                  ? prev.includes(itemId)
                    ? prev.filter((id) => id !== itemId)
                    : [...prev, itemId]
                  : [itemId]
              );
            }}
            onToggleZoneExpand={(zoneId) =>
              commitProjectChange(
                (prev) => ({
                  ...prev,
                  zones: prev.zones.map((z) =>
                    z.id === zoneId ? { ...z, expanded: !z.expanded } : z
                  ),
                }),
                false
              )
            }
            onToggleZoneVisible={(zoneId) =>
              commitProjectChange((prev) => ({
                ...prev,
                zones: prev.zones.map((z) =>
                  z.id === zoneId ? { ...z, visible: !z.visible } : z
                ),
              }))
            }
            onToggleZoneLock={(zoneId) =>
              commitProjectChange((prev) => ({
                ...prev,
                zones: prev.zones.map((z) =>
                  z.id === zoneId ? { ...z, locked: !z.locked } : z
                ),
              }))
            }
            onCreateZone={handleCreateZone}
            onDeleteZonePrompt={handleDeleteZonePrompt}
            onRenameZone={handleRenameZone}
            onDuplicateZone={handleDuplicateZone}
            onUpdateZoneColor={handleUpdateZoneColor}
            onReorderZone={handleReorderZone}
            onToggleWallVisible={(wallId) =>
              commitProjectChange((prev) => ({
                ...prev,
                walls: prev.walls.map((w) =>
                  w.id === wallId ? { ...w, visible: !w.visible } : w
                ),
              }))
            }
            onToggleWallLock={(wallId) =>
              commitProjectChange((prev) => ({
                ...prev,
                walls: prev.walls.map((w) =>
                  w.id === wallId ? { ...w, locked: !w.locked } : w
                ),
              }))
            }
            onToggleItemVisible={(itemId) =>
              commitProjectChange((prev) => ({
                ...prev,
                items: prev.items.map((it) =>
                  it.id === itemId ? { ...it, visible: !it.visible } : it
                ),
              }))
            }
            onToggleItemLock={(itemId) =>
              commitProjectChange((prev) => ({
                ...prev,
                items: prev.items.map((it) =>
                  it.id === itemId ? { ...it, locked: !it.locked } : it
                ),
              }))
            }
            onToggleLayer={(layerKey) =>
              setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }))
            }
            onToggleLayerState={handleToggleLayerState}
            onToggleLayerLock={handleToggleLayerLock}
            onRenameLayer={handleRenameLayer}
            onDeleteLayer={handleDeleteLayer}
            onCreateCustomLayer={handleCreateCustomLayer}
            onReorderLayer={handleReorderLayer}
            onSelectLayerElements={handleSelectLayerElements}
            onOpenBackgroundPlanModal={() => setIsBgModalOpen(true)}
            onAddLibraryImage={(name, dataUrl, wCm, hCm) => {
              const newLib: LibraryImage = {
                id: `lib-${Date.now()}`,
                name,
                participant: selectedWall?.participant || 'General',
                dataUrl,
                defaultWidthCm: wCm,
                defaultHeightCm: hCm,
                createdAt: new Date().toISOString().slice(0, 10),
              };
              commitProjectChange((prev) => ({
                ...prev,
                library: [newLib, ...prev.library],
              }));
            }}
            onMountLibraryImageOnWall={(libImg) => {
              const targetWall = selectedWall || project.walls[0];
              if (!targetWall) return;
              handleAddItem({
                wallId: targetWall.id,
                zoneId: targetWall.zoneId,
                name: libImg.name,
                code: `LIB-${project.items.length + 1}`,
                type: 'photo',
                widthCm: libImg.defaultWidthCm,
                heightCm: libImg.defaultHeightCm,
                xCm: 40,
                yCm: 115,
                rotation: 0,
                frameStyle:
                  targetWall.material === 'parchment' ? 'parchment' : 'black',
                matWidthCm: 2,
                description: `Obra montada desde la biblioteca del proyecto.`,
                imageUrl: libImg.dataUrl,
                locked: false,
                visible: true,
                aspectRatioLocked: true,
              });
              setSelectedWallId(targetWall.id);
              setViewMode('elevation');
            }}
            onCenterZoneInPlan={(zoneId) => {
              setViewMode('plan');
              setSelectedZoneId(zoneId);
              setFocusZoneTrigger({ zoneId, ts: Date.now() });
            }}
            onOpenCreateSpaceModal={() => setIsCreateSpaceOpen(true)}
            onOpenSpaceAdmin={handleOpenSpaceAdmin}
            onStartDrawingWall={handleStartDrawingWall}
            onOpenCreateWallModal={handleOpenCreateWallModal}
            onOpenGeneratePerimeterModal={handleOpenGeneratePerimeterModal}
            onPromptDeleteWall={handlePromptDeleteWall}
            onDeleteItem={handleDeleteItemById}
            onFlipWallDirection={handleFlipWallDirection}
            selectedZoneIds={selectedZoneIds}
            onSelectZone={handleSelectZone}
            onMoveZones={handleMoveZones}
            onDeleteBackgroundImage={handleDeleteBackgroundImage}
            graphicResources={project.graphicLibrary || INITIAL_GRAPHIC_LIBRARY}
            planElements={project.planElements || []}
            selectedPlanElementId={selectedPlanElementId}
            onSelectPlanElement={(elId) => {
              setSelectedPlanElementId(elId);
              if (elId) {
                setSelectedItemIds([]);
              }
            }}
            onPlaceGraphicResourceInPlan={handlePlaceGraphicResourceInPlan}
            onTogglePlanElementVisible={handleTogglePlanElementVisible}
            onDeletePlanElement={handleDeletePlanElement}
            onMountGraphicResourceOnWall={(res) => {
              const targetWall = selectedWall || project.walls[0];
              if (!targetWall) return;
              handleAddItem({
                wallId: targetWall.id,
                zoneId: targetWall.zoneId,
                name: res.name,
                code: `RES-${project.items.length + 1}`,
                type: res.category.startsWith('people')
                  ? 'portrait_stand'
                  : res.category === 'furniture' || res.category === 'vitrines'
                  ? 'frame'
                  : 'photo',
                category: res.category,
                widthCm: res.defaultWidthCm,
                heightCm: res.defaultHeightCm,
                xCm: 40,
                yCm: 115,
                rotation: 0,
                frameStyle:
                  targetWall.material === 'parchment' ? 'parchment' : 'black',
                matWidthCm: 2,
                description: `${res.name} (${res.defaultWidthCm}×${res.defaultHeightCm} cm) montado desde la biblioteca.`,
                imageUrl: res.fileDataUrl || res.previewUrl,
                locked: false,
                visible: true,
                aspectRatioLocked: true,
              });
              setSelectedWallId(targetWall.id);
              setViewMode('elevation');
            }}
          />
        )}

        {/* CENTER VIEWPORT (Expands to 100% when panels are closed) */}
        <main className="flex-1 h-full flex overflow-hidden relative">
          <AnimatePresence mode="wait">
            {viewMode === 'plan' && (
              <motion.div
                key="view-plan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 h-full flex"
              >
                <FloorPlanCanvas
                  svgRef={activeSvgRef}
                  zones={project.zones}
                  vertices={project.vertices}
                  walls={project.walls}
                  items={project.items}
                  layers={layers}
                  layerStates={project.layerStates || INITIAL_LAYER_STATES}
                  backgroundPlan={project.backgroundPlan}
                  annotations={project.annotations}
                  verifications={project.verifications}
                  validationIssues={validationIssues}
                  selectedWallId={selectedWallId}
                  selectedItemIds={selectedItemIds}
                  referenceImageUrl={project.referenceImageUrl}
                  referenceOpacity={project.referenceOpacity}
                  isDark={isDark}
                  focusZoneTrigger={focusZoneTrigger}
                  fitTrigger={fitTrigger}
                  clipboardItem={clipboardItem}
                  onSelectWall={(wId, openElev) => {
                    setSelectedWallId(wId);
                    if (wId) {
                      const w = project.walls.find((x) => x.id === wId);
                      if (w) setSelectedZoneId(w.zoneId);
                    }
                    setSelectedItemIds([]);
                    if (openElev && wId) {
                      setViewMode('elevation');
                    }
                  }}
                  onSelectItem={(itemId, multi) => {
                    setSelectedItemIds((prev) =>
                      multi
                        ? prev.includes(itemId)
                          ? prev.filter((id) => id !== itemId)
                          : [...prev, itemId]
                        : [itemId]
                    );
                  }}
                  onSelectMultiple={(wallIds: string[], itemIds: string[]) => {
                    if (wallIds.length > 0) setSelectedWallId(wallIds[0]);
                    setSelectedItemIds(itemIds);
                  }}
                  onMoveVertex={handleMoveVertex}
                  onUpdateZoneLabelPosition={(zoneId: string, xM: number, yM: number) => {
                    handleMoveZoneLabel(zoneId, xM, yM);
                  }}
                  onCopyItem={(itemId: string) => {
                    const item = project.items.find((i) => i.id === itemId);
                    if (item) handleCopyItem(item);
                  }}
                  onPasteItem={handlePasteItem}
                  onDuplicateSelected={handleDuplicateSelected}
                  onDeleteSelected={handleDeleteSelected}
                  onPromptDeleteWall={handlePromptDeleteWall}
                  onFlipWallDirection={handleFlipWallDirection}
                  onFlipItemDirection={handleFlipItemDirection}
                  onToggleLockSelected={handleToggleLockSelected}
                  isCalibratingBackground={isCalibratingBackground}
                  onFinishTwoPointCalibration={(realMeters, ptA, ptB) => {
                    handleApplyCalibrationDistance(realMeters, ptA, ptB);
                  }}
                  onCancelCalibration={() => {
                    setIsCalibratingBackground(false);
                  }}
                  selectedZoneIds={selectedZoneIds}
                  onSelectZone={handleSelectZone}
                  onMoveWall={handleMoveWall}
                  onMoveZones={handleMoveZones}
                  onToggleReferenceVisible={() =>
                    setLayers((l) => ({
                      ...l,
                      referenceOverlay: !l.referenceOverlay,
                    }))
                  }
                  onUpdateBackgroundPlan={handleUpdateBackgroundPlan}
                  onDeleteBackgroundImage={handleDeleteBackgroundImage}
                  onUploadReferenceImage={(dataUrl) => {
                    commitProjectChange((prev) => ({
                      ...prev,
                      referenceImageUrl: dataUrl,
                      backgroundPlan: {
                        ...(prev.backgroundPlan || DEFAULT_BACKGROUND_PLAN),
                        imageUrl: dataUrl,
                        visible: true,
                      },
                    }));
                    setLayers((l) => ({ ...l, referenceOverlay: true }));
                  }}
                  isDrawingWall={isDrawingWall}
                  drawingSpaceId={drawingSpaceId}
                  drawingSpaceName={
                    project.zones.find((z) => z.id === drawingSpaceId)?.name || 'Espacio'
                  }
                  onFinishDrawingWall={handleFinishDrawingWall}
                  onCancelDrawingWall={handleCancelDrawingWall}
                  planElements={project.planElements || []}
                  selectedPlanElementId={selectedPlanElementId}
                  onSelectPlanElement={(elId) => {
                    setSelectedPlanElementId(elId);
                    if (elId) {
                      setSelectedItemIds([]);
                    }
                  }}
                  onUpdatePlanElement={handleUpdatePlanElement}
                  onDeletePlanElement={handleDeletePlanElement}
                  graphicResources={project.graphicLibrary || INITIAL_GRAPHIC_LIBRARY}
                  onPlaceGraphicResourceInPlan={handlePlaceGraphicResourceInPlan}
                  onMountGraphicResourceOnWall={(res) => {
                    const targetWall = selectedWall || project.walls[0];
                    if (!targetWall) return;
                    handleAddItem({
                      wallId: targetWall.id,
                      zoneId: targetWall.zoneId,
                      name: res.name,
                      code: `RES-${project.items.length + 1}`,
                      type: res.category.startsWith('people')
                        ? 'portrait_stand'
                        : res.category === 'furniture' || res.category === 'vitrines'
                        ? 'frame'
                        : 'photo',
                      category: res.category,
                      widthCm: res.defaultWidthCm,
                      heightCm: res.defaultHeightCm,
                      xCm: 40,
                      yCm: 115,
                      rotation: 0,
                      frameStyle:
                        targetWall.material === 'parchment' ? 'parchment' : 'black',
                      matWidthCm: 2,
                      description: `${res.name} (${res.defaultWidthCm}×${res.defaultHeightCm} cm) montado desde la biblioteca.`,
                      imageUrl: res.fileDataUrl || res.previewUrl,
                      locked: false,
                      visible: true,
                      aspectRatioLocked: true,
                    });
                    setSelectedWallId(targetWall.id);
                    setViewMode('elevation');
                  }}
                  onImportGraphicResources={handleImportGraphicResources}
                />
              </motion.div>
            )}

            {(viewMode === 'elevation' || viewMode === 'presentation') &&
              selectedWall && (
                <motion.div
                  key={`view-elev-${selectedWall.id}-${viewMode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 h-full flex flex-col relative"
                >
                  {viewMode === 'presentation' && (
                    <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
                      <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] text-xs text-[#171717] dark:text-[#F8FAFC] shadow-sm">
                        <span className="font-medium">
                          {selectedWall.participant}
                        </span>
                        <span className="text-[#737373]">·</span>
                        <span className="text-[#737373] dark:text-[#94A3B8]">
                          {selectedWall.name} ({selectedWall.lengthM.toFixed(2)} ×{' '}
                          {selectedWall.heightM.toFixed(2)} m)
                        </span>
                      </div>

                      <div className="pointer-events-auto flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const idx = project.walls.findIndex(
                              (w) => w.id === selectedWall.id
                            );
                            const prevWall =
                              project.walls[
                                (idx - 1 + project.walls.length) %
                                  project.walls.length
                              ];
                            setSelectedWallId(prevWall.id);
                          }}
                          className="px-2.5 py-1.5 rounded bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] text-xs flex items-center gap-1 hover:bg-[#FAF8F5] dark:hover:bg-[#252D3D] cursor-pointer shadow-xs"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Anterior</span>
                        </button>

                        <button
                          onClick={() => {
                            const idx = project.walls.findIndex(
                              (w) => w.id === selectedWall.id
                            );
                            const nextWall =
                              project.walls[(idx + 1) % project.walls.length];
                            setSelectedWallId(nextWall.id);
                          }}
                          className="px-2.5 py-1.5 rounded bg-white dark:bg-[#1A1F2C] border border-[#E6E4DD] dark:border-[#2D3748] text-xs flex items-center gap-1 hover:bg-[#FAF8F5] dark:hover:bg-[#252D3D] cursor-pointer shadow-xs"
                        >
                          <span>Siguiente</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setViewMode('elevation')}
                          className="px-3 py-1.5 rounded bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>Salir</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <ElevationCanvas
                    svgRef={activeSvgRef}
                    wall={selectedWall}
                    allWalls={project.walls}
                    items={project.items}
                    layers={layers}
                    layerStates={project.layerStates || INITIAL_LAYER_STATES}
                    graphicResources={project.graphicLibrary || INITIAL_GRAPHIC_LIBRARY}
                    selectedItemIds={selectedItemIds}
                    validationIssues={validationIssues}
                    isDark={isDark}
                    isPresentationMode={viewMode === 'presentation'}
                    onBackToPlan={() => {
                      setViewMode('plan');
                      setSelectedItemIds([]);
                    }}
                    onSwitchWall={(wId) => {
                      setSelectedWallId(wId);
                      setSelectedItemIds([]);
                    }}
                    onSelectItem={(itemId, multi) => {
                      setSelectedItemIds((prev) =>
                        multi
                          ? prev.includes(itemId)
                            ? prev.filter((id) => id !== itemId)
                            : [...prev, itemId]
                          : [itemId]
                      );
                    }}
                    onClearSelection={() => setSelectedItemIds([])}
                    onUpdateItem={handleUpdateItem}
                    onAddItem={handleAddItem}
                    onDuplicateSelected={handleDuplicateSelected}
                    onDeleteSelected={handleDeleteSelected}
                    onToggleLayerState={handleToggleLayerState}
                    onToggleLayerLock={handleToggleLayerLock}
                    onImportGraphicResources={handleImportGraphicResources}
                    onDistributeUniformH={() => {
                      const ids = getTargetItemIdsOnWall(selectedWall);
                      commitProjectChange((prev) => ({
                        ...prev,
                        items: distributeHorizontallyUniform(
                          selectedWall,
                          prev.items,
                          ids
                        ),
                      }));
                    }}
                    onDistributeFixedSpacing={(spacingCm) => {
                      const ids = getTargetItemIdsOnWall(selectedWall);
                      commitProjectChange((prev) => ({
                        ...prev,
                        items: distributeWithExactSpacing(
                          selectedWall,
                          prev.items,
                          ids,
                          spacingCm,
                          150
                        ),
                      }));
                    }}
                    onDistributeUniformV={() => {
                      const ids = getTargetItemIdsOnWall(selectedWall);
                      commitProjectChange((prev) => ({
                        ...prev,
                        items: distributeVerticallyUniform(
                          selectedWall,
                          prev.items,
                          ids
                        ),
                      }));
                    }}
                    onAlignItems={(mode) => {
                      const ids = getTargetItemIdsOnWall(selectedWall);
                      commitProjectChange((prev) => ({
                        ...prev,
                        items: alignWallItems(
                          selectedWall,
                          prev.items,
                          ids,
                          mode
                        ),
                      }));
                    }}
                    onAutoFixWall={() => {
                      commitProjectChange((prev) => ({
                        ...prev,
                        items: autoFixWallIssues(selectedWall, prev.items),
                      }));
                    }}
                  />
                </motion.div>
              )}

            {viewMode === 'compare' && (
              <motion.div
                key="view-compare"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 h-full flex overflow-hidden"
              >
                <CompareView
                  project={project}
                  selectedWallId={selectedWallId}
                  onSelectWallId={setSelectedWallId}
                  onCreateSnapshot={(name, description) => {
                    const newSnap: ProposalSnapshot = {
                      id: `snap-${Date.now()}`,
                      name,
                      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                      description,
                      vertices: project.vertices,
                      walls: project.walls,
                      items: project.items,
                    };
                    commitProjectChange((prev) => ({
                      ...prev,
                      snapshots: [...prev.snapshots, newSnap],
                    }));
                  }}
                  onApplySnapshot={(snap) => {
                    commitProjectChange((prev) => ({
                      ...prev,
                      vertices: snap.vertices,
                      walls: snap.walls,
                      items: snap.items,
                    }));
                  }}
                />
              </motion.div>
            )}

            {viewMode === 'inventory' && (
              <motion.div
                key="view-inventory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 h-full flex overflow-hidden"
              >
                <InventoryView
                  project={project}
                  onOpenWallElevation={(wId) => {
                    setSelectedWallId(wId);
                    setViewMode('elevation');
                  }}
                  onExportWallPdf={(wall) => exportTechnicalSheetPdf(project, wall)}
                  onExportAllPdf={() => exportTechnicalSheetPdf(project)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* RIGHT INSPECTOR PANEL (Contextual & Collapsible) */}
        {(viewMode === 'plan' || viewMode === 'elevation') && isRightInspectorOpen && (
          <RightInspector
            viewMode={viewMode}
            selectedWall={
              selectedWallId
                ? project.walls.find((w) => w.id === selectedWallId) || null
                : null
            }
            selectedItems={selectedItems}
            allWallItems={project.items}
            selectedZone={selectedZone}
            onUpdateZone={handleUpdateZone}
            backgroundPlan={project.backgroundPlan}
            onUpdateBackgroundPlan={handleUpdateBackgroundPlan}
            onStartTwoPointCalibration={() => setIsCalibratingBackground(true)}
            onResetBackgroundPlan={handleResetBackgroundPlan}
            onDeleteBackgroundImage={handleDeleteBackgroundImage}
            verifications={project.verifications}
            validationIssues={validationIssues}
            referenceOpacity={project.referenceOpacity}
            referenceVisible={layers.referenceOverlay}
            onUpdateWallLength={handleUpdateWallLength}
            onUpdateWall={handleUpdateWall}
            onUpdateItem={(id, patch) => handleUpdateItem(id, patch, true)}
            onUpdateMultipleItems={handleUpdateMultipleItems}
            onSetWallPhotoCount={handleSetWallPhotoCount}
            onOpenWallElevation={(wId) => {
              setSelectedWallId(wId);
              setViewMode('elevation');
            }}
            onDuplicateSelected={handleDuplicateSelected}
            onDeleteSelected={handleDeleteSelected}
            onResolveVerification={handleResolveVerification}
            onChangeReferenceOpacity={(opacity) =>
              commitProjectChange(
                (prev) => ({ ...prev, referenceOpacity: opacity }),
                false
              )
            }
            onToggleReferenceVisible={() =>
              setLayers((l) => ({
                ...l,
                referenceOverlay: !l.referenceOverlay,
              }))
            }
            onUploadReferenceImage={(dataUrl) => {
              commitProjectChange((prev) => ({
                ...prev,
                referenceImageUrl: dataUrl,
                backgroundPlan: {
                  ...(prev.backgroundPlan || DEFAULT_BACKGROUND_PLAN),
                  imageUrl: dataUrl,
                  visible: true,
                },
              }));
              setLayers((l) => ({ ...l, referenceOverlay: true }));
            }}
            onExportWallPdf={(wall) => exportTechnicalSheetPdf(project, wall)}
            allZones={project.zones}
            allWalls={project.walls}
            onSelectWall={(wId) => {
              setSelectedWallId(wId);
              const w = project.walls.find((x) => x.id === wId);
              if (w) setSelectedZoneId(w.zoneId);
            }}
            onOpenSpaceAdmin={handleOpenSpaceAdmin}
            onStartDrawingWall={handleStartDrawingWall}
            onOpenCreateWallModal={handleOpenCreateWallModal}
            onDuplicateWall={handleDuplicateWall}
            onSplitWall={handleSplitWall}
            onPromptDeleteWall={handlePromptDeleteWall}
            onFlipWallDirection={handleFlipWallDirection}
            onFlipItemDirection={handleFlipItemDirection}
            onCreateOppositeWallFace={handleCreateOppositeWallFace}
            onRemoveOppositeWallFace={handleRemoveOppositeWallFace}
            selectedZoneIds={selectedZoneIds}
            onSelectZone={handleSelectZone}
            onMoveZones={handleMoveZones}
            onMoveWall={handleMoveWall}
            onReassignWallZone={handleReassignWallZone}
            selectedPlanElement={selectedPlanElement}
            onUpdatePlanElement={handleUpdatePlanElement}
            onDuplicatePlanElement={handleDuplicatePlanElement}
            onDeletePlanElement={handleDeletePlanElement}
          />
        )}
      </div>

      {/* CONFIRM DELETE ZONE MODAL */}
      <ConfirmDeleteZoneModal
        isOpen={Boolean(zoneToDelete)}
        zone={zoneToDelete}
        allZones={project.zones}
        walls={project.walls}
        items={project.items}
        onClose={() => setZoneToDelete(null)}
        onConfirmDelete={(zoneId, action, targetZoneId) => {
          handleConfirmDeleteZone(zoneId, action === 'delete_contents', targetZoneId);
        }}
      />

      {/* TRASH (PAPELERA) MODAL */}
      <TrashModal
        isOpen={isTrashOpen}
        trash={project.trash || []}
        onClose={() => setIsTrashOpen(false)}
        onRestoreItem={handleRestoreFromTrash}
        onRestoreAll={handleRestoreAllTrash}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* BACKGROUND PLAN CALIBRATION MODAL */}
      <BackgroundCalibrationModal
        isOpen={isBgModalOpen}
        backgroundPlan={project.backgroundPlan}
        onClose={() => setIsBgModalOpen(false)}
        onUpdateBackgroundPlan={handleUpdateBackgroundPlan}
        onStartTwoPointCalibration={() => {
          setIsBgModalOpen(false);
          setIsCalibratingBackground(true);
        }}
        onResetBackgroundPlan={handleResetBackgroundPlan}
        onDeleteBackgroundImage={handleDeleteBackgroundImage}
        onUploadBackgroundImage={(dataUrl) => {
          handleUpdateBackgroundPlan({ imageUrl: dataUrl, visible: true });
        }}
      />

      {/* CREATE SPACE WIZARD MODAL */}
      <CreateSpaceModal
        isOpen={isCreateSpaceOpen}
        onClose={() => setIsCreateSpaceOpen(false)}
        onCreateSpace={handleCreateSpaceFromModal}
      />

      {/* CREATE WALL WITH DIMENSIONS MODAL */}
      <CreateWallModal
        isOpen={isCreateWallOpen}
        onClose={() => setIsCreateWallOpen(false)}
        zones={project.zones}
        defaultZoneId={targetZoneIdForWall || selectedZoneId || project.zones[0]?.id}
        onCreateWall={handleCreateWallWithDimensions}
      />

      {/* GENERATE PERIMETER ROOM WALLS MODAL */}
      <GeneratePerimeterWallsModal
        isOpen={isGeneratePerimeterOpen}
        onClose={() => setIsGeneratePerimeterOpen(false)}
        zones={project.zones}
        defaultZoneId={targetZoneIdForWall || selectedZoneId || project.zones[0]?.id}
        onGenerateRoom={handleGeneratePerimeterWalls}
      />

      {/* SAFE DELETE WALL MODAL */}
      <DeleteWallModal
        isOpen={isDeleteWallModalOpen}
        wall={wallToDelete}
        items={project.items}
        onClose={() => {
          setIsDeleteWallModalOpen(false);
          setWallToDelete(null);
        }}
        onConfirmDelete={handleConfirmDeleteWall}
      />

      {/* ASSIGN ARTWORK TO WALL MODAL */}
      <AssignArtworkModal
        isOpen={isAssignArtworkOpen}
        item={itemToAssign}
        walls={project.walls}
        onClose={() => {
          setIsAssignArtworkOpen(false);
          setItemToAssign(null);
        }}
        onAssignToWall={handleAssignArtworkToWall}
      />

      {/* SPACE ADMINISTRATION MODAL */}
      <SpaceAdminModal
        isOpen={isSpaceAdminOpen}
        onClose={() => {
          setIsSpaceAdminOpen(false);
          setAdminZone(null);
        }}
        zone={adminZone || selectedZone || project.zones[0] || null}
        walls={project.walls}
        items={project.items}
        allZones={project.zones}
        onReassignWallZone={handleReassignWallZone}
        onReassignMultipleWalls={handleReassignMultipleWalls}
        onOpenElevation={(wallId) => {
          setIsSpaceAdminOpen(false);
          setSelectedWallId(wallId);
          setViewMode('elevation');
        }}
        onSelectWall={(wallId) => {
          setSelectedWallId(wallId);
        }}
        onStartDrawingWall={(zoneId) => {
          setIsSpaceAdminOpen(false);
          handleStartDrawingWall(zoneId);
        }}
        onOpenCreateWallModal={(zoneId) => {
          setIsSpaceAdminOpen(false);
          handleOpenCreateWallModal(zoneId);
        }}
        onOpenGeneratePerimeterModal={(zoneId) => {
          setIsSpaceAdminOpen(false);
          handleOpenGeneratePerimeterModal(zoneId);
        }}
        onDuplicateWall={handleDuplicateWall}
        onSplitWall={handleSplitWall}
        onPromptDeleteWall={handlePromptDeleteWall}
        onUpdateZone={handleUpdateZone}
        onOpenAssignArtworkModal={handleOpenAssignArtwork}
        onFlipWallDirection={handleFlipWallDirection}
        onCreateOppositeWallFace={handleCreateOppositeWallFace}
        onUpdateWall={handleUpdateWall}
        onDeleteItem={handleDeleteItemById}
      />

      {/* GUIDED ACCEPTANCE TEST MODAL (11 PASOS) */}
      <GuidedTestModal
        isOpen={isGuidedTestOpen}
        onClose={() => setIsGuidedTestOpen(false)}
        project={project}
      />
    </div>
  );
}
