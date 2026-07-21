export function getCustomerPortalErrorMessage(error, resource = 'la información') {
  if (error?.status === 400) return 'La solicitud no es válida.';
  if (error?.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (error?.status === 403) {
    return 'Tu cuenta todavía no está asociada a un perfil de cliente. Contacta al taller.';
  }
  if (error?.status === 404) return `${resource} no está disponible o no fue encontrado.`;
  if (error?.status >= 500) return 'Ocurrió un error inesperado. Intenta nuevamente.';
  return `No fue posible cargar ${resource}.`;
}

export function formatCustomerMileage(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${new Intl.NumberFormat('es-MX').format(number)} km` : 'No registrado';
}

export function formatCustomerDate(value) {
  if (!value) return 'No registrada';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'No registrada'
    : new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(date);
}

export function formatCustomerDateTime(value) {
  if (!value) return 'No registrada';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'No registrada'
    : new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatCustomerMoney(value, currency = 'MXN') {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(number)
    : 'No registrado';
}

export function formatCustomerQuantity(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat('es-MX', { maximumFractionDigits: 4 }).format(number)
    : 'No registrada';
}
