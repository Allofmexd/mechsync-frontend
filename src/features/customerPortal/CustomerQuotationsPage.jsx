import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerPagination from './components/CustomerPagination.jsx';
import { getCustomerWorkOrders } from './customerPortalService.js';
import { formatCustomerDateTime, formatCustomerMoney, getCustomerPortalErrorMessage } from './customerPortalUtils.js';

const EMPTY_PAGE = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true };

export default function CustomerQuotationsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [pageData, setPageData] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    getCustomerWorkOrders({ page, size, quotationOnly: true, signal: controller.signal })
      .then((result) => {
        if (result.totalPages > 0 && page >= result.totalPages) { setPage(result.totalPages - 1); return; }
        if (result.totalPages === 0 && page !== 0) { setPage(0); return; }
        setPageData(result); setLoading(false);
      })
      .catch((requestError) => { if (requestError?.name !== 'AbortError') { setError(getCustomerPortalErrorMessage(requestError, 'las cotizaciones')); setLoading(false); } });
    return () => controller.abort();
  }, [page, size, reloadKey]);
  return <section className="customer-page" aria-busy={loading}><header className="customer-page__heading"><div><span>Documentos</span><h1>Mis cotizaciones</h1></div><p>Solo aparecen cotizaciones disponibles o autorizadas.</p></header><article className="customer-card"><header className="customer-card__header"><div><h2>Cotizaciones visibles</h2><p>{pageData.totalElements} en total</p></div></header>
    {loading && pageData.content.length === 0 && <div className="customer-state customer-state--inside" role="status" aria-live="polite"><span className="customer-loader" /><p>Cargando cotizaciones…</p></div>}
    {error && <div className="customer-state customer-state--inside customer-state--error" role="alert"><p>{error}</p><button type="button" onClick={() => setReloadKey((v) => v + 1)}>Reintentar</button></div>}
    {!loading && !error && pageData.totalElements === 0 && <div className="customer-state customer-state--inside"><h2>No hay cotizaciones disponibles</h2><p>Las cotizaciones en preparación no se muestran en este portal.</p></div>}
    {!error && pageData.content.length > 0 && <div className="customer-table-wrap"><table className="customer-table"><caption className="customer-visually-hidden">Cotizaciones disponibles</caption><thead><tr><th>Orden</th><th>Vehículo</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Detalle</th></tr></thead><tbody>{pageData.content.map((order) => <tr key={order.workOrderId}><td>#{order.workOrderId}</td><td>{order.vehicle.label}</td><td>{formatCustomerDateTime(order.workOrderDate)}</td><td><span className="customer-status">{order.quotationStatus}</span></td><td>{formatCustomerMoney(order.quotationTotal, order.quotationCurrency || 'MXN')}</td><td><Link to={`/customer/quotations/${order.workOrderId}`}>Ver cotización de la orden #{order.workOrderId}</Link></td></tr>)}</tbody></table></div>}
    <CustomerPagination pageData={pageData} size={size} loading={loading} resourceLabel="cotizaciones" ariaLabel="Paginación de cotizaciones" onPageChange={setPage} onSizeChange={(value) => { setSize(value); setPage(0); }} /></article></section>;
}
