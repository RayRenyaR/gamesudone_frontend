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
  ageRatingName: string;
  ageBadgeColor: string;
  coverUrl: string;
  previewUrl?: string | null;
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
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [popupCoords, setPopupCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const timerRef = useRef<number | null>(null);
  const cardWrapperRef = useRef<HTMLDivElement | null>(null);

  // Calcula dónde colocar el hover para que jamás se salga por la derecha ni por abajo
  const calculatePopupPosition = () => {
    if (!cardWrapperRef.current) return;
    const rect = cardWrapperRef.current.getBoundingClientRect();
    const popupWidth = 285;
    const popupEstimatedHeight = 250;
    const margin = 12;

    // 1. Posición Horizontal: a la derecha por defecto; si no cabe, sale por la izquierda
    let left = rect.right + margin;
    if (left + popupWidth > window.innerWidth - margin) {
      left = rect.left - popupWidth - margin;
    }
    // Si la tarjeta es muy ancha (como en el carrusel) y tampoco cabe a la izquierda, lo alinea adentro a la derecha
    if (left < margin) {
      left = Math.max(margin, window.innerWidth - popupWidth - margin);
    }

    // 2. Posición Vertical: alineado arriba de la tarjeta; si se corta abajo, sube automáticamente
    let top = rect.top;
    if (top + popupEstimatedHeight > window.innerHeight - margin) {
      top = Math.max(80, window.innerHeight - popupEstimatedHeight - margin);
    }

    setPopupCoords({ top, left });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    timerRef.current = window.setTimeout(() => {
      calculatePopupPosition();
      setShowPopup(true);
    }, 1500); // 1.5 segundos exactos
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowPopup(false);
  };

  return (
    <div
      ref={cardWrapperRef}
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
            src={isHovered && game.previewUrl ? game.previewUrl : game.coverUrl}
            alt={game.title}
            className="game-card-cover"
          />
        </div>
      </div>

      {/* Recuadro con el estilo suave de la página general y posición calculada */}
      {showPopup && (
        <div
          className="hover-details-popup"
          style={{
            top: `${popupCoords.top}px`,
            left: `${popupCoords.left}px`,
          }}
        >
          <div className="popup-title">{game.title}</div>
          <p className="popup-text">
            <strong>Descripción:</strong> {game.description}
          </p>
          <p className="popup-text">
            <strong>Categorías:</strong> {game.categories.join(', ')}
          </p>
          <p className="popup-text">
            <strong>Edad recomendada:</strong>
            <span
              className="age-rating-badge"
              style={{ backgroundColor: game.ageBadgeColor || '#28a745' }}
            >
              {game.ageRatingName}
            </span>
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