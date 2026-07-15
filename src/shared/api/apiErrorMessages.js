export const AUTH_ERROR_MESSAGE =
  'Sesión inválida o sin permisos. Inicia sesión nuevamente.';

export function getApiErrorMessage(error, fallbackMessage) {
  if (error?.status === 401 || error?.status === 403) {
    return AUTH_ERROR_MESSAGE;
  }

  return error?.message || fallbackMessage;
}
