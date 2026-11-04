import { apiClient } from './apiClient';

export const activityApi = {
  /**
   * Get logged ASHA field work activities
   * Expected backend endpoint: GET /api/v1/activities
   */
  getActivities: async (params = {}) => {
    try {
      const res = await apiClient.get('/activities', { params });
      return res.data;
    } catch (e) {
      return [];
    }
  },

  /**
   * Log a new verified field work activity
   * Expected backend endpoint: POST /api/v1/activities
   */
  logActivity: async (payload) => {
    const res = await apiClient.post('/activities', payload);
    return res.data;
  },

  /**
   * Get single work activity details
   * Expected backend endpoint: GET /api/v1/activities/{id}
   */
  getActivityById: async (id) => {
    const res = await apiClient.get(`/activities/${id}`);
    return res.data;
  }
};

export default activityApi;

