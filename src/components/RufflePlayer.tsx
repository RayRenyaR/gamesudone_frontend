
import React, { useEffect, useRef } from 'react';

interface RufflePlayerProps {
  swfUrl: string;
}

declare global {
  interface Window {
    RufflePlayer?: {
      newest: () => {
        createPlayer: () => HTMLElement & {
          load: (url: string) => void;
          style: CSSStyleDeclaration;
        };
      };
    };
  }
}

export const RufflePlayer: React.FC<RufflePlayerProps> = ({ swfUrl }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const mountRuffle = () => {
      if (!isMounted || !containerRef.current || !window.RufflePlayer) return;
      containerRef.current.innerHTML = '';
      const ruffle = window.RufflePlayer.newest();
      const player = ruffle.createPlayer();
      player.style.width = '100%';
      player.style.height = '100%';
      containerRef.current.appendChild(player);
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