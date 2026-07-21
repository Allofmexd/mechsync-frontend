import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  formatRevisionDate,
  formatRevisionMoney,
  getRevisionErrorMessage,
  REVISION_STATUS_LABELS,
  unwrapApiData,
  unwrapRevisionPage,
} from './workOrderRevisionUtils';
import {
  approveWorkOrderRevision,
  cancelWorkOrderRevision,
  getCurrentWorkOrderRevision,
  getFinalApprovedWorkOrderRevision,
  getWorkOrderRevisions,
  rejectWorkOrderRevision,
  sendWorkOrderRevision,
} from './workOrderRevisionsService';
import './workOrderRevisions.css';

const REVISION_PAGE_SIZE = 20;
const ACCEPTANCE_METHODS = [
  ['IN_PERSON', 'Presencial'],
  ['WHATSAPP', 'WhatsApp'],
  ['PHONE', 'Teléfono'],
  ['EMAIL', 'Correo electrónico'],
  ['SIGNED_DOCUMENT', 'Documento firmado'],
  ['OTHER', 'Otro'],
];

function optionalRevision(result) {
  if (result.status === 'fulfilled') return unwrapApiData(result.value);
  if (result.reason?.status === 404) return null;
  throw result.reason;
}

export default function WorkOrderRevisionsPanel({ workOrderId, standalone = false }) {
  const [page, setPage] = useState({ content: [], totalElements: 0 });
  const [pageIndex, setPageIndex] = useState(0);
  const [current, setCurrent] = useState(null);
  const [finalApproved, setFinalApproved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [workingAction, setWorkingAction] = useState('');
  const [approvalRevision, setApprovalRevision] = useState(null);

  const loadRevisions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listResult, currentResult, finalResult] = await Promise.allSettled([
        getWorkOrderRevisions(workOrderId, { page: pageIndex, size: REVISION_PAGE_SIZE }),
        getCurrentWorkOrderRevision(workOrderId),
        getFinalApprovedWorkOrderRevision(workOrderId),
      ]);
      if (listResult.status === 'rejected') throw listResult.reason;
      setPage(unwrapRevisionPage(listResult.value));
      setCurrent(optionalRevision(currentResult));
      setFinalApproved(optionalRevision(finalResult));
    } catch (requestError) {
      setError(getRevisionErrorMessage(requestError, 'Error al cargar las cotizaciones de esta Work Order.'));
    } finally {
      setLoading(false);
    }
  }, [pageIndex, workOrderId]);

  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  async function executeAction(revision, action) {
    const confirmations = {
      send: '¿Enviar esta cotización? Después solo podrá aprobarse, rechazarse o cancelarse.',
      reject: '¿Rechazar esta cotización? Esta transición no puede deshacerse.',
      cancel: '¿Cancelar esta cotización? Esta transición no puede deshacerse.',
    };
    if (!window.confirm(confirmations[action])) return;
    setWorkingAction(`${revision.id}-${action}`);
    setError('');
    setSuccess('');
    try {
      if (action === 'send') await sendWorkOrderRevision(workOrderId, revision.id);
      if (action === 'reject') await rejectWorkOrderRevision(workOrderId, revision.id);
      if (action === 'cancel') await cancelWorkOrderRevision(workOrderId, revision.id);
      setSuccess('Acción aplicada correctamente por la API.');
      await loadRevisions();
    } catch (requestError) {
      setError(getRevisionErrorMessage(requestError, 'No fue posible ejecutar la acción.'));
    } finally {
      setWorkingAction('');
    }
  }

  async function handleApprove(event) {
    event.preventDefault();
    if (!approvalRevision) return;
    const formData = new FormData(event.currentTarget);
    const acceptedByName = String(formData.get('acceptedByName') || '').trim();
    const acceptanceMethod = String(formData.get('acceptanceMethod') || '').trim().toUpperCase();
    const acceptanceNotes = String(formData.get('acceptanceNotes') || '').trim();
    const acceptedAt = String(formData.get('acceptedAt') || '').trim();
    if (!acceptedByName || !acceptanceMethod) {
      setError('Nombre del aceptante y método de aceptación son obligatorios.');
      return;
    }
    if (acceptanceMethod === 'OTHER' && !acceptanceNotes) {
      setError('Las notas son obligatorias cuando el método de aceptación es Otro.');
      return;
    }
    if (!window.confirm('¿Confirmas la aprobación final de esta cotización?')) return;
    const payload = { acceptedByName, acceptanceMethod };
    if (acceptanceNotes) payload.acceptanceNotes = acceptanceNotes;
    if (acceptedAt) payload.acceptedAt = acceptedAt;
    setWorkingAction(`${approvalRevision.id}-approve`);
    setError('');
    setSuccess('');
    try {
      await approveWorkOrderRevision(workOrderId, approvalRevision.id, payload);
      setApprovalRevision(null);
      setSuccess('Cotización aprobada y aceptación registrada correctamente.');
      await loadRevisions();
    } catch (requestError) {
      setError(getRevisionErrorMessage(requestError, 'No fue posible aprobar la cotización.'));
    } finally {
      setWorkingAction('');
    }
  }

  return (
    <section className={standalone ? 'revision-panel revision-panel--standalone' : 'work-order-detail-card revision-panel'}>
      <header className="revision-panel__header">
        <div><h2>Cotizaciones / Revisiones</h2><small>Historial inmutable de la Work Order</small></div>
        <div><Link className="admin-button admin-button--secondary" to={`/admin/quotations/new?workOrderId=${workOrderId}`}>＋ Nueva cotización</Link><button className="admin-button admin-button--secondary" type="button" onClick={loadRevisions} disabled={loading}>Recargar</button></div>
      </header>

      {error && <div className="admin-alert admin-alert--error revision-panel__alert" role="alert"><span>!</span><p>{error}</p></div>}
      {success && <div className="admin-alert admin-alert--success revision-panel__alert" role="status"><span>✓</span><p>{success}</p></div>}
      {loading ? <div className="revision-loading">Cargando cotizaciones...</div> : !error && page.content.length === 0 ? <div className="revision-empty">Sin revisiones. Crea la primera cotización para esta Work Order.</div> : !error && (
        <>
          <div className="revision-summary">
            <article><span>Revisión vigente</span><strong>{current ? `R${current.revisionNumber} · ${REVISION_STATUS_LABELS[current.status] ?? current.status}` : 'Sin revisión vigente'}</strong></article>
            <article><span>Aprobación final</span><strong>{finalApproved ? `R${finalApproved.revisionNumber} · ${formatRevisionMoney(finalApproved.totalAmount, finalApproved.currency)}` : 'Sin aprobación final'}</strong></article>
            <article><span>Historial</span><strong>{page.totalElements} revisión(es)</strong></article>
          </div>
          <div className="revision-table-wrap">
            <table className="revision-table">
              <thead><tr><th>Revisión</th><th>Estado</th><th>Total</th><th>Creada</th><th>Indicadores</th><th>Acciones</th></tr></thead>
              <tbody>{page.content.map((revision) => {
                const isWorking = workingAction.startsWith(`${revision.id}-`);
                const canSend = revision.isCurrent && revision.status === 'DRAFT';
                const canApproveOrReject = revision.isCurrent && revision.status === 'SENT';
                const canCancel = revision.isCurrent && ['DRAFT', 'SENT'].includes(revision.status);
                return <tr key={revision.id}><td><strong>R{revision.revisionNumber}</strong></td><td><span className={`revision-status revision-status--${revision.status.toLowerCase()}`}>{REVISION_STATUS_LABELS[revision.status] ?? revision.status}</span></td><td>{formatRevisionMoney(revision.totalAmount, revision.currency)}</td><td>{formatRevisionDate(revision.createdAt)}</td><td>{revision.isCurrent && <small>Vigente</small>} {revision.isFinalApproved && <small>Aprobación final</small>}</td><td><div className="revision-actions"><Link to={`/admin/work-orders/${workOrderId}/revisions/${revision.id}`}>Ver detalle</Link><button type="button" disabled={!canSend || isWorking} title={canSend ? 'Enviar revisión' : 'Acción no permitida para este estado'} onClick={() => executeAction(revision, 'send')}>Enviar</button><button type="button" disabled={!canApproveOrReject || isWorking} title={canApproveOrReject ? 'Aprobar revisión' : 'Acción no permitida para este estado'} onClick={() => setApprovalRevision(revision)}>Aprobar</button><button type="button" disabled={!canApproveOrReject || isWorking} title={canApproveOrReject ? 'Rechazar revisión' : 'Acción no permitida para este estado'} onClick={() => executeAction(revision, 'reject')}>Rechazar</button><button type="button" disabled={!canCancel || isWorking} title={canCancel ? 'Cancelar revisión' : 'Acción no permitida para este estado'} onClick={() => executeAction(revision, 'cancel')}>Cancelar</button></div></td></tr>;
              })}</tbody>
            </table>
          </div>
          {page.totalPages > 1 && <div className="revision-pagination"><span>Página {page.page + 1} de {page.totalPages}</span><div><button type="button" disabled={page.page <= 0 || loading} onClick={() => setPageIndex((value) => value - 1)}>Anterior</button><button type="button" disabled={page.page + 1 >= page.totalPages || loading} onClick={() => setPageIndex((value) => value + 1)}>Siguiente</button></div></div>}
        </>
      )}

      {approvalRevision && <form className="revision-approval" onSubmit={handleApprove}>
        <header><div><h3>Aprobación final y aceptación · R{approvalRevision.revisionNumber}</h3><p>Esta operación registra la aprobación interna y la evidencia de aceptación exigida por el contrato actual.</p></div><button type="button" onClick={() => setApprovalRevision(null)} aria-label="Cerrar">×</button></header>
        <div className="revision-fields"><label className="revision-field"><span>Nombre del aceptante *</span><input name="acceptedByName" maxLength="200" required disabled={Boolean(workingAction)} /></label><label className="revision-field"><span>Método de aceptación *</span><select name="acceptanceMethod" required disabled={Boolean(workingAction)}><option value="">Selecciona un método</option>{ACCEPTANCE_METHODS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label><label className="revision-field"><span>Fecha de aceptación</span><input name="acceptedAt" type="datetime-local" disabled={Boolean(workingAction)} /></label><label className="revision-field revision-field--wide"><span>Notas</span><textarea name="acceptanceNotes" disabled={Boolean(workingAction)} /></label></div>
        <footer><button className="admin-button admin-button--primary" type="submit" disabled={Boolean(workingAction)}>{workingAction ? 'Aprobando...' : 'Confirmar aprobación'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setApprovalRevision(null)} disabled={Boolean(workingAction)}>Cancelar</button></footer>
      </form>}
    </section>
  );
}
