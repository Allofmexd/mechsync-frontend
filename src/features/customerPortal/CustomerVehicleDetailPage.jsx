import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCustomerHistory, getCustomerVehicle } from './customerPortalService.js';
import { formatCustomerDate, formatCustomerDateTime, formatCustomerMileage, getCustomerPortalErrorMessage } from './customerPortalUtils.js';

export default function CustomerVehicleDetailPage() {
  const { vehicleId } = useParams();
  const [state, setState] = useState({ loading: true, vehicle: null, history: [], error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, vehicle: null, history: [], error: '' });
    Promise.all([
      getCustomerVehicle(vehicleId, { signal: controller.signal }),
      getCustomerHistory({ page: 0, size: 5, vehicleId, signal: controller.signal }),
    ]).then(([vehicle, history]) => {
      setState({ loading: false, vehicle, history: history.content, error: '' });
    }).catch((error) => {
      if (error?.name === 'AbortError') return;
      setState({ loading: false, vehicle: null, history: [], error: getCustomerPortalErrorMessage(error, 'el vehículo') });
    });
    return () => controller.abort();
  }, [vehicleId, reloadKey]);

  if (state.loading) return <section className="customer-state" role="status" aria-live="polite"><span className="customer-loader" /><p>Cargando vehículo…</p></section>;
  if (state.error) return <section className="customer-state customer-state--error" role="alert"><h1>Vehículo no disponible</h1><p>{state.error}</p><div className="customer-state__actions"><Link to="/customer/vehicles">Volver a mis vehículos</Link><button type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar</button></div></section>;

  const vehicle = state.vehicle;
  return <section className="customer-page" aria-busy="false">
    <nav className="customer-breadcrumb" aria-label="Ruta de navegación"><Link to="/customer/vehicles">Mis vehículos</Link><span aria-hidden="true">/</span><strong>{vehicle.brand} {vehicle.model}</strong></nav>
    <header className="customer-page__heading"><div><span>Detalle</span><h1>{vehicle.brand} {vehicle.model}</h1></div><p>Información registrada para este vehículo.</p></header>
    <article className="customer-card"><dl className="customer-detail-grid"><div><dt>Año</dt><dd>{vehicle.year}</dd></div><div><dt>Color</dt><dd>{vehicle.color || 'No registrado'}</dd></div><div><dt>Placa</dt><dd>{vehicle.licensePlate}</dd></div><div><dt>VIN completo</dt><dd><code>{vehicle.vin || 'No registrado'}</code></dd></div><div><dt>Kilometraje actual</dt><dd>{formatCustomerMileage(vehicle.currentMileage)}</dd></div><div><dt>Fecha de registro</dt><dd>{formatCustomerDate(vehicle.createdAt)}</dd></div></dl></article>
    <article className="customer-card customer-section"><header className="customer-card__header"><div><h2>Actividad reciente</h2><p>Últimos eventos visibles de este vehículo.</p></div><Link to={`/customer/service-history?vehicleId=${vehicle.vehicleId}`}>Ver historial completo</Link></header>{state.history.length === 0 ? <div className="customer-state customer-state--inside"><p>No hay actividad registrada.</p></div> : <ul className="customer-link-list">{state.history.map((event) => <li key={`${event.eventType}-${event.eventId}`}><div><strong>{event.title}</strong><small>{formatCustomerDateTime(event.date)} · {event.status}</small></div></li>)}</ul>}</article>
    <Link className="customer-back-link" to="/customer/vehicles">Volver a mis vehículos</Link>
  </section>;
}
