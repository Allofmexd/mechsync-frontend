import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';
import { downloadServiceReportPdf } from '../serviceReports/serviceReportsService';
import {
  normalizeTechnicianPage,
  normalizeTechnicianPageSize,
  unwrapTechnicianPage,
} from './technicianPaginationUtils';

function authenticatedRequest(path, options = {}) {
  return apiFetch(path, {
    ...options,
    token: getRequiredAuthToken(),
  });
}

export async function listAssignedServiceReports({ page = 0, size = 10, signal } = {}) {
  const params = new URLSearchParams({
    page: String(normalizeTechnicianPage(page)),
    size: String(normalizeTechnicianPageSize(size)),
  });
  const response = await authenticatedRequest(`/service-reports/assigned-to-me?${params.toString()}`, {
    method: 'GET',
    signal,
  });
  return unwrapTechnicianPage(response);
}

export function getAssignedServiceReportById(reportId, { signal } = {}) {
  return authenticatedRequest(`/service-reports/${encodeURIComponent(reportId)}`, { method: 'GET', signal });
}

export function getServiceReportByJobId(jobId, { signal } = {}) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/service-report`, { method: 'GET', signal });
}

export function downloadAssignedServiceReportPdf(reportId) {
  return downloadServiceReportPdf(reportId);
}
