import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Game, fetchCatalogGames, slugifyGameAlias } from '../data/gamesData';
import { resolveRecommendedGames } from '../data/recommendationsEngine';
import { CATALOG_AD_SLOTS } from '../data/adSlotsData';
import { useSeasonalTheme } from '../data/seasonalThemes';
import { soundManager } from '../data/audioConfig';
import { GameViewerStage } from '../components/viewer/GameViewerStage';
import { killGlobalRuffleInstance } from '../components/viewer/RufflePlayer';
import { ConfirmDialogModal as ConfirmActionModal } from '../components/common/ConfirmDialogModal';
import { CatalogMascotWalker } from '../components/common/CatalogMascotWalker';
import { RecommendedBubblesTray } from '../components/catalog/RecommendedBubblesTray';
import { GraphCatalogView } from '../components/catalog/GraphCatalogView';
import { GridCatalogView } from '../components/catalog/GridCatalogView';
import { CatalogToolbar } from '../components/catalog/CatalogToolbar';
import { useGraphViewport } from '../hooks/useGraphViewport';
import {
  type CatalogViewMode,
  buildRandomInterleavedList,
  computeUnifiedGraphLayout,
  computeDisplacedGameCoords,
  computeGraphEdges,
} from '../services/catalogLayoutEngine';

export const GamesCatalogPage: React.FC = () => {
  const appliedRouteAliasRef = useRef<string | null>(null);
  const { alias: routeAlias } = useParams<{ alias?: string }>();
  const navigate = useNavigate();
  const { theme: seasonalTheme } = useSeasonalTheme();

  // estado de catalogo y filtros
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<CatalogViewMode>('graph');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('udo_fav_games');
    return saved ? JSON.parse(saved) : [1, 2];
  });
  const [votes, setVotes] = useState<Record<number, 'LIKE' | 'DISLIKE'>>({});

  // estado del visor, camara y avisos
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [pendingSwitchGame, setPendingSwitchGame] = useState<Game | null>(null);
  const [isGameCurrentlyRunning, setIsGameCurrentlyRunning] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isCameraPinned, setIsCameraPinned] = useState<boolean>(false);
  const [isAdLockingCamera, setIsAdLockingCamera] = useState<boolean>(false);
  const [adLayoutSeed, setAdLayoutSeed] = useState<number>(() =>
    Math.floor(Math.random() * 1000000)
  );
  const [showExploreIntro, setShowExploreIntro] = useState<boolean>(() => {
    return sessionStorage.getItem('udo_explore_intro_dismissed') !== 'true';
  });

  const isCameraLocked = isCameraPinned || isAdLockingCamera;

  // datos derivados
  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(games.flatMap((g) => g.categories)))],
    [games]
  );

  const recommendedGames = useMemo(
    () => resolveRecommendedGames({ allGames: games, externalRecommendedGames: null }),
    [games]
  );

  const recommendedIds = useMemo(
    () => new Set(recommendedGames.slice(0, 4).map((g) => g.id)),
    [recommendedGames]
  );

  const visibleGames = useMemo(() => {
    return games.filter((g) => {
      if (onlyFavorites && !favorites.includes(g.id)) return false;
      if (viewMode !== 'graph') {
        const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat =
          selectedCategory === 'Todas' || g.categories.includes(selectedCategory);
        return matchesSearch && matchesCat;
      }
      return true;
    });
  }, [games, onlyFavorites, favorites, viewMode, searchQuery, selectedCategory]);

  const activeGraphAds = useMemo(
    () => (!onlyFavorites && !activeGame ? CATALOG_AD_SLOTS : []),
    [onlyFavorites, activeGame]
  );

  const baseGraphLayout = useMemo(
    () =>
      computeUnifiedGraphLayout(
        visibleGames,
        onlyFavorites ? [] : CATALOG_AD_SLOTS,
        adLayoutSeed
      ),
    [visibleGames, onlyFavorites, adLayoutSeed]
  );

  const effectiveNodeCoords = useMemo(
    () => computeDisplacedGameCoords(visibleGames, baseGraphLayout, activeGame),
    [visibleGames, baseGraphLayout, activeGame]
  );

  const graphEdges = useMemo(
    () => computeGraphEdges(visibleGames, effectiveNodeCoords, activeGraphAds, baseGraphLayout),
    [visibleGames, effectiveNodeCoords, activeGraphAds, baseGraphLayout]
  );

  const gridItemsWithAds = useMemo(
    () =>
      buildRandomInterleavedList(
        visibleGames,
        onlyFavorites ? [] : CATALOG_AD_SLOTS,
        adLayoutSeed + 97
      ),
    [visibleGames, onlyFavorites, adLayoutSeed]
  );

  // hook de camara y zoom del grafo
  const {
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
  } = useGraphViewport({ baseGraphLayout, isCameraLocked });

  // carga inicial y escucha del chat lateral
  useEffect(() => {
    setIsLoading(true);
    fetchCatalogGames().then((loaded) => {
      setGames(loaded);
      setIsLoading(false);
    });

    const onChatToggle = (e: Event) => {
      const custom = e as CustomEvent<{ open: boolean }>;
      setIsChatOpen(Boolean(custom.detail?.open));
    };

    window.addEventListener('udo_chat_state', onChatToggle);
    return () => window.removeEventListener('udo_chat_state', onChatToggle);
  }, []);

  // sincronizacion con enlace compartible /juego/:alias
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
      if (viewMode === 'graph') {
        window.setTimeout(() => centerCameraOnGame(matchedGame, false), 60);
      }
    }
  }, [isLoading, routeAlias, games, viewMode, centerCameraOnGame]);

  // acciones del catalogo
  const handleSwitchViewMode = (nextMode: CatalogViewMode) => {
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
    setAdLayoutSeed(Math.floor(Math.random() * 1000000));
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
    if (wasRecentDrag()) return;

    if (activeGame && activeGame.id !== game.id && isGameCurrentlyRunning) {
      soundManager.playClick();
      setPendingSwitchGame(game);
      return;
    }

    const targetAlias = slugifyGameAlias(game.alias || game.title, game.id);
    appliedRouteAliasRef.current = targetAlias;
    navigate(`/juego/${targetAlias}`, { replace: true });

    soundManager.playOpen();
    setActiveGame(game);

    if (viewMode === 'graph') {
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

    if (viewMode === 'graph') {
      centerCameraOnGame(target, false);
    }
  };

  const handleCloseActiveGame = () => {
    setActiveGame(null);
    setIsCameraPinned(false);
    setIsAdLockingCamera(false);
    setIsGameCurrentlyRunning(false);
    resetZoomToFit(false);
    navigate('/', { replace: true });
  };

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

  const handleAdActiveChange = useCallback(
    (adActive: boolean) => {
      setIsAdLockingCamera(adActive);
      if (adActive) {
        cancelDrag();
        if (viewMode === 'graph' && activeGame) {
          setIsCameraPinned(true);
          centerCameraOnGame(activeGame, isGameCurrentlyRunning);
        }
      }
    },
    [activeGame, cancelDrag, centerCameraOnGame, isGameCurrentlyRunning, viewMode]
  );

  if (isLoading) {
    return (
      <div className="tactile-panel" style={{ padding: '48px', textAlign: 'center', margin: '24px' }}>
        <h2 style={{ fontSize: '1.4rem' }}>CARGANDO CATÁLOGO DE JUEGOS...</h2>
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
        <ConfirmActionModal
          badgeText="CAMBIAR DE JUEGO"
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
              Mantén presionado y arrastra en cualquier parte para desplazarte por la red de juegos, o usa el control de <strong>Zoom</strong> arriba a la derecha. Haz clic sobre un juego para abrirlo.
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

      {viewMode === 'graph' ? (
        <GraphCatalogView
          viewportRef={viewportRef}
          games={visibleGames}
          activeAds={activeGraphAds}
          activeGame={activeGame}
          favorites={favorites}
          votes={votes}
          onlyFavorites={onlyFavorites}
          seasonalThemeId={seasonalTheme.id}
          baseGraphLayout={baseGraphLayout}
          effectiveNodeCoords={effectiveNodeCoords}
          graphEdges={graphEdges}
          zoomLevel={zoomLevel}
          camOffset={camOffset}
          isDraggingCanvas={isDraggingCanvas}
          isCameraLocked={isCameraLocked}
          isChatOpen={isChatOpen}
          onZoomChange={handleZoomChange}
          onResetZoom={() => resetZoomToFit(true)}
          onCanvasMouseDown={handleCanvasMouseDown}
          onCanvasMouseMove={handleCanvasMouseMove}
          onCanvasMouseUp={handleCanvasMouseUp}
          onWheelZoom={handleWheelZoom}
          onSelectGame={handleSelectGame}
          onTogglePinCamera={handleTogglePinAndCenter}
          onAutoPinOnPlay={handleAutoPinOnPlay}
          onToggleFavorite={toggleFavorite}
          onVote={handleVote}
          onCloseActiveGame={handleCloseActiveGame}
          onPlayingChange={setIsGameCurrentlyRunning}
          onAdActiveChange={handleAdActiveChange}
        />
      ) : (
        <GridCatalogView
          layoutVariant={viewMode}
          items={gridItemsWithAds}
          favorites={favorites}
          recommendedIds={recommendedIds}
          onlyFavorites={onlyFavorites}
          seasonalThemeId={seasonalTheme.id}
          onSelectGame={handleSelectGame}
        />
      )}

      {viewMode !== 'graph' && activeGame && (
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

      {viewMode === 'graph' && !activeGame && (
        <RecommendedBubblesTray
          recommendedGames={recommendedGames}
          onSelectGame={handleSelectGame}
        />
      )}

      {!activeGame && (
        <CatalogToolbar
          viewMode={viewMode}
          categories={categories}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onlyFavorites={onlyFavorites}
          isChatOpen={isChatOpen}
          onSelectCategory={setSelectedCategory}
          onSearchChange={setSearchQuery}
          onSwitchViewMode={handleSwitchViewMode}
          onToggleFavorites={() => setOnlyFavorites((prev) => !prev)}
        />
      )}

      {viewMode !== 'graph' && <CatalogMascotWalker />}
    </div>
  );
};