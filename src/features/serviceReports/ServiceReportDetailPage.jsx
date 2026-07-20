import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { downloadServiceReportPdf, getServiceReportById } from './serviceReportsService';
import {
  formatServiceReportDate,
  formatServiceReportMoney,
  getServiceReportErrorMessage,
  getServiceReportPdfErrorMessage,
  SERVICE_REPORT_STATUS_LABELS,
  serviceReportStatusClass,
  unwrapServiceReportData,
} from './serviceReportUtils';
import './serviceReports.css';

export default function ServiceReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadReport() {
      setLoading(true);
      setError('');
      try {
        const response = await getServiceReportById(id);
        if (active) setReport(unwrapServiceReportData(response));
      } catch (requestError) {
        if (active) setError(getServiceReportErrorMessage(requestError, 'cargar el reporte de servicio'));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReport();
    return () => { active = false; };
  }, [id]);

  if (loading) return <section className="service-report-detail-page"><div className="service-reports-state">Cargando reporte de servicio...</div></section>;
  if (error) return <section className="service-report-detail-page"><div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{error}</p></div><Link className="admin-button admin-button--secondary" to="/admin/service-reports">Volver a reportes</Link></section>;
  if (!report) return null;

  async function handlePdfDownload() {
    setPdfDownloading(true);
    setPdfError('');
    let objectUrl;

    try {
      const { blob, filename } = await downloadServiceReportPdf(report.id);
      objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (downloadError) {
      setPdfError(getServiceReportPdfErrorMessage(downloadError));
    } finally {
      if (objectUrl) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      setPdfDownloading(false);
    }
  }

  return (
    <section className="service-report-detail-page">
      <div className="admin-breadcrumb"><Link to="/admin/service-reports">Reportes de servicio</Link><span>›</span><strong>REP-{report.id}</strong></div>
      <div className="service-reports-heading service-reports-heading--detail">
        <div>
          <p className="admin-eyebrow">Cierre oficial read-only</p>
          <h1>Reporte REP-{report.id}</h1>
          <p>Información definitiva registrada para el trabajo JOB-{report.jobId}.</p>
        </div>
        <div className="service-report-detail-actions">
          <span className={serviceReportStatusClass(report.status)}>{SERVICE_REPORT_STATUS_LABELS[report.status] || report.status}</span>
          <button
            className="admin-button admin-button--primary"
            type="button"
            disabled={pdfDownloading}
            onClick={handlePdfDownload}
          >
            {pdfDownloading ? 'Descargando PDF...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {pdfError ? <div className="admin-alert admin-alert--error service-report-pdf-error" role="alert"><span>!</span><p>{pdfError}</p></div> : null}

      <div className="service-report-detail-layout">
        <div className="service-report-detail-main">
          <section className="service-report-card">
            <h2>Datos generales</h2>
            <dl className="service-report-detail-grid">
              <div><dt>ID del reporte</dt><dd>REP-{report.id}</dd></div>
              <div><dt>Trabajo relacionado</dt><dd><Link to={`/admin/jobs/${report.jobId}`}>JOB-{report.jobId}</Link></dd></div>
              <div><dt>Estado</dt><dd>{SERVICE_REPORT_STATUS_LABELS[report.status] || report.status}</dd></div>
              <div><dt>Confirmación del cliente</dt><dd>{report.customerConfirmation ? 'Confirmada' : 'No registrada'}</dd></div>
            </dl>
          </section>

          <section className="service-report-card">
            <h2>Descripción final</h2>
            <p className="service-report-description">{report.finalDescription || 'Sin descripción final registrada.'}</p>
          </section>

          <section className="service-report-card">
            <h2>Fechas</h2>
            <dl className="service-report-detail-grid">
              <div><dt>Fecha del reporte</dt><dd>{formatServiceReportDate(report.reportDate)}</dd></div>
              <div><dt>Fecha de entrega</dt><dd>{formatServiceReportDate(report.deliveredAt)}</dd></div>
              <div><dt>Creado</dt><dd>{formatServiceReportDate(report.createdAt)}</dd></div>
              <div><dt>Última actualización</dt><dd>{formatServiceReportDate(report.updatedAt)}</dd></div>
            </dl>
          </section>
        </div>

        <aside className="service-report-detail-side">
          <section className="service-report-card">
            <h2>Importes finales</h2>
            <div className="service-report-money-grid">
              <div><span>Subtotal</span><strong>{formatServiceReportMoney(report.finalSubtotal)}</strong></div>
              <div><span>IVA</span><strong>{formatServiceReportMoney(report.finalIva)}</strong></div>
              <div className="service-report-money-total"><span>Total</span><strong>{formatServiceReportMoney(report.finalTotal)}</strong></div>
            </div>
          </section>

          <div className="service-report-pdf-notice" role="note">
            <strong>Documento final disponible</strong>
            <p>El PDF se genera desde los datos oficiales del reporte y se descarga sin almacenarse en el navegador.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
