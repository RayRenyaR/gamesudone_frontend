import React from 'react';

interface Confirm3dsModalProps {
  badgeText: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  zIndex?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const Confirm3dsModal: React.FC<Confirm3dsModalProps> = ({
  badgeText,
  title,
  description,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  zIndex = 120,
  onConfirm,
  onCancel,
}) => {
  return (
    <div
      style={{
        position: zIndex > 150 ? 'fixed' : 'absolute',
        inset: 0,
        zIndex,
        background: 'rgba(8, 4, 18, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
      }}
    >
      <div
        className="tactile-panel"
        style={{
          maxWidth: '410px',
          width: '100%',
          padding: '22px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          animation: 'jellyPop 0.24s var(--ease-squish) forwards',
        }}
      >
        <span className="credit-role-badge" style={{ alignSelf: 'center' }}>
          {badgeText}
        </span>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{title}</h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-soft)', lineHeight: 1.4 }}>
          {description}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '4px' }}>
          <button
            type="button"
            className="tactile-btn-purple"
            style={{ padding: '10px 22px', fontSize: '0.86rem' }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="tactile-btn-dark"
            style={{ padding: '10px 22px', fontSize: '0.86rem' }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};