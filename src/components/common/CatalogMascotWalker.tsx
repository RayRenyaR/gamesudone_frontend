import React, { useState, useEffect } from 'react';

export interface PetConfig {
  id: string;
  label: string;
  imageUrl?: string;
  clickMessage: string;
}

const PET_PRESETS: Record<string, PetConfig> = {
  morrocoya: {
    id: 'morrocoya',
    label: 'Morrocoya',
    imageUrl: '/assets/pets/morrocoya.png',
    clickMessage: 'wa!',
  },
};

export const CatalogMascotWalker: React.FC = () => {
  const [posX, setPosX] = useState<number>(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isScared, setIsScared] = useState<boolean>(false);

  const activePetId = localStorage.getItem('udo_active_pet') || 'morrocoya';
  const pet = PET_PRESETS[activePetId] || PET_PRESETS.morrocoya;

  useEffect(() => {
    const interval = setInterval(() => {
      if (isScared) return;
      setPosX((prev) => {
        const next = prev + direction * 2;
        if (next > 620) {
          setDirection(-1);
          return 620;
        }
        if (next < 0) {
          setDirection(1);
          return 0;
        }
        return next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [direction, isScared]);

  const handlePetClick = () => {
    setIsScared(true);
    setTimeout(() => setIsScared(false), 1400);
  };

  return (
    <div className="morrocoya-easter-track" aria-hidden="true">
      <div
        className="morrocoya-walker"
        style={{ left: `${posX}px` }}
        onClick={handlePetClick}
      >
        <div className={isScared ? 'shell-wobble-anim' : ''}>
          {pet.imageUrl ? (
            <img
              src={pet.imageUrl}
              alt={pet.label}
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'contain',
                transform: direction === -1 ? 'scaleX(-1)' : 'scaleX(1)',
              }}
            />
          ) : (
            <svg width="34" height="28" viewBox="0 0 36 28" fill="none">
              <path d="M6 18C6 11 11 7 18 7C25 7 30 11 30 18H6Z" fill="var(--accent-emerald)" stroke="#fff" strokeWidth="2" />
              <circle cx="31" cy="17" r="3" fill="var(--accent-gold)" />
              <rect x="9" y="18" width="4" height="5" rx="1.5" fill="var(--accent-gold)" />
              <rect x="23" y="18" width="4" height="5" rx="1.5" fill="var(--accent-gold)" />
            </svg>
          )}
        </div>
        {isScared && <span className="morrocoya-shell-tooltip">{pet.clickMessage}</span>}
      </div>
    </div>
  );
};