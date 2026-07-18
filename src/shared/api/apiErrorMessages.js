export const AUTH_ERROR_MESSAGE =
  'Sesión inválida o sin permisos. Inicia sesión nuevamente.';

export function getApiErrorMessage(error, fallbackMessage) {
  if (error?.status === 401 || error?.status === 403) {
    return AUTH_ERROR_MESSAGE;
  }

  return error?.message || fallbackMessage;
}

export function getAdminApiErrorMessage(error, action = 'completar la operación') {
  if (error?.status === 400) return `No fue posible ${action}: revisa los campos y formatos enviados.`;
  if (error?.status === 401) return 'La sesión expiró o no es válida. Inicia sesión nuevamente.';
  if (error?.status === 403) return 'No tienes permisos para realizar esta acción.';
  if (error?.status === 404) return 'El recurso solicitado no existe o ya no está disponible.';
  if (error?.status === 409) return `No fue posible ${action} por un conflicto o dependencias existentes.`;
  if (error?.status >= 500) return 'El servidor no pudo completar la operación. Intenta nuevamente o verifica el entorno.';
  return `No fue posible ${action}.`;
}
