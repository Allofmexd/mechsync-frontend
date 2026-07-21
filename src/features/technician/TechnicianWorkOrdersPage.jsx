import { useCallback, useEffect, useMemo, useState } from 'react';
import TechnicianOrdersTable from './TechnicianOrdersTable';
import TechnicianPagination from './TechnicianPagination';
import {
  DEFAULT_TECHNICIAN_PAGE_SIZE,
  getValidPageCorrection,
} from './technicianPaginationUtils';
import { listAssignedWorkOrders } from './technicianWorkOrdersService';
import { getTechnicianResourceErrorMessage } from './technicianResourceUtils';
import './technician.css';

const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: DEFAULT_TECHNICIAN_PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};

export default function TechnicianWorkOrdersPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_TECHNICIAN_PAGE_SIZE);
  const [pageData, setPageData] = useState(EMPTY_PAGE);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadPage() {
      setLoading(true);
      setError('');

      try {
        const nextPage = await listAssignedWorkOrders({
          page,
          size,
          signal: controller.signal,
        });

        if (!active) return;

        const correctedPage = getValidPageCorrection(page, nextPage);
        if (correctedPage !== null) {
          setPage(correctedPage);
          return;
        }

        setPageData(nextPage);
      } catch (requestError) {
        if (active && requestError?.name !== 'AbortError') {
          setError(getTechnicianResourceErrorMessage(requestError, 'tus órdenes'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPage();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, reloadKey, size]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es-MX');
    if (!normalizedQuery) return pageData.content;

    return pageData.content.filter((order) => [
      order.id,
      order.vehicleIntakeId,
      order.statusId,
      order.technicalObservations,
    ].filter(Boolean).join(' ').toLocaleLowerCase('es-MX').includes(normalizedQuery));
  }, [pageData.content, query]);

  function changePage(nextPage) {
    if (loading) return;
    setPage(Math.max(0, nextPage));
  }

  function changeSize(nextSize) {
    setSize(nextSize);
    setPage(0);
  }

  const hasGlobalResults = pageData.totalElements > 0;
  const hasLocalMatches = filteredOrders.length > 0;

  return (
    <section className="technician-orders-page" aria-labelledby="technician-orders-title">
      <div className="technician-page-heading">
        <div>
          <p className="admin-eyebrow">Panel técnico</p>
          <h1 id="technician-orders-title">Mis órdenes</h1>
          <p>Órdenes asignadas de forma segura al perfil técnico de tu sesión.</p>
        </div>
        <span className="technician-readonly">Solo lectura</span>
      </div>

      <div className="technician-client-filter-notice">
        <strong>Asignación verificada en servidor</strong>
        <p>La vista solicita una página por vez mediante <code>/work-orders/assigned-to-me</code>.</p>
      </div>

      <section className="technician-panel" aria-busy={loading}>
        <div className="technician-orders-toolbar">
          <label>
            Filtrar esta página
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Folio, ingreso, estado u observación"
              disabled={loading || !hasGlobalResults}
            />
            <small>El filtro se aplica únicamente a los resultados visibles.</small>
          </label>
          <div className="technician-orders-total" aria-live="polite">
            <span>Total asignado</span>
            <strong>{pageData.totalElements}</strong>
          </div>
        </div>

        {error && (
          <div className="technician-state technician-state--error" role="alert">
            <strong>No fue posible cargar tus órdenes</strong>
            <p>{error}</p>
            <button className="admin-button admin-button--primary" type="button" onClick={reload}>
              Reintentar
            </button>
          </div>
        )}

        {!error && loading ? (
          <div className="technician-empty" role="status" aria-live="polite">
            <span className="technician-loader" aria-hidden="true" />
            <p>Cargando órdenes asignadas...</p>
          </div>
        ) : !error && !hasGlobalResults ? (
          <div className="technician-empty" role="status">
            <strong>Aún no tienes órdenes asignadas.</strong>
            <p>Las nuevas asignaciones aparecerán en esta vista.</p>
          </div>
        ) : !error && !hasLocalMatches ? (
          <div className="technician-empty" role="status">
            <strong>Sin coincidencias en esta página.</strong>
            <p>Modifica o limpia el filtro para ver los {pageData.content.length} resultados cargados.</p>
          </div>
        ) : !error ? (
          <TechnicianOrdersTable workOrders={filteredOrders} />
        ) : null}

        {!error && !loading && hasGlobalResults && (
          <TechnicianPagination
            pageData={pageData}
            size={size}
            loading={loading}
            resourceLabel="órdenes asignadas"
            onPageChange={changePage}
            onSizeChange={changeSize}
          />
        )}
      </section>
    </section>
  );
}
