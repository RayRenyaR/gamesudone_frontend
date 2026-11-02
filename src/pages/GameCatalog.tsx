import React, { useState, useEffect } from 'react';
import { type Game, GameCard } from '../components/GameCard';
import { GamePlayerView } from '../components/GamePlayerView';
import { FloatingChatBubble } from '../components/FloatingChatBubble';
import './CatalogStyles.css';

const API_BASE_URL = 'http://localhost:8080/api';

// Enlaces corregidos según pagina principal corregida.jpg (Gacha y Ranked separados, sin Chat fijo)
const GROUP_LINKS = [
  { id: 'catalogo', label: 'Catálogo (Inicio)' },
  { id: 'foro', label: 'Foro (Grupo Cyan)' },
  { id: 'mascota', label: 'Mascota Virtual (Verde)' },
  { id: 'pase', label: 'Pase de Batalla (Blanco)' },
  { id: 'gacha', label: 'Gacha (Cyan)' },
  { id: 'ranked', label: 'Ranked (Cyan)' },
];

// Categorías oficiales de la tabla `categories` en base de datos.sql
const CATEGORY_MAP: Record<number, string> = {
  1: '2 Jugadores',
  2: 'Autos y Carreras',
  3: 'Acción y Disparos',
  4: 'Chicas y Cocina',
  5: 'Puzzles y Lógica',
  6: 'Deportes y Fútbol',
};

// Clasificaciones oficiales de la tabla `age_ratings` en base de datos.sql
const AGE_RATING_MAP: Record<number, string> = {
  1: 'Para todos (+3)',
  2: 'Niños (+7)',
  3: 'Adolescentes (+12)',
};

const ALL_CATEGORIES = Object.values(CATEGORY_MAP);

// Respaldo fiel a `ludustard_db` con GIFs animados por si el backend 8080 está apagado
const FALLBACK_DB_GAMES: Game[] = [
  {
    id: 4,
    title: 'UDOWare',
    alias: 'udoware',
    description: 'Colección frenética de microjuegos bizarros al estilo WarioWare.',
    controls: 'Ratón (Clic y Movimiento) y Teclado',
    categories: ['Acción y Disparos'],
    ageRating: 'Niños (+7)',
    coverUrl: 'https://placehold.co/650x350/335C67/FFF3B0?text=UDOWare+(Portada)',
    previewGifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzh6dTRxN2R5b3k0ZzB2enN3eHBrbmJ4NnZpcnZ5amN6eSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/13HgwGsXF0aiGY/giphy.gif',
    gameUrl: '/game-export/index.html',
    tipo: 'WEB',
    isRecommended: true,
    hasRanked: true,
    likes: 142,
    dislikes: 8,
  },
  {
    id: 1,
    title: 'Fireboy and Watergirl Forest',
    alias: 'fireboy-watergirl-forest',
    description: 'Aventura cooperativa de puzzle en el templo del bosque.',
    controls: 'WASD para Watergirl y Flechas para Fireboy',
    categories: ['2 Jugadores', 'Puzzles y Lógica'],
    ageRating: 'Para todos (+3)',
    coverUrl: 'https://placehold.co/650x350/1D353C/E09F3E?text=Fireboy+%26+Watergirl',
    previewGifUrl: 'https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif',
    gameUrl: 'https://cdn.ludustard.com/games/fireboy/index.html',
    tipo: 'WEB',
    isRecommended: true,
    hasRanked: true,
    likes: 950,
    dislikes: 14,
  },
  {
    id: 2,
    title: 'Moto X3M Cyber Race',
    alias: 'moto-x3m-cyber',
    description: 'Carreras de motos acrobáticas con obstáculos peligrosos.',
    controls: 'Flecha arriba acelera, laterales balancean',
    categories: ['Autos y Carreras'],
    ageRating: 'Niños (+7)',
    coverUrl: 'https://placehold.co/650x350/9E2A2B/FFF3B0?text=Moto+X3M+Cyber+Race',
    previewGifUrl: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif',
    gameUrl: 'https://cdn.ludustard.com/games/motox3m/index.html',
    tipo: 'WEB',
    isRecommended: true,
    hasRanked: true,
    likes: 1420,
    dislikes: 25,
  },
  {
    id: 3,
    title: 'Super Arena Brawlers PC',
    alias: 'super-arena-brawlers',
    description: 'Juego de peleas 3D multijugador con gráficos de alta fidelidad.',
    controls: 'Requiere descargar el launcher. Compatible con teclado o mando USB.',
    categories: ['Acción y Disparos'],
    ageRating: 'Adolescentes (+12)',
    coverUrl: 'https://placehold.co/650x350/E09F3E/1D353C?text=Super+Arena+Brawlers',
    previewGifUrl: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif',
    descargaUrl: 'https://cdn.ludustard.com/launchers/SuperArenaSetup_v1.0.exe',
    tipo: 'DESCARGABLE',
    isRecommended: true,
    hasRanked: true,
    likes: 890,
    dislikes: 19,
  },
];

export const GameCatalog: React.FC = () => {
  const [games, setGames] = useState<Game[]>(FALLBACK_DB_GAMES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Estado general para colapsar toda la barra lateral izquierda
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Estados para abrir/cerrar tipo persiana las dos gavetas amarillas
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState<boolean>(true);
  const [isCatDrawerOpen, setIsCatDrawerOpen] = useState<boolean>(true);

  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [currentRecIndex, setCurrentRecIndex] = useState<number>(0);

  // 1. Cargar los juegos desde Spring Boot (GET http://localhost:8080/api/games)
  useEffect(() => {
    const loadGamesFromBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/games`);
        if (!response.ok) throw new Error('No se pudo obtener /api/games');
        const dbGames = await response.json();

        if (Array.isArray(dbGames) && dbGames.length > 0) {
          const normalizedGames: Game[] = dbGames.map((g: Record<string, unknown>, idx: number) => {
            const catId = Number(g.category_id || g.categoryId || 3);
            const ageId = Number(g.age_rating_id || g.ageRatingId || 1);
            const rawCategories = Array.isArray(g.categories)
              ? g.categories.map(String)
              : [String(g.categoryName || CATEGORY_MAP[catId] || 'Acción y Disparos')];

            return {
              id: Number(g.id || idx + 1),
              title: String(g.title || 'Juego Sin Título'),
              alias: String(g.alias || 'udoware'),
              description: String(g.description || ''),
              controls: String(g.instructions || g.controls || 'Teclado y Ratón'),
              categories: rawCategories,
              ageRating: String(g.ageRating || AGE_RATING_MAP[ageId] || 'Para todos (+3)'),
              coverUrl: String(
                g.portada_url ||
                  g.portadaUrl ||
                  g.coverUrl ||
                  `https://placehold.co/650x350/335C67/FFF3B0?text=${encodeURIComponent(String(g.title || 'Game'))}`
              ),
              previewGifUrl: String(
                g.preview_url ||
                  g.previewGifUrl ||
                  'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif'
              ),
              gameUrl: g.game_url ? String(g.game_url) : g.gameUrl ? String(g.gameUrl) : '/game-export/index.html',
              descargaUrl: g.descarga_url ? String(g.descarga_url) : null,
              tipo: (g.tipo as 'WEB' | 'DESCARGABLE') || 'WEB',
              isRecommended: Boolean(g.is_featured ?? g.isFeatured ?? true),
              hasRanked: true,
              likes: Number(g.likes || 0),
              dislikes: Number(g.dislikes || 0),
            };
          });
          setGames(normalizedGames);
        }
      } catch {
        console.warn('Usando catálogo local de respaldo mientras enciendes Spring Boot en :8080');
      }
    };

    loadGamesFromBackend();
  }, []);

  const recommendedGames = games.slice(0, 10);

  // Carrusel automático cada 3 segundos
  useEffect(() => {
    if (activeGame !== null || recommendedGames.length === 0) return;

    const interval = window.setInterval(() => {
      setCurrentRecIndex((prev) => (prev + 1) % recommendedGames.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeGame, recommendedGames.length]);

  const handleNextRecommended = () => {
    setCurrentRecIndex((prev) => (prev + 1) % recommendedGames.length);
  };

  const handlePrevRecommended = () => {
    setCurrentRecIndex((prev) =>
      prev === 0 ? recommendedGames.length - 1 : prev - 1
    );
  };

  const toggleCategory = (category: string) => {
    setActiveGame(null);
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const resetToMainCatalog = () => {
    setActiveGame(null);
    setSelectedCategories([]);
    setSearchQuery('');
  };

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategories =
      selectedCategories.length === 0 ||
      selectedCategories.every((cat) => game.categories.includes(cat));
    return matchesSearch && matchesCategories;
  });

  const isFiltering = selectedCategories.length > 0 || searchQuery.trim() !== '';

  return (
    <div className="catalog-layout">
      {/* ================= BARRA SUPERIOR ================= */}
      <header className="top-navbar">
        <div className="logo-box" onClick={resetToMainCatalog}>
          🎮 gamesUDONE
        </div>

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar juego por nombre..."
            value={searchQuery}
            onChange={(e) => {
              setActiveGame(null);
              setSearchQuery(e.target.value);
            }}
          />
          <span>🔍</span>
        </div>

        <button
          className="profile-btn"
          title="Ir al Perfil"
          onClick={() => alert('Redirigiendo al perfil del usuario')}
        >
          👤
        </button>
      </header>

      {/* ================= CUERPO PRINCIPAL ================= */}
      <div className="main-body">
        <div className="sidebar-wrapper">
          <aside className={`left-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
            {/* GAVETA 1: NAVEGACIÓN (Se abre/cierra tipo persiana) */}
            <div className="drawer-section">
              <button
                className="drawer-header-btn"
                onClick={() => setIsNavDrawerOpen(!isNavDrawerOpen)}
              >
                <span>Navegación</span>
                <span>{isNavDrawerOpen ? '▾' : '▸'}</span>
              </button>

              <div className={`drawer-persiana-body ${!isNavDrawerOpen ? 'closed' : ''}`}>
                {GROUP_LINKS.map((link) => (
                  <button
                    key={link.id}
                    className={`nav-item-btn ${
                      link.id === 'catalogo' && !isFiltering && !activeGame ? 'active' : ''
                    }`}
                    onClick={() => {
                      if (link.id === 'catalogo') {
                        resetToMainCatalog();
                      } else {
                        alert(`Redirigiendo al módulo: ${link.label}`);
                      }
                    }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GAVETA 2: CATEGORÍAS (Se abre/cierra tipo persiana) */}
            <div className="drawer-section">
              <button
                className="drawer-header-btn"
                onClick={() => setIsCatDrawerOpen(!isCatDrawerOpen)}
              >
                <span>Categorías</span>
                <span>{isCatDrawerOpen ? '▾' : '▸'}</span>
              </button>

              <div className={`drawer-persiana-body ${!isCatDrawerOpen ? 'closed' : ''}`}>
                {ALL_CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  return (
                    <button
                      key={category}
                      className={`category-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleCategory(category)}
                    >
                      {isSelected ? `✓ ${category}` : category}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <button
            className="sidebar-ficha-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* ZONA DERECHA: GAMEVIEWER O CATÁLOGO */}
        <main className="catalog-content">
          {activeGame ? (
            <GamePlayerView
              game={activeGame}
              onBack={() => setActiveGame(null)}
            />
          ) : !isFiltering ? (
            <>
              {recommendedGames.length > 0 && (
                <section className="recomendados-section">
                  <h2 className="section-header">Recomendados</h2>

                  <div className="carousel-container">
                    <button
                      className="carousel-arrow-btn"
                      onClick={handlePrevRecommended}
                      title="Anterior"
                    >
                      ◀
                    </button>

                    {/* Ventana con animación de desplazamiento horizontal */}
                    <div className="carousel-viewport">
                      <div
                        className="carousel-track"
                        style={{
                          transform: `translateX(-${currentRecIndex * 100}%)`,
                        }}
                      >
                        {recommendedGames.map((recGame) => (
                          <div key={recGame.id} className="carousel-slide">
                            <GameCard
                              game={recGame}
                              size="featured"
                              onPlayClick={(g) => setActiveGame(g)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      className="carousel-arrow-btn"
                      onClick={handleNextRecommended}
                      title="Siguiente"
                    >
                      ▶
                    </button>
                  </div>

                  <div className="carousel-indicators">
                    <div className="carousel-dots">
                      {recommendedGames.map((g, index) => (
                        <span
                          key={g.id}
                          className={`carousel-dot ${
                            index === currentRecIndex ? 'active' : ''
                          }`}
                          onClick={() => setCurrentRecIndex(index)}
                          title={g.title}
                        />
                      ))}
                    </div>
                    <span className="carousel-counter-text">
                      Recomendado {currentRecIndex + 1} de {recommendedGames.length}
                    </span>
                  </div>
                </section>
              )}

              <section>
                <h2 className="section-header">Juegos</h2>
                <div className="games-grid">
                  {games.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPlayClick={(g) => setActiveGame(g)}
                    />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section>
              <h2 className="section-header">
                Juegos:{' '}
                {selectedCategories.length > 0
                  ? selectedCategories.join(' + ')
                  : `"${searchQuery}"`}
              </h2>

              {filteredGames.length === 0 ? (
                <p style={{ textAlign: 'center' }}>
                  No se encontraron juegos con esos filtros.
                </p>
              ) : (
                <div className="games-grid">
                  {filteredGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPlayClick={(g) => setActiveGame(g)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* BURBUJA FLOTANTE DE CHAT ARRASTRABLE */}
      <FloatingChatBubble />
    </div>
  );
};