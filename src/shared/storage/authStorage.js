const AUTH_TOKEN_KEY = 'mechsync.auth.token';

export function saveAuthToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('No se recibió un token de acceso válido.');
  }

  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    throw new Error('No fue posible guardar la sesión en este navegador.');
  }
}

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // No hay acción adicional si el almacenamiento no está disponible.
  }
}

export function getRequiredAuthToken() {
  const token = getAuthToken();

  if (!token) {
    const error = new Error('No hay una sesión activa. Inicia sesión nuevamente.');
    error.status = 401;
    throw error;
  }

  return token;
}
