import { apiClient } from './apiClient';

let _guidesCache = null;
let _guidesTime = 0;
let _programsCache = null;
let _programsTime = 0;
const CACHE_TTL_MS = 60000;

export const contentApi = {
  /**
   * Get verified public health guide content by ID
   * Expected backend endpoint: GET /api/v1/content/guides/{id}
   */
  getGuide: async (guideId) => {
    if (_guidesCache) {
      const found = _guidesCache.find(g => g.id === guideId);
      if (found) return found;
    }
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
    const now = Date.now();
    if (_guidesCache && (now - _guidesTime < CACHE_TTL_MS)) {
      return _guidesCache;
    }
    try {
      const res = await apiClient.get('/content/guides', { params });
      _guidesCache = res.data;
      _guidesTime = Date.now();
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
    const now = Date.now();
    if (_programsCache && (now - _programsTime < CACHE_TTL_MS)) {
      return _programsCache;
    }
    try {
      const res = await apiClient.get('/content/programs');
      _programsCache = res.data;
      _programsTime = Date.now();
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

