export const SERVICE_REPORT_STATUS_LABELS = {
  PENDIENTE: 'Pendiente',
  COMPLETADO: 'Completado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export function unwrapServiceReportData(response) {
  return response?.data ?? response;
}

export function unwrapServiceReportPage(response) {
  const data = unwrapServiceReportData(response) ?? {};
  const content = Array.isArray(data) ? data : data.content ?? [];
  return {
    content,
    page: Number(data.page ?? 0),
    size: Number(data.size ?? content.length),
    totalElements: Number(data.totalElements ?? content.length),
    totalPages: Number(data.totalPages ?? (content.length ? 1 : 0)),
  };
}

export function formatServiceReportDate(value) {
  if (!value) return 'Dato no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dato no disponible';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatServiceReportMoney(value) {
  if (value === null || value === undefined || value === '') return 'Dato no disponible';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
    .format(Number(value));
}

export function serviceReportStatusClass(status) {
  return `service-report-status service-report-status--${String(status || 'desconocido').toLowerCase()}`;
}

export function getServiceReportErrorMessage(error, action = 'consultar los reportes de servicio') {
  if (error?.status === 400) return `No fue posible ${action}: revisa la solicitud.`;
  if (error?.status === 401) return 'La sesión expiró o no es válida. Inicia sesión nuevamente.';
  if (error?.status === 403) return 'No tienes permiso para ver reportes de servicio.';
  if (error?.status === 404) return 'Reporte de servicio no encontrado.';
  if (error?.status >= 500) return 'Error inesperado del servidor. Intenta nuevamente.';
  return `No fue posible ${action}.`;
}

export function getServiceReportCreateErrorMessage(error) {
  if (error?.status === 400) return 'No fue posible crear el reporte: revisa la descripción y la fecha de entrega.';
  if (error?.status === 401) return 'La sesión expiró o no es válida. Inicia sesión nuevamente.';
  if (error?.status === 403) return 'No tienes permiso para crear reportes de servicio.';
  if (error?.status === 404) return 'El Job solicitado no existe.';
  if (error?.status === 409) return 'Este trabajo ya tiene reporte de servicio o ya no cumple las condiciones de cierre.';
  if (error?.status >= 500) return 'Error inesperado del servidor. Intenta nuevamente.';
  return 'No fue posible crear el reporte de servicio.';
}
