import { apiClient } from './apiClient';
import { SEEDED_TASKS } from '../local/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sahayika_tasks';

let _inMemoryTasks = null;
let _lastTaskFetchTime = 0;
const CACHE_TTL_MS = 25000; // 25 seconds

const filterTasks = (list, params = {}) => {
  let result = list;
  if (params.status && params.status !== 'All') {
    result = result.filter(t => t && (t.status || '').toLowerCase() === params.status.toLowerCase());
  }
  return result;
};

export const taskApi = {
  getTasks: async (params = {}) => {
    const now = Date.now();
    // 0ms instant cache hit
    if (_inMemoryTasks && (now - _lastTaskFetchTime < CACHE_TTL_MS)) {
      return filterTasks(_inMemoryTasks, params);
    }

    try {
      const res = await apiClient.get('/tasks');
      const remote = Array.isArray(res.data) ? res.data : [];
      let local = _inMemoryTasks || [];
      if (!local.length) {
        try {
          const cached = await AsyncStorage.getItem(STORAGE_KEY);
          const parsed = cached ? JSON.parse(cached) : [];
          local = Array.isArray(parsed) ? parsed : [];
        } catch (err) {
          local = [];
        }
      }
      const map = new Map();
      local.forEach(t => t && t.id && map.set(t.id, t));
      remote.forEach(t => t && t.id && map.set(t.id, t));
      const merged = Array.from(map.values());
      _inMemoryTasks = merged;
      _lastTaskFetchTime = Date.now();

      // Non-blocking async persist
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
      return filterTasks(merged, params);
    } catch (e) {
      if (_inMemoryTasks) {
        return filterTasks(_inMemoryTasks, params);
      }
      let list = SEEDED_TASKS;
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = cached ? JSON.parse(cached) : null;
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      } catch (err) {
        list = SEEDED_TASKS;
      }
      _inMemoryTasks = list;
      _lastTaskFetchTime = Date.now();
      return filterTasks(list, params);
    }
  },

  getTaskById: async (taskId) => {
    if (_inMemoryTasks) {
      const found = _inMemoryTasks.find(t => t.id === taskId);
      if (found) return found;
    }
    try {
      const res = await apiClient.get(`/tasks/${taskId}`);
      return res.data;
    } catch (e) {
      console.warn('Backend /tasks/:id error, searching local tasks cache:', e.message);
      const list = _inMemoryTasks || SEEDED_TASKS;
      return list.find(t => t.id === taskId) || null;
    }
  },

  createTask: async (payload) => {
    try {
      const res = await apiClient.post('/tasks', payload);
      const newTask = res.data;
      if (_inMemoryTasks) {
        _inMemoryTasks = [newTask, ..._inMemoryTasks.filter(t => t.id !== newTask.id)];
      } else {
        _inMemoryTasks = [newTask];
      }
      _lastTaskFetchTime = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryTasks)).catch(() => {});
      return newTask;
    } catch (e) {
      const tasks = await taskApi.getTasks();
      const newTask = {
        id: `task_${Date.now()}`,
        status: 'Upcoming',
        created_at: new Date().toISOString(),
        ...payload
      };
      _inMemoryTasks = [newTask, ...tasks];
      _lastTaskFetchTime = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryTasks)).catch(() => {});
      return newTask;
    }
  },

  completeTask: async (taskId, notes = '') => {
    let completedTask = null;
    try {
      const res = await apiClient.post(`/tasks/${taskId}/complete`, { notes });
      completedTask = res.data;
      if (_inMemoryTasks) {
        _inMemoryTasks = _inMemoryTasks.map(t => t.id === taskId ? completedTask : t);
      }
    } catch (e) {
      const tasks = await taskApi.getTasks();
      const updated = tasks.map(t =>
        t.id === taskId ? { ...t, status: 'Completed', completion_notes: notes } : t
      );
      _inMemoryTasks = updated;
      _lastTaskFetchTime = Date.now();
      completedTask = updated.find(t => t.id === taskId);
    }

    if (_inMemoryTasks) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryTasks)).catch(() => {});
    }

    // Auto-resolve any linked community request in local storage so community screen updates immediately
    try {
      const reqsStr = await AsyncStorage.getItem('@sahayika_requests');
      if (reqsStr) {
        const reqs = JSON.parse(reqsStr);
        if (Array.isArray(reqs)) {
          const reqId = completedTask?.created_from_request_id;
          const hhId = completedTask?.household_id;
          const updatedReqs = reqs.map(r => {
            if ((reqId && r.id === reqId) || (hhId && r.household_id === hhId)) {
              return {
                ...r,
                status: 'Resolved',
                response_history: [...(r.response_history || []), `Resolved: ${notes || 'Completed during home visit'}`]
              };
            }
            return r;
          });
          await AsyncStorage.setItem('@sahayika_requests', JSON.stringify(updatedReqs));
        }
      }
    } catch (err) {
      console.warn('Error auto-resolving local request:', err);
    }

    return completedTask;
  },

  rescheduleTask: async (taskId, newDueDate, notes = '') => {
    try {
      const res = await apiClient.post(`/tasks/${taskId}/reschedule`, { new_due_date: newDueDate, notes });
      if (_inMemoryTasks) {
        _inMemoryTasks = _inMemoryTasks.map(t => t.id === taskId ? res.data : t);
      }
      try {
        const { notificationApi } = require('./notificationApi');
        notificationApi.invalidateCache();
      } catch (_) {}
      return res.data;
    } catch (e) {
      const tasks = await taskApi.getTasks();
      const updated = tasks.map(t =>
        t.id === taskId ? { ...t, due_date: newDueDate, status: 'Upcoming' } : t
      );
      _inMemoryTasks = updated;
      _lastTaskFetchTime = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});

      // Create fallback notification locally
      try {
        const targetTask = tasks.find(t => t.id === taskId);
        const ben = targetTask?.beneficiary_name || targetTask?.household_name || 'Family';
        const notifKey = '@sahayika_notifications';
        const raw = await AsyncStorage.getItem(notifKey);
        const notifs = raw ? JSON.parse(raw) : [];
        const newNotif = {
          id: `notif_${Date.now()}`,
          title: 'Visit Rescheduled',
          message: `Home visit for ${ben} has been rescheduled to ${newDueDate} by ASHA worker.${notes ? ` (Reason: ${notes})` : ''}`,
          category: 'Follow-up due',
          priority: 'High',
          is_read: false,
          timestamp: 'Just now',
          created_at: new Date().toISOString(),
          metadata: { household_id: targetTask?.household_id, task_id: taskId }
        };
        notifs.unshift(newNotif);
        await AsyncStorage.setItem(notifKey, JSON.stringify(notifs));
        const { notificationApi } = require('./notificationApi');
        notificationApi.invalidateCache();
      } catch (_) {}

      return updated.find(t => t.id === taskId);
    }
  }
};

