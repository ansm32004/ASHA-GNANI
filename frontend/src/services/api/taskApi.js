import { apiClient } from './apiClient';
import { SEEDED_TASKS } from '../local/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sahayika_tasks';

export const taskApi = {
  getTasks: async (params = {}) => {
    try {
      const res = await apiClient.get('/tasks', { params });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    } catch (e) {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      let list = cached ? JSON.parse(cached) : SEEDED_TASKS;
      if (params.status && params.status !== 'All') {
        list = list.filter(t => t.status.toLowerCase() === params.status.toLowerCase());
      }
      return list;
    }
  },

  createTask: async (payload) => {
    try {
      const res = await apiClient.post('/tasks', payload);
      return res.data;
    } catch (e) {
      const tasks = await taskApi.getTasks();
      const newTask = {
        id: `task_${Date.now()}`,
        status: 'Upcoming',
        created_at: new Date().toISOString(),
        ...payload
      };
      const updated = [newTask, ...tasks];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newTask;
    }
  },

  completeTask: async (taskId, notes = '') => {
    try {
      const res = await apiClient.post(`/tasks/${taskId}/complete`, { notes });
      return res.data;
    } catch (e) {
      const tasks = await taskApi.getTasks();
      const updated = tasks.map(t =>
        t.id === taskId ? { ...t, status: 'Completed', completion_notes: notes } : t
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated.find(t => t.id === taskId);
    }
  },

  rescheduleTask: async (taskId, newDueDate, notes = '') => {
    try {
      const res = await apiClient.post(`/tasks/${taskId}/reschedule`, { new_due_date: newDueDate, notes });
      return res.data;
    } catch (e) {
      const tasks = await taskApi.getTasks();
      const updated = tasks.map(t =>
        t.id === taskId ? { ...t, due_date: newDueDate, status: 'Upcoming' } : t
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated.find(t => t.id === taskId);
    }
  }
};

