import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listServiceReports } from './serviceReportsService';
import {
  formatServiceReportDate,
  formatServiceReportMoney,
  getServiceReportErrorMessage,
  SERVICE_REPORT_STATUS_LABELS,
  serviceReportStatusClass,
  unwrapServiceReportPage,
} from './serviceReportUtils';
import './serviceReports.css';

const PAGE_SIZE = 20;

export default function ServiceReportsListPage() {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], page: 0, totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      setError('');
      try {
        const response = await listServiceReports({ page, size: PAGE_SIZE });
        if (active) setPageData(unwrapServiceReportPage(response));
      } catch (requestError) {
        if (active) setError(getServiceReportErrorMessage(requestError, 'cargar los reportes de servicio'));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReports();
    return () => { active = false; };
  }, [page]);

  return (
    <section className="service-reports-page">
      <div className="admin-breadcrumb"><span>Panel principal</span><span>›</span><strong>Reportes de servicio</strong></div>
      <div className="service-reports-heading">
        <div>
          <p className="admin-eyebrow">Cierre oficial del taller</p>
          <h1>Reportes de servicio</h1>
          <p>Consulta read-only de los cierres generados para trabajos completados.</p>
        </div>
        <span className="service-reports-readonly">Solo lectura</span>
      </div>

      <div className="service-reports-summary">
        <article><span>Total de reportes</span><strong>{pageData.totalElements}</strong><small>Dato reportado por la API</small></article>
        <article><span>Página actual</span><strong>{pageData.totalPages ? pageData.page + 1 : 0}</strong><small>de {pageData.totalPages} páginas</small></article>
        <article><span>Documento PDF</span><strong>Disponible</strong><small>Descarga autenticada desde el detalle</small></article>
      </div>

      <div className="service-reports-context" role="note">
        <span><strong>Cotización:</strong> autorización.</span>
        <span><strong>Job:</strong> ejecución real.</span>
        <span><strong>Reporte:</strong> cierre oficial e inmutable.</span>
      </div>

      <div className="service-reports-panel">
        {error && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div>}
        {loading ? (
          <div className="service-reports-state">Cargando reportes de servicio...</div>
        ) : !error && pageData.content.length === 0 ? (
          <div className="service-reports-state">
            <strong>Aún no hay reportes de servicio registrados.</strong>
            <p>Los reportes aparecen después del cierre oficial de un Job completado.</p>
          </div>
        ) : !error ? (
          <>
            <div className="service-reports-table-wrap">
              <table className="service-reports-table">
                <thead>
                  <tr><th>Reporte</th><th>Trabajo</th><th>Estado</th><th>Fecha del reporte</th><th>Entrega</th><th>Importes</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {pageData.content.map((report) => (
                    <tr key={report.id}>
                      <td><strong>REP-{report.id}</strong></td>
                      <td><Link to={`/admin/jobs/${report.jobId}`}>JOB-{report.jobId}</Link></td>
                      <td><span className={serviceReportStatusClass(report.status)}>{SERVICE_REPORT_STATUS_LABELS[report.status] || report.status}</span></td>
                      <td>{formatServiceReportDate(report.reportDate)}</td>
                      <td>{formatServiceReportDate(report.deliveredAt)}</td>
                      <td>
                        <div className="service-report-money-stack">
                          <span>Subtotal: {formatServiceReportMoney(report.finalSubtotal)}</span>
                          <span>IVA: {formatServiceReportMoney(report.finalIva)}</span>
                          <strong>Total: {formatServiceReportMoney(report.finalTotal)}</strong>
                        </div>
                      </td>
                      <td><Link className="table-action-link" to={`/admin/service-reports/${report.id}`}>Ver detalle</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pageData.totalPages > 1 && (
              <div className="service-reports-pagination">
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
