import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import TechnicianOrdersTable from './TechnicianOrdersTable';
import TechnicianWorkspaceState from './TechnicianWorkspaceState';
import useTechnicianWorkspace from './useTechnicianWorkspace';
import useWorkOrderRelations from './useWorkOrderRelations';
import './technician.css';

function technicianName(technician) {
  return technician?.fullName
    || [technician?.firstName, technician?.lastName].filter(Boolean).join(' ')
    || 'Técnico';
}

export default function TechnicianDashboardPage() {
  const { currentUser } = useOutletContext();
  const workspace = useTechnicianWorkspace(currentUser?.id);
  const statusById = useMemo(
    () => new Map(workspace.statuses.map((status) => [String(status.id), status])),
    [workspace.statuses],
  );
  const statusCounts = useMemo(() => {
    const counts = {};
    workspace.workOrders.forEach((order) => {
      const code = statusById.get(String(order.statusId))?.code || 'SIN_CATALOGO';
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [statusById, workspace.workOrders]);
  const upcomingOrders = useMemo(
    () => [...workspace.workOrders]
      .sort((left, right) => {
        const leftTime = left.estimatedDeliveryDate ? new Date(left.estimatedDeliveryDate).getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = right.estimatedDeliveryDate ? new Date(right.estimatedDeliveryDate).getTime() : Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      })
      .slice(0, 5),
    [workspace.workOrders],
  );
  const relations = useWorkOrderRelations(upcomingOrders);
  const workspaceState = <TechnicianWorkspaceState {...workspace} />;

  if (workspace.loading || workspace.error || !workspace.technician) return workspaceState;

  return (
    <section className="technician-dashboard-page">
      <div className="technician-page-heading">
        <div><p className="admin-eyebrow">Panel técnico</p><h1>Bienvenido, {technicianName(workspace.technician)}</h1><p>Resumen calculado únicamente con tus Work Orders asignadas.</p></div>
        <span className="technician-date">{new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date())}</span>
      </div>

      <div className="technician-metrics">
        <article><span>Órdenes asignadas</span><strong>{workspace.workOrders.length}</strong><small>Filtradas de forma segura por la API</small></article>
        <article><span>En proceso</span><strong>{statusCounts.EN_PROCESO || 0}</strong><small>Catálogo WORK_ORDERS</small></article>
        <article><span>Aprobadas</span><strong>{statusCounts.APROBADO || 0}</strong><small>Planificaciones aprobadas</small></article>
        <article><span>Pendientes</span><strong>{statusCounts.PENDIENTE || 0}</strong><small>Órdenes por atender</small></article>
      </div>

      <div className="technician-dashboard-actions">
        <Link className="admin-button admin-button--primary" to="/technician/work-orders">Ver mis órdenes</Link>
        <Link className="admin-button admin-button--secondary" to="/technician/assigned-work-orders">Filtrar asignadas</Link>
      </div>

      <section className="technician-panel">
        <header><div><h2>Órdenes próximas</h2><p>Ordenadas por entrega estimada; la API todavía no expone prioridad.</p></div><Link to="/technician/assigned-work-orders">Ver todas</Link></header>
        {relations.warning && <div className="technician-inline-warning">{relations.warning}</div>}
        {workspace.workOrders.length === 0 ? (
          <div className="technician-empty"><strong>No tienes órdenes asignadas.</strong><p>Las nuevas asignaciones aparecerán aquí.</p></div>
        ) : relations.loading ? (
          <div className="technician-empty">Cargando datos relacionados...</div>
        ) : (
          <TechnicianOrdersTable workOrders={upcomingOrders} statuses={workspace.statuses} {...relations} />
        )}
      </section>

      <section className="technician-api-gap">
        <div><span>Pendiente de API</span><strong>Trabajo ejecutado y completado hoy</strong></div>
        <p>Work Orders representan planificación, no Jobs. Las métricas de trabajos realizados requieren `/jobs/assigned-to-me` y Service Reports.</p>
      </section>
    </section>
  );
}
