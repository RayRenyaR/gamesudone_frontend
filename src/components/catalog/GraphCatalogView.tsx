import React, { useState } from 'react';
import { type Game } from '../../data/gamesData';
import { type CatalogAdSlot } from '../../data/adSlotsData';
import { type SeasonalThemeId } from '../../data/seasonalThemes';
import { soundManager } from '../../data/audioConfig';
import { GameViewerStage } from '../GameViewerStage';
import { CatalogCardBadge } from '../CatalogCardBadge';
import { GameSeasonalOverlay } from '../SeasonalDecorations';
import {
  type GraphNodePos,
  type GraphEdge,
  GRAPH_CARD_WIDTH,
  GRAPH_CARD_HEIGHT,
  ZOOM_STEP,
} from '../../services/catalogLayoutEngine';

interface GraphCatalogViewProps {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  games: Game[];
  activeAds: CatalogAdSlot[];
  activeGame: Game | null;
  favorites: number[];
  votes: Record<number, 'LIKE' | 'DISLIKE'>;
  onlyFavorites: boolean;
  seasonalThemeId: SeasonalThemeId;
  baseGraphLayout: Record<string, GraphNodePos>;
  effectiveNodeCoords: Record<number, GraphNodePos>;
  graphEdges: GraphEdge[];
  zoomLevel: number;
  camOffset: { x: number; y: number };
  isDraggingCanvas: boolean;
  isCameraLocked: boolean;
  isChatOpen: boolean;
  onZoomChange: (delta: number) => void;
  onResetZoom: () => void;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: () => void;
  onWheelZoom: (e: React.WheelEvent) => void;
  onSelectGame: (game: Game) => void;
  onTogglePinCamera: () => void;
  onAutoPinOnPlay: () => void;
  onToggleFavorite: (gameId: number) => void;
  onVote: (gameId: number, type: 'LIKE' | 'DISLIKE') => void;
  onCloseActiveGame: () => void;
  onPlayingChange: (playing: boolean) => void;
  onAdActiveChange: (adActive: boolean) => void;
}

export const GraphCatalogView: React.FC<GraphCatalogViewProps> = ({
  viewportRef,
  games,
  activeAds,
  activeGame,
  favorites,
  votes,
  onlyFavorites,
  seasonalThemeId,
  baseGraphLayout,
  effectiveNodeCoords,
  graphEdges,
  zoomLevel,
  camOffset,
  isDraggingCanvas,
  isCameraLocked,
  isChatOpen,
  onZoomChange,
  onResetZoom,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onWheelZoom,
  onSelectGame,
  onTogglePinCamera,
  onAutoPinOnPlay,
  onToggleFavorite,
  onVote,
  onCloseActiveGame,
  onPlayingChange,
  onAdActiveChange,
}) => {
  const [hoveredGameId, setHoveredGameId] = useState<number | null>(null);
  const [hoveredAdId, setHoveredAdId] = useState<string | null>(null);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState<boolean>(false);

  return (
    <>
      {!activeGame && (
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
              onClick={() => onZoomChange(-ZOOM_STEP)}
              title="Alejar (Zoom Out)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <span
              className="zoom-percent-badge"
              onClick={onResetZoom}
              title="Clic para ajustar zoom automático"
            >
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              type="button"
              className="tactile-btn-dark"
              style={{ width: '34px', height: '34px', padding: 0 }}
              onClick={() => onZoomChange(ZOOM_STEP)}
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

      <div
        ref={viewportRef}
        className={`exploration-free-viewport ${isDraggingCanvas ? 'grabbing' : ''} ${
          isCameraLocked ? 'pinned-lock' : ''
        }`}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onMouseLeave={onCanvasMouseUp}
        onWheel={onWheelZoom}
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
              const hoveredKey =
                hoveredGameId !== null
                  ? `game-${hoveredGameId}`
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

          {games.map((game) => {
            const coord = effectiveNodeCoords[game.id] || { x: 110, y: 95, delay: '0s' };
            const isExpandedHere = activeGame?.id === game.id;
            const isHovered = hoveredGameId === game.id;
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
                    onTogglePinCamera={onTogglePinCamera}
                    onAutoPinOnPlay={onAutoPinOnPlay}
                    onToggleFavorite={onToggleFavorite}
                    onVote={onVote}
                    onClose={onCloseActiveGame}
                    onPlayingChange={onPlayingChange}
                    onAdActiveChange={onAdActiveChange}
                  />
                ) : (
                  <div className="floating-space-wobble" style={{ animationDelay: coord.delay }}>
                    <article
                      className={`game-bevel-card ${isFav ? 'is-favorite-card' : ''}`}
                      style={{ width: `${GRAPH_CARD_WIDTH}px`, height: `${GRAPH_CARD_HEIGHT}px` }}
                      onMouseEnter={() => {
                        soundManager.playHover();
                        setHoveredGameId(game.id);
                      }}
                      onMouseLeave={() => setHoveredGameId(null)}
                      onClick={() => onSelectGame(game)}
                    >
                      <GameSeasonalOverlay themeId={seasonalThemeId} gameId={game.id} />
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

          {activeAds.map((ad) => {
            const coord = baseGraphLayout[`ad-${ad.id}`] || {
              x: ad.graphCoord.x,
              y: ad.graphCoord.y,
              delay: '0s',
            };
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
    </>
  );
};