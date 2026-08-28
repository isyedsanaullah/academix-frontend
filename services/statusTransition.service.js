import api from './api';

/**
 * Status Transition Service
 * Client API methods for reversible status changes with exact operationId tracking.
 */

/**
 * Apply a status change to a College.
 * Returns { operationId, previousStatus, newStatus, expiresAt }.
 */
export const applyCollegeStatus = async (id, newStatus) => {
  const { data } = await api.post(`/colleges/${id}/status`, { newStatus });
  return data;
};

/**
 * Undo a College status change using the exact operationId.
 * Must be called within 5 seconds of the status change.
 */
export const undoCollegeStatus = async (id, operationId) => {
  const { data } = await api.post(`/colleges/${id}/undo-status`, { operationId });
  return data;
};

/**
 * Apply a status change to a Student.
 */
export const applyStudentStatus = async (id, newStatus) => {
  const { data } = await api.post(`/students/${id}/status`, { newStatus });
  return data;
};

/**
 * Undo a Student status change using the exact operationId.
 */
export const undoStudentStatus = async (id, operationId) => {
  const { data } = await api.post(`/students/${id}/undo-status`, { operationId });
  return data;
};

/**
 * Apply a status change to a User (staff account).
 */
export const applyUserStatus = async (id, newStatus) => {
  const { data } = await api.post(`/users/${id}/status`, { newStatus });
  return data;
};

/**
 * Undo a User status change using the exact operationId.
 */
export const undoUserStatus = async (id, operationId) => {
  const { data } = await api.post(`/users/${id}/undo-status`, { operationId });
  return data;
};
