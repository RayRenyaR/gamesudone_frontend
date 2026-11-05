import React, { useState, useEffect, useRef } from 'react';

const TURTLE_WALK_PNG = '/morrocoya-walk.png';
const TURTLE_SHELL_PNG = '/morrocoya-shell.png';

type TurtleState = 'WALKING' | 'IN_SHELL' | 'WOBBLING';

export const MorrocoyaEasterEgg: React.FC = () => {
  const [posX, setPosX] = useState<number>(8);
  const [dir, setDir] = useState<1 | -1>(1);
  const [turtleState, setTurtleState] = useState<TurtleState>('WALKING');

  const cooldownTimerRef = useRef<number | null>(null);
  const wobbleTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
  };

  useEffect(() => {
    if (turtleState !== 'WALKING') return;

    const walkInterval = window.setInterval(() => {
      setPosX((prev) => {
        const next = prev + 0.16 * dir;
        if (next >= 90) {
          setDir(-1);
          return 90;
        }
        if (next <= 2) {
          setDir(1);
          return 2;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(walkInterval);
  }, [turtleState, dir]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleTurtleClick = () => {
    clearTimers();

    // Si ya está escondida o tambaleándose y le das clic -> sale de inmediato
    if (turtleState === 'IN_SHELL' || turtleState === 'WOBBLING') {
      setTurtleState('WALKING');
      return;
    }

    // Si estaba caminando -> se mete al caparazón y programa el tambaleo antes de salir sola
    setTurtleState('IN_SHELL');
    cooldownTimerRef.current = window.setTimeout(() => {
      setTurtleState('WOBBLING');
      wobbleTimerRef.current = window.setTimeout(() => {
        setTurtleState('WALKING');
      }, 650);
    }, 3200);
  };

  return (
    <footer
      className="morrocoya-easter-track"
      title={
        turtleState === 'WALKING'
          ? 'Haz clic para que se esconda en su caparazón'
          : 'Haz clic de nuevo para que salga ya'
      }
    >
      <div
        className={`morrocoya-walker ${turtleState === 'WOBBLING' ? 'shell-wobble-anim' : ''}`}
        onClick={handleTurtleClick}
        style={{ left: `${posX}%` }}
      >
        <img
          src={turtleState === 'WALKING' ? TURTLE_WALK_PNG : TURTLE_SHELL_PNG}
          alt="Morrocoya Easter Egg"
          style={{
            height: '40px',
            width: 'auto',
            objectFit: 'contain',
            transform: `scaleX(${dir === 1 ? 1 : -1})`,
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.45))',
          }}
        />
        {turtleState !== 'WALKING' && (
          <span className="morrocoya-shell-tooltip">
            {turtleState === 'WOBBLING' ? '¡Saliendo...!' : 'En su caparazón (Clic para salir)'}
          </span>
        )}
      </div>
    </footer>
  );
};