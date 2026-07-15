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
