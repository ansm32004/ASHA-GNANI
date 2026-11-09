import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { taskApi } from './taskApi';
import { SEEDED_VISITS } from '../local/mockData';

const STORAGE_KEY = '@sahayika_visits';

let _inMemoryVisits = null;
let _lastVisitFetchTime = 0;
const CACHE_TTL_MS = 25000; // 25 seconds

export const visitApi = {
  getVisits: async (params = {}) => {
    const now = Date.now();
    if (_inMemoryVisits && (now - _lastVisitFetchTime < CACHE_TTL_MS)) {
      return _inMemoryVisits;
    }

    try {
      const res = await apiClient.get('/visits', { params });
      if (Array.isArray(res.data) && res.data.length > 0) {
        _inMemoryVisits = res.data;
        _lastVisitFetchTime = Date.now();
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data)).catch(() => {});
        return res.data;
      }
      if (_inMemoryVisits) return _inMemoryVisits;
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = cached ? JSON.parse(cached) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        _inMemoryVisits = parsed;
        _lastVisitFetchTime = Date.now();
        return parsed;
      }
      return SEEDED_VISITS;
    } catch (e) {
      if (_inMemoryVisits) return _inMemoryVisits;
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = cached ? JSON.parse(cached) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        _inMemoryVisits = parsed;
        _lastVisitFetchTime = Date.now();
        return parsed;
      }
      return SEEDED_VISITS;
    }
  },

  getVisitById: async (visitId) => {
    if (_inMemoryVisits) {
      const found = _inMemoryVisits.find(v => v.id === visitId);
      if (found) return found;
    }
    try {
      const res = await apiClient.get(`/visits/${visitId}`);
      if (res.data) return res.data;
    } catch (e) {
      console.warn('Backend /visits/:id error, searching local visits cache:', e.message);
    }
    const list = _inMemoryVisits || SEEDED_VISITS;
    return list.find(v => v.id === visitId) || null;
  },

  confirmVisit: async (payload) => {
    let savedVisit = null;
    try {
      const res = await apiClient.post('/visits/confirm', payload);
      savedVisit = res.data;
    } catch (e) {
      console.warn('Backend /visits/confirm error, saving visit locally:', e.message);
      savedVisit = {
        id: `vis_${Date.now()}`,
        ...payload,
        status: 'Confirmed',
        created_at: new Date().toISOString()
      };
    }

    // 1. Update in-memory visits cache immediately
    if (_inMemoryVisits) {
      _inMemoryVisits = [savedVisit, ..._inMemoryVisits.filter(v => v && v.id !== savedVisit.id)];
    } else {
      _inMemoryVisits = [savedVisit];
    }
    _lastVisitFetchTime = Date.now();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryVisits)).catch(() => {});

    // 2. Update household's last_visit_date and next_follow_up in local storage
    if (payload.household_id) {
      try {
        const hhStr = await AsyncStorage.getItem('@sahayika_households');
        if (hhStr) {
          const hhList = JSON.parse(hhStr);
          const updatedHhs = hhList.map(h => {
            if (h.id === payload.household_id || h.household_id === payload.household_id) {
              return {
                ...h,
                last_visit_date: payload.visit_date,
                next_follow_up: payload.follow_up_date || h.next_follow_up
              };
            }
            return h;
          });
          await AsyncStorage.setItem('@sahayika_households', JSON.stringify(updatedHhs));
        }
      } catch (err) {
        console.warn('Error updating local household visit date:', err);
      }
    }

    // 3. Complete any existing pending task for this household in local tasks
    try {
      const tasksStr = await AsyncStorage.getItem('@sahayika_tasks');
      let tasks = tasksStr ? JSON.parse(tasksStr) : [];
      tasks = tasks.map(t => {
        if (
          (t.household_id === payload.household_id || t.household_name === payload.household_name) &&
          t.status !== 'Completed'
        ) {
          return {
            ...t,
            status: 'Completed',
            completion_notes: `Completed via visit on ${payload.visit_date}`
          };
        }
        return t;
      });

      // 4. If follow-up required, create follow-up task locally or ensure it's in tasks
      if (payload.follow_up_required && payload.follow_up_date) {
        const newTaskId = savedVisit.created_task_id || `task_${Date.now()}`;
        const alreadyExists = tasks.some(t => t.id === newTaskId);
        if (!alreadyExists) {
          tasks.unshift({
            id: newTaskId,
            household_id: payload.household_id,
            household_name: payload.household_name || payload.beneficiary_name || 'Household',
            beneficiary_name: payload.beneficiary_name,
            task_type: `${payload.activity_category || 'Health'} follow-up`,
            description: `Follow-up: ${payload.activity_description}`,
            due_date: payload.follow_up_date,
            priority: payload.priority || 'Priority',
            status: 'Upcoming',
            created_from: 'Visit',
            created_at: new Date().toISOString()
          });
        }
      }

      await AsyncStorage.setItem('@sahayika_tasks', JSON.stringify(tasks));
    } catch (err) {
      console.warn('Error updating tasks on visit confirm:', err);
    }

    // 5. Auto-resolve any active requests for this household in local storage
    try {
      const reqsStr = await AsyncStorage.getItem('@sahayika_requests');
      if (reqsStr) {
        const reqs = JSON.parse(reqsStr);
        if (Array.isArray(reqs)) {
          const updatedReqs = reqs.map(r => {
            if (
              (r.household_id === payload.household_id || r.household_name === payload.household_name) &&
              (r.status || '').toLowerCase() !== 'resolved' &&
              (r.status || '').toLowerCase() !== 'completed'
            ) {
              return {
                ...r,
                status: 'Resolved',
                response_history: [...(r.response_history || []), `Resolved via field visit on ${payload.visit_date}`]
              };
            }
            return r;
          });
          await AsyncStorage.setItem('@sahayika_requests', JSON.stringify(updatedReqs));
        }
      }
    } catch (err) {
      console.warn('Error updating requests on visit confirm:', err);
    }

    return savedVisit;
  }
};

