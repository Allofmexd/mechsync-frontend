import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  formatRevisionDate,
  formatRevisionMoney,
  getRevisionErrorMessage,
  REVISION_STATUS_LABELS,
  unwrapApiData,
} from './workOrderRevisionUtils';
import { getWorkOrderRevision } from './workOrderRevisionsService';
import './workOrderRevisions.css';

function LinesTable({ title, lines, type }) {
  return <section className="revision-detail-card"><header><h2>{title}</h2><span>{lines.length}</span></header>{lines.length === 0 ? <p className="revision-empty">Sin líneas snapshot.</p> : <div className="revision-table-wrap"><table className="revision-table"><thead><tr><th>#</th><th>Nombre snapshot</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>{lines.map((line) => <tr key={line.id ?? line.lineNumber}><td>{line.lineNumber}</td><td><strong>{line.nameSnapshot}</strong>{type === 'part' && line.partNumberSnapshot && <small>{line.partNumberSnapshot}</small>}</td><td>{line.descriptionSnapshot || 'Sin descripción'}</td><td>{line.quantity}</td><td>{formatRevisionMoney(line.unitPrice)}</td><td>{formatRevisionMoney(line.lineSubtotal)}</td></tr>)}</tbody></table></div>}</section>;
}

export default function WorkOrderRevisionDetailPage() {
  const { workOrderId, revisionId } = useParams();
  const [revision, setRevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = unwrapApiData(await getWorkOrderRevision(workOrderId, revisionId));
        if (active) setRevision(data);
      } catch (requestError) {
        if (active) setError(getRevisionErrorMessage(requestError, 'Error al cargar la revisión.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [revisionId, workOrderId]);

  if (loading) return <div className="revision-loading">Cargando detalle de revisión...</div>;
  if (error) return <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>;
  if (!revision) return <div className="revision-empty">Revisión no encontrada.</div>;

  return <section className="revision-detail-page">
    <div className="admin-breadcrumb"><Link to="/admin/work-orders">Órdenes de servicio</Link><span>›</span><Link to={`/admin/work-orders/${workOrderId}`}>OT-{workOrderId}</Link><span>›</span><Link to={`/admin/work-orders/${workOrderId}/revisions`}>Cotizaciones</Link><span>›</span><strong>R{revision.revisionNumber}</strong></div>
    <div className="work-orders-heading"><div><p className="admin-eyebrow">Cotización versionada</p><h1>Revisión R{revision.revisionNumber}</h1><p>Snapshot inmutable de la Work Order OT-{workOrderId}.</p></div><span className={`revision-status revision-status--${revision.status.toLowerCase()}`}>{REVISION_STATUS_LABELS[revision.status] ?? revision.status}</span></div>
    <div className="revision-flags">{revision.isCurrent && <span>Revisión vigente</span>}{revision.isFinalApproved && <span>Aprobación final</span>}</div>
    <div className="revision-detail-grid">
      <div className="revision-detail-main">
        <section className="revision-detail-card"><header><h2>Planeación y observaciones</h2></header><dl className="revision-detail-list"><div><dt>Técnico</dt><dd>#{revision.technicianId}</dd></div><div><dt>Inicio estimado</dt><dd>{formatRevisionDate(revision.estimatedStartDate)}</dd></div><div><dt>Entrega estimada</dt><dd>{formatRevisionDate(revision.estimatedDeliveryDate)}</dd></div><div><dt>Horas estimadas</dt><dd>{revision.estimatedHours ?? 'Dato no disponible'}</dd></div><div><dt>Observaciones técnicas</dt><dd>{revision.technicalObservations || 'Sin observaciones'}</dd></div><div><dt>Motivo del cambio</dt><dd>{revision.changeReason || 'Primera revisión o motivo no requerido'}</dd></div></dl></section>
        <LinesTable title="Servicios snapshot" lines={revision.services ?? []} type="service" />
        <LinesTable title="Piezas snapshot" lines={revision.parts ?? []} type="part" />
      </div>
      <aside className="revision-detail-side">
        <section className="revision-detail-card"><header><h2>Importes</h2></header><dl><div><dt>Subtotal</dt><dd>{formatRevisionMoney(revision.subtotalAmount, revision.currency)}</dd></div><div><dt>IVA ({revision.ivaRate})</dt><dd>{formatRevisionMoney(revision.ivaAmount, revision.currency)}</dd></div><div className="revision-total"><dt>Total</dt><dd>{formatRevisionMoney(revision.totalAmount, revision.currency)}</dd></div></dl><small>Importes devueltos por la API.</small></section>
        <section className="revision-detail-card"><header><h2>Aceptación</h2></header><dl><div><dt>Aceptante</dt><dd>{revision.acceptedByName || 'Sin aceptación'}</dd></div><div><dt>Usuario asociado</dt><dd>{revision.acceptedByUserId ? `#${revision.acceptedByUserId}` : 'No asociado'}</dd></div><div><dt>Método</dt><dd>{revision.acceptanceMethod || 'No registrado'}</dd></div><div><dt>Fecha</dt><dd>{formatRevisionDate(revision.acceptedAt)}</dd></div><div><dt>Notas</dt><dd>{revision.acceptanceNotes || 'Sin notas'}</dd></div></dl></section>
        <section className="revision-detail-card"><header><h2>Auditoría</h2></header><dl><div><dt>Creada</dt><dd>{formatRevisionDate(revision.createdAt)}</dd></div><div><dt>Actualizada</dt><dd>{formatRevisionDate(revision.updatedAt)}</dd></div><div><dt>Lock version</dt><dd>{revision.lockVersion}</dd></div></dl></section>
        <button className="admin-button admin-button--secondary" type="button" disabled title="PDF pendiente de una fase posterior">Generar PDF · Pendiente</button>
      </aside>
    </div>
  </section>;
}
