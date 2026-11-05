import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  type Game,
  FALLBACK_GAMES,
  DEFAULT_LEADERBOARD,
  fetchCatalogGames,
} from '../data/gamesData';
import { RufflePlayer } from '../components/RufflePlayer';

const DVD_COLORS = ['#9d4edd', '#38b6ff', '#ffb703', '#2ec4b6', '#f72585'];

export const GameViewerView: React.FC = () => {
  const { alias } = useParams<{ alias: string }>();
  const navigate = useNavigate();
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [game, setGame] = useState<Game>(
    FALLBACK_GAMES.find((g) => g.alias === alias) || FALLBACK_GAMES[0]
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isControlBarHidden, setIsControlBarHidden] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  const [likes, setLikes] = useState<number>(game.likes);
  const [dislikes, setDislikes] = useState<number>(game.dislikes);
  const [userVote, setUserVote] = useState<'LIKE' | 'DISLIKE' | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [lastMatchScore, setLastMatchScore] = useState<number | null>(null);

  const [dvdPos, setDvdPos] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [dvdColorIdx, setDvdColorIdx] = useState<number>(0);
  const dvdVelRef = useRef<{ vx: number; vy: number }>({ vx: 2.3, vy: 1.85 });

  useEffect(() => {
    setIsPlaying(false);
    fetchCatalogGames().then((list) => {
      const found = list.find((g) => g.alias === alias) || list[0];
      if (found) {
        setGame(found);
        setLikes(found.likes);
        setDislikes(found.dislikes);
      }
    });
  }, [alias]);

  useEffect(() => {
    if (isPlaying) return;
    const badgeWidth = 135;
    const badgeHeight = 58;

    const interval = window.setInterval(() => {
      const box = stageRef.current;
      if (!box) return;
      const maxX = Math.max(20, box.clientWidth - badgeWidth);
      const maxY = Math.max(20, box.clientHeight - badgeHeight);

      setDvdPos((prev) => {
        let nextX = prev.x + dvdVelRef.current.vx;
        let nextY = prev.y + dvdVelRef.current.vy;
        let bounced = false;

        if (nextX <= 0 || nextX >= maxX) {
          dvdVelRef.current.vx *= -1;
          nextX = Math.max(0, Math.min(maxX, nextX));
          bounced = true;
        }
        if (nextY <= 0 || nextY >= maxY) {
          dvdVelRef.current.vy *= -1;
          nextY = Math.max(0, Math.min(maxY, nextY));
          bounced = true;
        }
        if (bounced) {
          setDvdColorIdx((c) => (c + 1) % DVD_COLORS.length);
        }
        return { x: nextX, y: nextY };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const handleGodotMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GAME_OVER') {
        const score = Number(event.data.score || 0);
        setLastMatchScore(score);
        setIsControlBarHidden(false);
      }
    };
    window.addEventListener('message', handleGodotMessage);
    return () => window.removeEventListener('message', handleGodotMessage);
  }, []);

  const handleStartGame = () => {
    setIsPlaying(true);
    setIsControlBarHidden(true);
  };

  const handleVote = (type: 'LIKE' | 'DISLIKE') => {
    if (userVote === type) {
      setUserVote(null);
      if (type === 'LIKE') setLikes((l) => l - 1);
      else setDislikes((d) => d - 1);
      return;
    }
    if (type === 'LIKE') {
      if (userVote === 'DISLIKE') setDislikes((d) => d - 1);
      setLikes((l) => l + 1);
    } else {
      if (userVote === 'LIKE') setLikes((l) => l - 1);
      setDislikes((d) => d + 1);
    }
    setUserVote(type);
  };

  const handleFullscreen = () => {
    if (!stageRef.current) return;
    if (!document.fullscreenElement) {
      stageRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const activeUrl = game.gameUrl || '/game-export/index.html';
  const isFlashSwf = game.tipo === 'FLASH' || activeUrl.toLowerCase().endsWith('.swf');

  return (
    <div className="gameviewer-stage-container">
      <div className="gameviewer-iframe-box" ref={stageRef}>
        {!isPlaying ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              backgroundImage: `linear-gradient(180deg, rgba(16,12,28,0.62) 0%, rgba(16,12,28,0.94) 100%), url(${game.coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              padding: '24px',
              textAlign: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Icono del juego rebotando tipo DVD */}
            <div
              style={{
                position: 'absolute',
                left: `${dvdPos.x}px`,
                top: `${dvdPos.y}px`,
                width: '130px',
                height: '54px',
                borderRadius: '14px',
                background: DVD_COLORS[dvdColorIdx],
                border: '2px solid rgba(255,255,255,0.45)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.78rem',
                pointerEvents: 'none',
                opacity: 0.85,
                zIndex: 1,
                transition: 'background-color 0.25s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <rect x="2" y="6" width="20" height="12" rx="4" />
                <path d="M6 12h4m-2-2v4" />
                <circle cx="15" cy="11" r="1" fill="currentColor" />
                <circle cx="18" cy="13" r="1" fill="currentColor" />
              </svg>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
                {game.title.split(' ')[0]}
              </span>
            </div>

            <div className="tactile-panel" style={{ padding: '16px 38px', zIndex: 2}}>
              <h1 style={{ fontSize: '2.05rem', fontWeight: 900,color: 'var(--text-main)' }}>{game.title}</h1>
            </div>

            <button
              type="button"
              className="tactile-btn-purple"
              onClick={handleStartGame}
              style={{ padding: '16px 42px', fontSize: '1.15rem', borderRadius: '16px', zIndex: 2 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{isFlashSwf ? 'EJECUTAR CON RUFFLE' : 'JUGAR AHORA'}</span>
            </button>
          </div>
        ) : isFlashSwf ? (
          /* Si es un juego Flash (.swf), monta nuestro componente modular RufflePlayer */
          <RufflePlayer swfUrl={activeUrl} />
        ) : (
          /* Si es HTML5 / Godot / Chess College en Render, lo abre en el iframe */
          <iframe
            src={activeUrl}
            title={game.title}
            width="100%"
            height="100%"
            style={{ border: 'none', background: '#000' }}
            allowFullScreen
          />
        )}

        {/* PANEL DE INFO HORIZONTAL */}
        {isInfoOpen && (
          <aside
            className="tactile-panel gameviewer-info-overlay"
            style={{
              position: 'absolute',
              left: 18,
              right: 18,
              bottom: 18,
              maxWidth: '860px',
              maxHeight: 'calc(100% - 36px)',
              padding: '20px 24px',
              zIndex: 30,
              display: 'grid',
              gridTemplateColumns: '1.35fr 1fr',
              gap: '22px',
              overflowY: 'auto',
              animation: 'jellyPop 0.25s var(--ease-squish) forwards',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>{game.title}</h3>
                <span
                  style={{
                    background: 'var(--primary-mid)',
                    color: '#ffffff',
                    padding: '2px 9px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                  }}
                >
                  {game.ageRating}
                </span>
                {game.categories.map((c) => (
                  <span
                    key={c}
                    style={{
                      background: 'var(--panel-inset-bg)',
                      padding: '2px 9px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-soft)',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-soft)', lineHeight: 1.45 }}>
                {game.description}
              </p>

              <div
                style={{
                  background: 'var(--panel-inset-bg)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  borderLeft: '4px solid var(--primary-top)',
                  fontSize: '0.82rem',
                }}
              >
                <strong>Controles:</strong> {game.controls}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                  TOP 5 RANKED
                </h4>
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(false)}
                  style={{
                    background: 'var(--panel-inset-bg)',
                    border: '1px solid var(--panel-border-outer)',
                    color: 'var(--text-main)',
                    borderRadius: '8px',
                    padding: '3px 9px',
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {DEFAULT_LEADERBOARD.slice(0, 5).map((entry, idx) => (
                  <div
                    key={entry.player}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      background: 'var(--panel-card-bg)',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span>
                      <strong>#{idx + 1}</strong> {entry.player}
                    </span>
                    <span style={{ color: 'var(--primary-mid)', fontWeight: 800 }}>
                      {entry.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {isPlaying && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-6px' }}>
          <button
            type="button"
            className="tactile-btn-dark"
            onClick={() => setIsControlBarHidden((prev) => !prev)}
            style={{ padding: '4px 16px', borderRadius: '99px', fontSize: '0.74rem' }}
          >
            {isControlBarHidden ? '▲ Mostrar barra inferior' : '▼ Ocultar barra inferior'}
          </button>
        </div>
      )}

      {!isControlBarHidden && (
        <div className="youtube-style-controlbar tactile-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className={`tactile-btn-dark ${isInfoOpen ? 'active-state' : ''}`}
              onClick={() => setIsInfoOpen((prev) => !prev)}
              style={{ padding: '8px 14px', fontSize: '0.84rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Info</span>
            </button>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900 }}>{game.title}</h2>
              {lastMatchScore !== null && (
                <span style={{ fontSize: '0.76rem', color: 'var(--accent-gold)', fontWeight: 800 }}>
                  Último puntaje: {lastMatchScore} pts
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className={`tactile-btn-dark ${userVote === 'LIKE' ? 'active-state' : ''}`}
              onClick={() => handleVote('LIKE')}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              <span>{likes}</span>
            </button>

            <button
              type="button"
              className={`tactile-btn-dark ${userVote === 'DISLIKE' ? 'active-state' : ''}`}
              onClick={() => handleVote('DISLIKE')}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
              </svg>
              <span>{dislikes}</span>
            </button>

            <button
              type="button"
              className={`tactile-btn-dark ${isFavorite ? 'active-state' : ''}`}
              onClick={() => setIsFavorite((prev) => !prev)}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{isFavorite ? 'Guardado' : 'Guardar'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="tactile-btn-dark"
              onClick={() => navigate('/games')}
              style={{ padding: '8px 14px', fontSize: '0.84rem' }}
            >
              Catálogo
            </button>

            <button
              type="button"
              className="tactile-btn-purple"
              onClick={handleFullscreen}
              style={{ padding: '8px 12px' }}
              title="Pantalla Completa"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};