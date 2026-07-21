import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

export function getTechnicians() {
  return apiFetch('/technicians', {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function getSpecialties() {
  return apiFetch('/specialties', {
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

export function getTechnicianById(technicianId) {
  return apiFetch(`/technicians/${encodeURIComponent(technicianId)}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function createTechnician(payload) {
  return apiFetch('/technicians', {
    method: 'POST',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}

export function updateTechnician(technicianId, payload) {
  return apiFetch(`/technicians/${encodeURIComponent(technicianId)}`, {
    method: 'PUT',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}
