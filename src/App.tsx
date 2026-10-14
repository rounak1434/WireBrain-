import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Project,
  Board,
  CanvasElement,
  Connector,
  ToolMode,
  ActiveSidebarTab,
  ElementType,
  ThemeMode,
  EditorMode,
  ReusableComponentDefinition,
  DesignTokens,
} from './types';
import {
  loadProjectFromStorage,
  saveProjectToStorage,
  importProjectFromFile,
  exportProjectToFile,
  loadThemePreference,
  saveThemePreference,
  isWelcomeCompleted,
  setWelcomeCompleted,
  loadTutorialProgress,
  saveTutorialProgress,
  loadSidebarWidth,
  saveSidebarWidth,
  loadInspectorWidth,
  saveInspectorWidth,
} from './utils/storage';
import { exportBoardToSVG, exportBoardToPNG } from './utils/export';
import { getBoundingBox } from './utils/geometry';
import { getScenariosForBoard } from './utils/simulation';
import { ensureElementFitsContent, calculateElementFitSize } from './utils/autoSize';
import { themes } from './styles/theme';
import { useHistory } from './hooks/useHistory';
import { NavigationRail } from './components/layout/NavigationRail';
import { Sidebar } from './components/layout/Sidebar';
import { PanelResizeHandle } from './components/layout/PanelResizeHandle';
import { TopToolbar } from './components/layout/TopToolbar';
import { PropertiesInspector } from './components/layout/PropertiesInspector';
import { Canvas } from './components/canvas/Canvas';
import { ExportModal } from './components/modals/ExportModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { GuidedTour } from './components/tutorial/GuidedTour';
import { SimulationController } from './components/simulation/SimulationController';
import { PrototypePreview } from './components/prototype/PrototypePreview';
import { ExampleProjectDefinition } from './data/exampleProjects';
import { defaultDesignTokens } from './data/starterBoards';

export const App: React.FC = () => {
  // Theme state
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadThemePreference());
  const theme = themes[themeMode];

  const handleToggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === 'pure-black' ? 'midnight' : 'pure-black';
      saveThemePreference(next);
      return next;
    });
  };

  // Initialize project state from local persistence
  const [project, setProject] = useState<Project>(() => loadProjectFromStorage());

  // Active Board
  const activeBoard = useMemo(() => {
    return project.boards.find((b) => b.id === project.activeBoardId) || project.boards[0];
  }, [project.boards, project.activeBoardId]);

  // Undo / Redo history for active board
  const history = useHistory<Board>(activeBoard);

  // Sync board changes into project and auto-persist to storage
  useEffect(() => {
    setProject((prev) => {
      const updatedBoards = prev.boards.map((b) =>
        b.id === history.state.id ? history.state : b
      );
      const nextProj = { ...prev, boards: updatedBoards };
      saveProjectToStorage(nextProj);
      return nextProj;
    });
  }, [history.state]);

  // Layout & Tool States
  const [activeSidebarTab, setActiveSidebarTab] = useState<ActiveSidebarTab>('boards');
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);

  // Editor Modes: 'edit' | 'simulate' | 'prototype'
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');

  // Canvas View States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 100, y: 60 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Modals & Guided Tour
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => !isWelcomeCompleted());
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Tutorial Progress
  const [completedGuides, setCompletedGuides] = useState<Record<string, boolean>>(() =>
    loadTutorialProgress()
  );

  const handleToggleGuideComplete = (guideId: string) => {
    setCompletedGuides((prev) => {
      const next = { ...prev, [guideId]: !prev[guideId] };
      saveTutorialProgress(next);
      return next;
    });
  };

  // Current elements and connectors from active history state
  const currentElements = history.state.elements;
  const currentConnectors = history.state.connectors;

  // Simulation Engine State
  const scenarios = useMemo(() => getScenariosForBoard(history.state), [history.state]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(() => scenarios[0]?.id || '');
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);
  const [tokenProgress, setTokenProgress] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  // When switching active boards, reset history and fully initialize fresh simulation state for target board
  const handleSelectBoard = useCallback(
    (boardId: string) => {
      const target = project.boards.find((b) => b.id === boardId);
      if (target) {
        setProject((prev) => {
          const next = { ...prev, activeBoardId: boardId };
          saveProjectToStorage(next);
          return next;
        });
        history.reset(target);
        setSelectedElementIds([]);
        setSelectedConnectorId(null);

        // Reset running simulation playback
        setIsSimRunning(false);
        setSimStepIndex(0);
        setTokenProgress(0);

        // Initialize fresh scenarios for newly selected target board
        const targetScenarios = getScenariosForBoard(target);
        if (targetScenarios.length > 0) {
          setActiveScenarioId(targetScenarios[0].id);
        } else {
          setActiveScenarioId('');
        }

        // If prototype preview was open, ensure newly selected board has frames
        if (editorMode === 'prototype') {
          const hasFrames = target.elements.some((el) => el.type.startsWith('frame'));
          if (!hasFrames) {
            setEditorMode('edit');
          }
        }
      }
    },
    [project.boards, history, editorMode]
  );

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) || scenarios[0],
    [scenarios, activeScenarioId]
  );

  const currentStep =
    activeScenario && activeScenario.steps.length > 0
      ? activeScenario.steps[Math.min(simStepIndex, activeScenario.steps.length - 1)]
      : null;

  useEffect(() => {
    if (scenarios.length > 0 && !scenarios.some((s) => s.id === activeScenarioId)) {
      setActiveScenarioId(scenarios[0].id);
      setSimStepIndex(0);
      setTokenProgress(0);
    }
  }, [scenarios, activeScenarioId]);

  // Ensure simulation step index stays within valid range when diagram elements/connectors are edited
  useEffect(() => {
    if (!activeScenario || activeScenario.steps.length === 0) {
      setSimStepIndex(0);
      setTokenProgress(0);
    } else if (simStepIndex >= activeScenario.steps.length) {
      setSimStepIndex(0);
      setTokenProgress(0);
    }
  }, [activeScenario, simStepIndex]);

  // Simulation Animation Loop
  useEffect(() => {
    if (editorMode !== 'simulate' || !isSimRunning || !activeScenario || activeScenario.steps.length === 0) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setTokenProgress((prev) => {
        const next = prev + dt * 0.75 * simSpeed;
        if (next >= 1.0) {
          // Advance to next step
          setSimStepIndex((s) => {
            if (s + 1 >= activeScenario.steps.length) {
              return 0; // Loop or restart
            }
            return s + 1;
          });
          return 0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [editorMode, isSimRunning, activeScenario, simSpeed]);

  // Resizable Side Panel Widths (persisted to localStorage)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => loadSidebarWidth(270));
  const [inspectorWidth, setInspectorWidth] = useState<number>(() => loadInspectorWidth(280));

  // Sidebar resize callbacks
  const handleResizeSidebar = useCallback(
    (clientX: number) => {
      const NAV_WIDTH = 54;
      const MIN_CANVAS_WIDTH = 260;
      const MIN_SIDEBAR_WIDTH = 200;
      const MAX_SIDEBAR_WIDTH = 480;

      const maxAllowed = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, window.innerWidth - NAV_WIDTH - MIN_CANVAS_WIDTH - inspectorWidth)
      );
      const targetW = Math.min(maxAllowed, Math.max(MIN_SIDEBAR_WIDTH, clientX - NAV_WIDTH));
      setSidebarWidth(targetW);
    },
    [inspectorWidth]
  );

  const handleResizeSidebarEnd = useCallback(() => {
    saveSidebarWidth(sidebarWidth);
  }, [sidebarWidth]);

  const handleResetSidebarWidth = useCallback(() => {
    setSidebarWidth(270);
    saveSidebarWidth(270);
  }, []);

  // Inspector resize callbacks
  const handleResizeInspector = useCallback(
    (clientX: number) => {
      const NAV_WIDTH = 54;
      const MIN_CANVAS_WIDTH = 260;
      const MIN_INSPECTOR_WIDTH = 220;
      const MAX_INSPECTOR_WIDTH = 520;

      const maxAllowed = Math.min(
        MAX_INSPECTOR_WIDTH,
        Math.max(MIN_INSPECTOR_WIDTH, window.innerWidth - NAV_WIDTH - sidebarWidth - MIN_CANVAS_WIDTH)
      );
      const targetW = Math.min(maxAllowed, Math.max(MIN_INSPECTOR_WIDTH, window.innerWidth - clientX));
      setInspectorWidth(targetW);
    },
    [sidebarWidth]
  );

  const handleResizeInspectorEnd = useCallback(() => {
    saveInspectorWidth(inspectorWidth);
  }, [inspectorWidth]);

  const handleResetInspectorWidth = useCallback(() => {
    setInspectorWidth(280);
    saveInspectorWidth(280);
  }, []);

  // Ensure side panels don't compress canvas below minimum on window shrink
  useEffect(() => {
    const handleWindowResize = () => {
      const totalAvail = window.innerWidth - 54 - 260;
      if (sidebarWidth + inspectorWidth > totalAvail) {
        const overflow = sidebarWidth + inspectorWidth - totalAvail;
        if (overflow > 0) {
          setSidebarWidth((prev) => Math.max(200, prev - Math.ceil(overflow / 2)));
          setInspectorWidth((prev) => Math.max(220, prev - Math.ceil(overflow / 2)));
        }
      }
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [sidebarWidth, inspectorWidth]);

  // Fit to Content calculation
  const handleFitContent = useCallback(() => {
    if (currentElements.length === 0) {
      setZoom(1);
      setPan({ x: 100, y: 60 });
      return;
    }
    const bbox = getBoundingBox(currentElements);
    const canvasWidth = window.innerWidth - 54 - sidebarWidth - inspectorWidth;
    const canvasHeight = window.innerHeight - 48;

    const pad = 80;
    const scaleX = (canvasWidth - pad * 2) / bbox.width;
    const scaleY = (canvasHeight - pad * 2) / bbox.height;
    const newZoom = Math.min(1.4, Math.max(0.3, Math.min(scaleX, scaleY)));

    const newPanX = (canvasWidth - bbox.width * newZoom) / 2 - bbox.x * newZoom;
    const newPanY = (canvasHeight - bbox.height * newZoom) / 2 - bbox.y * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [currentElements, sidebarWidth, inspectorWidth]);

  // Mutate Elements
  const updateElements = useCallback(
    (nextElements: CanvasElement[]) => {
      history.set((prev) => ({
        ...prev,
        elements: nextElements,
        updatedAt: Date.now(),
      }));
    },
    [history]
  );

  const updateSingleElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      history.set((prev) => {
        const target = prev.elements.find((el) => el.id === id);
        if (!target) return prev;

        let finalUpdates = { ...updates };
        const hasTextChange =
          updates.label !== undefined ||
          updates.secondaryText !== undefined ||
          updates.fontSize !== undefined ||
          updates.fontWeight !== undefined;

        // Auto-fit element size when text changes and no explicit width/height override
        if (hasTextChange && updates.width === undefined && updates.height === undefined) {
          const fit = ensureElementFitsContent(target, updates);
          finalUpdates = {
            ...finalUpdates,
            width: fit.width,
            height: fit.height,
            autoSize: fit.autoSize,
          };
        }

        return {
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === id ? { ...el, ...finalUpdates } : el
          ),
          updatedAt: Date.now(),
        };
      });
    },
    [history]
  );

  const deleteElements = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      history.set((prev) => ({
        ...prev,
        elements: prev.elements.filter((el) => !ids.includes(el.id)),
        connectors: prev.connectors.filter(
          (c) => !ids.includes(c.fromId) && !ids.includes(c.toId)
        ),
        updatedAt: Date.now(),
      }));
      setSelectedElementIds([]);
    },
    [history]
  );

  const duplicateElements = useCallback(
    (targets: CanvasElement[]) => {
      if (targets.length === 0) return;
      const offset = 30;
      const newItems: CanvasElement[] = targets.map((el) => ({
        ...el,
        id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        x: el.x + offset,
        y: el.y + offset,
      }));

      history.set((prev) => ({
        ...prev,
        elements: [...prev.elements, ...newItems],
        updatedAt: Date.now(),
      }));
      setSelectedElementIds(newItems.map((el) => el.id));
    },
    [history]
  );

  // Add Element
  const addElement = useCallback(
    (type: ElementType, customProps?: Partial<CanvasElement>) => {
      const id = `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const centerX = Math.round((-pan.x + 400) / zoom);
      const centerY = Math.round((-pan.y + 250) / zoom);

      let defaultWidth = 160;
      let defaultHeight = 80;
      let label = type.charAt(0).toUpperCase() + type.slice(1);
      let fillColor = '#10141e';
      let strokeColor = '#252936';

      if (type === 'frame-desktop') {
        defaultWidth = 1080;
        defaultHeight = 720;
        label = 'Website Frame';
        fillColor = '#0b0c10';
        strokeColor = '#242935';
      } else if (type === 'frame-mobile') {
        defaultWidth = 375;
        defaultHeight = 760;
        label = 'Mobile Frame';
        fillColor = '#080a0e';
        strokeColor = '#242935';
      } else if (type === 'button') {
        defaultWidth = 140;
        defaultHeight = 40;
        label = 'Get Started';
        fillColor = theme.accent;
        strokeColor = '#2563eb';
      } else if (type === 'input') {
        defaultWidth = 240;
        defaultHeight = 40;
        label = 'Input placeholder...';
        fillColor = '#12151d';
        strokeColor = '#242a38';
      } else if (type === 'image') {
        defaultWidth = 300;
        defaultHeight = 180;
        label = 'Preview Image Mockup';
        fillColor = '#12151d';
        strokeColor = '#242a38';
      } else if (type === 'diamond') {
        defaultWidth = 130;
        defaultHeight = 85;
        label = 'Decision';
      } else if (type === 'cylinder') {
        defaultWidth = 160;
        defaultHeight = 90;
        label = 'PostgreSQL DB';
        fillColor = '#0e161f';
        strokeColor = '#224a68';
      } else if (type === 'service') {
        defaultWidth = 180;
        defaultHeight = 80;
        label = 'Microservice';
        fillColor = '#111724';
        strokeColor = theme.accent;
      }

      const newEl: CanvasElement = {
        id,
        type,
        x: centerX,
        y: centerY,
        width: defaultWidth,
        height: defaultHeight,
        label,
        fillColor,
        strokeColor,
        strokeWidth: 1,
        cornerRadius: 6,
        fontSize: 14,
        ...customProps,
      };

      history.set((prev) => ({
        ...prev,
        elements: [...prev.elements, newEl],
        updatedAt: Date.now(),
      }));

      setSelectedElementIds([id]);
      setSelectedConnectorId(null);
    },
    [pan, zoom, history, theme]
  );

  const createElementAt = useCallback(
    (type: ElementType, x: number, y: number) => {
      addElement(type, { x, y });
      setToolMode('select');
    },
    [addElement]
  );

  // Connectors
  const createConnector = useCallback(
    (conn: Omit<Connector, 'id'>) => {
      const id = `conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newConn: Connector = { id, ...conn };
      history.set((prev) => ({
        ...prev,
        connectors: [...prev.connectors, newConn],
        updatedAt: Date.now(),
      }));
      setSelectedConnectorId(id);
      setSelectedElementIds([]);
    },
    [history]
  );

  const updateConnector = useCallback(
    (id: string, updates: Partial<Connector>) => {
      history.set((prev) => ({
        ...prev,
        connectors: prev.connectors.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        updatedAt: Date.now(),
      }));
    },
    [history]
  );

  const deleteConnector = useCallback(
    (id: string) => {
      history.set((prev) => ({
        ...prev,
        connectors: prev.connectors.filter((c) => c.id !== id),
        updatedAt: Date.now(),
      }));
      setSelectedConnectorId(null);
    },
    [history]
  );

  // Layer Reordering & Visibility
  const toggleVisibility = useCallback(
    (id: string) => {
      history.set((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === id ? { ...el, hidden: !el.hidden } : el)),
      }));
    },
    [history]
  );

  const toggleLock = useCallback(
    (id: string) => {
      history.set((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el)),
      }));
    },
    [history]
  );

  const reorderElement = useCallback(
    (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
      history.set((prev) => {
        const index = prev.elements.findIndex((el) => el.id === id);
        if (index === -1) return prev;
        const newEls = [...prev.elements];
        const target = newEls.splice(index, 1)[0];
        if (direction === 'up') {
          newEls.splice(Math.min(newEls.length, index + 1), 0, target);
        } else if (direction === 'down') {
          newEls.splice(Math.max(0, index - 1), 0, target);
        } else if (direction === 'top') {
          newEls.push(target);
        } else if (direction === 'bottom') {
          newEls.unshift(target);
        }
        return { ...prev, elements: newEls, updatedAt: Date.now() };
      });
    },
    [history]
  );

  const groupElements = useCallback(
    (ids: string[], customName?: string) => {
      if (ids.length < 2) return;
      const groupId = `group-${Date.now()}`;
      const groupName = customName || `Group ${groupId.slice(-4)}`;
      history.set((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          ids.includes(el.id) ? { ...el, groupId, groupName } : el
        ),
        updatedAt: Date.now(),
      }));
      setSelectedElementIds(ids);
    },
    [history]
  );

  const ungroupElements = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      history.set((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => {
          if (ids.includes(el.id) || (el.groupId && ids.includes(el.groupId))) {
            const next = { ...el };
            delete next.groupId;
            delete next.groupName;
            return next;
          }
          return el;
        }),
        updatedAt: Date.now(),
      }));
    },
    [history]
  );

  const renameElement = useCallback(
    (id: string, newLabel: string) => {
      if (!newLabel.trim()) return;
      updateSingleElement(id, { label: newLabel.trim() });
    },
    [updateSingleElement]
  );

  // Reusable Components Handlers
  const handleSaveReusableComponent = useCallback(
    (name: string, category: string, description?: string) => {
      const selected = currentElements.filter((el) => selectedElementIds.includes(el.id));
      if (selected.length === 0) return;

      const minX = Math.min(...selected.map((e) => e.x));
      const minY = Math.min(...selected.map((e) => e.y));

      const normalizedElements: CanvasElement[] = selected.map((el) => ({
        ...el,
        x: el.x - minX,
        y: el.y - minY,
      }));

      const newComponent: ReusableComponentDefinition = {
        id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        category: category || 'Custom',
        description,
        elements: normalizedElements,
        createdAt: Date.now(),
      };

      setProject((prev) => {
        const existing = prev.reusableComponents || [];
        const updated = [newComponent, ...existing];
        const nextProject: Project = { ...prev, reusableComponents: updated };
        saveProjectToStorage(nextProject);
        return nextProject;
      });
    },
    [currentElements, selectedElementIds]
  );

  const handleDeleteReusableComponent = useCallback((componentId: string) => {
    setProject((prev) => {
      const existing = prev.reusableComponents || [];
      const updated = existing.filter((c) => c.id !== componentId);
      const nextProject: Project = { ...prev, reusableComponents: updated };
      saveProjectToStorage(nextProject);
      return nextProject;
    });
  }, []);

  const handleInsertComponentInstance = useCallback(
    (componentDef: ReusableComponentDefinition) => {
      if (!componentDef.elements || componentDef.elements.length === 0) return;

      const spawnX = 140 + Math.floor(Math.random() * 30);
      const spawnY = 140 + Math.floor(Math.random() * 30);
      const instanceGroupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newElementIds: string[] = [];

      const newElements: CanvasElement[] = componentDef.elements.map((el, idx) => {
        const newId = `inst-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
        newElementIds.push(newId);
        return {
          ...el,
          id: newId,
          x: el.x + spawnX,
          y: el.y + spawnY,
          groupId: componentDef.elements.length > 1 ? instanceGroupId : undefined,
          groupName: componentDef.elements.length > 1 ? componentDef.name : undefined,
        };
      });

      history.set({
        ...activeBoard,
        elements: [...currentElements, ...newElements],
        updatedAt: Date.now(),
      });
      setSelectedElementIds(newElementIds);
    },
    [activeBoard, currentElements, history]
  );

  // Design Tokens Handlers
  const handleUpdateDesignTokens = useCallback((tokensUpdate: Partial<DesignTokens>) => {
    setProject((prev) => {
      const current = prev.designTokens || defaultDesignTokens;
      const updatedTokens: DesignTokens = {
        ...current,
        ...tokensUpdate,
        colors: { ...current.colors, ...(tokensUpdate.colors || {}) },
        typography: { ...current.typography, ...(tokensUpdate.typography || {}) },
        spacing: { ...current.spacing, ...(tokensUpdate.spacing || {}) },
        borderRadius: { ...current.borderRadius, ...(tokensUpdate.borderRadius || {}) },
      };
      const nextProject: Project = { ...prev, designTokens: updatedTokens };
      saveProjectToStorage(nextProject);
      return nextProject;
    });
  }, []);

  const handleApplyDesignTokensToBoard = useCallback(() => {
    const tokens = project.designTokens || defaultDesignTokens;
    const updatedElements = currentElements.map((el) => {
      if (el.type === 'button') {
        return {
          ...el,
          fillColor: tokens.colors.primary,
          cornerRadius: tokens.borderRadius.medium,
        };
      }
      if (el.type.startsWith('frame')) {
        return {
          ...el,
          fillColor: tokens.colors.surface,
          strokeColor: tokens.colors.border,
          cornerRadius: tokens.borderRadius.large,
        };
      }
      return el;
    });

    history.set({
      ...activeBoard,
      elements: updatedElements,
      updatedAt: Date.now(),
    });
  }, [activeBoard, currentElements, project.designTokens, history]);

  const handleApplyTokenToSelection = useCallback(
    (type: 'fill' | 'stroke' | 'radius', value: string | number) => {
      if (selectedElementIds.length === 0) return;
      const updated = currentElements.map((el) => {
        if (!selectedElementIds.includes(el.id)) return el;
        if (type === 'fill') return { ...el, fillColor: String(value) };
        if (type === 'stroke') return { ...el, strokeColor: String(value) };
        if (type === 'radius') return { ...el, cornerRadius: Number(value) };
        return el;
      });
      history.set({
        ...activeBoard,
        elements: updated,
        updatedAt: Date.now(),
      });
    },
    [activeBoard, currentElements, selectedElementIds, history]
  );

  // Alignment and Distribution
  const alignElements = useCallback(
    (type: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
      if (selectedElementIds.length < 2) return;
      const targets = currentElements.filter((el) => selectedElementIds.includes(el.id));
      const bbox = getBoundingBox(targets);

      const updated = currentElements.map((el) => {
        if (!selectedElementIds.includes(el.id) || el.locked) return el;
        let nx = el.x;
        let ny = el.y;

        if (type === 'left') nx = bbox.x;
        else if (type === 'center-h') nx = bbox.x + (bbox.width - el.width) / 2;
        else if (type === 'right') nx = bbox.x + bbox.width - el.width;
        else if (type === 'top') ny = bbox.y;
        else if (type === 'center-v') ny = bbox.y + (bbox.height - el.height) / 2;
        else if (type === 'bottom') ny = bbox.y + bbox.height - el.height;

        return { ...el, x: nx, y: ny };
      });
      updateElements(updated);
    },
    [selectedElementIds, currentElements, updateElements]
  );

  const distributeElements = useCallback(
    (direction: 'h' | 'v') => {
      if (selectedElementIds.length < 3) return;
      const targets = currentElements.filter((el) => selectedElementIds.includes(el.id));
      if (direction === 'h') {
        const sorted = [...targets].sort((a, b) => a.x - b.x);
        const minX = sorted[0].x;
        const maxX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
        const totalElementsW = sorted.reduce((sum, item) => sum + item.width, 0);
        const gap = (maxX - minX - totalElementsW) / (sorted.length - 1);

        let currentX = minX;
        const posMap = new Map<string, number>();
        for (const item of sorted) {
          posMap.set(item.id, currentX);
          currentX += item.width + gap;
        }
        updateElements(
          currentElements.map((el) => (posMap.has(el.id) ? { ...el, x: posMap.get(el.id)! } : el))
        );
      } else {
        const sorted = [...targets].sort((a, b) => a.y - b.y);
        const minY = sorted[0].y;
        const maxY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
        const totalElementsH = sorted.reduce((sum, item) => sum + item.height, 0);
        const gap = (maxY - minY - totalElementsH) / (sorted.length - 1);

        let currentY = minY;
        const posMap = new Map<string, number>();
        for (const item of sorted) {
          posMap.set(item.id, currentY);
          currentY += item.height + gap;
        }
        updateElements(
          currentElements.map((el) => (posMap.has(el.id) ? { ...el, y: posMap.get(el.id)! } : el))
        );
      }
    },
    [selectedElementIds, currentElements, updateElements]
  );

  // Board Management
  const createBoard = useCallback(
    (title: string, elements: CanvasElement[] = [], connectors: Connector[] = []) => {
      const newBoard: Board = {
        id: `board-${Date.now()}`,
        title,
        description: 'New diagram workspace',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        elements,
        connectors,
      };
      setProject((prev) => {
        const next = { ...prev, boards: [...prev.boards, newBoard], activeBoardId: newBoard.id };
        saveProjectToStorage(next);
        return next;
      });
      history.reset(newBoard);
      setSelectedElementIds([]);
      setSelectedConnectorId(null);
    },
    [history]
  );

  // Create isolated practice boards for tutorials
  const handleCreateTutorialBoard = (type: 'architecture' | 'wireframe') => {
    if (type === 'architecture') {
      const practiceEls: CanvasElement[] = [
        {
          id: 'tut-client',
          type: 'rectangle',
          x: 100,
          y: 120,
          width: 160,
          height: 70,
          label: 'Client Browser',
          secondaryText: 'Originating requests',
          fillColor: '#121622',
          strokeColor: '#283144',
          strokeWidth: 2,
        },
        {
          id: 'tut-gw',
          type: 'service',
          x: 360,
          y: 120,
          width: 180,
          height: 80,
          label: 'API Gateway',
          secondaryText: 'Rate limiting & Auth',
          fillColor: '#111724',
          strokeColor: '#3b82f6',
          strokeWidth: 2,
        },
        {
          id: 'tut-db',
          type: 'cylinder',
          x: 640,
          y: 110,
          width: 160,
          height: 95,
          label: 'PostgreSQL DB',
          secondaryText: 'Target storage table',
          fillColor: '#0f171f',
          strokeColor: '#234a68',
          strokeWidth: 2,
        },
        {
          id: 'tut-note',
          type: 'rectangle',
          x: 100,
          y: 280,
          width: 500,
          height: 90,
          label: 'Hands-on Challenge Notes',
          secondaryText: '1. Select Connector tool (C).\n2. Drag arrow from Client → Gateway.\n3. Drag arrow from Gateway → Database.\n4. Click "Simulate Flow" in the top bar to watch data hops animate!',
          fillColor: '#0d1017',
          strokeColor: '#262f42',
          strokeWidth: 1,
        },
      ];
      createBoard('[Tutorial] Architecture Practice', practiceEls, []);
    } else {
      const practiceEls: CanvasElement[] = [
        {
          id: 'tut-frame',
          type: 'frame-desktop',
          x: 60,
          y: 60,
          width: 880,
          height: 600,
          label: 'Landing Page Exercise',
          urlBar: 'https://practice-sandbox.app',
          fillColor: '#090a0e',
          strokeColor: '#222734',
          strokeWidth: 2,
        },
        {
          id: 'tut-btn',
          type: 'button',
          x: 100,
          y: 160,
          width: 140,
          height: 40,
          label: 'Sign Up Free',
          fillColor: '#3b82f6',
          strokeColor: '#2563eb',
          strokeWidth: 1,
          prototypeAction: 'modal',
          prototypePayload: 'Registration Confirmation Sheet',
        },
        {
          id: 'tut-notes',
          type: 'rectangle',
          x: 100,
          y: 240,
          width: 480,
          height: 90,
          label: 'Hands-on Challenge Notes',
          secondaryText: '1. Select the "Sign Up Free" button.\n2. In Properties Inspector, view the Prototype Action.\n3. Click "Preview" in the top bar and click the button to trigger the sheet!',
          fillColor: '#0f121a',
          strokeColor: '#242a38',
          strokeWidth: 1,
        },
      ];
      createBoard('[Tutorial] Wireframe Practice', practiceEls, []);
    }
  };

  const handleOpenExampleProject = useCallback(
    (example: ExampleProjectDefinition, mode?: 'edit' | 'prototype' | 'simulate') => {
      const existing = project.boards.find((b) => b.id === example.board.id);
      if (existing) {
        handleSelectBoard(existing.id);
      } else {
        const clonedBoard: Board = JSON.parse(JSON.stringify(example.board));
        clonedBoard.updatedAt = Date.now();
        setProject((prev) => {
          const next = {
            ...prev,
            boards: [...prev.boards, clonedBoard],
            activeBoardId: clonedBoard.id,
          };
          saveProjectToStorage(next);
          return next;
        });
        history.reset(clonedBoard);
        setSelectedElementIds([]);
        setSelectedConnectorId(null);
      }

      const targetMode = mode || example.recommendedMode || 'edit';
      setEditorMode(targetMode);
      if (targetMode === 'simulate') {
        setIsSimRunning(true);
        setSimStepIndex(0);
        setTokenProgress(0);
      } else {
        setIsSimRunning(false);
      }
    },
    [project.boards, handleSelectBoard, history]
  );

  const duplicateBoard = useCallback(
    (boardId: string) => {
      const source = project.boards.find((b) => b.id === boardId);
      if (!source) return;
      const cloned: Board = {
        ...source,
        id: `board-${Date.now()}`,
        title: `${source.title} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProject((prev) => {
        const next = { ...prev, boards: [...prev.boards, cloned], activeBoardId: cloned.id };
        saveProjectToStorage(next);
        return next;
      });
      history.reset(cloned);
    },
    [project.boards, history]
  );

  const deleteBoard = useCallback(
    (boardId: string) => {
      if (project.boards.length <= 1) return;
      const remaining = project.boards.filter((b) => b.id !== boardId);
      const nextActiveId = remaining[0].id;
      setProject((prev) => {
        const next = { ...prev, boards: remaining, activeBoardId: nextActiveId };
        saveProjectToStorage(next);
        return next;
      });
      const nextBoard = remaining.find((b) => b.id === nextActiveId) || remaining[0];
      history.reset(nextBoard);
      setSelectedElementIds([]);
      setSelectedConnectorId(null);
    },
    [project.boards, history]
  );

  const renameBoard = useCallback(
    (boardId: string, newTitle: string) => {
      setProject((prev) => {
        const updated = prev.boards.map((b) => (b.id === boardId ? { ...b, title: newTitle } : b));
        const next = { ...prev, boards: updated };
        saveProjectToStorage(next);
        return next;
      });
      if (boardId === history.state.id) {
        history.set((prev) => ({ ...prev, title: newTitle }), false);
      }
    },
    [history]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        history.undo();
        return;
      }

      if (
        (isCtrlOrMeta && e.key.toLowerCase() === 'y') ||
        (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        history.redo();
        return;
      }

      if (isCtrlOrMeta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedElementIds.length > 0) {
          const targets = currentElements.filter((el) => selectedElementIds.includes(el.id));
          duplicateElements(targets);
        }
        return;
      }

      if (isCtrlOrMeta && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedElementIds(currentElements.filter((el) => !el.hidden).map((el) => el.id));
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedElementIds.length > 0) {
          deleteElements(selectedElementIds);
        } else if (selectedConnectorId) {
          deleteConnector(selectedConnectorId);
        }
        return;
      }

      if (e.key === 'Escape') {
        if (editorMode !== 'edit') {
          setEditorMode('edit');
          setIsSimRunning(false);
          return;
        }
        setSelectedElementIds([]);
        setSelectedConnectorId(null);
        setToolMode('select');
        return;
      }

      // Space key toggles playback in simulation mode
      if (editorMode === 'simulate' && e.code === 'Space') {
        e.preventDefault();
        setIsSimRunning((r) => !r);
        return;
      }

      // Single-Key Tool Shortcuts
      if (!isCtrlOrMeta && !e.altKey && editorMode === 'edit') {
        const k = e.key.toLowerCase();
        if (k === 'v') setToolMode('select');
        else if (k === 'h') setToolMode('pan');
        else if (k === 'c') setToolMode('connector');
        else if (k === 't') setToolMode('text');
        else if (k === 'r') setToolMode('rectangle');
        else if (k === 'o') setToolMode('ellipse');
        else if (k === 'd') setToolMode('diamond');
        else if (k === 'b') setToolMode('cylinder');
        else if (k === 's') setToolMode('cloud');
        else if (k === 'w') setToolMode('frame-desktop');
        else if (k === 'm') setToolMode('frame-mobile');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    history,
    selectedElementIds,
    selectedConnectorId,
    currentElements,
    deleteElements,
    deleteConnector,
    duplicateElements,
    editorMode,
  ]);

  const selectedElements = useMemo(() => {
    return currentElements.filter((el) => selectedElementIds.includes(el.id));
  }, [currentElements, selectedElementIds]);

  const selectedConnector = useMemo(() => {
    return currentConnectors.find((c) => c.id === selectedConnectorId) || null;
  }, [currentConnectors, selectedConnectorId]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: theme.appBg,
        color: theme.textPrimary,
      }}
    >
      {/* Top Toolbar */}
      <TopToolbar
        boards={project.boards}
        activeBoardId={activeBoard.id}
        onSelectBoard={handleSelectBoard}
        toolMode={toolMode}
        onSelectTool={setToolMode}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={history.undo}
        onRedo={history.redo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3.0, z * 1.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.15, z * 0.85))}
        onResetZoom={() => setZoom(1)}
        onFitContent={handleFitContent}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid((s) => !s)}
        onExportJSON={() => exportProjectToFile(project)}
        onImportJSON={async () => {
          const loaded = await importProjectFromFile();
          if (loaded) {
            setProject(loaded);
            saveProjectToStorage(loaded);
            const first = loaded.boards[0];
            if (first) history.reset(first);
          }
        }}
        onExportSVG={() => exportBoardToSVG(activeBoard)}
        onExportPNG={() => exportBoardToPNG(activeBoard)}
        theme={theme}
        editorMode={editorMode}
        onSetEditorMode={(mode) => {
          setEditorMode(mode);
          if (mode === 'simulate') {
            const hasSteps = (scenarios[0]?.steps?.length ?? 0) > 0;
            setIsSimRunning(hasSteps);
            setSimStepIndex(0);
            setTokenProgress(0);
            if (scenarios[0]) {
              setActiveScenarioId(scenarios[0].id);
            }
          } else {
            setIsSimRunning(false);
          }
        }}
      />

      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Compact Navigation Rail */}
        <NavigationRail
          activeTab={activeSidebarTab}
          onTabChange={setActiveSidebarTab}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid((g) => !g)}
          snapToGrid={snapToGrid}
          onToggleSnap={() => setSnapToGrid((s) => !s)}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          theme={theme}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
        />

        {/* Sidebar Panel */}
        <Sidebar
          width={sidebarWidth}
          activeTab={activeSidebarTab}
          boards={project.boards}
          activeBoardId={activeBoard.id}
          onSelectBoard={handleSelectBoard}
          onCreateBoard={(title) => createBoard(title)}
          onDuplicateBoard={duplicateBoard}
          onDeleteBoard={deleteBoard}
          onRenameBoard={renameBoard}
          onAddElement={addElement}
          elements={currentElements}
          selectedElementIds={selectedElementIds}
          onSelectElement={(id, isMulti) => {
            if (isMulti) {
              setSelectedElementIds((prev) =>
                prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
              );
            } else {
              setSelectedElementIds([id]);
            }
            setSelectedConnectorId(null);
          }}
          onToggleVisibility={toggleVisibility}
          onToggleLock={toggleLock}
          onReorderElement={reorderElement}
          onSelectElements={setSelectedElementIds}
          onGroupElements={groupElements}
          onUngroupElements={ungroupElements}
          onRenameElement={renameElement}
          theme={theme}
          onStartGuidedTour={() => setIsTourOpen(true)}
          onReplayWelcome={() => setIsWelcomeModalOpen(true)}
          onCreateTutorialBoard={handleCreateTutorialBoard}
          completedGuides={completedGuides}
          onToggleGuideComplete={handleToggleGuideComplete}
          onOpenExampleProject={handleOpenExampleProject}
          reusableComponents={project.reusableComponents || []}
          onInsertComponentInstance={handleInsertComponentInstance}
          onDeleteReusableComponent={handleDeleteReusableComponent}
        />

        {/* Left Resizable Divider Handle */}
        <PanelResizeHandle
          side="left"
          onResize={handleResizeSidebar}
          onResizeEnd={handleResizeSidebarEnd}
          onReset={handleResetSidebarWidth}
          theme={theme}
        />

        {/* Center Canvas */}
        <Canvas
          elements={currentElements}
          connectors={currentConnectors}
          selectedElementIds={selectedElementIds}
          selectedConnectorId={selectedConnectorId}
          toolMode={toolMode}
          onSelectElements={(ids) => {
            setSelectedElementIds(ids);
            if (ids.length > 0) setSelectedConnectorId(null);
          }}
          onSelectConnector={(id) => {
            setSelectedConnectorId(id);
            if (id) setSelectedElementIds([]);
          }}
          onUpdateElements={updateElements}
          onCreateConnector={createConnector}
          onCreateElementAt={createElementAt}
          onUpdateElementText={(id, text) => updateSingleElement(id, { label: text })}
          zoom={zoom}
          setZoom={setZoom}
          pan={pan}
          setPan={setPan}
          snapToGrid={snapToGrid}
          showGrid={showGrid}
          theme={theme}
          isSimulating={editorMode === 'simulate'}
          activeSimulationStep={currentStep}
          tokenProgress={tokenProgress}
        />

        {/* Right Resizable Divider Handle */}
        <PanelResizeHandle
          side="right"
          onResize={handleResizeInspector}
          onResizeEnd={handleResizeInspectorEnd}
          onReset={handleResetInspectorWidth}
          theme={theme}
        />

        {/* Properties Inspector */}
        <PropertiesInspector
          width={inspectorWidth}
          board={activeBoard}
          allBoards={project.boards}
          selectedElements={selectedElements}
          selectedConnector={selectedConnector}
          onUpdateElement={updateSingleElement}
          onUpdateConnector={updateConnector}
          onDeleteElements={deleteElements}
          onDeleteConnector={deleteConnector}
          onDuplicateElements={duplicateElements}
          onAlignElements={alignElements}
          onDistributeElements={distributeElements}
          onGroupElements={groupElements}
          onUngroupElements={ungroupElements}
          onReorderElement={reorderElement}
          onUpdateBoardTitle={(title) => renameBoard(activeBoard.id, title)}
          onUpdateBoardDesc={(desc) =>
            history.set((prev) => ({ ...prev, description: desc }), false)
          }
          theme={theme}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
          onSaveReusableComponent={handleSaveReusableComponent}
          designTokens={project.designTokens || defaultDesignTokens}
          onUpdateDesignTokens={handleUpdateDesignTokens}
          onApplyDesignTokensToBoard={handleApplyDesignTokensToBoard}
          onApplyTokenToSelection={handleApplyTokenToSelection}
        />

        {/* Floating Simulation Controls in Simulate Mode */}
        {editorMode === 'simulate' && (
          <SimulationController
            theme={theme}
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onSelectScenario={(id) => {
              setActiveScenarioId(id);
              setSimStepIndex(0);
              setTokenProgress(0);
            }}
            isRunning={isSimRunning}
            onTogglePlay={() => setIsSimRunning((r) => !r)}
            onStepForward={() => {
              if (activeScenario && activeScenario.steps.length > 0) {
                setIsSimRunning(false);
                setSimStepIndex((s) => (s + 1 >= activeScenario.steps.length ? 0 : s + 1));
                setTokenProgress(0);
              }
            }}
            onRestart={() => {
              setSimStepIndex(0);
              setTokenProgress(0);
            }}
            speed={simSpeed}
            onChangeSpeed={setSimSpeed}
            currentStepIndex={simStepIndex}
            totalSteps={activeScenario?.steps.length || 0}
            currentStep={currentStep}
            onExitSimulation={() => {
              setEditorMode('edit');
              setIsSimRunning(false);
            }}
            onOpenDevicePreview={
              activeBoard.elements.some((e) => e.type.startsWith('frame'))
                ? () => {
                    setEditorMode('prototype');
                    setIsSimRunning(false);
                  }
                : undefined
            }
            isWireframe={activeBoard.elements.some((e) => e.type.startsWith('frame'))}
            boardTitle={activeBoard.title}
          />
        )}
      </div>

      {/* Full Screen Prototype Preview in Prototype Mode */}
      {editorMode === 'prototype' && (
        <PrototypePreview
          board={activeBoard}
          allBoards={project.boards}
          onExit={() => setEditorMode('edit')}
          theme={theme}
        />
      )}

      {/* Modals & Overlays */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        board={activeBoard}
        project={project}
      />
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => {
          setIsWelcomeModalOpen(false);
          setWelcomeCompleted(true);
        }}
        onSelectBoard={handleSelectBoard}
        onCreateBoard={(title) => createBoard(title)}
        theme={theme}
      />
      <GuidedTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        theme={theme}
      />
    </div>
  );
};
export default App;
