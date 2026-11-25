import { useState, useRef, useCallback, useEffect } from 'react';
import { type Game } from '../data/gamesData';
import { soundManager } from '../data/audioConfig';
import {
  type GraphNodePos,
  MIN_ZOOM,
  MAX_ZOOM,
  computeAutoZoom,
} from '../services/catalogLayoutEngine';

interface UseGraphViewportOptions {
  baseGraphLayout: Record<string, GraphNodePos>;
  isCameraLocked: boolean;
}

// encapsula pan, drag, zoom y centrado de camara para la vista de grafo
export function useGraphViewport({
  baseGraphLayout,
  isCameraLocked,
}: UseGraphViewportOptions) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragOriginRef = useRef({ startX: 0, startY: 0, camX: 0, camY: 0 });
  const hasDraggedRef = useRef<boolean>(false);

  const [zoomLevel, setZoomLevel] = useState<number>(() =>
    computeAutoZoom(window.innerWidth - 92)
  );
  const [camOffset, setCamOffset] = useState<{ x: number; y: number }>({ x: -10, y: -10 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);

  useEffect(() => {
    const onResize = () => {
      const vw = viewportRef.current?.clientWidth || window.innerWidth - 92;
      setZoomLevel((prev) => {
        const fitted = computeAutoZoom(vw);
        return prev > fitted ? fitted : prev;
      });
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleZoomChange = useCallback((delta: number) => {
    soundManager.playClick();
    setZoomLevel((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    });
  }, []);

  const resetZoomToFit = useCallback((playSound = false) => {
    if (playSound) soundManager.playClick();
    const vw = viewportRef.current?.clientWidth || window.innerWidth - 92;
    setZoomLevel(computeAutoZoom(vw));
  }, []);

  const centerCameraOnGame = useCallback(
    (targetGame: Game, isPlayingExpanded = false) => {
      setZoomLevel(1);
      const pos = baseGraphLayout[`game-${targetGame.id}`] || { x: 110, y: 95 };
      const vw = viewportRef.current?.clientWidth || window.innerWidth - 92;
      const vh = viewportRef.current?.clientHeight || window.innerHeight;

      const viewerW = isPlayingExpanded
        ? Math.min(1020, Math.max(660, vw * 0.78))
        : Math.min(840, Math.max(580, vw * 0.64));
      const viewerH = isPlayingExpanded
        ? Math.min(vh * 0.85, (viewerW * 9.6) / 16)
        : Math.min(vh * 0.74, (viewerW * 9.6) / 16);

      setCamOffset({
        x: Math.round(-pos.x + (vw - viewerW) / 2),
        y: Math.round(-pos.y + (vh - viewerH) / 2),
      });
    },
    [baseGraphLayout]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || isCameraLocked) return;
      setIsDraggingCanvas(true);
      hasDraggedRef.current = false;
      dragOriginRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        camX: camOffset.x,
        camY: camOffset.y,
      };
    },
    [camOffset.x, camOffset.y, isCameraLocked]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingCanvas || isCameraLocked) return;
      const dx = e.clientX - dragOriginRef.current.startX;
      const dy = e.clientY - dragOriginRef.current.startY;
      if (Math.hypot(dx, dy) > 5) {
        hasDraggedRef.current = true;
      }
      setCamOffset({
        x: Math.max(-1450, Math.min(320, dragOriginRef.current.camX + dx)),
        y: Math.max(-960, Math.min(260, dragOriginRef.current.camY + dy)),
      });
    },
    [isCameraLocked, isDraggingCanvas]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
    window.setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  }, []);

  const handleWheelZoom = useCallback(
    (e: React.WheelEvent) => {
      if (isCameraLocked) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleZoomChange(e.deltaY < 0 ? 0.1 : -0.1);
      }
    },
    [handleZoomChange, isCameraLocked]
  );

  const cancelDrag = useCallback(() => {
    setIsDraggingCanvas(false);
  }, []);

  const wasRecentDrag = useCallback(() => hasDraggedRef.current, []);

  return {
    viewportRef,
    zoomLevel,
    camOffset,
    isDraggingCanvas,
    wasRecentDrag,
    cancelDrag,
    handleZoomChange,
    resetZoomToFit,
    centerCameraOnGame,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleWheelZoom,
  };
}