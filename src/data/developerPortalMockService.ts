//ESTO ES PURO MOCKUP
//REEMPLAZAR LUEGO POR EL BACKEND DESARROLLADO EN EL SIGUIENTE SPRINT
//CONECTAR TAMBIEN CON EL MOTOR DE RECOMENDACIONES PARA METRICAS UNIFICADAS
import { type Game, type BentoSize, slugifyGameAlias } from './gamesData';

export type GameLifecycleState =
  | 'BORRADOR'
  | 'SUBIENDO'
  | 'ERROR_SUBIDA'
  | 'EN_VERIFICACION'
  | 'RECHAZADO'
  | 'APROBADO'
  | 'PUBLICADO'
  | 'PAUSADO';

export type DevGameBuildType = 'WEB' | 'FLASH';
export type WithdrawalMethod = 'BINANCE_USDT' | 'PAYPAL' | 'PAGO_MOVIL';
export type WithdrawalStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

export interface DeveloperGameRecord {
  id: number;
  title: string;
  alias: string;
  description: string;
  controls: string;
  categories: string[];
  ageRating: string;
  tipo: DevGameBuildType;
  coverUrl: string;
  previewGifUrl?: string;
  gameUrl: string;
  buildFileName: string;
  version: string;
  bentoSize: BentoSize;
  hasRanked: boolean;
  mobileCompatible: boolean;
  status: GameLifecycleState;
  rejectionReason?: string;
  updatedAt: string;
  // metricas simuladas alineadas con el equipo de recomendaciones y cortes diarios
  metrics: {
    activeTimeSec: number;
    validImpressions: number;
    weeklyReturningUsers: number;
    likes: number;
    directPoolUsd: number;
    globalPoolUsd: number;
  };
}

export interface WithdrawalRequest {
  id: string;
  method: WithdrawalMethod;
  destination: string;
  amountUsd: number;
  status: WithdrawalStatus;
  createdAt: string;
}

export interface DeveloperEarningsSummary {
  totalEarnedUsd: number;
  directPoolUsd: number;
  globalPoolUsd: number;
  reservedInWithdrawalsUsd: number;
  availableBalanceUsd: number;
  totalActiveTimeSec: number;
  totalValidImpressions: number;
  developerSharePct: number;
  platformSharePct: number;
}

const GAMES_STORAGE_KEY = 'udo_dev_portal_games_v1';
const WITHDRAWALS_STORAGE_KEY = 'udo_dev_portal_withdrawals_v1';
export const DEV_PORTAL_UPDATE_EVENT = 'udo_dev_portal_update';

// juegos de ejemplo precargados cubriendo los estados principales del diagrama
const INITIAL_MOCK_DEV_GAMES: DeveloperGameRecord[] = [
  {
    id: 901,
    title: 'Neon UDO Drift',
    alias: 'neon-udo-drift',
    description: 'Carreras arcade contrarreloj en pistas sinteticas con soporte para anuncios recompensados.',
    controls: 'WASD o Flechas para conducir, Espacio para turbo, R para reiniciar.',
    categories: ['Acción', 'Carreras'],
    ageRating: 'Para todos (+3)',
    tipo: 'WEB',
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    gameUrl: '/games/demo-web/index.html',
    buildFileName: 'neon-udo-drift-v1.2.zip',
    version: '1.2.0',
    bentoSize: 'wide',
    hasRanked: true,
    mobileCompatible: false,
    status: 'PUBLICADO',
    updatedAt: '2026-11-20',
    metrics: {
      activeTimeSec: 184200,
      validImpressions: 4120,
      weeklyReturningUsers: 194,
      likes: 128,
      directPoolUsd: 18.45,
      globalPoolUsd: 9.8,
    },
  },
  {
    id: 902,
    title: 'Margarita Dungeon Flash',
    alias: 'margarita-dungeon-flash',
    description: 'Aventura clasica de mazmorras empaquetada para correr sobre Ruffle sin anuncios in-game.',
    controls: 'Flechas para moverse, Z para atacar, X para esquivar.',
    categories: ['Aventura', 'Retro'],
    ageRating: 'Niños (+7)',
    tipo: 'FLASH',
    coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    gameUrl: '/games/demo-flash/dungeon.swf',
    buildFileName: 'margarita-dungeon.swf',
    version: '1.0.4',
    bentoSize: 'small',
    hasRanked: false,
    mobileCompatible: false,
    status: 'EN_VERIFICACION',
    updatedAt: '2026-11-23',
    metrics: {
      activeTimeSec: 0,
      validImpressions: 0,
      weeklyReturningUsers: 0,
      likes: 0,
      directPoolUsd: 0,
      globalPoolUsd: 0,
    },
  },
  {
    id: 903,
    title: 'Pixel Four Arena',
    alias: 'pixel-four-arena',
    description: 'Prototipo de minijuegos rapidos estilo micro-retos hecho en Godot 4 HTML5.',
    controls: 'Mouse y barra espaciadora.',
    categories: ['Puzzle', 'Estrategia'],
    ageRating: 'Para todos (+3)',
    tipo: 'WEB',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    gameUrl: '/games/pixel-four/index.html',
    buildFileName: 'pixel-four-build-rc1.zip',
    version: '0.8.0',
    bentoSize: 'small',
    hasRanked: true,
    mobileCompatible: true,
    status: 'BORRADOR',
    updatedAt: '2026-11-24',
    metrics: {
      activeTimeSec: 0,
      validImpressions: 0,
      weeklyReturningUsers: 0,
      likes: 0,
      directPoolUsd: 0,
      globalPoolUsd: 0,
    },
  },
  {
    id: 904,
    title: 'Cyber Lab Defense',
    alias: 'cyber-lab-defense',
    description: 'Defensa de torres por oleadas con tabla de puntajes semanales.',
    controls: 'Clic izquierdo para construir, clic derecho para cancelar.',
    categories: ['Estrategia'],
    ageRating: 'Adolescentes (+12)',
    tipo: 'WEB',
    coverUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    gameUrl: '/games/cyber-lab/index.html',
    buildFileName: 'cyber-lab-v2.0.zip',
    version: '2.0.1',
    bentoSize: 'tall',
    hasRanked: true,
    mobileCompatible: true,
    status: 'PAUSADO',
    updatedAt: '2026-11-18',
    metrics: {
      activeTimeSec: 76500,
      validImpressions: 1640,
      weeklyReturningUsers: 82,
      likes: 64,
      directPoolUsd: 7.2,
      globalPoolUsd: 4.15,
    },
  },
  {
    id: 905,
    title: 'Speed Clicker Extreme',
    alias: 'speed-clicker-extreme',
    description: 'Juego incremental con solicitudes de anuncio recompensado.',
    controls: 'Clic izquierdo.',
    categories: ['Casual'],
    ageRating: 'Para todos (+3)',
    tipo: 'WEB',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    gameUrl: '/games/speed-clicker/index.html',
    buildFileName: 'speed-clicker-v1.zip',
    version: '1.0.0',
    bentoSize: 'small',
    hasRanked: false,
    mobileCompatible: true,
    status: 'RECHAZADO',
    rejectionReason:
      'El paquete .zip no incluye index.html en la raiz y dispara REQUEST_AD sin respetar el cooldown minimo.',
    updatedAt: '2026-11-19',
    metrics: {
      activeTimeSec: 0,
      validImpressions: 0,
      weeklyReturningUsers: 0,
      likes: 0,
      directPoolUsd: 0,
      globalPoolUsd: 0,
    },
  },
];

const INITIAL_MOCK_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'WD-2026-001',
    method: 'BINANCE_USDT',
    destination: 'Binance ID: 492817301',
    amountUsd: 12.0,
    status: 'COMPLETED',
    createdAt: '2026-11-02',
  },
  {
    id: 'WD-2026-002',
    method: 'PAGO_MOVIL',
    destination: 'Banesco • 0414-***-8291',
    amountUsd: 8.5,
    status: 'PENDING',
    createdAt: '2026-11-22',
  },
];

function emitPortalUpdate(): void {
  window.dispatchEvent(new CustomEvent(DEV_PORTAL_UPDATE_EVENT));
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
  emitPortalUpdate();
}

export function listDeveloperGames(): DeveloperGameRecord[] {
  const saved = readStorage<DeveloperGameRecord[] | null>(GAMES_STORAGE_KEY, null);
  if (!saved) {
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DEV_GAMES));
    return [...INITIAL_MOCK_DEV_GAMES];
  }
  return saved;
}

export function getDeveloperGameById(id: number): DeveloperGameRecord | undefined {
  return listDeveloperGames().find((g) => g.id === id);
}

export type CreateOrUpdateGameInput = Omit<
  DeveloperGameRecord,
  'id' | 'alias' | 'updatedAt' | 'metrics' | 'status'
> & {
  id?: number;
  alias?: string;
  targetStatus?: Extract<GameLifecycleState, 'BORRADOR' | 'SUBIENDO' | 'EN_VERIFICACION'>;
};

// crea o actualiza un juego en localstorage (contrato listo para POST/PUT en spring boot)
export function saveOrSubmitDeveloperGame(
  input: CreateOrUpdateGameInput
): DeveloperGameRecord {
  const all = listDeveloperGames();
  const today = new Date().toISOString().slice(0, 10);
  const nextStatus = input.targetStatus || 'BORRADOR';

  if (input.id) {
    const idx = all.findIndex((g) => g.id === input.id);
    if (idx >= 0) {
      const existing = all[idx];
      const updated: DeveloperGameRecord = {
        ...existing,
        ...input,
        id: existing.id,
        alias: slugifyGameAlias(input.alias || input.title, existing.id),
        status: nextStatus,
        rejectionReason: nextStatus === 'EN_VERIFICACION' ? undefined : existing.rejectionReason,
        updatedAt: today,
      };
      all[idx] = updated;
      writeStorage(GAMES_STORAGE_KEY, all);
      return updated;
    }
  }

  const nextId = all.reduce((max, g) => Math.max(max, g.id), 900) + 1;
  const created: DeveloperGameRecord = {
    id: nextId,
    title: input.title.trim(),
    alias: slugifyGameAlias(input.alias || input.title, nextId),
    description: input.description.trim(),
    controls: input.controls.trim(),
    categories: input.categories.length > 0 ? input.categories : ['Casual'],
    ageRating: input.ageRating || 'Para todos (+3)',
    tipo: input.tipo,
    coverUrl: input.coverUrl.trim(),
    previewGifUrl: input.previewGifUrl?.trim() || undefined,
    gameUrl: input.gameUrl.trim(),
    buildFileName: input.buildFileName.trim() || `${slugifyGameAlias(input.title, nextId)}.zip`,
    version: input.version.trim() || '1.0.0',
    bentoSize: input.bentoSize || 'small',
    hasRanked: input.hasRanked,
    mobileCompatible: input.mobileCompatible,
    status: nextStatus,
    updatedAt: today,
    metrics: {
      activeTimeSec: 0,
      validImpressions: 0,
      weeklyReturningUsers: 0,
      likes: 0,
      directPoolUsd: 0,
      globalPoolUsd: 0,
    },
  };

  writeStorage(GAMES_STORAGE_KEY, [created, ...all]);
  return created;
}

// simula transiciones de estado para pruebas (ej. verificar, aprobar, publicar, pausar, rechazar)
export function transitionDeveloperGameState(
  id: number,
  nextStatus: GameLifecycleState,
  rejectionReason?: string
): DeveloperGameRecord | null {
  const all = listDeveloperGames();
  const idx = all.findIndex((g) => g.id === id);
  if (idx < 0) return null;

  const updated: DeveloperGameRecord = {
    ...all[idx],
    status: nextStatus,
    rejectionReason: nextStatus === 'RECHAZADO' ? rejectionReason || 'Requiere ajustes tecnicos.' : undefined,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  all[idx] = updated;
  writeStorage(GAMES_STORAGE_KEY, all);
  return updated;
}

export function deleteDeveloperGame(id: number): void {
  const next = listDeveloperGames().filter((g) => g.id !== id);
  writeStorage(GAMES_STORAGE_KEY, next);
}

export function listWithdrawalRequests(): WithdrawalRequest[] {
  const saved = readStorage<WithdrawalRequest[] | null>(WITHDRAWALS_STORAGE_KEY, null);
  if (!saved) {
    localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_WITHDRAWALS));
    return [...INITIAL_MOCK_WITHDRAWALS];
  }
  return saved;
}

export function getDeveloperEarningsSummary(): DeveloperEarningsSummary {
  const games = listDeveloperGames();
  const withdrawals = listWithdrawalRequests();

  const directPoolUsd = games.reduce((sum, g) => sum + g.metrics.directPoolUsd, 0);
  const globalPoolUsd = games.reduce((sum, g) => sum + g.metrics.globalPoolUsd, 0);
  const totalEarnedUsd = Number((directPoolUsd + globalPoolUsd).toFixed(2));

  const reservedInWithdrawalsUsd = Number(
    withdrawals
      .filter((w) => w.status === 'PENDING' || w.status === 'COMPLETED')
      .reduce((sum, w) => sum + w.amountUsd, 0)
      .toFixed(2)
  );

  const availableBalanceUsd = Math.max(
    0,
    Number((totalEarnedUsd - reservedInWithdrawalsUsd).toFixed(2))
  );

  return {
    totalEarnedUsd,
    directPoolUsd: Number(directPoolUsd.toFixed(2)),
    globalPoolUsd: Number(globalPoolUsd.toFixed(2)),
    reservedInWithdrawalsUsd,
    availableBalanceUsd,
    totalActiveTimeSec: games.reduce((sum, g) => sum + g.metrics.activeTimeSec, 0),
    totalValidImpressions: games.reduce((sum, g) => sum + g.metrics.validImpressions, 0),
    developerSharePct: 70,
    platformSharePct: 30,
  };
}

export function createWithdrawalRequest(input: {
  method: WithdrawalMethod;
  destination: string;
  amountUsd: number;
}): { ok: boolean; error?: string; request?: WithdrawalRequest } {
  const summary = getDeveloperEarningsSummary();
  if (input.amountUsd < 5) {
    return { ok: false, error: 'El monto minimo de retiro es $5.00 USD.' };
  }
  if (input.amountUsd > summary.availableBalanceUsd) {
    return { ok: false, error: 'El monto supera tu saldo disponible.' };
  }
  if (!input.destination.trim()) {
    return { ok: false, error: 'Indica los datos de destino para procesar el retiro.' };
  }

  const all = listWithdrawalRequests();
  const created: WithdrawalRequest = {
    id: `WD-2026-${String(all.length + 1).padStart(3, '0')}`,
    method: input.method,
    destination: input.destination.trim(),
    amountUsd: Number(input.amountUsd.toFixed(2)),
    status: 'PENDING',
    createdAt: new Date().toISOString().slice(0, 10),
  };

  writeStorage(WITHDRAWALS_STORAGE_KEY, [created, ...all]);
  return { ok: true, request: created };
}

// permite al dueno aprobar o rechazar retiros en la simulacion local
export function updateWithdrawalStatus(
  id: string,
  status: WithdrawalStatus
): WithdrawalRequest | null {
  const all = listWithdrawalRequests();
  const idx = all.findIndex((w) => w.id === id);
  if (idx < 0) return null;

  const updated: WithdrawalRequest = { ...all[idx], status };
  all[idx] = updated;
  writeStorage(WITHDRAWALS_STORAGE_KEY, all);
  return updated;
}

export function resetDeveloperPortalMocks(): void {
  localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DEV_GAMES));
  localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_WITHDRAWALS));
  emitPortalUpdate();
}

// adapta juegos PUBLICADO del portal al formato Game del catalogo principal
export function getPublishedDeveloperGamesForCatalog(): Game[] {
  return listDeveloperGames()
    .filter((g) => g.status === 'PUBLICADO')
    .map((g) => ({
      id: g.id,
      title: g.title,
      alias: g.alias,
      description: g.description,
      controls: g.controls,
      categories: g.categories,
      ageRating: g.ageRating,
      tipo: g.tipo,
      coverUrl: g.coverUrl,
      previewGifUrl: g.previewGifUrl,
      gameUrl: g.gameUrl,
      bentoSize: g.bentoSize,
      hasRanked: g.hasRanked,
      mobileCompatible: g.mobileCompatible,
      likes: g.metrics.likes,
      dislikes: 0,
    }));
}