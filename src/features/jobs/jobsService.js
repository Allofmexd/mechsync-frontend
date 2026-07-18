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

export function listJobServices(jobId) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/services`, { method: 'GET' });
}

export function addJobService(jobId, payload) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/services`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateJobService(jobId, lineId, payload) {
  return authenticatedRequest(
    `/jobs/${encodeURIComponent(jobId)}/services/${encodeURIComponent(lineId)}`,
    { method: 'PUT', body: JSON.stringify(payload) },
  );
}

export function deleteJobService(jobId, lineId) {
  return authenticatedRequest(
    `/jobs/${encodeURIComponent(jobId)}/services/${encodeURIComponent(lineId)}`,
    { method: 'DELETE' },
  );
}

export function listJobParts(jobId) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/parts`, { method: 'GET' });
}

export function addJobPart(jobId, payload) {
  return authenticatedRequest(`/jobs/${encodeURIComponent(jobId)}/parts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateJobPart(jobId, lineId, payload) {
  return authenticatedRequest(
    `/jobs/${encodeURIComponent(jobId)}/parts/${encodeURIComponent(lineId)}`,
    { method: 'PUT', body: JSON.stringify(payload) },
  );
}

export function deleteJobPart(jobId, lineId) {
  return authenticatedRequest(
    `/jobs/${encodeURIComponent(jobId)}/parts/${encodeURIComponent(lineId)}`,
    { method: 'DELETE' },
  );
}

function listCatalog(path, { page = 0, size = 100, search = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const normalizedSearch = String(search).trim();
  if (normalizedSearch) params.set('search', normalizedSearch);
  return authenticatedRequest(`${path}?${params.toString()}`, { method: 'GET' });
}

export function listServices(options = {}) {
  return listCatalog('/services', options);
}

export function listParts(options = {}) {
  return listCatalog('/parts', options);
}
