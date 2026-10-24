import React, { useState, useRef } from 'react';

export interface ScoreEntry {
  player: string;
  score: number;
}

export interface Game {
  id: number;
  title: string;
  description: string;
  controls: string;
  categories: string[];
  ageRating: string;
  coverUrl: string;
  isRecommended?: boolean;
  hasRanked?: boolean;
  leaderboard?: ScoreEntry[];
  likes: number;
  dislikes: number;
}

interface GameCardProps {
  game: Game;
  size?: 'normal' | 'featured';
  onPlayClick: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, size = 'normal', onPlayClick }) => {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = window.setTimeout(() => {
      setShowPopup(true);
    }, 1500);
  };

  const handleMouseLeave = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowPopup(false);
  };

  return (
    <div
      className="game-card-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`game-card ${size === 'featured' ? 'featured' : ''}`}
        onClick={() => onPlayClick(game)}
      >
        <div className="game-card-title-bar">{game.title}</div>
        <img
          src={game.coverUrl}
          alt={game.title}
          className="game-card-cover"
        />
      </div>

      {showPopup && (
        <div className="hover-details-popup">
          <div className="popup-title">{game.title}</div>
          <p className="popup-text">
            <strong>Descripción:</strong> {game.description}
          </p>
          <p className="popup-text">
            <strong>Categorías:</strong> {game.categories.join(', ')}
          </p>
          <p className="popup-text">
            <strong>Edad recomendada:</strong> {game.ageRating}
          </p>
          <button
            className="popup-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPlayClick(game);
            }}
          >
            Jugar ahora
          </button>
        </div>
      )}
    </div>
  );
};