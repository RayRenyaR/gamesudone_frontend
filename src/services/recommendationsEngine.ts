import { type Game } from '../data/gamesData';

interface RecommendationInput {
  allGames: Game[];
  externalRecommendedGames?: Game[] | null;
}

// usa la lista del backend si existe; si no, ordena con respaldo simple
export function resolveRecommendedGames({
  allGames,
  externalRecommendedGames,
}: RecommendationInput): Game[] {
  if (Array.isArray(externalRecommendedGames) && externalRecommendedGames.length > 0) {
    const validIds = new Set(allGames.map((g) => g.id));
    const validList = externalRecommendedGames.filter((g) => validIds.has(g.id));
    if (validList.length > 0) return validList;
  }

  return [...allGames].sort((a, b) => {
    const rankA = (a.isRecommended ? 2 : 0) + (a.hasRanked ? 1 : 0);
    const rankB = (b.isRecommended ? 2 : 0) + (b.hasRanked ? 1 : 0);
    return rankB - rankA;
  });
}