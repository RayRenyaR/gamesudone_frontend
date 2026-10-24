import React, { useState, useEffect } from 'react';
import { type Game, GameCard } from '../components/GameCard';
import { GamePlayerView } from '../components/GamePlayerView';
import './CatalogStyles.css';

const GROUP_LINKS = [
  { id: 'catalogo', label: 'Catálogo (Inicio)' },
  { id: 'foro', label: 'Foro (Grupo Cyan)' },
  { id: 'mascota', label: 'Mascota Virtual (Verde)' },
  { id: 'pase', label: 'Pase de Batalla (Blanco)' },
  { id: 'ranked', label: 'Ranked y Gacha (Cyan)' },
  { id: 'chat', label: 'Chat Social (Rojo)' },
];

const ALL_CATEGORIES = [
  'Carreras',
  'Acción',
  'Microjuegos',
  'Estrategia',
  'Supervivencia',
  'Juegos de Mesa',
  'Aventura',
  'Arcade',
  'Puzzle',
];

const DEFAULT_LEADERBOARD = [
  { player: 'Rayner_Dev', score: 9850 },
  { player: 'Gabriel_G', score: 9420 },
  { player: 'Nicolas_Lider', score: 8900 },
  { player: 'Osmer_Pro', score: 8450 },
  { player: 'Maxi_Gamer', score: 8100 },
  { player: 'Player_Cyan', score: 7600 },
  { player: 'Zomboid_Fan', score: 7200 },
  { player: 'ChessMaster', score: 6950 },
  { player: 'PixelRunner', score: 6400 },
  { player: 'Rookie_UDO', score: 5900 },
];

// 10 Juegos con la nueva paleta de colores en sus portadas de prueba
const MOCK_GAMES: Game[] = [
  {
    id: 1,
    title: 'MicroChaos UDO (WarioWare)',
    description: 'Supera microjuegos frenéticos de pocos segundos antes de perder tus 4 vidas.',
    controls: 'Usa el Ratón (Clic izquierdo) y las flechas del teclado o WASD según la instrucción en pantalla.',
    categories: ['Microjuegos', 'Arcade', 'Acción'],
    ageRating: 'Todo público',
    coverUrl: 'https://placehold.co/650x350/335C67/FFF3B0?text=1.+MicroChaos+Godot',
    isRecommended: true,
    hasRanked: true,
    leaderboard: DEFAULT_LEADERBOARD,
    likes: 142,
    dislikes: 12,
  },
  {
    id: 2,
    title: 'Nitro Drift 2026',
    description: 'Carreras callejeras a máxima velocidad con derrapes y pistas nocturnas.',
    controls: 'Flechas / WASD para conducir, Barra Espaciadora para freno de mano y Shift para Nitro.',
    categories: ['Carreras', 'Acción'],
    ageRating: 'Todo público',
    coverUrl: 'https://placehold.co/650x350/9E2A2B/FFF3B0?text=2.+Nitro+Drift+2026',
    isRecommended: true,
    hasRanked: true,
    leaderboard: DEFAULT_LEADERBOARD,
    likes: 98,
    dislikes: 15,
  },
  {
    id: 3,
    title: 'Project Zomboid Lite',
    description: 'Sobrevive al apocalipsis recolectando recursos y defendiendo tu refugio.',
    controls: 'WASD para moverte, E para interactuar con objetos y Clic izquierdo para atacar.',
    categories: ['Supervivencia', 'Acción', 'Estrategia'],
    ageRating: '+13',
    coverUrl: 'https://placehold.co/650x350/1D353C/E09F3E?text=3.+Project+Zomboid+Lite',
    isRecommended: true,
    hasRanked: true,
    leaderboard: DEFAULT_LEADERBOARD,
    likes: 210,
    dislikes: 19,
  },
  {
    id: 4,
    title: 'Ajedrez Maestro Online',
    description: 'El clásico juego de estrategia 1v1 con reloj por turnos y emparejamiento.',
    controls: 'Haz clic izquierdo sobre una pieza para ver sus movimientos válidos y clic en la casilla destino.',
    categories: ['Juegos de Mesa', 'Estrategia'],
    ageRating: 'Todo público',
    coverUrl: 'https://placehold.co/650x350/E09F3E/1D353C?text=4.+Ajedrez+Maestro',
    isRecommended: true,
    hasRanked: true,
    leaderboard: DEFAULT_LEADERBOARD,
    likes: 85,
    dislikes: 8,
  },
  {
    id: 5,
    title: 'Karting Retro Turbo',
    description: 'Compite en circuitos llenos de obstáculos e ítems especiales.',
    controls: 'WASD para manejar y tecla Q para lanzar objetos especiales.',
    categories: ['Carreras', 'Arcade'],
    ageRating: 'Todo público',
    coverUrl: 'https://placehold.co/650x350/335C67/E09F3E?text=5.+Karting+Retro+Turbo',
    isRecommended: true,
    hasRanked: true,
    leaderboard: DEFAULT_LEADERBOARD,
    likes: 64,
    dislikes: 9,
  },
  {
    id: 6,
    title: 'Fórmula Pixel GP',
    description: 'Simulador de carreras de monoplazas con gestión de neumáticos y clima.',
    controls: 'Flechas de dirección para girar y acelerar. Tecla R para entrar a boxes.',
    categories: ['Carreras', 'Estrategia'],
    ageRating: 'Todo público',
    coverUrl: 'https://placehold.co/650x350/9E2A2B/E09F3E?text=6.+Formula+Pixel+GP',
    isRecommended: true,
    hasRanked: true,
    leaderboard: DEFAULT_LEADERBOARD,
    likes: 73,
    dislikes: 11,
  },
  {
    id: 7,
    title: 'Cyber Rally X',
    description: 'Carreras todoterreno en desiertos y montañas con físicas extremas.',
    controls: 'WASD para controlar el vehículo y balancear el peso en los saltos.',
    categories: ['Carreras', 'Aventura'],
    ageRating: '+13',
    coverUrl: 'https://placehold.co/650x350/1D353C/FFF3B0?text=7.+Cyber+Rally+X',
    isRecommended: true,
    hasRanked: false,
    likes: 51,
    dislikes: 7,
  },
  {
    id: 8,
    title: 'Domino & Uno Party',
    description: 'Mesas clásicas para jugar con amigos o contra bots.',
    controls: 'Usa el ratón para seleccionar la carta o ficha de tu mano.',
    categories: ['Juegos de Mesa', 'Arcade'],
    ageRating: 'Todo público',
    coverUrl: 'https://placehold.co/650x350/E09F3E/9E2A2B?text=8.+Domino+Party',
    isRecommended: true,
    hasRanked: true,
    leaderboard: DEFAULT_LEADERBOARD,
    likes: 112,
    dislikes: 14,
  },
  {
    id: 9,
    title: 'Ruta 66 Motorbikes',
    description: 'Esquiva el tráfico en motocicletas de alta cilindrada contra el reloj.',
    controls: 'Teclas A y D para inclinar la moto, W para acelerar.',
    categories: ['Carreras', 'Acción', 'Arcade'],
    ageRating: '+13',
    coverUrl: 'https://placehold.co/650x350/335C67/FFF3B0?text=9.+Ruta+66+Bikes',
    isRecommended: true,
    hasRanked: true,
    leaderboard: DEFAULT_LEADERBOARD,
    likes: 49,
    dislikes: 6,
  },
  {
    id: 10,
    title: 'Dungeon Puzzle Quest',
    description: 'Resuelve acertijos en calabozos antiguos antes de que se agote el tiempo.',
    controls: 'Ratón para girar las piezas del rompecabezas.',
    categories: ['Puzzle', 'Aventura'],
    ageRating: 'Todo público',
    coverUrl: 'https://placehold.co/650x350/9E2A2B/FFF3B0?text=10.+Dungeon+Puzzle',
    isRecommended: true,
    hasRanked: false,
    likes: 88,
    dislikes: 5,
  },
];

export const GameCatalog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Estado para mostrar u ocultar la barra lateral izquierda
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Estado del juego seleccionado para abrir la Pestaña de Juego
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  // Estado del índice actual (0 al 9) de los 10 juegos recomendados
  const recommendedGames = MOCK_GAMES.slice(0, 10);
  const [currentRecIndex, setCurrentRecIndex] = useState<number>(0);

  // Temporizador automático que pasa al siguiente juego recomendado cada 3 segundos
  useEffect(() => {
    if (activeGame !== null) return; // Pausa el carrusel si estamos dentro de un juego

    const interval = window.setInterval(() => {
      setCurrentRecIndex((prevIndex) => (prevIndex + 1) % recommendedGames.length);
    }, 3000); // 3000 ms = 3 segundos

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
    setActiveGame(null); // Si toca una categoría, regresa al catálogo filtrado
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

  const filteredGames = MOCK_GAMES.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategories =
      selectedCategories.length === 0 ||
      selectedCategories.every((cat) => game.categories.includes(cat));

    return matchesSearch && matchesCategories;
  });

  const isFiltering = selectedCategories.length > 0 || searchQuery.trim() !== '';

  return (
    <div className="catalog-layout">
      {/* ================= BARRA SUPERIOR FIJA ================= */}
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
          onClick={() => alert('Redirigiendo al perfil del usuario (Próximamente)')}
        >
          👤
        </button>
      </header>

      {/* ================= CUERPO PRINCIPAL ================= */}
      <div className="main-body">
        {/* BARRA LATERAL CON BOTÓN FICHA SOBRESALIENTE */}
        <div className="sidebar-wrapper">
          <aside className={`left-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
            <div className="sidebar-top-groups">
              <div className="sidebar-title">Navegación</div>
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

            <div className="sidebar-bottom-categories">
              <div className="sidebar-title">Categorías</div>
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
          </aside>

          {/* Botón tipo Ficha que cambia de dirección al ocultar/mostrar */}
          <button
            className="sidebar-ficha-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* ZONA DERECHA: PESTAÑA DE JUEGO O CATÁLOGO */}
        <main className="catalog-content">
          {activeGame ? (
            /* ===== VISTA DE PESTAÑA DE JUEGO (BOCETO PESTAÑA DE JUEGO) ===== */
            <GamePlayerView
              game={activeGame}
              onBack={() => setActiveGame(null)}
            />
          ) : !isFiltering ? (
            /* ===== VISTA PRINCIPAL CON CARRUSEL DE 10 RECOMENDADOS ===== */
            <>
              <section className="recomendados-section">
                <h2 className="section-header">Recomendados</h2>

                <div className="carousel-container">
                  <button
                    className="carousel-arrow-btn"
                    onClick={handlePrevRecommended}
                    title="Juego anterior"
                  >
                    ◀
                  </button>

                  <div className="carousel-main-frame">
                    <GameCard
                      game={recommendedGames[currentRecIndex]}
                      size="featured"
                      onPlayClick={(game) => setActiveGame(game)}
                    />
                  </div>

                  <button
                    className="carousel-arrow-btn"
                    onClick={handleNextRecommended}
                    title="Siguiente juego"
                  >
                    ▶
                  </button>
                </div>

                {/* Indicador inferior de por dónde vas de los 10 juegos recomendados */}
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

              <section>
                <h2 className="section-header">Juegos</h2>
                <div className="games-grid">
                  {MOCK_GAMES.map((game) => (
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
            /* ===== VISTA FILTRADA POR CATEGORÍAS O BÚSQUEDA ===== */
            <section>
              <h2 className="section-header">
                Juegos:{' '}
                {selectedCategories.length > 0
                  ? selectedCategories.join(' + ')
                  : `"${searchQuery}"`}
              </h2>

              {filteredGames.length === 0 ? (
                <p>
                  No se encontraron juegos que coincidan con todos los filtros seleccionados.
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
    </div>
  );
};