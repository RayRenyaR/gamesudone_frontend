import React, { useEffect, useRef } from 'react';

interface RufflePlayerProps {
  swfUrl: string;
}

// navega cualquier iframe activo de juego a about:blank para destruir su contexto
export function killGlobalRuffleInstance(): void {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('iframe[data-game-runtime="true"]').forEach((node) => {
    const frame = node as HTMLIFrameElement;
    try {
      frame.src = 'about:blank';
    } catch {
      // ignora si el nodo ya fue retirado
    }
  });
}

export const RufflePlayer: React.FC<RufflePlayerProps> = ({ swfUrl }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const runnerSrc = `/ruffle-runner.html?swf=${encodeURIComponent(swfUrl)}`;

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;

    // asigna la ruta en el efecto para soportar el doble ciclo de react strictmode
    frame.src = runnerSrc;

    return () => {
      try {
        frame.src = 'about:blank';
      } catch {
        // ignora errores al limpiar
      }
    };
  }, [runnerSrc]);

  return (
    <iframe
      ref={iframeRef}
      data-ruffle-runner="true"
      data-game-runtime="true"
      title="Emulador Flash Ruffle"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
        backgroundColor: '#000000',
      }}
      allowFullScreen
    />
  );
};