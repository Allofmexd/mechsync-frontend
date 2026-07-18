import { apiFetch } from '../../shared/api/apiClient.js';
import { getRequiredAuthToken } from '../../shared/storage/authStorage.js';

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

export function extractAuthenticatedUser(response) {
  return response?.data?.user ?? response?.user ?? null;
}

export function getCurrentUser() {
  return apiFetch('/auth/me', {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}
