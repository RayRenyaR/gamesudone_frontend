import React, { useState } from 'react';
import { soundManager } from '../../data/audioConfig';

interface GeneralChatMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
}

interface GeneralChatDrawerProps {
  isOpen: boolean;
  currentUser?: string;
  onClose: () => void;
}

export const GeneralChatDrawer: React.FC<GeneralChatDrawerProps> = ({
  isOpen,
  currentUser = 'Rayner_UDO',
  onClose,
}) => {
  // estado temporal hasta conectar el modulo definitivo del grupo rojo
  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<GeneralChatMessage[]>([
    { id: 1, sender: 'laura_gamer', text: 'Bienvenido al chat general de gamesUDONE.', time: '16:10' },
    { id: 2, sender: 'Ruben_Dev', text: 'Componente desacoplado listo para integrar.', time: '16:12' },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    soundManager.playClick();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: currentUser,
        text: chatInput.trim(),
        time: timeStr,
      },
    ]);
    setChatInput('');
  };

  return (
    <aside className={`y2k-right-chat-drawer ${!isOpen ? 'closed' : ''}`} aria-label="Chat General">
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--panel-inset-bg)',
          borderBottom: 'var(--border-thick) solid var(--panel-border-outer)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>CHAT GENERAL</strong>
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

      <div
        style={{
          flex: 1,
          padding: '14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              background: 'var(--panel-card-bg)',
              color: 'var(--text-main)',
              padding: '9px 12px',
              borderRadius: '10px',
              borderLeft: '4px solid var(--primary-top)',
              fontSize: '0.86rem',
            }}
          >
            <div>
              <strong style={{ color: 'var(--accent-gold)', marginRight: 6 }}>{msg.sender}:</strong>
              <span>{msg.text}</span>
            </div>
            <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{msg.time}</small>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '12px',
          background: 'var(--panel-inset-bg)',
          borderTop: 'var(--border-thick) solid var(--panel-border-outer)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Escribe en el chat..."
          style={{
            flex: 1,
            background: 'var(--panel-card-bg)',
            border: '2px solid var(--panel-border-outer)',
            borderRadius: '10px',
            padding: '8px 10px',
            color: 'var(--text-main)',
            outline: 'none',
            fontSize: '0.86rem',
          }}
        />
        <button type="submit" className="tactile-btn-purple" style={{ padding: '0 14px', fontSize: '0.84rem' }}>
          Enviar
        </button>
      </form>
    </aside>
  );
};