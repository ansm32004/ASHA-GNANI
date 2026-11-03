import { apiClient } from './apiClient';
import { SEEDED_HOUSEHOLDS } from '../local/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sahayika_households';

export const householdApi = {
  getHouseholds: async (params = {}) => {
    try {
      const res = await apiClient.get('/households', { params });
      // Cache locally
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    } catch (e) {
      console.log('Fetching households from local storage fallback');
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        let list = JSON.parse(cached);
        if (params.village && params.village !== 'All') {
          list = list.filter(h => h.village.toLowerCase() === params.village.toLowerCase());
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          list = list.filter(h =>
            h.primary_contact_name.toLowerCase().includes(q) ||
            h.household_id.toLowerCase().includes(q)
          );
        }
        return list;
      }
      return SEEDED_HOUSEHOLDS;
    }
  },

  getHouseholdById: async (id) => {
    try {
      const res = await apiClient.get(`/households/${id}`);
      return res.data;
    } catch (e) {
      const list = await householdApi.getHouseholds();
      return list.find(h => h.id === id || h.household_id === id) || SEEDED_HOUSEHOLDS[0];
    }
  },

  createHousehold: async (payload) => {
    try {
      const res = await apiClient.post('/households', payload);
      return res.data;
    } catch (e) {
      console.log('Saving new household locally');
      const list = await householdApi.getHouseholds();
      const newId = `hh_${list.length + 1}`;
      const newHh = {
        id: newId,
        household_id: `HH-${payload.village.substring(0, 2).toUpperCase()}-${String(list.length + 1).padStart(3, '0')}`,
        ...payload,
        members_count: (payload.members || []).length,
        priority: 'Routine',
        pending_tasks_count: 0
      };
      const updated = [newHh, ...list];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newHh;
    }
  }
};

