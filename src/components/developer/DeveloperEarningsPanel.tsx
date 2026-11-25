import React, { useState } from 'react';
import { soundManager } from '../../data/audioConfig';
import {
  type DeveloperGameRecord,
  type DeveloperEarningsSummary,
  type WithdrawalMethod,
  type WithdrawalRequest,
  createWithdrawalRequest,
} from '../../data/developerPortalMockService';

interface DeveloperEarningsPanelProps {
  games: DeveloperGameRecord[];
  earnings: DeveloperEarningsSummary;
  withdrawals: WithdrawalRequest[];
}

const METHOD_META: Record<
  WithdrawalMethod,
  { label: string; placeholder: string; note: string }
> = {
  BINANCE_USDT: {
    label: 'Binance Pay (USDT)',
    placeholder: 'Ej. Binance Pay ID: 492817301 o correo Binance',
    note: 'Automatizable via API oficial. Liquidacion en USDT (equivalente 1:1 USD).',
  },
  PAYPAL: {
    label: 'PayPal (USD)',
    placeholder: 'Ej. correo@ejemplo.com',
    note: 'Procesamiento via API oficial de PayPal Payouts en dolares.',
  },
  PAGO_MOVIL: {
    label: 'Pago Movil / Transferencia Local (VE)',
    placeholder: 'Ej. Banesco • V-30.000.000 • 0414-000-0000',
    note: 'Validacion manual por el administrador del portal antes de completar el pago.',
  },
};

export const DeveloperEarningsPanel: React.FC<DeveloperEarningsPanelProps> = ({
  games,
  earnings,
  withdrawals,
}) => {
  const [method, setMethod] = useState<WithdrawalMethod>('BINANCE_USDT');
  const [destination, setDestination] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>(
    earnings.availableBalanceUsd >= 5 ? earnings.availableBalanceUsd.toFixed(2) : '5.00'
  );
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmitWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amountInput);

    if (Number.isNaN(numericAmount)) {
      setFeedback({ type: 'err', text: 'Ingresa un monto numerico valido.' });
      return;
    }

    const res = createWithdrawalRequest({
      method,
      destination,
      amountUsd: numericAmount,
    });

    if (!res.ok) {
      soundManager.playClose();
      setFeedback({ type: 'err', text: res.error || 'No se pudo registrar el retiro.' });
      return;
    }

    soundManager.playOpen();
    setDestination('');
    setAmountInput('5.00');
    setFeedback({
      type: 'ok',
      text: `Solicitud ${res.request?.id} creada en estado PENDING. Puedes validarla desde la pestana Dueno.`,
    });
  };

  const selectedMeta = METHOD_META[method];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <section className="dev-kpi-grid">
        <div className="dev-kpi-card">
          <span className="dev-kpi-label">Saldo Disponible para Retiro</span>
          <span className="dev-kpi-value" style={{ color: '#6ee7b7' }}>
            ${earnings.availableBalanceUsd.toFixed(2)} USD
          </span>
          <span className="dev-kpi-note">Minimo de retiro: $5.00 USD</span>
        </div>

        <div className="dev-kpi-card">
          <span className="dev-kpi-label">Tu Bolsa Directa (In-Game)</span>
          <span className="dev-kpi-value">${earnings.directPoolUsd.toFixed(2)}</span>
          <span className="dev-kpi-note">Anuncios disparados dentro de tus juegos</span>
        </div>

        <div className="dev-kpi-card">
          <span className="dev-kpi-label">Tu Cuota de Pool Global</span>
          <span className="dev-kpi-value">${earnings.globalPoolUsd.toFixed(2)}</span>
          <span className="dev-kpi-note">Calculada por cortes diarios acumulados del mes</span>
        </div>

        <div className="dev-kpi-card">
          <span className="dev-kpi-label">Retirado / En Proceso</span>
          <span className="dev-kpi-value">${earnings.reservedInWithdrawalsUsd.toFixed(2)}</span>
          <span className="dev-kpi-note">Contabilidad protegida en USD</span>
        </div>
      </section>

      <div className="dev-two-col-grid">
        {/* formulario de solicitud de retiro */}
        <form className="dev-wii-panel dev-form-stack" onSubmit={handleSubmitWithdrawal}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Solicitar Retiro</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--dev-text-soft)', marginTop: '3px' }}>
              Los retiros se registran en USD con clave de idempotencia en el backend real.
            </p>
          </div>

          {feedback && (
            <div
              className={`dev-alert-box ${
                feedback.type === 'err' ? 'dev-alert-danger' : 'dev-alert-success'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <label className="dev-field">
            <span>Metodo de retiro</span>
            <select
              className="dev-input"
              value={method}
              onChange={(e) => {
                setMethod(e.target.value as WithdrawalMethod);
                setFeedback(null);
              }}
            >
              <option value="BINANCE_USDT">Binance Pay (USDT)</option>
              <option value="PAYPAL">PayPal (USD)</option>
              <option value="PAGO_MOVIL">Pago Movil / Transferencia VE</option>
            </select>
            <span style={{ fontSize: '0.72rem', color: 'var(--dev-text-dim)', fontWeight: 400 }}>
              {selectedMeta.note}
            </span>
          </label>

          <label className="dev-field">
            <span>Datos de destino *</span>
            <input
              type="text"
              className="dev-input"
              placeholder={selectedMeta.placeholder}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </label>

          <label className="dev-field">
            <span>Monto a retirar (USD) *</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                step="0.01"
                min="5"
                max={earnings.availableBalanceUsd || 5}
                className="dev-input"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
              <button
                type="button"
                className="dev-secondary-btn"
                onClick={() => setAmountInput(earnings.availableBalanceUsd.toFixed(2))}
              >
                Usar todo
              </button>
            </div>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="dev-primary-btn"
              disabled={earnings.availableBalanceUsd < 5}
            >
              {earnings.availableBalanceUsd < 5
                ? 'Saldo insuficiente (min. $5)'
                : 'Enviar Solicitud'}
            </button>
          </div>
        </form>

        {/* historial de solicitudes de retiro */}
        <section className="dev-wii-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Historial de Retiros</h2>

          {withdrawals.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--dev-text-soft)' }}>
              Aun no has solicitado retiros.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {withdrawals.map((w) => (
                <div key={w.id} className="dev-list-row">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                      ${w.amountUsd.toFixed(2)} USD • {METHOD_META[w.method].label}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--dev-text-dim)' }}>
                      {w.id} • {w.destination} • {w.createdAt}
                    </div>
                  </div>
                  <span className={`dev-wd-badge dev-wd-${w.status}`}>{w.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* desglose de ingresos por juego */}
      <section className="dev-wii-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Desglose por Juego (Cortes Acumulados)</h2>

        <div className="dev-table-wrap">
          <table className="dev-table">
            <thead>
              <tr>
                <th>Juego</th>
                <th>Estado</th>
                <th>Tiempo Activo</th>
                <th>Impresiones</th>
                <th>Bolsa Directa</th>
                <th>Pool Global</th>
                <th>Total Dev</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => {
                const subtotal = g.metrics.directPoolUsd + g.metrics.globalPoolUsd;
                return (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 600 }}>{g.title}</td>
                    <td>
                      <span className={`dev-status-badge dev-status-${g.status}`}>
                        {g.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{(g.metrics.activeTimeSec / 3600).toFixed(1)} h</td>
                    <td>{g.metrics.validImpressions.toLocaleString()}</td>
                    <td>${g.metrics.directPoolUsd.toFixed(2)}</td>
                    <td>${g.metrics.globalPoolUsd.toFixed(2)}</td>
                    <td style={{ color: '#6ee7b7', fontWeight: 700 }}>${subtotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};