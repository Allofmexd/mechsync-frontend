import { apiFetch } from '../../shared/api/apiClient.js';
import { getRequiredAuthToken } from '../../shared/storage/authStorage.js';

const PAGE_SIZE_OPTIONS = new Set([1, 5, 10, 20, 100]);

function unwrapData(response) {
  return response?.data ?? response;
}

function normalizePage(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeSize(value) {
  const parsed = Number.parseInt(value, 10);
  return PAGE_SIZE_OPTIONS.has(parsed) ? parsed : 20;
}

export function normalizeCustomerPortalPage(response) {
  const data = unwrapData(response) ?? {};
  const content = Array.isArray(data.content) ? data.content : [];
  const page = normalizePage(data.page);
  const size = Number(data.size ?? content.length);
  const totalElements = Number(data.totalElements ?? content.length);
  const totalPages = Number(data.totalPages ?? (content.length ? 1 : 0));

  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    first: page <= 0,
    last: totalPages === 0 || page + 1 >= totalPages,
  };
}

export const normalizeCustomerVehiclePage = normalizeCustomerPortalPage;

function positiveId(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`El identificador de ${label} no es válido.`);
    error.status = 400;
    throw error;
  }
  return parsed;
}

function queryString({ page = 0, size = 20, ...filters }) {
  const params = new URLSearchParams({
    page: String(normalizePage(page)),
    size: String(normalizeSize(size)),
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

async function getPortalPage(path, options = {}) {
  const { signal, ...params } = options;
  const response = await apiFetch(`${path}?${queryString(params)}`, {
    method: 'GET', token: getRequiredAuthToken(), signal,
  });
  return normalizeCustomerPortalPage(response);
}

async function getPortalResource(path, signal) {
  const response = await apiFetch(path, {
    method: 'GET', token: getRequiredAuthToken(), signal,
  });
  return unwrapData(response);
}

export async function getCustomerProfile({ signal } = {}) {
  return getPortalResource('/customer-portal/profile', signal);
}

export function getCustomerVehicles(options = {}) {
  return getPortalPage('/customer-portal/vehicles', options);
}

export function getCustomerVehicle(vehicleId, { signal } = {}) {
  return getPortalResource(
    `/customer-portal/vehicles/${positiveId(vehicleId, 'vehículo')}`,
    signal,
  );
}

export function getCustomerIntakes(options = {}) {
  const vehicleId = options.vehicleId ? positiveId(options.vehicleId, 'vehículo') : undefined;
  return getPortalPage('/customer-portal/vehicle-intakes', { ...options, vehicleId });
}

export function getCustomerIntake(intakeId, { signal } = {}) {
  return getPortalResource(
    `/customer-portal/vehicle-intakes/${positiveId(intakeId, 'ingreso')}`,
    signal,
  );
}

export function getCustomerWorkOrders(options = {}) {
  const vehicleId = options.vehicleId ? positiveId(options.vehicleId, 'vehículo') : undefined;
  const intakeId = options.intakeId ? positiveId(options.intakeId, 'ingreso') : undefined;
  return getPortalPage('/customer-portal/work-orders', { ...options, vehicleId, intakeId });
}

export function getCustomerWorkOrder(workOrderId, { signal } = {}) {
  return getPortalResource(
    `/customer-portal/work-orders/${positiveId(workOrderId, 'orden de trabajo')}`,
    signal,
  );
}

export function getCustomerQuotation(workOrderId, { signal } = {}) {
  return getPortalResource(
    `/customer-portal/work-orders/${positiveId(workOrderId, 'orden de trabajo')}/quotation`,
    signal,
  );
}

export function getCustomerJobs(options = {}) {
  const vehicleId = options.vehicleId ? positiveId(options.vehicleId, 'vehículo') : undefined;
  const workOrderId = options.workOrderId
    ? positiveId(options.workOrderId, 'orden de trabajo')
    : undefined;
  return getPortalPage('/customer-portal/jobs', { ...options, vehicleId, workOrderId });
}

export function getCustomerJob(jobId, { signal } = {}) {
  return getPortalResource(`/customer-portal/jobs/${positiveId(jobId, 'trabajo')}`, signal);
}

export function getCustomerHistory(options = {}) {
  const vehicleId = options.vehicleId ? positiveId(options.vehicleId, 'vehículo') : undefined;
  return getPortalPage('/customer-portal/history', { ...options, vehicleId });
}
