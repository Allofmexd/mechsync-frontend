import { API_BASE_URL, apiFetch } from '../../shared/api/apiClient';
import { clearAuthToken, getRequiredAuthToken } from '../../shared/storage/authStorage';

function authenticatedRequest(path, options = {}) {
  return apiFetch(path, {
    ...options,
    token: getRequiredAuthToken(),
  });
}

export function listServiceReports({ page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return authenticatedRequest(`/service-reports?${params.toString()}`, { method: 'GET' });
}

export function getServiceReportById(reportId) {
  return authenticatedRequest(`/service-reports/${encodeURIComponent(reportId)}`, { method: 'GET' });
}

export function getServiceReportByJobId(jobId) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/service-report`, { method: 'GET' });
}

export function createServiceReport(payload) {
  return authenticatedRequest('/service-reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function createDownloadError(status, data) {
  const apiMessage = data && typeof data === 'object'
    ? data.message ?? data.error ?? data.detail ?? data.data?.message
    : data;
  const error = new Error(
    typeof apiMessage === 'string' && apiMessage.trim()
      ? apiMessage
      : `La API respondió con el estado ${status}.`,
  );
  error.status = status;
  error.data = data;
  return error;
}

async function readErrorResponse(response) {
  const contentType = response.headers.get('content-type') ?? '';
  try {
    return contentType.includes('application/json')
      ? await response.json()
      : await response.text();
  } catch {
    return null;
  }
}

function safePdfFilename(contentDisposition, reportId) {
  const safeReportId = String(reportId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fallback = `service-report-${safeReportId}.pdf`;
  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  const regularMatch = contentDisposition.match(/filename=(?:"([^"]+)"|([^;]+))/i);
  let candidate = utf8Match?.[1] ?? regularMatch?.[1] ?? regularMatch?.[2];

  if (!candidate) return fallback;
  try {
    candidate = decodeURIComponent(candidate.trim());
  } catch {
    candidate = candidate.trim();
  }

  const basename = candidate.split(/[\\/]/).pop();
  const sanitized = basename?.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized?.toLowerCase().endsWith('.pdf') ? sanitized : fallback;
}

export async function downloadServiceReportPdf(reportId) {
  const token = getRequiredAuthToken();
  let response;

  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL no está configurada para descargar el PDF.');
  }

  try {
    response = await fetch(
      `${API_BASE_URL}/service-reports/${encodeURIComponent(reportId)}/pdf`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/pdf',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      },
    );
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No fue posible conectar con la API para descargar el PDF.');
    }
    throw error;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login?reason=session-expired');
      }
    }
    throw createDownloadError(response.status, await readErrorResponse(response));
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/pdf')) {
    const error = new Error('La API no devolvió un archivo PDF válido.');
    error.status = 500;
    throw error;
  }

  const blob = await response.blob();
  if (!blob.size) {
    const error = new Error('El archivo PDF recibido está vacío.');
    error.status = 500;
    throw error;
  }

  return {
    blob,
    filename: safePdfFilename(response.headers.get('content-disposition'), reportId),
  };
}
