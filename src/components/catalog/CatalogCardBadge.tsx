import React from 'react';

interface CatalogCardBadgeProps {
  label?: string;
}

// insignia reutilizable para destacar tarjetas (por defecto "RECOMENDADO")
export const CatalogCardBadge: React.FC<CatalogCardBadgeProps> = ({
  label = 'RECOMENDADO',
}) => {
  return (
    <span
      style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        zIndex: 8,
        background: 'linear-gradient(90deg, var(--primary-top), var(--primary-bot))',
        color: '#ffffff',
        border: '1.5px solid #ffffff',
        borderRadius: '7px 2px 7px 2px',
        padding: '2px 8px',
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.7px',
        textTransform: 'uppercase',
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.55)',
        pointerEvents: 'none',
      }}
    >
      {label}
    </span>
  );
};