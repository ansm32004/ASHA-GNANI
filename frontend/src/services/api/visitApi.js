import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { taskApi } from './taskApi';

const STORAGE_KEY = '@sahayika_visits';

export const visitApi = {
  getVisits: async (params = {}) => {
    try {
      const res = await apiClient.get('/visits', { params });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    } catch (e) {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    }
  },

  confirmVisit: async (payload) => {
    try {
      const res = await apiClient.post('/visits/confirm', payload);
      return res.data;
    } catch (e) {
      console.log('Confirming visit locally with auto-task generation');
      const visits = await visitApi.getVisits();
      const newVisit = {
        id: `vis_${Date.now()}`,
        ...payload,
        status: 'Confirmed',
        created_at: new Date().toISOString()
      };
      
      // Auto-create task if follow-up required
      if (payload.follow_up_required && payload.follow_up_date) {
        await taskApi.createTask({
          household_id: payload.household_id,
          household_name: payload.household_name || 'Household',
          beneficiary_name: payload.beneficiary_name,
          task_type: `${payload.activity_category || 'Health'} follow-up`,
          description: `Follow-up: ${payload.activity_description}`,
          due_date: payload.follow_up_date,
          priority: payload.priority || 'Priority',
          created_from: 'Visit'
        });
      }

      const updated = [newVisit, ...visits];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newVisit;
    }
  }
};

