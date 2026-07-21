import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAdminApiErrorMessage, getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getWorkOrderStatuses } from '../catalogs/catalogsService';
import { getTechnicians } from '../technicians/techniciansService';
import { getVehicleIntakeById } from '../vehicleIntakes/vehicleIntakesService';
import { getVehicleById } from '../vehicles/vehiclesService';
import WorkOrderRevisionsPanel from './WorkOrderRevisionsPanel';
import { deleteWorkOrder, getWorkOrderById, updateWorkOrder } from './workOrdersService';
import '../../shared/components/crudActions.css';
import './workOrders.css';

function unwrap(response) {
  return response?.data ?? response;
}

function unwrapCollection(response) {
  const data = unwrap(response);
  return Array.isArray(data) ? data : data?.content ?? [];
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

function dateTimeInputValue(value) {
  return value ? String(value).slice(0, 16) : '';
}

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [intake, setIntake] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleUpdate(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      technicianId: Number(data.get('technicianId')),
      workOrderDate: String(data.get('workOrderDate') || '').trim() || null,
      estimatedStartDate: String(data.get('estimatedStartDate') || '').trim() || null,
      estimatedDeliveryDate: String(data.get('estimatedDeliveryDate') || '').trim() || null,
      estimatedHours: String(data.get('estimatedHours') || '').trim() || null,
      estimatedSubtotal: String(data.get('estimatedSubtotal') || '').trim(),
      estimatedIva: String(data.get('estimatedIva') || '').trim(),
      estimatedTotal: String(data.get('estimatedTotal') || '').trim(),
      technicalObservations: String(data.get('technicalObservations') || '').trim() || null,
      statusId: Number(data.get('statusId')),
    };
    if (payload.estimatedStartDate && payload.estimatedDeliveryDate
      && new Date(payload.estimatedDeliveryDate) < new Date(payload.estimatedStartDate)) {
      setActionError('La entrega estimada no puede ser anterior al inicio.');
      return;
    }
    setWorking('update'); setActionError(''); setSuccess('');
    try { const response = await updateWorkOrder(id, payload); setOrder(unwrap(response)); setEditing(false); setSuccess('Work Order actualizada correctamente. Las revisiones versionadas no se modificaron.'); }
    catch (requestError) { setActionError(getAdminApiErrorMessage(requestError, 'actualizar la Work Order')); }
    finally { setWorking(''); }
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar esta Work Order? La API bloqueará el borrado si tiene revisiones, líneas o Jobs dependientes.')) return;
    setWorking('delete'); setActionError(''); setSuccess('');
    try { await deleteWorkOrder(id); navigate('/admin/work-orders', { replace: true }); }
    catch (requestError) { setActionError(getAdminApiErrorMessage(requestError, 'eliminar la Work Order')); setWorking(''); }
  }

  useEffect(() => {
    let active = true;
    async function loadDetail() {
      try {
        const [orderResponse, statusesResponse, techniciansResponse] = await Promise.all([
          getWorkOrderById(id),
          getWorkOrderStatuses(),
          getTechnicians(),
        ]);
        const nextOrder = unwrap(orderResponse);
        let nextIntake = null;
        let nextVehicle = null;
        try {
          nextIntake = unwrap(await getVehicleIntakeById(nextOrder.vehicleIntakeId));
        } catch {
          nextIntake = null;
        }
        if (nextIntake?.vehicleId) {
          try {
            nextVehicle = unwrap(await getVehicleById(nextIntake.vehicleId));
          } catch {
            nextVehicle = null;
          }
        }
        if (active) {
          setOrder(nextOrder);
          setIntake(nextIntake);
          setVehicle(nextVehicle);
          setStatuses(unwrapCollection(statusesResponse));
          setTechnicians(unwrapCollection(techniciansResponse));
        }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'No fue posible cargar la orden solicitada.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDetail();
    return () => { active = false; };
  }, [id]);

  const status = useMemo(() => statuses.find((item) => String(item.id) === String(order?.statusId)), [order?.statusId, statuses]);
  const technician = useMemo(() => technicians.find((item) => String(item.id) === String(order?.technicianId)), [order?.technicianId, technicians]);
  const technicianLabel = technician?.fullName || [technician?.firstName, technician?.lastName].filter(Boolean).join(' ') || (order?.technicianId ? `Técnico #${order.technicianId}` : 'Dato no disponible');

  if (loading) return <div className="work-orders-state">Cargando orden de servicio...</div>;
  if (error) return <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>;
  if (!order) return <div className="work-orders-state">Orden no encontrada.</div>;

  return (
    <section className="work-order-detail-page">
      <div className="admin-breadcrumb"><Link to="/admin/work-orders">Órdenes de servicio</Link><span>›</span><strong>OT-{order.id}</strong></div>
      <div className="work-orders-heading">
        <div><p className="admin-eyebrow">Orden OT-{order.id}</p><h1>Orden de servicio</h1><p>Detalle de planificación. No representa un Job o trabajo ejecutado.</p></div>
        <div className="crud-heading-actions"><span className="work-order-status work-order-status--large">{status?.name || `Estado #${order.statusId}`}</span><button className="admin-button admin-button--secondary" type="button" onClick={() => setEditing((value) => !value)} disabled={Boolean(working)}>Editar v1</button><button className="admin-button crud-button--danger" type="button" onClick={handleDelete} disabled={Boolean(working)}>{working === 'delete' ? 'Eliminando...' : 'Eliminar'}</button></div>
      </div>

      {actionError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{actionError}</p></div>}
      {success && <div className="admin-alert admin-alert--success" role="status"><span>✓</span><p>{success}</p></div>}
      {editing && <form className="crud-editor" onSubmit={handleUpdate}><header><h2>Editar Work Order v1</h2><p>Este formulario actualiza la proyección legacy. Para cualquier cambio de cotización crea una nueva revisión inmutable.</p></header><div className="crud-fields"><label className="crud-field"><span>Técnico *</span><select name="technicianId" defaultValue={order.technicianId} required disabled={Boolean(working)}>{technicians.map((item) => <option key={item.id} value={item.id}>{item.fullName || `${item.firstName} ${item.lastName}`}</option>)}</select></label><label className="crud-field"><span>Estado *</span><select name="statusId" defaultValue={order.statusId} required disabled={Boolean(working)}>{statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="crud-field"><span>Fecha de orden</span><input name="workOrderDate" type="datetime-local" defaultValue={dateTimeInputValue(order.workOrderDate)} disabled={Boolean(working)} /></label><label className="crud-field"><span>Horas estimadas</span><input name="estimatedHours" type="number" min="0" step="0.01" defaultValue={order.estimatedHours ?? ''} disabled={Boolean(working)} /></label><label className="crud-field"><span>Inicio estimado</span><input name="estimatedStartDate" type="datetime-local" defaultValue={dateTimeInputValue(order.estimatedStartDate)} disabled={Boolean(working)} /></label><label className="crud-field"><span>Entrega estimada</span><input name="estimatedDeliveryDate" type="datetime-local" defaultValue={dateTimeInputValue(order.estimatedDeliveryDate)} disabled={Boolean(working)} /></label><label className="crud-field"><span>Subtotal v1 *</span><input name="estimatedSubtotal" type="number" min="0" step="0.01" defaultValue={order.estimatedSubtotal} required disabled={Boolean(working)} /></label><label className="crud-field"><span>IVA v1 *</span><input name="estimatedIva" type="number" min="0" step="0.01" defaultValue={order.estimatedIva} required disabled={Boolean(working)} /></label><label className="crud-field"><span>Total v1 *</span><input name="estimatedTotal" type="number" min="0" step="0.01" defaultValue={order.estimatedTotal} required disabled={Boolean(working)} /></label><label className="crud-field crud-field--wide"><span>Observaciones técnicas</span><textarea name="technicalObservations" defaultValue={order.technicalObservations ?? ''} disabled={Boolean(working)} /></label></div><footer><button className="admin-button admin-button--primary" type="submit" disabled={Boolean(working)}>{working === 'update' ? 'Guardando...' : 'Guardar Work Order'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setEditing(false)} disabled={Boolean(working)}>Cancelar</button></footer></form>}

      <div className="work-order-detail-layout">
        <div className="work-order-detail-main">
          <section className="work-order-detail-card work-order-identity">
            <div><span>Vehículo</span><strong>{vehicle ? `${vehicle.brand} ${vehicle.model}` : intake ? `Vehículo #${intake.vehicleId}` : 'Dato no disponible'}</strong><small>{vehicle?.licensePlate || 'Placa no disponible'}</small></div>
            <div><span>Ingreso relacionado</span><Link to={`/admin/vehicle-intakes/${order.vehicleIntakeId}`}>ING-{order.vehicleIntakeId}</Link><small>{intake?.reportedProblem || 'Problema no disponible'}</small></div>
            <div><span>Técnico asignado</span><strong>{technicianLabel}</strong><small>{technician?.specialtyName || 'Especialidad no disponible'}</small></div>
          </section>

          <section className="work-order-detail-card"><header><h2>Observaciones técnicas</h2></header><p>{order.technicalObservations || 'Sin observaciones técnicas registradas.'}</p></section>

          <WorkOrderRevisionsPanel workOrderId={id} />

          <section className="work-order-detail-card work-order-lines-pending">
            <header><h2>Adjuntos y evidencia</h2><span>Fuera de esta versión</span></header>
            <p>No existe un endpoint documentado de archivos o reportes para esta orden.</p>
          </section>
        </div>

        <aside className="work-order-detail-side">
          <section><h2>Programación</h2><dl><div><dt>Fecha de orden</dt><dd>{formatDate(order.workOrderDate)}</dd></div><div><dt>Inicio estimado</dt><dd>{formatDate(order.estimatedStartDate)}</dd></div><div><dt>Entrega estimada</dt><dd>{formatDate(order.estimatedDeliveryDate)}</dd></div><div><dt>Horas estimadas</dt><dd>{order.estimatedHours ?? 'Dato no disponible'}</dd></div></dl></section>
          <section><h2>Resumen financiero</h2><dl><div><dt>Subtotal</dt><dd>{formatMoney(order.estimatedSubtotal)}</dd></div><div><dt>IVA</dt><dd>{formatMoney(order.estimatedIva)}</dd></div><div className="work-order-total"><dt>Total</dt><dd>{formatMoney(order.estimatedTotal)}</dd></div></dl></section>
          <section><h2>Auditoría</h2><dl><div><dt>Creada</dt><dd>{formatDate(order.createdAt)}</dd></div><div><dt>Actualizada</dt><dd>{formatDate(order.updatedAt)}</dd></div></dl></section>
        </aside>
      </div>
    </section>
  );
}
