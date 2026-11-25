import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../../data/audioConfig';
import {
  type DeveloperGameRecord,
  type GameLifecycleState,
  transitionDeveloperGameState,
  deleteDeveloperGame,
} from '../../data/developerPortalMockService';

interface DeveloperMyGamesPanelProps {
  games: DeveloperGameRecord[];
  onEditGame: (game: DeveloperGameRecord) => void;
  onGoToUpload: () => void;
}

type FilterOption = 'ALL' | GameLifecycleState;

const FILTER_TABS: Array<{ id: FilterOption; label: string }> = [
  { id: 'ALL', label: 'Todos' },
  { id: 'PUBLICADO', label: 'Publicados' },
  { id: 'EN_VERIFICACION', label: 'En Verificacion' },
  { id: 'BORRADOR', label: 'Borradores' },
  { id: 'PAUSADO', label: 'Pausados' },
  { id: 'RECHAZADO', label: 'Rechazados' },
];

export const DeveloperMyGamesPanel: React.FC<DeveloperMyGamesPanelProps> = ({
  games,
  onEditGame,
  onGoToUpload,
}) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<FilterOption>('ALL');
  const [search, setSearch] = useState<string>('');
  const [openQaId, setOpenQaId] = useState<number | null>(null);

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
      const matchesText =
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.alias.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesText;
    });
  }, [games, statusFilter, search]);

  const handleTransition = (
    id: number,
    nextStatus: GameLifecycleState,
    reason?: string
  ) => {
    soundManager.playClick();
    transitionDeveloperGameState(id, nextStatus, reason);
  };

  const handleDelete = (game: DeveloperGameRecord) => {
    soundManager.playClose();
    deleteDeveloperGame(game.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <section className="dev-wii-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="dev-chip-wrap">
            {FILTER_TABS.map((tab) => {
              const count =
                tab.id === 'ALL'
                  ? games.length
                  : games.filter((g) => g.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`dev-chip-btn ${statusFilter === tab.id ? 'selected' : ''}`}
                  onClick={() => {
                    soundManager.playClick();
                    setStatusFilter(tab.id);
                  }}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="dev-input"
              style={{ width: '210px', padding: '7px 11px' }}
              placeholder="Buscar por titulo o alias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" className="dev-primary-btn" onClick={onGoToUpload}>
              + Nuevo Juego
            </button>
          </div>
        </div>
      </section>

      {filteredGames.length === 0 ? (
        <section className="dev-wii-panel" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '6px' }}>
            No hay juegos en esta categoria
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--dev-text-soft)' }}>
            Cambia el filtro o sube un juego nuevo para probar el ciclo completo de estados.
          </p>
        </section>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredGames.map((game) => {
            const totalUsd = game.metrics.directPoolUsd + game.metrics.globalPoolUsd;
            const activeHours = (game.metrics.activeTimeSec / 3600).toFixed(1);
            const canEdit = game.status === 'BORRADOR' || game.status === 'RECHAZADO';
            const isQaOpen = openQaId === game.id;

            return (
              <article key={game.id} className="dev-wii-panel dev-game-manage-card">
                <div className="dev-game-manage-main">
                  <img
                    src={game.coverUrl}
                    alt={game.title}
                    className="dev-game-manage-thumb"
                  />

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{game.title}</h3>
                      <span className={`dev-status-badge dev-status-${game.status}`}>
                        {game.status.replace('_', ' ')}
                      </span>
                      <span className="dev-preview-pill">{game.tipo}</span>
                      <span className="dev-preview-pill">v{game.version}</span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--dev-text-dim)' }}>
                      Alias: <code>/juego/{game.alias}</code> • Archivo: {game.buildFileName} • Actualizado {game.updatedAt}
                    </div>

                    <div className="dev-inline-metrics">
                      <span>Tiempo activo: <strong>{activeHours} h</strong></span>
                      <span>Impresiones: <strong>{game.metrics.validImpressions.toLocaleString()}</strong></span>
                      <span>Likes: <strong>{game.metrics.likes}</strong></span>
                      <span>Generado: <strong style={{ color: '#6ee7b7' }}>${totalUsd.toFixed(2)}</strong></span>
                    </div>
                  </div>

                  {/* acciones principales segun el estado actual */}
                  <div className="dev-game-manage-actions">
                    {canEdit && (
                      <button
                        type="button"
                        className="dev-primary-btn"
                        onClick={() => {
                          soundManager.playClick();
                          onEditGame(game);
                        }}
                      >
                        {game.status === 'RECHAZADO' ? 'Corregir y Reenviar' : 'Editar Borrador'}
                      </button>
                    )}

                    {game.status === 'PUBLICADO' && (
                      <>
                        <button
                          type="button"
                          className="dev-secondary-btn"
                          onClick={() => {
                            soundManager.playClick();
                            navigate(`/juego/${game.alias}`);
                          }}
                        >
                          Ver en Catalogo
                        </button>
                        <button
                          type="button"
                          className="dev-secondary-btn"
                          onClick={() => handleTransition(game.id, 'PAUSADO')}
                        >
                          Pausar
                        </button>
                      </>
                    )}

                    {game.status === 'PAUSADO' && (
                      <button
                        type="button"
                        className="dev-primary-btn"
                        onClick={() => handleTransition(game.id, 'PUBLICADO')}
                      >
                        Reactivar
                      </button>
                    )}

                    {game.status === 'ERROR_SUBIDA' && (
                      <button
                        type="button"
                        className="dev-primary-btn"
                        onClick={() => handleTransition(game.id, 'EN_VERIFICACION')}
                      >
                        Reintentar Subida
                      </button>
                    )}

                    {game.status === 'APROBADO' && (
                      <button
                        type="button"
                        className="dev-primary-btn"
                        onClick={() => handleTransition(game.id, 'PUBLICADO')}
                      >
                        Publicar Ahora
                      </button>
                    )}

                    <button
                      type="button"
                      className="dev-secondary-btn"
                      onClick={() => {
                        soundManager.playClick();
                        setOpenQaId(isQaOpen ? null : game.id);
                      }}
                      title="Simular cambios de estado en pruebas locales"
                    >
                      {isQaOpen ? 'Ocultar Simulador' : 'Simular Estado'}
                    </button>

                    {(game.status === 'BORRADOR' || game.status === 'RECHAZADO') && (
                      <button
                        type="button"
                        className="dev-danger-btn"
                        onClick={() => handleDelete(game)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                {game.status === 'RECHAZADO' && game.rejectionReason && (
                  <div className="dev-alert-box dev-alert-danger">
                    <strong>Motivo del rechazo:</strong> {game.rejectionReason}
                  </div>
                )}

                {/* barra desplegable para probar el diagrama de estados sin backend */}
                {isQaOpen && (
                  <div className="dev-qa-strip">
                    <span style={{ fontSize: '0.73rem', color: '#fde68a', fontWeight: 700 }}>
                      SIMULADOR QA (MOCK):
                    </span>
                    <button
                      type="button"
                      className="dev-mini-link-btn"
                      onClick={() => handleTransition(game.id, 'EN_VERIFICACION')}
                    >
                      Enviar a Verificacion
                    </button>
                    <button
                      type="button"
                      className="dev-mini-link-btn"
                      onClick={() => handleTransition(game.id, 'APROBADO')}
                    >
                      Marcar Aprobado
                    </button>
                    <button
                      type="button"
                      className="dev-mini-link-btn"
                      onClick={() => handleTransition(game.id, 'PUBLICADO')}
                    >
                      Publicar
                    </button>
                    <button
                      type="button"
                      className="dev-mini-link-btn"
                      onClick={() => handleTransition(game.id, 'PAUSADO')}
                    >
                      Pausar
                    </button>
                    <button
                      type="button"
                      className="dev-mini-link-btn"
                      onClick={() =>
                        handleTransition(
                          game.id,
                          'RECHAZADO',
                          'Rechazo simulado: revisar peso del paquete y metadatos.'
                        )
                      }
                    >
                      Simular Rechazo
                    </button>
                    <button
                      type="button"
                      className="dev-mini-link-btn"
                      onClick={() => handleTransition(game.id, 'ERROR_SUBIDA')}
                    >
                      Simular Error Subida
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};