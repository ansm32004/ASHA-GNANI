import { apiClient } from './apiClient';
import { SEEDED_REQUESTS } from '../local/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sahayika_requests';

export const requestApi = {
  getRequests: async (params = {}) => {
    try {
      const res = await apiClient.get('/requests', { params });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    } catch (e) {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : SEEDED_REQUESTS;
    }
  },

  actOnRequest: async (requestId, action, notes = '') => {
    try {
      const res = await apiClient.post(`/requests/${requestId}/action`, { action, notes });
      return res.data;
    } catch (e) {
      const list = await requestApi.getRequests();
      const updated = list.map(r => {
        if (r.id === requestId) {
          const statusMap = {
            acknowledge: 'Acknowledged',
            resolve: 'Resolved',
            escalate: 'Escalated',
            in_progress: 'In progress'
          };
          return {
            ...r,
            status: statusMap[action.toLowerCase()] || r.status,
            response_history: [...(r.response_history || []), `${action} recorded`]
          };
        }
        return r;
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated.find(r => r.id === requestId);
    }
  },

  createRequest: async (payload) => {
    try {
      const res = await apiClient.post('/requests', payload);
      const list = await requestApi.getRequests();
      const updated = [res.data, ...list.filter(r => r.id !== res.data.id)];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return res.data;
    } catch (e) {
      const list = await requestApi.getRequests();
      const newReq = {
        id: `req_${Date.now()}`,
        household_id: payload.household_id || 'hh_001',
        household_name: payload.household_name || 'Meena Devi Household',
        beneficiary_name: payload.beneficiary_name || 'Meena Devi',
        contact_number: '9871100221',
        village: 'Rampur Kalan',
        category: payload.category || 'Household visit request',
        description: payload.description || 'Request for ASHA visit',
        time_received: 'Just now',
        priority: payload.priority || 'High',
        status: 'New',
        response_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const updated = [newReq, ...list];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newReq;
    }
  }
};

