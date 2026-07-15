import { apiFetch } from '../../shared/api/apiClient.js';

export function login(credentials) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function extractAccessToken(response) {
  return (
    response?.data?.token ??
    response?.data?.accessToken ??
    response?.token ??
    response?.accessToken ??
    null
  );
}
