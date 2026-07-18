import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getWorkOrderStatuses } from '../catalogs/catalogsService';
import { getTechnicians } from '../technicians/techniciansService';
import { getWorkOrders } from './workOrdersService';
import './workOrders.css';

const PAGE_SIZE = 20;

function unwrapCollection(response) {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : data?.content ?? [];
}

function unwrapPage(response) {
  const data = response?.data ?? response ?? {};
  const content = Array.isArray(data) ? data : data.content ?? [];
  return {
    content,
    page: Number(data.page ?? 0),
    totalElements: Number(data.totalElements ?? content.length),
    totalPages: Number(data.totalPages ?? (content.length ? 1 : 0)),
  };
}

function technicianName(technician, technicianId) {
  return technician?.fullName
    || [technician?.firstName, technician?.lastName].filter(Boolean).join(' ')
    || (technicianId ? `Técnico #${technicianId}` : 'Dato no disponible');
}

function formatDate(value) {
  if (!value) return 'Dato no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dato no disponible';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(date);
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return 'Dato no disponible';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
}

export default function WorkOrdersListPage() {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], page: 0, totalElements: 0, totalPages: 0 });
  const [statuses, setStatuses] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [filters, setFilters] = useState({ query: '', statusId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [ordersResponse, statusesResponse, techniciansResponse] = await Promise.all([
          getWorkOrders({ page, size: PAGE_SIZE }),
          getWorkOrderStatuses(),
          getTechnicians(),
        ]);
        if (active) {
          setPageData(unwrapPage(ordersResponse));
          setStatuses(unwrapCollection(statusesResponse));
          setTechnicians(unwrapCollection(techniciansResponse));
        }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'No fue posible cargar las órdenes de servicio.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [page]);

  const statusMap = useMemo(() => new Map(statuses.map((item) => [String(item.id), item])), [statuses]);
  const technicianMap = useMemo(() => new Map(technicians.map((item) => [String(item.id), item])), [technicians]);
  const orders = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase('es');
    return pageData.content.filter((order) => {
      const searchable = [order.id, order.vehicleIntakeId, order.technicalObservations].filter(Boolean).join(' ').toLocaleLowerCase('es');
      return (!query || searchable.includes(query))
        && (!filters.statusId || String(order.statusId) === filters.statusId);
    });
  }, [filters, pageData.content]);

  return (
    <section className="work-orders-page">
      <div className="admin-breadcrumb"><span>Panel principal</span><span>›</span><strong>Órdenes de servicio</strong></div>
      <div className="work-orders-heading">
        <div><p className="admin-eyebrow">Gestión del taller</p><h1>Órdenes de servicio</h1><p>Listado respaldado por el módulo real de Work Orders.</p></div>
        <Link className="admin-button admin-button--primary" to="/admin/work-orders/new">＋ Crear orden</Link>
      </div>

      <div className="work-orders-summary">
        <article><span>Total de órdenes</span><strong>{pageData.totalElements}</strong><small>Dato reportado por la API</small></article>
        <article><span>Página actual</span><strong>{pageData.totalPages ? pageData.page + 1 : 0}</strong><small>de {pageData.totalPages} páginas</small></article>
        <article><span>Estados disponibles</span><strong>{statuses.length}</strong><small>Catálogo WORK_ORDERS</small></article>
      </div>

      <div className="work-orders-panel">
        <div className="work-orders-toolbar">
          <label>Buscar<input type="search" placeholder="Folio, ingreso u observación" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} /></label>
          <label>Estado<select value={filters.statusId} onChange={(event) => setFilters((current) => ({ ...current, statusId: event.target.value }))}><option value="">Todos</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select></label>
        </div>
        {error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}
        {loading ? (
          <div className="work-orders-state">Cargando órdenes...</div>
        ) : !error && pageData.content.length === 0 ? (
          <div className="work-orders-state"><strong>Sin órdenes registradas</strong><p>Crea una orden desde un ingreso existente.</p></div>
        ) : !error ? (
          <>
            <div className="work-orders-table-wrap">
              <table className="work-orders-table">
                <thead><tr><th>Orden</th><th>Ingreso</th><th>Técnico</th><th>Fecha</th><th>Entrega estimada</th><th>Total estimado</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>{orders.map((order) => <tr key={order.id}><td><strong>OT-{order.id}</strong></td><td><Link to={`/admin/vehicle-intakes/${order.vehicleIntakeId}`}>ING-{order.vehicleIntakeId}</Link></td><td>{technicianName(technicianMap.get(String(order.technicianId)), order.technicianId)}</td><td>{formatDate(order.workOrderDate)}</td><td>{formatDate(order.estimatedDeliveryDate)}</td><td>{formatMoney(order.estimatedTotal)}</td><td><span className="work-order-status">{statusMap.get(String(order.statusId))?.name || `Estado #${order.statusId}`}</span></td><td><div className="work-order-table-actions"><Link className="table-action-link" to={`/admin/work-orders/${order.id}`}>Ver detalle</Link><Link className="table-action-link" to={`/admin/work-orders/${order.id}/revisions`}>Revisiones</Link><Link className="table-action-link" to={`/admin/quotations/new?workOrderId=${order.id}`}>Cotizar</Link></div></td></tr>)}</tbody>
              </table>
            </div>
            {orders.length === 0 && <div className="work-orders-filter-empty">No hay coincidencias en esta página.</div>}
            {pageData.totalPages > 1 && <div className="work-orders-pagination"><span>Página {pageData.page + 1} de {pageData.totalPages}</span><div><button type="button" disabled={pageData.page <= 0} onClick={() => setPage((value) => value - 1)}>Anterior</button><button type="button" disabled={pageData.page + 1 >= pageData.totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div></div>}
          </>
        ) : null}
      </div>
    </section>
  );
}
