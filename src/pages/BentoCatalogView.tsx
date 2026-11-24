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
import { CATALOG_AD_SLOTS, type CatalogAdSlot } from '../data/adSlotsData';

type ViewMode = 'exploration' | 'bento' | 'wii-u';

const CARD_WIDTH = 245;
const CARD_HEIGHT = 160;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.4;
const ZOOM_STEP = 0.15;
const FOUR_GAMES_ROW_SPAN = 1560;

type CatalogGridItem =
  | { kind: 'game'; data: Game }
  | { kind: 'ad'; data: CatalogAdSlot };

interface GraphNodeInput {
  key: string;
  width: number;
  height: number;
}

interface GraphNodePos {
  x: number;
  y: number;
  delay: string;
}

// generador pseudoaleatorio liviano para repartir anuncios al azar sin saltos al hacer hover
const createSeededRandom = (seed: number) => {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

// intercala anuncios en posiciones aleatorias intentando no dejar dos pegados
const buildRandomInterleavedList = (
  gamesList: Game[],
  adsList: CatalogAdSlot[],
  seed: number
): CatalogGridItem[] => {
  const items: CatalogGridItem[] = gamesList.map((data) => ({ kind: 'game', data }));
  if (adsList.length === 0) return items;

  const rand = createSeededRandom(seed);
  const shuffledAds = [...adsList].sort(() => rand() - 0.5);

  shuffledAds.forEach((ad) => {
    const minPos = items.length > 2 ? 1 : 0;
    let insertAt = minPos + Math.floor(rand() * (items.length - minPos + 1));

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const prevIsAd = insertAt > 0 && items[insertAt - 1]?.kind === 'ad';
      const nextIsAd = items[insertAt]?.kind === 'ad';
      if (!prevIsAd && !nextIsAd) break;
      insertAt = minPos + Math.floor(rand() * (items.length - minPos + 1));
    }

    items.splice(insertAt, 0, { kind: 'ad', data: ad });
  });

  return items;
};

// posiciona juegos y anuncios mezclados al azar y separa cajas para evitar solapamientos
const computeUnifiedGraphLayout = (
  gamesList: Game[],
  adsList: CatalogAdSlot[],
  seed: number
): Record<string, GraphNodePos> => {
  const rand = createSeededRandom(seed + 31);
  const mixedItems = buildRandomInterleavedList(gamesList, adsList, seed);

  const unifiedNodes: GraphNodeInput[] = mixedItems.map((item) => {
    if (item.kind === 'ad') {
      return {
        key: `ad-${item.data.id}`,
        width: item.data.graphSize.width,
        height: item.data.graphSize.height,
      };
    }
    return {
      key: `game-${item.data.id}`,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    };
  });

  const cols = 4;
  const colSpacing = 415;
  const rowSpacing = 310;
  const pad = 46;

  const boxes = unifiedNodes.map((node, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const rowStagger = row % 2 === 1 ? 115 : 0;
    const jitterX = Math.round((rand() - 0.5) * 46);
    const jitterY = Math.round((rand() - 0.5) * 42);

    return {
      ...node,
      x: Math.max(50, 90 + col * colSpacing + rowStagger + jitterX),
      y: Math.max(50, 85 + row * rowSpacing + jitterY),
      delay: `${(idx * 0.38).toFixed(2)}s`,
    };
  });

  // empuja nodos que se toquen respetando el tamano real de cada tarjeta o anuncio
  for (let pass = 0; pass < 24; pass += 1) {
    let moved = false;

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];

        const dx = b.x + b.width / 2 - (a.x + a.width / 2);
        const dy = b.y + b.height / 2 - (a.y + a.height / 2);

        const minX = (a.width + b.width) / 2 + pad;
        const minY = (a.height + b.height) / 2 + pad;

        const overlapX = minX - Math.abs(dx);
        const overlapY = minY - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          if (overlapX < overlapY) {
            const shift = overlapX / 2 + 1;
            const dir = dx >= 0 ? 1 : -1;
            a.x = Math.max(40, a.x - dir * shift);
            b.x = Math.max(40, b.x + dir * shift);
          } else {
            const shift = overlapY / 2 + 1;
            const dir = dy >= 0 ? 1 : -1;
            a.y = Math.max(40, a.y - dir * shift);
            b.y = Math.max(40, b.y + dir * shift);
          }
        }
      }
    }

    if (!moved) break;
  }

  const result: Record<string, GraphNodePos> = {};
  boxes.forEach((b) => {
    result[b.key] = {
      x: Math.round(b.x),
      y: Math.round(b.y),
      delay: b.delay,
    };
  });

  return result;
};

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
  const [hoveredAdId, setHoveredAdId] = useState<string | null>(null);
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
  const [isAdLockingCamera, setIsAdLockingCamera] = useState<boolean>(false);
  const [adLayoutSeed, setAdLayoutSeed] = useState<number>(() =>
    Math.floor(Math.random() * 1000000)
  );
  const isCameraLocked = isCameraPinned || isAdLockingCamera;
  
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

  // handlers de catalogo y seleccion
  const handleSwitchViewMode = (nextMode: ViewMode) => {
    soundManager.playClick();
    if (activeGame) {
      killGlobalRuffleInstance();
      setActiveGame(null);
      setPendingSwitchGame(null);
      setIsGameCurrentlyRunning(false);
      setIsCameraPinned(false);
      setIsAdLockingCamera(false);
      navigate('/', { replace: true });
      window.dispatchEvent(
        new CustomEvent('udo_game_playing_state', { detail: { playing: false } })
      );
    }
    setIsCategoryMenuOpen(false);
    // sortea nuevas posiciones de anuncios al cambiar entre grafo, bento y wii u
    setAdLayoutSeed(Math.floor(Math.random() * 1000000));
    setViewMode(nextMode);
  };

  const activeGraphAds = useMemo(
    () => (!onlyFavorites && !activeGame ? CATALOG_AD_SLOTS : []),
    [onlyFavorites, activeGame]
  );

  const visibleGames = useMemo(() => {
    return games.filter((g) => {
      if (onlyFavorites && !favorites.includes(g.id)) return false;
      if (viewMode !== 'exploration') {
        const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat =
          selectedCategory === 'Todas' || g.categories.includes(selectedCategory);
        return matchesSearch && matchesCat;
      }
      return true;
    });
  }, [games, onlyFavorites, favorites, viewMode, searchQuery, selectedCategory]);

  // calcula posiciones sin solapamientos para todos los juegos y anuncios visibles
  const baseGraphLayout = useMemo(
    () =>
      computeUnifiedGraphLayout(
        visibleGames,
        onlyFavorites ? [] : CATALOG_AD_SLOTS,
        adLayoutSeed
      ),
    [visibleGames, onlyFavorites, adLayoutSeed]
  );

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
    // marca el alias antes de navegar para evitar reaperturas en el efecto de ruta
    appliedRouteAliasRef.current = targetAlias;
    navigate(`/juego/${targetAlias}`, { replace: true });

    soundManager.playOpen();
    setActiveGame(game);

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
    appliedRouteAliasRef.current = targetAlias;
    setActiveGame(target);
    setIsGameCurrentlyRunning(false);
    setIsCameraPinned(false);
    setIsAdLockingCamera(false);
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
    setIsAdLockingCamera(false);
    setIsGameCurrentlyRunning(false);
    const vw = viewportRef.current?.clientWidth || window.innerWidth - 92;
    setZoomLevel(computeAutoZoom(vw));
    // no limpia appliedRouteAliasRef aqui; se limpia cuando routeAlias sea undefined
    navigate('/', { replace: true });
  };

  // fija y centra la camara del grafo mientras haya un anuncio activo
  const handleAdActiveChange = useCallback(
    (adActive: boolean) => {
      setIsAdLockingCamera(adActive);
      if (adActive) {
        setIsDraggingCanvas(false);
        if (viewMode === 'exploration' && activeGame) {
          setIsCameraPinned(true);
          centerCameraOnGame(activeGame, isGameCurrentlyRunning);
        }
      }
    },
    [activeGame, centerCameraOnGame, isGameCurrentlyRunning, viewMode]
  );

  const handleTogglePinAndCenter = () => {
    if (isAdLockingCamera) return;
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
    if (e.button !== 0 || isCameraLocked) return;
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
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  // efectos de carga, redimensionamiento y ruta
  useEffect(() => {
    setIsLoading(true);
    fetchCatalogGames().then((loaded) => {
      setGames(loaded);
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
    if (!routeAlias) {
      appliedRouteAliasRef.current = null;
      return;
    }
    if (isLoading || games.length === 0) return;
    if (appliedRouteAliasRef.current === routeAlias) return;

    const normalizedTarget = slugifyGameAlias(routeAlias);
    const matchedGame = games.find((g) => {
      const gAlias = slugifyGameAlias(g.alias || g.title, g.id);
      return gAlias === normalizedTarget || String(g.id) === routeAlias;
    });

    if (matchedGame) {
      appliedRouteAliasRef.current = routeAlias;
      setActiveGame(matchedGame);
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



  const effectiveNodeCoords = useMemo(() => {
    const activeCoord = activeGame ? baseGraphLayout[`game-${activeGame.id}`] : null;
    const result: Record<number, GraphNodePos> = {};

    visibleGames.forEach((game) => {
      const basePos = baseGraphLayout[`game-${game.id}`] || { x: 110, y: 95, delay: '0s' };
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
  }, [visibleGames, baseGraphLayout, activeGame]);







  const gridItemsWithAds = useMemo<CatalogGridItem[]>(
    () =>
      buildRandomInterleavedList(
        visibleGames,
        onlyFavorites ? [] : CATALOG_AD_SLOTS,
        adLayoutSeed + 97
      ),
    [visibleGames, onlyFavorites, adLayoutSeed]
  );

 const graphEdges = useMemo(() => {
    const edgesMap = new Map<
      string,
      { keyA: string; keyB: string; x1: number; y1: number; x2: number; y2: number }
    >();

    const allNodes: Array<{ key: string; cx: number; cy: number }> = [];

    visibleGames.forEach((g) => {
      const pos = effectiveNodeCoords[g.id];
      if (!pos) return;
      allNodes.push({
        key: `game-${g.id}`,
        cx: pos.x + CARD_WIDTH / 2,
        cy: pos.y + CARD_HEIGHT / 2,
      });
    });

    activeGraphAds.forEach((ad) => {
      const pos = baseGraphLayout[`ad-${ad.id}`];
      if (!pos) return;
      allNodes.push({
        key: `ad-${ad.id}`,
        cx: pos.x + ad.graphSize.width / 2,
        cy: pos.y + ad.graphSize.height / 2,
      });
    });

    allNodes.forEach((nodeA) => {
      const neighbors = allNodes
        .filter((nodeB) => nodeB.key !== nodeA.key)
        .map((nodeB) => ({
          nodeB,
          dist: Math.hypot(nodeA.cx - nodeB.cx, nodeA.cy - nodeB.cy),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 4);

      neighbors.forEach(({ nodeB }) => {
        const edgeKey = [nodeA.key, nodeB.key].sort().join('__');
        if (!edgesMap.has(edgeKey)) {
          edgesMap.set(edgeKey, {
            keyA: nodeA.key,
            keyB: nodeB.key,
            x1: nodeA.cx,
            y1: nodeA.cy,
            x2: nodeB.cx,
            y2: nodeB.cy,
          });
        }
      });
    });

    return Array.from(edgesMap.values());
  }, [visibleGames, effectiveNodeCoords, activeGraphAds, baseGraphLayout]);

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
            isCameraLocked ? 'pinned-lock' : ''
          }`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={(e) => {
            if (isCameraLocked) return;
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              handleZoomChange(e.deltaY < 0 ? 0.1 : -0.1);
            }
          }}
        >

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
                const activeKey = activeGame ? `game-${activeGame.id}` : null;
                const hoveredKey = hoveredId !== null
                  ? `game-${hoveredId}`
                  : hoveredAdId
                    ? `ad-${hoveredAdId}`
                    : null;

                const isHighlighted =
                  hoveredKey === edge.keyA ||
                  hoveredKey === edge.keyB ||
                  activeKey === edge.keyA ||
                  activeKey === edge.keyB;

                return (
                  <g key={`${edge.keyA}-${edge.keyB}`}>
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
                      isCameraPinned={isCameraLocked}
                      onTogglePinCamera={handleTogglePinAndCenter}
                      onAutoPinOnPlay={handleAutoPinOnPlay}
                      onToggleFavorite={toggleFavorite}
                      onVote={handleVote}
                      onClose={handleCloseActiveGame}
                      onPlayingChange={setIsGameCurrentlyRunning}
                      onAdActiveChange={handleAdActiveChange}
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

            {activeGraphAds.map((ad) => {
              const coord = baseGraphLayout[`ad-${ad.id}`] || { x: ad.graphCoord.x, y: ad.graphCoord.y, delay: '0s' };
              const isAdHovered = hoveredAdId === ad.id;

              return (
                <div
                  key={ad.id}
                  className="scatter-node-wrapper pop-item-enter"
                  style={{
                    left: `${coord.x}px`,
                    top: `${coord.y}px`,
                    zIndex: isAdHovered ? 25 : 6,
                  }}
                >
                  <div className="floating-space-wobble" style={{ animationDelay: coord.delay }}>
                    <article
                      className="game-bevel-card ad-graph-node-card"
                      style={{
                        width: `${ad.graphSize.width}px`,
                        height: `${ad.graphSize.height}px`,
                      }}
                      onMouseEnter={() => {
                        soundManager.playHover();
                        setHoveredAdId(ad.id);
                      }}
                      onMouseLeave={() => setHoveredAdId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playClick();
                      }}
                      title={`Espacio publicitario: ${ad.slotCode}`}
                    >
                      <div className="game-card-inner-clip ad-card-surface">
                        <CatalogCardBadge label="ANUNCIO" />
                        <div className="ad-card-copy">
                          <span className="ad-slot-code">{ad.slotCode}</span>
                          <div className="ad-card-title">{ad.title}</div>
                          <div className="ad-card-sub">{ad.subtitle}</div>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {viewMode !== 'exploration' && (
        <div className={viewMode === 'bento' ? 'friv-bento-grid' : 'wiiu-channel-grid'}>
          {gridItemsWithAds.map((item) => {
            if (item.kind === 'ad') {
              const ad = item.data;

              if (viewMode === 'wii-u') {
                return (
                  <div
                    key={ad.id}
                    className="wiiu-channel-tile pop-item-enter ad-slot-card-border"
                    onClick={() => soundManager.playClick()}
                    title={`Espacio publicitario: ${ad.slotCode}`}
                  >
                    <div className="wiiu-channel-inner ad-card-surface">
                      <CatalogCardBadge label="ANUNCIO" />
                      <div className="ad-card-copy">
                        <span className="ad-slot-code">{ad.slotCode}</span>
                        <div className="ad-card-sub">{ad.subtitle}</div>
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: 'center',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        paddingTop: '6px',
                        color: 'var(--primary-border)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {ad.title}
                    </div>
                  </div>
                );
              }

              return (
                <article
                  key={ad.id}
                  className={`game-bevel-card size-${ad.bentoSize} pop-item-enter ad-slot-card-border`}
                  onClick={() => soundManager.playClick()}
                  title={`Espacio publicitario: ${ad.slotCode}`}
                >
                  <div className="game-card-inner-clip ad-card-surface">
                    <CatalogCardBadge label="ANUNCIO" />
                    <div className="ad-card-copy">
                      <span className="ad-slot-code">{ad.slotCode}</span>
                      <div className="ad-card-title">{ad.title}</div>
                      <div className="ad-card-sub">{ad.subtitle}</div>
                    </div>
                  </div>
                </article>
              );
            }

            const game = item.data;
            const isHovered = hoveredId === game.id;
            const isFav = favorites.includes(game.id);
            const isRec = recommendedIds.has(game.id);
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
                    {isRec && <CatalogCardBadge label="RECOMENDADO" />}
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
                }}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelectGame(game)}
              >
                <div className="game-card-inner-clip">
                  {isRec && <CatalogCardBadge label="RECOMENDADO" />}
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
            if (isAdLockingCamera) return;
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
            onAdActiveChange={handleAdActiveChange}
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