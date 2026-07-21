import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

export function getTechnicians() {
  return apiFetch('/technicians', {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function getCurrentTechnician() {
  return apiFetch('/technicians/me', {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}
