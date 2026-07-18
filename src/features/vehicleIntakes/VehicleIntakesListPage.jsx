import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getVehicleIntakeStatuses } from '../catalogs/catalogsService';
import { getTechnicians } from '../technicians/techniciansService';
import { getVehicleById } from '../vehicles/vehiclesService';
import { getVehicleIntakes } from './vehicleIntakesService';
import './vehicleIntakes.css';

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

function formatDate(value) {
  if (!value) return 'Dato no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dato no disponible';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getTechnicianName(technician) {
  if (!technician) return 'Sin asignar';
  return technician.fullName
    || [technician.firstName, technician.lastName].filter(Boolean).join(' ')
    || `Técnico #${technician.id}`;
}

export default function VehicleIntakesListPage() {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], page: 0, totalElements: 0, totalPages: 0 });
  const [statuses, setStatuses] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [vehicles, setVehicles] = useState({});
  const [filters, setFilters] = useState({ query: '', statusId: '', technicianId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [intakesResponse, statusesResponse, techniciansResponse] = await Promise.all([
          getVehicleIntakes({ page, size: PAGE_SIZE }),
          getVehicleIntakeStatuses(),
          getTechnicians(),
        ]);
        const nextPage = unwrapPage(intakesResponse);
        const vehicleIds = [...new Set(nextPage.content.map((intake) => intake.vehicleId).filter(Boolean))];
        const vehicleResults = await Promise.allSettled(vehicleIds.map((id) => getVehicleById(id)));
        const nextVehicles = {};

        vehicleResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            nextVehicles[vehicleIds[index]] = result.value?.data ?? result.value;
          }
        });

        if (active) {
          setPageData(nextPage);
          setStatuses(unwrapCollection(statusesResponse));
          setTechnicians(unwrapCollection(techniciansResponse));
          setVehicles(nextVehicles);
        }
      } catch (requestError) {
        if (active) {
          setError(getApiErrorMessage(requestError, 'No fue posible cargar los ingresos de vehículos.'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [page]);

  const statusMap = useMemo(
    () => new Map(statuses.map((status) => [String(status.id), status])),
    [statuses],
  );
  const technicianMap = useMemo(
    () => new Map(technicians.map((technician) => [String(technician.id), technician])),
    [technicians],
  );
  const filteredIntakes = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase('es');
    return pageData.content.filter((intake) => {
      const vehicle = vehicles[intake.vehicleId];
      const searchable = [
        intake.id,
        intake.reportedProblem,
        vehicle?.brand,
        vehicle?.model,
        vehicle?.licensePlate,
        vehicle?.vin,
      ].filter(Boolean).join(' ').toLocaleLowerCase('es');

      return (!query || searchable.includes(query))
        && (!filters.statusId || String(intake.statusId) === filters.statusId)
        && (!filters.technicianId || String(intake.technicianId) === filters.technicianId);
    });
  }, [filters, pageData.content, vehicles]);

  return (
    <section className="intake-management-page">
      <div className="admin-breadcrumb"><span>Panel principal</span><span>›</span><strong>Ingresos</strong></div>
      <div className="intake-management-heading">
        <div>
          <p className="admin-eyebrow">Operación del taller</p>
          <h1>Gestión de ingresos de vehículos</h1>
          <p>Consulta los vehículos recibidos, su problema reportado y estado actual.</p>
        </div>
        <Link className="admin-button admin-button--primary" to="/admin/vehicle-intakes/new">＋ Nuevo ingreso</Link>
      </div>

      <div className="intake-summary-grid" aria-label="Resumen de ingresos">
        <article><span>Ingresos registrados</span><strong>{pageData.totalElements}</strong><small>Dato reportado por la API</small></article>
        <article><span>Estados disponibles</span><strong>{statuses.length}</strong><small>Catálogo VEHICLE_INTAKES</small></article>
        <article><span>Técnicos disponibles</span><strong>{technicians.length}</strong><small>Asignación real disponible</small></article>
        <article><span>Registros en página</span><strong>{pageData.content.length}</strong><small>Máximo {PAGE_SIZE}</small></article>
      </div>

      <div className="intake-management-panel">
        <div className="intake-filters">
          <label>Buscar en esta página<input type="search" placeholder="Folio, placa, VIN o problema" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} /></label>
          <label>Estado<select value={filters.statusId} onChange={(event) => setFilters((current) => ({ ...current, statusId: event.target.value }))}><option value="">Todos</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select></label>
          <label>Técnico<select value={filters.technicianId} onChange={(event) => setFilters((current) => ({ ...current, technicianId: event.target.value }))}><option value="">Todos</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{getTechnicianName(technician)}</option>)}</select></label>
        </div>

        {error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}
        {loading ? (
          <div className="intake-management-state">Cargando ingresos...</div>
        ) : !error && pageData.content.length === 0 ? (
          <div className="intake-management-state"><strong>Sin ingresos registrados</strong><p>Crea el primer ingreso desde el formulario administrativo.</p></div>
        ) : !error ? (
          <>
            <div className="intake-table-wrap">
              <table className="intake-table">
                <thead><tr><th>Folio</th><th>Fecha</th><th>Vehículo</th><th>Cliente</th><th>Técnico</th><th>Problema</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {filteredIntakes.map((intake) => {
                    const vehicle = vehicles[intake.vehicleId];
                    const status = statusMap.get(String(intake.statusId));
                    return (
                      <tr key={intake.id}>
                        <td><strong>ING-{intake.id}</strong></td>
                        <td>{formatDate(intake.intakeDate)}</td>
                        <td><strong>{vehicle ? `${vehicle.brand} ${vehicle.model}` : `Vehículo #${intake.vehicleId}`}</strong><small>{vehicle?.licensePlate || 'Placa no disponible'}</small></td>
                        <td>{vehicle?.customerId ? `Cliente #${vehicle.customerId}` : 'Dato no disponible'}</td>
                        <td>{getTechnicianName(technicianMap.get(String(intake.technicianId)))}</td>
                        <td className="intake-table__problem">{intake.reportedProblem}</td>
                        <td><span className="intake-status-badge">{status?.name || `Estado #${intake.statusId}`}</span></td>
                        <td><Link className="table-action-link" to={`/admin/vehicle-intakes/${intake.id}`}>Ver detalle</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredIntakes.length === 0 && <div className="intake-filter-empty">No hay coincidencias en esta página.</div>}
            {pageData.totalPages > 1 && (
              <div className="intake-pagination">
                <span>Página {pageData.page + 1} de {pageData.totalPages}</span>
                <div><button type="button" disabled={pageData.page <= 0} onClick={() => setPage((current) => current - 1)}>Anterior</button><button type="button" disabled={pageData.page + 1 >= pageData.totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</button></div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
