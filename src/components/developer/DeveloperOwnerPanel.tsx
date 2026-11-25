import React from 'react';
import { soundManager } from '../../data/audioConfig';
import {
  type DeveloperGameRecord,
  type DeveloperEarningsSummary,
  type WithdrawalRequest,
  transitionDeveloperGameState,
  updateWithdrawalStatus,
} from '../../data/developerPortalMockService';

interface DeveloperOwnerPanelProps {
  games: DeveloperGameRecord[];
  earnings: DeveloperEarningsSummary;
  withdrawals: WithdrawalRequest[];
}

export const DeveloperOwnerPanel: React.FC<DeveloperOwnerPanelProps> = ({
  games,
  earnings,
  withdrawals,
}) => {
  const platformShareUsd = Number(((earnings.totalEarnedUsd / 0.7) * 0.3).toFixed(2));
  const grossPoolUsd = Number((earnings.totalEarnedUsd + platformShareUsd).toFixed(2));

  const pendingReviewGames = games.filter((g) => g.status === 'EN_VERIFICACION');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'PENDING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <section className="dev-kpi-grid">
        <div className="dev-kpi-card">
          <span className="dev-kpi-label">Recaudacion Bruta (100%)</span>
          <span className="dev-kpi-value">${grossPoolUsd.toFixed(2)} USD</span>
          <span className="dev-kpi-note">Pool Global + Bolsas Directas (mock)</span>
        </div>

        <div className="dev-kpi-card">
          <span className="dev-kpi-label">Comision Plataforma (30%)</span>
          <span className="dev-kpi-value" style={{ color: '#7dd3fc' }}>
            ${platformShareUsd.toFixed(2)} USD
          </span>
          <span className="dev-kpi-note">Reparto 70% desarrolladores / 30% plataforma</span>
        </div>

        <div className="dev-kpi-card">
          <span className="dev-kpi-label">Cola de Moderacion</span>
          <span className="dev-kpi-value">{pendingReviewGames.length}</span>
          <span className="dev-kpi-note">Juegos esperando aprobacion tecnica</span>
        </div>

        <div className="dev-kpi-card">
          <span className="dev-kpi-label">Retiros por Validar</span>
          <span className="dev-kpi-value" style={{ color: '#fcd34d' }}>
            {pendingWithdrawals.length}
          </span>
          <span className="dev-kpi-note">Incluye transferencias locales manuales</span>
        </div>
      </section>

      <div className="dev-two-col-grid">
        {/* cola rapida de moderacion de juegos */}
        <section className="dev-wii-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '0.98rem', fontWeight: 700 }}>
            Juegos en Verificacion ({pendingReviewGames.length})
          </h2>

          {pendingReviewGames.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--dev-text-soft)' }}>
              No hay juegos pendientes de moderacion en este momento.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingReviewGames.map((game) => (
                <div key={game.id} className="dev-list-row">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{game.title}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--dev-text-dim)' }}>
                      {game.tipo} • {game.buildFileName} • v{game.version}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="dev-primary-btn"
                      style={{ padding: '6px 11px', fontSize: '0.74rem' }}
                      onClick={() => {
                        soundManager.playOpen();
                        transitionDeveloperGameState(game.id, 'PUBLICADO');
                      }}
                    >
                      Aprobar y Publicar
                    </button>
                    <button
                      type="button"
                      className="dev-danger-btn"
                      style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                      onClick={() => {
                        soundManager.playClose();
                        transitionDeveloperGameState(
                          game.id,
                          'RECHAZADO',
                          'Rechazado por moderacion: verifica archivos de entrada y cumplimiento.'
                        );
                      }}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* validacion de retiros pendientes */}
        <section className="dev-wii-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '0.98rem', fontWeight: 700 }}>
            Validacion de Retiros ({pendingWithdrawals.length} pendientes)
          </h2>

          {pendingWithdrawals.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--dev-text-soft)' }}>
              Todos los retiros estan liquidados o cerrados.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingWithdrawals.map((wd) => (
                <div key={wd.id} className="dev-list-row">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                      ${wd.amountUsd.toFixed(2)} USD • {wd.method}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--dev-text-dim)' }}>
                      {wd.id} • {wd.destination}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="dev-primary-btn"
                      style={{ padding: '6px 11px', fontSize: '0.74rem' }}
                      onClick={() => {
                        soundManager.playOpen();
                        updateWithdrawalStatus(wd.id, 'COMPLETED');
                      }}
                    >
                      Marcar Pagado
                    </button>
                    <button
                      type="button"
                      className="dev-danger-btn"
                      style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                      onClick={() => {
                        soundManager.playClose();
                        updateWithdrawalStatus(wd.id, 'REJECTED');
                      }}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};