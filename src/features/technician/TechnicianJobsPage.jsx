import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  formatJobDate,
  formatJobMoney,
  JOB_STATUS_LABELS,
} from '../jobs/jobUtils';
import TechnicianPagination from './TechnicianPagination';
import {
  DEFAULT_TECHNICIAN_PAGE_SIZE,
  getValidPageCorrection,
} from './technicianPaginationUtils';
import { listAssignedJobs } from './technicianJobsService';
import {
  getTechnicianResourceErrorMessage,
  technicianStatusClass,
} from './technicianResourceUtils';
import './technician.css';

const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: DEFAULT_TECHNICIAN_PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};

export default function TechnicianJobsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_TECHNICIAN_PAGE_SIZE);
  const [pageData, setPageData] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadJobs() {
      setLoading(true);
      setError('');
      try {
        const nextPage = await listAssignedJobs({ page, size, signal: controller.signal });
        if (!active) return;

        const correctedPage = getValidPageCorrection(page, nextPage);
        if (correctedPage !== null) {
          setPage(correctedPage);
          return;
        }

        setPageData(nextPage);
      } catch (requestError) {
        if (active && requestError?.name !== 'AbortError') {
          setError(getTechnicianResourceErrorMessage(requestError, 'tus trabajos'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadJobs();
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, reloadKey, size]);

  function changePage(nextPage) {
    if (!loading) setPage(Math.max(0, nextPage));
  }

  function changeSize(nextSize) {
    setSize(nextSize);
    setPage(0);
  }

  return (
    <section className="technician-resource-page" aria-labelledby="technician-jobs-title">
      <div className="technician-page-heading">
        <div>
          <p className="admin-eyebrow">Ejecución asignada</p>
          <h1 id="technician-jobs-title">Mis trabajos</h1>
          <p>Jobs que el servidor asignó al perfil técnico de tu sesión.</p>
        </div>
        <span className="technician-readonly">Solo lectura</span>
      </div>

      <div className="technician-client-filter-notice">
        <strong>Asignación verificada en servidor</strong>
        <p>La vista solicita una página por vez mediante <code>/jobs/assigned-to-me</code>.</p>
      </div>

      <section className="technician-panel" aria-busy={loading}>
        <div className="technician-resource-summarybar" aria-live="polite">
          <span>Total de trabajos asignados</span>
          <strong>{pageData.totalElements}</strong>
        </div>

        {error && (
          <div className="technician-state technician-state--error" role="alert">
            <strong>No fue posible cargar tus trabajos</strong>
            <p>{error}</p>
            <button className="admin-button admin-button--primary" type="button" onClick={reload}>Reintentar</button>
          </div>
        )}

        {!error && loading ? (
          <div className="technician-empty" role="status" aria-live="polite">
            <span className="technician-loader" aria-hidden="true" />
            <p>Cargando trabajos asignados...</p>
          </div>
        ) : !error && pageData.totalElements === 0 ? (
          <div className="technician-empty" role="status">
            <strong>Aún no tienes trabajos asignados.</strong>
            <p>Los nuevos Jobs aparecerán cuando un administrador los asigne a tu perfil.</p>
          </div>
        ) : !error ? (
          <>
            <div className="technician-resource-table-wrap">
              <table className="technician-resource-table">
                <caption className="technician-visually-hidden">Trabajos asignados de la página actual</caption>
                <thead>
                  <tr><th>Trabajo</th><th>Orden</th><th>Estado</th><th>Fechas</th><th>Subtotal</th><th>IVA</th><th>Total</th><th>Acción</th></tr>
                </thead>
                <tbody>
                  {pageData.content.map((job) => (
                    <tr key={job.id}>
                      <td><strong>JOB-{job.id}</strong></td>
                      <td><Link to={`/technician/work-orders/${job.workOrderId}`}>OT-{job.workOrderId}</Link></td>
                      <td><span className={technicianStatusClass(job.status)}>{JOB_STATUS_LABELS[job.status] || job.status}</span></td>
                      <td><div className="technician-table-stack"><span>Programado: {formatJobDate(job.scheduledStartDate)}</span><span>Inicio: {formatJobDate(job.startDate)}</span><span>Fin: {formatJobDate(job.completionDate)}</span></div></td>
                      <td>{formatJobMoney(job.realSubtotalAmount)}</td>
                      <td>{formatJobMoney(job.realIvaAmount)}</td>
                      <td><strong>{formatJobMoney(job.realTotalAmount)}</strong></td>
                      <td><Link className="table-action-link" to={`/technician/jobs/${job.id}`} aria-label={`Ver detalle del trabajo JOB-${job.id}`}>Ver detalle</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TechnicianPagination
              pageData={pageData}
              size={size}
              loading={loading}
              resourceLabel="trabajos asignados"
              onPageChange={changePage}
              onSizeChange={changeSize}
            />
          </>
        ) : null}
      </section>
    </section>
  );
}
