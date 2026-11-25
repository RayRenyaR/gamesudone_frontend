import { type Game } from '../data/gamesData';
import { type CatalogAdSlot } from '../data/adSlotsData';

export type CatalogViewMode = 'graph' | 'mosaic' | 'channels';

export type CatalogGridItem =
  | { kind: 'game'; data: Game }
  | { kind: 'ad'; data: CatalogAdSlot };

export interface GraphNodePos {
  x: number;
  y: number;
  delay: string;
}

export interface GraphEdge {
  keyA: string;
  keyB: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface GraphNodeInput {
  key: string;
  width: number;
  height: number;
}

export const GRAPH_CARD_WIDTH = 245;
export const GRAPH_CARD_HEIGHT = 160;
export const MIN_ZOOM = 0.45;
export const MAX_ZOOM = 1.4;
export const ZOOM_STEP = 0.15;
const FOUR_GAMES_ROW_SPAN = 1560;

export const computeAutoZoom = (viewportWidth: number): number => {
  if (viewportWidth >= FOUR_GAMES_ROW_SPAN) return 1;
  const fitted = Math.floor((viewportWidth / FOUR_GAMES_ROW_SPAN) * 100) / 100;
  return Math.max(MIN_ZOOM, Math.min(1, fitted));
};

// generador pseudoaleatorio liviano para repartir anuncios sin saltos al hacer hover
const createSeededRandom = (seed: number) => {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

// intercala anuncios en posiciones aleatorias evitando dejar dos pegados
export const buildRandomInterleavedList = (
  gamesList: Game[],
  adsList: CatalogAdSlot[],
  seed: number
): CatalogGridItem[] => {
  const items: CatalogGridItem[] = gamesList.map((data) => ({ kind: 'game', data }));
  if (adsList.length === 0) return items;

  const rand = createSeededRandom(seed);
  const shuffledAds = [...adsList].sort(() => rand() - 0.5);

  shuffledAds.forEach((ad) => {
    const minPos = items.length > 2 ? 1 : 0;
    let insertAt = minPos + Math.floor(rand() * (items.length - minPos + 1));

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const prevIsAd = insertAt > 0 && items[insertAt - 1]?.kind === 'ad';
      const nextIsAd = items[insertAt]?.kind === 'ad';
      if (!prevIsAd && !nextIsAd) break;
      insertAt = minPos + Math.floor(rand() * (items.length - minPos + 1));
    }

    items.splice(insertAt, 0, { kind: 'ad', data: ad });
  });

  return items;
};

// posiciona juegos y anuncios mezclados y separa cajas para evitar solapamientos
export const computeUnifiedGraphLayout = (
  gamesList: Game[],
  adsList: CatalogAdSlot[],
  seed: number
): Record<string, GraphNodePos> => {
  const rand = createSeededRandom(seed + 31);
  const mixedItems = buildRandomInterleavedList(gamesList, adsList, seed);

  const unifiedNodes: GraphNodeInput[] = mixedItems.map((item) => {
    if (item.kind === 'ad') {
      return {
        key: `ad-${item.data.id}`,
        width: item.data.graphSize.width,
        height: item.data.graphSize.height,
      };
    }
    return {
      key: `game-${item.data.id}`,
      width: GRAPH_CARD_WIDTH,
      height: GRAPH_CARD_HEIGHT,
    };
  });

  const cols = 4;
  const colSpacing = 415;
  const rowSpacing = 310;
  const pad = 46;

  const boxes = unifiedNodes.map((node, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const rowStagger = row % 2 === 1 ? 115 : 0;
    const jitterX = Math.round((rand() - 0.5) * 46);
    const jitterY = Math.round((rand() - 0.5) * 42);

    return {
      ...node,
      x: Math.max(50, 90 + col * colSpacing + rowStagger + jitterX),
      y: Math.max(50, 85 + row * rowSpacing + jitterY),
      delay: `${(idx * 0.38).toFixed(2)}s`,
    };
  });

  for (let pass = 0; pass < 24; pass += 1) {
    let moved = false;

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];

        const dx = b.x + b.width / 2 - (a.x + a.width / 2);
        const dy = b.y + b.height / 2 - (a.y + a.height / 2);

        const minX = (a.width + b.width) / 2 + pad;
        const minY = (a.height + b.height) / 2 + pad;

        const overlapX = minX - Math.abs(dx);
        const overlapY = minY - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          if (overlapX < overlapY) {
            const shift = overlapX / 2 + 1;
            const dir = dx >= 0 ? 1 : -1;
            a.x = Math.max(40, a.x - dir * shift);
            b.x = Math.max(40, b.x + dir * shift);
          } else {
            const shift = overlapY / 2 + 1;
            const dir = dy >= 0 ? 1 : -1;
            a.y = Math.max(40, a.y - dir * shift);
            b.y = Math.max(40, b.y + dir * shift);
          }
        }
      }
    }

    if (!moved) break;
  }

  const result: Record<string, GraphNodePos> = {};
  boxes.forEach((b) => {
    result[b.key] = {
      x: Math.round(b.x),
      y: Math.round(b.y),
      delay: b.delay,
    };
  });

  return result;
};

// aparta temporalmente los nodos vecinos cuando un juego se expande en el grafo
export const computeDisplacedGameCoords = (
  games: Game[],
  baseLayout: Record<string, GraphNodePos>,
  activeGame: Game | null
): Record<number, GraphNodePos> => {
  const activeCoord = activeGame ? baseLayout[`game-${activeGame.id}`] : null;
  const result: Record<number, GraphNodePos> = {};

  games.forEach((game) => {
    const basePos = baseLayout[`game-${game.id}`] || { x: 110, y: 95, delay: '0s' };
    let pushX = 0;
    let pushY = 0;

    if (activeCoord && activeGame?.id !== game.id) {
      const dx = basePos.x - activeCoord.x;
      const dy = basePos.y - activeCoord.y;
      if (dx > -260 && dx < 980 && dy > -190 && dy < 600) {
        pushX = dx < 290 ? -310 : 420;
        pushY = dy < 165 ? -210 : 280;
      }
    }

    result[game.id] = {
      x: basePos.x + pushX,
      y: basePos.y + pushY,
      delay: basePos.delay,
    };
  });

  return result;
};

// conecta cada nodo con sus 4 vecinos mas cercanos sin duplicar aristas
export const computeGraphEdges = (
  games: Game[],
  effectiveCoords: Record<number, GraphNodePos>,
  activeAds: CatalogAdSlot[],
  baseLayout: Record<string, GraphNodePos>
): GraphEdge[] => {
  const edgesMap = new Map<string, GraphEdge>();
  const allNodes: Array<{ key: string; cx: number; cy: number }> = [];

  games.forEach((g) => {
    const pos = effectiveCoords[g.id];
    if (!pos) return;
    allNodes.push({
      key: `game-${g.id}`,
      cx: pos.x + GRAPH_CARD_WIDTH / 2,
      cy: pos.y + GRAPH_CARD_HEIGHT / 2,
    });
  });

  activeAds.forEach((ad) => {
    const pos = baseLayout[`ad-${ad.id}`];
    if (!pos) return;
    allNodes.push({
      key: `ad-${ad.id}`,
      cx: pos.x + ad.graphSize.width / 2,
      cy: pos.y + ad.graphSize.height / 2,
    });
  });

  allNodes.forEach((nodeA) => {
    const neighbors = allNodes
      .filter((nodeB) => nodeB.key !== nodeA.key)
      .map((nodeB) => ({
        nodeB,
        dist: Math.hypot(nodeA.cx - nodeB.cx, nodeA.cy - nodeB.cy),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4);

    neighbors.forEach(({ nodeB }) => {
      const edgeKey = [nodeA.key, nodeB.key].sort().join('__');
      if (!edgesMap.has(edgeKey)) {
        edgesMap.set(edgeKey, {
          keyA: nodeA.key,
          keyB: nodeB.key,
          x1: nodeA.cx,
          y1: nodeA.cy,
          x2: nodeB.cx,
          y2: nodeB.cy,
        });
      }
    });
  });

  return Array.from(edgesMap.values());
};