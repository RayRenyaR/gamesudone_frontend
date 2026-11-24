import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type Game, DEFAULT_LEADERBOARD, slugifyGameAlias } from '../data/gamesData';
import { RufflePlayer, killGlobalRuffleInstance } from './RufflePlayer';
import { Confirm3dsModal } from './3dsConfirmModal';
import { soundManager } from '../data/audioConfig';
import {
  type ViewerAdTrigger,
  shouldShowPreRollMock,
  shouldShowPostRollMock,
} from '../data/adSlotsData';
import { GameViewerAdOverlay } from './GameViewerAdOverlay';

interface GameViewerStageProps {
  game: Game;
  isFavorite: boolean;
  userVote?: 'LIKE' | 'DISLIKE';
  isExplorationMode?: boolean;
  isCameraPinned?: boolean;
  onTogglePinCamera?: () => void;
  onAutoPinOnPlay?: () => void;
  onToggleFavorite: (gameId: number) => void;
  onVote: (gameId: number, type: 'LIKE' | 'DISLIKE') => void;
  onClose: () => void;
  onPlayingChange?: (playing: boolean) => void;
  onAdActiveChange?: (adActive: boolean) => void;
}

export const GameViewerStage: React.FC<GameViewerStageProps> = ({
  game,
  isFavorite,
  userVote,
  isExplorationMode = false,
  isCameraPinned = false,
  onTogglePinCamera,
  onAutoPinOnPlay,
  onToggleFavorite,
  onVote,
  onClose,
  onPlayingChange,
  onAdActiveChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRankedOpen, setIsRankedOpen] = useState<boolean>(false);
  const [show3dsClosePrompt, setShow3dsClosePrompt] = useState<boolean>(false);
  const [activeAdTrigger, setActiveAdTrigger] = useState<ViewerAdTrigger | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showPinFirstTimeHint, setShowPinFirstTimeHint] = useState<boolean>(() => {
    return localStorage.getItem('udo_pin_hint_seen') !== 'true';
  });

  const resolvedAlias = game.alias || slugifyGameAlias(game.title, game.id);
  const shareUrl = `${window.location.origin}/juego/${resolvedAlias}`;
  const activeUrl = game.gameUrl || '/game-export/index.html';
  const isFlashSwf = game.tipo === 'FLASH' || activeUrl.toLowerCase().endsWith('.swf');

  // avisa al catalogo si hay un anuncio activo para bloquear el movimiento del mapa
    useEffect(() => {
      const hasActiveAd = activeAdTrigger !== null;
      onAdActiveChange?.(hasActiveAd);

      return () => {
        if (hasActiveAd) {
          onAdActiveChange?.(false);
        }
      };
    }, [activeAdTrigger, onAdActiveChange]);

  const emitPlayingState = useCallback((playing: boolean) => {
    window.dispatchEvent(
      new CustomEvent('udo_game_playing_state', { detail: { playing } })
    );
  }, []);

  const teardownRunningGame = useCallback(() => {
    killGlobalRuffleInstance();
    if (iframeRef.current) {
      try {
        iframeRef.current.src = 'about:blank';
      } catch {
        // ignora si ya fue desmontado
      }
    }
  }, []);

  // inicia la sesion del juego una vez superado el posible pre-roll
  const launchGameRuntime = useCallback(() => {
    setActiveAdTrigger(null);
    setShow3dsClosePrompt(false);
    setIsPlaying(true);
    onPlayingChange?.(true);
    emitPlayingState(true);

    if (isExplorationMode) {
      onAutoPinOnPlay?.();
    }
  }, [emitPlayingState, isExplorationMode, onAutoPinOnPlay, onPlayingChange]);

  // finaliza el cierre del visor tras el posible post-roll
  const finalizeCloseViewer = useCallback(() => {
    setActiveAdTrigger(null);
    setIsRankedOpen(false);
    onPlayingChange?.(false);
    emitPlayingState(false);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    onClose();
  }, [emitPlayingState, onClose, onPlayingChange]);

  // caso 1: anuncio al inicio (pre-roll) antes de cargar el juego
  const handleStartGame = () => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    soundManager.playOpen();
    setShow3dsClosePrompt(false);

    if (shouldShowPreRollMock(false)) {
      emitPlayingState(true);
      setActiveAdTrigger('pre-roll');
      return;
    }

    launchGameRuntime();
  };

  // caso 2: anuncio al cerrar (post-roll) despues de matar el audio del juego
  const executeImmediateClose = useCallback(() => {
    soundManager.playClose();
    setShow3dsClosePrompt(false);
    const wasPlaying = isPlaying;
    teardownRunningGame();
    setIsPlaying(false);

    if (wasPlaying && shouldShowPostRollMock(false)) {
      setActiveAdTrigger('post-roll');
      return;
    }

    finalizeCloseViewer();
  }, [finalizeCloseViewer, isPlaying, teardownRunningGame]);

  // resuelve lo que ocurre al terminar cualquiera de los 3 slots de anuncio
  const handleAdCompleted = useCallback(
    (completed: boolean) => {
      const currentTrigger = activeAdTrigger;
      setActiveAdTrigger(null);

      if (currentTrigger === 'pre-roll') {
        launchGameRuntime();
        return;
      }

      if (currentTrigger === 'post-roll') {
        finalizeCloseViewer();
        return;
      }

      // caso 3: devuelve el resultado al iframe del juego (godot/html5)
      if (currentTrigger === 'in-game-request' && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'AD_RESULT', completed },
          '*'
        );
      }
    },
    [activeAdTrigger, finalizeCloseViewer, launchGameRuntime]
  );


  const requestCloseViewer = useCallback(() => {
    if (activeAdTrigger) return;
    if (isPlaying) {
      soundManager.playClick();
      setShow3dsClosePrompt(true);
      return;
    }
    executeImmediateClose();
  }, [executeImmediateClose, isPlaying, activeAdTrigger]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    soundManager.playClick();
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleCopyShareLink = useCallback(() => {
    soundManager.playClick();

    const markCopied = () => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard
        .writeText(shareUrl)
        .then(markCopied)
        .catch(() => {
          window.prompt('Copia el enlace del juego:', shareUrl);
        });
    } else {
      window.prompt('Copia el enlace del juego:', shareUrl);
    }
  }, [shareUrl]);

  

  const handlePinClick = () => {
    if (activeAdTrigger) return;
    soundManager.playClick();
    if (showPinFirstTimeHint) {
      setShowPinFirstTimeHint(false);
      localStorage.setItem('udo_pin_hint_seen', 'true');
    }
    onTogglePinCamera?.();
  };

  useEffect(() => {
    setIsPlaying(false);
    setIsRankedOpen(false);
    setShow3dsClosePrompt(false);
    setCopiedLink(false);
    onPlayingChange?.(false);
    emitPlayingState(false);

    return () => {
      teardownRunningGame();
      emitPlayingState(false);
    };
  }, [game.id, emitPlayingState, onPlayingChange, teardownRunningGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeAdTrigger) {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
              }
              return;
      }

      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (show3dsClosePrompt) {
          setShow3dsClosePrompt(false);
          return;
        }
        requestCloseViewer();
      }
    };

    const handleFrameMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UDO_GAME_CLOSE') {
        requestCloseViewer();
      } else if (event.data?.type === 'UDO_GAME_FULLSCREEN') {
        toggleFullscreen();
      } else if (event.data?.type === 'REQUEST_AD' && !isFlashSwf && isPlaying) {
        setActiveAdTrigger('in-game-request');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('message', handleFrameMessage);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('message', handleFrameMessage);
    };
  }, [requestCloseViewer, show3dsClosePrompt, toggleFullscreen, isFlashSwf, isPlaying, activeAdTrigger]);

  return (
    <div
      ref={containerRef}
      className={`game-bevel-card gameviewer-shell ${
        isPlaying ? 'is-playing-expanded' : ''
      } ${isFavorite ? 'is-favorite-card' : ''}`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {show3dsClosePrompt && (
        <Confirm3dsModal
          badgeText="SALIR DEL SOFTWARE"
          title={`Cerrar ${game.title}`}
          description="Se cerrara la partida actual y se liberara su audio. Los datos no guardados se perderan."
          confirmLabel="Cerrar"
          cancelLabel="Cancelar"
          onConfirm={executeImmediateClose}
          onCancel={() => {
            soundManager.playClick();
            setShow3dsClosePrompt(false);
          }}
        />
      )}

      {activeAdTrigger && (
        <GameViewerAdOverlay
          trigger={activeAdTrigger}
          gameTitle={game.title}
          onComplete={handleAdCompleted}
        />
      )}

      {copiedLink && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 115,
            background: 'rgba(8, 4, 18, 0.52)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            pointerEvents: 'none',
          }}
        >
          <div
            className="tactile-panel"
            style={{
              padding: '16px 24px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderColor: 'var(--accent-gold)',
              animation: 'jellyPop 0.22s var(--ease-squish) forwards',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-gold)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Link copiado!
            </span>
          </div>
        </div>
      )}

      <div className="gameviewer-body-split">
        <div className="gameviewer-left-stage">
          {!isPlaying ? (
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
                  onClick={handleStartGame}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>JUGAR AHORA</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, width: '100%', height: '100%', minHeight: '320px', backgroundColor: '#000000', position: 'relative' }}>
              {isFlashSwf ? (
                <RufflePlayer swfUrl={activeUrl} />
              ) : (
                <iframe
                  ref={iframeRef}
                  data-game-runtime="true"
                  src={activeUrl}
                  title={game.title}
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  allowFullScreen
                />
              )}
            </div>
          )}

          <div
            style={{
              padding: '8px 14px',
              background: 'var(--panel-inset-bg)',
              borderTop: 'var(--border-thick) solid var(--panel-border-outer)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'nowrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                className={`tactile-btn-dark ${userVote === 'LIKE' ? 'active-state' : ''}`}
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
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
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
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
                style={{ width: '34px', height: '32px', padding: 0 }}
                onClick={() => {
                  soundManager.playClick();
                  onToggleFavorite(game.id);
                }}
                title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.3">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>

              <button
                type="button"
                className={`tactile-btn-dark ${copiedLink ? 'active-state' : ''}`}
                style={{ width: '34px', height: '32px', padding: 0 }}
                onClick={handleCopyShareLink}
                title={copiedLink ? 'Enlace copiado' : `Copiar enlace (${shareUrl})`}
                aria-label="Compartir juego"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', flexShrink: 0 }}>
              {isExplorationMode && (
                <div style={{ position: 'relative' }}>
                  {showPinFirstTimeHint && !isCameraPinned && (
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
                    style={{ width: '34px', height: '32px', padding: 0 }}
                    onClick={handlePinClick}
                    title={isCameraPinned ? 'Desfijar camara' : 'Fijar camara para no mover el mapa'}
                    aria-label="Fijar camara"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={isCameraPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.3">
                      <line x1="12" y1="17" x2="12" y2="22" />
                      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                    </svg>
                  </button>
                </div>
              )}

              {game.hasRanked && (
                <button
                  type="button"
                  className={`tactile-btn-dark ${isRankedOpen ? 'active-state' : ''}`}
                  style={{ width: '34px', height: '32px', padding: 0 }}
                  onClick={() => {
                    soundManager.playClick();
                    setIsRankedOpen((prev) => !prev);
                  }}
                  title="Clasificacion Ranked"
                  aria-label="Ranked"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                className="tactile-btn-purple"
                style={{ width: '34px', height: '32px', padding: 0 }}
                onClick={toggleFullscreen}
                title="Pantalla Completa (Alt + Enter)"
                aria-label="Pantalla Completa"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>

              <button
                type="button"
                className="icon-close-x-btn"
                style={{ width: '32px', height: '32px' }}
                onClick={requestCloseViewer}
                title="Cerrar Juego (ESC)"
                aria-label="Cerrar Juego"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

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