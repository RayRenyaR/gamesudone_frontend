import React from 'react';
import { type SeasonalThemeId, shouldGameWearFestiveHat } from '../../data/seasonalThemes';

interface SantaHatProps {
  variant?: 'card' | 'avatar' | 'orb';
}

// gorrito de navidad estilo cartoon/y2k para posar sobre esquinas o iconos
export const SantaHatOverlay: React.FC<SantaHatProps> = ({ variant = 'card' }) => {
  return (
    <div className={`seasonal-santa-hat hat-variant-${variant}`} aria-hidden="true">
      <svg viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 38 C14 14, 34 6, 52 16 C45 20, 44 28, 46 38 Z"
          fill="#e6193c"
          stroke="#4d0011"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path
          d="M17 32 C21 17, 34 12, 44 17"
          stroke="#ff8fa3"
          strokeWidth="2.8"
          strokeLinecap="round"
          opacity="0.7"
        />
        <circle cx="53" cy="18" r="7.5" fill="#ffffff" stroke="#4d0011" strokeWidth="3" />
        <rect
          x="5"
          y="34"
          width="45"
          height="12"
          rx="6"
          fill="#ffffff"
          stroke="#4d0011"
          strokeWidth="3.2"
        />
      </svg>
    </div>
  );
};

interface GameSeasonalOverlayProps {
  themeId: SeasonalThemeId;
  gameId: number;
}

// aplica el gorrito solo a los juegos seleccionados por el gestor
export const GameSeasonalOverlay: React.FC<GameSeasonalOverlayProps> = ({
  themeId,
  gameId,
}) => {
  if (!shouldGameWearFestiveHat(gameId, themeId)) return null;
  return <SantaHatOverlay variant="card" />;
};