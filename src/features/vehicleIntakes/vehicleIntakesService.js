import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

export function createVehicleIntake(payload) {
  return apiFetch('/vehicle-intakes', {
    method: 'POST',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}
