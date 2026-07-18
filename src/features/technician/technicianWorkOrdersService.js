import { getWorkOrderStatuses } from '../catalogs/catalogsService';
import { getTechnicians } from '../technicians/techniciansService';
import { getWorkOrders } from '../workOrders/workOrdersService';

const MAX_PAGE_SIZE = 100;

function unwrap(response) {
  return response?.data ?? response;
}

function unwrapCollection(response) {
  const data = unwrap(response);
  return Array.isArray(data) ? data : data?.content ?? [];
}

async function getAllWorkOrders() {
  const firstPage = unwrap(await getWorkOrders({ page: 0, size: MAX_PAGE_SIZE }));
  if (Array.isArray(firstPage)) return firstPage;

  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : [];
  const totalPages = Number(firstPage?.totalPages ?? (firstContent.length ? 1 : 0));
  if (totalPages <= 1) return firstContent;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getWorkOrders({ page: index + 1, size: MAX_PAGE_SIZE }),
    ),
  );

  return [
    ...firstContent,
    ...remainingPages.flatMap((response) => unwrapCollection(response)),
  ];
}

export async function getTechnicianWorkspace(userId) {
  if (userId === null || userId === undefined || userId === '') {
    throw new Error('No fue posible identificar al usuario autenticado.');
  }

  const technicians = unwrapCollection(await getTechnicians());
  const technician = technicians.find((item) => String(item.userId) === String(userId)) ?? null;

  if (!technician) {
    return { technician: null, workOrders: [], statuses: [] };
  }

  const [workOrders, statusesResponse] = await Promise.all([
    getAllWorkOrders(),
    getWorkOrderStatuses(),
  ]);

  return {
    technician,
    workOrders: workOrders.filter(
      (workOrder) => String(workOrder.technicianId) === String(technician.id),
    ),
    statuses: unwrapCollection(statusesResponse),
  };
}
