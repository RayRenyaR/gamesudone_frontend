export interface ScoreEntry {
  player: string;
  score: number;
  gameTitle?: string;
}

export interface Game {
  id: number;
  title: string;
  alias: string;
  description: string;
  controls: string;
  categories: string[];
  ageRating: string;
  ageBadgeColor?: string;
  coverUrl: string;
  previewGifUrl?: string;
  gameUrl?: string | null;
  descargaUrl?: string | null;
  tipo: 'WEB' | 'FLASH' | 'DESCARGABLE';
  isRecommended?: boolean;
  hasRanked?: boolean;
  likes: number;
  dislikes: number;
  developer?: string;
  releaseDate?: string;
}

export const API_BASE_URL = 'http://localhost:8080/api';

export const DEFAULT_LEADERBOARD: ScoreEntry[] = [
  { player: 'Rayner_UDO', score: 9850, gameTitle: 'UDOWare' },
  { player: 'Gabriel_UI', score: 9420, gameTitle: 'UDOWare' },
  { player: 'Nicolas_Lider', score: 8900, gameTitle: 'Chess College' },
  { player: 'Osmer_Backend', score: 8450, gameTitle: 'WarioWare UDO' },
  { player: 'Ruben_Dev', score: 8150, gameTitle: 'UDOWare' },
];

// Catálogo local en caso de que el Backend de Spring Boot esté apagado
export const FALLBACK_GAMES: Game[] = [
  {
    id: 1,
    title: 'UDOWare: MicroChaos',
    alias: 'udoware',
    description: 'Supera microjuegos frenéticos de 4 segundos inspirados en la vida universitaria antes de perder tus 4 vidas.',
    controls: 'Ratón (Clic izquierdo para aplastar) y Teclado según la orden.',
    categories: ['Microjuegos', 'Arcade', 'Acción'],
    ageRating: 'Niños (+7)',
    ageBadgeColor: '#7b2cbf',
    coverUrl: 'https://placehold.co/800x450/240046/ffffff?text=UDOWare:+MicroChaos',
    previewGifUrl: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
    gameUrl: '/game-export/index.html',
    tipo: 'WEB',
    isRecommended: true,
    hasRanked: true,
    likes: 342,
    dislikes: 12,
    developer: 'Grupo Amarillo UDO',
    releaseDate: '2026',
  },
  {
    id: 2,
    title: 'Chess College (Ajedrez UDO)',
    alias: 'ajedrez',
    description: 'El clásico juego de estrategia reinventado con trampas ocultas en el tablero y modificadores multijugador.',
    controls: 'Clic izquierdo para seleccionar piezas.',
    categories: ['Estrategia', '2 Jugadores', 'Puzzles'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#5a189a',
    coverUrl: 'https://placehold.co/800x450/1d1430/e5a93c?text=Chess+College+UDO',
    previewGifUrl: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif',
    gameUrl: 'https://chesscollege.onrender.com/',
    tipo: 'WEB',
    isRecommended: true,
    hasRanked: true,
    likes: 285,
    dislikes: 19,
    developer: 'Grupo Ajedrez UDO',
    releaseDate: '2026',
  },
  {
    id: 3,
    title: 'Electric Man 2',
    alias: 'electricman',
    description: 'Torneo de combates de stickmans con artes marciales y poderes eléctricos en cámara lenta.',
    controls: 'Flechas para mover, Q/W/E para ataques normales, A/S/D para cámara lenta.',
    categories: ['Acción', 'Peleas', 'Flash'],
    ageRating: 'Adolescentes (+12)',
    ageBadgeColor: '#e5a93c',
    coverUrl: 'https://placehold.co/800x450/161024/2ec4b6?text=Electric+Man',
    gameUrl: '/games-swf/ElectricMan.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    likes: 412,
    dislikes: 18,
    developer: 'Damian Games',
    releaseDate: '2007',
  },
  {
    id: 4,
    title: 'Fernanfloo Saw Game',
    alias: 'fernanfloo-saw',
    description: 'Fernanfloo es secuestrado por Pigsaw. Resuelve acertijos para rescatar a su perrito Curly.',
    controls: 'Clic izquierdo para interactuar, combinar objetos y moverse.',
    categories: ['Puzzles', 'Aventura', 'Flash'],
    ageRating: 'Adolescentes (+12)',
    ageBadgeColor: '#d9385a',
    coverUrl: 'https://placehold.co/800x450/161024/00f5d4?text=Fernanfloo+Saw+Game',
    gameUrl: '/games-swf/fernanfloo-saw.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    likes: 510,
    dislikes: 42,
    developer: 'InkaGames',
    releaseDate: '2015',
  },
  {
    id: 5,
    title: 'Fireboy & Watergirl: Light Temple',
    alias: 'fireboy-watergirl-light',
    description: 'Utiliza la luz y los espejos para resolver acertijos en este templo cooperativo.',
    controls: 'WASD (Watergirl) y Flechas (Fireboy).',
    categories: ['2 Jugadores', 'Puzzles', 'Flash'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#5a189a',
    coverUrl: 'https://placehold.co/800x450/161024/ffd166?text=Fireboy+%26+Watergirl+Light',
    gameUrl: '/games-swf/Fireboy and Watergirl in The Light Temple.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    likes: 620,
    dislikes: 11,
    developer: 'Oslo Albet',
    releaseDate: '2010',
  },
  {
    id: 6,
    title: 'Fireboy & Watergirl (Original)',
    alias: 'fireboy-watergirl',
    description: 'La aventura clásica cooperativa donde el fuego y el agua exploran el Templo del Bosque.',
    controls: 'WASD para mover a Watergirl y Flechas para mover a Fireboy.',
    categories: ['2 Jugadores', 'Puzzles', 'Flash'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#5a189a',
    coverUrl: 'https://placehold.co/800x450/161024/00bbf9?text=Fireboy+%26+Watergirl',
    gameUrl: '/games-swf/Fireboy And Watergirl.swf',
    tipo: 'FLASH',
    isRecommended: true,
    hasRanked: true,
    likes: 745,
    dislikes: 14,
    developer: 'Oslo Albet',
    releaseDate: '2009',
  },
  {
    id: 7,
    title: 'Garfield\'s Scary Scavenger Hunt',
    alias: 'garfield-scary',
    description: 'Acompaña a Garfield a explorar una mansión embrujada para encontrar donas mientras evitas sustos.',
    controls: 'Flechas para moverse y clic en los objetos del inventario.',
    categories: ['Aventura', 'Puzzles', 'Flash'],
    ageRating: 'Niños (+7)',
    ageBadgeColor: '#2ec4b6',
    coverUrl: 'https://placehold.co/800x450/161024/f48c06?text=Garfield\'s+Scary+Scavenger',
    gameUrl: '/games-swf/Garfield Scary Scavenger Hunt.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    likes: 280,
    dislikes: 22,
    developer: 'Jim Davis',
    releaseDate: '2004',
  },
  {
    id: 8,
    title: 'Gun Mayhem 2',
    alias: 'gun-mayhem-2',
    description: 'Intensa acción de disparos en plataformas multijugador con armas alocadas y explosiones.',
    controls: 'Flechas para mover, Z para disparar, X para lanzar bombas (Configurable).',
    categories: ['Acción', 'Disparos', '2 Jugadores', 'Flash'],
    ageRating: 'Adolescentes (+12)',
    ageBadgeColor: '#d9385a',
    coverUrl: 'https://placehold.co/800x450/161024/ef476f?text=Gun+Mayhem+2',
    gameUrl: '/games-swf/gun-mayhem-2-more-ma-13824.swf',
    tipo: 'FLASH',
    isRecommended: true,
    hasRanked: false,
    likes: 890,
    dislikes: 31,
    developer: 'Kevin Gu',
    releaseDate: '2012',
  },
  {
    id: 9,
    title: 'Papa\'s Pizzeria',
    alias: 'papas-pizzeria',
    description: 'Toma pedidos, hornea pizzas y córtalas perfectamente para dejar a tus clientes felices.',
    controls: 'Clic izquierdo para interactuar con las estaciones.',
    categories: ['Simulación', 'Arcade', 'Flash'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#e5a93c',
    coverUrl: 'https://placehold.co/800x450/161024/e11d48?text=Papa\'s+Pizzeria',
    gameUrl: '/games-swf/Papa´s Pizzeria.swf',
    tipo: 'FLASH',
    isRecommended: true,
    hasRanked: true,
    likes: 1120,
    dislikes: 15,
    developer: 'Flipline Studios',
    releaseDate: '2007',
  },
  {
    id: 10,
    title: 'Syobon Action (Cat Mario)',
    alias: 'syobon-action',
    description: 'El juego de plataformas más frustrante y troll jamás creado. Nada es lo que parece.',
    controls: 'Flechas direccionales para moverse y saltar.',
    categories: ['Plataformas', 'Humor', 'Flash'],
    ageRating: 'Niños (+7)',
    ageBadgeColor: '#5a189a',
    coverUrl: 'https://placehold.co/800x450/161024/ffffff?text=Syobon+Action+(Cat+Mario)',
    gameUrl: '/games-swf/Syobon Action.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    likes: 480,
    dislikes: 125,
    developer: 'Chiku',
    releaseDate: '2007',
  },
  {
    id: 11,
    title: 'Tequila Zombies 2',
    alias: 'tequila-zombies-2',
    description: 'Ábrete paso a través de hordas de zombis usando armas y superpoderes.',
    controls: 'WASD/Flechas para mover, Ratón para apuntar/disparar.',
    categories: ['Acción', 'Disparos', 'Flash'],
    ageRating: 'Adolescentes (+12)',
    ageBadgeColor: '#d9385a',
    coverUrl: 'https://placehold.co/800x450/161024/e5a93c?text=Tequila+Zombies+2',
    gameUrl: '/games-swf/TequilaZombies2.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    likes: 320,
    dislikes: 24,
    developer: 'IriySoft',
    releaseDate: '2012',
  },
  {
    id: 12,
    title: 'Ultimate Flash Sonic',
    alias: 'flash-sonic',
    description: 'Una versión retro impecable del erizo azul con físicas clásicas.',
    controls: 'Flechas para mover, Espacio para saltar.',
    categories: ['Plataformas', 'Arcade', 'Flash'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#5a189a',
    coverUrl: 'https://placehold.co/800x450/161024/0095ff?text=Ultimate+Flash+Sonic',
    gameUrl: '/games-swf/ultimateflashsonicwidescreen.swf',
    tipo: 'FLASH',
    isRecommended: true,
    hasRanked: true,
    likes: 850,
    dislikes: 21,
    developer: 'Dennis-G',
    releaseDate: '2004',
  },
];

export async function fetchCatalogGames(): Promise<Game[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/games`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return data.map((g: Record<string, unknown>, idx: number) => {
        const rawTitle = String(g.title || 'Juego Sin Título');
        const rawRoute = String(g.gameUrl || g.route || '/game-export/index.html');
        
        // Detección automática para Ajedrez y Flash
        const isChess = rawTitle.toLowerCase().includes('ajedrez') || rawRoute.toLowerCase().includes('ajedrez');
        const isSwf = rawRoute.toLowerCase().endsWith('.swf');

        return {
          id: Number(g.id || idx + 1),
          title: rawTitle,
          alias: String(g.alias || rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
          description: String(g.description || 'Sin descripción disponible.'),
          controls: String(g.controls || g.instructions || 'Teclado y Ratón'),
          categories: Array.isArray(g.categories) ? g.categories.map(String) : [String(g.category || 'Arcade')],
          ageRating: String(g.ageRatingName || g.ageRating || 'Para todos (+3)'),
          ageBadgeColor: String(g.ageBadgeColor || '#7b2cbf'),
          coverUrl: String(g.portadaUrl || g.coverUrl || `https://placehold.co/800x450/240046/ffffff?text=${encodeURIComponent(rawTitle)}`),
          previewGifUrl: String(g.previewUrl || 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif'),
          gameUrl: isChess ? 'https://chesscollege.onrender.com/' : rawRoute,
          descargaUrl: g.descargaUrl ? String(g.descargaUrl) : null,
          tipo: isSwf ? 'FLASH' : ((g.tipo as 'WEB' | 'DESCARGABLE') || 'WEB'),
          isRecommended: Boolean(g.isFeatured ?? true),
          hasRanked: true,
          likes: Number(g.likes ?? 120 + idx * 35),
          dislikes: Number(g.dislikes ?? 8),
          developer: isChess ? 'Grupo Ajedrez UDO' : String(g.developer || 'Comunidad UDO'),
          releaseDate: String(g.releaseDate || '2026'),
        };
      });
    }
  } catch (err) {
    console.warn('Usando catálogo de respaldo porque el backend no respondió:', err);
  }
  return FALLBACK_GAMES;
}