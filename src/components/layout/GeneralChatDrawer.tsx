import React from 'react';
import { soundManager } from '../../data/audioConfig';
// @ts-ignore
//import RedTeamChat from '../../modules/chat/RedTeamChat.jsx';

interface GeneralChatDrawerProps {
  isOpen: boolean;
  currentUser?: string;
  onClose: () => void;
}

export const GeneralChatDrawer: React.FC<GeneralChatDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <aside className={`platform-right-chat-drawer ${!isOpen ? 'closed' : ''}`} aria-label="Chat General">
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--panel-inset-bg)',
          borderBottom: 'var(--border-thick) solid var(--panel-border-outer)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>CHAT GENERAL</strong>
        <button
          type="button"
          className="icon-close-x-btn"
          onClick={() => {
            soundManager.playClose();
            onClose();
          }}
          title="Cerrar Chat"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {isOpen && (<span>Chat, sera reemplazado por el del equipo rojo</span>) //<RedTeamChat />
        }
      </div>
    </aside>
  );
};