import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: number;
  channel: 'General' | 'Team' | 'Friend';
  sender: string;
  text: string;
}

export const FloatingChatBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeChannel, setActiveChannel] = useState<'General' | 'Team' | 'Friend'>('General');
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, channel: 'General', sender: 'laura_gamer', text: '¡Alguien para superar mi récord en UDOWare?' },
    { id: 2, channel: 'General', sender: 'juanito99', text: '¡El nivel rápido está difícil!' },
    { id: 3, channel: 'Team', sender: 'carlos_dev', text: 'Servidor Spring Boot conectado en el puerto 8080.' },
  ]);

  // Posición inicial flotante abajo a la derecha
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: window.innerWidth - 95,
    y: window.innerHeight - 95,
  });

  const isDraggingRef = useRef<boolean>(false);
  const movedDuringDragRef = useRef<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    movedDuringDragRef.current = false;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      movedDuringDragRef.current = true;

      const nextX = Math.max(10, Math.min(window.innerWidth - 75, e.clientX - dragOffsetRef.current.x));
      const nextY = Math.max(10, Math.min(window.innerHeight - 75, e.clientY - dragOffsetRef.current.y));
      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleBubbleClick = () => {
    // Solo abre o cierra el chat si fue un clic y no un arrastre por la pantalla
    if (!movedDuringDragRef.current) {
      setIsOpen((prev) => !prev);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now(),
        channel: activeChannel,
        sender: 'Tú',
        text: inputText.trim(),
      },
    ]);
    setInputText('');
  };

  const filteredMessages = messages.filter((m) => m.channel === activeChannel);

  return (
    <div
      className="floating-chat-wrapper"
      style={{
        left: `${ isOpen ? Math.min(position.x, window.innerWidth - 370) : position.x }px`,
        top: `${ isOpen ? Math.max(80, position.y - 420) : position.y }px`,
      }}
    >
      {isOpen && (
        <div className="chat-global-window">
          <div className="chat-window-topbar">
            <span>💬 Chat Global (Grupo Rojo)</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFF3B0',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ✕
            </button>
          </div>

          {/* Pestañas de Canal (General | Team | [Friend]) */}
          <div className="chat-channel-tabs">
            {(['General', 'Team', 'Friend'] as const).map((tab) => (
              <button
                key={tab}
                className={`chat-tab-btn ${activeChannel === tab ? 'active' : ''}`}
                onClick={() => setActiveChannel(tab)}
              >
                {tab === 'Friend' ? '[Friend]' : tab}
              </button>
            ))}
          </div>

          {/* Ventana de Mensajes */}
          <div className="chat-messages-area">
            {filteredMessages.map((msg) => (
              <div key={msg.id} className="chat-msg-row">
                <strong style={{ color: '#E09F3E' }}>[{msg.sender}]: </strong>
                <span>{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Barra inferior para escribir mensaje */}
          <form className="chat-input-row" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input-box"
              placeholder="Haz clic aquí para chatear..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="chat-send-btn">
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Burbuja flotante arrastrable (Ejemplo Chat 1) */}
      <div
        className="chat-bubble-trigger"
        onMouseDown={handleMouseDown}
        onClick={handleBubbleClick}
        title="Arrastra para mover o haz clic para abrir el Chat"
      >
        C
        <span className="chat-bubble-badge">💬</span>
      </div>
    </div>
  );
};