import React, { useState } from 'react';

const PRESET_STYLES = [
  { name: 'Cyber Runner Y2K', color: '#7b2cbf',visor: '#00f5d4' },
  { name: 'Xbox Live Halo Green', color: '#38b000', visor: '#ccff33' },
  { name: 'Wii U Mii Classic', color: '#0095ff', visor: '#ffffff' },
  { name: 'Gold Champion', color: '#d97706', visor: '#ffd166' },
];

export const AvatarDedicatedView: React.FC = () => {
  const [selected, setSelected] = useState(PRESET_STYLES[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <section className="tactile-panel" style={{ padding: '24px 28px' }}>
        <span className="credit-role-badge">MÓDULO GRUPO BLANCO</span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '6px' }}>
          ESTUDIO DE PERSONALIZACIÓN DE AVATAR (MII)
        </h1>
        <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', marginTop: '4px' }}>
          Personaliza tu identidad visual para las partidas multijugador, los foros y la tabla de Ranked.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px' }}>
        <section className="tactile-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: '32px',
              background: selected.color,
              border: `4px solid ${selected.visor}`,
              boxShadow: 'var(--bevel-btn-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900 }}>{selected.name}</h2>
        </section>

        <section className="tactile-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>SELECCIONA TU ESTILO BASE</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {PRESET_STYLES.map((st) => (
              <button
                key={st.name}
                type="button"
                className={`tactile-btn-dark ${selected.name === st.name ? 'active-state' : ''}`}
                style={{ padding: '14px', fontSize: '0.84rem' }}
                onClick={() => setSelected(st)}
              >
                {st.name}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};