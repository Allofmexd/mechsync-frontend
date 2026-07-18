import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';
import { getTechnicians } from '../technicians/techniciansService';
import {
  calculateRevisionAmounts,
  formatRevisionMoney,
  getRevisionErrorMessage,
  unwrapApiData,
  unwrapRevisionPage,
} from '../workOrders/workOrderRevisionUtils';
import {
  createWorkOrderRevision,
  getWorkOrderRevisions,
} from '../workOrders/workOrderRevisionsService';
import { getWorkOrderById, getWorkOrders } from '../workOrders/workOrdersService';
import '../workOrders/workOrderRevisions.css';

let localLineSequence = 0;

function newLine() {
  localLineSequence += 1;
  return {
    localId: `line-${localLineSequence}`,
    nameSnapshot: '',
    descriptionSnapshot: '',
    quantity: '1',
    unitPrice: '0.0000',
    notes: '',
  };
}

function unwrapCollection(response) {
  const data = unwrapApiData(response);
  return Array.isArray(data) ? data : data?.content ?? [];
}

function technicianName(technician) {
  return technician?.fullName
    || [technician?.firstName, technician?.lastName].filter(Boolean).join(' ')
    || `Técnico #${technician?.id}`;
}

function SnapshotLines({ title, type, lines, disabled, onChange }) {
  function addLine() {
    onChange([...lines, newLine()]);
  }

  function updateLine(localId, field, value) {
    onChange(lines.map((line) => (line.localId === localId ? { ...line, [field]: value } : line)));
  }

  function removeLine(localId) {
    onChange(lines.filter((line) => line.localId !== localId));
  }

  return (
    <section className="revision-section">
      <header>
        <div><span>{type === 'service' ? '03' : '04'}</span><h2>{title}</h2></div>
        <button className="admin-button admin-button--secondary" type="button" onClick={addLine} disabled={disabled}>＋ Agregar</button>
      </header>
      <div className="revision-lines-editor">
        {lines.length === 0 ? (
          <p className="revision-empty">Sin líneas. El backend permite crear una revisión con listas vacías y subtotal cero.</p>
        ) : lines.map((line, index) => (
          <article className="revision-line-editor" key={line.localId}>
            <div className="revision-line-editor__heading">
              <strong>{type === 'service' ? 'Servicio' : 'Pieza'} {index + 1}</strong>
              <button type="button" onClick={() => removeLine(line.localId)} disabled={disabled}>Eliminar</button>
            </div>
            <label className="revision-field revision-field--wide">
              <span>Nombre snapshot *</span>
              <input value={line.nameSnapshot} maxLength="150" onChange={(event) => updateLine(line.localId, 'nameSnapshot', event.target.value)} disabled={disabled} required />
            </label>
            <label className="revision-field revision-field--wide">
              <span>Descripción</span>
              <input value={line.descriptionSnapshot} onChange={(event) => updateLine(line.localId, 'descriptionSnapshot', event.target.value)} disabled={disabled} />
            </label>
            <label className="revision-field">
              <span>Cantidad *</span>
              <input type="number" min="0.000001" step="0.000001" value={line.quantity} onChange={(event) => updateLine(line.localId, 'quantity', event.target.value)} disabled={disabled} required />
            </label>
            <label className="revision-field">
              <span>Precio unitario *</span>
              <input type="number" min="0" step="0.0001" value={line.unitPrice} onChange={(event) => updateLine(line.localId, 'unitPrice', event.target.value)} disabled={disabled} required />
            </label>
            <label className="revision-field revision-field--wide">
              <span>Notas</span>
              <input value={line.notes} onChange={(event) => updateLine(line.localId, 'notes', event.target.value)} disabled={disabled} />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function QuotationCreatePage() {
  const [searchParams] = useSearchParams();
  const requestedWorkOrderId = searchParams.get('workOrderId') || '';
  const validRequestedId = /^\d+$/.test(requestedWorkOrderId) && Number(requestedWorkOrderId) > 0
    ? requestedWorkOrderId
    : '';
  const [workOrders, setWorkOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(validRequestedId);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [revisionCount, setRevisionCount] = useState(null);
  const [revisionApiReady, setRevisionApiReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingRevisions, setCheckingRevisions] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [createdRevision, setCreatedRevision] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState([]);
  const [parts, setParts] = useState([]);
  const [form, setForm] = useState({
    estimatedStartDate: '',
    estimatedDeliveryDate: '',
    estimatedHours: '',
    currency: 'MXN',
    applyIva: true,
    ivaRate: '0.160000',
    technicalObservations: '',
    changeReason: '',
  });

  useEffect(() => {
    let active = true;
    async function loadDependencies() {
      setLoading(true);
      setLoadError('');
      try {
        const [ordersResponse, techniciansResponse] = await Promise.all([
          getWorkOrders({ page: 0, size: 100 }),
          getTechnicians(),
        ]);
        let availableOrders = unwrapCollection(ordersResponse);
        if (validRequestedId && !availableOrders.some((order) => String(order.id) === validRequestedId)) {
          try {
            const requestedOrder = unwrapApiData(await getWorkOrderById(validRequestedId));
            availableOrders = [requestedOrder, ...availableOrders];
          } catch (error) {
            if (active) setLoadError(getApiErrorMessage(error, 'La Work Order indicada no está disponible.'));
          }
        }
        if (active) {
          setWorkOrders(availableOrders);
          setTechnicians(unwrapCollection(techniciansResponse));
        }
      } catch (error) {
        if (active) setLoadError(getApiErrorMessage(error, 'No fue posible cargar Work Orders y técnicos.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDependencies();
    return () => { active = false; };
  }, [validRequestedId]);

  const selectedWorkOrder = useMemo(
    () => workOrders.find((order) => String(order.id) === selectedWorkOrderId),
    [selectedWorkOrderId, workOrders],
  );

  useEffect(() => {
    if (!selectedWorkOrder) {
      setSelectedTechnicianId('');
      setRevisionCount(null);
      setRevisionApiReady(false);
      return undefined;
    }
    setSelectedTechnicianId(String(selectedWorkOrder.technicianId ?? ''));
    let active = true;
    async function inspectRevisions() {
      setCheckingRevisions(true);
      setRevisionApiReady(false);
      setSubmitError('');
      try {
        const page = unwrapRevisionPage(await getWorkOrderRevisions(selectedWorkOrder.id, { page: 0, size: 1 }));
        if (active) {
          setRevisionCount(page.totalElements);
          setRevisionApiReady(true);
        }
      } catch (error) {
        if (active) {
          setRevisionCount(null);
          setSubmitError(getRevisionErrorMessage(error, 'No fue posible comprobar las revisiones existentes.'));
        }
      } finally {
        if (active) setCheckingRevisions(false);
      }
    }
    inspectRevisions();
    return () => { active = false; };
  }, [selectedWorkOrder]);

  const amounts = useMemo(
    () => calculateRevisionAmounts(services, parts, form.applyIva, form.ivaRate),
    [form.applyIva, form.ivaRate, parts, services],
  );

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    setCreatedRevision(null);
    const technician = technicians.find((item) => String(item.id) === selectedTechnicianId);
    if (!selectedWorkOrder || !technician || !revisionApiReady) {
      setSubmitError('Selecciona una Work Order y un técnico obtenidos de la API, y espera la validación de revisiones.');
      return;
    }
    if (!amounts.valid) {
      setSubmitError(amounts.message);
      return;
    }
    if (revisionCount > 0 && !form.changeReason.trim()) {
      setSubmitError('El motivo del cambio es obligatorio a partir de la segunda revisión.');
      return;
    }
    if (form.estimatedStartDate && form.estimatedDeliveryDate
        && new Date(form.estimatedDeliveryDate) < new Date(form.estimatedStartDate)) {
      setSubmitError('La entrega estimada no puede ser anterior al inicio estimado.');
      return;
    }
    if (form.estimatedHours && !/^\d+(?:\.\d{1,4})?$/.test(form.estimatedHours)) {
      setSubmitError('Las horas estimadas deben ser no negativas y tener máximo 4 decimales.');
      return;
    }
    const invalidLine = [...services, ...parts].some((line) => !line.nameSnapshot.trim());
    if (invalidLine) {
      setSubmitError('Cada línea personalizada requiere un nombre snapshot.');
      return;
    }

    let amountIndex = 0;
    const mapLine = (line, index) => {
      const payload = {
        lineNumber: index + 1,
        nameSnapshot: line.nameSnapshot.trim(),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineSubtotal: amounts.lineSubtotals[amountIndex],
      };
      amountIndex += 1;
      if (line.descriptionSnapshot.trim()) payload.descriptionSnapshot = line.descriptionSnapshot.trim();
      if (line.notes.trim()) payload.notes = line.notes.trim();
      return payload;
    };
    const payload = {
      technicianId: Number(technician.id),
      currency: form.currency,
      applyIva: form.applyIva,
      ivaRate: amounts.ivaRate,
      subtotalAmount: amounts.subtotalAmount,
      ivaAmount: amounts.ivaAmount,
      totalAmount: amounts.totalAmount,
      services: services.map(mapLine),
      parts: parts.map(mapLine),
    };
    ['estimatedStartDate', 'estimatedDeliveryDate', 'estimatedHours', 'technicalObservations', 'changeReason']
      .forEach((field) => {
        const value = String(form[field] ?? '').trim();
        if (value) payload[field] = value;
      });

    setSubmitting(true);
    try {
      const revision = unwrapApiData(await createWorkOrderRevision(selectedWorkOrder.id, payload));
      setCreatedRevision(revision);
      setRevisionCount((current) => (current ?? 0) + 1);
    } catch (error) {
      setSubmitError(getRevisionErrorMessage(error, 'No fue posible crear la cotización.'));
    } finally {
      setSubmitting(false);
    }
  }

  const blocked = loading || checkingRevisions || submitting || !selectedWorkOrder
    || !revisionApiReady || technicians.length === 0 || !amounts.valid;

  return (
    <section className="revision-create-page">
      <div className="admin-breadcrumb"><Link to="/admin/work-orders">Órdenes de servicio</Link><span>›</span><strong>Nueva cotización</strong></div>
      <div className="work-orders-heading">
        <div><p className="admin-eyebrow">Cotización versionada</p><h1>Nueva cotización</h1><p>Crea una revisión inmutable y respaldada por la API real.</p></div>
        <span className={revisionApiReady ? 'work-order-integration' : 'work-order-integration work-order-integration--blocked'}>{checkingRevisions ? 'Validando API' : revisionApiReady ? 'API disponible' : 'Requiere migración/API'}</span>
      </div>

      {loadError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{loadError}</p></div>}
      {submitError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{submitError}</p></div>}
      {createdRevision && <div className="admin-alert admin-alert--success" role="status"><span>✓</span><p>Cotización creada realmente como revisión {createdRevision.revisionNumber}.</p><Link to={`/admin/work-orders/${selectedWorkOrder.id}/revisions/${createdRevision.id}`}>Ver revisión</Link></div>}
      {!loading && workOrders.length === 0 && <div className="admin-alert work-order-info" role="status"><span>i</span><p>No hay Work Orders disponibles. Crea una orden antes de cotizar.</p></div>}

      <form className="revision-form" onSubmit={handleSubmit}>
        <div className="revision-form__main">
          <section className="revision-section">
            <header><div><span>01</span><h2>Work Order y técnico</h2></div></header>
            <div className="revision-fields">
              <label className="revision-field revision-field--wide"><span>Work Order *</span><select value={selectedWorkOrderId} onChange={(event) => setSelectedWorkOrderId(event.target.value)} disabled={loading || submitting} required><option value="">Selecciona una Work Order</option>{workOrders.map((order) => <option key={order.id} value={order.id}>OT-{order.id} · Ingreso ING-{order.vehicleIntakeId}</option>)}</select></label>
              <label className="revision-field"><span>Técnico *</span><select value={selectedTechnicianId} onChange={(event) => setSelectedTechnicianId(event.target.value)} disabled={loading || submitting || technicians.length === 0} required><option value="">Selecciona un técnico</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technicianName(technician)}</option>)}</select></label>
              <label className="revision-field"><span>Moneda</span><input value={form.currency} readOnly aria-readonly="true" /></label>
              {revisionCount !== null && <p className="revision-selection-note">Revisiones existentes: <strong>{revisionCount}</strong>. {revisionCount > 0 ? 'La nueva cotización reemplazará la revisión vigente según el workflow.' : 'Esta será la primera revisión.'}</p>}
            </div>
          </section>

          <section className="revision-section">
            <header><div><span>02</span><h2>Planeación</h2></div></header>
            <div className="revision-fields">
              <label className="revision-field"><span>Inicio estimado</span><input type="datetime-local" value={form.estimatedStartDate} onChange={(event) => updateForm('estimatedStartDate', event.target.value)} disabled={submitting} /></label>
              <label className="revision-field"><span>Entrega estimada</span><input type="datetime-local" value={form.estimatedDeliveryDate} onChange={(event) => updateForm('estimatedDeliveryDate', event.target.value)} disabled={submitting} /></label>
              <label className="revision-field"><span>Horas estimadas</span><input type="number" min="0" step="0.0001" value={form.estimatedHours} onChange={(event) => updateForm('estimatedHours', event.target.value)} disabled={submitting} /></label>
              <label className="revision-field revision-field--wide"><span>Observaciones técnicas</span><textarea value={form.technicalObservations} onChange={(event) => updateForm('technicalObservations', event.target.value)} disabled={submitting} /></label>
              {revisionCount > 0 && <label className="revision-field revision-field--wide"><span>Motivo del cambio *</span><textarea maxLength="500" value={form.changeReason} onChange={(event) => updateForm('changeReason', event.target.value)} disabled={submitting} required /></label>}
            </div>
          </section>

          <div className="admin-alert work-order-info" role="status"><span>i</span><p>Los catálogos productivos de servicios y piezas siguen pendientes. Puedes capturar snapshots personalizados sin IDs o dejar las listas vacías; no se inventan identificadores.</p></div>
          <SnapshotLines title="Servicios snapshot" type="service" lines={services} onChange={setServices} disabled={submitting} />
          <SnapshotLines title="Piezas snapshot" type="part" lines={parts} onChange={setParts} disabled={submitting} />
        </div>

        <aside className="revision-totals">
          <h2>Resumen financiero</h2>
          <p>Cálculo visual con decimales normalizados. El backend vuelve a calcular y es la fuente de verdad.</p>
          <label className="revision-checkbox"><input type="checkbox" checked={form.applyIva} onChange={(event) => updateForm('applyIva', event.target.checked)} disabled={submitting} /><span>Aplicar IVA</span></label>
          <label className="revision-field"><span>Tasa IVA decimal</span><input type="number" min="0.000001" step="0.000001" value={form.ivaRate} onChange={(event) => updateForm('ivaRate', event.target.value)} disabled={!form.applyIva || submitting} /></label>
          {!amounts.valid ? <p className="revision-calculation-error">{amounts.message}</p> : <dl><div><dt>Subtotal</dt><dd>{formatRevisionMoney(amounts.subtotalAmount)}</dd></div><div><dt>IVA</dt><dd>{formatRevisionMoney(amounts.ivaAmount)}</dd></div><div className="revision-total"><dt>Total</dt><dd>{formatRevisionMoney(amounts.totalAmount)}</dd></div></dl>}
          <button className="admin-button admin-button--primary" type="submit" disabled={blocked}>{submitting ? 'Creando revisión...' : 'Crear cotización'}</button>
          <Link className="admin-button admin-button--secondary" to={selectedWorkOrder ? `/admin/work-orders/${selectedWorkOrder.id}` : '/admin/work-orders'}>Cancelar</Link>
        </aside>
      </form>
    </section>
  );
}
