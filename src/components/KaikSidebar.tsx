import React, { useState } from 'react';

interface KaikSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const KaikSidebar: React.FC<KaikSidebarProps> = ({ isOpen, onToggle, onClose }) => {
  const [kaikStats, setKaikStats] = useState({
    name: 'Chispita (Bebé)',
    species: 'Ajolote Mutante',
    level: 3,
    hunger: 65,
    happiness: 80,
    energy: 50,
    isSleeping: false,
  });

  return (
    <aside className="kaik-sidebar-anchor" aria-label="Mascota Virtual Kaik">
      <div className={`kaik-drawer-panel ${!isOpen ? 'closed' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {kaikStats.name}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>
              {kaikStats.species} • Nv.{kaikStats.level}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-soft)',
              cursor: 'pointer',
              fontWeight: 900,
            }}
          >
            ◀
          </button>
        </div>

        <div className="kaik-stage-showcase">
          <span className="kaik-egg-sprite" style={{ fontSize: '3.1rem', display: 'inline-block' }}>
            {kaikStats.isSleeping ? '💤' : '🦎'}
          </span>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-soft)', marginTop: 6 }}>
            {kaikStats.isSleeping
              ? 'Durmiendo (Habilidad en pausa)'
              : 'Habilidad activa: Regeneración'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 3 }}>
              <span>Hambre</span>
              <span>{kaikStats.hunger}%</span>
            </div>
            <div className="kaik-progress-track">
              <div
                className="kaik-progress-fill"
                style={{ width: `${kaikStats.hunger}%`, background: 'var(--accent-crimson)' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 3 }}>
              <span>Felicidad</span>
              <span>{kaikStats.happiness}%</span>
            </div>
            <div className="kaik-progress-track">
              <div
                className="kaik-progress-fill"
                style={{ width: `${kaikStats.happiness}%`, background: 'var(--accent-emerald)' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 3 }}>
              <span>Energía</span>
              <span>{kaikStats.energy}%</span>
            </div>
            <div className="kaik-progress-track">
              <div
                className="kaik-progress-fill"
                style={{ width: `${kaikStats.energy}%`, background: 'var(--accent-gold)' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            className="tactile-btn-purple"
            style={{ padding: '8px', fontSize: '0.78rem' }}
            onClick={() =>
              setKaikStats((p) => ({
                ...p,
                hunger: Math.min(100, p.hunger + 20),
                happiness: Math.min(100, p.happiness + 10),
              }))
            }
          >
            Alimentar
          </button>
          <button
            type="button"
            className="tactile-btn-dark"
            style={{ padding: '8px', fontSize: '0.78rem' }}
            onClick={() =>
              setKaikStats((p) => ({
                ...p,
                isSleeping: !p.isSleeping,
                energy: !p.isSleeping ? Math.min(100, p.energy + 30) : p.energy,
              }))
            }
          >
            {kaikStats.isSleeping ? 'Despertar' : 'Dormir'}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="kaik-pull-tab"
        onClick={onToggle}
        title={isOpen ? 'Ocultar a Kaik' : 'Abrir a tu mascota Kaik'}
      >
        <span className="kaik-egg-sprite">🥚</span>
        <span className="kaik-tab-vertical-label">KAIK</span>
      </button>
    </aside>
  );
};