import React, { useState, useEffect, useMemo } from 'react';
import { type Game } from '../../data/gamesData';
import { soundManager } from '../../data/audioConfig';

interface RecommendedBubblesTrayProps {
  recommendedGames: Game[];
  onSelectGame: (game: Game) => void;
}

interface SlotPose {
  x: number;
  scale: number;
  opacity: number;
  zIndex: number;
  interactive: boolean;
}

// 5 carriles matematicamente espaciados (base 220x152, gap constante de 12px)
// indice 0: saliente izq | 1: primero | 2: segundo | 3: tercero | 4: entrante der
const SLOT_POSES: SlotPose[] = [
  { x: -240, scale: 1, opacity: 0, zIndex: 1, interactive: false },
  { x: 0, scale: 1, opacity: 1, zIndex: 4, interactive: true },
  { x: 232, scale: 0.82, opacity: 0.92, zIndex: 3, interactive: true },
  { x: 424, scale: 0.66, opacity: 0.8, zIndex: 2, interactive: true },
  { x: 581, scale: 0.52, opacity: 0, zIndex: 1, interactive: false },
];

const SLIDE_INTERVAL_MS = 4200;

const safeMod = (value: number, length: number): number => {
  return ((value % length) + length) % length;
};

export const RecommendedBubblesTray: React.FC<RecommendedBubblesTrayProps> = ({
  recommendedGames,
  onSelectGame,
}) => {
  const [step, setStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const count = recommendedGames.length;
  const listSignature = useMemo(
    () => recommendedGames.map((g) => g.id).join('-'),
    [recommendedGames]
  );

  // reinicia el carrusel solo si cambia la lista de recomendados
  useEffect(() => {
    setStep(0);
  }, [listSignature]);

  // avanza un paso de forma continua y se pausa al pasar el cursor
  useEffect(() => {
    if (count < 3 || isPaused) return;

    const intervalId = window.setInterval(() => {
      setStep((prev) => prev + 1);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [count, isPaused]);

  if (count === 0) return null;

  // si hay menos de 3 juegos, muestra los disponibles sin ciclar
  const trackIndices =
    count < 3
      ? Array.from({ length: count }, (_, idx) => idx)
      : [step - 1, step, step + 1, step + 2, step + 3];

  return (
    <div
      className="recommended-ladder-dock"
      aria-label="Juegos recomendados"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="recommended-slides-stage">
        {trackIndices.map((trackIndex) => {
          const slotOffset = count < 3 ? trackIndex : trackIndex - step;
          const pose = SLOT_POSES[slotOffset + 1];
          const game = recommendedGames[safeMod(trackIndex, count)];

          if (!pose || !game) return null;

          return (
            <div
              key={`${listSignature}-${trackIndex}`}
              className="recommended-slide-slot"
              style={{
                transform: `translate3d(${pose.x}px, 0, 0) scale(${pose.scale})`,
                opacity: pose.opacity,
                zIndex: pose.zIndex,
                pointerEvents: pose.interactive ? 'auto' : 'none',
              }}
            >
              <article
                className="recommended-slide-card"
                onClick={() => {
                  soundManager.playClick();
                  onSelectGame(game);
                }}
                title={`Recomendado: ${game.title}`}
              >
                <div className="recommended-card-header">
                  <span className="recommended-card-tag">RECOMENDADO</span>
                  <span className="recommended-card-cat">{game.categories[0]}</span>
                </div>

                <div className="recommended-card-thumb">
                  <img src={game.coverUrl} alt={game.title} draggable={false} />
                </div>

                <div className="recommended-card-footer">
                  <div className="recommended-card-title">{game.title}</div>
                  <div className="recommended-card-hint">Clic para abrir</div>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
};