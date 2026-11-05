import React, { useState } from 'react';
import { type Game } from '../data/gamesData';

interface GameCardProps {
  game: Game;
  isSelected?: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
  imageHeight?: number;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isSelected = false,
  onClick,
  onDoubleClick,
  imageHeight = 132,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const totalVotes = game.likes + game.dislikes;
  const ratingPercent =
    totalVotes > 0 ? Math.round((game.likes / totalVotes) * 100) : 95;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        background: 'var(--panel-card-bg)',
        border:
          isSelected || isHovered
            ? '2.5px solid var(--primary-border)'
            : '2px solid var(--panel-border-outer)',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: 'var(--bevel-btn-secondary)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'none',
        transition: 'transform 0.25s var(--ease-squish), border-color 0.2s ease',
      }}
    >
      <div style={{ position: 'relative', height: `${imageHeight}px`, overflow: 'hidden' }}>
        <img
          src={isHovered && game.previewGifUrl ? game.previewGifUrl : game.coverUrl}
          alt={game.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {isHovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(16,12,28,0.2) 0%, rgba(16,12,28,0.94) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '10px',
              gap: '3px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  background: 'var(--primary-mid)',
                  color: '#ffffff',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '5px',
                }}
              >
                {game.tipo}
              </span>
              <span style={{ color: '#ffd166', fontSize: '0.75rem', fontWeight: 800 }}>
                {ratingPercent}% Positivo
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#f1f5f9' }}>{game.ageRating}</div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: '10px 12px',
          fontWeight: 800,
          fontSize: '0.88rem',
          color: 'var(--text-main)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {game.title}
      </div>
    </div>
  );
};