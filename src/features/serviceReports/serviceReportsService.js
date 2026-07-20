import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

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
