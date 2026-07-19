import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTechnicians } from '../technicians/techniciansService';
import { listJobs } from './jobsService';
import {
  formatJobDate,
  formatJobMoney,
  getJobErrorMessage,
  JOB_STATUS_LABELS,
  technicianName,
  unwrapApiData,
  unwrapJobPage,
} from './jobUtils';
import './jobs.css';

const PAGE_SIZE = 20;

function unwrapCollection(response) {
  const data = unwrapApiData(response);
  return Array.isArray(data) ? data : data?.content ?? [];
}

function statusClass(status) {
  return `job-status job-status--${String(status || 'desconocido').toLowerCase().replaceAll('_', '-')}`;
}

export default function JobsListPage() {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], page: 0, totalElements: 0, totalPages: 0 });
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadJobs() {
      setLoading(true);
      setError('');
      try {
        const [jobsResponse, techniciansResponse] = await Promise.all([
          listJobs({ page, size: PAGE_SIZE }),
          getTechnicians(),
        ]);
        if (active) {
          setPageData(unwrapJobPage(jobsResponse));
          setTechnicians(unwrapCollection(techniciansResponse));
        }
      } catch (requestError) {
        if (active) setError(getJobErrorMessage(requestError, 'cargar los trabajos'));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadJobs();
    return () => { active = false; };
  }, [page]);

  const technicianMap = useMemo(
    () => new Map(technicians.map((technician) => [String(technician.id), technician])),
    [technicians],
  );

  return (
    <section className="jobs-page">
      <div className="admin-breadcrumb"><span>Panel principal</span><span>›</span><strong>Trabajos realizados</strong></div>
      <div className="jobs-heading">
        <div>
          <p className="admin-eyebrow">Ejecución real del taller</p>
          <h1>Trabajos realizados</h1>
          <p>Un trabajo se crea únicamente a partir de una cotización final aprobada.</p>
        </div>
        <Link className="admin-button admin-button--primary" to="/admin/jobs/new">＋ Nuevo trabajo</Link>
      </div>

      <div className="jobs-summary">
        <article><span>Total de trabajos</span><strong>{pageData.totalElements}</strong><small>Dato reportado por la API</small></article>
        <article><span>Página actual</span><strong>{pageData.totalPages ? pageData.page + 1 : 0}</strong><small>de {pageData.totalPages} páginas</small></article>
        <article><span>Cierre oficial</span><strong>Disponible</strong><small>Consulta read-only de reportes de servicio</small></article>
      </div>

      <div className="jobs-context" role="note">
        <strong>Cotización = autorización</strong>
        <span>Trabajo = ejecución real</span>
        <span>Reporte de servicio = cierre oficial</span>
      </div>

      <div className="jobs-panel">
        {error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}
        {loading ? (
          <div className="jobs-state">Cargando trabajos...</div>
        ) : !error && pageData.content.length === 0 ? (
          <div className="jobs-state">
            <strong>Aún no hay trabajos registrados.</strong>
            <p>Primero debe existir una cotización aprobada.</p>
            <Link className="admin-button admin-button--secondary" to="/admin/jobs/new">Revisar cotizaciones disponibles</Link>
          </div>
        ) : !error ? (
          <>
            <div className="jobs-table-wrap">
              <table className="jobs-table">
                <thead>
                  <tr><th>Trabajo</th><th>Orden / autorización</th><th>Técnico</th><th>Estado</th><th>Fechas operativas</th><th>Total real</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {pageData.content.map((job) => (
                    <tr key={job.id}>
                      <td><strong>JOB-{job.id}</strong></td>
                      <td>
                        <div className="job-table-stack">
                          <Link to={`/admin/work-orders/${job.workOrderId}`}>OT-{job.workOrderId}</Link>
                          <Link to={`/admin/work-orders/${job.workOrderId}/revisions/${job.initialApprovedRevisionId}`}>Revisión #{job.initialApprovedRevisionId}</Link>
                        </div>
                      </td>
                      <td>{technicianName(technicianMap.get(String(job.technicianId)), job.technicianId)}</td>
                      <td><span className={statusClass(job.status)}>{JOB_STATUS_LABELS[job.status] || job.status}</span></td>
                      <td>
                        <div className="job-table-stack job-table-stack--muted">
                          <span>Programado: {formatJobDate(job.scheduledStartDate)}</span>
                          <span>Inicio: {formatJobDate(job.startDate)}</span>
                          <span>{job.cancelledAt ? `Cancelación: ${formatJobDate(job.cancelledAt)}` : `Fin: ${formatJobDate(job.completionDate)}`}</span>
                        </div>
                      </td>
                      <td><strong>{formatJobMoney(job.realTotalAmount)}</strong></td>
                      <td><Link className="table-action-link" to={`/admin/jobs/${job.id}`}>Ver detalle</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pageData.totalPages > 1 && (
              <div className="jobs-pagination">
                <span>Página {pageData.page + 1} de {pageData.totalPages}</span>
                <div>
                  <button type="button" disabled={pageData.page <= 0} onClick={() => setPage((current) => current - 1)}>Anterior</button>
                  <button type="button" disabled={pageData.page + 1 >= pageData.totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
