import React from 'react';
import { soundManager } from '../../data/audioConfig';
import { type SeasonalOverride, type SeasonalThemeId } from '../../data/seasonalThemes';
import { SantaHatOverlay } from '../seasonal/SeasonalDecorations';

interface UserSettingsPopoverProps {
  isOpen: boolean;
  userName?: string;
  userLevel: number;
  userCurrentXp: number;
  userNextLevelXp: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  lowSpecMode: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onToggleLowSpec: () => void;
  onClose: () => void;

  seasonalThemeId?: SeasonalThemeId;
  seasonalOverride?: SeasonalOverride;
  onChangeSeasonalOverride?: (next: SeasonalOverride) => void;
}

export const UserSettingsPopover: React.FC<UserSettingsPopoverProps> = ({
  isOpen,
  userName = 'Rayner_UDO',
  userLevel,
  userCurrentXp,
  userNextLevelXp,
  musicEnabled,
  sfxEnabled,
  lowSpecMode,
  onToggleMusic,
  onToggleSfx,
  onToggleLowSpec,
  onClose,
  seasonalThemeId = 'default',
  seasonalOverride = 'auto',
  onChangeSeasonalOverride,
}) => {

  if (!isOpen) return null;
  

  const xpPercent = Math.min(100, Math.round((userCurrentXp / userNextLevelXp) * 100));

  return (
    <div className="tactile-panel sidebar-settings-popover">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {seasonalThemeId === 'christmas' && <SantaHatOverlay variant="avatar" />}
            <div
              onClick={() => {
                soundManager.playClick();
                alert('Modulo externo: Editor de Avatar');
              }}
              title="Avatar de usuario"
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
                overflow: 'hidden',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="8" r="4.5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{userName}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
              Nivel {userLevel} — {userCurrentXp}/{userNextLevelXp} XP
            </div>
          </div>
        </div>

        <button
          type="button"
          className="icon-close-x-btn"
          onClick={() => {
            soundManager.playClose();
            onClose();
          }}
          title="Cerrar configuracion"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="xp-progress-track">
        <div className="xp-progress-fill" style={{ width: `${xpPercent}%` }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          className="settings-toggle-row"
          onClick={onToggleMusic}
          role="switch"
          aria-checked={musicEnabled}
        >
          <span>Musica de Fondo</span>
          <div className={`settings-switch-pill ${musicEnabled ? 'checked' : ''}`}>
            <div className="settings-switch-thumb" />
          </div>
        </div>

        <div
          className="settings-toggle-row"
          onClick={onToggleSfx}
          role="switch"
          aria-checked={sfxEnabled}
        >
          <span>Sonidos de Interfaz</span>
          <div className={`settings-switch-pill ${sfxEnabled ? 'checked' : ''}`}>
            <div className="settings-switch-thumb" />
          </div>
        </div>

        <div
          className="settings-toggle-row"
          onClick={onToggleLowSpec}
          role="switch"
          aria-checked={lowSpecMode}
        >
          <span>Modo Bajo Rendimiento</span>
          <div className={`settings-switch-pill ${lowSpecMode ? 'checked' : ''}`}>
            <div className="settings-switch-thumb" />
          </div>

        
        
        
        </div>
      
      {onChangeSeasonalOverride && (
          <div className="settings-toggle-row" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: '7px' }}>
            <span>Tema Festivo</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(
                [
                  { id: 'auto', text: 'Auto' },
                  { id: 'default', text: 'Normal' },
                  { id: 'christmas', text: 'Navidad' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`tactile-btn-dark ${seasonalOverride === opt.id ? 'active-state' : ''}`}
                  style={{ flex: 1, padding: '5px 6px', fontSize: '0.72rem' }}
                  onClick={() => {
                    soundManager.playClick();
                    onChangeSeasonalOverride(opt.id);
                  }}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>



      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className="tactile-btn-dark"
          style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
          onClick={() => {
            soundManager.playClick();
            alert('Modulo externo: Editor de Avatar');
          }}
        >
          Editar Avatar
        </button>
        <button
          type="button"
          className="tactile-btn-dark"
          style={{ flex: 1, padding: '8px', fontSize: '0.8rem', color: 'var(--accent-crimson)' }}
          onClick={() => alert('Cerrando sesion...')}
        >
          Salir
        </button>
      </div>
    </div>
  );
};
