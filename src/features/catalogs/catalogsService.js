import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

export function getStatusesByContext(context) {
  const searchParams = new URLSearchParams({ context });

  return apiFetch(`/catalogs/statuses?${searchParams.toString()}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function getVehicleIntakeStatuses() {
  return getStatusesByContext('VEHICLE_INTAKES');
}
