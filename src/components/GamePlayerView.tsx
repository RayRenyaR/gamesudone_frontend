import React, { useState, useRef } from 'react';
import { type Game } from './GameCard';

interface GamePlayerViewProps {
  game: Game;
  onBack: () => void;
}

export const GamePlayerView: React.FC<GamePlayerViewProps> = ({ game, onBack }) => {
  // Estados para interactuar con la pestaña del juego
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [likes, setLikes] = useState<number>(game.likes);
  const [dislikes, setDislikes] = useState<number>(game.dislikes);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);

  // Referencia al recuadro del juego para ponerlo en Pantalla Completa
  const gameScreenRef = useRef<HTMLDivElement | null>(null);

  // Cálculo del porcentaje de Likes vs Dislikes
  const totalVotes = likes + dislikes;
  const likePercentage = totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : 50;

  const handleLike = () => {
    if (userVote === 'like') {
      setLikes(likes - 1);
      setUserVote(null);
    } else {
      if (userVote === 'dislike') setDislikes(dislikes - 1);
      setLikes(likes + 1);
      setUserVote('like');
    }
  };

  const handleDislike = () => {
    if (userVote === 'dislike') {
      setDislikes(dislikes - 1);
      setUserVote(null);
    } else {
      if (userVote === 'like') setLikes(likes - 1);
      setDislikes(dislikes + 1);
      setUserVote('dislike');
    }
  };

  // Función para copiar el link del juego al portapapeles
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?juego=${game.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`¡Enlace del juego copiado al portapapeles!\n${shareUrl}`);
  };

  // Función para activar la Pantalla Completa en el recuadro del juego
  const handleFullscreen = () => {
    if (gameScreenRef.current) {
      if (!document.fullscreenElement) {
        gameScreenRef.current.requestFullscreen().catch((err) => {
          alert(`No se pudo activar pantalla completa: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="player-view-wrapper">
      {/* Fondo con la portada del juego difuminada */}
      <div
        className="player-blurred-bg"
        style={{ backgroundImage: `url(${game.coverUrl})` }}
      />

      {/* Contenido principal encima del fondo difuminado */}
      <div className="player-foreground-content">
        <div className="player-header-row">
          <h2 className="player-game-title">{game.title}</h2>
          <button className="back-catalog-btn" onClick={onBack}>
            ⬅ Volver al Catálogo
          </button>
        </div>

        {/* Ventana del juego + Tabla Ranked (1 al 10) */}
        <div className="player-main-stage">
          <div className="game-screen-column">
            <div className="game-window-frame" ref={gameScreenRef}>
              {!isPlaying ? (
                <div
                  className="game-preview-overlay"
                  style={{ backgroundImage: `url(${game.coverUrl})` }}
                >
                  <h3>Listo para iniciar {game.title}</h3>
                  <button
                    className="action-btn play-main"
                    onClick={() => setIsPlaying(true)}
                  >
                    ▶ Jugar Ahora
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#122227',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <h2>🎮 Ejecutando: {game.title}</h2>
                  <p style={{ marginTop: '10px' }}>
                    (Aquí se carga el archivo HTML5 exportado de Godot dentro del iframe)
                  </p>
                </div>
              )}
            </div>

            {/* Barra de controles inferior de izquierda a derecha según el boceto */}
            <div className="player-action-bar">
              {/* 1. Botón Guardar */}
              <button
                className={`action-btn ${isSaved ? 'saved' : ''}`}
                onClick={() => setIsSaved(!isSaved)}
              >
                {isSaved ? '★ Guardado' : '☆ Guardar'}
              </button>

              {/* 2. Botones Like y Dislike con barra comparativa de porcentaje */}
              <div className="votes-widget">
                <div className="votes-buttons-row">
                  <button
                    className={`vote-btn ${userVote === 'like' ? 'active-like' : ''}`}
                    onClick={handleLike}
                  >
                    👍 {likes}
                  </button>
                  <button
                    className={`vote-btn ${userVote === 'dislike' ? 'active-dislike' : ''}`}
                    onClick={handleDislike}
                  >
                    👎 {dislikes}
                  </button>
                </div>
                <div className="likes-progress-bar">
                  <div
                    className="likes-fill"
                    style={{ width: `${likePercentage}%` }}
                  />
                </div>
                <span className="likes-percent-label">
                  {likePercentage}% positivo ({totalVotes} votos)
                </span>
              </div>

              {/* 3. Botón Jugar */}
              <button
                className="action-btn play-main"
                onClick={() => setIsPlaying(true)}
              >
                ▶ {isPlaying ? 'Reiniciar Juego' : 'Jugar'}
              </button>

              {/* 4, 5 y 6. Iconos de Descargar (deshabilitado), Compartir y Pantalla Completa */}
              <div className="right-icon-group">
                <button
                  className="action-btn"
                  disabled
                  title="Descarga de escritorio no disponible todavía"
                >
                  ⬇
                </button>
                <button
                  className="action-btn"
                  onClick={handleShare}
                  title="Copiar enlace del juego"
                >
                  ↪
                </button>
                <button
                  className="action-btn"
                  onClick={handleFullscreen}
                  title="Pantalla completa"
                >
                  ⛶
                </button>
              </div>
            </div>
          </div>

          {/* Lista de mejores puntuaciones (Ranked 1 al 10) dependiendo del juego */}
          {game.hasRanked && game.leaderboard && (
            <aside className="ranked-sidebar-box">
              <div className="ranked-title">🏆 Ranked Top 10</div>
              <ol className="ranked-list">
                {game.leaderboard.map((entry, idx) => (
                  <li key={idx} className="ranked-item">
                    <span>
                      <strong>{idx + 1}.</strong> {entry.player}
                    </span>
                    <span>{entry.score} pts</span>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </div>

        {/* Parte inferior: Descripción y Cómo Jugar */}
        <section className="description-controls-box">
          <div className="desc-box-title">Descripción y Cómo Jugar</div>
          <p>
            <strong>Descripción:</strong> {game.description}
          </p>
          <p>
            <strong>Controles / Instrucciones:</strong> {game.controls}
          </p>
          <p>
            <strong>Categorías:</strong> {game.categories.join(', ')} |{' '}
            <strong>Edad recomendada:</strong> {game.ageRating}
          </p>
        </section>
      </div>
    </div>
  );
};