import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Game, fetchCatalogGames, slugifyGameAlias } from '../data/gamesData';
import { GameViewerStage } from '../components/GameViewerStage';
import { killGlobalRuffleInstance } from '../components/RufflePlayer';
import { Confirm3dsModal } from '../components/3dsConfirmModal';
import { PetWalkerEasterEgg } from '../components/PetWalkerEasterEgg';
import { soundManager } from '../data/audioConfig';
import { RecommendedBubblesTray } from '../components/RecommendedBubblesTray';
import { CatalogCardBadge } from '../components/CatalogCardBadge';
import { resolveRecommendedGames } from '../data/recommendationsEngine';

type ViewMode = 'exploration' | 'bento' | 'wii-u';

const BASE_SCATTER_COORDS: Array<{ x: number; y: number }> = [
  { x: 110, y: 95 },
  { x: 470, y: 80 },
  { x: 850, y: 115 },
  { x: 1230, y: 90 },
  { x: 1620, y: 145 },
  { x: 260, y: 375 },
  { x: 680, y: 390 },
  { x: 1090, y: 365 },
  { x: 1500, y: 420 },
  { x: 140, y: 685 },
  { x: 580, y: 705 },
  { x: 1020, y: 675 },
  { x: 1460, y: 725 },
];

const CARD_WIDTH = 245;
const CARD_HEIGHT = 160;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.4;
const ZOOM_STEP = 0.15;
const FOUR_GAMES_ROW_SPAN = 1560;

const computeAutoZoom = (viewportWidth: number): number => {
  if (viewportWidth >= FOUR_GAMES_ROW_SPAN) return 1;
  const fitted = Math.floor((viewportWidth / FOUR_GAMES_ROW_SPAN) * 100) / 100;
  return Math.max(MIN_ZOOM, Math.min(1, fitted));
};

const renderCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('acción') || lower.includes('peleas') || lower.includes('disparos')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }
  if (lower.includes('puzzle') || lower.includes('estrategia') || lower.includes('lógica')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }
  if (lower.includes('2 jugadores') || lower.includes('multijugador')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="M6 12h4m-2-2v4" />
    </svg>
  );
};




export const BentoCatalogView: React.FC = () => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragOriginRef = useRef<{ startX: number; startY: number; camX: number; camY: number }>({
    startX: 0,
    startY: 0,
    camX: 0,
    camY: 0,
  });
  const hasDraggedRef = useRef<boolean>(false);
  const appliedRouteAliasRef = useRef<string | null>(null);

  const { alias: routeAlias } = useParams<{ alias?: string }>();
  const navigate = useNavigate();

  // estado de catalogo y filtros
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('exploration');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('udo_fav_games');
    return saved ? JSON.parse(saved) : [1, 2];
  });
  const [votes, setVotes] = useState<Record<number, 'LIKE' | 'DISLIKE'>>({});

  // estado del visor y navegacion
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [pendingSwitchGame, setPendingSwitchGame] = useState<Game | null>(null);
  const [isGameCurrentlyRunning, setIsGameCurrentlyRunning] = useState<boolean>(false);
  //const [lastHoveredGame, setLastHoveredGame] = useState<Game | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [showExploreIntro, setShowExploreIntro] = useState<boolean>(() => {
    return sessionStorage.getItem('udo_explore_intro_dismissed') !== 'true';
  });

  // estado de camara, zoom y grafo
  const [zoomLevel, setZoomLevel] = useState<number>(() =>
    computeAutoZoom(window.innerWidth - 92)
  );
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState<boolean>(false);
  const [isCameraPinned, setIsCameraPinned] = useState<boolean>(false);
  const [nodePositions, setNodePositions] = useState<
    Record<number, { x: number; y: number; delay: string }>
  >({});
  const [camOffset, setCamOffset] = useState<{ x: number; y: number }>({ x: -10, y: -10 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);

  // helpers de camara y zoom
  const handleZoomChange = useCallback((delta: number) => {
    soundManager.playClick();
    setZoomLevel((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    soundManager.playClick();
    const vw = viewportRef.current?.clientWidth || window.innerWidth - 92;
    setZoomLevel(computeAutoZoom(vw));
  }, []);

  const centerCameraOnGame = useCallback(
    (targetGame: Game, isPlayingExpanded = false) => {
      setZoomLevel(1);
      const pos = nodePositions[targetGame.id] || BASE_SCATTER_COORDS[0];
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
    [nodePositions]
  );

  // handlers de catalogo y seleccion
  const handleSwitchViewMode = (nextMode: ViewMode) => {
    soundManager.playClick();
    if (activeGame) {
      killGlobalRuffleInstance();
      setActiveGame(null);
      setPendingSwitchGame(null);
      setIsGameCurrentlyRunning(false);
      setIsCameraPinned(false);
      window.dispatchEvent(
        new CustomEvent('udo_game_playing_state', { detail: { playing: false } })
      );
    }
    setIsCategoryMenuOpen(false);
    setViewMode(nextMode);
  };

  const toggleFavorite = (gameId: number) => {
    setFavorites((prev) => {
      const next = prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId];
      localStorage.setItem('udo_fav_games', JSON.stringify(next));
      return next;
    });
  };

  const handleVote = (gameId: number, type: 'LIKE' | 'DISLIKE') => {
    setVotes((prev) => {
      const current = prev[gameId];
      if (current === type) {
        const copy = { ...prev };
        delete copy[gameId];
        return copy;
      }
      return { ...prev, [gameId]: type };
    });
  };

  const handleSelectGame = (game: Game) => {
    if (hasDraggedRef.current) return;

    if (activeGame && activeGame.id !== game.id && isGameCurrentlyRunning) {
      soundManager.playClick();
      setPendingSwitchGame(game);
      return;
    }

    const targetAlias = slugifyGameAlias(game.alias || game.title, game.id);
    navigate(`/juego/${targetAlias}`, { replace: true });

    soundManager.playOpen();
    setActiveGame(game);
    //setLastHoveredGame(game);

    if (viewMode === 'exploration') {
      centerCameraOnGame(game, false);
    }
  };

  const handleConfirmSwitchGame = () => {
    if (!pendingSwitchGame) return;
    const target = pendingSwitchGame;
    const targetAlias = slugifyGameAlias(target.alias || target.title, target.id);

    setPendingSwitchGame(null);
    killGlobalRuffleInstance();
    soundManager.playOpen();
    setActiveGame(target);
    //setLastHoveredGame(target);
    setIsGameCurrentlyRunning(false);
    setIsCameraPinned(false);
    navigate(`/juego/${targetAlias}`, { replace: true });
    window.dispatchEvent(
      new CustomEvent('udo_game_playing_state', { detail: { playing: false } })
    );

    if (viewMode === 'exploration') {
      centerCameraOnGame(target, false);
    }
  };

  const handleCloseActiveGame = () => {
    setActiveGame(null);
    setIsCameraPinned(false);
    setIsGameCurrentlyRunning(false);
    const vw = viewportRef.current?.clientWidth || window.innerWidth - 92;
    setZoomLevel(computeAutoZoom(vw));
    appliedRouteAliasRef.current = null;
    navigate('/', { replace: true });
  };

  const handleTogglePinAndCenter = () => {
    if (activeGame) {
      centerCameraOnGame(activeGame, isGameCurrentlyRunning);
    }
    setIsCameraPinned((prev) => !prev);
  };

  const handleAutoPinOnPlay = () => {
    setIsCameraPinned(true);
    if (activeGame) {
      centerCameraOnGame(activeGame, true);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isCameraPinned) return;
    setIsDraggingCanvas(true);
    hasDraggedRef.current = false;
    dragOriginRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      camX: camOffset.x,
      camY: camOffset.y,
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCanvas || isCameraPinned) return;
    const dx = e.clientX - dragOriginRef.current.startX;
    const dy = e.clientY - dragOriginRef.current.startY;
    if (Math.hypot(dx, dy) > 5) {
      hasDraggedRef.current = true;
    }
    setCamOffset({
      x: Math.max(-1450, Math.min(320, dragOriginRef.current.camX + dx)),
      y: Math.max(-960, Math.min(260, dragOriginRef.current.camY + dy)),
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  const nudgeCamera = (dx: number, dy: number) => {
    if (isCameraPinned) return;
    soundManager.playClick();
    setCamOffset((prev) => ({
      x: Math.max(-1450, Math.min(320, prev.x + dx)),
      y: Math.max(-960, Math.min(260, prev.y + dy)),
    }));
  };

  // efectos de carga, redimensionamiento y ruta
  useEffect(() => {
    setIsLoading(true);
    fetchCatalogGames().then((loaded) => {
      setGames(loaded);
      //if (loaded.length > 0) setLastHoveredGame(loaded[0]);

      const initialMap: Record<number, { x: number; y: number; delay: string }> = {};
      loaded.forEach((g, idx) => {
        const base = BASE_SCATTER_COORDS[idx % BASE_SCATTER_COORDS.length];
        initialMap[g.id] = {
          x: Math.max(40, base.x + Math.round((Math.random() - 0.5) * 48)),
          y: Math.max(40, base.y + Math.round((Math.random() - 0.5) * 44)),
          delay: `${(idx * 0.42).toFixed(2)}s`,
        };
      });
      setNodePositions(initialMap);
      setIsLoading(false);
    });

    const onResize = () => {
      const vw = viewportRef.current?.clientWidth || window.innerWidth - 92;
      setZoomLevel((prev) => {
        const fitted = computeAutoZoom(vw);
        return prev > fitted ? fitted : prev;
      });
    };

    const onChatToggle = (e: Event) => {
      const custom = e as CustomEvent<{ open: boolean }>;
      setIsChatOpen(Boolean(custom.detail?.open));
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('udo_chat_state', onChatToggle);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('udo_chat_state', onChatToggle);
    };
  }, []);

  useEffect(() => {
    if (isLoading || !routeAlias || games.length === 0) return;
    if (appliedRouteAliasRef.current === routeAlias) return;

    const normalizedTarget = slugifyGameAlias(routeAlias);
    const matchedGame = games.find((g) => {
      const gAlias = slugifyGameAlias(g.alias || g.title, g.id);
      return gAlias === normalizedTarget || String(g.id) === routeAlias;
    });

    if (matchedGame) {
      appliedRouteAliasRef.current = routeAlias;
      setActiveGame(matchedGame);
      //setLastHoveredGame(matchedGame);
      if (viewMode === 'exploration') {
        setTimeout(() => centerCameraOnGame(matchedGame, false), 60);
      }
    }
  }, [isLoading, routeAlias, games, viewMode, centerCameraOnGame]);

  // datos derivados del grafo y filtros
  const categories = ['Todas', ...Array.from(new Set(games.flatMap((g) => g.categories)))];

  const recommendedGames = useMemo(
  () => resolveRecommendedGames({ allGames: games, externalRecommendedGames: null }),
  [games]
  );

  const recommendedIds = useMemo(
    () => new Set(recommendedGames.slice(0, 4).map((g) => g.id)),
    [recommendedGames]
  );  

  const visibleGames = games.filter((g) => {
    if (onlyFavorites && !favorites.includes(g.id)) return false;
    if (viewMode !== 'exploration') {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat =
        selectedCategory === 'Todas' || g.categories.includes(selectedCategory);
      return matchesSearch && matchesCat;
    }
    return true;
  });

  const effectiveNodeCoords = useMemo(() => {
    const activeCoord = activeGame ? nodePositions[activeGame.id] : null;
    const result: Record<number, { x: number; y: number; delay: string }> = {};

    visibleGames.forEach((game, idx) => {
      const basePos = nodePositions[game.id] || {
        ...BASE_SCATTER_COORDS[idx % BASE_SCATTER_COORDS.length],
        delay: '0s',
      };
      let pushX = 0;
      let pushY = 0;

      if (activeCoord && activeGame?.id !== game.id) {
        const dx = basePos.x - activeCoord.x;
        const dy = basePos.y - activeCoord.y;
        if (dx > -260 && dx < 980 && dy > -190 && dy < 600) {
          pushX = dx < 290 ? -310 : 420;
          pushY = dy < 165 ? -210 : 280;
        }
      }

      result[game.id] = {
        x: basePos.x + pushX,
        y: basePos.y + pushY,
        delay: basePos.delay,
      };
    });

    return result;
  }, [visibleGames, nodePositions, activeGame]);

  const graphEdges = useMemo(() => {
    const edgesMap = new Map<
      string,
      { idA: number; idB: number; x1: number; y1: number; x2: number; y2: number }
    >();

    visibleGames.forEach((gA) => {
      const posA = effectiveNodeCoords[gA.id];
      if (!posA) return;
      const centerAx = posA.x + CARD_WIDTH / 2;
      const centerAy = posA.y + CARD_HEIGHT / 2;

      const neighbors = visibleGames
        .filter((gB) => gB.id !== gA.id && Boolean(effectiveNodeCoords[gB.id]))
        .map((gB) => {
          const posB = effectiveNodeCoords[gB.id];
          const centerBx = posB.x + CARD_WIDTH / 2;
          const centerBy = posB.y + CARD_HEIGHT / 2;
          return { gB, centerBx, centerBy, dist: Math.hypot(centerAx - centerBx, centerAy - centerBy) };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 4);

      neighbors.forEach(({ gB, centerBx, centerBy }) => {
        const key = `${Math.min(gA.id, gB.id)}-${Math.max(gA.id, gB.id)}`;
        if (!edgesMap.has(key)) {
          edgesMap.set(key, {
            idA: gA.id,
            idB: gB.id,
            x1: centerAx,
            y1: centerAy,
            x2: centerBx,
            y2: centerBy,
          });
        }
      });
    });

    return Array.from(edgesMap.values());
  }, [visibleGames, effectiveNodeCoords]);

  if (isLoading) {
    return (
      <div className="tactile-panel" style={{ padding: '48px', textAlign: 'center', margin: '24px' }}>
        <h2 style={{ fontSize: '1.4rem' }}>CARGANDO GRAFO DE JUEGOS...</h2>
      </div>
    );
  }

  return (
    <div>
      {onlyFavorites && !activeGame && (
        <div
          className="tactile-panel favorites-active-banner"
          onClick={() => {
            soundManager.playClick();
            setOnlyFavorites(false);
          }}
          title="Filtro de Favoritos activo — Clic para mostrar todos los juegos"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>FAVORITOS</span>
        </div>
      )}

      {pendingSwitchGame && activeGame && (
        <Confirm3dsModal
          badgeText="CAMBIAR DE SOFTWARE"
          title={`Cerrar ${activeGame.title}`}
          description={`Se cerrara la partida actual para abrir ${pendingSwitchGame.title}.`}
          confirmLabel="Aceptar"
          cancelLabel="Cancelar"
          zIndex={1700}
          onConfirm={handleConfirmSwitchGame}
          onCancel={() => {
            soundManager.playClick();
            setPendingSwitchGame(null);
          }}
        />
      )}

      {showExploreIntro && (
        <div className="explore-intro-overlay" onClick={() => setShowExploreIntro(false)}>
          <div className="tactile-panel explore-intro-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="credit-role-badge">GUÍA DE NAVEGACIÓN</span>
              <button
                type="button"
                className="icon-close-x-btn"
                onClick={() => {
                  soundManager.playClose();
                  sessionStorage.setItem('udo_explore_intro_dismissed', 'true');
                  setShowExploreIntro(false);
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-main)' }}>
              EXPLORA EL GRAFO DE JUEGOS
            </h1>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
              Mantén presionado y arrastra en cualquier parte para desplazarte por la red de juegos, o usa las flechas y el control de <strong>Zoom</strong> arriba a la derecha. Haz clic sobre un juego para abrirlo.
            </p>

            <button
              type="button"
              className="tactile-btn-purple"
              style={{ padding: '12px 28px', alignSelf: 'center', fontSize: '0.95rem' }}
              onClick={() => {
                soundManager.playOpen();
                sessionStorage.setItem('udo_explore_intro_dismissed', 'true');
                setShowExploreIntro(false);
              }}
            >
              COMENZAR A EXPLORAR
            </button>
          </div>
        </div>
      )}

      {viewMode === 'exploration' && !activeGame && (
        <div
          className={`tactile-panel exploration-zoom-dock ${
            isChatOpen ? 'shift-for-chat' : ''
          }`}
        >
          <div className={`zoom-controls-expandable ${isZoomMenuOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="tactile-btn-dark"
              style={{ width: '34px', height: '34px', padding: 0 }}
              onClick={() => handleZoomChange(-ZOOM_STEP)}
              title="Alejar (Zoom Out)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <span
              className="zoom-percent-badge"
              onClick={handleResetZoom}
              title="Clic para ajustar zoom automático"
            >
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              type="button"
              className="tactile-btn-dark"
              style={{ width: '34px', height: '34px', padding: 0 }}
              onClick={() => handleZoomChange(ZOOM_STEP)}
              title="Acercar (Zoom In)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className={`tactile-btn-dark ${isZoomMenuOpen ? 'active-state' : ''}`}
            style={{ width: '38px', height: '36px', padding: 0 }}
            onClick={() => {
              soundManager.playClick();
              setIsZoomMenuOpen((prev) => !prev);
            }}
            title="Controles de Zoom"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
        </div>
      )}

      {viewMode === 'exploration' && (
        <div
          ref={viewportRef}
          className={`exploration-free-viewport ${isDraggingCanvas ? 'grabbing' : ''} ${
            isCameraPinned ? 'pinned-lock' : ''
          }`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              handleZoomChange(e.deltaY < 0 ? 0.1 : -0.1);
            }
          }}
        >
          {!activeGame && (
            <>
              <button
                type="button"
                className="axis-guide-indicator axis-guide-top"
                onClick={() => nudgeCamera(0, 240)}
                title="Explorar Arriba"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>

              <button
                type="button"
                className="axis-guide-indicator axis-guide-bottom"
                onClick={() => nudgeCamera(0, -240)}
                title="Explorar Abajo"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <button
                type="button"
                className="axis-guide-indicator axis-guide-left"
                onClick={() => nudgeCamera(260, 0)}
                title="Explorar Izquierda"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                type="button"
                className="axis-guide-indicator axis-guide-right"
                onClick={() => nudgeCamera(-260, 0)}
                title="Explorar Derecha"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          <div
            className="exploration-infinite-plane"
            style={{
              transformOrigin: '0 0',
              transform: `translate3d(${camOffset.x}px, ${camOffset.y}px, 0) scale(${zoomLevel})`,
              transition: isDraggingCanvas ? 'none' : 'transform 0.38s var(--ease-smooth-push)',
            }}
          >
            <svg className="exploration-graph-svg">
              {graphEdges.map((edge) => {
                const isHighlighted =
                  hoveredId === edge.idA ||
                  hoveredId === edge.idB ||
                  activeGame?.id === edge.idA ||
                  activeGame?.id === edge.idB;
                return (
                  <g key={`${edge.idA}-${edge.idB}`}>
                    <line
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      className={`graph-edge-line ${isHighlighted ? 'highlighted' : ''}`}
                    />
                    <circle
                      cx={(edge.x1 + edge.x2) / 2}
                      cy={(edge.y1 + edge.y2) / 2}
                      r={isHighlighted ? 3.5 : 2}
                      fill={isHighlighted ? 'var(--graph-line-active)' : 'var(--panel-border-outer)'}
                      opacity={isHighlighted ? 0.95 : 0.45}
                    />
                  </g>
                );
              })}
            </svg>

            {visibleGames.map((game) => {
              const coord = effectiveNodeCoords[game.id] || { x: 110, y: 95, delay: '0s' };
              const isExpandedHere = activeGame?.id === game.id;
              const isHovered = hoveredId === game.id;
              const isFav = favorites.includes(game.id);

              return (
                <div
                  key={`${game.id}-${onlyFavorites ? 'fav' : 'all'}`}
                  className="scatter-node-wrapper pop-item-enter"
                  style={{
                    left: `${coord.x}px`,
                    top: `${coord.y}px`,
                    zIndex: isExpandedHere ? 80 : isHovered ? 25 : 5,
                  }}
                >
                  {isExpandedHere ? (
                    <GameViewerStage
                      game={game}
                      isFavorite={isFav}
                      userVote={votes[game.id]}
                      isExplorationMode={true}
                      isCameraPinned={isCameraPinned}
                      onTogglePinCamera={handleTogglePinAndCenter}
                      onAutoPinOnPlay={handleAutoPinOnPlay}
                      onToggleFavorite={toggleFavorite}
                      onVote={handleVote}
                      onClose={handleCloseActiveGame}
                      onPlayingChange={setIsGameCurrentlyRunning}
                    />
                  ) : (
                    <div
                      className="floating-space-wobble"
                      style={{ animationDelay: coord.delay }}
                    >
                      <article
                        className={`game-bevel-card ${isFav ? 'is-favorite-card' : ''}`}
                        style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
                        onMouseEnter={() => {
                          soundManager.playHover();
                          setHoveredId(game.id);
                          //setLastHoveredGame(game);
                        }}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => handleSelectGame(game)}
                      >
                        <div className="game-card-inner-clip">
                          <img
                            src={isHovered && game.previewGifUrl ? game.previewGifUrl : game.coverUrl}
                            alt={game.title}
                            draggable={false}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />

                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background:
                                'linear-gradient(180deg, transparent 40%, rgba(9, 5, 18, 0.92) 100%)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'flex-end',
                              padding: '12px',
                            }}
                          >
                            <div style={{ color: '#ffffff', fontSize: '0.94rem', fontWeight: 600, lineHeight: 1.15 }}>
                              {game.title}
                            </div>
                          </div>
                        </div>
                      </article>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode !== 'exploration' && (
        <div className={viewMode === 'bento' ? 'friv-bento-grid' : 'wiiu-channel-grid'}>
          {visibleGames.map((game) => {
            const isHovered = hoveredId === game.id;
            const isFav = favorites.includes(game.id);
            const sizeClass = `size-${game.bentoSize || 'small'}`;

            if (viewMode === 'wii-u') {
              return (
                <div
                  key={`${game.id}-${onlyFavorites ? 'fav' : 'all'}`}
                  className={`wiiu-channel-tile pop-item-enter ${isFav ? 'is-favorite-card' : ''}`}
                  onMouseEnter={() => {
                    soundManager.playHover();
                    setHoveredId(game.id);
                  }}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleSelectGame(game)}
                >
                  <div className="wiiu-channel-inner">
                    {recommendedIds.has(game.id) && <CatalogCardBadge label="RECOMENDADO" />}
                    <img
                      src={isHovered && game.previewGifUrl ? game.previewGifUrl : game.coverUrl}
                      alt={game.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      paddingTop: '6px',
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {game.title}
                  </div>
                </div>
              );
            }

            return (
              <article
                key={`${game.id}-${onlyFavorites ? 'fav' : 'all'}`}
                className={`game-bevel-card ${sizeClass} pop-item-enter ${isFav ? 'is-favorite-card' : ''}`}
                onMouseEnter={() => {
                  soundManager.playHover();
                  setHoveredId(game.id);
                  //setLastHoveredGame(game);
                }}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelectGame(game)}
              >
                <div className="game-card-inner-clip">
                  {recommendedIds.has(game.id) && <CatalogCardBadge label="RECOMENDADO" />}
                  <img
                    src={isHovered && game.previewGifUrl ? game.previewGifUrl : game.coverUrl}
                    alt={game.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, transparent 45%, rgba(9, 5, 18, 0.92) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '12px',
                    }}
                  >
                    <div style={{ color: '#ffffff', fontSize: '0.96rem', fontWeight: 600 }}>{game.title}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {viewMode !== 'exploration' && activeGame && (
        <div
          className="fullscreen-modal-backdrop"
          onClick={() => {
            soundManager.playClose();
            killGlobalRuffleInstance();
            window.dispatchEvent(
              new CustomEvent('udo_game_playing_state', { detail: { playing: false } })
            );
            handleCloseActiveGame();
          }}
        >
          <GameViewerStage
            game={activeGame}
            isFavorite={favorites.includes(activeGame.id)}
            userVote={votes[activeGame.id]}
            isExplorationMode={false}
            onToggleFavorite={toggleFavorite}
            onVote={handleVote}
            onClose={handleCloseActiveGame}
            onPlayingChange={setIsGameCurrentlyRunning}
          />
        </div>
      )}

      {viewMode === 'exploration' && !activeGame && (
        <RecommendedBubblesTray
          recommendedGames={recommendedGames}
          onSelectGame={handleSelectGame}
        />
      )}

      {!activeGame && (
        <footer
          className={`tactile-panel bottom-right-hud-dock ${
            viewMode !== 'exploration' ? 'extended-full-bar' : ''
          } ${isChatOpen ? 'shift-for-chat' : ''}`}
        >
          <div
            className={`hud-left-search-filters ${
              viewMode !== 'exploration' ? 'revealed' : ''
            }`}
          >
            <div className="custom-upward-combobox">
              <button
                type="button"
                className={`tactile-btn-dark ${selectedCategory !== 'Todas' ? 'active-state' : ''}`}
                style={{ height: '38px', padding: '0 13px', fontSize: '0.82rem' }}
                onClick={() => {
                  soundManager.playClick();
                  setIsCategoryMenuOpen((prev) => !prev);
                }}
              >
                {renderCategoryIcon(selectedCategory)}
                <span>{selectedCategory}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>

              {isCategoryMenuOpen && (
                <div className="custom-upward-menu">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`combobox-option-btn ${selectedCategory === cat ? 'selected' : ''}`}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedCategory(cat);
                        setIsCategoryMenuOpen(false);
                      }}
                    >
                      {renderCategoryIcon(cat)}
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`animated-search-pod ${isSearchExpanded ? 'expanded' : 'collapsed'}`}>
              <button
                type="button"
                className="tactile-btn-dark"
                style={{
                  border: 'none',
                  borderRadius: 0,
                  width: '42px',
                  height: '38px',
                  padding: 0,
                  boxShadow: 'none',
                  flexShrink: 0,
                }}
                onClick={() => {
                  soundManager.playClick();
                  setIsSearchExpanded((prev) => {
                    const next = !prev;
                    if (next) setTimeout(() => searchInputRef.current?.focus(), 120);
                    else setSearchQuery('');
                    return next;
                  });
                }}
                title="Buscar juego"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {isSearchExpanded && (
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Escribe para buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    outline: 'none',
                    padding: '0 10px',
                    fontSize: '0.84rem',
                  }}
                />
              )}
            </div>
          </div>

          <div className="hud-right-views-wrapper">
            <span className="hud-views-label">VISTAS</span>
            <div className="hud-right-views-subbox">
              <button
                type="button"
                className={`tactile-btn-dark ${viewMode === 'exploration' ? 'active-state' : ''}`}
                style={{ width: '38px', height: '36px', padding: 0 }}
                onClick={() => handleSwitchViewMode('exploration')}
                title="Modo Exploración (Grafo Libre)"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </button>

              <button
                type="button"
                className={`tactile-btn-dark ${viewMode === 'bento' ? 'active-state' : ''}`}
                style={{ width: '38px', height: '36px', padding: 0 }}
                onClick={() => handleSwitchViewMode('bento')}
                title="Vista Cuadrícula Bento"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="10" height="10" rx="1" />
                  <rect x="16" y="3" width="5" height="10" rx="1" />
                  <rect x="3" y="16" width="5" height="5" rx="1" />
                  <rect x="11" y="16" width="10" height="5" rx="1" />
                </svg>
              </button>

              <button
                type="button"
                className={`tactile-btn-dark ${viewMode === 'wii-u' ? 'active-state' : ''}`}
                style={{ width: '38px', height: '36px', padding: 0 }}
                onClick={() => handleSwitchViewMode('wii-u')}
                title="Vista Canales Wii U"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="2" y="4" width="20" height="16" rx="6" />
                  <rect x="6" y="8" width="12" height="8" rx="2" />
                </svg>
              </button>

              <button
                type="button"
                className={`tactile-btn-dark ${onlyFavorites ? 'active-state' : ''}`}
                style={{ width: '38px', height: '36px', padding: 0 }}
                onClick={() => {
                  soundManager.playClick();
                  setOnlyFavorites((prev) => !prev);
                }}
                title="Filtrar Favoritos"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill={onlyFavorites ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            </div>
          </div>
        </footer>
      )}

      {viewMode !== 'exploration' && <PetWalkerEasterEgg />}
    </div>
  );
};