import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getWorkOrderById } from '../workOrders/workOrdersService';
import TechnicianWorkspaceState from './TechnicianWorkspaceState';
import useTechnicianWorkspace from './useTechnicianWorkspace';
import useWorkOrderRelations from './useWorkOrderRelations';
import './technician.css';

function unwrap(response) {
  return response?.data ?? response;
}

function formatDate(value) {
  if (!value) return 'Dato no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dato no disponible';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return 'Dato no disponible';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
}

export default function TechnicianWorkOrderDetailPage() {
  const { currentUser } = useOutletContext();
  const { id } = useParams();
  const workspace = useTechnicianWorkspace(currentUser?.id);
  const assignedOrder = workspace.workOrders.find((item) => String(item.id) === String(id));
  const [order, setOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    let active = true;
    if (!assignedOrder) {
      setOrder(null);
      return () => { active = false; };
    }

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError('');
      try {
        const detail = unwrap(await getWorkOrderById(assignedOrder.id));
        if (active) setOrder(detail);
      } catch (requestError) {
        if (active) setDetailError(getApiErrorMessage(requestError, 'No fue posible cargar el detalle de la orden.'));
      } finally {
        if (active) setDetailLoading(false);
      }
    }

    loadDetail();
    return () => { active = false; };
  }, [assignedOrder?.id]);

  const relationOrders = useMemo(() => (order ? [order] : []), [order]);
  const relations = useWorkOrderRelations(relationOrders);

  if (workspace.loading || workspace.error || !workspace.technician) {
    return <TechnicianWorkspaceState {...workspace} />;
  }
  if (!assignedOrder) {
    return <div className="technician-state technician-state--warning"><strong>Orden no asignada</strong><p>La orden solicitada no está asignada al técnico autenticado y no se mostrará como propia.</p><Link className="admin-button admin-button--secondary" to="/technician/assigned-work-orders">Volver a mis órdenes</Link></div>;
  }
  if (detailLoading || relations.loading) return <div className="technician-state"><span className="technician-loader" /><p>Cargando detalle de la orden...</p></div>;
  if (detailError) return <div className="technician-state technician-state--error"><strong>Error al cargar</strong><p>{detailError}</p></div>;
  if (!order) return <div className="technician-state">Orden no encontrada.</div>;

  const status = workspace.statuses.find((item) => String(item.id) === String(order.statusId));
  const intake = relations.intakes[order.vehicleIntakeId];
  const vehicle = intake ? relations.vehicles[intake.vehicleId] : null;
  const customer = vehicle ? relations.customers[vehicle.customerId] : null;

  return (
    <section className="technician-order-detail-page">
      <div className="technician-breadcrumb"><Link to="/technician">Panel técnico</Link><span>›</span><Link to="/technician/work-orders">Mis órdenes</Link><span>›</span><strong>OT-{order.id}</strong></div>
      <div className="technician-order-detail-heading">
        <div><p className="admin-eyebrow">Orden asignada</p><h1>Folio OT-{order.id}</h1></div>
        <span className="technician-status">{status?.name || `Estado #${order.statusId}`}</span>
      </div>

      {relations.warning && <div className="technician-inline-warning">{relations.warning}</div>}

      <div className="technician-order-detail-actions">
        <button type="button" disabled title="Pendiente de endpoint para observaciones">Agregar observación</button>
        <button type="button" disabled title="Pendiente de endpoint para diagnóstico">Registrar diagnóstico</button>
        <button type="button" disabled title="Pendiente de endpoint para iniciar Job">Iniciar trabajo</button>
      </div>

      <div className="technician-order-detail-layout">
        <div className="technician-order-detail-main">
          <section className="technician-detail-card technician-detail-identity">
            <header><h2>Información del vehículo y cliente</h2></header>
            <dl><div><dt>Cliente</dt><dd>{vehicle?.customerId ? `Cliente #${vehicle.customerId}` : 'Dato no disponible'}</dd></div><div><dt>Dirección</dt><dd>{customer?.address || 'Dato no disponible'}</dd></div><div><dt>Marca / modelo</dt><dd>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Dato no disponible'}</dd></div><div><dt>Año</dt><dd>{vehicle?.year || 'Dato no disponible'}</dd></div><div><dt>Placas</dt><dd>{vehicle?.licensePlate || 'Dato no disponible'}</dd></div><div><dt>VIN</dt><dd>{vehicle?.vin || 'Dato no disponible'}</dd></div></dl>
            <p className="technician-data-gap">El nombre del cliente no está disponible porque Customer no expone los datos de identidad de User al rol TECNICO.</p>
          </section>

          <div className="technician-detail-split">
            <section className="technician-detail-card"><header><h2>Problema reportado</h2></header><p>{intake?.reportedProblem || 'Dato no disponible'}</p></section>
            <section className="technician-detail-card"><header><h2>Observaciones iniciales</h2></header><p>{intake?.initialObservations || 'Sin observaciones registradas.'}</p></section>
          </div>

          <section className="technician-detail-card technician-detail-pending"><header><h2>Servicios y refacciones planeadas</h2><span>Pendiente de API</span></header><p>No existen subrecursos productivos de servicios o piezas para esta Work Order.</p><button className="admin-button admin-button--secondary" type="button" disabled>Solicitar refacción</button></section>
          <section className="technician-detail-card"><header><h2>Observaciones técnicas de la orden</h2></header><p>{order.technicalObservations || 'Sin observaciones técnicas registradas.'}</p></section>
        </div>

        <aside className="technician-order-detail-side">
          <section><h2>Cronograma</h2><dl><div><dt>Fecha de ingreso</dt><dd>{formatDate(intake?.intakeDate)}</dd></div><div><dt>Fecha de orden</dt><dd>{formatDate(order.workOrderDate)}</dd></div><div><dt>Inicio estimado</dt><dd>{formatDate(order.estimatedStartDate)}</dd></div><div><dt>Entrega estimada</dt><dd>{formatDate(order.estimatedDeliveryDate)}</dd></div><div><dt>Horas estimadas</dt><dd>{order.estimatedHours ?? 'Dato no disponible'}</dd></div></dl></section>
          <section><h2>Estimación</h2><dl><div><dt>Subtotal</dt><dd>{formatMoney(order.estimatedSubtotal)}</dd></div><div><dt>IVA</dt><dd>{formatMoney(order.estimatedIva)}</dd></div><div className="technician-detail-total"><dt>Total</dt><dd>{formatMoney(order.estimatedTotal)}</dd></div></dl></section>
          <section className="technician-detail-pending"><h2>Trabajo ejecutado</h2><span>Pendiente de API</span><p>Iniciar, completar y reportar requiere Jobs y Service Reports.</p><button type="button" disabled>Generar reporte</button></section>
        </aside>
      </div>
    </section>
  );
}
