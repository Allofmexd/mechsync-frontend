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

export function getWorkOrderStatuses() {
  return getStatusesByContext('WORK_ORDERS');
}

function getPagedCatalog(path, { page = 0, size = 100, search = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const normalizedSearch = String(search).trim();
  if (normalizedSearch) params.set('search', normalizedSearch);
  return apiFetch(`${path}?${params.toString()}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

async function getAllCatalogItems(path) {
  const firstResponse = await getPagedCatalog(path);
  const firstPage = firstResponse?.data ?? firstResponse;
  const firstItems = Array.isArray(firstPage) ? firstPage : firstPage?.content ?? [];
  const totalPages = Number(firstPage?.totalPages ?? (firstItems.length ? 1 : 0));
  if (totalPages <= 1) return firstItems;

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => getPagedCatalog(path, { page: index + 1 })),
  );
  return [
    ...firstItems,
    ...remaining.flatMap((response) => {
      const page = response?.data ?? response;
      return Array.isArray(page) ? page : page?.content ?? [];
    }),
  ];
}

export function getServicesCatalog(options = {}) {
  return getPagedCatalog('/services', options);
}

export function getPartsCatalog(options = {}) {
  return getPagedCatalog('/parts', options);
}

export function getAllServicesCatalog() {
  return getAllCatalogItems('/services');
}

export function getAllPartsCatalog() {
  return getAllCatalogItems('/parts');
}
