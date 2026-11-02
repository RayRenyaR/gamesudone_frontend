import React, { useState, useEffect } from 'react';
import { type Game, GameCard } from '../components/GameCard';
import { GamePlayerView } from '../components/GamePlayerView';
import { FloatingChatBubble } from '../components/FloatingChatBubble';
import './CatalogStyles.css';

const API_BASE_URL = 'http://localhost:8080/api';

const GROUP_LINKS = [
  { id: 'catalogo', label: 'Catálogo (Inicio)' },
  { id: 'foro', label: 'Foro (Grupo Cyan)' },
  { id: 'mascota', label: 'Mascota Virtual (Verde)' },
  { id: 'pase', label: 'Pase de Batalla (Blanco)' },
  { id: 'gacha', label: 'Gacha (Cyan)' },
  { id: 'ranked', label: 'Ranked (Cyan)' },
];

const DEFAULT_CATEGORIES = [
  '2 Jugadores',
  'Autos y Carreras',
  'Acción y Disparos',
  'Chicas y Cocina',
  'Puzzles y Lógica',
  'Deportes y Fútbol',
];

// Datos de respaldo por si pruebas la interfaz antes de encender Spring Boot
const FALLBACK_DB_GAMES: Game[] = [
  {
    id: 4,
    title: 'UDOWare',
    alias: 'udoware',
    description: 'Colección frenética de microjuegos bizarros al estilo WarioWare.',
    controls: 'Ratón (Clic y Movimiento) y Teclado',
    categories: ['Acción y Disparos'],
    ageRatingName: 'Niños (+7)',
    ageBadgeColor: '#ffc107',
    coverUrl: 'https://placehold.co/650x350/335C67/FFF3B0?text=UDOWare',
    previewUrl: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
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
    ageRatingName: 'Para todos (+3)',
    ageBadgeColor: '#28a745',
    coverUrl: 'https://placehold.co/650x350/1D353C/E09F3E?text=Fireboy+%26+Watergirl',
    previewUrl: 'https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif',
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
    ageRatingName: 'Niños (+7)',
    ageBadgeColor: '#ffc107',
    coverUrl: 'https://placehold.co/650x350/9E2A2B/FFF3B0?text=Moto+X3M+Cyber+Race',
    previewUrl: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif',
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
    ageRatingName: 'Adolescentes (+12)',
    ageBadgeColor: '#fd7e14',
    coverUrl: 'https://placehold.co/650x350/E09F3E/1D353C?text=Super+Arena+Brawlers',
    previewUrl: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif',
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

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState<boolean>(true);
  const [isCatDrawerOpen, setIsCatDrawerOpen] = useState<boolean>(true);

  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [currentRecIndex, setCurrentRecIndex] = useState<number>(0);

  // Estado que detiene el carrusel cuando el usuario pone el cursor encima
  const [isCarouselPaused, setIsCarouselPaused] = useState<boolean>(false);

  // 1. Consumir GET http://localhost:8080/api/games con el nuevo DTO plano
  useEffect(() => {
    const loadGamesFromBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/games`);
        if (!response.ok) throw new Error('Error al conectar con /api/games');
        const dbGames = await response.json();

        if (Array.isArray(dbGames) && dbGames.length > 0) {
          const normalizedGames: Game[] = dbGames.map((g: Record<string, unknown>, idx: number) => ({
            id: Number(g.id || idx + 1),
            title: String(g.title || 'Juego Sin Título'),
            alias: String(g.alias || 'udoware'),
            description: String(g.description || ''),
            controls: String(g.instructions || g.controls || 'Teclado y Ratón'),
            categories: Array.isArray(g.categories)
              ? g.categories.map(String)
              : g.categoryName
              ? [String(g.categoryName)]
              : ['Acción y Disparos'],
            ageRatingName: String(g.ageRatingName || g.ageRating || 'Para todos (+3)'),
            ageBadgeColor: String(g.ageBadgeColor || '#28a745'),
            coverUrl: String(
              g.portadaUrl ||
                g.portada_url ||
                g.coverUrl ||
                `https://placehold.co/650x350/335C67/FFF3B0?text=${encodeURIComponent(String(g.title || 'Game'))}`
            ),
            previewUrl: g.previewUrl
              ? String(g.previewUrl)
              : g.preview_url
              ? String(g.preview_url)
              : 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
            gameUrl: g.gameUrl
              ? String(g.gameUrl)
              : g.game_url
              ? String(g.game_url)
              : '/game-export/index.html',
            descargaUrl: g.descargaUrl
              ? String(g.descargaUrl)
              : g.descarga_url
              ? String(g.descarga_url)
              : null,
            tipo: (g.tipo as 'WEB' | 'DESCARGABLE') || 'WEB',
            isRecommended: Boolean(g.isFeatured ?? g.is_featured ?? true),
            hasRanked: true,
            likes: Number(g.likes || 0),
            dislikes: Number(g.dislikes || 0),
          }));
          setGames(normalizedGames);
        }
      } catch {
        console.warn('Usando catálogo local de respaldo mientras enciendes Spring Boot en :8080');
      }
    };

    loadGamesFromBackend();
  }, []);

  const recommendedGames = games.slice(0, 10);

  // 2. Carrusel automático que se pausa al poner el cursor encima (isCarouselPaused)
  useEffect(() => {
    if (activeGame !== null || recommendedGames.length === 0 || isCarouselPaused) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentRecIndex((prev) => (prev + 1) % recommendedGames.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeGame, recommendedGames.length, isCarouselPaused]);

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

  // Combina las categorías por defecto con cualquier categoría nueva que venga de la BD
  const allAvailableCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...games.flatMap((g) => g.categories)])
  );

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

            <div className="drawer-section">
              <button
                className="drawer-header-btn"
                onClick={() => setIsCatDrawerOpen(!isCatDrawerOpen)}
              >
                <span>Categorías</span>
                <span>{isCatDrawerOpen ? '▾' : '▸'}</span>
              </button>

              <div className={`drawer-persiana-body ${!isCatDrawerOpen ? 'closed' : ''}`}>
                {allAvailableCategories.map((category) => {
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

                  {/* Se pausa el carrusel al entrar con el mouse y se reanuda al salir */}
                  <div
                    className="carousel-container"
                    onMouseEnter={() => setIsCarouselPaused(true)}
                    onMouseLeave={() => setIsCarouselPaused(false)}
                  >
                    <button
                      className="carousel-arrow-btn"
                      onClick={handlePrevRecommended}
                      title="Anterior"
                    >
                      ◀
                    </button>

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

      <FloatingChatBubble />
    </div>
  );
};