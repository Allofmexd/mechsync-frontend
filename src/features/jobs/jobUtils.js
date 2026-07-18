export const JOB_STATUS_LABELS = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

export function unwrapApiData(response) {
  return response?.data ?? response;
}

export function unwrapJobPage(response) {
  const data = unwrapApiData(response) ?? {};
  const content = Array.isArray(data) ? data : data.content ?? [];
  return {
    content,
    page: Number(data.page ?? 0),
    size: Number(data.size ?? content.length),
    totalElements: Number(data.totalElements ?? content.length),
    totalPages: Number(data.totalPages ?? (content.length ? 1 : 0)),
  };
}

export function getJobErrorMessage(error, action = 'completar la operación') {
  if (error?.status === 400) return `No fue posible ${action}: revisa los datos enviados.`;
  if (error?.status === 401) return 'La sesión expiró o no es válida. Inicia sesión nuevamente.';
  if (error?.status === 403) return 'Solo administradores pueden gestionar trabajos.';
  if (error?.status === 404) return 'El trabajo o recurso relacionado no existe.';
  if (error?.status === 409) return 'Acción no permitida para el estado actual o conflicto de negocio.';
  if (error?.status >= 500) return 'El servidor no pudo completar la operación. Intenta nuevamente.';
  return `No fue posible ${action}.`;
}

export function formatJobDate(value) {
  if (!value) return 'Dato no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dato no disponible';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatJobMoney(value) {
  if (value === null || value === undefined || value === '') return 'Dato no disponible';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
    .format(Number(value));
}

export function parseMoneyToCents(value) {
  const normalized = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [integer, fraction = ''] = normalized.split('.');
  return BigInt(integer) * 100n + BigInt(fraction.padEnd(2, '0'));
}

export function centsToMoney(value) {
  const integer = value / 100n;
  const fraction = (value % 100n).toString().padStart(2, '0');
  return `${integer}.${fraction}`;
}

export function validateCompletionAmounts(subtotal, iva, total) {
  const subtotalCents = parseMoneyToCents(subtotal);
  const ivaCents = parseMoneyToCents(iva);
  const totalCents = parseMoneyToCents(total);
  if (subtotalCents === null || ivaCents === null || totalCents === null) {
    return { valid: false, message: 'Los importes deben ser no negativos y tener máximo 2 decimales.' };
  }
  if (subtotalCents + ivaCents !== totalCents) {
    return { valid: false, message: 'El total real debe ser igual al subtotal más IVA.' };
  }
  return {
    valid: true,
    subtotal: centsToMoney(subtotalCents),
    iva: centsToMoney(ivaCents),
    total: centsToMoney(totalCents),
  };
}

export function technicianName(technician, technicianId) {
  return technician?.fullName
    || [technician?.firstName, technician?.lastName].filter(Boolean).join(' ')
    || (technicianId ? `Técnico #${technicianId}` : 'Dato no disponible');
}
