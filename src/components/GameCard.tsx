import React, { useState, useRef } from 'react';

export interface ScoreEntry {
  player: string;
  score: number;
}

export interface Game {
  id: number;
  title: string;
  alias: string;
  description: string;
  controls: string;
  categories: string[];
  ageRating: string;
  coverUrl: string;
  previewGifUrl?: string; // Animación tipo GIF al hacer hover en la portada
  gameUrl?: string | null;
  descargaUrl?: string | null;
  tipo?: 'WEB' | 'DESCARGABLE';
  isRecommended?: boolean;
  hasRanked?: boolean;
  likes: number;
  dislikes: number;
}

interface GameCardProps {
  game: Game;
  size?: 'normal' | 'featured';
  onPlayClick: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, size = 'normal', onPlayClick }) => {
  // Controla si el cursor está encima para reproducir el GIF de preview de inmediato
  const [isHovered, setIsHovered] = useState<boolean>(false);
  // Controla si ya pasaron los 1.5 segundos para abrir el cuadro emergente de especificaciones
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    timerRef.current = window.setTimeout(() => {
      setShowPopup(true);
    }, 1500);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowPopup(false);
  };

  const totalVotes = game.likes + game.dislikes;
  const positivePercent = totalVotes > 0 ? Math.round((game.likes / totalVotes) * 100) : 100;

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
        <div className="cover-media-container">
          <img
            src={isHovered && game.previewGifUrl ? game.previewGifUrl : game.coverUrl}
            alt={game.title}
            className="game-card-cover"
          />
          {isHovered && game.previewGifUrl && (
            <span className="preview-gif-badge">▶ PREVIEW GIF</span>
          )}
        </div>
      </div>

      {/* Cuadro emergente estilo Steam tras 1.5 segundos */}
      {showPopup && (
        <div className="hover-details-popup">
          <div className="popup-title">{game.title}</div>
          <div className="popup-subdate">
            Modalidad: {game.tipo || 'WEB'} • {game.ageRating}
          </div>
          <p className="popup-text">{game.description}</p>

          <div className="popup-reviews-box">
            <div>Reseñas de los usuarios en conjunto:</div>
            <strong style={{ color: '#66c0f4' }}>
              {positivePercent >= 70 ? 'Muy positivas' : 'Mixtas'} ({totalVotes} votos)
            </strong>
          </div>

          <div className="popup-tags-row">
            {game.categories.map((cat) => (
              <span key={cat} className="steam-tag-pill">
                {cat}
              </span>
            ))}
          </div>

          <button
            className="popup-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPlayClick(game);
            }}
          >
            ▶ Jugar ahora
          </button>
        </div>
      )}
    </div>
  );
};