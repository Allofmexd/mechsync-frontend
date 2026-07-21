import { unwrapJobPage } from '../jobs/jobUtils';
import { unwrapServiceReportPage } from '../serviceReports/serviceReportUtils';
import { getCurrentTechnician } from '../technicians/techniciansService';
import { getAssignedWorkOrders } from '../workOrders/workOrdersService';
import { listAssignedJobs } from './technicianJobsService';
import { listAssignedServiceReports } from './technicianServiceReportsService';

const WORK_ORDER_PREVIEW_SIZE = 5;

function unwrapApiData(response) {
  return response?.data ?? response;
}

function unwrapWorkOrderPage(response) {
  const data = unwrapApiData(response) ?? {};
  const content = Array.isArray(data) ? data : data.content ?? [];

  return {
    content,
    totalElements: Number(data.totalElements ?? content.length),
  };
}

export async function getTechnicianDashboardData() {
  const [technicianResponse, workOrdersResponse, jobsResponse, reportsResponse] = await Promise.all([
    getCurrentTechnician(),
    getAssignedWorkOrders({ page: 0, size: WORK_ORDER_PREVIEW_SIZE }),
    listAssignedJobs({ page: 0, size: 1 }),
    listAssignedServiceReports({ page: 0, size: 1 }),
  ]);

  const workOrders = unwrapWorkOrderPage(workOrdersResponse);

  return {
    technician: unwrapApiData(technicianResponse),
    workOrders: workOrders.content,
    workOrderCount: workOrders.totalElements,
    jobCount: unwrapJobPage(jobsResponse).totalElements,
    serviceReportCount: unwrapServiceReportPage(reportsResponse).totalElements,
  };
}
