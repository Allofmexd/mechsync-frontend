import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getVehicles } from './vehiclesService';
import './vehicles.css';

const PAGE_SIZE = 20;

export default function VehiclesListPage() {
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState(location.state?.success || '');

  useEffect(() => {
    let active = true;

    async function loadVehicles() {
      setLoading(true);
      setError('');
      try {
        const response = await getVehicles({ page, size: PAGE_SIZE });
        if (active) setPageData(response?.data ?? response);
      } catch (requestError) {
        if (active) {
          setError(getApiErrorMessage(requestError, 'Error al cargar los vehículos.'));
          setPageData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVehicles();
    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  const vehicles = Array.isArray(pageData?.content) ? pageData.content : [];
  const filteredVehicles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return vehicles;

    return vehicles.filter((vehicle) =>
      [
        vehicle.id,
        vehicle.customerId,
        vehicle.brand,
        vehicle.model,
        vehicle.licensePlate,
        vehicle.vin,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLocaleLowerCase('es').includes(normalized)),
    );
  }, [query, vehicles]);

  const totalElements = Number(pageData?.totalElements ?? vehicles.length);
  const totalPages = Number(pageData?.totalPages ?? (vehicles.length ? 1 : 0));
  const currentPage = Number(pageData?.page ?? page);

  return (
    <section className="vehicles-page">
      <div className="admin-breadcrumb" aria-label="Ruta actual">
        <span>Panel principal</span>
        <span aria-hidden="true">›</span>
        <strong>Vehículos</strong>
      </div>

      {notice && (
        <div className="admin-alert admin-alert--success" role="status">
          <span aria-hidden="true">✓</span>
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice('')} aria-label="Cerrar mensaje">×</button>
        </div>
      )}

      <div className="vehicles-heading">
        <div>
          <p className="admin-eyebrow">Gestión del taller</p>
          <h1>Vehículos</h1>
          <p>Consulta los vehículos registrados y abre su ficha individual.</p>
        </div>
        <Link className="admin-button admin-button--primary" to="/admin/vehicles/new">
          <span aria-hidden="true">＋</span>
          Nuevo vehículo
        </Link>
      </div>

      <div className="vehicles-stats">
        <article>
          <span>Total registrado</span>
          <strong>{loading ? '…' : totalElements}</strong>
          <small>Dato real de GET /vehicles</small>
        </article>
        <article>
          <span>Página actual</span>
          <strong>{totalPages ? currentPage + 1 : 0}</strong>
          <small>de {totalPages} páginas</small>
        </article>
        <article className="vehicles-stats__pending">
          <span>Estado en taller</span>
          <strong>Pendiente</strong>
          <small>VehicleResponse no incluye estado de servicio</small>
        </article>
      </div>

      <div className="vehicles-panel">
        <div className="vehicles-toolbar">
          <label className="vehicles-search">
            <span className="sr-only">Buscar en la página actual</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por placa, marca, modelo, VIN o ID"
            />
          </label>
          <label className="vehicles-pending-filter">
            <span>Estado de servicio</span>
            <select disabled title="VehicleResponse no incluye estado">
              <option>Pendiente de endpoint/dato</option>
            </select>
          </label>
          <button
            className="admin-button admin-button--secondary"
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>

        {error && (
          <div className="admin-alert admin-alert--error vehicles-inline-alert" role="alert">
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="vehicles-state" aria-live="polite">
            <span className="vehicles-loader" aria-hidden="true" />
            <p>Cargando vehículos…</p>
          </div>
        ) : !error && vehicles.length === 0 ? (
          <div className="vehicles-state">
            <strong>Sin vehículos registrados</strong>
            <p>Registra un vehículo asociado a un Customer existente.</p>
            <Link className="admin-button admin-button--primary" to="/admin/vehicles/new">
              Nuevo vehículo
            </Link>
          </div>
        ) : !error ? (
          <>
            <div className="vehicles-table-wrap">
              <table className="vehicles-table">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Marca / modelo</th>
                    <th>Año</th>
                    <th>Color</th>
                    <th>Customer ID</th>
                    <th>Kilometraje</th>
                    <th>VIN</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td><strong>{vehicle.licensePlate}</strong></td>
                      <td>{vehicle.brand} {vehicle.model}</td>
                      <td>{vehicle.year}</td>
                      <td>{vehicle.color || 'No registrado'}</td>
                      <td>
                        <Link to={`/admin/customers/${vehicle.customerId}`}>
                          #{vehicle.customerId}
                        </Link>
                      </td>
                      <td>
                        {vehicle.currentMileage === null || vehicle.currentMileage === undefined
                          ? 'No registrado'
                          : `${Number(vehicle.currentMileage).toLocaleString('es-MX')} km`}
                      </td>
                      <td>{vehicle.vin || 'No registrado'}</td>
                      <td>
                        <div className="vehicles-actions">
                          <Link to={`/admin/vehicles/${vehicle.id}`}>Ver detalle</Link>
                          <Link to={`/admin/vehicle-intakes/new?vehicleId=${vehicle.id}`}>Nuevo ingreso</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredVehicles.length === 0 && (
              <div className="vehicles-filter-empty">Sin coincidencias en la página actual.</div>
            )}

            <div className="vehicles-pagination">
              <p>Mostrando {filteredVehicles.length} de {vehicles.length} registros en esta página</p>
              <div>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  disabled={loading || currentPage <= 0}
                >
                  Anterior
                </button>
                <span>{totalPages ? currentPage + 1 : 0} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((value) => value + 1)}
                  disabled={loading || !totalPages || currentPage >= totalPages - 1}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
