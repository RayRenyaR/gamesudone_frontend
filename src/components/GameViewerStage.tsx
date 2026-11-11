import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type Game, DEFAULT_LEADERBOARD } from '../data/gamesData';
import { RufflePlayer } from './RufflePlayer';
import { soundManager } from '../data/audioConfig';

interface GameViewerStageProps {
  game: Game;
  isFavorite: boolean;
  userVote?: 'LIKE' | 'DISLIKE';
  isExplorationMode?: boolean;
  isCameraPinned?: boolean;
  onTogglePinCamera?: () => void;
  onToggleFavorite: (gameId: number) => void;
  onVote: (gameId: number, type: 'LIKE' | 'DISLIKE') => void;
  onClose: () => void;
  onPlayingChange?: (playing: boolean) => void;
}

export const GameViewerStage: React.FC<GameViewerStageProps> = ({
  game,
  isFavorite,
  userVote,
  isExplorationMode = false,
  isCameraPinned = false,
  onTogglePinCamera,
  onToggleFavorite,
  onVote,
  onClose,
  onPlayingChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRankedOpen, setIsRankedOpen] = useState<boolean>(false);
  const [showPinFirstTimeHint, setShowPinFirstTimeHint] = useState<boolean>(() => {
    return localStorage.getItem('udo_pin_hint_seen') !== 'true';
  });

  const notifyMusicPause = (playing: boolean) => {
    window.dispatchEvent(
      new CustomEvent('udo_game_playing_state', { detail: { playing } })
    );
  };

  // Limpieza total al cerrar para evitar fugas de memoria o audio fantasma
  const handleHardClose = useCallback(() => {
    soundManager.playClose();
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
    setIsPlaying(false);
    onPlayingChange?.(false);
    notifyMusicPause(false);
    onClose();
  }, [onClose, onPlayingChange]);

  useEffect(() => {
    setIsPlaying(false);
    setIsRankedOpen(false);
    onPlayingChange?.(false);
    notifyMusicPause(false);
    return () => {
      notifyMusicPause(false);
    };
  }, [game.id]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    soundManager.playClick();
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Atajos globales: SOLO Alt+Enter para Pantalla Completa, ESC para cerrar el juego de verdad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          e.preventDefault();
          handleHardClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHardClose, toggleFullscreen]);

  const handleStart = () => {
    soundManager.playOpen();
    setIsPlaying(true);
    onPlayingChange?.(true);
    // Pausa la música de la plataforma en cuanto empieza a correr el juego
    notifyMusicPause(true);
  };

  const handlePinClick = () => {
    soundManager.playClick();
    if (showPinFirstTimeHint) {
      setShowPinFirstTimeHint(false);
      localStorage.setItem('udo_pin_hint_seen', 'true');
    }
    onTogglePinCamera?.();
  };

  const activeUrl = game.gameUrl || '/game-export/index.html';
  const isFlashSwf = game.tipo === 'FLASH' || activeUrl.toLowerCase().endsWith('.swf');

  return (
    <div
      ref={containerRef}
      className="game-bevel-card gameviewer-shell"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="gameviewer-body-split">
        <div className="gameviewer-left-stage">
          {!isPlaying ? (
            /* PANTALLA DE INFORMACIÓN PREVIA (TEXTO BLANCO GARANTIZADO SOBRE FONDO OSCURO DE PORTADA) */
            <div
              style={{
                flex: 1,
                padding: '22px 26px',
                backgroundImage: `linear-gradient(90deg, rgba(10, 6, 20, 0.95) 0%, rgba(10, 6, 20, 0.84) 58%, rgba(10, 6, 20, 0.48) 100%), url(${game.coverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#ffffff',
                overflowY: 'auto',
              }}
            >
              <div style={{ maxWidth: '540px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: 'var(--primary-mid)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                    }}
                  >
                    {game.tipo}
                  </span>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                    }}
                  >
                    {game.ageRating}
                  </span>
                  {game.categories.map((cat) => (
                    <span
                      key={cat}
                      style={{
                        background: 'rgba(0,0,0,0.55)',
                        color: '#e2dcf0',
                        border: '1px solid var(--panel-border-outer)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                <h2 style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2rem)', lineHeight: 1.1, color: '#ffffff' }}>
                  {game.title}
                </h2>

                <p style={{ fontSize: '0.86rem', color: '#e2dcf0', lineHeight: 1.4 }}>
                  {game.description}
                </p>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    color: '#ffffff',
                    borderLeft: '4px solid var(--primary-top)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                >
                  <strong>Controles:</strong> {game.controls}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="tactile-btn-purple"
                  style={{ padding: '11px 30px', fontSize: '0.98rem' }}
                  onClick={handleStart}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>JUGAR AHORA</span>
                </button>
              </div>
            </div>
          ) : (
            /* JUEGO ACTIVO: SE DESTRUYE AL 100% CUANDO isPlaying PASA A FALSE O SE DESMONTA */
            <div style={{ flex: 1, width: '100%', background: '#000', position: 'relative' }}>
              {isFlashSwf ? (
                <RufflePlayer swfUrl={activeUrl} />
              ) : (
                <iframe
                  ref={iframeRef}
                  src={activeUrl}
                  title={game.title}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  allowFullScreen
                />
              )}
            </div>
          )}

          {/* BARRA DE ACCIONES INFERIOR */}
          <div
            style={{
              padding: '8px 14px',
              background: 'var(--panel-inset-bg)',
              borderTop: 'var(--border-thick) solid var(--panel-border-outer)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <button
                type="button"
                className={`tactile-btn-dark ${userVote === 'LIKE' ? 'active-state' : ''}`}
                style={{ padding: '6px 11px', fontSize: '0.76rem' }}
                onClick={() => {
                  soundManager.playClick();
                  onVote(game.id, 'LIKE');
                }}
                title="Me gusta"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
                <span>{game.likes + (userVote === 'LIKE' ? 1 : 0)}</span>
              </button>

              <button
                type="button"
                className={`tactile-btn-dark ${userVote === 'DISLIKE' ? 'active-state' : ''}`}
                style={{ padding: '6px 11px', fontSize: '0.76rem' }}
                onClick={() => {
                  soundManager.playClick();
                  onVote(game.id, 'DISLIKE');
                }}
                title="No me gusta"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                </svg>
                <span>{game.dislikes + (userVote === 'DISLIKE' ? 1 : 0)}</span>
              </button>

              <button
                type="button"
                className={`tactile-btn-dark ${isFavorite ? 'active-state' : ''}`}
                style={{ padding: '6px 11px', fontSize: '0.76rem' }}
                onClick={() => {
                  soundManager.playClick();
                  onToggleFavorite(game.id);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.3">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{isFavorite ? 'Favorito' : 'Guardar'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', position: 'relative' }}>
              {/* BOTÓN "FIJAR" EXCLUSIVO DEL MODO EXPLORACIÓN + POPUP DE PRIMERA VEZ */}
              {isExplorationMode && (
                <div style={{ position: 'relative' }}>
                  {showPinFirstTimeHint && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--primary-mid)',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        fontSize: '0.68rem',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                        zIndex: 40,
                      }}
                    >
                      Bloquea el arrastre del mapa mientras juegas
                    </div>
                  )}

                  <button
                    type="button"
                    className={`tactile-btn-dark ${isCameraPinned ? 'active-state' : ''}`}
                    style={{ padding: '6px 11px', fontSize: '0.76rem' }}
                    onClick={handlePinClick}
                    title="Fijar cámara para no mover el mapa por accidente"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isCameraPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.3">
                      <line x1="12" y1="17" x2="12" y2="22" />
                      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                    </svg>
                    <span>{isCameraPinned ? 'Fijado' : 'Fijar'}</span>
                  </button>
                </div>
              )}

              {game.hasRanked && (
                <button
                  type="button"
                  className={`tactile-btn-dark ${isRankedOpen ? 'active-state' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                  onClick={() => {
                    soundManager.playClick();
                    setIsRankedOpen((prev) => !prev);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                  <span>Ranked</span>
                </button>
              )}

              <button
                type="button"
                className="tactile-btn-purple"
                style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                onClick={toggleFullscreen}
                title="Pantalla Completa (Atajo: Alt + Enter)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span>Pantalla Completa (Alt+Enter)</span>
              </button>

              {/* Botón de Cerrar con símbolo X SVG */}
              <button
                type="button"
                className="icon-close-x-btn"
                onClick={handleHardClose}
                title="Cerrar Juego (ESC)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* PANEL RANKED LATERAL QUE EMPUJA DE DERECHA A IZQUIERDA */}
        <aside className={`gameviewer-ranked-push-drawer ${isRankedOpen ? 'open' : ''}`}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.88rem', color: 'var(--accent-gold)' }}>TOP 5 RANKED</h4>
              <button
                type="button"
                className="icon-close-x-btn"
                style={{ width: '26px', height: '26px' }}
                onClick={() => setIsRankedOpen(false)}
                title="Cerrar Ranked"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {DEFAULT_LEADERBOARD.map((entry, idx) => (
                <div
                  key={entry.player}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--panel-card-bg)',
                    border: '2px solid var(--panel-border-outer)',
                    padding: '6px 9px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    color: 'var(--text-main)',
                  }}
                >
                  <span>
                    <strong style={{ color: 'var(--accent-gold)', marginRight: 5 }}>#{idx + 1}</strong>
                    {entry.player}
                  </span>
                  <strong style={{ color: 'var(--primary-mid)' }}>{entry.score}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'center' }}>
            Clasificación oficial sincronizada
          </div>
        </aside>
      </div>
    </div>
  );
};