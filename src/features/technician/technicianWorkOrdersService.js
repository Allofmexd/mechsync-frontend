import { getAssignedWorkOrders } from '../workOrders/workOrdersService';
import {
  normalizeTechnicianPage,
  normalizeTechnicianPageSize,
  unwrapTechnicianPage,
} from './technicianPaginationUtils';

export async function listAssignedWorkOrders({ page = 0, size = 10, signal } = {}) {
  const response = await getAssignedWorkOrders({
    page: normalizeTechnicianPage(page),
    size: normalizeTechnicianPageSize(size),
    signal,
  });

  return unwrapTechnicianPage(response);
}
