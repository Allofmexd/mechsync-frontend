import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCustomerIntake } from './customerPortalService.js';
import { formatCustomerDateTime, formatCustomerMileage, getCustomerPortalErrorMessage } from './customerPortalUtils.js';

export default function CustomerIntakeDetailPage() {
  const { intakeId } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, data: null, error: '' });
    getCustomerIntake(intakeId, { signal: controller.signal })
      .then((data) => setState({ loading: false, data, error: '' }))
      .catch((error) => {
        if (error?.name !== 'AbortError') setState({ loading: false, data: null, error: getCustomerPortalErrorMessage(error, 'el ingreso') });
      });
    return () => controller.abort();
  }, [intakeId, reloadKey]);
  if (state.loading) return <section className="customer-state" role="status" aria-live="polite"><span className="customer-loader" /><p>Cargando ingreso…</p></section>;
  if (state.error) return <section className="customer-state customer-state--error" role="alert"><h1>Ingreso no disponible</h1><p>{state.error}</p><button type="button" onClick={() => setReloadKey((v) => v + 1)}>Reintentar</button></section>;
  const intake = state.data;
  return <section className="customer-page"><nav className="customer-breadcrumb" aria-label="Ruta de navegación"><Link to="/customer/service-history">Historial</Link><span>/</span><strong>Ingreso #{intake.intakeId}</strong></nav>
    <header className="customer-page__heading"><div><span>Ingreso al taller</span><h1>{intake.vehicle.label}</h1></div><span className="customer-status">{intake.visibleStatus}</span></header>
    <article className="customer-card"><dl className="customer-detail-grid"><div><dt>Fecha de ingreso</dt><dd>{formatCustomerDateTime(intake.intakeDate)}</dd></div><div><dt>Kilometraje</dt><dd>{formatCustomerMileage(intake.intakeMileage)}</dd></div><div><dt>Placa</dt><dd>{intake.vehicle.licensePlate}</dd></div><div><dt>Problema reportado</dt><dd>{intake.reportedProblem || 'No registrado'}</dd></div></dl></article>
    <article className="customer-card customer-section"><header className="customer-card__header"><div><h2>Órdenes relacionadas</h2><p>Seguimiento autorizado de este ingreso.</p></div></header>{intake.workOrders.length === 0 ? <div className="customer-state customer-state--inside"><p>Aún no hay una orden visible.</p></div> : <ul className="customer-link-list">{intake.workOrders.map((order) => <li key={order.workOrderId}><div><strong>Orden #{order.workOrderId}</strong><small>{order.visibleStatus}</small></div><Link to={`/customer/work-orders/${order.workOrderId}`}>Ver orden</Link></li>)}</ul>}</article>
  </section>;
}
