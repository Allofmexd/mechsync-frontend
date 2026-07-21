import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CustomerPagination from './components/CustomerPagination.jsx';
import { getCustomerHistory, getCustomerVehicles } from './customerPortalService.js';
import { formatCustomerDateTime, getCustomerPortalErrorMessage } from './customerPortalUtils.js';

const EMPTY_PAGE = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true };

function eventLink(event) {
  if (event.eventType.startsWith('QUOTATION')) return `/customer/quotations/${event.relatedWorkOrderId}`;
  if (event.eventType.startsWith('JOB')) return `/customer/jobs/${event.relatedJobId}`;
  if (event.eventType === 'WORK_ORDER') return `/customer/work-orders/${event.relatedWorkOrderId}`;
  return `/customer/service-history/${event.relatedIntakeId ?? event.eventId}`;
}

export default function CustomerHistoryPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [vehicleId, setVehicleId] = useState(searchParams.get('vehicleId') ?? '');
  const [pageData, setPageData] = useState(EMPTY_PAGE);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getCustomerVehicles({ page: 0, size: 100, signal: controller.signal })
      .then((result) => setVehicles(result.content))
      .catch((requestError) => {
        if (requestError?.name !== 'AbortError') setVehicles([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getCustomerHistory({ page, size, vehicleId: vehicleId || undefined, signal: controller.signal })
      .then((result) => {
        if (result.totalPages > 0 && page >= result.totalPages) {
          setPage(result.totalPages - 1);
          return;
        }
        if (result.totalPages === 0 && page !== 0) {
          setPage(0);
          return;
        }
        setPageData(result);
        setLoading(false);
      })
      .catch((requestError) => {
        if (requestError?.name === 'AbortError') return;
        setError(getCustomerPortalErrorMessage(requestError, 'el historial'));
        setLoading(false);
      });
    return () => controller.abort();
  }, [page, size, vehicleId, reloadKey]);

  return (
    <section className="customer-page" aria-busy={loading}>
      <header className="customer-page__heading"><div><span>Actividad</span><h1>Historial de servicio</h1></div><p>Consulta los eventos operativos de tus vehículos en orden cronológico.</p></header>
      <article className="customer-card">
        <header className="customer-card__header customer-card__header--toolbar">
          <div><h2>Actividad registrada</h2><p>{pageData.totalElements} eventos</p></div>
          <label>Vehículo
            <select value={vehicleId} disabled={loading} onChange={(event) => { setVehicleId(event.target.value); setPage(0); }}>
              <option value="">Todos mis vehículos</option>
              {vehicles.map((vehicle) => <option key={vehicle.vehicleId} value={vehicle.vehicleId}>{vehicle.description}</option>)}
            </select>
          </label>
        </header>
        {loading && pageData.content.length === 0 && <div className="customer-state customer-state--inside" role="status" aria-live="polite"><span className="customer-loader" /><p>Cargando historial…</p></div>}
        {error && <div className="customer-state customer-state--inside customer-state--error" role="alert"><p>{error}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar</button></div>}
        {!loading && !error && pageData.totalElements === 0 && <div className="customer-state customer-state--inside"><h2>Sin actividad registrada</h2><p>Todavía no hay eventos de servicio visibles para esta selección.</p></div>}
        {!error && pageData.content.length > 0 && <ol className="customer-timeline">
          {pageData.content.map((event) => <li key={`${event.eventType}-${event.eventId}`}>
            <time dateTime={event.date}>{formatCustomerDateTime(event.date)}</time>
            <div><span className="customer-status">{event.status}</span><h3>{event.title}</h3><p>{event.vehicleLabel}</p>{event.description && <small>{event.description}</small>}<Link to={eventLink(event)}>Ver detalle</Link></div>
          </li>)}
        </ol>}
        <CustomerPagination pageData={pageData} size={size} loading={loading} resourceLabel="eventos" ariaLabel="Paginación del historial" onPageChange={setPage} onSizeChange={(value) => { setSize(value); setPage(0); }} />
      </article>
    </section>
  );
}
