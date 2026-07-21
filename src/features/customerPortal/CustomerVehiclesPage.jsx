import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerPagination from './components/CustomerPagination.jsx';
import { getCustomerVehicles } from './customerPortalService.js';
import { formatCustomerMileage, getCustomerPortalErrorMessage } from './customerPortalUtils.js';

const EMPTY_PAGE = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true };

export default function CustomerVehiclesPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [pageData, setPageData] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getCustomerVehicles({ page, size, signal: controller.signal })
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
        setError(getCustomerPortalErrorMessage(requestError, 'tus vehículos'));
        setLoading(false);
      });
    return () => controller.abort();
  }, [page, size, reloadKey]);

  function changeSize(nextSize) {
    setSize(nextSize);
    setPage(0);
  }

  return (
    <section className="customer-page" aria-busy={loading}>
      <header className="customer-page__heading"><div><span>Vehículos</span><h1>Mis vehículos</h1></div><p>Solo se muestran los vehículos asociados a tu perfil.</p></header>
      <article className="customer-card">
        <header className="customer-card__header"><div><h2>Vehículos registrados</h2><p>{pageData.totalElements} en total</p></div></header>
        {loading && pageData.content.length === 0 && <div className="customer-state customer-state--inside" role="status" aria-live="polite"><span className="customer-loader" /><p>Cargando vehículos…</p></div>}
        {error && <div className="customer-state customer-state--inside customer-state--error" role="alert"><p>{error}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar</button></div>}
        {!loading && !error && pageData.totalElements === 0 && <div className="customer-state customer-state--inside"><h2>Aún no tienes vehículos registrados</h2><p>Contacta al taller si necesitas actualizar tu información.</p></div>}
        {!error && pageData.content.length > 0 && (
          <div className="customer-table-wrap">
            <table className="customer-table">
              <caption className="customer-visually-hidden">Vehículos registrados en tu perfil</caption>
              <thead><tr><th>Vehículo</th><th>Placa</th><th>VIN</th><th>Kilometraje</th><th>Detalle</th></tr></thead>
              <tbody>{pageData.content.map((vehicle) => (
                <tr key={vehicle.vehicleId}>
                  <td><strong>{vehicle.description}</strong><small>{vehicle.color || 'Color no registrado'}</small></td>
                  <td>{vehicle.licensePlate}</td>
                  <td><code>{vehicle.maskedVin || 'No registrado'}</code></td>
                  <td>{formatCustomerMileage(vehicle.currentMileage)}</td>
                  <td><Link to={`/customer/vehicles/${vehicle.vehicleId}`}>Ver detalle de {vehicle.description}</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <CustomerPagination pageData={pageData} size={size} loading={loading} onPageChange={setPage} onSizeChange={changeSize} />
        {loading && pageData.content.length > 0 && <p className="customer-refresh-status" role="status" aria-live="polite">Actualizando página…</p>}
      </article>
    </section>
  );
}
