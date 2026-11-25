export interface ScoreEntry {
  player: string;
  score: number;
  gameTitle?: string;
}

export type BentoSize = 'small' | 'wide' | 'tall' | 'hero';

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
  mobileCompatible?: boolean;
  bentoSize?: BentoSize;
  likes: number;
  dislikes: number;
  developer?: string;
  releaseDate?: string;
}

export const API_BASE_URL = 'http://localhost:8080/api';

export const DEFAULT_LEADERBOARD: ScoreEntry[] = [
  { player: 'Rayner_UDO', score: 9850, gameTitle: 'UDOWare: MicroChaos' },
  { player: 'Gabriel_UI', score: 9420, gameTitle: 'UDOWare: MicroChaos' },
  { player: 'Nicolas_Lider', score: 8900, gameTitle: 'Chess College' },
  { player: 'Osmer_Backend', score: 8450, gameTitle: "Papa's Pizzeria" },
  { player: 'Ruben_Dev', score: 8150, gameTitle: 'Ultimate Flash Sonic' },
];

export const FALLBACK_GAMES: Game[] = [
  {
    id: 1,
    title: 'UDOWare: MicroChaos',
    alias: 'udoware',
    description:
      'Supera microjuegos frenéticos de 4 segundos inspirados en la vida universitaria antes de perder tus 4 vidas. ¡Incluye la historia de Mr. Perros!',
    controls: 'Ratón (Clic para interactuar) y Teclado según la orden.',
    categories: ['Microjuegos', 'Arcade', 'Acción'],
    ageRating: 'Niños (+7)',
    ageBadgeColor: '#7b2cbf',
    coverUrl: '/assets/covers/udoware.png',
    previewGifUrl: 'https://media.tenor.com/9Nr32cJWZ8oAAAAM/catto.gif',
    gameUrl: '/game-export/index.html',
    tipo: 'WEB',
    isRecommended: true,
    hasRanked: true,
    mobileCompatible: false,
    bentoSize: 'hero',
    likes: 342,
    dislikes: 12,
    developer: 'Grupo Amarillo UDO',
    releaseDate: '2026',
  },
  {
    id: 2,
    title: 'Chess College (Ajedrez UDO)',
    alias: 'chess-college',
    description:
      'El clásico juego de estrategia reinventado con trampas ocultas en el tablero y modificadores multijugador en tiempo real.',
    controls: 'Clic izquierdo para seleccionar y mover piezas.',
    categories: ['Estrategia', '2 Jugadores', 'Puzzles'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#5a189a',
    coverUrl: 'https://placehold.co/800x450/1d1430/e5a93c?text=Chess+College+UDO',
    previewGifUrl: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif',
    gameUrl: 'https://chesscollege.onrender.com/?embedded=true',
    tipo: 'WEB',
    isRecommended: true,
    hasRanked: true,
    mobileCompatible: false,
    bentoSize: 'wide',
    likes: 285,
    dislikes: 19,
    developer: 'Grupo Ajedrez UDO',
    releaseDate: '2026',
  },
  {
    id: 3,
    title: 'Electric Man 2',
    alias: 'electric-man-2',
    description:
      'Torneo de combates de stickmans con artes marciales y poderes eléctricos en cámara lenta.',
    controls: 'Flechas para mover, Q/W/E para ataques normales, A/S/D para cámara lenta.',
    categories: ['Acción', 'Peleas', 'Flash'],
    ageRating: 'Adolescentes (+12)',
    ageBadgeColor: '#e5a93c',
    coverUrl: '/assets/covers/electric-man-2.jpg',
    previewGifUrl: '/assets/preview/electric-man-2.gif',
    gameUrl: '/games-swf/electric-man-2.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    mobileCompatible: false,
    bentoSize: 'small',
    likes: 412,
    dislikes: 18,
    developer: 'Damian Games',
    releaseDate: '2007',
  },
  {
    id: 4,
    title: 'Fernanfloo Saw Game',
    alias: 'fernanfloo-saw',
    description:
      'Fernanfloo es secuestrado por Pigsaw. Resuelve acertijos point-and-click para rescatar a su perrito Curly.',
    controls: 'Clic izquierdo para interactuar, combinar objetos y moverse.',
    categories: ['Puzzles', 'Aventura', 'Flash'],
    ageRating: 'Adolescentes (+12)',
    ageBadgeColor: '#d9385a',
    coverUrl: '/assets/covers/fernanfloo-saw.jpg',
    previewGifUrl: '/assets/preview/fernanfloo-saw.gif',
    gameUrl: '/games-swf/fernanfloo-saw.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    mobileCompatible: false,
    bentoSize: 'tall',
    likes: 510,
    dislikes: 42,
    developer: 'InkaGames',
    releaseDate: '2015',
  },
  {
    id: 5,
    title: 'Fireboy & Watergirl: Light Temple',
    alias: 'fireboy-watergirl-2',
    description:
      'Utiliza la luz y los espejos para resolver acertijos en este templo cooperativo.',
    controls: 'WASD (Watergirl) y Flechas (Fireboy).',
    categories: ['2 Jugadores', 'Puzzles', 'Flash'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#5a189a',
    coverUrl: '/assets/covers/fireboy-watergirl-2.webp',
    previewGifUrl: '/assets/preview/fireboy-watergirl-2.gif',
    gameUrl: '/games-swf/fireboy-watergirl-2.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    mobileCompatible: false,
    bentoSize: 'small',
    likes: 620,
    dislikes: 11,
    developer: 'Oslo Albet',
    releaseDate: '2010',
  },
  {
    id: 6,
    title: 'Fireboy & Watergirl (Original)',
    alias: 'fireboy-watergirl-1',
    description:
      'La aventura clásica cooperativa donde el fuego y el agua exploran el Templo del Bosque.',
    controls: 'WASD para mover a Watergirl y Flechas para mover a Fireboy.',
    categories: ['2 Jugadores', 'Puzzles', 'Flash'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#5a189a',
    coverUrl: '/assets/covers/fireboy-watergirl-1.jpg',
    previewGifUrl: '/assets/preview/fireboy-watergirl-1.gif',
    gameUrl: '/games-swf/fireboy-watergirl-1.swf',
    tipo: 'FLASH',
    isRecommended: true,
    hasRanked: true,
    mobileCompatible: false,
    bentoSize: 'wide',
    likes: 745,
    dislikes: 14,
    developer: 'Oslo Albet',
    releaseDate: '2009',
  },
  {
    id: 7,
    title: 'Gun Mayhem 2',
    alias: 'gun-mayhem-2',
    description:
      'Intensa acción de disparos en plataformas multijugador con armas alocadas y explosiones.',
    controls: 'Flechas para mover, Z para disparar, X para lanzar bombas.',
    categories: ['Acción', 'Disparos', '2 Jugadores', 'Flash'],
    ageRating: 'Adolescentes (+12)',
    ageBadgeColor: '#d9385a',
    coverUrl: '/assets/covers/gun-mayhem-2.png',
    previewGifUrl: '/assets/preview/gun-mayhem-2.gif',
    gameUrl: '/games-swf/gun-mayhem-2.swf',
    tipo: 'FLASH',
    isRecommended: true,
    hasRanked: true,
    mobileCompatible: false,
    bentoSize: 'tall',
    likes: 890,
    dislikes: 31,
    developer: 'Kevin Gu',
    releaseDate: '2012',
  },
  {
    id: 8,
    title: "Papa's Pizzeria",
    alias: 'papas-pizzeria',
    description:
      'Toma pedidos, hornea pizzas y córtalas perfectamente para dejar a tus clientes felices.',
    controls: 'Clic izquierdo para interactuar con las estaciones.',
    categories: ['Simulación', 'Arcade', 'Flash'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#e5a93c',
    coverUrl: '/assets/covers/papas-pizzeria.jpg',
    previewGifUrl: '/assets/preview/papas-pizzeria.gif',
    gameUrl: '/games-swf/papas-pizzeria.swf',
    tipo: 'FLASH',
    isRecommended: true,
    hasRanked: true,
    mobileCompatible: false,
    bentoSize: 'wide',
    likes: 1120,
    dislikes: 15,
    developer: 'Flipline Studios',
    releaseDate: '2007',
  },
  {
    id: 9,
    title: 'Syobon Action (Cat Mario)',
    alias: 'syobon-action',
    description:
      'El juego de plataformas más frustrante y troll jamás creado. Nada es lo que parece.',
    controls: 'Flechas direccionales para moverse y saltar.',
    categories: ['Plataformas', 'Humor', 'Flash'],
    ageRating: 'Niños (+7)',
    ageBadgeColor: '#5a189a',
    coverUrl: '/assets/covers/syobon-action.webp',
    previewGifUrl: '/assets/preview/syobon-action.gif',
    gameUrl: '/games-swf/syobon-action.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    mobileCompatible: false,
    bentoSize: 'small',
    likes: 480,
    dislikes: 125,
    developer: 'Chiku',
    releaseDate: '2007',
  },
  {
    id: 10,
    title: 'Tequila Zombies 2',
    alias: 'tequila-zombies-2',
    description:
      'Ábrete paso a través de hordas de zombis usando armas y superpoderes.',
    controls: 'WASD/Flechas para mover, Ratón para apuntar/disparar.',
    categories: ['Acción', 'Disparos', 'Flash'],
    ageRating: 'Adolescentes (+12)',
    ageBadgeColor: '#d9385a',
    coverUrl: '/assets/covers/tequila-zombies-2.jpg',
    previewGifUrl: '/assets/preview/tequila-zombies-2.gif',
    gameUrl: '/games-swf/tequila-zombies-2.swf',
    tipo: 'FLASH',
    isRecommended: false,
    hasRanked: false,
    mobileCompatible: false,
    bentoSize: 'small',
    likes: 320,
    dislikes: 24,
    developer: 'IriySoft',
    releaseDate: '2012',
  },
  {
    id: 11,
    title: 'Ultimate Flash Sonic',
    alias: 'ultimate-flash-sonic',
    description:
      'Una versión retro impecable del erizo azul con físicas clásicas.',
    controls: 'Flechas para mover, Espacio para saltar.',
    categories: ['Plataformas', 'Arcade', 'Flash'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#5a189a',
    coverUrl: '/assets/covers/ultimate-flash-sonic.webp',
    previewGifUrl: '/assets/preview/ultimate-flash-sonic.gif',
    gameUrl: '/games-swf/ultimate-flash-sonic.swf',
    tipo: 'FLASH',
    isRecommended: true,
    hasRanked: true,
    mobileCompatible: false,
    bentoSize: 'wide',
    likes: 850,
    dislikes: 21,
    developer: 'Dennis-G',
    releaseDate: '2004',
  },
];

const BENTO_PATTERN: BentoSize[] = [
  'hero',
  'wide',
  'small',
  'tall',
  'small',
  'wide',
  'tall',
  'wide',
  'small',
  'small',
  'wide',
];

export function slugifyGameAlias(rawText: string, fallbackId?: number): string {
  const cleaned = rawText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (cleaned.length > 0) return cleaned;
  return fallbackId !== undefined ? `juego-${fallbackId}` : 'juego';
}

export async function fetchCatalogGames(): Promise<Game[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/games`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return data.map((g: Record<string, unknown>, idx: number) => {
        const rawTitle = String(g.title || 'Juego Sin Título');
        const rawRoute = String(g.gameUrl || g.route || '/game-export/index.html');
        const isSwf = rawRoute.toLowerCase().endsWith('.swf');
        const fallbackMatch = FALLBACK_GAMES[idx % FALLBACK_GAMES.length];

        return {
          id: Number(g.id || idx + 1),
          title: rawTitle,
          alias: String(
            g.alias ||
              rawTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
          ),
          description: String(g.description || 'Sin descripción disponible.'),
          controls: String(g.controls || g.instructions || 'Teclado y Ratón'),
          categories: Array.isArray(g.categories)
            ? g.categories.map(String)
            : [String(g.category || 'Arcade')],
          ageRating: String(g.ageRatingName || g.ageRating || 'Para todos (+3)'),
          ageBadgeColor: String(g.ageBadgeColor || '#7b2cbf'),
          coverUrl: String(g.portadaUrl || g.coverUrl || fallbackMatch.coverUrl),
          previewGifUrl: String(g.previewUrl || fallbackMatch.previewGifUrl || ''),
          gameUrl: rawRoute,
          descargaUrl: g.descargaUrl ? String(g.descargaUrl) : null,
          tipo: isSwf ? 'FLASH' : ((g.tipo as 'WEB' | 'DESCARGABLE') || 'WEB'),
          isRecommended: Boolean(g.isFeatured ?? true),
          hasRanked: Boolean(g.hasRanked ?? fallbackMatch.hasRanked ?? false),
          mobileCompatible: false,
          bentoSize: BENTO_PATTERN[idx % BENTO_PATTERN.length],
          likes: Number(g.likes ?? 120 + idx * 35),
          dislikes: Number(g.dislikes ?? 8),
          developer: String(g.developer || 'UDO'),
          releaseDate: String(g.releaseDate || '2026'),
        };
      });
    }
  } catch {
    // Usa el catálogo local cuando el backend 8080 no está disponible
  }
  return FALLBACK_GAMES;
}