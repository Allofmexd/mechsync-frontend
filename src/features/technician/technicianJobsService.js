import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';
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

export async function listAssignedJobs({ page = 0, size = 10, signal } = {}) {
  const params = new URLSearchParams({
    page: String(normalizeTechnicianPage(page)),
    size: String(normalizeTechnicianPageSize(size)),
  });
  const response = await authenticatedRequest(`/jobs/assigned-to-me?${params.toString()}`, {
    method: 'GET',
    signal,
  });
  return unwrapTechnicianPage(response);
}

export function getAssignedJobById(jobId, { signal } = {}) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}`, { method: 'GET', signal });
}

export function getAssignedJobServices(jobId, { signal } = {}) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/services`, { method: 'GET', signal });
}

export function getAssignedJobParts(jobId, { signal } = {}) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/parts`, { method: 'GET', signal });
}
