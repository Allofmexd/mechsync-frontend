export function getTechnicianResourceErrorMessage(error, resourceName) {
  if (error?.status === 400) return 'La solicitud no es válida.';
  if (error?.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (error?.status === 403) return `No tienes permiso para consultar ${resourceName}.`;
  if (error?.status === 404) return `${resourceName} no encontrado o no asignado a tu perfil.`;
  if (error?.status >= 500) return 'Ocurrió un error inesperado del servidor. Intenta nuevamente.';
  return `No fue posible cargar ${resourceName}.`;
}

export function technicianStatusClass(status) {
  return `technician-status technician-status--${String(status || 'desconocido')
    .toLowerCase()
    .replaceAll('_', '-')}`;
}
