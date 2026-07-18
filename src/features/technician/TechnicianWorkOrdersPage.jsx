import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TechnicianOrdersTable from './TechnicianOrdersTable';
import TechnicianWorkspaceState from './TechnicianWorkspaceState';
import useTechnicianWorkspace from './useTechnicianWorkspace';
import useWorkOrderRelations from './useWorkOrderRelations';
import './technician.css';

const PAGE_SIZE = 10;

export default function TechnicianWorkOrdersPage() {
  const { currentUser } = useOutletContext();
  const workspace = useTechnicianWorkspace(currentUser?.id);
  const [query, setQuery] = useState('');
  const [statusId, setStatusId] = useState('');
  const [page, setPage] = useState(0);
  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    return workspace.workOrders.filter((order) => (
      (!normalizedQuery || [order.id, order.vehicleIntakeId, order.technicalObservations]
        .filter(Boolean).join(' ').toLocaleLowerCase('es').includes(normalizedQuery))
      && (!statusId || String(order.statusId) === statusId)
    ));
  }, [query, statusId, workspace.workOrders]);
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const visibleOrders = useMemo(
    () => filteredOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filteredOrders, page],
  );
  const relations = useWorkOrderRelations(visibleOrders);

  useEffect(() => { setPage(0); }, [query, statusId]);

  if (workspace.loading || workspace.error || !workspace.technician) {
    return <TechnicianWorkspaceState {...workspace} />;
  }

  return (
    <section className="technician-orders-page">
      <div className="technician-page-heading"><div><p className="admin-eyebrow">Panel técnico</p><h1>Mis órdenes</h1><p>Work Orders asociadas de forma segura al registro del técnico autenticado.</p></div></div>
      <div className="technician-client-filter-notice"><strong>Filtrado temporal en frontend</strong><p>La API devuelve el listado permitido al rol TECNICO; esta vista lo reduce por `technicianId`. Se recomienda `/work-orders/assigned-to-me`.</p></div>

      <section className="technician-panel">
        <div className="technician-filters technician-filters--compact">
          <label>Buscar<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Folio, ingreso u observación" /></label>
          <label>Estado<select value={statusId} onChange={(event) => setStatusId(event.target.value)}><option value="">Todos los estados</option>{workspace.statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select></label>
        </div>
        {relations.warning && <div className="technician-inline-warning">{relations.warning}</div>}
        {filteredOrders.length === 0 ? <div className="technician-empty"><strong>Sin órdenes</strong><p>No tienes órdenes que coincidan con los filtros.</p></div> : relations.loading ? <div className="technician-empty">Cargando datos relacionados...</div> : <TechnicianOrdersTable workOrders={visibleOrders} statuses={workspace.statuses} {...relations} />}
        {totalPages > 1 && <div className="technician-pagination"><span>Página {page + 1} de {totalPages}</span><div><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Anterior</button><button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div></div>}
      </section>
    </section>
  );
}
