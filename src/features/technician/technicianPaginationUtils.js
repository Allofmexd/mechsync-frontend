export const DEFAULT_TECHNICIAN_PAGE_SIZE = 10;
export const TECHNICIAN_PAGE_SIZE_OPTIONS = [5, 10, 20];

const SERVICE_PAGE_SIZES = new Set([1, ...TECHNICIAN_PAGE_SIZE_OPTIONS]);

export function normalizeTechnicianPage(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeTechnicianPageSize(value) {
  const parsed = Number.parseInt(value, 10);
  return SERVICE_PAGE_SIZES.has(parsed) ? parsed : DEFAULT_TECHNICIAN_PAGE_SIZE;
}

export function unwrapTechnicianPage(response) {
  const data = response?.data ?? response ?? {};
  const content = Array.isArray(data) ? data : data.content ?? [];
  const page = Number(data.page ?? data.number ?? 0);
  const size = Number(data.size ?? content.length);
  const totalElements = Number(data.totalElements ?? content.length);
  const totalPages = Number(data.totalPages ?? (content.length ? 1 : 0));

  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    first: typeof data.first === 'boolean' ? data.first : page <= 0,
    last: typeof data.last === 'boolean'
      ? data.last
      : totalPages === 0 || page + 1 >= totalPages,
  };
}

export function getValidPageCorrection(requestedPage, pageData) {
  if (pageData.totalPages === 0 && requestedPage !== 0) return 0;
  if (pageData.totalPages > 0 && requestedPage >= pageData.totalPages) {
    return pageData.totalPages - 1;
  }
  return null;
}
