import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

export function getVehicles({ page = 0, size = 20 } = {}) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/vehicles?${searchParams.toString()}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function getVehicleById(vehicleId) {
  return apiFetch(`/vehicles/${vehicleId}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function createVehicle(payload) {
  return apiFetch('/vehicles', {
    method: 'POST',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}

export function updateVehicle(vehicleId, payload) {
  return apiFetch(`/vehicles/${vehicleId}`, {
    method: 'PUT',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}

export function deleteVehicle(vehicleId) {
  return apiFetch(`/vehicles/${vehicleId}`, {
    method: 'DELETE',
    token: getRequiredAuthToken(),
  });
}
