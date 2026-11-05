import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Game, fetchCatalogGames } from '../data/gamesData';
import { GameCard } from '../components/GameCard';

export const CatalogLaunchboxView: React.FC = () => {
  const navigate = useNavigate();
  const descTextRef = useRef<HTMLParagraphElement | null>(null);

  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [sortBy, setSortBy] = useState<'popular' | 'az'>('popular');
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);

  const [isReadMoreOpen, setIsReadMoreOpen] = useState<boolean>(false);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    fetchCatalogGames().then((loaded) => {
      setGames(loaded);
      if (loaded.length > 0) setSelectedGame(loaded[0]);
      setIsLoading(false);
    });
  }, []);

  // Verifica en el DOM real si la descripción seleccionada supera las 2 líneas
  useEffect(() => {
    setIsReadMoreOpen(false);
    const checkOverflow = () => {
      const el = descTextRef.current;
      if (!el) return;
      setIsDescriptionOverflowing(el.scrollHeight > el.clientHeight + 2);
    };
    const timer = window.setTimeout(checkOverflow, 30);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [selectedGame]);

  if (isLoading || !selectedGame) {
    return (
      <div className="tactile-panel backend-loading-box">
        <div className="tactile-spinner" />
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900 }}>
          Cargando biblioteca de juegos...
        </h2>
      </div>
    );
  }

  const categories = ['Todas', ...Array.from(new Set(games.flatMap((g) => g.categories)))];

  const displayedGames = games
    .filter((g) => {
      const matchSearch = g.title.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'Todas' || g.categories.includes(activeCategory);
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      return b.likes - a.likes;
    });

  const totalVotes = selectedGame.likes + selectedGame.dislikes;
  const positivePercent =
    totalVotes > 0 ? Math.round((selectedGame.likes / totalVotes) * 100) : 96;

  const handleCardClick = (game: Game) => {
    if (window.innerWidth <= 768) {
      navigate(`/play/${game.alias}`);
    } else {
      setSelectedGame(game);
    }
  };

  return (
    <div className="launchbox-split-layout">
      {/* COLUMNA IZQUIERDA */}
      <div className="launchbox-left-library">
        <div
          className="tactile-panel"
          style={{
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-soft)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            placeholder="Buscar juego en la biblioteca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              outline: 'none',
              fontSize: '0.9rem',
            }}
          />

          <div className="custom-dropdown-container">
            <button
              type="button"
              className="tactile-btn-dark"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setIsSortOpen((prev) => !prev)}
            >
              <span>Orden: {sortBy === 'popular' ? 'Populares' : 'A - Z'}</span>
              <span>▾</span>
            </button>

            {isSortOpen && (
              <div className="custom-dropdown-menu">
                <button
                  type="button"
                  className={`custom-dropdown-item ${sortBy === 'popular' ? 'selected' : ''}`}
                  onClick={() => {
                    setSortBy('popular');
                    setIsSortOpen(false);
                  }}
                >
                  Más Populares
                </button>
                <button
                  type="button"
                  className={`custom-dropdown-item ${sortBy === 'az' ? 'selected' : ''}`}
                  onClick={() => {
                    setSortBy('az');
                    setIsSortOpen(false);
                  }}
                >
                  Alfabético (A - Z)
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="categories-single-row">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`tactile-btn-dark ${isActive ? 'active-state' : ''}`}
                onClick={() => setActiveCategory(cat)}
                style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '11px' }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="launchbox-cards-grid">
          {displayedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isSelected={selectedGame.id === game.id}
              imageHeight={122}
              onClick={() => handleCardClick(game)}
              onDoubleClick={() => navigate(`/play/${game.alias}`)}
            />
          ))}
        </div>
      </div>

      {/* COLUMNA DERECHA: INSPECTOR */}
      <aside
        className="launchbox-detail-inspector tactile-panel"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(16,12,28,0.35) 0%, rgba(16,12,28,0.92) 48%, rgba(16,12,28,0.98) 100%), url(${selectedGame.coverUrl})`,
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', zIndex: 2, marginTop: 'auto', marginBottom: '12px' }}>
          <img
            src={selectedGame.coverUrl}
            alt={selectedGame.title}
            style={{
              width: '108px',
              height: '138px',
              objectFit: 'cover',
              borderRadius: '14px',
              border: '2px solid rgba(255,255,255,0.35)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.7)',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'var(--primary-mid)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                {selectedGame.ageRating}
              </span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  color: '#f1f5f9',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                {selectedGame.tipo}
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.15, color: '#ffffff' }}>
              {selectedGame.title}
            </h2>

            <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              {selectedGame.developer || 'UDO Games'} • {selectedGame.releaseDate || '2026'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 2 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: 'rgba(18, 12, 31, 0.85)',
              padding: '10px 14px',
              borderRadius: '14px',
              boxShadow: 'var(--bevel-inset)',
            }}
          >
            <button
              type="button"
              className="tactile-btn-purple"
              onClick={() => navigate(`/play/${selectedGame.alias}`)}
              style={{ padding: '9px 24px', fontSize: '0.94rem' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>JUGAR AHORA</span>
            </button>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Recepción</div>
              <div style={{ fontWeight: 900, color: '#ffd166', fontSize: '0.88rem' }}>
                {positivePercent}% Positivo ({totalVotes})
              </div>
            </div>
          </div>

          {/* Solo muestra "Leer más..." o "Mostrar menos" si el párrafo realmente rebasa las 2 líneas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: '#c77dff', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                Descripción
              </h4>
              {(isDescriptionOverflowing || isReadMoreOpen) && (
                <button
                  type="button"
                  onClick={() => setIsReadMoreOpen((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffd166',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {isReadMoreOpen ? 'Mostrar menos' : 'Leer más...'}
                </button>
              )}
            </div>

            <p
              ref={descTextRef}
              className={isReadMoreOpen ? undefined : 'line-clamp-2'}
              style={{
                fontSize: '0.84rem',
                color: '#f1f5f9',
                lineHeight: 1.4,
                maxHeight: isReadMoreOpen ? '78px' : '2.8em',
                overflowY: isReadMoreOpen ? 'auto' : 'hidden',
              }}
            >
              {selectedGame.description}
            </p>

            <h4 style={{ color: '#c77dff', fontSize: '0.76rem', textTransform: 'uppercase', marginTop: '4px' }}>
              Controles
            </h4>
            <p
              className="line-clamp-2"
              style={{
                fontSize: '0.8rem',
                color: '#ffffff',
                background: 'rgba(18, 12, 31, 0.85)',
                padding: '8px 12px',
                borderRadius: '10px',
                borderLeft: '4px solid var(--primary-top)',
              }}
            >
              {selectedGame.controls}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {selectedGame.categories.map((cat) => (
              <span
                key={cat}
                style={{
                  background: 'rgba(37, 26, 58, 0.9)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.16)',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};