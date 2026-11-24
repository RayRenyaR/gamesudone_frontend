import { type BentoSize } from './gamesData';

export type ViewerAdTrigger = 'pre-roll' | 'post-roll' | 'in-game-request';

export interface CatalogAdSlot {
  id: string;
  slotCode: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  imageUrl?: string;
  targetUrl?: string;
  bentoSize: BentoSize;
  // posicion y tamano rectangular dentro del grafo de exploracion
  graphCoord: { x: number; y: number };
  graphSize: { width: number; height: number };
}

export const CATALOG_AD_SLOTS: CatalogAdSlot[] = [
  {
    id: 'ad-slot-01',
    slotCode: 'UDONE_CAT_01',
    title: 'Espacio Patrocinado',
    subtitle: 'Contenedor preparado para red de anuncios (Prebid.js)',
    ctaLabel: 'Ver mas',
    bentoSize: 'wide',
    graphCoord: { x: 420, y: 520 },
    graphSize: { width: 600, height: 500 },
  },
  {
    id: 'ad-slot-02',
    slotCode: 'UDONE_CAT_02',
    title: 'Anuncio de la Comunidad',
    subtitle: 'Apoya a los desarrolladores de gamesUDONE',
    ctaLabel: 'Explorar',
    bentoSize: 'small',
    graphCoord: { x: 2000, y: 505 },
    graphSize: { width: 315, height: 500 },
  },
];

const PRE_ROLL_EVERY_N_GAMES = 3;
let openedGamesCounter = 0;

export function shouldShowPreRollMock(hasBattlePass = false): boolean {
  if (hasBattlePass) return false;
  openedGamesCounter += 1;
  return openedGamesCounter === 1 || openedGamesCounter % PRE_ROLL_EVERY_N_GAMES === 0;
}

export function shouldShowPostRollMock(hasBattlePass = false): boolean {
  if (hasBattlePass) return false;
  return true;
}