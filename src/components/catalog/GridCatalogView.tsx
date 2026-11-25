import React, { useState } from 'react';
import { type Game } from '../../data/gamesData';
import { type CatalogAdSlot } from '../../data/adSlotsData';
import { type SeasonalThemeId } from '../../data/seasonalThemes';
import { type CatalogGridItem } from '../../services/catalogLayoutEngine';
import { soundManager } from '../../data/audioConfig';
import { CatalogCardBadge } from './CatalogCardBadge';
import { GameSeasonalOverlay } from '../seasonal/SeasonalDecorations';

interface GridCatalogViewProps {
  layoutVariant: 'mosaic' | 'channels';
  items: CatalogGridItem[];
  favorites: number[];
  recommendedIds: Set<number>;
  onlyFavorites: boolean;
  seasonalThemeId: SeasonalThemeId;
  onSelectGame: (game: Game) => void;
}

const renderAdTile = (ad: CatalogAdSlot, layoutVariant: 'mosaic' | 'channels') => {
  if (layoutVariant === 'channels') {
    return (
      <div
        key={ad.id}
        className="catalog-channel-tile pop-item-enter ad-slot-card-border"
        onClick={() => soundManager.playClick()}
        title={`Espacio publicitario: ${ad.slotCode}`}
      >
        <div className="catalog-channel-inner ad-card-surface">
          <CatalogCardBadge label="ANUNCIO" />
          <div className="ad-card-copy">
            <span className="ad-slot-code">{ad.slotCode}</span>
            <div className="ad-card-sub">{ad.subtitle}</div>
          </div>
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.88rem',
            fontWeight: 600,
            paddingTop: '6px',
            color: 'var(--primary-border)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {ad.title}
        </div>
      </div>
    );
  }

  return (
    <article
      key={ad.id}
      className={`game-bevel-card size-${ad.bentoSize} pop-item-enter ad-slot-card-border`}
      onClick={() => soundManager.playClick()}
      title={`Espacio publicitario: ${ad.slotCode}`}
    >
      <div className="game-card-inner-clip ad-card-surface">
        <CatalogCardBadge label="ANUNCIO" />
        <div className="ad-card-copy">
          <span className="ad-slot-code">{ad.slotCode}</span>
          <div className="ad-card-title">{ad.title}</div>
          <div className="ad-card-sub">{ad.subtitle}</div>
        </div>
      </div>
    </article>
  );
};

export const GridCatalogView: React.FC<GridCatalogViewProps> = ({
  layoutVariant,
  items,
  favorites,
  recommendedIds,
  onlyFavorites,
  seasonalThemeId,
  onSelectGame,
}) => {
  const [hoveredGameId, setHoveredGameId] = useState<number | null>(null);

  return (
    <div className={layoutVariant === 'mosaic' ? 'catalog-mosaic-grid' : 'catalog-channel-grid'}>
      {items.map((item) => {
        if (item.kind === 'ad') {
          return renderAdTile(item.data, layoutVariant);
        }

        const game = item.data;
        const isHovered = hoveredGameId === game.id;
        const isFav = favorites.includes(game.id);
        const isRec = recommendedIds.has(game.id);
        const sizeClass = `size-${game.bentoSize || 'small'}`;
        const key = `${game.id}-${onlyFavorites ? 'fav' : 'all'}`;

        if (layoutVariant === 'channels') {
          return (
            <div
              key={key}
              className={`catalog-channel-tile pop-item-enter ${isFav ? 'is-favorite-card' : ''}`}
              onMouseEnter={() => {
                soundManager.playHover();
                setHoveredGameId(game.id);
              }}
              onMouseLeave={() => setHoveredGameId(null)}
              onClick={() => onSelectGame(game)}
            >
              <GameSeasonalOverlay themeId={seasonalThemeId} gameId={game.id} />
              <div className="catalog-channel-inner">
                {isRec && <CatalogCardBadge label="RECOMENDADO" />}
                <img
                  src={isHovered && game.previewGifUrl ? game.previewGifUrl : game.coverUrl}
                  alt={game.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  paddingTop: '6px',
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {game.title}
              </div>
            </div>
          );
        }

        return (
          <article
            key={key}
            className={`game-bevel-card ${sizeClass} pop-item-enter ${isFav ? 'is-favorite-card' : ''}`}
            onMouseEnter={() => {
              soundManager.playHover();
              setHoveredGameId(game.id);
            }}
            onMouseLeave={() => setHoveredGameId(null)}
            onClick={() => onSelectGame(game)}
          >
            <GameSeasonalOverlay themeId={seasonalThemeId} gameId={game.id} />
            <div className="game-card-inner-clip">
              {isRec && <CatalogCardBadge label="RECOMENDADO" />}
              <img
                src={isHovered && game.previewGifUrl ? game.previewGifUrl : game.coverUrl}
                alt={game.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 45%, rgba(9, 5, 18, 0.92) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '12px',
                }}
              >
                <div style={{ color: '#ffffff', fontSize: '0.96rem', fontWeight: 600 }}>
                  {game.title}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};