import { apiClient } from './apiClient';
import { SEEDED_HOUSEHOLDS } from '../local/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sahayika_households';

let _inMemoryHouseholds = null;
let _lastFetchTime = 0;
const CACHE_TTL_MS = 25000; // 25 seconds

const applyFilters = (list, params = {}) => {
  let filtered = list;
  if (params.village && params.village !== 'All') {
    filtered = filtered.filter(h => h && (h.village || '').toLowerCase() === params.village.toLowerCase());
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(h =>
      h &&
      ((h.primary_contact_name || '').toLowerCase().includes(q) ||
      (h.household_id || '').toLowerCase().includes(q))
    );
  }
  return filtered;
};

export const householdApi = {
  getHouseholds: async (params = {}) => {
    const now = Date.now();
    // 0ms instant cache hit if fresh
    if (_inMemoryHouseholds && (now - _lastFetchTime < CACHE_TTL_MS)) {
      return applyFilters(_inMemoryHouseholds, params);
    }

    try {
      const res = await apiClient.get('/households');
      if (Array.isArray(res.data)) {
        _inMemoryHouseholds = res.data;
        _lastFetchTime = Date.now();
        // Asynchronous non-blocking storage write
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data)).catch(() => {});
        return applyFilters(res.data, params);
      }
      return applyFilters(SEEDED_HOUSEHOLDS, params);
    } catch (e) {
      if (_inMemoryHouseholds) {
        return applyFilters(_inMemoryHouseholds, params);
      }
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list)) {
            _inMemoryHouseholds = list;
            _lastFetchTime = Date.now();
            return applyFilters(list, params);
          }
        }
      } catch (err) {
        // fallback
      }
      return applyFilters(SEEDED_HOUSEHOLDS, params);
    }
  },

  getHouseholdById: async (id) => {
    if (_inMemoryHouseholds) {
      const found = _inMemoryHouseholds.find(h => h.id === id || h.household_id === id);
      if (found) return found;
    }
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
      const newHh = res.data;
      if (_inMemoryHouseholds) {
        _inMemoryHouseholds = [newHh, ..._inMemoryHouseholds.filter(h => h.id !== newHh.id)];
      } else {
        _inMemoryHouseholds = [newHh];
      }
      _lastFetchTime = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryHouseholds)).catch(() => {});
      return newHh;
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
      _inMemoryHouseholds = [newHh, ...list];
      _lastFetchTime = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryHouseholds)).catch(() => {});
      return newHh;
    }
  }
};

