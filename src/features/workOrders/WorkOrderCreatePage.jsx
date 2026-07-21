import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getWorkOrderStatuses } from '../catalogs/catalogsService';
import { getTechnicians } from '../technicians/techniciansService';
import { getVehicleIntakeById, getVehicleIntakes } from '../vehicleIntakes/vehicleIntakesService';
import { createWorkOrder } from './workOrdersService';
import './workOrders.css';

function unwrap(response) {
  return response?.data ?? response;
}

function unwrapCollection(response) {
  const data = unwrap(response);
  return Array.isArray(data) ? data : data?.content ?? [];
}

function technicianName(technician) {
  return technician.fullName
    || [technician.firstName, technician.lastName].filter(Boolean).join(' ')
    || `Técnico #${technician.id}`;
}

function requestErrorMessage(error) {
  if (error?.status === 400) return getApiErrorMessage(error, 'Revisa importes, fechas y campos obligatorios.');
  if (error?.status === 404) return 'El ingreso, técnico o estado seleccionado ya no está disponible.';
  if (error?.status === 409) return getApiErrorMessage(error, 'Existe un conflicto al crear la orden.');
  return getApiErrorMessage(error, 'No fue posible crear la orden de trabajo.');
}

export default function WorkOrderCreatePage() {
  const [searchParams] = useSearchParams();
  const requestedIntakeId = searchParams.get('vehicleIntakeId') || '';
  const validRequestedIntakeId = /^\d+$/.test(requestedIntakeId) && Number(requestedIntakeId) > 0 ? requestedIntakeId : '';
  const [intakes, setIntakes] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedIntakeId, setSelectedIntakeId] = useState(validRequestedIntakeId);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [selectedStatusId, setSelectedStatusId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [selectionNotice, setSelectionNotice] = useState(
    requestedIntakeId && !validRequestedIntakeId
      ? 'El vehicleIntakeId recibido no es válido. Selecciona un ingreso de la lista.'
      : '',
  );

  useEffect(() => {
    setSelectedIntakeId(validRequestedIntakeId);
    setSelectionNotice(
      requestedIntakeId && !validRequestedIntakeId
        ? 'El vehicleIntakeId recibido no es válido. Selecciona un ingreso de la lista.'
        : '',
    );
  }, [requestedIntakeId, validRequestedIntakeId]);

  useEffect(() => {
    let active = true;
    async function loadFormData() {
      setLoading(true);
      setLoadError('');
      try {
        const [intakesResponse, statusesResponse, techniciansResponse] = await Promise.all([
          getVehicleIntakes({ page: 0, size: 100 }),
          getWorkOrderStatuses(),
          getTechnicians(),
        ]);
        let availableIntakes = unwrapCollection(intakesResponse);

        if (validRequestedIntakeId && !availableIntakes.some((item) => String(item.id) === validRequestedIntakeId)) {
          try {
            const requestedIntake = unwrap(await getVehicleIntakeById(validRequestedIntakeId));
            availableIntakes = [requestedIntake, ...availableIntakes];
          } catch (requestError) {
            if (active) {
              setSelectedIntakeId('');
              setSelectionNotice(getApiErrorMessage(requestError, 'El ingreso precargado no está disponible. Selecciona otro ingreso.'));
            }
          }
        }

        if (active) {
          setIntakes(availableIntakes);
          setStatuses(unwrapCollection(statusesResponse));
          setTechnicians(unwrapCollection(techniciansResponse));
        }
      } catch (requestError) {
        if (active) setLoadError(getApiErrorMessage(requestError, 'No fue posible cargar los datos necesarios para crear la orden.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadFormData();
    return () => { active = false; };
  }, [validRequestedIntakeId]);

  const selectedIntake = useMemo(() => intakes.find((item) => String(item.id) === selectedIntakeId), [intakes, selectedIntakeId]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitError('');
    setCreatedOrder(null);

    const technician = technicians.find((item) => String(item.id) === selectedTechnicianId);
    const status = statuses.find((item) => String(item.id) === selectedStatusId);
    if (!selectedIntake || !technician || !status) {
      setSubmitError('Selecciona un ingreso, un técnico y un estado obtenidos desde la API.');
      return;
    }

    const formData = new FormData(form);
    const startDate = String(formData.get('estimatedStartDate') || '').trim();
    const deliveryDate = String(formData.get('estimatedDeliveryDate') || '').trim();
    if (startDate && deliveryDate && new Date(deliveryDate) < new Date(startDate)) {
      setSubmitError('La fecha estimada de entrega no puede ser anterior al inicio.');
      return;
    }

    const amountValues = ['estimatedSubtotal', 'estimatedIva', 'estimatedTotal']
      .map((field) => String(formData.get(field) ?? '').trim());
    const [subtotal, iva, total] = amountValues.map(Number);
    if (amountValues.some((value) => !value) || [subtotal, iva, total].some((value) => !Number.isFinite(value) || value < 0)) {
      setSubmitError('Subtotal, IVA y total son obligatorios y deben ser importes no negativos.');
      return;
    }

    const payload = {
      vehicleIntakeId: Number(selectedIntake.id),
      technicianId: Number(technician.id),
      estimatedSubtotal: subtotal,
      estimatedIva: iva,
      estimatedTotal: total,
      statusId: Number(status.id),
    };
    const optionalFields = ['workOrderDate', 'estimatedStartDate', 'estimatedDeliveryDate', 'technicalObservations'];
    optionalFields.forEach((field) => {
      const value = String(formData.get(field) || '').trim();
      if (value) payload[field] = value;
    });
    const estimatedHours = String(formData.get('estimatedHours') || '').trim();
    if (estimatedHours) {
      const numericHours = Number(estimatedHours);
      if (!Number.isFinite(numericHours) || numericHours < 0) {
        setSubmitError('Las horas estimadas deben ser un número no negativo.');
        return;
      }
      payload.estimatedHours = numericHours;
    }

    setSubmitting(true);
    try {
      setCreatedOrder(unwrap(await createWorkOrder(payload)));
      form.reset();
      setSelectedTechnicianId('');
      setSelectedStatusId('');
    } catch (requestError) {
      setSubmitError(requestErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  const integrationBlocked = loading || Boolean(loadError) || intakes.length === 0 || statuses.length === 0 || technicians.length === 0;

  return (
    <section className="work-order-create-page">
      <div className="admin-breadcrumb"><Link to="/admin/work-orders">Órdenes de servicio</Link><span>›</span><strong>Crear orden</strong></div>
      <div className="work-orders-heading">
        <div><p className="admin-eyebrow">Planificación del servicio</p><h1>Crear orden de trabajo</h1><p>Registra la planificación y estimación financiera respaldada por Work Orders.</p></div>
        <span className={integrationBlocked ? 'work-order-integration work-order-integration--blocked' : 'work-order-integration'}>{loading ? 'Cargando datos' : integrationBlocked ? 'Requiere datos de API' : 'Integración disponible'}</span>
      </div>

      {loadError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{loadError}</p></div>}
      {selectionNotice && <div className="admin-alert work-order-info" role="status"><span>i</span><p>{selectionNotice}</p></div>}
      {!loading && !loadError && technicians.length === 0 && <div className="admin-alert work-order-info" role="status"><span>i</span><p>No hay técnicos registrados. El backend exige technicianId, por lo que la creación permanecerá bloqueada hasta registrar al menos uno.</p></div>}
      {!loading && !loadError && statuses.length === 0 && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>No hay estados WORK_ORDERS disponibles; no se enviará un ID hardcodeado.</p></div>}
      {!loading && !loadError && intakes.length === 0 && <div className="admin-alert work-order-info" role="status"><span>i</span><p>No hay ingresos disponibles. Crea un ingreso antes de generar una orden.</p></div>}
      {submitError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{submitError}</p></div>}
      {createdOrder && <div className="admin-alert admin-alert--success" role="status"><span>✓</span><p>Orden de trabajo creada correctamente.</p><Link to={`/admin/work-orders/${createdOrder.id}`}>Ver orden OT-{createdOrder.id}</Link></div>}

      <form className="work-order-form" onSubmit={handleSubmit}>
        <div className="work-order-form__main">
          <section className="work-order-section">
            <header><span>01</span><h2>Ingreso y asignación</h2></header>
            <div className="work-order-fields">
              <label className="work-order-field work-order-field--full"><span>Ingreso de vehículo *</span><select value={selectedIntakeId} onChange={(event) => setSelectedIntakeId(event.target.value)} disabled={loading || submitting} required><option value="">Selecciona un ingreso</option>{intakes.map((intake) => <option key={intake.id} value={intake.id}>ING-{intake.id} · Vehículo #{intake.vehicleId} · {intake.reportedProblem}</option>)}</select></label>
              <label className="work-order-field"><span>Técnico *</span><select value={selectedTechnicianId} onChange={(event) => setSelectedTechnicianId(event.target.value)} disabled={loading || technicians.length === 0 || submitting} required><option value="">Selecciona un técnico</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technicianName(technician)}</option>)}</select></label>
              <label className="work-order-field"><span>Estado *</span><select value={selectedStatusId} onChange={(event) => setSelectedStatusId(event.target.value)} disabled={loading || statuses.length === 0 || submitting} required><option value="">Selecciona un estado</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name} · {status.code}</option>)}</select></label>
              {selectedIntake && <div className="work-order-intake-preview"><span>Problema reportado</span><strong>{selectedIntake.reportedProblem}</strong><small>Vehículo #{selectedIntake.vehicleId}</small></div>}
            </div>
          </section>

          <section className="work-order-section">
            <header><span>02</span><h2>Planificación</h2></header>
            <div className="work-order-fields">
              <label className="work-order-field"><span>Fecha de orden <small>(opcional)</small></span><input name="workOrderDate" type="datetime-local" disabled={submitting} /></label>
              <label className="work-order-field"><span>Horas estimadas <small>(opcional)</small></span><input name="estimatedHours" type="number" min="0" step="0.01" disabled={submitting} /></label>
              <label className="work-order-field"><span>Inicio estimado <small>(opcional)</small></span><input name="estimatedStartDate" type="datetime-local" disabled={submitting} /></label>
              <label className="work-order-field"><span>Entrega estimada <small>(opcional)</small></span><input name="estimatedDeliveryDate" type="datetime-local" disabled={submitting} /></label>
              <label className="work-order-field work-order-field--full"><span>Observaciones técnicas <small>(opcional)</small></span><textarea name="technicalObservations" rows="5" placeholder="Alcance y consideraciones técnicas de la orden" disabled={submitting} /></label>
            </div>
          </section>

          <section className="work-order-section">
            <header><span>03</span><h2>Cotización y partidas</h2></header>
            <div><strong>Se agregan después de guardar la orden</strong><p>Las partidas autorizables se capturan en una revisión de cotización, usando los catálogos reales o snapshots personalizados.</p></div>
          </section>
        </div>

        <aside className="work-order-financial">
          <h2>Resumen financiero</h2>
          <p>El contrato actual exige captura manual. El frontend no inventa cálculos ni reglas de redondeo.</p>
          <label><span>Subtotal estimado *</span><input name="estimatedSubtotal" type="number" min="0" step="0.01" defaultValue="0.00" required disabled={submitting} /></label>
          <label><span>IVA estimado *</span><input name="estimatedIva" type="number" min="0" step="0.01" defaultValue="0.00" required disabled={submitting} /></label>
          <label><span>Total estimado *</span><input name="estimatedTotal" type="number" min="0" step="0.01" defaultValue="0.00" required disabled={submitting} /></label>
          <button className="admin-button admin-button--primary" type="submit" disabled={integrationBlocked || submitting}>{submitting ? 'Guardando...' : 'Guardar orden'}</button>
          <Link className="admin-button admin-button--secondary" to="/admin/work-orders">Cancelar</Link>
        </aside>
      </form>
    </section>
  );
}
