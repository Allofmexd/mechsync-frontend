import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

function authenticatedRequest(path) {
  return apiFetch(path, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function listServiceReports({ page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return authenticatedRequest(`/service-reports?${params.toString()}`);
}

export function getServiceReportById(reportId) {
  return authenticatedRequest(`/service-reports/${encodeURIComponent(reportId)}`);
}

export function getServiceReportByJobId(jobId) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/service-report`);
}
