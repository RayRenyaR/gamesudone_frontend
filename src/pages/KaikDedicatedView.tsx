import React, { useState } from 'react';

export const KaikDedicatedView: React.FC = () => {
  const [stats, setStats] = useState({
    name: 'Chispita',
    species: 'Ajolote Mutante',
    stage: 'Etapa 2 • Juvenil',
    level: 5,
    hunger: 75,
    happiness: 90,
    energy: 60,
    isSleeping: false,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <section className="tactile-panel" style={{ padding: '24px 28px' }}>
        <span className="credit-role-badge">MÓDULO GRUPO VERDE</span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '6px' }}>
          SANTUARIO DE KAIK (MASCOTA VIRTUAL)
        </h1>
        <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', marginTop: '4px' }}>
          Cuida a tu compañero, completa sus 3 encargos diarios y activa bonificaciones pasivas en los juegos.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
        {/* Hábitat Central */}
        <section className="tactile-panel" style={{ padding: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{stats.name}</h2>
            <span style={{ color: 'var(--accent-gold)', fontWeight: 800, fontSize: '0.84rem' }}>
              {stats.species} • {stats.stage} (Nv.{stats.level})
            </span>
          </div>

          <div
            style={{
              height: '180px',
              background: 'var(--panel-inset-bg)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4.5rem',
            }}
          >
            {stats.isSleeping ? '💤' : '🦎'}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="tactile-btn-purple"
              style={{ padding: '12px 22px' }}
              onClick={() =>
                setStats((p) => ({
                  ...p,
                  hunger: Math.min(100, p.hunger + 20),
                  happiness: Math.min(100, p.happiness + 10),
                }))
              }
            >
              🪱 Alimentar (-15 Monedas)
            </button>
            <button
              type="button"
              className="tactile-btn-dark"
              style={{ padding: '12px 22px' }}
              onClick={() =>
                setStats((p) => ({
                  ...p,
                  isSleeping: !p.isSleeping,
                  energy: !p.isSleeping ? Math.min(100, p.energy + 30) : p.energy,
                }))
              }
            >
              {stats.isSleeping ? '☀️ Despertar' : '🌙 Poner a Dormir'}
            </button>
          </div>
        </section>

        {/* Estadísticas y Encargos Diarios */}
        <section className="tactile-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>ESTADO VITAL Y ENCARGOS DIARIOS</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }}>
                <span>🍖 Hambre</span>
                <span>{stats.hunger}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--panel-inset-bg)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${stats.hunger}%`, height: '100%', background: 'var(--accent-crimson)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }}>
                <span>🎉 Felicidad</span>
                <span>{stats.happiness}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--panel-inset-bg)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${stats.happiness}%`, height: '100%', background: 'var(--accent-emerald)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }}>
                <span>⚡ Energía</span>
                <span>{stats.energy}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--panel-inset-bg)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${stats.energy}%`, height: '100%', background: 'var(--accent-gold)' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--panel-inset-bg)', padding: '14px', borderRadius: '14px', fontSize: '0.84rem' }}>
            <strong style={{ color: 'var(--accent-gold)' }}>✨ Pasiva Activa (Regeneración Tisular):</strong>
            <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>
              Permite mutar un encargo diario al día con 35% de probabilidad de duplicar las monedas ganadas.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};