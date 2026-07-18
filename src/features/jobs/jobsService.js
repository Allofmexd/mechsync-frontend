import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

function authenticatedRequest(path, options = {}) {
  return apiFetch(path, {
    ...options,
    token: getRequiredAuthToken(),
  });
}

export function listJobs({ page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return authenticatedRequest(`/jobs?${params.toString()}`, { method: 'GET' });
}

export function getJobById(jobId) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}`, { method: 'GET' });
}

export function createJob(payload) {
  return authenticatedRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function startJob(jobId) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/start`, { method: 'PATCH' });
}

export function completeJob(jobId, payload) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function cancelJob(jobId, payload = {}) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
