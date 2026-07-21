import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  formatServiceReportDate,
  formatServiceReportMoney,
  getServiceReportPdfErrorMessage,
  SERVICE_REPORT_STATUS_LABELS,
  serviceReportStatusClass,
  unwrapServiceReportData,
} from '../serviceReports/serviceReportUtils';
import {
  downloadAssignedServiceReportPdf,
  getAssignedServiceReportById,
} from './technicianServiceReportsService';
import { getTechnicianResourceErrorMessage } from './technicianResourceUtils';
import './technician.css';

export default function TechnicianServiceReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadReport() {
      setLoading(true);
      setError('');
      try {
        const response = await getAssignedServiceReportById(id, { signal: controller.signal });
        if (active) setReport(unwrapServiceReportData(response));
      } catch (requestError) {
        if (active && requestError?.name !== 'AbortError') {
          setReport(null);
          setError(getTechnicianResourceErrorMessage(requestError, 'el reporte de servicio'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReport();
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, reloadKey]);

  async function handlePdfDownload() {
    setPdfDownloading(true);
    setPdfError('');
    let objectUrl;

    try {
      const { blob, filename } = await downloadAssignedServiceReportPdf(report.id);
      if (!blob.type.toLowerCase().includes('application/pdf')) {
        const invalidPdf = new Error('El servidor no devolvió un PDF válido.');
        invalidPdf.status = 500;
        throw invalidPdf;
      }
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

  if (loading) return <div className="technician-state" role="status" aria-live="polite"><span className="technician-loader" aria-hidden="true" /><p>Cargando reporte de servicio...</p></div>;
  if (error) return <div className="technician-state technician-state--warning" role="alert"><strong>Reporte no disponible</strong><p>{error}</p><div className="technician-state__actions"><button className="admin-button admin-button--primary" type="button" onClick={reload}>Reintentar</button><Link className="admin-button admin-button--secondary" to="/technician/service-reports">Volver a mis reportes</Link></div></div>;
  if (!report) return null;

  return (
    <section className="technician-resource-detail-page">
      <div className="technician-breadcrumb"><Link to="/technician">Panel técnico</Link><span>›</span><Link to="/technician/service-reports">Mis reportes</Link><span>›</span><strong>REP-{report.id}</strong></div>
      <div className="technician-order-detail-heading">
        <div><p className="admin-eyebrow">Cierre oficial · solo lectura</p><h1>REP-{report.id}</h1></div>
        <div className="technician-report-actions"><span className={serviceReportStatusClass(report.status)}>{SERVICE_REPORT_STATUS_LABELS[report.status] || report.status}</span><button className="admin-button admin-button--primary" type="button" disabled={pdfDownloading} onClick={handlePdfDownload}>{pdfDownloading ? 'Descargando PDF...' : 'Descargar PDF'}</button></div>
      </div>

      {pdfError && <div className="admin-alert admin-alert--error" role="alert"><span>!</span><p>{pdfError}</p></div>}

      <div className="technician-resource-detail-layout">
        <div className="technician-resource-detail-main">
          <section className="technician-detail-card technician-detail-identity">
            <header><h2>Datos generales</h2></header>
            <dl><div><dt>Reporte</dt><dd>REP-{report.id}</dd></div><div><dt>Job</dt><dd><Link to={`/technician/jobs/${report.jobId}`}>JOB-{report.jobId}</Link></dd></div><div><dt>Estado</dt><dd>{SERVICE_REPORT_STATUS_LABELS[report.status] || report.status}</dd></div><div><dt>Confirmación del cliente</dt><dd>{report.customerConfirmation ? 'Confirmada' : 'No registrada'}</dd></div></dl>
          </section>
          <section className="technician-detail-card"><header><h2>Descripción final</h2></header><p>{report.finalDescription || 'Sin descripción final registrada.'}</p></section>
          <section className="technician-detail-card technician-detail-identity"><header><h2>Fechas</h2></header><dl><div><dt>Fecha del reporte</dt><dd>{formatServiceReportDate(report.reportDate)}</dd></div><div><dt>Fecha de entrega</dt><dd>{formatServiceReportDate(report.deliveredAt)}</dd></div><div><dt>Creado</dt><dd>{formatServiceReportDate(report.createdAt)}</dd></div><div><dt>Actualizado</dt><dd>{formatServiceReportDate(report.updatedAt)}</dd></div></dl></section>
        </div>
        <aside className="technician-order-detail-side">
          <section><h2>Importes finales</h2><dl><div><dt>Subtotal</dt><dd>{formatServiceReportMoney(report.finalSubtotal)}</dd></div><div><dt>IVA</dt><dd>{formatServiceReportMoney(report.finalIva)}</dd></div><div className="technician-detail-total"><dt>Total</dt><dd>{formatServiceReportMoney(report.finalTotal)}</dd></div></dl></section>
          <section className="technician-pdf-note"><h2>Documento oficial</h2><p>El PDF se genera desde los datos del reporte y no se almacena en el navegador.</p></section>
        </aside>
      </div>
    </section>
  );
}
