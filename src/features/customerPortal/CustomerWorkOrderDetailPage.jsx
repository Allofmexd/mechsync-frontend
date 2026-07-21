import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCustomerWorkOrder } from './customerPortalService.js';
import { formatCustomerDateTime, formatCustomerQuantity, getCustomerPortalErrorMessage } from './customerPortalUtils.js';

export default function CustomerWorkOrderDetailPage() {
  const { workOrderId } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    getCustomerWorkOrder(workOrderId, { signal: controller.signal }).then((data) => setState({ loading: false, data, error: '' })).catch((error) => { if (error?.name !== 'AbortError') setState({ loading: false, data: null, error: getCustomerPortalErrorMessage(error, 'la orden de trabajo') }); });
    return () => controller.abort();
  }, [workOrderId]);
  if (state.loading) return <section className="customer-state" role="status" aria-live="polite"><span className="customer-loader" /><p>Cargando orden…</p></section>;
  if (state.error) return <section className="customer-state customer-state--error" role="alert"><h1>Orden no disponible</h1><p>{state.error}</p><Link to="/customer/service-history">Volver al historial</Link></section>;
  const order = state.data;
  return <section className="customer-page"><nav className="customer-breadcrumb" aria-label="Ruta de navegación"><Link to={`/customer/service-history/${order.intakeId}`}>Ingreso #{order.intakeId}</Link><span>/</span><strong>Orden #{order.workOrderId}</strong></nav><header className="customer-page__heading"><div><span>Orden de trabajo</span><h1>{order.vehicle.label}</h1></div><span className="customer-status">{order.visibleStatus}</span></header><article className="customer-card"><dl className="customer-detail-grid"><div><dt>Fecha</dt><dd>{formatCustomerDateTime(order.workOrderDate)}</dd></div><div><dt>Inicio estimado</dt><dd>{formatCustomerDateTime(order.estimatedStartDate)}</dd></div><div><dt>Entrega estimada</dt><dd>{formatCustomerDateTime(order.estimatedDeliveryDate)}</dd></div><div><dt>Horas estimadas</dt><dd>{formatCustomerQuantity(order.estimatedHours)}</dd></div><div><dt>Problema reportado</dt><dd>{order.reportedProblem || 'No registrado'}</dd></div></dl></article><nav className="customer-quick-links" aria-label="Recursos relacionados">{order.quotationAvailable && <Link to={`/customer/quotations/${order.workOrderId}`}>Ver cotización</Link>}{order.jobId && <Link to={`/customer/jobs/${order.jobId}`}>Ver trabajo</Link>}</nav></section>;
}
