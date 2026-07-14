const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = configuredBaseUrl?.replace(/\/+$/, '') ?? '';

function buildUrl(path) {
  if (!API_BASE_URL) {
    throw new Error(
      'VITE_API_BASE_URL no está configurada. Define la variable en el archivo .env.',
    );
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('La API devolvió una respuesta JSON inválida.');
    }
  }

  return text;
}

export async function apiFetch(path, options = {}) {
  const { token, headers: customHeaders, body, ...fetchOptions } = options;
  const headers = new Headers(customHeaders);

  headers.set('Accept', 'application/json');

  if (body != null && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response;

  try {
    response = await fetch(buildUrl(path), {
      ...fetchOptions,
      body,
      headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'No fue posible conectar con la API. Verifica la URL, CORS y la disponibilidad del backend.',
      );
    }

    throw error;
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const apiMessage =
      data && typeof data === 'object'
        ? data.message ?? data.error ?? data.detail
        : data;
    const message =
      typeof apiMessage === 'string' && apiMessage.trim()
        ? apiMessage
        : `La API respondió con el estado ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
