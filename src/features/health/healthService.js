import { apiFetch } from '../../shared/api/apiClient.js';

export function getHealth() {
  return apiFetch('/health', { method: 'GET' });
}

export function getDatabaseHealth() {
  return apiFetch('/health/database', { method: 'GET' });
}
