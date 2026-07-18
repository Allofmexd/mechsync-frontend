import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TechnicianOrdersTable from './TechnicianOrdersTable';
import TechnicianWorkspaceState from './TechnicianWorkspaceState';
import useTechnicianWorkspace from './useTechnicianWorkspace';
import useWorkOrderRelations from './useWorkOrderRelations';
import './technician.css';

const PAGE_SIZE = 10;

export default function TechnicianAssignedWorkOrdersPage() {
  const { currentUser } = useOutletContext();
  const workspace = useTechnicianWorkspace(currentUser?.id);
  const relations = useWorkOrderRelations(workspace.workOrders);
  const [filters, setFilters] = useState({ query: '', statusId: '', date: '' });
  const [page, setPage] = useState(0);
  const filteredOrders = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase('es');
    return workspace.workOrders.filter((order) => {
      const intake = relations.intakes[order.vehicleIntakeId];
      const vehicle = intake ? relations.vehicles[intake.vehicleId] : null;
      const searchable = [order.id, order.vehicleIntakeId, vehicle?.licensePlate, vehicle?.brand, vehicle?.model]
        .filter(Boolean).join(' ').toLocaleLowerCase('es');
      const orderDate = order.workOrderDate ? String(order.workOrderDate).slice(0, 10) : '';
      return (!query || searchable.includes(query))
        && (!filters.statusId || String(order.statusId) === filters.statusId)
        && (!filters.date || orderDate === filters.date);
    });
  }, [filters, relations.intakes, relations.vehicles, workspace.workOrders]);
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const visibleOrders = filteredOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [filters]);

  if (workspace.loading || workspace.error || !workspace.technician) {
    return <TechnicianWorkspaceState {...workspace} />;
  }

  return (
    <section className="technician-orders-page technician-assigned-page">
      <div className="technician-page-heading"><div><p className="admin-eyebrow">Panel técnico › Mis órdenes</p><h1>Mis órdenes asignadas</h1><p>Solo se muestran registros cuyo `technicianId` coincide con tu perfil técnico.</p></div></div>
      <section className="technician-panel">
        <div className="technician-filters">
          <label>Estado<select value={filters.statusId} onChange={(event) => setFilters((current) => ({ ...current, statusId: event.target.value }))}><option value="">Todos los estados</option>{workspace.statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select></label>
          <label>Fecha de orden<input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} /></label>
          <label>Buscar por placa o folio<input type="search" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Ej. ABC-1234 u OT-10" /></label>
          <button className="admin-button admin-button--secondary" type="button" onClick={() => setFilters({ query: '', statusId: '', date: '' })}>Limpiar</button>
        </div>
        <div className="technician-client-filter-notice technician-client-filter-notice--inside"><strong>Asignación verificada en cliente</strong><p>Mapeo `/auth/me.id` → `/technicians.userId` → `workOrder.technicianId`.</p></div>
        {relations.warning && <div className="technician-inline-warning">{relations.warning}</div>}
        {relations.loading ? <div className="technician-empty">Cargando órdenes asignadas...</div> : filteredOrders.length === 0 ? <div className="technician-empty"><strong>No tienes órdenes asignadas.</strong><p>No existen coincidencias para los filtros actuales.</p></div> : <TechnicianOrdersTable workOrders={visibleOrders} statuses={workspace.statuses} {...relations} showPendingActions />}
        {totalPages > 1 && <div className="technician-pagination"><span>Mostrando {visibleOrders.length} de {filteredOrders.length} órdenes</span><div><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>{page + 1} / {totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div></div>}
      </section>
    </section>
  );
}
