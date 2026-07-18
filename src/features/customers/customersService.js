import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

export function getCustomers({ page = 0, size = 20 } = {}) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/customers?${searchParams.toString()}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function createCustomer(payload) {
  return apiFetch('/customers', {
    method: 'POST',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}

export function getCustomerById(customerId) {
  return apiFetch(`/customers/${customerId}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function updateCustomer(customerId, payload) {
  return apiFetch(`/customers/${customerId}`, {
    method: 'PUT',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}

export function deleteCustomer(customerId) {
  return apiFetch(`/customers/${customerId}`, {
    method: 'DELETE',
    token: getRequiredAuthToken(),
  });
}
