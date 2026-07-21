import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  formatJobDate,
  formatJobMoney,
  JOB_STATUS_LABELS,
  unwrapApiData,
} from '../jobs/jobUtils';
import {
  getAssignedJobById,
  getAssignedJobParts,
  getAssignedJobServices,
} from './technicianJobsService';
import { getServiceReportByJobId } from './technicianServiceReportsService';
import {
  getTechnicianResourceErrorMessage,
  technicianStatusClass,
} from './technicianResourceUtils';
import './technician.css';

function unwrapLines(response) {
  const data = unwrapApiData(response);
  return Array.isArray(data) ? data : [];
}

function formatQuantity(value) {
  if (value === null || value === undefined || value === '') return 'Dato no disponible';
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(Number(value));
}

function ReadOnlyLinesTable({ kind, lines }) {
  const isService = kind === 'service';
  const title = isService ? 'Servicios realizados' : 'Piezas utilizadas';
  const emptyMessage = isService
    ? 'No hay servicios registrados para este trabajo.'
    : 'No hay piezas registradas para este trabajo.';
  const nameField = isService ? 'serviceName' : 'partName';

  return (
    <section className="technician-detail-card technician-job-lines">
      <header><h2>{title}</h2><span>Solo lectura</span></header>
      {lines.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <div className="technician-job-lines__table-wrap">
          <table className="technician-job-lines__table">
            <caption className="technician-visually-hidden">{title} del trabajo asignado</caption>
            <thead><tr><th>{isService ? 'Servicio' : 'Pieza'}</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Actualizado</th></tr></thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td><strong>{line[nameField] || 'Dato no disponible'}</strong><small>ID catálogo: {isService ? line.serviceId : line.partId}</small></td>
                  <td>{formatQuantity(line.quantity)}</td>
                  <td>{formatJobMoney(line.unitPrice)}</td>
                  <td><strong>{formatJobMoney(line.lineSubtotal)}</strong></td>
                  <td>{formatJobDate(line.updatedAt || line.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function TechnicianJobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportError, setReportError] = useState('');
  const [serviceLines, setServiceLines] = useState([]);
  const [partLines, setPartLines] = useState([]);
  const [linesLoading, setLinesLoading] = useState(true);
  const [linesError, setLinesError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadDetail() {
      setLoading(true);
      setError('');
      setReportError('');
      setLinesError('');
      setLinesLoading(true);
      setReport(null);
      setServiceLines([]);
      setPartLines([]);
      try {
        const loadedJob = unwrapApiData(await getAssignedJobById(id, { signal: controller.signal }));
        if (!active) return;
        setJob(loadedJob);

        const [linesResult, reportResult] = await Promise.allSettled([
          Promise.all([
            getAssignedJobServices(loadedJob.id, { signal: controller.signal }),
            getAssignedJobParts(loadedJob.id, { signal: controller.signal }),
          ]),
          getServiceReportByJobId(loadedJob.id, { signal: controller.signal }),
        ]);

        if (!active) return;

        if (linesResult.status === 'fulfilled') {
          const [servicesResponse, partsResponse] = linesResult.value;
          setServiceLines(unwrapLines(servicesResponse));
          setPartLines(unwrapLines(partsResponse));
        } else if (linesResult.reason?.name !== 'AbortError') {
          setLinesError(getTechnicianResourceErrorMessage(
            linesResult.reason,
            'las líneas reales del trabajo',
          ));
        }
        setLinesLoading(false);

        if (reportResult.status === 'fulfilled') {
          setReport(unwrapApiData(reportResult.value));
        } else if (reportResult.reason?.name !== 'AbortError') {
          if (reportResult.reason?.status === 404) {
            setReport(null);
          } else {
            setReportError(getTechnicianResourceErrorMessage(
              reportResult.reason,
              'el reporte de este trabajo',
            ));
          }
        }
      } catch (requestError) {
        if (active && requestError?.name !== 'AbortError') {
          setJob(null);
          setError(getTechnicianResourceErrorMessage(requestError, 'el trabajo'));
          setLinesLoading(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, reloadKey]);

  if (loading) return <div className="technician-state" role="status" aria-live="polite"><span className="technician-loader" aria-hidden="true" /><p>Cargando detalle del trabajo...</p></div>;
  if (error) return <div className="technician-state technician-state--warning" role="alert"><strong>Trabajo no disponible</strong><p>{error}</p><div className="technician-state__actions"><button className="admin-button admin-button--primary" type="button" onClick={reload}>Reintentar</button><Link className="admin-button admin-button--secondary" to="/technician/jobs">Volver a mis trabajos</Link></div></div>;
  if (!job) return null;

  return (
    <section className="technician-resource-detail-page">
      <div className="technician-breadcrumb"><Link to="/technician">Panel técnico</Link><span>›</span><Link to="/technician/jobs">Mis trabajos</Link><span>›</span><strong>JOB-{job.id}</strong></div>
      <div className="technician-order-detail-heading">
        <div><p className="admin-eyebrow">Trabajo asignado · solo lectura</p><h1>JOB-{job.id}</h1></div>
        <span className={technicianStatusClass(job.status)}>{JOB_STATUS_LABELS[job.status] || job.status}</span>
      </div>

      <div className="technician-resource-detail-layout">
        <div className="technician-resource-detail-main">
          <section className="technician-detail-card technician-detail-identity">
            <header><h2>Datos operativos</h2></header>
            <dl>
              <div><dt>Job</dt><dd>JOB-{job.id}</dd></div>
              <div><dt>Work Order</dt><dd><Link to={`/technician/work-orders/${job.workOrderId}`}>OT-{job.workOrderId}</Link></dd></div>
              <div><dt>Revisión aprobada</dt><dd>REV-{job.initialApprovedRevisionId}</dd></div>
              <div><dt>Horas reales</dt><dd>{job.actualHours ?? 'Dato no disponible'}</dd></div>
              <div><dt>Estado</dt><dd>{JOB_STATUS_LABELS[job.status] || job.status}</dd></div>
            </dl>
          </section>

          <section className="technician-detail-card">
            <header><h2>Notas del trabajo</h2></header>
            <p>{job.notes || 'Sin notas registradas.'}</p>
          </section>

          {job.cancellationNotes && <section className="technician-detail-card"><header><h2>Motivo de cancelación</h2></header><p>{job.cancellationNotes}</p></section>}

          {linesLoading ? (
            <div className="technician-empty">Cargando servicios y piezas reales...</div>
          ) : linesError ? (
            <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{linesError}</p></div>
          ) : (
            <div className="technician-job-lines-layout">
              <ReadOnlyLinesTable kind="service" lines={serviceLines} />
              <ReadOnlyLinesTable kind="part" lines={partLines} />
            </div>
          )}
        </div>

        <aside className="technician-order-detail-side">
          <section><h2>Fechas</h2><dl><div><dt>Programado</dt><dd>{formatJobDate(job.scheduledStartDate)}</dd></div><div><dt>Inicio</dt><dd>{formatJobDate(job.startDate)}</dd></div><div><dt>Fin</dt><dd>{formatJobDate(job.completionDate)}</dd></div><div><dt>Cancelación</dt><dd>{formatJobDate(job.cancelledAt)}</dd></div><div><dt>Creado</dt><dd>{formatJobDate(job.createdAt)}</dd></div><div><dt>Actualizado</dt><dd>{formatJobDate(job.updatedAt)}</dd></div></dl></section>
          <section><h2>Importes reales</h2><dl><div><dt>Subtotal</dt><dd>{formatJobMoney(job.realSubtotalAmount)}</dd></div><div><dt>IVA</dt><dd>{formatJobMoney(job.realIvaAmount)}</dd></div><div className="technician-detail-total"><dt>Total</dt><dd>{formatJobMoney(job.realTotalAmount)}</dd></div></dl></section>
          <section><h2>Reporte de servicio</h2>{reportError ? <p className="technician-resource-error">{reportError}</p> : report ? <><p>REP-{report.id} · {report.status}</p><Link className="admin-button admin-button--secondary" to={`/technician/service-reports/${report.id}`}>Ver reporte</Link></> : <p>Este trabajo aún no tiene reporte de servicio.</p>}</section>
        </aside>
      </div>
    </section>
  );
}
