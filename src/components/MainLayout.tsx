import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { KaikSidebar } from './KaikSidebar';
import '../pages/CatalogStyles.css';

export type ThemeId = 'friv2' | 'wii' | 'wii-dark' | 'kizi';

interface GeneralChatMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
}

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('udo_theme') as ThemeId) || 'friv2';
  });

  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [activePopup, setActivePopup] = useState<'chat' | 'user' | null>(null);
  const [isKaikOpen, setIsKaikOpen] = useState<boolean>(false);

  const userLevel = 7;
  const userXpPercent = 68;
  const circleRadius = 21;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset =
    circleCircumference - (userXpPercent / 100) * circleCircumference;

  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<GeneralChatMessage[]>([
    { id: 1, sender: 'laura_gamer', text: '¡Ya probé el tema Wii con los textos corregidos!', time: '14:20' },
    { id: 2, sender: 'Ruben_Dev', text: 'Conectado al backend en el puerto 8080.', time: '14:22' },
    { id: 3, sender: 'Nicolas_Lider', text: 'Revisen la nueva sección de Créditos en el menú de usuario.', time: '14:25' },
  ]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('udo_theme', theme);
  }, [theme]);

  useEffect(() => {
    setActivePopup(null);
    if (location.pathname.startsWith('/play')) {
      setIsKaikOpen(false);
    }
  }, [location.pathname]);

  const togglePopup = (popupName: 'chat' | 'user') => {
    setActivePopup((prev) => (prev === popupName ? null : popupName));
  };

  const handleGoToAvatarEditor = () => {
    setActivePopup(null);
    alert('Redirigiendo a la página de Edición de Avatar (Módulo Grupo Blanco)...');
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

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
    <div className="app-shell">
      {/* 1. Fondo con Lámpara de Lava */}
      <div className="lava-lamp-container" aria-hidden="true">
        <div className="lava-blob blob-1" />
        <div className="lava-blob blob-2" />
        <div className="lava-blob blob-3" />
      </div>

      {/* 2. Topbar Fija */}
      <header className="attached-topbar">
        <div
          className="brand-logo-box"
          onClick={() => navigate('/')}
          title="Ir al Inicio"
        >
          <div className="brand-emblem">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="4" />
              <path d="M6 12h4m-2-2v4" />
              <circle cx="15" cy="11" r="1" fill="currentColor" />
              <circle cx="18" cy="13" r="1" fill="currentColor" />
            </svg>
          </div>
          <span className="brand-title">gamesUDONE</span>
        </div>

        <div className="topbar-nav-wrapper">
          {/* Oculto en PC, visible únicamente en pantallas pequeñas */}
          <button
            type="button"
            className={`nav-icon-only-btn mobile-hamburger-btn ${isMobileNavOpen ? 'active' : ''}`}
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            title="Menú de navegación"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <nav
            className={`topbar-icon-nav ${
              isMobileNavOpen ? 'mobile-expanded' : 'mobile-collapsed'
            }`}
            aria-label="Navegación Principal"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-icon-only-btn ${isActive ? 'active' : ''}`}
              title="Inicio"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
              </svg>
            </NavLink>

            <button
              type="button"
              className="nav-icon-only-btn"
              onClick={() => alert('Módulo de Foro (Grupo Cyan)')}
              title="Foro"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </button>

            <button
              type="button"
              className="nav-icon-only-btn"
              onClick={() => alert('Tienda, Pase de Batalla y Gacha')}
              title="Tienda"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </button>

            <NavLink
              to="/games"
              className={({ isActive }) => `nav-icon-only-btn ${isActive ? 'active' : ''}`}
              title="Catálogo de Juegos"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </NavLink>
          </nav>
        </div>

        <div className="topbar-right-zone">
          <button
            type="button"
            className={`nav-icon-only-btn ${activePopup === 'chat' ? 'active' : ''}`}
            onClick={() => togglePopup('chat')}
            title="Chat General"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
              <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
            </svg>
          </button>

          <button
            type="button"
            className="user-ring-btn"
            onClick={() => togglePopup('user')}
            title={`Nivel ${userLevel} (${userXpPercent}% XP)`}
          >
            <svg className="xp-ring-svg" viewBox="0 0 50 50">
              <circle className="xp-ring-bg" cx="25" cy="25" r={circleRadius} />
              <circle
                className="xp-ring-progress"
                cx="25"
                cy="25"
                r={circleRadius}
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="user-avatar-core">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="user-lvl-badge">Lv.{userLevel}</span>
          </button>

          {/* POPUP 1: CHAT GENERAL */}
          {activePopup === 'chat' && (
            <div className="dropdown-popup-window chat-popup-box">
              <div className="popup-header-bar">
                <span>Chat General</span>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer', fontWeight: 900, fontSize: '1.05rem' }}
                >
                  ✕
                </button>
              </div>

              <div className="chat-messages-scroll">
                {messages.map((msg) => (
                  <div key={msg.id} className="chat-bubble-item">
                    <div>
                      <strong style={{ color: 'var(--primary-mid)', marginRight: 6 }}>{msg.sender}:</strong>
                      <span>{msg.text}</span>
                    </div>
                    <small style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>
                      {msg.time}
                    </small>
                  </div>
                ))}
              </div>

              <form className="chat-form-footer" onSubmit={handleSendChatMessage}>
                <input
                  type="text"
                  className="tactile-input"
                  placeholder="Escribe un mensaje..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="tactile-btn-purple" style={{ padding: '0 14px' }}>
                  Enviar
                </button>
              </form>
            </div>
          )}

          {/* POPUP 2: MENÚ DE USUARIO (REDIRECCIÓN DIRECTA AL AVATAR + CRÉDITOS + 4 TEMAS) */}
          {activePopup === 'user' && (
            <div className="dropdown-popup-window user-popup-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleGoToAvatarEditor}
                  title="Ir a la página de Edición de Avatar"
                  className="user-avatar-core"
                  style={{ width: 46, height: 46, cursor: 'pointer', flexShrink: 0 }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '0.96rem' }}>Rayner_UDO</div>
                  <div style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: 800 }}>
                    Nivel {userLevel} • 680 / 1000 XP
                  </div>
                </div>
              </div>

              <div className="kaik-progress-track">
                <div
                  className="kaik-progress-fill"
                  style={{ width: `${userXpPercent}%`, background: 'var(--primary-top)' }}
                />
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-soft)', marginBottom: '6px' }}>
                  TEMA DE COLORES:
                </div>
                <div className="theme-selector-grid">
                  <button
                    type="button"
                    className={`theme-pill-btn ${theme === 'friv2' ? 'active' : ''}`}
                    onClick={() => setTheme('friv2')}
                  >
                    <span className="theme-swatch-dot" style={{ background: '#9d4edd' }} />
                    <span>Friv 2</span>
                  </button>

                  <button
                    type="button"
                    className={`theme-pill-btn ${theme === 'wii' ? 'active' : ''}`}
                    onClick={() => setTheme('wii')}
                  >
                    <span className="theme-swatch-dot" style={{ background: '#eef2f6', borderColor: '#0095ff' }} />
                    <span>Wii Perla</span>
                  </button>

                  <button
                    type="button"
                    className={`theme-pill-btn ${theme === 'wii-dark' ? 'active' : ''}`}
                    onClick={() => setTheme('wii-dark')}
                  >
                    <span className="theme-swatch-dot" style={{ background: '#242933', borderColor: '#38b6ff' }} />
                    <span>Wii Oscuro</span>
                  </button>

                  <button
                    type="button"
                    className={`theme-pill-btn ${theme === 'kizi' ? 'active' : ''}`}
                    onClick={() => setTheme('kizi')}
                  >
                    <span className="theme-swatch-dot" style={{ background: '#ffb703', borderColor: '#1d4e70' }} />
                    <span>Kizi</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  type="button"
                  className="custom-dropdown-item"
                  onClick={handleGoToAvatarEditor}
                >
                  Configurar mi Avatar
                </button>
                <button
                  type="button"
                  className="custom-dropdown-item"
                  onClick={() => {
                    setActivePopup(null);
                    setIsKaikOpen(true);
                  }}
                >
                  Abrir panel de Kaik
                </button>
                <button
                  type="button"
                  className="custom-dropdown-item"
                  onClick={() => {
                    setActivePopup(null);
                    navigate('/credits');
                  }}
                >
                  Créditos del Proyecto
                </button>
                <button
                  type="button"
                  className="custom-dropdown-item"
                  style={{ color: 'var(--accent-crimson)' }}
                  onClick={() => alert('Cerrando sesión...')}
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 3. Sidebar Modular de Kaik */}
      <KaikSidebar
        isOpen={isKaikOpen}
        onToggle={() => setIsKaikOpen((prev) => !prev)}
        onClose={() => setIsKaikOpen(false)}
      />

      {/* 4. Contenedor de Vistas */}
      <main className="main-route-viewport">
        <Outlet />
      </main>
    </div>
  );
};
