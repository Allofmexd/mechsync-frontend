import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  formatServiceReportDate,
  formatServiceReportMoney,
  SERVICE_REPORT_STATUS_LABELS,
  serviceReportStatusClass,
} from '../serviceReports/serviceReportUtils';
import TechnicianPagination from './TechnicianPagination';
import {
  DEFAULT_TECHNICIAN_PAGE_SIZE,
  getValidPageCorrection,
} from './technicianPaginationUtils';
import { listAssignedServiceReports } from './technicianServiceReportsService';
import { getTechnicianResourceErrorMessage } from './technicianResourceUtils';
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

export default function TechnicianServiceReportsPage() {
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

    async function loadReports() {
      setLoading(true);
      setError('');
      try {
        const nextPage = await listAssignedServiceReports({ page, size, signal: controller.signal });
        if (!active) return;

        const correctedPage = getValidPageCorrection(page, nextPage);
        if (correctedPage !== null) {
          setPage(correctedPage);
          return;
        }

        setPageData(nextPage);
      } catch (requestError) {
        if (active && requestError?.name !== 'AbortError') {
          setError(getTechnicianResourceErrorMessage(requestError, 'tus reportes de servicio'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReports();
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
    <section className="technician-resource-page" aria-labelledby="technician-reports-title">
      <div className="technician-page-heading">
        <div><p className="admin-eyebrow">Cierres asignados</p><h1 id="technician-reports-title">Mis reportes de servicio</h1><p>Documentos oficiales de los Jobs asignados a tu perfil.</p></div>
        <span className="technician-readonly">Solo lectura</span>
      </div>

      <div className="technician-client-filter-notice"><strong>Asignación verificada en servidor</strong><p>La vista solicita una página por vez mediante <code>/service-reports/assigned-to-me</code>.</p></div>

      <section className="technician-panel" aria-busy={loading}>
        <div className="technician-resource-summarybar" aria-live="polite">
          <span>Total de reportes asignados</span>
          <strong>{pageData.totalElements}</strong>
        </div>

        {error && (
          <div className="technician-state technician-state--error" role="alert">
            <strong>No fue posible cargar tus reportes</strong>
            <p>{error}</p>
            <button className="admin-button admin-button--primary" type="button" onClick={reload}>Reintentar</button>
          </div>
        )}

        {!error && loading ? (
          <div className="technician-empty" role="status" aria-live="polite">
            <span className="technician-loader" aria-hidden="true" />
            <p>Cargando reportes asignados...</p>
          </div>
        ) : !error && pageData.totalElements === 0 ? (
          <div className="technician-empty" role="status">
            <strong>Aún no tienes reportes de servicio asignados.</strong>
            <p>Los cierres oficiales aparecerán cuando existan para tus trabajos.</p>
          </div>
        ) : !error ? (
          <>
            <div className="technician-resource-table-wrap">
              <table className="technician-resource-table">
                <caption className="technician-visually-hidden">Reportes de servicio asignados de la página actual</caption>
                <thead><tr><th>Reporte</th><th>Trabajo</th><th>Estado</th><th>Fecha del reporte</th><th>Entrega</th><th>Subtotal</th><th>IVA</th><th>Total</th><th>Acción</th></tr></thead>
                <tbody>
                  {pageData.content.map((report) => (
                    <tr key={report.id}>
                      <td><strong>REP-{report.id}</strong></td>
                      <td><Link to={`/technician/jobs/${report.jobId}`}>JOB-{report.jobId}</Link></td>
                      <td><span className={serviceReportStatusClass(report.status)}>{SERVICE_REPORT_STATUS_LABELS[report.status] || report.status}</span></td>
                      <td>{formatServiceReportDate(report.reportDate)}</td>
                      <td>{formatServiceReportDate(report.deliveredAt)}</td>
                      <td>{formatServiceReportMoney(report.finalSubtotal)}</td>
                      <td>{formatServiceReportMoney(report.finalIva)}</td>
                      <td><strong>{formatServiceReportMoney(report.finalTotal)}</strong></td>
                      <td><Link className="table-action-link" to={`/technician/service-reports/${report.id}`} aria-label={`Ver detalle del reporte REP-${report.id}`}>Ver detalle</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TechnicianPagination
              pageData={pageData}
              size={size}
              loading={loading}
              resourceLabel="reportes asignados"
              onPageChange={changePage}
              onSizeChange={changeSize}
            />
          </>
        ) : null}
      </section>
    </section>
  );
}
