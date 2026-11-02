import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type Game, type ScoreEntry } from './GameCard';

const API_BASE_URL = 'http://localhost:8080/api';
const CURRENT_USER_ID = 3;

interface GamePlayerViewProps {
  game: Game;
  onBack: () => void;
}

export const GamePlayerView: React.FC<GamePlayerViewProps> = ({ game, onBack }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [likes, setLikes] = useState<number>(game.likes);
  const [dislikes, setDislikes] = useState<number>(game.dislikes);
  const [userVote, setUserVote] = useState<'LIKE' | 'DISLIKE' | 'NONE'>('NONE');
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [lastGodotScore, setLastGodotScore] = useState<number | null>(null);

  const gameScreenRef = useRef<HTMLDivElement | null>(null);

  // 1. Cargar el Top 10 desde GET /api/scores/leaderboard/{alias}
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/scores/leaderboard/${game.alias}`);
      if (!response.ok) throw new Error('Error al obtener leaderboard');
      const data = await response.json();

      const mappedScores: ScoreEntry[] = Array.isArray(data)
        ? data.map((item: Record<string, unknown>) => ({
            player: String(item.username || item.player || `Jugador #${item.userId || 1}`),
            score: Number(item.score || 0),
          }))
        : [];
      setLeaderboard(mappedScores);
    } catch {
      setLeaderboard([
        { player: 'laura_gamer', score: 950 },
        { player: 'juanito99', score: 820 },
        { player: 'carlos_dev', score: 740 },
      ]);
    }
  }, [game.alias]);

  // 2. Cargar estado inicial al abrir el juego (Favoritos y Voto previo del usuario 3)
  useEffect(() => {
    fetchLeaderboard();

    const fetchInitialUserStatus = async () => {
      // Consultar si el juego actual está en la lista de favoritos del usuario
      try {
        const favRes = await fetch(`${API_BASE_URL}/favorites/user/${CURRENT_USER_ID}`);
        if (favRes.ok) {
          const favIds: number[] = await favRes.json();
          if (Array.isArray(favIds)) {
            setIsSaved(favIds.includes(game.id));
          }
        }
      } catch {
        console.warn('No se pudo verificar favoritos iniciales.');
      }

      // Consultar el voto previo del usuario en este juego (LIKE, DISLIKE o NONE)
      try {
        const voteRes = await fetch(
          `${API_BASE_URL}/votes/user/${CURRENT_USER_ID}/game/${game.id}`
        );
        if (voteRes.ok) {
          const voteData = await voteRes.json();
          if (
            voteData?.voteType === 'LIKE' ||
            voteData?.voteType === 'DISLIKE' ||
            voteData?.voteType === 'NONE'
          ) {
            setUserVote(voteData.voteType);
          }
        }
      } catch {
        console.warn('No se pudo verificar el voto previo del usuario.');
      }
    };

    fetchInitialUserStatus();
  }, [game.id, fetchLeaderboard]);

  // 3. Escuchar el evento postMessage de Godot cuando termina la partida (GAME_OVER)
  useEffect(() => {
    const handleGameMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GAME_OVER') {
        const finalScore = Number(event.data.score || 0);
        const gameAlias = String(event.data.game || game.alias);
        const gameMode = String(event.data.mode || 'ARCADE');

        console.log('Partida terminada desde Godot. Puntos:', finalScore);
        setLastGodotScore(finalScore);

        try {
          await fetch(`${API_BASE_URL}/scores/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameAlias,
              userId: CURRENT_USER_ID,
              score: finalScore,
              gameMode,
            }),
          });
          fetchLeaderboard();
        } catch (err) {
          console.error('Error al guardar puntaje en el backend:', err);
        }
      }
    };

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [game.alias, fetchLeaderboard]);

  // 4. Conectar botón "☆ Favorito" a POST /api/favorites
  const handleToggleFavorite = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: CURRENT_USER_ID,
          gameId: game.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'added') {
          setIsSaved(true);
          return;
        } else if (data.status === 'removed') {
          setIsSaved(false);
          return;
        }
      }
    } catch {
      console.warn('Backend no disponible, alternando favorito localmente.');
    }
    setIsSaved((prev) => !prev);
  };

  // 5. Conectar botones Like / Dislike a POST /api/votes
  const sendVoteToBackend = async (clickedVote: 'LIKE' | 'DISLIKE') => {
    try {
      const response = await fetch(`${API_BASE_URL}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: CURRENT_USER_ID,
          gameId: game.id,
          voteType: clickedVote,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (typeof result.likes === 'number') setLikes(result.likes);
        if (typeof result.dislikes === 'number') setDislikes(result.dislikes);
        setUserVote((prev) => (prev === clickedVote ? 'NONE' : clickedVote));
        return;
      }
    } catch {
      console.warn('Backend no disponible, actualizando voto localmente.');
    }

    // Respaldo local si el backend está apagado
    if (clickedVote === 'LIKE') {
      if (userVote === 'LIKE') {
        setLikes((l) => Math.max(0, l - 1));
        setUserVote('NONE');
      } else {
        if (userVote === 'DISLIKE') setDislikes((d) => Math.max(0, d - 1));
        setLikes((l) => l + 1);
        setUserVote('LIKE');
      }
    } else {
      if (userVote === 'DISLIKE') {
        setDislikes((d) => Math.max(0, d - 1));
        setUserVote('NONE');
      } else {
        if (userVote === 'LIKE') setLikes((l) => Math.max(0, l - 1));
        setDislikes((d) => d + 1);
        setUserVote('DISLIKE');
      }
    }
  };

  const totalVotes = likes + dislikes;
  const likePercentage = totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : 50;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?juego=${game.alias}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`¡Enlace copiado al portapapeles!\n${shareUrl}`);
  };

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
      <div
        className="player-blurred-bg"
        style={{ backgroundImage: `url(${game.coverUrl})` }}
      />

      <div className="player-foreground-content">
        <div className="player-header-row">
          <h2 className="player-game-title">{game.title}</h2>
          {lastGodotScore !== null && (
            <span
              style={{
                background: '#E09F3E',
                color: '#1D353C',
                padding: '6px 14px',
                borderRadius: '12px',
                fontWeight: 'bold',
              }}
            >
              🎉 Última partida registrada: {lastGodotScore} pts
            </span>
          )}
          <button className="back-catalog-btn" onClick={onBack}>
            ⬅ Volver al Catálogo
          </button>
        </div>

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
                <iframe
                  src={game.gameUrl || '/game-export/index.html'}
                  title={game.title}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  allowFullScreen
                />
              )}
            </div>

            <div className="player-action-bar">
              {/* Botón cambiado de Guardar a Favorito y conectado a POST /api/favorites */}
              <button
                className={`action-btn ${isSaved ? 'saved' : ''}`}
                onClick={handleToggleFavorite}
              >
                {isSaved ? '★ Favorito' : '☆ Favorito'}
              </button>

              <div className="votes-widget">
                <div className="votes-buttons-row">
                  <button
                    className={`vote-btn ${userVote === 'LIKE' ? 'active-like' : ''}`}
                    onClick={() => sendVoteToBackend('LIKE')}
                  >
                    👍 {likes}
                  </button>
                  <button
                    className={`vote-btn ${userVote === 'DISLIKE' ? 'active-dislike' : ''}`}
                    onClick={() => sendVoteToBackend('DISLIKE')}
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

              <button
                className="action-btn play-main"
                onClick={() => setIsPlaying(true)}
              >
                ▶ {isPlaying ? 'Reiniciar Juego' : 'Jugar'}
              </button>

              <div className="right-icon-group">
                <button
                  className="action-btn"
                  disabled={!game.descargaUrl}
                  onClick={() => game.descargaUrl && window.open(game.descargaUrl, '_blank')}
                  title={game.descargaUrl ? 'Descargar Launcher' : 'Solo versión Web'}
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

          <aside className="ranked-sidebar-box">
            <div className="ranked-title">🏆 Ranked Top 10</div>
            <ol className="ranked-list">
              {leaderboard.map((entry, idx) => (
                <li key={idx} className="ranked-item">
                  <span>
                    <strong>{idx + 1}.</strong> {entry.player}
                  </span>
                  <span>{entry.score} pts</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>

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
            <strong>Edad recomendada:</strong>{' '}
            <span
              className="age-rating-badge"
              style={{ backgroundColor: game.ageBadgeColor || '#28a745' }}
            >
              {game.ageRatingName}
            </span>
          </p>
        </section>
      </div>
    </div>
  );
};