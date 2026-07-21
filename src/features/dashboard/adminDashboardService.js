import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

function unwrap(response) {
  return response?.data ?? response;
}

function periodParams(period) {
  return new URLSearchParams({ from: period.from, to: period.to }).toString();
}

export async function loadAdminDashboard(period, signal) {
  const token = getRequiredAuthToken();
  const params = periodParams(period);
  const options = { method: 'GET', token, signal };

  const [summary, workOrders, jobs, revenue, services, workload] = await Promise.all([
    apiFetch(`/dashboard/summary?${params}`, options),
    apiFetch(`/dashboard/work-orders-by-status?${params}`, options),
    apiFetch(`/dashboard/jobs-by-status?${params}`, options),
    apiFetch(`/dashboard/revenue-by-month?${params}`, options),
    apiFetch(`/dashboard/top-services?${params}&limit=5`, options),
    apiFetch(`/dashboard/technician-workload?${params}`, options),
  ]);

  return {
    summary: unwrap(summary),
    workOrdersByStatus: unwrap(workOrders) ?? [],
    jobsByStatus: unwrap(jobs) ?? [],
    revenueByMonth: unwrap(revenue) ?? [],
    topServices: unwrap(services) ?? [],
    technicianWorkload: unwrap(workload) ?? [],
  };
}
