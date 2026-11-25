import React, { useState, useEffect } from 'react';
import { type SeasonalThemeId } from '../../data/seasonalThemes';

interface SeasonalBackdropLayerProps {
  themeId: SeasonalThemeId;
  lowSpecMode: boolean;
}

const SNOWFLAKES = [
  { left: '6%', size: 6, dur: '11s', delay: '-2s' },
  { left: '15%', size: 4, dur: '14s', delay: '-6s' },
  { left: '24%', size: 7, dur: '10s', delay: '-1s' },
  { left: '34%', size: 5, dur: '15s', delay: '-8s' },
  { left: '43%', size: 6, dur: '12s', delay: '-4s' },
  { left: '53%', size: 4, dur: '13s', delay: '-9s' },
  { left: '62%', size: 7, dur: '11s', delay: '-3s' },
  { left: '72%', size: 5, dur: '16s', delay: '-7s' },
  { left: '81%', size: 6, dur: '10s', delay: '-5s' },
  { left: '91%', size: 5, dur: '14s', delay: '-2s' },
];

const ORNAMENTS = [
  { left: '14%', size: 84, color: 'red', dur: '20s', delay: '0s' },
  { left: '36%', size: 64, color: 'gold', dur: '24s', delay: '-7s' },
  { left: '66%', size: 92, color: 'green', dur: '22s', delay: '-12s' },
  { left: '84%', size: 70, color: 'red', dur: '26s', delay: '-4s' },
];

const TOP_LIGHTS = Array.from({ length: 18 }, (_, i) => i);

export const SeasonalBackdropLayer: React.FC<SeasonalBackdropLayerProps> = ({
  themeId,
  lowSpecMode,
}) => {
  const [santaRunId, setSantaRunId] = useState<number>(0);
  const [santaTopPct, setSantaTopPct] = useState<number>(18);
  const [santaReverse, setSantaReverse] = useState<boolean>(false);

  // dispara apariciones repentinas de santa volando cada 14 a 24 segundos
  useEffect(() => {
    if (themeId !== 'christmas' || lowSpecMode) {
      setSantaRunId(0);
      return;
    }

    let timeoutId: number | null = null;

    const scheduleNextFlight = (initialDelay?: number) => {
      const waitMs = initialDelay ?? 14000 + Math.floor(Math.random() * 10000);
      timeoutId = window.setTimeout(() => {
        setSantaTopPct(10 + Math.floor(Math.random() * 26));
        setSantaReverse(Math.random() > 0.5);
        setSantaRunId((prev) => prev + 1);
        scheduleNextFlight();
      }, waitMs);
    };

    // primera aparicion rapida a los 5 segundos para notar el efecto comico
    scheduleNextFlight(5000);

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [themeId, lowSpecMode]);

  if (themeId !== 'christmas') {
    return (
      <div className="lava-lamp-container" aria-hidden="true">
        <svg
          className="ghost-fibers-svg"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path d="M-100 180 C 320 420, 720 -80, 1540 240" stroke="var(--fiber-line-1)" strokeWidth="3.5" />
          <path d="M-100 340 C 420 80, 880 580, 1540 190" stroke="var(--fiber-line-2)" strokeWidth="2.5" />
          <path d="M-100 620 C 380 320, 920 820, 1540 480" stroke="var(--fiber-line-1)" strokeWidth="4" />
          <path d="M-100 760 C 520 640, 760 220, 1540 720" stroke="var(--fiber-line-2)" strokeWidth="2" />
        </svg>
        <div className="lava-blob blob-1" />
        <div className="lava-blob blob-2" />
      </div>
    );
  }

  return (
    <div className="lava-lamp-container christmas-backdrop" aria-hidden="true">
      {/* guirnalda de luces parpadeantes en el borde superior */}
      <div className="xmas-top-lights">
        {TOP_LIGHTS.map((idx) => (
          <span
            key={idx}
            className={`xmas-bulb bulb-color-${idx % 4}`}
            style={{ animationDelay: `${(idx % 4) * 0.35}s` }}
          />
        ))}
      </div>

      {/* arbol de navidad retro luminoso al fondo */}
      <svg
        className="xmas-bg-tree"
        viewBox="0 0 360 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="155" y="370" width="50" height="65" rx="8" fill="rgba(96, 48, 22, 0.52)" />
        <polygon points="180,34 86,162 274,162" fill="rgba(20, 118, 78, 0.34)" stroke="rgba(167, 243, 208, 0.25)" strokeWidth="3" />
        <polygon points="180,118 58,268 302,268" fill="rgba(16, 102, 66, 0.36)" stroke="rgba(167, 243, 208, 0.24)" strokeWidth="3" />
        <polygon points="180,206 32,378 328,378" fill="rgba(12, 86, 56, 0.4)" stroke="rgba(167, 243, 208, 0.22)" strokeWidth="3" />
        {/* estrella brillante en la punta */}
        <polygon
          points="180,6 189,26 210,28 194,42 199,62 180,51 161,62 166,42 150,28 171,26"
          fill="#ffd166"
          opacity="0.88"
        />
        {/* esferas decorativas dentro del arbol */}
        <circle cx="152" cy="140" r="8" fill="#ff3b5c" opacity="0.7" />
        <circle cx="212" cy="146" r="7" fill="#ffd166" opacity="0.75" />
        <circle cx="130" cy="236" r="9" fill="#ffd166" opacity="0.7" />
        <circle cx="192" cy="222" r="8" fill="#ff3b5c" opacity="0.7" />
        <circle cx="238" cy="248" r="8" fill="#5ce1e6" opacity="0.65" />
        <circle cx="106" cy="336" r="10" fill="#ff3b5c" opacity="0.7" />
        <circle cx="176" cy="322" r="9" fill="#5ce1e6" opacity="0.65" />
        <circle cx="250" cy="340" r="10" fill="#ffd166" opacity="0.7" />
      </svg>

      {/* bolas de navidad flotantes sustituyendo la lava */}
      {!lowSpecMode &&
        ORNAMENTS.map((orb, idx) => (
          <div
            key={idx}
            className={`xmas-floating-ornament ornament-${orb.color}`}
            style={{
              left: orb.left,
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              animationDuration: orb.dur,
              animationDelay: orb.delay,
            }}
          />
        ))}

      {/* nieve cayendo suavemente */}
      {!lowSpecMode &&
        SNOWFLAKES.map((flake, idx) => (
          <span
            key={idx}
            className="xmas-snowflake"
            style={{
              left: flake.left,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              animationDuration: flake.dur,
              animationDelay: flake.delay,
            }}
          />
        ))}

      {/* santa claus repentino cruzando el cielo en trineo */}
      {!lowSpecMode && santaRunId > 0 && (
        <div
          key={santaRunId}
          className={`xmas-flying-santa ${santaReverse ? 'fly-rtl' : 'fly-ltr'}`}
          style={{ top: `${santaTopPct}%` }}
        >
          <span className="xmas-santa-bubble">JO JO JO!</span>
          <svg width="210" height="68" viewBox="0 0 210 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* riendas doradas */}
            <path d="M90 36 Q125 42 162 32" stroke="#ffd166" strokeWidth="2" strokeDasharray="4 3" />
            {/* trineo */}
            <path d="M18 48 H84 Q96 48 99 38" stroke="#ffd166" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M24 26 L44 38 H84 L92 24 H64 L54 32 H34 Z" fill="#e6193c" stroke="#ffd166" strokeWidth="2.5" />
            {/* saco de regalos */}
            <circle cx="42" cy="24" r="11" fill="#059669" stroke="#ffd166" strokeWidth="2" />
            {/* santa con gorrito */}
            <circle cx="67" cy="20" r="8" fill="#fde2c4" />
            <path d="M59 17 Q67 4 79 13 Z" fill="#e6193c" />
            <circle cx="80" cy="14" r="3" fill="#ffffff" />
            <path d="M61 23 Q67 30 73 23 Z" fill="#ffffff" />
            {/* reno principal */}
            <ellipse cx="164" cy="36" rx="18" ry="9" fill="#8d5524" />
            <circle cx="182" cy="26" r="7" fill="#8d5524" />
            {/* nariz roja brillante de rodolfo */}
            <circle cx="190" cy="27" r="3.5" fill="#ff2a6d" />
            {/* astas */}
            <path d="M179 20 L175 10 M177 14 L182 11 M183 19 L187 10" stroke="#ffd166" strokeWidth="2" strokeLinecap="round" />
            {/* patas corriendo */}
            <path d="M150 43 L143 55 M158 44 L156 56 M172 43 L179 55 M178 41 L188 50" stroke="#6b3e19" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
};