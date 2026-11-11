import React, { useEffect, useRef } from 'react';

interface RufflePlayerProps {
  swfUrl: string;
}

type RuffleElement = HTMLElement & {
  load: (url: string) => void;
  pause?: () => void;
  remove: () => void;
  style: CSSStyleDeclaration;
};

declare global {
  interface Window {
    RufflePlayer?: {
      newest: () => {
        createPlayer: () => RuffleElement;
      };
    };
  }
}

export const RufflePlayer: React.FC<RufflePlayerProps> = ({ swfUrl }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activePlayerRef = useRef<RuffleElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const destroyCurrentPlayer = () => {
      if (activePlayerRef.current) {
        try {
          activePlayerRef.current.pause?.();
          activePlayerRef.current.remove();
        } catch {
          // Ignorar errores al limpiar nodo
        }
        activePlayerRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };

    const mountRuffle = () => {
      if (!isMounted || !containerRef.current || !window.RufflePlayer) return;
      destroyCurrentPlayer();
      const ruffle = window.RufflePlayer.newest();
      const player = ruffle.createPlayer();
      player.style.width = '100%';
      player.style.height = '100%';
      containerRef.current.appendChild(player);
      activePlayerRef.current = player;
      player.load(swfUrl);
    };

    if (window.RufflePlayer) {
      mountRuffle();
    } else {
      const existingScript = document.querySelector('script[data-ruffle-sdk]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@ruffle-rs/ruffle';
        script.async = true;
        script.setAttribute('data-ruffle-sdk', 'true');
        script.onload = mountRuffle;
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', mountRuffle);
      }
    }

    return () => {
      isMounted = false;
      destroyCurrentPlayer();
    };
  }, [swfUrl]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  );
};