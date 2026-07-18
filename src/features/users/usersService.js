import { apiFetch } from '../../shared/api/apiClient';
import { getRequiredAuthToken } from '../../shared/storage/authStorage';

export function createUser(payload) {
  return apiFetch('/users', {
    method: 'POST',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}

export function getUsers({ page = 0, size = 20 } = {}) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/users?${searchParams.toString()}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function getUserById(userId) {
  return apiFetch(`/users/${userId}`, {
    method: 'GET',
    token: getRequiredAuthToken(),
  });
}

export function updateUser(userId, payload) {
  return apiFetch(`/users/${userId}`, {
    method: 'PUT',
    token: getRequiredAuthToken(),
    body: JSON.stringify(payload),
  });
}

export function resetUserPassword(userId, newPassword) {
  return apiFetch(`/users/${userId}/password`, {
    method: 'PATCH',
    token: getRequiredAuthToken(),
    body: JSON.stringify({ newPassword }),
  });
}

export function changeUserRole(userId, role) {
  return apiFetch(`/users/${userId}/role`, {
    method: 'PATCH',
    token: getRequiredAuthToken(),
    body: JSON.stringify({ role }),
  });
}
