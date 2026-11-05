import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type Game,
  DEFAULT_LEADERBOARD,
  fetchCatalogGames,
} from '../data/gamesData';
import { GameCard } from '../components/GameCard';
import { MorrocoyaEasterEgg } from '../components/MorrocoyaEasterEgg';

const FORUM_TRENDING_THREADS = [
  {
    id: 1,
    tag: 'Estrategia',
    title: '¿Cómo dominar las aperturas en Chess College (Ajedrez UDO)?',
    author: 'Nicolas_Lider',
    replies: 24,
  },
  {
    id: 2,
    tag: 'Récords',
    title: 'Guía para superar al Jefe de Mr. Perros en velocidad máxima en UDOWare',
    author: 'Rayner_UDO',
    replies: 41,
  },
  {
    id: 3,
    tag: 'Mascotas',
    title: 'Comparativa de bonificaciones: ¿Conviene más el Ajolote o la Morrocoya?',
    author: 'laura_gamer',
    replies: 19,
  },
];

const KAIK_SPECIES_SHOWCASE = [
  {
    name: 'Ajolote Mutante',
    type: 'Tipo: Adaptación',
    sprite: '🦎',
    benefit: 'Regenera encargos diarios que no quieras hacer con probabilidad de duplicar tus monedas.',
    tip: '¡Consigue más XP jugando partidas en Modo Arcade!',
  },
  {
    name: 'Morrocoya Legendaria',
    type: 'Tipo: Guardián',
    sprite: '🐢',
    benefit: 'Aumenta progresivamente tu multiplicador de XP y monedas por cada día o sesión continua.',
    tip: '¡Mantén a Kaik alimentado para activar su pasiva en toda la plataforma!',
  },
  {
    name: 'Zorro Astuto',
    type: 'Tipo: Azar y Gacha',
    sprite: '🦊',
    benefit: 'Otorga 1 repetición de tirada gratuita al día en el Gacha y descuentos en cofres.',
    tip: '¡Sube de nivel a tu Kaik para que evolucione de Bebé a etapa Legendaria!',
  },
  {
    name: 'Dragón Acumulador',
    type: 'Tipo: Tesoro',
    sprite: '🐉',
    benefit: 'Funde objetos repetidos de tu inventario para transformarlos en monedas y experiencia.',
    tip: '¡Cada partida completada suma experiencia directa a tu mascota!',
  },
];

const AVATAR_SLIDES = [
  {
    badge: 'IDENTIDAD DIGITAL',
    title: '¿Qué es tu Avatar en gamesUDONE?',
    description:
      'Tu Avatar es tu representación interactiva dentro de toda la plataforma. Refleja tu estilo personal con atuendos, colores y poses dinámicas que reaccionan a tus logros.',
    bgUrl: 'https://placehold.co/900x400/2a1b4e/ffffff?text=Personaliza+Tu+Identidad',
    poseLabel: 'Pose: Saludo de Victoria',
    poseRotation: '-6deg',
  },
  {
    badge: 'NOVEDADES Y TIENDA',
    title: 'Desbloquea Aspectos en el Pase y Gacha',
    description:
      'Utiliza las monedas ganadas en tus partidas para abrir cofres en la tienda o subir niveles del Pase de Batalla.',
    bgUrl: 'https://placehold.co/900x400/1d3557/ffd166?text=Nuevos+Aspectos+Temporada+1',
    poseLabel: 'Pose: Celebración Épica',
    poseRotation: '8deg',
  },
  {
    badge: 'INTEGRACIÓN EN JUEGOS',
    title: 'Juegos Compatibles con tu Avatar',
    description:
      'Lleva tu identidad directamente a las salas multijugador, al podio del Ranked Global y a tu tarjeta de perfil en los foros comunitarios.',
    bgUrl: 'https://placehold.co/900x400/3c096c/2ec4b6?text=Compatible+con+Multijugador',
    poseLabel: 'Pose: Listo para el Duelo',
    poseRotation: '0deg',
  },
];

export const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Estado de carga mientras responde el Backend en el puerto 8080
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(true);

  const [featuredIndex, setFeaturedIndex] = useState<number>(0);
  const [carouselOffset, setCarouselOffset] = useState<number>(0);
  const [isMobileView, setIsMobileView] = useState<boolean>(window.innerWidth <= 768);

  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [quickSearch, setQuickSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);

  const [kaikIndex, setKaikIndex] = useState<number>(0);
  const [avatarSlideIndex, setAvatarSlideIndex] = useState<number>(0);

  useEffect(() => {
    setIsLoadingBackend(true);
    fetchCatalogGames().then((loaded) => {
      setGames(loaded);
      setIsLoadingBackend(false);
    });

    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setKaikIndex((prev) => (prev + 1) % KAIK_SPECIES_SHOWCASE.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  if (isLoadingBackend) {
    return (
      <div className="tactile-panel backend-loading-box">
        <div className="tactile-spinner" />
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900 }}>
          Cargando catálogo desde el servidor...
        </h2>
        <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem' }}>
          Sincronizando juegos disponibles con el Backend (Spring Boot :8080)
        </p>
      </div>
    );
  }

  const recommendedList = games.filter((g) => g.isRecommended);
  const activeBannerGame =
    recommendedList[featuredIndex % Math.max(1, recommendedList.length)] || games[0];

  const allCategories = [
    'Todas',
    ...Array.from(new Set(games.flatMap((g) => g.categories))),
  ];

  const filteredGames = games.filter((g) => {
    const matchesText = g.title.toLowerCase().includes(quickSearch.toLowerCase());
    const matchesCat =
      selectedCategory === 'Todas' || g.categories.includes(selectedCategory);
    return matchesText && matchesCat;
  });

  const cardsPerView = isMobileView ? 1 : 4;
  const visibleGames = filteredGames.slice(carouselOffset, carouselOffset + cardsPerView);

  const handlePrevGames = () => {
    setCarouselOffset((prev) =>
      prev - 1 < 0 ? Math.max(0, filteredGames.length - cardsPerView) : prev - 1
    );
  };

  const handleNextGames = () => {
    setCarouselOffset((prev) =>
      prev + cardsPerView >= filteredGames.length ? 0 : prev + 1
    );
  };

  const toggleSearchBar = () => {
    setIsSearchExpanded((prev) => {
      const next = !prev;
      if (next) setTimeout(() => searchInputRef.current?.focus(), 120);
      else setQuickSearch('');
      return next;
    });
  };

  const currentKaikShowcase = KAIK_SPECIES_SHOWCASE[kaikIndex];
  const currentAvatarSlide = AVATAR_SLIDES[avatarSlideIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. FILA SUPERIOR: RECOMENDADOS + TOP 5 RANKED (Con mayor separación inferior en PC) */}
      <div className="home-top-grid">
        <section
          className="hero-recommended-banner"
          style={{ backgroundImage: `url(${activeBannerGame.coverUrl})` }}
        >
          <span
            style={{
              position: 'absolute',
              top: 18,
              left: 22,
              zIndex: 2,
              background: 'var(--panel-elevated)',
              color: 'var(--text-main)',
              border: '2px solid var(--panel-border-outer)',
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 900,
              letterSpacing: '0.8px',
            }}
          >
            RECOMENDADOS
          </span>

          <div className="hero-info-card tactile-panel">
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <span
                  style={{
                    background: 'var(--primary-mid)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    padding: '3px 9px',
                    borderRadius: '7px',
                  }}
                >
                  {activeBannerGame.ageRating}
                </span>
                <span
                  style={{
                    background: 'var(--panel-inset-bg)',
                    color: 'var(--text-soft)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '7px',
                  }}
                >
                  {activeBannerGame.tipo}
                </span>
              </div>

              <h1
                className="line-clamp-2"
                style={{ fontSize: '1.65rem', fontWeight: 900, lineHeight: 1.15, marginBottom: '10px', color: 'var(--text-main)' }}
              >
                {activeBannerGame.title}
              </h1>

              <p
                className="line-clamp-3"
                style={{ color: 'var(--text-soft)', fontSize: '0.88rem', lineHeight: 1.45 }}
              >
                {activeBannerGame.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
              <button
                type="button"
                className="tactile-btn-purple"
                style={{ padding: '11px 26px', fontSize: '0.94rem' }}
                onClick={() => navigate(`/play/${activeBannerGame.alias}`)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>JUGAR</span>
              </button>

              <div style={{ display: 'flex', gap: '6px' }}>
                {recommendedList.map((rec, idx) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setFeaturedIndex(idx)}
                    style={{
                      width: idx === featuredIndex ? 22 : 9,
                      height: 9,
                      borderRadius: 99,
                      border: 'none',
                      cursor: 'pointer',
                      background:
                        idx === featuredIndex ? 'var(--primary-top)' : 'var(--panel-inset-bg)',
                      transition: 'all 0.25s ease',
                    }}
                    title={rec.title}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside
          className="tactile-panel"
          style={{
            height: '100%',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
              RANKED GLOBAL
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-soft)', fontWeight: 800 }}>
              TOP 5
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEFAULT_LEADERBOARD.slice(0, 5).map((entry, idx) => (
              <div
                key={entry.player}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  background: idx === 0 ? 'var(--panel-elevated)' : 'var(--panel-card-bg)',
                  border:
                    idx === 0
                      ? '2px solid var(--accent-gold)'
                      : '1px solid var(--panel-border-outer)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: '0.84rem',
                      minWidth: '24px',
                      color: idx === 0 ? 'var(--accent-gold)' : 'var(--text-soft)',
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', lineHeight: 1.15, color: 'var(--text-main)' }}>
                      {entry.player}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {entry.gameTitle}
                    </div>
                  </div>
                </div>
                <strong style={{ color: 'var(--primary-mid)', fontSize: '0.86rem' }}>
                  {entry.score} pts
                </strong>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* 2. JUEGOS DESTACADOS (Usando componente modular <GameCard />) */}
      <section className="tactile-panel" style={{ padding: '22px 26px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>JUEGOS DESTACADOS</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={`expandable-search-wrap ${isSearchExpanded ? 'expanded' : 'collapsed'}`}>
              <button
                type="button"
                className="tactile-btn-dark"
                onClick={toggleSearchBar}
                style={{ width: '42px', height: '38px', padding: 0, flexShrink: 0 }}
                title="Buscar juego"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {isSearchExpanded && (
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Escribe para buscar..."
                  value={quickSearch}
                  onChange={(e) => {
                    setQuickSearch(e.target.value);
                    setCarouselOffset(0);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '0.84rem',
                    width: '100%',
                    paddingLeft: '8px',
                  }}
                />
              )}
            </div>

            <div className="custom-dropdown-container">
              <button
                type="button"
                className={`tactile-btn-dark ${selectedCategory !== 'Todas' ? 'active-state' : ''}`}
                style={{ height: '38px', padding: '0 14px', fontSize: '0.82rem' }}
                onClick={() => setIsFilterMenuOpen((prev) => !prev)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>{selectedCategory === 'Todas' ? 'Filtros' : selectedCategory}</span>
              </button>

              {isFilterMenuOpen && (
                <div className="custom-dropdown-menu">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`custom-dropdown-item ${selectedCategory === cat ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCarouselOffset(0);
                        setIsFilterMenuOpen(false);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="tactile-btn-dark"
            style={{ width: '40px', height: '40px', flexShrink: 0 }}
            onClick={handlePrevGames}
          >
            ◀
          </button>

          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: isMobileView ? '1fr' : 'repeat(4, minmax(0, 1fr))',
              gap: '16px',
            }}
          >
            {visibleGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => navigate(`/play/${game.alias}`)}
              />
            ))}
          </div>

          <button
            type="button"
            className="tactile-btn-dark"
            style={{ width: '40px', height: '40px', flexShrink: 0 }}
            onClick={handleNextGames}
          >
            ▶
          </button>

          <button
            type="button"
            className="tactile-btn-purple"
            onClick={() => navigate('/games')}
            style={{
              padding: '14px 18px',
              borderRadius: '16px',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '94px',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span style={{ fontSize: '0.78rem', fontWeight: 900 }}>Ver todo</span>
          </button>
        </div>
      </section>

      {/* 3. DESCUBRE LOS FOROS */}
      <section className="tactile-panel" style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.22rem', fontWeight: 900, color: 'var(--text-main)' }}>
              DESCUBRE LOS FOROS DE LA COMUNIDAD
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-soft)' }}>
              Debate estrategias, comparte tus récords y conversa con otros jugadores en las últimas tendencias.
            </p>
          </div>
          <button
            type="button"
            className="tactile-btn-dark"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            onClick={() => alert('Abriendo el Foro Principal (Grupo Cyan)')}
          >
            Ir al Foro Completo
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {FORUM_TRENDING_THREADS.map((thread) => (
            <div
              key={thread.id}
              style={{
                background: 'var(--panel-card-bg)',
                border: '2px solid var(--panel-border-outer)',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
                boxShadow: 'var(--bevel-btn-secondary)',
              }}
            >
              <div>
                <span
                  style={{
                    background: 'var(--primary-mid)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {thread.tag}
                </span>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginTop: '8px', lineHeight: 1.35, color: 'var(--text-main)' }}>
                  {thread.title}
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                <span>Por {thread.author}</span>
                <span style={{ color: 'var(--accent-gold)' }}>{thread.replies} respuestas</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DESCUBRE A KAIK */}
      <section className="tactile-panel" style={{ padding: '22px 26px', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <span
            style={{
              background: 'var(--primary-mid)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 900,
              padding: '3px 10px',
              borderRadius: '99px',
            }}
          >
            SUBSISTEMA DE COMPAÑERO VIRTUAL
          </span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginTop: '6px', color: 'var(--text-main)' }}>
            DESCUBRE A KAIK: TU MASCOTA EN LA PÁGINA
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginTop: '4px' }}>
            Aliméntala, cumple sus encargos diarios y gana XP jugando para evolucionarla y activar multiplicadores globales.
          </p>
        </div>

        <div className="kaik-showcase-arena">
          <div className="kaik-hopping-traveller">
            <span
              style={{
                background: 'var(--primary-mid)',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 900,
                padding: '3px 10px',
                borderRadius: '99px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              {currentKaikShowcase.tip}
            </span>
            <span className="kaik-hopping-sprite">{currentKaikShowcase.sprite}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'var(--panel-card-bg)',
            padding: '12px 18px',
            borderRadius: '14px',
            border: '1px solid var(--panel-border-outer)',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <strong style={{ fontSize: '0.95rem', color: 'var(--accent-gold)' }}>
              {currentKaikShowcase.name} ({currentKaikShowcase.type})
            </strong>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginTop: '2px' }}>
              {currentKaikShowcase.benefit}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {KAIK_SPECIES_SHOWCASE.map((sp, idx) => (
              <button
                key={sp.name}
                type="button"
                className={`tactile-btn-dark ${idx === kaikIndex ? 'active-state' : ''}`}
                style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                onClick={() => setKaikIndex(idx)}
              >
                {sp.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 5. DESCUBRE TU AVATAR (70% SLIDER / 30% POSES) */}
      <section className="tactile-panel" style={{ padding: '22px 26px' }}>
        <div className="avatar-showcase-split">
          <div
            className="avatar-slider-left"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(16,12,28,0.92) 0%, rgba(16,12,28,0.78) 100%), url(${currentAvatarSlide.bgUrl})`,
            }}
          >
            <div>
              <span
                style={{
                  background: '#ffd166',
                  color: '#161024',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  padding: '3px 10px',
                  borderRadius: '7px',
                }}
              >
                {currentAvatarSlide.badge}
              </span>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, marginTop: '10px', color: '#ffffff' }}>
                {currentAvatarSlide.title}
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#f1f5f9', marginTop: '8px', lineHeight: 1.5, maxWidth: '560px' }}>
                {currentAvatarSlide.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="tactile-btn-dark"
                  style={{ padding: '6px 12px' }}
                  onClick={() =>
                    setAvatarSlideIndex((prev) =>
                      prev - 1 < 0 ? AVATAR_SLIDES.length - 1 : prev - 1
                    )
                  }
                >
                  ◀
                </button>
                <button
                  type="button"
                  className="tactile-btn-dark"
                  style={{ padding: '6px 12px' }}
                  onClick={() =>
                    setAvatarSlideIndex((prev) => (prev + 1) % AVATAR_SLIDES.length)
                  }
                >
                  ▶
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {AVATAR_SLIDES.map((s, idx) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => setAvatarSlideIndex(idx)}
                    style={{
                      width: idx === avatarSlideIndex ? 22 : 9,
                      height: 9,
                      borderRadius: 99,
                      border: 'none',
                      cursor: 'pointer',
                      background:
                        idx === avatarSlideIndex ? '#ffd166' : 'rgba(255,255,255,0.35)',
                      transition: 'all 0.25s ease',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="avatar-pose-stage-right">
            <div
              className="avatar-animated-figure"
              style={{ transform: `rotate(${currentAvatarSlide.poseRotation})` }}
            >
              {avatarSlideIndex === 0 && (
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="6" r="4" />
                  <path d="M5 22v-5l3-3 4 2 4-5 3 2" />
                </svg>
              )}
              {avatarSlideIndex === 1 && (
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="6" r="4" />
                  <path d="M4 11l8 4 8-4" />
                  <path d="M9 22l3-7 3 7" />
                </svg>
              )}
              {avatarSlideIndex === 2 && (
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="3" width="12" height="10" rx="3" />
                  <path d="M4 21v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" />
                </svg>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Avatar Interactivo
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--accent-gold)', fontWeight: 800, marginTop: '2px' }}>
                {currentAvatarSlide.poseLabel}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPONENTE MODULAR: MORROCOYA CON 2 PNGs Y TAMBALEO */}
      <MorrocoyaEasterEgg />
    </div>
  );
};