import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTechnicians } from '../technicians/techniciansService';
import { cancelJob, completeJob, getJobById, startJob } from './jobsService';
import {
  formatJobDate,
  formatJobMoney,
  getJobErrorMessage,
  JOB_STATUS_LABELS,
  technicianName,
  unwrapApiData,
  validateCompletionAmounts,
} from './jobUtils';
import './jobs.css';

function unwrapCollection(response) {
  const data = unwrapApiData(response);
  return Array.isArray(data) ? data : data?.content ?? [];
}

function statusClass(status) {
  return `job-status job-status--${String(status || 'desconocido').toLowerCase().replaceAll('_', '-')}`;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completion, setCompletion] = useState({ subtotal: '0.00', iva: '0.00', total: '0.00', notes: '' });
  const [cancellationNotes, setCancellationNotes] = useState('');

  useEffect(() => {
    let active = true;
    async function loadJob() {
      setLoading(true);
      setError('');
      try {
        const [jobResponse, techniciansResponse] = await Promise.all([
          getJobById(id),
          getTechnicians(),
        ]);
        if (active) {
          setJob(unwrapApiData(jobResponse));
          setTechnicians(unwrapCollection(techniciansResponse));
        }
      } catch (requestError) {
        if (active) setError(getJobErrorMessage(requestError, 'cargar el detalle del trabajo'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadJob();
    return () => { active = false; };
  }, [id]);

  const technician = useMemo(
    () => technicians.find((item) => String(item.id) === String(job?.technicianId)),
    [job?.technicianId, technicians],
  );

  function prepareAction() {
    setSuccess('');
    setActionError('');
  }

  async function handleStart() {
    if (job?.status !== 'PENDIENTE') {
      setActionError('Acción no permitida para el estado actual.');
      return;
    }
    if (!window.confirm('¿Confirmas que el trabajo iniciará ahora?')) return;
    prepareAction();
    setActionBusy(true);
    try {
      setJob(unwrapApiData(await startJob(job.id)));
      setSuccess('Trabajo iniciado correctamente.');
    } catch (requestError) {
      setActionError(getJobErrorMessage(requestError, 'iniciar el trabajo'));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleComplete(event) {
    event.preventDefault();
    prepareAction();
    if (job?.status !== 'EN_PROCESO') {
      setActionError('Acción no permitida para el estado actual.');
      return;
    }
    const amounts = validateCompletionAmounts(completion.subtotal, completion.iva, completion.total);
    if (!amounts.valid) {
      setActionError(amounts.message);
      return;
    }
    if (!window.confirm('¿Confirmas el cierre del trabajo con estos importes reales?')) return;

    const payload = {
      realSubtotalAmount: amounts.subtotal,
      realIvaAmount: amounts.iva,
      realTotalAmount: amounts.total,
    };
    const notes = completion.notes.trim();
    if (notes) payload.notes = notes;

    setActionBusy(true);
    try {
      setJob(unwrapApiData(await completeJob(job.id, payload)));
      setCompleteOpen(false);
      setSuccess('Trabajo completado correctamente.');
    } catch (requestError) {
      setActionError(getJobErrorMessage(requestError, 'completar el trabajo'));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCancel(event) {
    event.preventDefault();
    prepareAction();
    if (!['PENDIENTE', 'EN_PROCESO'].includes(job?.status)) {
      setActionError('Acción no permitida para el estado actual.');
      return;
    }
    if (!window.confirm('¿Confirmas la cancelación de este trabajo? Esta transición es terminal.')) return;

    const notes = cancellationNotes.trim();
    setActionBusy(true);
    try {
      setJob(unwrapApiData(await cancelJob(job.id, notes ? { cancellationNotes: notes } : {})));
      setCancelOpen(false);
      setSuccess('Trabajo cancelado correctamente.');
    } catch (requestError) {
      setActionError(getJobErrorMessage(requestError, 'cancelar el trabajo'));
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) return <section className="job-detail-page"><div className="jobs-state">Cargando trabajo...</div></section>;
  if (error) return <section className="job-detail-page"><div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div><Link className="admin-button admin-button--secondary" to="/admin/jobs">Volver a trabajos</Link></section>;
  if (!job) return null;

  const canStart = job.status === 'PENDIENTE';
  const canComplete = job.status === 'EN_PROCESO';
  const canCancel = ['PENDIENTE', 'EN_PROCESO'].includes(job.status);
  const isTerminal = ['COMPLETADO', 'CANCELADO'].includes(job.status);

  return (
    <section className="job-detail-page">
      <div className="admin-breadcrumb"><Link to="/admin/jobs">Trabajos realizados</Link><span>›</span><strong>JOB-{job.id}</strong></div>
      <div className="jobs-heading jobs-heading--detail">
        <div><p className="admin-eyebrow">Ejecución real</p><h1>Trabajo JOB-{job.id}</h1><p>Originado por la revisión final aprobada de la orden OT-{job.workOrderId}.</p></div>
        <span className={statusClass(job.status)}>{JOB_STATUS_LABELS[job.status] || job.status}</span>
      </div>

      {success && <div className="admin-alert admin-alert--success" role="status"><span>✓</span><p>{success}</p></div>}
      {actionError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{actionError}</p></div>}

      <div className="job-detail-layout">
        <div className="job-detail-main">
          <section className="job-detail-card">
            <h2>Información general</h2>
            <dl className="job-detail-grid">
              <div><dt>Orden de trabajo</dt><dd><Link to={`/admin/work-orders/${job.workOrderId}`}>OT-{job.workOrderId}</Link></dd></div>
              <div><dt>Revisión autorizada</dt><dd><Link to={`/admin/work-orders/${job.workOrderId}/revisions/${job.initialApprovedRevisionId}`}>Revisión #{job.initialApprovedRevisionId}</Link></dd></div>
              <div><dt>Técnico</dt><dd>{technicianName(technician, job.technicianId)}</dd></div>
              <div><dt>Estado</dt><dd>{JOB_STATUS_LABELS[job.status] || job.status}</dd></div>
              <div><dt>Creado</dt><dd>{formatJobDate(job.createdAt)}</dd></div>
              <div><dt>Última actualización</dt><dd>{formatJobDate(job.updatedAt)}</dd></div>
            </dl>
          </section>

          <section className="job-detail-card">
            <h2>Fechas operativas</h2>
            <dl className="job-detail-grid">
              <div><dt>Inicio programado</dt><dd>{formatJobDate(job.scheduledStartDate)}</dd></div>
              <div><dt>Inicio real</dt><dd>{formatJobDate(job.startDate)}</dd></div>
              <div><dt>Finalización</dt><dd>{formatJobDate(job.completionDate)}</dd></div>
              <div><dt>Cancelación</dt><dd>{formatJobDate(job.cancelledAt)}</dd></div>
              <div><dt>Horas reales</dt><dd>{job.actualHours ?? 'Dato no disponible'}</dd></div>
            </dl>
          </section>

          <section className="job-detail-card">
            <h2>Importes reales</h2>
            <div className="job-money-grid">
              <div><span>Subtotal real</span><strong>{formatJobMoney(job.realSubtotalAmount)}</strong></div>
              <div><span>IVA real</span><strong>{formatJobMoney(job.realIvaAmount)}</strong></div>
              <div><span>Total real</span><strong>{formatJobMoney(job.realTotalAmount)}</strong></div>
            </div>
          </section>

          <section className="job-detail-card">
            <h2>Notas</h2>
            <div className="job-notes"><strong>Notas operativas</strong><p>{job.notes || 'Sin notas registradas.'}</p></div>
            {job.status === 'CANCELADO' && <div className="job-notes job-notes--cancelled"><strong>Motivo o notas de cancelación</strong><p>{job.cancellationNotes || 'Sin notas de cancelación.'}</p></div>}
          </section>
        </div>

        <aside className="job-actions-card">
          <h2>Acciones del trabajo</h2>
          <p>Solo se muestran transiciones permitidas para el estado actual.</p>
          {canStart && <button className="admin-button admin-button--primary" type="button" onClick={handleStart} disabled={actionBusy}>Iniciar trabajo</button>}
          {canComplete && <button className="admin-button admin-button--primary" type="button" onClick={() => { prepareAction(); setCompleteOpen(true); setCancelOpen(false); }} disabled={actionBusy}>Completar trabajo</button>}
          {canCancel && <button className="admin-button admin-button--danger" type="button" onClick={() => { prepareAction(); setCancelOpen(true); setCompleteOpen(false); }} disabled={actionBusy}>Cancelar trabajo</button>}
          {isTerminal && <div className="job-terminal-state">Este trabajo está en un estado terminal y no admite más transiciones.</div>}

          {completeOpen && (
            <form className="job-action-form" onSubmit={handleComplete}>
              <h3>Importes de cierre</h3>
              <p>El cálculo visual se valida en centavos; el backend conserva la fuente de verdad.</p>
              <label><span>Subtotal real *</span><input type="text" inputMode="decimal" value={completion.subtotal} onChange={(event) => setCompletion((current) => ({ ...current, subtotal: event.target.value }))} disabled={actionBusy} required /></label>
              <label><span>IVA real *</span><input type="text" inputMode="decimal" value={completion.iva} onChange={(event) => setCompletion((current) => ({ ...current, iva: event.target.value }))} disabled={actionBusy} required /></label>
              <label><span>Total real *</span><input type="text" inputMode="decimal" value={completion.total} onChange={(event) => setCompletion((current) => ({ ...current, total: event.target.value }))} disabled={actionBusy} required /></label>
              <label><span>Notas <small>(opcional)</small></span><textarea rows="3" maxLength="1000" value={completion.notes} onChange={(event) => setCompletion((current) => ({ ...current, notes: event.target.value }))} disabled={actionBusy} /></label>
              <div><button className="admin-button admin-button--primary" type="submit" disabled={actionBusy}>{actionBusy ? 'Completando...' : 'Confirmar cierre'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setCompleteOpen(false)} disabled={actionBusy}>Volver</button></div>
            </form>
          )}

          {cancelOpen && (
            <form className="job-action-form" onSubmit={handleCancel}>
              <h3>Cancelar trabajo</h3>
              <label><span>Notas de cancelación <small>(opcional)</small></span><textarea rows="4" maxLength="500" value={cancellationNotes} onChange={(event) => setCancellationNotes(event.target.value)} disabled={actionBusy} /></label>
              <div><button className="admin-button admin-button--danger" type="submit" disabled={actionBusy}>{actionBusy ? 'Cancelando...' : 'Confirmar cancelación'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setCancelOpen(false)} disabled={actionBusy}>Volver</button></div>
            </form>
          )}

          <div className="job-pending-feature"><strong>Reporte de servicio</strong><p>Pendiente de backend. No se simula cierre, PDF ni evidencia.</p><button type="button" className="admin-button admin-button--secondary" disabled>Generar reporte</button></div>
        </aside>
      </div>
    </section>
  );
}
