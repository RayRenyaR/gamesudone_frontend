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

export const FALLBACK_GAMES: Game[] = [
  {
    id: 1,
    title: 'UDOWare: MicroChaos',
    alias: 'udoware',
    description:
      'Supera microjuegos frenéticos de 4 segundos inspirados en la vida universitaria antes de perder tus 4 vidas. ¡Incluye la historia de Mr. Perros!',
    controls: 'Ratón (Clic izquierdo) y Teclado según la orden en pantalla.',
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
    description:
      'Enfréntate en partidas tácticas de ajedrez online desarrolladas por el equipo multijugador.',
    controls: 'Ratón (Clic izquierdo para seleccionar y mover piezas en el tablero).',
    categories: ['Estrategia', 'Multijugador', 'Lógica'],
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
    title: 'Clásico Flash (Demo Ruffle)',
    alias: 'flash-ruffle-demo',
    description:
      'Prueba de emulación nativa de archivos .SWF en el navegador utilizando el motor WebAssembly de Ruffle.',
    controls: 'Ratón y Teclado (Emulado vía Ruffle).',
    categories: ['Flash', 'Retro', 'Arcade'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#e5a93c',
    coverUrl: 'https://placehold.co/800x450/3c096c/ffbe0b?text=Juego+Flash+(Ruffle)',
    previewGifUrl: 'https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif',
    // Puedes reemplazar este .swf de prueba por cualquier archivo .swf en public/games-swf/
    gameUrl: 'https://ruffle.rs/demo/logo-anim.swf',
    tipo: 'FLASH',
    isRecommended: true,
    hasRanked: false,
    likes: 410,
    dislikes: 9,
    developer: 'Ruffle Integration',
    releaseDate: '2026',
  },
  {
    id: 4,
    title: 'Fireboy & Watergirl Temple',
    alias: 'fireboy-watergirl',
    description:
      'Resuelve acertijos sincronizados cooperativos con fuego y agua.',
    controls: 'WASD y Flechas de dirección.',
    categories: ['2 Jugadores', 'Puzzles'],
    ageRating: 'Para todos (+3)',
    ageBadgeColor: '#5a189a',
    coverUrl: 'https://placehold.co/800x450/1b263b/38b6ff?text=Fireboy+%26+Watergirl',
    previewGifUrl: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif',
    gameUrl: '/game-export/index.html',
    tipo: 'WEB',
    isRecommended: true,
    hasRanked: true,
    likes: 512,
    dislikes: 14,
    developer: 'Oslo Albet',
    releaseDate: '2025',
  },
  {
  id: 7,
  title: 'Fernanfloo Saw Game',
  alias: 'fernanfloo-saw',
  description: 'Un juego de acción y aventura con elementos de terror basado en fernanfloo.',
  controls: 'Teclado (Emulado)',
  categories: ['Arcade', 'Flash'],
  ageRating: 'Para todos (+3)',
  coverUrl: '...', // URL de alguna imagen
  gameUrl: '/games-swf/fernanfloo-saw.swf', // RUTA EXACTA A TU ARCHIVO PUBLICO
  tipo: 'FLASH',
  likes: 100,
  dislikes: 0
  }
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
        const isChess =
          rawTitle.toLowerCase().includes('ajedrez') ||
          rawRoute.toLowerCase().includes('ajedrez');
        const isSwf = rawRoute.toLowerCase().endsWith('.swf');

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
            : [String(g.category || g.categoryName || 'Arcade')],
          ageRating: String(g.ageRatingName || g.ageRating || 'Para todos (+3)'),
          ageBadgeColor: String(g.ageBadgeColor || '#7b2cbf'),
          coverUrl: String(
            g.portadaUrl ||
              g.coverUrl ||
              `https://placehold.co/800x450/240046/ffffff?text=${encodeURIComponent(rawTitle)}`
          ),
          previewGifUrl: String(
            g.previewUrl || 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif'
          ),
          // Si es el juego de Ajedrez del backend de tu compañero, lo redirige a chesscollege.onrender.com
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