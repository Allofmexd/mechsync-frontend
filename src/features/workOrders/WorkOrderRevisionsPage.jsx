import { Link, useParams } from 'react-router-dom';
import WorkOrderRevisionsPanel from './WorkOrderRevisionsPanel';
import './workOrderRevisions.css';

export default function WorkOrderRevisionsPage() {
  const { workOrderId } = useParams();
  return (
    <section className="revision-history-page">
      <div className="admin-breadcrumb"><Link to="/admin/work-orders">Órdenes de servicio</Link><span>›</span><Link to={`/admin/work-orders/${workOrderId}`}>OT-{workOrderId}</Link><span>›</span><strong>Cotizaciones</strong></div>
      <div className="work-orders-heading"><div><p className="admin-eyebrow">Historial versionado</p><h1>Cotizaciones de OT-{workOrderId}</h1><p>Revisión vigente, aprobación final y evidencia histórica.</p></div></div>
      <WorkOrderRevisionsPanel workOrderId={workOrderId} standalone />
    </section>
  );
}
