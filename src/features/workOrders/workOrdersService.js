import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

export function getWorkOrders({ page = 0, size = 20 } = {}) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/work-orders?${searchParams.toString()}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function getAssignedWorkOrders({ page = 0, size = 20, signal } = {}) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/work-orders/assigned-to-me?${searchParams.toString()}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
    signal,
  });
}

export function getWorkOrderById(workOrderId) {
  return apiFetch(`/work-orders/${workOrderId}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function createWorkOrder(payload) {
  return apiFetch('/work-orders', {
    method: 'POST',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}

export function updateWorkOrder(workOrderId, payload) {
  return apiFetch(`/work-orders/${workOrderId}`, {
    method: 'PUT',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}

export function deleteWorkOrder(workOrderId) {
  return apiFetch(`/work-orders/${workOrderId}`, {
    method: 'DELETE',
    token: getRequiredAuthToken(),
  });
}
