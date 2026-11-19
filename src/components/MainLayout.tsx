import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { PLAYLIST_TRACKS, soundManager } from '../data/audioConfig';
import '../pages/CatalogStyles.css';

export type ThemeId = 'friv2';

interface GeneralChatMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
}

const formatAudioTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [lowSpecMode, setLowSpecMode] = useState<boolean>(() => {
    return localStorage.getItem('udo_low_spec') === 'true';
  });

  const [allowKeyboardGamesOnMobile, setAllowKeyboardGamesOnMobile] = useState<boolean>(() => {
    return localStorage.getItem('udo_bt_controller') === 'true';
  });

  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => {
    return localStorage.getItem('udo_sfx_enabled') !== 'false';
  });
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => {
    return localStorage.getItem('udo_music_enabled') !== 'false';
  });
  const [trackIndex, setTrackIndex] = useState<number>(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [pausedByGame, setPausedByGame] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const [isUserPodOpen, setIsUserPodOpen] = useState<boolean>(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);

  const userLevel = 7;
  const userCurrentXp = 680;
  const userNextLevelXp = 1000;
  const userXpPercent = Math.round((userCurrentXp / userNextLevelXp) * 100);

  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<GeneralChatMessage[]>([
    { id: 1, sender: 'laura_gamer', text: '¡Las conexiones tipo grafo entre juegos se ven increíbles!', time: '16:10' },
    { id: 2, sender: 'Ruben_Dev', text: 'Puedes arrastrar los juegos en el modo exploración.', time: '16:12' },
    { id: 3, sender: 'Nicolas_Lider', text: 'El borde de la barra lateral ahora divide limpio a la derecha.', time: '16:15' },
  ]);

  const currentTrack = PLAYLIST_TRACKS[trackIndex % PLAYLIST_TRACKS.length];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'friv2');
    localStorage.setItem('udo_theme', 'friv2');
  }, []);

  useEffect(() => {
    localStorage.setItem('udo_low_spec', String(lowSpecMode));
  }, [lowSpecMode]);

  useEffect(() => {
    localStorage.setItem('udo_bt_controller', String(allowKeyboardGamesOnMobile));
    window.dispatchEvent(new Event('udo_prefs_updated'));
  }, [allowKeyboardGamesOnMobile]);

  useEffect(() => {
    soundManager.setSfxEnabled(sfxEnabled);
  }, [sfxEnabled]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('udo_chat_state', { detail: { open: isChatDrawerOpen } })
    );
  }, [isChatDrawerOpen]);

  useEffect(() => {
    const handleGamePlaying = (e: Event) => {
      const custom = e as CustomEvent<{ playing: boolean }>;
      const gameIsRunning = Boolean(custom.detail?.playing);
      setPausedByGame(gameIsRunning);

      if (gameIsRunning && audioRef.current) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else if (!gameIsRunning && musicEnabled && audioRef.current) {
        audioRef.current
          .play()
          .then(() => setIsMusicPlaying(true))
          .catch(() => {});
      }
    };

    window.addEventListener('udo_game_playing_state', handleGamePlaying);
    return () => window.removeEventListener('udo_game_playing_state', handleGamePlaying);
  }, [musicEnabled]);

  useEffect(() => {
    const unlockAudioOnFirstClick = () => {
      if (musicEnabled && !pausedByGame && audioRef.current && audioRef.current.paused) {
        audioRef.current
          .play()
          .then(() => setIsMusicPlaying(true))
          .catch(() => {});
      }
      window.removeEventListener('click', unlockAudioOnFirstClick);
    };
    window.addEventListener('click', unlockAudioOnFirstClick);
    return () => window.removeEventListener('click', unlockAudioOnFirstClick);
  }, [musicEnabled, pausedByGame]);

  const handleToggleMusicSwitch = () => {
    soundManager.playClick();
    setMusicEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('udo_music_enabled', String(next));
      if (!next && audioRef.current) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else if (next && !pausedByGame && audioRef.current) {
        audioRef.current
          .play()
          .then(() => setIsMusicPlaying(true))
          .catch(() => {});
      }
      return next;
    });
  };

  const handlePlayPauseButton = () => {
    soundManager.playClick();
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      if (!musicEnabled) {
        setMusicEnabled(true);
        localStorage.setItem('udo_music_enabled', 'true');
      }
      audioRef.current
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => {});
    }
  };

  const handleNextTrack = () => {
    soundManager.playClick();
    setTrackIndex((prev) => (prev + 1) % PLAYLIST_TRACKS.length);
    setTimeout(() => {
      if (musicEnabled && !pausedByGame && audioRef.current) {
        audioRef.current
          .play()
          .then(() => setIsMusicPlaying(true))
          .catch(() => {});
      }
    }, 60);
  };

  const handlePrevTrack = () => {
    soundManager.playClick();
    setTrackIndex((prev) => (prev - 1 + PLAYLIST_TRACKS.length) % PLAYLIST_TRACKS.length);
    setTimeout(() => {
      if (musicEnabled && !pausedByGame && audioRef.current) {
        audioRef.current
          .play()
          .then(() => setIsMusicPlaying(true))
          .catch(() => {});
      }
    }, 60);
  };

  const handleSeekSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    soundManager.playClick();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'Rayner_UDO',
        text: chatInput.trim(),
        time: timeStr,
      },
    ]);
    setChatInput('');
  };

  return (
    <div className={`y2k-app-shell ${lowSpecMode ? 'low-spec-mode' : ''}`}>
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={handleNextTrack}
      />

      {/* 1. FONDO GLOBAL */}
      <div className="lava-lamp-container" aria-hidden="true">
        <svg
          className="ghost-fibers-svg"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path d="M-100 180 C 320 420, 720 -80, 1540 240" stroke="var(--fiber-line-1)" strokeWidth="3.5" />
          <path d="M-100 340 C 420 80, 880 580, 1540 190" stroke="var(--fiber-line-2)" strokeWidth="2.5" />
          <path d="M-100 620 C 380 320, 920 820, 1540 480" stroke="var(--fiber-line-1)" strokeWidth="4" />
          <path d="M-100 760 C 520 640, 760 220, 1540 720" stroke="var(--fiber-line-2)" strokeWidth="2" />
        </svg>
        <div className="lava-blob blob-1" />
        <div className="lava-blob blob-2" />
      </div>

      {/* 2. SIDEBAR IZQUIERDA: RELLENO SIN BORDE + LÍNEA DE CONTORNO EXCLUSIVA A LA DERECHA */}
      <aside className="y2k-left-sidebar" aria-label="Navegación Principal">
        <svg
          className="sidebar-svg-bg"
          viewBox="0 0 92 1000"
          preserveAspectRatio="none"
        >
          {/* Relleno del panel sin contorno en arriba, abajo ni izquierda */}
          <path
            d="M 0,0 L 90,0 L 90,104 L 66,142 L 66,858 L 90,896 L 90,1000 L 0,1000 Z"
            fill="var(--panel-base)"
            stroke="none"
          />
          {/* Contorno coloreado ÚNICAMENTE en el borde derecho y sus diagonales */}
          <path
            d="M 90,0 L 90,104 L 66,142 L 66,858 L 90,896 L 90,1000"
            fill="none"
            stroke="var(--panel-border-outer)"
            strokeWidth="3.5"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>

        <div className="sidebar-top-zone">
          <div
            className="sidebar-orb-logo"
            onClick={() => {
              soundManager.playClick();
              navigate('/');
            }}
            title="Inicio — Catálogo de Juegos"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <rect x="2" y="6" width="20" height="12" rx="4" />
              <path d="M6 12h4m-2-2v4" />
              <circle cx="15" cy="11" r="1.2" fill="currentColor" />
              <circle cx="18" cy="13" r="1.2" fill="currentColor" />
            </svg>
          </div>
        </div>

        <nav className="sidebar-middle-zone">
          <NavLink
            to="/"
            end
            onClick={() => soundManager.playClick()}
            onMouseEnter={() => soundManager.playHover()}
            className={({ isActive }) => `sidebar-nav-btn ${isActive ? 'active' : ''}`}
            title="Juegos"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <rect x="3" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="14" width="7" height="7" rx="2" />
              <rect x="3" y="14" width="7" height="7" rx="2" />
            </svg>
          </NavLink>

          <NavLink
            to="/kaik"
            onClick={() => soundManager.playClick()}
            onMouseEnter={() => soundManager.playHover()}
            className={({ isActive }) => `sidebar-nav-btn ${isActive ? 'active' : ''}`}
            title="Santuario Kaik"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M12 2C7.5 2 4 7.5 4 13a8 8 0 0 0 16 0c0-5.5-3.5-11-8-11Z" />
              <path d="M9 14s1.5 2 3 2 3-2 3-2" />
            </svg>
          </NavLink>

          <NavLink
            to="/avatar"
            onClick={() => soundManager.playClick()}
            onMouseEnter={() => soundManager.playHover()}
            className={({ isActive }) => `sidebar-nav-btn ${isActive ? 'active' : ''}`}
            title="Estudio de Avatar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <circle cx="12" cy="8" r="4.5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
          </NavLink>

          <button
            type="button"
            className="sidebar-nav-btn"
            onMouseEnter={() => soundManager.playHover()}
            onClick={() => {
              soundManager.playClick();
              alert('Módulo de Foro Comunitario (Grupo Cyan)');
            }}
            title="Foro Comunitario"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </button>

          <button
            type="button"
            className="sidebar-nav-btn"
            onMouseEnter={() => soundManager.playHover()}
            onClick={() => {
              soundManager.playClick();
              alert('Módulo de Tienda, Pase de Batalla y Gacha');
            }}
            title="Tienda y Gacha"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </button>

          <NavLink
            to="/credits"
            onClick={() => soundManager.playClick()}
            onMouseEnter={() => soundManager.playHover()}
            className={({ isActive }) => `sidebar-nav-btn ${isActive ? 'active' : ''}`}
            title="Créditos"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </NavLink>
        </nav>

        <div className="sidebar-bottom-zone">
          <button
            type="button"
            className={`sidebar-nav-btn ${isUserPodOpen ? 'active' : ''}`}
            onMouseEnter={() => soundManager.playHover()}
            onClick={() => {
              soundManager.playClick();
              setIsUserPodOpen((prev) => !prev);
            }}
            title="Configuración y Audio"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </aside>

      {/* POPUP DE CONFIGURACIÓN */}
      {isUserPodOpen && (
        <div className="tactile-panel sidebar-settings-popover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                onClick={() => {
                  soundManager.playClick();
                  setIsUserPodOpen(false);
                  navigate('/avatar');
                }}
                title="Cambiar Avatar"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px 3px 12px 3px',
                  background: 'linear-gradient(135deg, var(--primary-top), var(--primary-bot))',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="8" r="4.5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
              </div>

              <div>
                <div style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Rayner_UDO</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--accent-gold)' }}>
                  Nivel {userLevel} — {userCurrentXp}/{userNextLevelXp} XP
                </div>
              </div>
            </div>

            <button
              type="button"
              className="icon-close-x-btn"
              onClick={() => {
                soundManager.playClose();
                setIsUserPodOpen(false);
              }}
              title="Cerrar configuración"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="xp-progress-track">
            <div className="xp-progress-fill" style={{ width: `${userXpPercent}%` }} />
          </div>

          <div className="music-player-pod">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentTrack.title}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>
                  {pausedByGame ? 'En pausa (Juego en curso)' : currentTrack.artist}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  type="button"
                  className="tactile-btn-dark"
                  style={{ width: '28px', height: '28px', padding: 0 }}
                  onClick={handlePrevTrack}
                  title="Anterior pista"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="19 20 9 12 19 4 19 20" />
                    <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="3" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="tactile-btn-purple"
                  style={{ width: '32px', height: '28px', padding: 0 }}
                  onClick={handlePlayPauseButton}
                  title={isMusicPlaying ? 'Pausar música' : 'Reproducir música'}
                >
                  {isMusicPlaying ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  className="tactile-btn-dark"
                  style={{ width: '28px', height: '28px', padding: 0 }}
                  onClick={handleNextTrack}
                  title="Siguiente pista"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="3" />
                  </svg>
                </button>
              </div>
            </div>

            <input
              type="range"
              className="music-range-slider"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekSlider}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-soft)' }}>
              <span>{formatAudioTime(currentTime)}</span>
              <span>{formatAudioTime(duration)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
              className="y2k-toggle-row"
              onClick={handleToggleMusicSwitch}
              role="switch"
              aria-checked={musicEnabled}
            >
              <span>Música de Fondo</span>
              <div className={`y2k-switch-pill ${musicEnabled ? 'checked' : ''}`}>
                <div className="y2k-switch-thumb" />
              </div>
            </div>

            <div
              className="y2k-toggle-row"
              onClick={() => {
                const next = !sfxEnabled;
                setSfxEnabled(next);
                soundManager.setSfxEnabled(next);
                if (next) soundManager.playClick();
              }}
              role="switch"
              aria-checked={sfxEnabled}
            >
              <span>Sonidos de Interfaz</span>
              <div className={`y2k-switch-pill ${sfxEnabled ? 'checked' : ''}`}>
                <div className="y2k-switch-thumb" />
              </div>
            </div>

            <div
              className="y2k-toggle-row"
              onClick={() => {
                soundManager.playClick();
                setLowSpecMode((prev) => !prev);
              }}
              role="switch"
              aria-checked={lowSpecMode}
            >
              <span>Modo Bajo Rendimiento</span>
              <div className={`y2k-switch-pill ${lowSpecMode ? 'checked' : ''}`}>
                <div className="y2k-switch-thumb" />
              </div>
            </div>

            <div
              className="y2k-toggle-row"
              onClick={() => {
                soundManager.playClick();
                setAllowKeyboardGamesOnMobile((prev) => !prev);
              }}
              role="switch"
              aria-checked={allowKeyboardGamesOnMobile}
            >
              <span>Juegos de Teclado en Móvil</span>
              <div className={`y2k-switch-pill ${allowKeyboardGamesOnMobile ? 'checked' : ''}`}>
                <div className="y2k-switch-thumb" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="tactile-btn-dark"
              style={{ flex: 1, padding: '7px', fontSize: '0.75rem' }}
              onClick={() => {
                soundManager.playClick();
                setIsUserPodOpen(false);
                navigate('/avatar');
              }}
            >
              Editar Avatar
            </button>
            <button
              type="button"
              className="tactile-btn-dark"
              style={{ flex: 1, padding: '7px', fontSize: '0.75rem', color: 'var(--accent-crimson)' }}
              onClick={() => alert('Cerrando sesión...')}
            >
              Salir
            </button>
          </div>
        </div>
      )}

      {/* 3. ESCENARIO CENTRAL */}
      <main className="y2k-main-stage">
        <Outlet />
      </main>

      {/* 4. PANEL DE CHAT HERMANO DERECHO */}
      {!isChatDrawerOpen && (
        <button
          type="button"
          className="right-chat-pull-tab"
          onClick={() => {
            soundManager.playOpen();
            setIsChatDrawerOpen(true);
          }}
          title="Abrir Chat General"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
            <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
            <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
          </svg>
          <span style={{ writingMode: 'vertical-rl', fontSize: '0.72rem', letterSpacing: '1.5px' }}>
            CHAT
          </span>
        </button>
      )}

      <aside className={`y2k-right-chat-drawer ${!isChatDrawerOpen ? 'closed' : ''}`} aria-label="Chat General">
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--panel-inset-bg)',
            borderBottom: 'var(--border-thick) solid var(--panel-border-outer)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>CHAT GENERAL</strong>
          <button
            type="button"
            className="icon-close-x-btn"
            onClick={() => {
              soundManager.playClose();
              setIsChatDrawerOpen(false);
            }}
            title="Cerrar Chat"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div
          style={{
            flex: 1,
            padding: '14px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                background: 'var(--panel-card-bg)',
                color: 'var(--text-main)',
                padding: '9px 12px',
                borderRadius: '10px',
                borderLeft: '4px solid var(--primary-top)',
                fontSize: '0.84rem',
              }}
            >
              <div>
                <strong style={{ color: 'var(--accent-gold)', marginRight: 6 }}>{msg.sender}:</strong>
                <span>{msg.text}</span>
              </div>
              <small style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>{msg.time}</small>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSendChatMessage}
          style={{
            padding: '12px',
            background: 'var(--panel-inset-bg)',
            borderTop: 'var(--border-thick) solid var(--panel-border-outer)',
            display: 'flex',
            gap: '8px',
          }}
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Escribe en el chat..."
            style={{
              flex: 1,
              background: 'var(--panel-card-bg)',
              border: '2px solid var(--panel-border-outer)',
              borderRadius: '10px',
              padding: '8px 10px',
              color: 'var(--text-main)',
              outline: 'none',
              fontSize: '0.84rem',
            }}
          />
          <button type="submit" className="tactile-btn-purple" style={{ padding: '0 14px', fontSize: '0.82rem' }}>
            Enviar
          </button>
        </form>
      </aside>
    </div>
  );
};
