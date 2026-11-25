import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { MAIN_THEME_URL, soundManager } from '../../data/audioConfig';
import { GeneralChatDrawer } from './GeneralChatDrawer';
import { UserSettingsPopover } from './UserSettingsPopOver';
import { useSeasonalTheme } from '../../data/seasonalThemes';
import { SeasonalBackdropLayer } from '../seasonal/SeasonalBackdropLayer';
import { SantaHatOverlay } from '../seasonal/SeasonalDecorations';
import '../../styles/PlatformStyles.css';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [lowSpecMode, setLowSpecMode] = useState<boolean>(() => {
    return localStorage.getItem('udo_low_spec') === 'true';
  });

  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => {
    return localStorage.getItem('udo_sfx_enabled') !== 'false';
  });

  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => {
    return localStorage.getItem('udo_music_enabled') !== 'false';
  });

  const [pausedByGame, setPausedByGame] = useState<boolean>(false);
  const [isUserPodOpen, setIsUserPodOpen] = useState<boolean>(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);
  const {
    theme: seasonalTheme,
    override: seasonalOverride,
    setOverride: setSeasonalOverride,
  } = useSeasonalTheme();
  const [activeMusicUrl, setActiveMusicUrl] = useState<string>(seasonalTheme.musicUrl);

  // actualiza la pista musical al cambiar de tema festivo
  useEffect(() => {
    setActiveMusicUrl(seasonalTheme.musicUrl);
  }, [seasonalTheme.musicUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    if (musicEnabled && !pausedByGame) {
      audioRef.current.play().catch(() => {});
    }
  }, [activeMusicUrl]);

  const userLevel = 7;
  const userCurrentXp = 680;
  const userNextLevelXp = 1000;
  //const userXpPercent = Math.round((userCurrentXp / userNextLevelXp) * 100);

  useEffect(() => {
    localStorage.setItem('udo_low_spec', String(lowSpecMode));
  }, [lowSpecMode]);

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
      } else if (!gameIsRunning && musicEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('udo_game_playing_state', handleGamePlaying);
    return () => window.removeEventListener('udo_game_playing_state', handleGamePlaying);
  }, [musicEnabled]);

  useEffect(() => {
    const unlockAudioOnFirstClick = () => {
      if (musicEnabled && !pausedByGame && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
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
      } else if (next && !pausedByGame && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      return next;
    });
  };

  return (
    <div
      className={`platform-app-shell ${lowSpecMode ? 'low-spec-mode' : ''}`}
      data-seasonal={seasonalTheme.id}
    >
      <audio
        ref={audioRef}
        src={activeMusicUrl}
        loop
        onError={() => {
          // si aun no existe el archivo festivo, vuelve al tema principal sin error
          if (activeMusicUrl !== MAIN_THEME_URL) {
            setActiveMusicUrl(MAIN_THEME_URL);
          }
        }}
      />

      <SeasonalBackdropLayer themeId={seasonalTheme.id} lowSpecMode={lowSpecMode} />
      
      <aside className="platform-left-sidebar" aria-label="Navegación Principal">
        <svg className="sidebar-svg-bg" viewBox="0 0 92 1000" preserveAspectRatio="none">
          <path
            d="M 0,0 L 90,0 L 90,104 L 66,142 L 66,858 L 90,896 L 90,1000 L 0,1000 Z"
            fill="var(--panel-base)"
            stroke="none"
          />
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
            {seasonalTheme.hasUserHat && <SantaHatOverlay variant="orb" />}
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
            title="Catálogo de Juegos"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <rect x="3" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="14" width="7" height="7" rx="2" />
              <rect x="3" y="14" width="7" height="7" rx="2" />
            </svg>
          </NavLink>

          <button
            type="button"
            className="sidebar-nav-btn"
            onMouseEnter={() => soundManager.playHover()}
            onClick={() => {
              soundManager.playClick();
              alert('Módulo externo: Mascota Kaik (pendiente de integración del Grupo Verde)');
            }}
            title="Mascota Kaik (Módulo externo)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M12 2C7.5 2 4 7.5 4 13a8 8 0 0 0 16 0c0-5.5-3.5-11-8-11Z" />
              <path d="M9 14s1.5 2 3 2 3-2 3-2" />
            </svg>
          </button>

          <button
            type="button"
            className="sidebar-nav-btn"
            onMouseEnter={() => soundManager.playHover()}
            onClick={() => {
              soundManager.playClick();
              alert('Módulo externo: Avatar / Mii (pendiente de integración del Grupo Blanco)');
            }}
            title="Avatar (Módulo externo)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <circle cx="12" cy="8" r="4.5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
          </button>

          <button
            type="button"
            className="sidebar-nav-btn"
            onMouseEnter={() => soundManager.playHover()}
            onClick={() => {
              soundManager.playClick();
              alert('Módulo externo: Foro Comunitario (pendiente de integración del Grupo Cyan)');
            }}
            title="Foro Comunitario (Módulo externo)"
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
              alert('Módulo externo: Tienda y Gacha (pendiente de integración)');
            }}
            title="Tienda y Gacha (Módulo externo)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </button>
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
      

      <UserSettingsPopover
        
        isOpen={isUserPodOpen}
        userLevel={userLevel}
        userCurrentXp={userCurrentXp}
        userNextLevelXp={userNextLevelXp}
        musicEnabled={musicEnabled}
        sfxEnabled={sfxEnabled}
        lowSpecMode={lowSpecMode}
        onToggleMusic={handleToggleMusicSwitch}
        onToggleSfx={() => {
          const next = !sfxEnabled;
          setSfxEnabled(next);
          soundManager.setSfxEnabled(next);
          if (next) soundManager.playClick();
        }}
        onToggleLowSpec={() => {
          soundManager.playClick();
          setLowSpecMode((prev) => !prev);
        }}
        onClose={() => setIsUserPodOpen(false)}

        seasonalThemeId={seasonalTheme.id}
        seasonalOverride={seasonalOverride}
        onChangeSeasonalOverride={setSeasonalOverride}

      />

      <main className="platform-main-stage" 
        
      >
        <Outlet />
      </main>

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

      <GeneralChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
      />
    </div>
  );
};