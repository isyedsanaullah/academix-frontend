import api from './api';

/**
 * Activity Log Service
 * Client API methods to fetch activity logs and history for the logged in user.
 */
export const fetchActivityLogs = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.category && params.category !== 'All') queryParams.append('category', params.category);
  if (params.status && params.status !== 'All') queryParams.append('status', params.status);
  if (params.dateRange && params.dateRange !== 'all') queryParams.append('dateRange', params.dateRange);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.search) queryParams.append('search', params.search);
  if (params.college_id) queryParams.append('college_id', params.college_id);

  const response = await api.get(`/activity-logs?${queryParams.toString()}`);
  return response.data;
};

export default {
  fetchActivityLogs,
};
