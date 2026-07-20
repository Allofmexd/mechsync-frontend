import { useEffect, useState } from 'react';
import { createServiceReport } from './serviceReportsService';
import {
  formatServiceReportMoney,
  getServiceReportCreateErrorMessage,
  unwrapServiceReportData,
} from './serviceReportUtils';
import './serviceReports.css';

function normalizedDeliveredAt(value) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${value}:00`;
}

function ActualLinesSummary({ title, lines, nameField }) {
  return (
    <section className="service-report-create-lines">
      <div><strong>{title}</strong><span>{lines.length}</span></div>
      {lines.length === 0 ? (
        <p>Sin líneas registradas.</p>
      ) : (
        <ul>
          {lines.map((line) => (
            <li key={line.id}>
              <span>{line[nameField]}</span>
              <small>{line.quantity} × {formatServiceReportMoney(line.unitPrice)}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ServiceReportCreateModal({
  job,
  serviceLines,
  partLines,
  onClose,
  onCreated,
}) {
  const [finalDescription, setFinalDescription] = useState('');
  const [deliveredAt, setDeliveredAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [busy, onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const description = finalDescription.trim();
    if (!description) {
      setError('La descripción final es obligatoria.');
      return;
    }
    if (job.status !== 'COMPLETADO') {
      setError('Solo se puede crear reporte para trabajos completados.');
      return;
    }

    const normalizedDate = normalizedDeliveredAt(deliveredAt);
    if (deliveredAt && !normalizedDate) {
      setError('La fecha de entrega no tiene un formato válido.');
      return;
    }

    const payload = {
      jobId: job.id,
      finalDescription: description,
    };
    if (normalizedDate) payload.deliveredAt = normalizedDate;

    setBusy(true);
    try {
      const response = await createServiceReport(payload);
      onCreated(unwrapServiceReportData(response));
    } catch (requestError) {
      setError(getServiceReportCreateErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="service-report-modal-backdrop" role="presentation">
      <section className="service-report-modal" role="dialog" aria-modal="true" aria-labelledby="service-report-create-title">
        <header className="service-report-modal__header">
          <div>
            <p className="admin-eyebrow">Cierre oficial</p>
            <h2 id="service-report-create-title">Crear reporte de servicio</h2>
            <p>El reporte será inmutable desde esta interfaz una vez creado.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar formulario">×</button>
        </header>

        <div className="service-report-create-summary">
          <div><span>Trabajo</span><strong>JOB-{job.id}</strong></div>
          <div><span>Estado</span><strong>Completado</strong></div>
          <div><span>Subtotal</span><strong>{formatServiceReportMoney(job.realSubtotalAmount)}</strong></div>
          <div><span>IVA</span><strong>{formatServiceReportMoney(job.realIvaAmount)}</strong></div>
          <div><span>Total</span><strong>{formatServiceReportMoney(job.realTotalAmount)}</strong></div>
        </div>

        <div className="service-report-create-lines-grid">
          <ActualLinesSummary title="Servicios reales" lines={serviceLines} nameField="serviceName" />
          <ActualLinesSummary title="Piezas reales" lines={partLines} nameField="partName" />
        </div>

        <form className="service-report-create-form" onSubmit={handleSubmit}>
          {error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}
          <label>
            <span>Descripción final *</span>
            <textarea
              rows="5"
              value={finalDescription}
              onChange={(event) => setFinalDescription(event.target.value)}
              disabled={busy}
              required
              autoFocus
              placeholder="Describe el resultado final del trabajo realizado."
            />
          </label>
          <label>
            <span>Fecha de entrega <small>(opcional)</small></span>
            <input
              type="datetime-local"
              value={deliveredAt}
              onChange={(event) => setDeliveredAt(event.target.value)}
              disabled={busy}
            />
            <small>Si se registra, el reporte se crea con estado Entregado; sin fecha se crea Completado.</small>
          </label>
          <div className="service-report-create-warning" role="note">
            <strong>Antes de continuar</strong>
            <p>Los importes se copiarán desde el Job. No se modificarán el trabajo, sus líneas reales ni la cotización aprobada. El PDF permanece pendiente.</p>
          </div>
          <footer>
            <button className="admin-button admin-button--secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</button>
            <button className="admin-button admin-button--primary" type="submit" disabled={busy}>{busy ? 'Creando reporte de servicio...' : 'Crear reporte'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
