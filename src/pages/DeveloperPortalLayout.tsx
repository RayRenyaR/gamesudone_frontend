import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { soundManager } from '../data/audioConfig';
import {
  DEV_PORTAL_UPDATE_EVENT,
  type DeveloperGameRecord,
  type DeveloperEarningsSummary,
  type WithdrawalRequest,
  listDeveloperGames,
  getDeveloperEarningsSummary,
  listWithdrawalRequests,
  resetDeveloperPortalMocks,
} from '../data/developerPortalMockService';
import './DeveloperPortalStyles.css';
import { DeveloperUploadForm } from '../components/developer/DeveloperUploadForm';
import { DeveloperMyGamesPanel } from '../components/developer/DeveloperMyGamesPanel';
import { DeveloperEarningsPanel } from '../components/developer/DeveloperEarningsPanel';
import { DeveloperOwnerPanel } from '../components/developer/DeveloperOwnerPanel';
import { DeveloperSdkGuidePanel } from '../components/developer/DeveloperSdkGuidePanel';

type DeveloperSection = 'resumen' | 'subir' | 'juegos' | 'ingresos' | 'dueno' | 'guia';

const SECTION_META: Record<DeveloperSection, { title: string; subtitle: string }> = {
  resumen: {
    title: 'Panel de Desarrollador',
    subtitle: 'Metricas de tus juegos, rendimiento estimado y estado de revision.',
  },
  subir: {
    title: 'Subir Nuevo Juego',
    subtitle: 'Formulario de envio con vista previa en vivo y validacion previa a storage.',
  },
  juegos: {
    title: 'Mis Juegos',
    subtitle: 'Gestion de estados, metadatos, pausado y reenvio de versiones.',
  },
  ingresos: {
    title: 'Ingresos y Retiros',
    subtitle: 'Tu saldo disponible (70% desarrollador) y solicitudes de retiro.',
  },
  dueno: {
    title: 'Panel de Dueno (Administracion)',
    subtitle: 'Vista reservada al dueno de la plataforma: pools globales, 30% y cortes.',
  },
  guia: {
    title: 'Guia Tecnica y UDONEADSDK',
    subtitle: 'Checklist de empaquetado web/Flash y protocolo postMessage para anuncios.',
  },
};

const VALID_SECTIONS: DeveloperSection[] = [
  'resumen',
  'subir',
  'juegos',
  'ingresos',
  'dueno',
  'guia',
];

// serie de ejemplo para graficar cortes diarios recientes (mock)
const DAILY_EARNINGS_MOCK = [
  { day: 'Lun', usd: 4.2 },
  { day: 'Mar', usd: 5.8 },
  { day: 'Mie', usd: 4.9 },
  { day: 'Jue', usd: 7.4 },
  { day: 'Vie', usd: 8.1 },
  { day: 'Sab', usd: 5.1 },
  { day: 'Dom', usd: 4.1 },
];

export const DeveloperPortalLayout: React.FC = () => {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();

  const activeSection: DeveloperSection = VALID_SECTIONS.includes(section as DeveloperSection)
    ? (section as DeveloperSection)
    : 'resumen';

  const [devGames, setDevGames] = useState<DeveloperGameRecord[]>(() => listDeveloperGames());
  const [earnings, setEarnings] = useState<DeveloperEarningsSummary>(() =>
    getDeveloperEarningsSummary()
  );
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() =>
    listWithdrawalRequests()
  );
  const [editingGame, setEditingGame] = useState<DeveloperGameRecord | null>(null);

  // activa modo bajo rendimiento y scrollbar azul mientras estas en el portal
  useEffect(() => {
    const shellEl = document.querySelector('.y2k-app-shell');
    const hadLowSpecBefore = shellEl?.classList.contains('low-spec-mode') ?? false;

    shellEl?.classList.add('low-spec-mode');
    document.documentElement.classList.add('dev-portal-scrollbar');

    return () => {
      document.documentElement.classList.remove('dev-portal-scrollbar');
      if (!hadLowSpecBefore) {
        shellEl?.classList.remove('low-spec-mode');
      }
    };
  }, []);

  useEffect(() => {
    const syncData = () => {
      setDevGames(listDeveloperGames());
      setEarnings(getDeveloperEarningsSummary());
      setWithdrawals(listWithdrawalRequests());
    };

    window.addEventListener(DEV_PORTAL_UPDATE_EVENT, syncData);
    return () => window.removeEventListener(DEV_PORTAL_UPDATE_EVENT, syncData);
  }, []);

  const goToSection = (next: DeveloperSection) => {
    soundManager.playClick();
    if (next !== 'subir') {
      setEditingGame(null);
    }
    navigate(next === 'resumen' ? '/developer' : `/developer/${next}`);
  };

  const handleOpenEditGame = (game: DeveloperGameRecord) => {
    setEditingGame(game);
    navigate('/developer/subir');
  };

  const publishedCount = devGames.filter((g) => g.status === 'PUBLICADO').length;
  const reviewCount = devGames.filter((g) => g.status === 'EN_VERIFICACION').length;
  const activeHours = Math.round(earnings.totalActiveTimeSec / 3600);
  const meta = SECTION_META[activeSection];

  // datos del grafico de barras por juego (tiempo activo en horas)
  const gameBarSeries = useMemo(() => {
    const top = [...devGames].sort((a, b) => b.metrics.activeTimeSec - a.metrics.activeTimeSec).slice(0, 5);
    const maxSec = Math.max(1, ...top.map((g) => g.metrics.activeTimeSec));
    return top.map((g) => ({
      id: g.id,
      label: g.title.length > 14 ? `${g.title.slice(0, 14)}…` : g.title,
      hours: Number((g.metrics.activeTimeSec / 3600).toFixed(1)),
      pct: Math.max(8, Math.round((g.metrics.activeTimeSec / maxSec) * 100)),
    }));
  }, [devGames]);

  // puntos svg para el grafico de linea de ingresos diarios
  const lineChartPoints = useMemo(() => {
    const maxUsd = Math.max(...DAILY_EARNINGS_MOCK.map((d) => d.usd));
    const width = 420;
    const height = 140;
    const padX = 28;
    const padY = 20;

    return DAILY_EARNINGS_MOCK.map((item, index) => {
      const x =
        padX + (index / Math.max(1, DAILY_EARNINGS_MOCK.length - 1)) * (width - padX * 2);
      const y =
        height - padY - (item.usd / maxUsd) * (height - padY * 2);
      return { ...item, x, y };
    });
  }, []);

  const polylineStr = lineChartPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // estimacion mock de pool global y comision de plataforma (30%) para la pestana de dueno
  //const platformShareMockUsd = Number(((earnings.totalEarnedUsd / 0.7) * 0.3).toFixed(2));
  //const globalPoolTotalMockUsd = Number((earnings.totalEarnedUsd + platformShareMockUsd).toFixed(2));

  return (
    <div className="dev-wii-shell">
      <aside className="dev-wii-sidebar">
        <div>
          <div className="dev-brand-box">
            <div className="dev-brand-row">
              <div className="dev-brand-orb">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div>
                <div className="dev-brand-title">gamesUDONE</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--dev-border-bright)', fontWeight: 600 }}>
                  Creator Studio
                </div>
              </div>
            </div>
          </div>

          <nav className="dev-nav-list" aria-label="Navegacion del portal de desarrolladores">
            <button
              type="button"
              className={`dev-wii-nav-btn ${activeSection === 'resumen' ? 'active' : ''}`}
              onClick={() => goToSection('resumen')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Resumen</span>
            </button>

            <button
              type="button"
              className={`dev-wii-nav-btn ${activeSection === 'subir' ? 'active' : ''}`}
              onClick={() => goToSection('subir')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Subir Juego</span>
            </button>

            <button
              type="button"
              className={`dev-wii-nav-btn ${activeSection === 'juegos' ? 'active' : ''}`}
              onClick={() => goToSection('juegos')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="6" width="20" height="12" rx="3" />
                <path d="M6 12h4m-2-2v4" />
                <circle cx="16.5" cy="11.5" r="1" />
                <circle cx="18.5" cy="13.5" r="1" />
              </svg>
              <span>Mis Juegos ({devGames.length})</span>
            </button>

            <button
              type="button"
              className={`dev-wii-nav-btn ${activeSection === 'ingresos' ? 'active' : ''}`}
              onClick={() => goToSection('ingresos')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Ingresos y Retiros</span>
            </button>

            <button
              type="button"
              className={`dev-wii-nav-btn ${activeSection === 'dueno' ? 'active' : ''}`}
              onClick={() => goToSection('dueno')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Dueno</span>
            </button>

            <button
              type="button"
              className={`dev-wii-nav-btn ${activeSection === 'guia' ? 'active' : ''}`}
              onClick={() => goToSection('guia')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Guia / SDK</span>
            </button>
          </nav>
        </div>

        <div className="dev-sidebar-footer">
          <button
            type="button"
            className="dev-back-catalog-btn"
            onClick={() => {
              soundManager.playClose();
              navigate('/');
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Volver al Catalogo</span>
          </button>
        </div>
      </aside>

      <main className="dev-wii-main">
        <header className="dev-wii-topbar">
          <div>
            <h1 className="dev-topbar-title">{meta.title}</h1>
            <p className="dev-topbar-subtitle">{meta.subtitle}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="dev-mock-pill" title="Datos guardados en localStorage para pruebas de sprint">
              SIMULACION LOCAL (MOCK)
            </span>
            <button
              type="button"
              className="dev-secondary-btn"
              onClick={() => {
                soundManager.playClick();
                resetDeveloperPortalMocks();
              }}
              title="Restaurar los juegos y retiros de prueba iniciales"
            >
              Reiniciar Mocks
            </button>
          </div>
        </header>

        <div className="dev-wii-content">
          <div key={activeSection} className="dev-section-enter">
            {activeSection === 'resumen' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <section className="dev-kpi-grid">
                  <div className="dev-kpi-card">
                    <span className="dev-kpi-label">Saldo Disponible</span>
                    <span className="dev-kpi-value" style={{ color: '#6ee7b7' }}>
                      ${earnings.availableBalanceUsd.toFixed(2)} USD
                    </span>
                    <span className="dev-kpi-note">
                      Acumulado creador: ${earnings.totalEarnedUsd.toFixed(2)}
                    </span>
                  </div>

                  <div className="dev-kpi-card">
                    <span className="dev-kpi-label">Juegos Publicados</span>
                    <span className="dev-kpi-value">{publishedCount}</span>
                    <span className="dev-kpi-note">
                      {reviewCount} en verificacion • {devGames.length} registrados
                    </span>
                  </div>

                  <div className="dev-kpi-card">
                    <span className="dev-kpi-label">Impresiones Validas</span>
                    <span className="dev-kpi-value">
                      {earnings.totalValidImpressions.toLocaleString()}
                    </span>
                    <span className="dev-kpi-note">
                      Anuncios validados sin AFK
                    </span>
                  </div>

                  <div className="dev-kpi-card">
                    <span className="dev-kpi-label">Tiempo Activo Jugado</span>
                    <span className="dev-kpi-value">{activeHours} h</span>
                    <span className="dev-kpi-note">
                      {withdrawals.filter((w) => w.status === 'PENDING').length} retiro(s) pendiente(s)
                    </span>
                  </div>
                </section>

                {/* graficos en el dashboard */}
                <section className="dev-charts-grid">
                  <div className="dev-wii-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <h2 style={{ fontSize: '0.96rem', fontWeight: 700 }}>Rendimiento Diario Estimado (USD)</h2>
                      <span style={{ fontSize: '0.72rem', color: 'var(--dev-text-dim)' }}>Ultimos 7 dias (mock)</span>
                    </div>

                    <svg viewBox="0 0 420 155" className="dev-chart-svg" role="img" aria-label="Grafico de ingresos diarios estimados">
                      <line x1="28" y1="120" x2="392" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                      <line x1="28" y1="70" x2="392" y2="70" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" strokeWidth="1" />
                      <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylineStr}
                      />
                      {lineChartPoints.map((pt) => (
                        <g key={pt.day}>
                          <circle cx={pt.x} cy={pt.y} r="4.5" fill="#4fd1ff" stroke="#0b0d12" strokeWidth="2" />
                          <text x={pt.x} y="142" textAnchor="middle" fill="#aeb8cc" fontSize="11">
                            {pt.day}
                          </text>
                          <text x={pt.x} y={pt.y - 9} textAnchor="middle" fill="#e2e8f0" fontSize="10">
                            ${pt.usd.toFixed(1)}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>

                  <div className="dev-wii-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                      <h2 style={{ fontSize: '0.96rem', fontWeight: 700 }}>Tiempo Activo por Juego (Horas)</h2>
                      <span style={{ fontSize: '0.72rem', color: 'var(--dev-text-dim)' }}>Top 5</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                      {gameBarSeries.map((item) => (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                            <span style={{ color: 'var(--dev-text-main)', fontWeight: 600 }}>{item.label}</span>
                            <span style={{ color: 'var(--dev-border-bright)' }}>{item.hours} h</span>
                          </div>
                          <div className="dev-bar-track">
                            <div className="dev-bar-fill" style={{ width: `${item.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="dev-action-tiles-grid">
                  <button type="button" className="dev-wii-big-tile" onClick={() => goToSection('subir')}>
                    <div className="dev-tile-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '1.02rem', fontWeight: 700 }}>Subir un Juego</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--dev-text-soft)' }}>
                      Registra titulo, controles, portada y build web o Flash con vista previa en vivo.
                    </div>
                  </button>

                  <button type="button" className="dev-wii-big-tile" onClick={() => goToSection('juegos')}>
                    <div className="dev-tile-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <rect x="2" y="6" width="20" height="12" rx="3" />
                        <path d="M6 12h4m-2-2v4" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '1.02rem', fontWeight: 700 }}>Gestionar Mis Juegos</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--dev-text-soft)' }}>
                      Revisa estados de verificacion, pausa publicaciones o corrige juegos rechazados.
                    </div>
                  </button>

                  <button type="button" className="dev-wii-big-tile" onClick={() => goToSection('ingresos')}>
                    <div className="dev-tile-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '1.02rem', fontWeight: 700 }}>Ingresos y Retiros</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--dev-text-soft)' }}>
                      Consulta tu saldo disponible y solicita retiros a Binance, PayPal o Pago Movil.
                    </div>
                  </button>
                </section>

                <section className="dev-wii-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Actividad Reciente de tus Juegos</h2>
                    <button type="button" className="dev-secondary-btn" onClick={() => goToSection('juegos')}>
                      Ver todos
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {devGames.slice(0, 4).map((g) => (
                      <div
                        key={g.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'var(--dev-surface-inset)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <img
                            src={g.coverUrl}
                            alt={g.title}
                            style={{ width: '54px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {g.title}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--dev-text-dim)' }}>
                              {g.tipo} • v{g.version} • Actualizado {g.updatedAt}
                            </div>
                          </div>
                        </div>

                        <span className={`dev-status-badge dev-status-${g.status}`}>
                          {g.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'dueno' && (
           <DeveloperOwnerPanel
             games={devGames}
             earnings={earnings}
             withdrawals={withdrawals}
           />
         )}

         {activeSection === 'subir' && (
           <DeveloperUploadForm
             editingGame={editingGame}
             onFinished={() => {
               setEditingGame(null);
               navigate('/developer/juegos');
             }}
             onCancelEdit={() => {
               setEditingGame(null);
               navigate('/developer/juegos');
             }}
           />
         )}

         {activeSection === 'juegos' && (
           <DeveloperMyGamesPanel
             games={devGames}
             onEditGame={handleOpenEditGame}
             onGoToUpload={() => {
               setEditingGame(null);
               goToSection('subir');
             }}
           />
         )}

         {activeSection === 'ingresos' && (
           <DeveloperEarningsPanel
             games={devGames}
             earnings={earnings}
             withdrawals={withdrawals}
           />
         )}

         {activeSection === 'guia' && <DeveloperSdkGuidePanel />}
          </div>
        </div>
      </main>
    </div>
  );
};