import { getWorkOrderStatuses } from '../catalogs/catalogsService';
import { getCurrentTechnician } from '../technicians/techniciansService';
import { getAssignedWorkOrders } from '../workOrders/workOrdersService';

const MAX_PAGE_SIZE = 100;

function unwrap(response) {
  return response?.data ?? response;
}

function unwrapCollection(response) {
  const data = unwrap(response);
  return Array.isArray(data) ? data : data?.content ?? [];
}

async function getAllAssignedWorkOrders() {
  const firstPage = unwrap(await getAssignedWorkOrders({ page: 0, size: MAX_PAGE_SIZE }));
  if (Array.isArray(firstPage)) return firstPage;

  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : [];
  const totalPages = Number(firstPage?.totalPages ?? (firstContent.length ? 1 : 0));
  if (totalPages <= 1) return firstContent;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getAssignedWorkOrders({ page: index + 1, size: MAX_PAGE_SIZE }),
    ),
  );

  return [
    ...firstContent,
    ...remainingPages.flatMap((response) => unwrapCollection(response)),
  ];
}

export async function getTechnicianWorkspace() {
  const technician = unwrap(await getCurrentTechnician());
  const [workOrders, statusesResponse] = await Promise.all([
    getAllAssignedWorkOrders(),
    getWorkOrderStatuses(),
  ]);

  return {
    technician,
    workOrders,
    statuses: unwrapCollection(statusesResponse),
  };
}
