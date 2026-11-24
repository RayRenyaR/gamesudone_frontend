import React, { useState, useEffect } from 'react';
import { type ViewerAdTrigger } from '../data/adSlotsData';
import { soundManager } from '../data/audioConfig';

interface GameViewerAdOverlayProps {
  trigger: ViewerAdTrigger;
  gameTitle: string;
  durationSec?: number;
  onComplete: (completed: boolean) => void;
}

const TRIGGER_LABELS: Record<ViewerAdTrigger, { badge: string; hint: string }> = {
  'pre-roll': {
    badge: 'ANUNCIO PREVIO',
    hint: 'Tu juego comenzara automaticamente al finalizar el anuncio.',
  },
  'post-roll': {
    badge: 'ANUNCIO AL SALIR',
    hint: 'Cerrando partida y volviendo al catalogo...',
  },
  'in-game-request': {
    badge: 'ANUNCIO RECOMPENSADO',
    hint: 'Solicitado por el juego para entregar recompensa extra.',
  },
};

export const GameViewerAdOverlay: React.FC<GameViewerAdOverlayProps> = ({
  trigger,
  gameTitle,
  durationSec = 3,
  onComplete,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(durationSec);

  useEffect(() => {
    setSecondsLeft(durationSec);
  }, [durationSec, trigger]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const meta = TRIGGER_LABELS[trigger];

  return (
    <div className="ad-viewer-overlay">
      <div className="tactile-panel ad-viewer-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <span className="ad-slot-pill">ANUNCIO</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            {meta.badge}
          </span>
        </div>

        {/* contenedor reservado para inyectar el creativo real en el proximo sprint */}
        <div className="ad-creative-placeholder" data-ad-slot-trigger={trigger}>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Espacio Publicitario ({trigger})
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', maxWidth: '340px' }}>
            Slot preparado para Prebid.js / UDONEADSDK vinculado a <strong>{gameTitle}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-soft)', textAlign: 'left' }}>
            {meta.hint}
          </span>

          <button
            type="button"
            className="tactile-btn-purple"
            disabled={secondsLeft > 0}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              opacity: secondsLeft > 0 ? 0.65 : 1,
              cursor: secondsLeft > 0 ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
            onClick={() => {
              soundManager.playClick();
              onComplete(true);
            }}
          >
            {secondsLeft > 0 ? `Continuar (${secondsLeft}s)` : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};