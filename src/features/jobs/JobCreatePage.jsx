import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTechnicians } from '../technicians/techniciansService';
import { getFinalApprovedWorkOrderRevision } from '../workOrders/workOrderRevisionsService';
import { getWorkOrders } from '../workOrders/workOrdersService';
import { createJob } from './jobsService';
import {
  formatJobMoney,
  getJobErrorMessage,
  technicianName,
  unwrapApiData,
} from './jobUtils';
import './jobs.css';

function unwrapCollection(response) {
  const data = unwrapApiData(response);
  return Array.isArray(data) ? data : data?.content ?? [];
}

function normalizeLocalDateTime(value) {
  if (!value) return undefined;
  return value.length === 16 ? `${value}:00` : value;
}

export default function JobCreatePage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [workOrderId, setWorkOrderId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [approvedRevision, setApprovedRevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingRevision, setCheckingRevision] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [revisionMessage, setRevisionMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [createdJob, setCreatedJob] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadFormData() {
      setLoading(true);
      setLoadError('');
      try {
        const [ordersResponse, techniciansResponse] = await Promise.all([
          getWorkOrders({ page: 0, size: 100 }),
          getTechnicians(),
        ]);
        if (active) {
          setWorkOrders(unwrapCollection(ordersResponse));
          setTechnicians(unwrapCollection(techniciansResponse));
        }
      } catch (requestError) {
        if (active) setLoadError(getJobErrorMessage(requestError, 'cargar los datos para crear el trabajo'));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadFormData();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setApprovedRevision(null);
    setRevisionMessage('');
    setSubmitError('');
    setCreatedJob(null);

    if (!workOrderId) return () => { active = false; };

    async function loadApprovedRevision() {
      setCheckingRevision(true);
      try {
        const revision = unwrapApiData(await getFinalApprovedWorkOrderRevision(workOrderId));
        if (!active) return;
        if (revision?.status !== 'APPROVED') {
          setRevisionMessage('La revisión final devuelta por la API no está aprobada y no puede originar un trabajo.');
          return;
        }
        setApprovedRevision(revision);
      } catch (requestError) {
        if (!active) return;
        if (requestError?.status === 404) {
          setRevisionMessage('No hay cotizaciones aprobadas disponibles para crear un trabajo.');
        } else {
          setRevisionMessage(getJobErrorMessage(requestError, 'consultar la cotización final aprobada'));
        }
      } finally {
        if (active) setCheckingRevision(false);
      }
    }

    loadApprovedRevision();
    return () => { active = false; };
  }, [workOrderId]);

  const selectedWorkOrder = useMemo(
    () => workOrders.find((workOrder) => String(workOrder.id) === workOrderId),
    [workOrders, workOrderId],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    setCreatedJob(null);

    if (!selectedWorkOrder || !approvedRevision) {
      setSubmitError('Selecciona una orden que tenga una cotización final aprobada.');
      return;
    }
    const selectedTechnician = technicians.find((technician) => String(technician.id) === technicianId);
    if (!selectedTechnician) {
      setSubmitError('Selecciona un técnico disponible desde la API.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const scheduledStartDate = normalizeLocalDateTime(String(formData.get('scheduledStartDate') || '').trim());
    const notes = String(formData.get('notes') || '').trim();
    const payload = {
      workOrderId: Number(selectedWorkOrder.id),
      initialApprovedRevisionId: Number(approvedRevision.id),
      technicianId: Number(selectedTechnician.id),
    };
    if (scheduledStartDate) payload.scheduledStartDate = scheduledStartDate;
    if (notes) payload.notes = notes;

    setSubmitting(true);
    try {
      setCreatedJob(unwrapApiData(await createJob(payload)));
    } catch (requestError) {
      setSubmitError(getJobErrorMessage(requestError, 'crear el trabajo'));
    } finally {
      setSubmitting(false);
    }
  }

  const unavailable = loading || Boolean(loadError) || workOrders.length === 0 || technicians.length === 0;

  return (
    <section className="job-create-page">
      <div className="admin-breadcrumb"><Link to="/admin/jobs">Trabajos realizados</Link><span>›</span><strong>Nuevo trabajo</strong></div>
      <div className="jobs-heading">
        <div>
          <p className="admin-eyebrow">Inicio de ejecución</p>
          <h1>Crear trabajo</h1>
          <p>La cotización final aprobada autoriza el Job; sus snapshots no se modifican.</p>
        </div>
      </div>

      {loadError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{loadError}</p></div>}
      {!loading && !loadError && workOrders.length === 0 && <div className="admin-alert jobs-info" role="status"><span>i</span><p>No hay cotizaciones aprobadas disponibles para crear un trabajo. Primero registra una orden y aprueba su revisión final.</p></div>}
      {!loading && !loadError && technicians.length === 0 && <div className="admin-alert jobs-info" role="status"><span>i</span><p>No hay técnicos disponibles. El contrato desplegado requiere technicianId para crear un trabajo.</p></div>}
      {submitError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{submitError}</p></div>}
      {createdJob && <div className="admin-alert admin-alert--success" role="status"><span>✓</span><p>Trabajo creado correctamente.</p><Link to={`/admin/jobs/${createdJob.id}`}>Ver JOB-{createdJob.id}</Link></div>}

      <form className="job-create-form" onSubmit={handleSubmit}>
        <section className="job-form-card">
          <header><span>01</span><div><h2>Orden y autorización</h2><p>La selección consulta la revisión final aprobada directamente en la API.</p></div></header>
          <label className="job-field">
            <span>Orden de trabajo *</span>
            <select value={workOrderId} onChange={(event) => setWorkOrderId(event.target.value)} disabled={unavailable || submitting} required>
              <option value="">Selecciona una orden</option>
              {workOrders.map((workOrder) => <option key={workOrder.id} value={workOrder.id}>OT-{workOrder.id} · Ingreso #{workOrder.vehicleIntakeId}</option>)}
            </select>
          </label>

          {checkingRevision && <div className="job-inline-state">Consultando cotización final aprobada...</div>}
          {!checkingRevision && revisionMessage && <div className="admin-alert jobs-info" role="status"><span>i</span><p>{revisionMessage}</p></div>}
          {approvedRevision && (
            <div className="job-approved-revision">
              <div><span>Revisión autorizada</span><strong>Revisión #{approvedRevision.revisionNumber}</strong></div>
              <div><span>Estado</span><strong>{approvedRevision.status}</strong></div>
              <div><span>Total cotizado</span><strong>{formatJobMoney(approvedRevision.totalAmount)}</strong></div>
              <Link to={`/admin/work-orders/${selectedWorkOrder.id}/revisions/${approvedRevision.id}`}>Ver cotización</Link>
            </div>
          )}
        </section>

        <section className="job-form-card">
          <header><span>02</span><div><h2>Asignación y agenda</h2><p>El trabajo iniciará en estado PENDIENTE.</p></div></header>
          <div className="job-form-grid">
            <label className="job-field"><span>Técnico *</span><select value={technicianId} onChange={(event) => setTechnicianId(event.target.value)} disabled={loading || technicians.length === 0 || submitting} required><option value="">Selecciona un técnico</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technicianName(technician, technician.id)}</option>)}</select></label>
            <label className="job-field"><span>Inicio programado <small>(opcional)</small></span><input type="datetime-local" name="scheduledStartDate" disabled={submitting} /></label>
            <label className="job-field job-field--full"><span>Notas <small>(opcional)</small></span><textarea name="notes" rows="5" maxLength="1000" placeholder="Indicaciones para ejecutar el trabajo autorizado" disabled={submitting} /></label>
          </div>
        </section>

        <div className="job-form-actions">
          <Link className="admin-button admin-button--secondary" to="/admin/jobs">Cancelar</Link>
          <button className="admin-button admin-button--primary" type="submit" disabled={unavailable || checkingRevision || !approvedRevision || submitting}>{submitting ? 'Creando trabajo...' : 'Crear trabajo'}</button>
        </div>
      </form>
    </section>
  );
}
