import api from './api';

/**
 * Trash Service
 * Client API methods for Trash functionality.
 */

/**
 * Fetch authorized trash items for the current user.
 */
export const fetchTrash = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page)  queryParams.append('page',  params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  const qs = queryParams.toString();
  const { data } = await api.get(`/trash${qs ? `?${qs}` : ''}`);
  return data;
};

/**
 * Restore a soft-deleted item from Trash.
 * @param {string} resourceType - e.g. 'announcement', 'assignment', 'quiz'
 * @param {string} id - Resource ID
 */
export const restoreTrashItem = async (resourceType, id) => {
  const { data } = await api.post(`/trash/${resourceType}/${id}/restore`);
  return data;
};
