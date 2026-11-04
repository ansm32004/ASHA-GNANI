import { apiClient } from './apiClient';

export const contentApi = {
  /**
   * Get verified public health guide content by ID
   * Expected backend endpoint: GET /api/v1/content/guides/{id}
   */
  getGuide: async (guideId) => {
    try {
      const res = await apiClient.get(`/content/guides/${guideId}`);
      return res.data;
    } catch (e) {
      // Screen will use local fallback guide content
      return null;
    }
  },

  /**
   * List all available health education guides
   * Expected backend endpoint: GET /api/v1/content/guides
   */
  listGuides: async (params = {}) => {
    try {
      const res = await apiClient.get('/content/guides', { params });
      return res.data;
    } catch (e) {
      return [
        { id: 'pregnancy', category: 'maternal', title: 'गर्भावस्था देखभाल (Pregnancy Care)' },
        { id: 'women', category: 'women', title: 'महिला स्वास्थ्य (Women Health)' },
        { id: 'child', category: 'child', title: 'शिशु देखभाल (Child Care)' },
        { id: 'nutrition', category: 'nutrition', title: 'पोषण एवं आहार (Nutrition & Diet)' }
      ];
    }
  },

  /**
   * Get latest government health programme updates (JSY, PMMVY, etc.)
   * Expected backend endpoint: GET /api/v1/content/programs
   */
  getProgramUpdates: async () => {
    try {
      const res = await apiClient.get('/content/programs');
      return res.data;
    } catch (e) {
      return [
        {
          id: 'jsy',
          badge: 'National Health Mission',
          title: 'Janani Suraksha Yojana (JSY)',
          benefit_amount: 1400,
          asha_incentive: 600,
          description: 'Institutional delivery assistance for rural mothers.'
        }
      ];
    }
  }
};

export default contentApi;

