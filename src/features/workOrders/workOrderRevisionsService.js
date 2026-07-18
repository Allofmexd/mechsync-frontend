import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

function revisionPath(workOrderId, suffix = '') {
  return `/work-orders/${encodeURIComponent(workOrderId)}/revisions${suffix}`;
}

function authenticatedRequest(path, options = {}) {
  return apiFetch(path, {
    ...options,
    token: getRequiredAuthToken(),
  });
}

export function getWorkOrderRevisions(workOrderId, { page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return authenticatedRequest(`${revisionPath(workOrderId)}?${params.toString()}`, { method: 'GET' });
}

export function getCurrentWorkOrderRevision(workOrderId) {
  return authenticatedRequest(revisionPath(workOrderId, '/current'), { method: 'GET' });
}

export function getFinalApprovedWorkOrderRevision(workOrderId) {
  return authenticatedRequest(revisionPath(workOrderId, '/final-approved'), { method: 'GET' });
}

export function getWorkOrderRevision(workOrderId, revisionId) {
  return authenticatedRequest(revisionPath(workOrderId, `/${encodeURIComponent(revisionId)}`), { method: 'GET' });
}

export function createWorkOrderRevision(workOrderId, payload) {
  return authenticatedRequest(revisionPath(workOrderId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function sendWorkOrderRevision(workOrderId, revisionId) {
  return authenticatedRequest(revisionPath(workOrderId, `/${encodeURIComponent(revisionId)}/send`), { method: 'PATCH' });
}

export function approveWorkOrderRevision(workOrderId, revisionId, payload) {
  return authenticatedRequest(revisionPath(workOrderId, `/${encodeURIComponent(revisionId)}/approve`), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function rejectWorkOrderRevision(workOrderId, revisionId) {
  return authenticatedRequest(revisionPath(workOrderId, `/${encodeURIComponent(revisionId)}/reject`), { method: 'PATCH' });
}

export function cancelWorkOrderRevision(workOrderId, revisionId) {
  return authenticatedRequest(revisionPath(workOrderId, `/${encodeURIComponent(revisionId)}/cancel`), { method: 'PATCH' });
}
