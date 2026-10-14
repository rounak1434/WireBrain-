import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  CanvasElement,
  Connector,
  ToolMode,
  AnchorPosition,
  ElementType,
  SimulationStep,
} from '../../types';
import { ThemeColors } from '../../styles/theme';
import { ElementRenderer } from './ElementRenderer';
import { ConnectorRenderer } from './ConnectorRenderer';
import { ResizeHandles, HandleDirection } from './ResizeHandles';
import { AnchorPoints } from './AnchorPoints';
import { snap, rectIntersectsRect, getAnchorPoint, getClosestAnchor, getPointAlongConnector } from '../../utils/geometry';
import { importLocalImageFile } from '../../utils/assets';

interface CanvasProps {
  elements: CanvasElement[];
  connectors: Connector[];
  selectedElementIds: string[];
  selectedConnectorId: string | null;
  toolMode: ToolMode;
  onSelectElements: (ids: string[]) => void;
  onSelectConnector: (id: string | null) => void;
  onUpdateElements: (elements: CanvasElement[]) => void;
  onCreateConnector: (connector: Omit<Connector, 'id'>) => void;
  onCreateElementAt: (type: ElementType, x: number, y: number) => void;
  onUpdateElementText: (id: string, text: string) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  snapToGrid: boolean;
  showGrid: boolean;
  gridSize?: number;
  theme: ThemeColors;
  isSimulating?: boolean;
  activeSimulationStep?: SimulationStep | null;
  tokenProgress?: number;
}

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  connectors,
  selectedElementIds,
  selectedConnectorId,
  toolMode,
  onSelectElements,
  onSelectConnector,
  onUpdateElements,
  onCreateConnector,
  onCreateElementAt,
  onUpdateElementText,
  zoom,
  setZoom,
  pan,
  setPan,
  snapToGrid,
  showGrid,
  gridSize = 20,
  theme,
  isSimulating = false,
  activeSimulationStep = null,
  tokenProgress = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction States
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging elements state
  const [isDraggingElements, setIsDraggingElements] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [initialElementsState, setInitialElementsState] = useState<CanvasElement[]>([]);

  // Resizing element state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<HandleDirection | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [initialResizeElement, setInitialResizeElement] = useState<CanvasElement | null>(null);

  // Marquee selection state
  const [isMarquee, setIsMarquee] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 });
  const [marqueeCurrent, setMarqueeCurrent] = useState({ x: 0, y: 0 });

  // Connector drawing state
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [connStartElementId, setConnStartElementId] = useState<string | null>(null);
  const [connStartAnchor, setConnStartAnchor] = useState<AnchorPosition | null>(null);
  const [connMousePos, setConnMousePos] = useState({ x: 0, y: 0 });

  // Element hover state for anchor display
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // Canvas Prototype Simulation Interactivity
  const [activeSimModal, setActiveSimModal] = useState<{ title: string; desc?: string } | null>(null);
  const [activeSimToast, setActiveSimToast] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSimToast) return;
    const t = setTimeout(() => setActiveSimToast(null), 3500);
    return () => clearTimeout(t);
  }, [activeSimToast]);

  useEffect(() => {
    if (!isSimulating) {
      setActiveSimModal(null);
      setActiveSimToast(null);
    }
  }, [isSimulating]);

  const elementsById = new Map<string, CanvasElement>();
  elements.forEach((el) => elementsById.set(el.id, el));

  // Canvas image file picker ref and target element
  const canvasFileInputRef = useRef<HTMLInputElement>(null);
  const targetImageElementId = useRef<string | null>(null);

  // Convert screen coordinates to canvas world coordinates
  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;
      return {
        x: (rawX - pan.x) / zoom,
        y: (rawY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  const handleTriggerImagePicker = useCallback((elementId: string) => {
    targetImageElementId.current = elementId;
    canvasFileInputRef.current?.click();
  }, []);

  const handleCanvasFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const targetId = targetImageElementId.current;
      targetImageElementId.current = null;
      e.target.value = '';

      try {
        const asset = await importLocalImageFile(file);
        if (targetId) {
          onUpdateElements(
            elements.map((el) =>
              el.id === targetId
                ? {
                    ...el,
                    assetId: asset.assetId,
                    originalWidth: asset.width,
                    originalHeight: asset.height,
                    aspectRatioLocked: true,
                    label: el.label || file.name.replace(/\.[^/.]+$/, ''),
                  }
                : el
            )
          );
        }
      } catch (err) {
        console.error('Failed to import image into element:', err);
      }
    },
    [elements, onUpdateElements]
  );

  const handleDropFiles = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      const world = screenToWorld(e.clientX, e.clientY);

      // Check if dropped directly on an existing image element
      const targetEl = elements.find(
        (el) =>
          !el.hidden &&
          !el.locked &&
          world.x >= el.x &&
          world.x <= el.x + el.width &&
          world.y >= el.y &&
          world.y <= el.y + el.height
      );

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
          const asset = await importLocalImageFile(file);

          if (i === 0 && targetEl && targetEl.type === 'image') {
            // Replace hovered image element
            onUpdateElements(
              elements.map((el) =>
                el.id === targetEl.id
                  ? {
                      ...el,
                      assetId: asset.assetId,
                      originalWidth: asset.width,
                      originalHeight: asset.height,
                    }
                  : el
              )
            );
            onSelectElements([targetEl.id]);
          } else {
            // Add as new image element
            const maxW = 480;
            const maxH = 360;
            let w = asset.width || 280;
            let h = asset.height || 200;
            if (w > maxW || h > maxH) {
              const scale = Math.min(maxW / w, maxH / h);
              w = Math.round(w * scale);
              h = Math.round(h * scale);
            }

            const newEl: CanvasElement = {
              id: `el-img-${Date.now()}-${i}`,
              type: 'image',
              x: Math.round(world.x - w / 2) + i * 20,
              y: Math.round(world.y - h / 2) + i * 20,
              width: w,
              height: h,
              label: file.name.replace(/\.[^/.]+$/, ''),
              assetId: asset.assetId,
              originalWidth: asset.width,
              originalHeight: asset.height,
              aspectRatioLocked: true,
              imageFit: 'cover',
              fillColor: '#0f121a',
              strokeColor: '#252c3c',
              strokeWidth: 1,
              cornerRadius: 6,
            };

            onUpdateElements([...elements, newEl]);
            onSelectElements([newEl.id]);
          }
        } catch (err) {
          console.error('Failed to import dropped image:', err);
        }
      }
    },
    [elements, onUpdateElements, onSelectElements, screenToWorld]
  );

  // Global space key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpaceDown(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Wheel zoom and pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(3.0, Math.max(0.15, zoom * zoomFactor));

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpaceDown || toolMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0 || isSimulating) return;

    const world = screenToWorld(e.clientX, e.clientY);

    if (toolMode !== 'select' && toolMode !== 'connector') {
      const snappedX = snap(world.x, gridSize, snapToGrid);
      const snappedY = snap(world.y, gridSize, snapToGrid);
      onCreateElementAt(toolMode as ElementType, snappedX, snappedY);
      return;
    }

    setIsMarquee(true);
    setMarqueeStart(world);
    setMarqueeCurrent(world);
    onSelectElements([]);
    onSelectConnector(null);
  };

  // Simulation Prototype Action Handler
  const handleSimulationElementClick = (el: CanvasElement) => {
    // 1. Prototype Action: Modal
    if (el.prototypeAction === 'modal') {
      setActiveSimModal({
        title: el.prototypeTarget || `${el.label || 'Dialog'} Modal`,
        desc: el.prototypePayload || `Interactive modal dialog invoked from "${el.label || 'button'}"`,
      });
      return;
    }

    // 2. Prototype Action: Alert
    if (el.prototypeAction === 'alert') {
      setActiveSimToast(el.prototypePayload || `Alert: "${el.label || 'Action'}" executed`);
      return;
    }

    // 3. Prototype Action: Navigate to Screen/Frame
    if (el.prototypeAction === 'navigate') {
      const targetId = el.prototypeTarget;
      const targetEl = elements.find((e) => e.id === targetId || e.label === targetId);
      if (targetEl) {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const targetCenterX = targetEl.x + targetEl.width / 2;
          const targetCenterY = targetEl.y + targetEl.height / 2;
          setPan({
            x: rect.width / 2 - targetCenterX * zoom,
            y: rect.height / 2 - targetCenterY * zoom,
          });
        }
        setActiveSimToast(`Navigated to: ${targetEl.label || 'Target Screen'}`);
      }
      return;
    }

    // 4. Prototype Action: Back
    if (el.prototypeAction === 'back') {
      const frames = elements.filter((e) => e.type.startsWith('frame'));
      if (frames.length > 0) {
        const firstFrame = frames[0];
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setPan({
            x: rect.width / 2 - (firstFrame.x + firstFrame.width / 2) * zoom,
            y: rect.height / 2 - (firstFrame.y + firstFrame.height / 2) * zoom,
          });
        }
        setActiveSimToast(`Returned to: ${firstFrame.label || 'Main Screen'}`);
      }
      return;
    }

    // 5. Outgoing Connector to another element/frame
    const outgoingConn = connectors.find((c) => c.fromId === el.id);
    if (outgoingConn) {
      const targetEl = elementsById.get(outgoingConn.toId);
      if (targetEl) {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const targetCenterX = targetEl.x + targetEl.width / 2;
          const targetCenterY = targetEl.y + targetEl.height / 2;
          setPan({
            x: rect.width / 2 - targetCenterX * zoom,
            y: rect.height / 2 - targetCenterY * zoom,
          });
        }
        setActiveSimToast(`Transitioned to: ${targetEl.label || 'Connected Node'}`);
      }
    }
  };

  // Element Mouse Down
  const handleElementMouseDown = (el: CanvasElement, e: React.MouseEvent) => {
    if (isSpaceDown || toolMode === 'pan' || e.button !== 0) return;

    if (isSimulating) {
      e.stopPropagation();
      handleSimulationElementClick(el);
      return;
    }

    e.stopPropagation();

    if (toolMode === 'connector') {
      onSelectElements([el.id]);
      onSelectConnector(null);
      const world = screenToWorld(e.clientX, e.clientY);
      const closestAnchor = getClosestAnchor(el, world);
      setIsDrawingConnector(true);
      setConnStartElementId(el.id);
      setConnStartAnchor(closestAnchor);
      setConnMousePos(world);
      return;
    }

    const isShift = e.shiftKey || e.ctrlKey || e.metaKey;
    let nextSelected = [...selectedElementIds];

    if (isShift) {
      if (nextSelected.includes(el.id)) {
        nextSelected = nextSelected.filter((id) => id !== el.id);
      } else {
        if (el.groupId) {
          const groupIds = elements.filter((item) => item.groupId === el.groupId).map((item) => item.id);
          nextSelected = Array.from(new Set([...nextSelected, ...groupIds]));
        } else {
          nextSelected.push(el.id);
        }
      }
      onSelectElements(nextSelected);
    } else {
      if (!selectedElementIds.includes(el.id)) {
        if (el.groupId) {
          nextSelected = elements.filter((item) => item.groupId === el.groupId).map((item) => item.id);
        } else {
          nextSelected = [el.id];
        }
        onSelectElements(nextSelected);
      }
    }

    onSelectConnector(null);

    if (!el.locked) {
      setIsDraggingElements(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setInitialElementsState(elements.map((item) => ({ ...item })));
    }
  };

  // Resize Handle Mouse Down
  const handleResizeStart = (dir: HandleDirection, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedElementIds.length !== 1 || isSimulating) return;
    const target = elementsById.get(selectedElementIds[0]);
    if (!target || target.locked) return;

    setIsResizing(true);
    setResizeDir(dir);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setInitialResizeElement({ ...target });
  };

  // Anchor Mouse Down
  const handleAnchorMouseDown = (elementId: string, anchor: AnchorPosition, e: React.MouseEvent) => {
    if (isSimulating) return;
    e.stopPropagation();
    setIsDrawingConnector(true);
    setConnStartElementId(elementId);
    setConnStartAnchor(anchor);
    const world = screenToWorld(e.clientX, e.clientY);
    setConnMousePos(world);
  };

  // Anchor Mouse Up
  const handleAnchorMouseUp = (elementId: string, anchor: AnchorPosition, e: React.MouseEvent) => {
    if (isSimulating) return;
    e.stopPropagation();
    if (isDrawingConnector && connStartElementId && connStartAnchor) {
      if (connStartElementId !== elementId) {
        onCreateConnector({
          fromId: connStartElementId,
          toId: elementId,
          fromAnchor: connStartAnchor,
          toAnchor: anchor,
          color: theme.accent,
          strokeWidth: 2,
          style: 'orthogonal',
          arrowEnd: true,
        });
      }
    }
    setIsDrawingConnector(false);
    setConnStartElementId(null);
    setConnStartAnchor(null);
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDraggingElements) {
      const dx = (e.clientX - dragStartPos.x) / zoom;
      const dy = (e.clientY - dragStartPos.y) / zoom;

      const initialMap = new Map<string, CanvasElement>();
      initialElementsState.forEach((el) => initialMap.set(el.id, el));

      const updated = elements.map((el) => {
        if (selectedElementIds.includes(el.id) && !el.locked) {
          const init = initialMap.get(el.id);
          if (!init) return el;
          const nextX = snap(init.x + dx, gridSize, snapToGrid);
          const nextY = snap(init.y + dy, gridSize, snapToGrid);
          return { ...el, x: nextX, y: nextY };
        }
        return el;
      });
      onUpdateElements(updated);
      return;
    }

    if (isResizing && resizeDir && initialResizeElement) {
      const dx = (e.clientX - resizeStartPos.x) / zoom;
      const dy = (e.clientY - resizeStartPos.y) / zoom;

      let nextX = initialResizeElement.x;
      let nextY = initialResizeElement.y;
      let nextW = initialResizeElement.width;
      let nextH = initialResizeElement.height;

      const minSize = 20;

      if (resizeDir.includes('e')) {
        nextW = Math.max(minSize, initialResizeElement.width + dx);
      }
      if (resizeDir.includes('s')) {
        nextH = Math.max(minSize, initialResizeElement.height + dy);
      }
      if (resizeDir.includes('w')) {
        const potentialW = initialResizeElement.width - dx;
        if (potentialW >= minSize) {
          nextW = potentialW;
          nextX = initialResizeElement.x + dx;
        }
      }
      if (resizeDir.includes('n')) {
        const potentialH = initialResizeElement.height - dy;
        if (potentialH >= minSize) {
          nextH = potentialH;
          nextY = initialResizeElement.y + dy;
        }
      }

      if (initialResizeElement.aspectRatioLocked && initialResizeElement.width > 0 && initialResizeElement.height > 0) {
        const aspect = initialResizeElement.width / initialResizeElement.height;
        if (resizeDir === 'e' || resizeDir === 'w') {
          nextH = Math.max(minSize, Math.round(nextW / aspect));
        } else if (resizeDir === 's' || resizeDir === 'n') {
          nextW = Math.max(minSize, Math.round(nextH * aspect));
        } else {
          const dw = Math.abs(nextW - initialResizeElement.width);
          const dh = Math.abs(nextH - initialResizeElement.height);
          if (dw >= dh) {
            nextH = Math.max(minSize, Math.round(nextW / aspect));
          } else {
            nextW = Math.max(minSize, Math.round(nextH * aspect));
          }
        }
        if (resizeDir.includes('n')) {
          nextY = initialResizeElement.y + (initialResizeElement.height - nextH);
        }
        if (resizeDir.includes('w')) {
          nextX = initialResizeElement.x + (initialResizeElement.width - nextW);
        }
      }

      nextX = snap(nextX, gridSize, snapToGrid);
      nextY = snap(nextY, gridSize, snapToGrid);
      nextW = snap(nextW, gridSize, snapToGrid);
      nextH = snap(nextH, gridSize, snapToGrid);

      const updated = elements.map((el) =>
        el.id === initialResizeElement.id
          ? { ...el, x: nextX, y: nextY, width: nextW, height: nextH, autoSize: false }
          : el
      );
      onUpdateElements(updated);
      return;
    }

    if (isMarquee) {
      const world = screenToWorld(e.clientX, e.clientY);
      setMarqueeCurrent(world);
      return;
    }

    if (isDrawingConnector) {
      const world = screenToWorld(e.clientX, e.clientY);
      setConnMousePos(world);
      return;
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (isDraggingElements) setIsDraggingElements(false);
    if (isResizing) {
      setIsResizing(false);
      setResizeDir(null);
      setInitialResizeElement(null);
    }
    if (isMarquee) {
      const mX = Math.min(marqueeStart.x, marqueeCurrent.x);
      const mY = Math.min(marqueeStart.y, marqueeCurrent.y);
      const mW = Math.abs(marqueeCurrent.x - marqueeStart.x);
      const mH = Math.abs(marqueeCurrent.y - marqueeStart.y);

      if (mW > 5 || mH > 5) {
        const selected = elements
          .filter(
            (el) =>
              !el.hidden &&
              rectIntersectsRect(
                { x: mX, y: mY, width: mW, height: mH },
                { x: el.x, y: el.y, width: el.width, height: el.height }
              )
          )
          .map((el) => el.id);

        onSelectElements(selected);
      }
      setIsMarquee(false);
    }
    if (isDrawingConnector) {
      if (connStartElementId && connStartAnchor) {
        // If dropped over or near another canvas element, connect to its closest anchor
        const targetEl = elements.find(
          (el) =>
            !el.hidden &&
            el.id !== connStartElementId &&
            connMousePos.x >= el.x - 10 &&
            connMousePos.x <= el.x + el.width + 10 &&
            connMousePos.y >= el.y - 10 &&
            connMousePos.y <= el.y + el.height + 10
        );
        if (targetEl) {
          const toAnchor = getClosestAnchor(targetEl, connMousePos);
          onCreateConnector({
            fromId: connStartElementId,
            toId: targetEl.id,
            fromAnchor: connStartAnchor,
            toAnchor,
            color: theme.accent,
            strokeWidth: 2,
            style: 'orthogonal',
            arrowEnd: true,
          });
        }
      }
      setIsDrawingConnector(false);
      setConnStartElementId(null);
      setConnStartAnchor(null);
    }
  };

  // Cursor style calculation
  const getCursor = () => {
    if (isPanning || isSpaceDown) return 'grabbing';
    if (toolMode === 'pan') return 'grab';
    if (toolMode === 'connector') return 'crosshair';
    if (toolMode !== 'select') return 'crosshair';
    return 'default';
  };

  const singleSelectedElement =
    selectedElementIds.length === 1 ? elementsById.get(selectedElementIds[0]) : null;

  // Compute animated simulation token coordinates
  let tokenX = 0;
  let tokenY = 0;
  let showToken = false;

  if (isSimulating && activeSimulationStep && activeSimulationStep.targetNodeId) {
    const sEl = elementsById.get(activeSimulationStep.sourceNodeId);
    const tEl = elementsById.get(activeSimulationStep.targetNodeId);
    const conn = connectors.find((c) => c.id === activeSimulationStep.connectorId);

    if (sEl && tEl) {
      const pt = getPointAlongConnector(conn, sEl, tEl, tokenProgress);
      tokenX = pt.x;
      tokenY = pt.y;
      showToken = true;
    }
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={handleDropFiles}
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        backgroundColor: theme.canvasBg,
        overflow: 'hidden',
        position: 'relative',
        cursor: getCursor(),
      }}
    >
      {/* Hidden file input for canvas image element triggers */}
      <input
        ref={canvasFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleCanvasFileInputChange}
      />
      {/* Background Grid Pattern */}
      {showGrid && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: `radial-gradient(circle, ${theme.gridDot} 1px, transparent 1px)`,
            backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />
      )}

      {/* Transformed Canvas Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          pointerEvents: 'auto',
        }}
      >
        {/* SVG Layer for Connectors & Simulation Token */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <defs>
            <marker id="arrow-end" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M 0 1 L 8 4 L 0 7 Z" fill="currentColor" />
            </marker>
            <marker id="arrow-start" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
              <path d="M 8 1 L 0 4 L 8 7 Z" fill="currentColor" />
            </marker>
            <filter id="token-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" />
            </filter>
          </defs>

          {/* Render Connectors */}
          <g style={{ pointerEvents: isSimulating ? 'none' : 'auto', color: theme.accent }}>
            {connectors.map((conn) => {
              const isStepConn = isSimulating && activeSimulationStep?.connectorId === conn.id;

              return (
                <ConnectorRenderer
                  key={conn.id}
                  connector={
                    isStepConn
                      ? { ...conn, color: '#10b981', strokeWidth: conn.strokeWidth + 1.5 }
                      : conn
                  }
                  elementsById={elementsById}
                  isSelected={conn.id === selectedConnectorId || isStepConn}
                  onSelect={() => {
                    onSelectConnector(conn.id);
                    onSelectElements([]);
                  }}
                />
              );
            })}

            {/* In-progress drawing connector dashed line */}
            {isDrawingConnector && connStartElementId && connStartAnchor && (
              <line
                x1={getAnchorPoint(elementsById.get(connStartElementId)!, connStartAnchor).x}
                y1={getAnchorPoint(elementsById.get(connStartElementId)!, connStartAnchor).y}
                x2={connMousePos.x}
                y2={connMousePos.y}
                stroke={theme.accent}
                strokeWidth={2}
                strokeDasharray="6,4"
              />
            )}

            {/* Live Animated Simulation Token Pulse */}
            {showToken && (
              <g>
                <circle
                  cx={tokenX}
                  cy={tokenY}
                  r={12}
                  fill="rgba(16, 185, 129, 0.25)"
                />
                <circle
                  cx={tokenX}
                  cy={tokenY}
                  r={6.5}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth={2}
                  filter="url(#token-glow)"
                />
              </g>
            )}
          </g>
        </svg>

        {/* DOM Layer for Elements */}
        {elements.map((el) => {
          if (el.hidden) return null;
          const isSelected = selectedElementIds.includes(el.id);
          const isSingleSelected = isSelected && selectedElementIds.length === 1;
          const isDrawingSource = isDrawingConnector && connStartElementId === el.id;
          const isCandidateTarget =
            isDrawingConnector && hoveredElementId === el.id && connStartElementId !== el.id;

          const showAnchors =
            !isSimulating &&
            !el.locked &&
            (
              (isSingleSelected && (toolMode === 'select' || toolMode === 'connector')) ||
              isDrawingSource ||
              isCandidateTarget
            );

          // Simulation highlighting states
          const isSimSource = isSimulating && activeSimulationStep?.sourceNodeId === el.id;
          const isSimTarget = isSimulating && activeSimulationStep?.targetNodeId === el.id;
          const isSimActive = isSimSource || isSimTarget;

          const isInteractiveHotspot =
            isSimulating &&
            ((Boolean(el.prototypeAction) && el.prototypeAction !== 'none') ||
              connectors.some((c) => c.fromId === el.id));

          let outlineStyle = isSelected ? `2px solid ${theme.accent}` : 'none';
          let boxShadowStyle = 'none';

          if (isSimSource) {
            outlineStyle = '2px solid #38bdf8';
            boxShadowStyle = '0 0 18px rgba(56, 189, 248, 0.65)';
          } else if (isSimTarget) {
            outlineStyle = '2px solid #10b981';
            boxShadowStyle = '0 0 18px rgba(16, 185, 129, 0.65)';
          } else if (isInteractiveHotspot) {
            outlineStyle = '1.5px dashed rgba(56, 189, 248, 0.8)';
            boxShadowStyle =
              hoveredElementId === el.id
                ? '0 0 14px rgba(56, 189, 248, 0.6)'
                : '0 0 8px rgba(56, 189, 248, 0.25)';
          }

          const isFrame = el.type.startsWith('frame');

          // Check if this element is inside any active frame during simulation
          const isInsideActiveFrame =
            isSimulating &&
            activeSimulationStep &&
            !isFrame &&
            elements.some(
              (f) =>
                f.type.startsWith('frame') &&
                (f.id === activeSimulationStep.sourceNodeId || f.id === activeSimulationStep.targetNodeId) &&
                el.x >= f.x - 10 &&
                el.x + el.width <= f.x + f.width + 10 &&
                el.y >= f.y - 10 &&
                el.y + el.height <= f.y + f.height + 10
            );

          // Safe layering: Frames always remain behind content elements
          const elementZIndex = isFrame
            ? isSimActive
              ? 3
              : isSelected
              ? 2
              : 1
            : isSimActive
            ? 15
            : isSelected
            ? 10
            : isInteractiveHotspot
            ? 8
            : 5;

          // In simulation, keep active elements, interactive hotspots, and elements inside active frames fully visible
          const elementOpacity =
            !isSimulating || isSimActive || isInsideActiveFrame || isInteractiveHotspot || isSelected
              ? 1
              : 0.65;

          const elementCursor = isSimulating
            ? isInteractiveHotspot
              ? 'pointer'
              : 'default'
            : el.locked
            ? 'default'
            : 'move';

          return (
            <div
              key={el.id}
              onMouseDown={(e) => handleElementMouseDown(el, e)}
              onMouseEnter={() => setHoveredElementId(el.id)}
              onMouseLeave={() => setHoveredElementId(null)}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                cursor: elementCursor,
                outline: outlineStyle,
                outlineOffset: 2,
                boxShadow: boxShadowStyle,
                borderRadius: el.cornerRadius || 4,
                zIndex: elementZIndex,
                opacity: elementOpacity,
                transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <ElementRenderer
                element={el}
                isSelected={isSelected}
                onUpdateText={onUpdateElementText}
                onSelectImageFile={handleTriggerImagePicker}
              />

              {/* 8 Resize Handles on single selected element only in select tool mode */}
              {toolMode === 'select' &&
                isSelected &&
                !isSimulating &&
                singleSelectedElement?.id === el.id &&
                !el.locked && (
                  <ResizeHandles
                    width={el.width}
                    height={el.height}
                    onResizeStart={handleResizeStart}
                  />
                )}

              {/* Connector Anchors */}
              {showAnchors && (
                <AnchorPoints
                  width={el.width}
                  height={el.height}
                  onAnchorMouseDown={(anchor, e) => handleAnchorMouseDown(el.id, anchor, e)}
                  onAnchorMouseUp={(anchor, e) => handleAnchorMouseUp(el.id, anchor, e)}
                />
              )}
            </div>
          );
        })}

        {/* Marquee Drag Box Preview */}
        {isMarquee && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(marqueeStart.x, marqueeCurrent.x),
              top: Math.min(marqueeStart.y, marqueeCurrent.y),
              width: Math.abs(marqueeCurrent.x - marqueeStart.x),
              height: Math.abs(marqueeCurrent.y - marqueeStart.y),
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: `1px dashed ${theme.accent}`,
              borderRadius: 2,
              pointerEvents: 'none',
              zIndex: 30,
            }}
          />
        )}
      </div>

      {/* Simulation Prototype Modal Overlay Dialog */}
      {isSimulating && activeSimModal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
          onClick={() => setActiveSimModal(null)}
        >
          <div
            style={{
              backgroundColor: '#0c0f17',
              border: '1.5px solid #3b82f6',
              borderRadius: 12,
              padding: '24px 28px',
              maxWidth: 440,
              width: '90%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.9), 0 0 24px rgba(59, 130, 246, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
                  {activeSimModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSimModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
              {activeSimModal.desc || 'Interactive dialog state triggered in simulation prototype mode.'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setActiveSimModal(null)}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#1b2230',
                  border: '1px solid #2e384d',
                  borderRadius: 6,
                  color: '#e2e8f0',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSimModal(null);
                  setActiveSimToast('Action Confirmed in Prototype Simulation');
                }}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirm & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Prototype Toast Banner */}
      {isSimulating && activeSimToast && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            border: '1px solid #38bdf8',
            borderRadius: 8,
            padding: '8px 16px',
            color: '#f8fafc',
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 16px rgba(56, 189, 248, 0.3)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#38bdf8' }} />
          <span>{activeSimToast}</span>
        </div>
      )}
    </div>
  );
};
