import { apiClient } from './apiClient';
import { SEEDED_REQUESTS } from '../local/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sahayika_requests';

let _inMemoryRequests = null;
let _lastReqFetchTime = 0;
const CACHE_TTL_MS = 25000; // 25 seconds

export const requestApi = {
  getRequests: async (params = {}) => {
    const now = Date.now();
    if (_inMemoryRequests && (now - _lastReqFetchTime < CACHE_TTL_MS)) {
      return _inMemoryRequests;
    }

    try {
      const res = await apiClient.get('/requests', { params });
      if (Array.isArray(res.data)) {
        _inMemoryRequests = res.data;
        _lastReqFetchTime = Date.now();
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data)).catch(() => {});
        return res.data;
      }
      return _inMemoryRequests || SEEDED_REQUESTS;
    } catch (e) {
      if (_inMemoryRequests) return _inMemoryRequests;
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = cached ? JSON.parse(cached) : null;
        if (Array.isArray(parsed) && parsed.length > 0) {
          _inMemoryRequests = parsed;
          _lastReqFetchTime = Date.now();
          return parsed;
        }
      } catch (err) {
        // fallback
      }
      return SEEDED_REQUESTS;
    }
  },

  actOnRequest: async (requestId, action, notes = '') => {
    const statusMap = {
      acknowledge: 'Acknowledged',
      resolve: 'Resolved',
      escalate: 'Escalated',
      in_progress: 'In progress'
    };
    try {
      const res = await apiClient.post(`/requests/${requestId}/action`, { action, notes });
      if (_inMemoryRequests) {
        _inMemoryRequests = _inMemoryRequests.map(r => r.id === requestId ? res.data : r);
      }
      return res.data;
    } catch (e) {
      const list = await requestApi.getRequests();
      const safeList = Array.isArray(list) ? list : [];
      const updated = safeList.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            status: statusMap[action.toLowerCase()] || r.status,
            response_history: [...(r.response_history || []), `${action} recorded`]
          };
        }
        return r;
      });
      _inMemoryRequests = updated;
      _lastReqFetchTime = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated.find(r => r.id === requestId);
    }
  },

  createRequest: async (payload) => {
    let savedReq = null;
    try {
      const res = await apiClient.post('/requests', payload);
      savedReq = res.data;
      console.log('[requestApi] Request saved to backend successfully:', savedReq?.id);
    } catch (e) {
      console.warn('Backend /requests error, falling back locally:', e.message);
      savedReq = {
        id: `req_${Date.now()}`,
        household_id: payload.household_id || 'hh_001',
        household_name: payload.household_name || 'Meena Devi Household',
        beneficiary_name: payload.beneficiary_name || 'Meena Devi',
        contact_number: '9871100221',
        village: 'Rampur Kalan',
        category: payload.category || 'Household visit request',
        description: payload.description || 'Request for ASHA visit',
        preferred_date: payload.preferred_date || null,
        time_received: 'Just now',
        priority: payload.priority || 'High',
        status: 'New',
        response_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // 1. Update in-memory requests immediately
    const list = _inMemoryRequests || [];
    _inMemoryRequests = [savedReq, ...list.filter(r => r && r.id !== savedReq.id)];
    _lastReqFetchTime = Date.now();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryRequests)).catch(() => {});

    // 2. Immediately create Notification for the ASHA worker in local @sahayika_notifications (at the very top)
    try {
      const notifsStr = await AsyncStorage.getItem('@sahayika_notifications');
      let notifs = [];
      try {
        const parsed = notifsStr ? JSON.parse(notifsStr) : [];
        notifs = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        notifs = [];
      }
      const prefDate = payload.preferred_date || savedReq.preferred_date;
      let notifMsg = `${savedReq.beneficiary_name || payload.beneficiary_name || 'Family member'} requested a visit: ${savedReq.description || payload.description}`;
      if (prefDate) {
        notifMsg += ` • Preferred Call/Visit: ${prefDate}`;
      }
      const newNotif = {
        id: `notif_${Date.now()}`,
        title: `Visit Request: ${savedReq.household_name || payload.household_name || 'Household'} (${savedReq.category || payload.category})`,
        message: notifMsg,
        category: payload.priority === 'Urgent' ? 'Urgent request' : 'Community request',
        priority: payload.priority || 'High',
        is_read: false,
        timestamp: 'Just now',
        created_at: new Date().toISOString(),
        action_type: 'request',
        action_id: savedReq.id,
        metadata: {
          household_id: savedReq.household_id || payload.household_id,
          preferred_date: prefDate
        }
      };
      // Prepend at the VERY START so it comes first
      const updatedNotifs = [newNotif, ...notifs.filter(n => n && n.id !== newNotif.id && n.action_id !== savedReq.id)];
      await AsyncStorage.setItem('@sahayika_notifications', JSON.stringify(updatedNotifs));
    } catch (err) {
      console.warn('Error updating local notifications for visit request:', err);
    }

    // 3. Immediately schedule a task in local @sahayika_tasks for the ASHA worker's schedule
    try {
      const tasksStr = await AsyncStorage.getItem('@sahayika_tasks');
      let tasks = [];
      try {
        const parsed = tasksStr ? JSON.parse(tasksStr) : [];
        tasks = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        tasks = [];
      }
      const prefDate = payload.preferred_date || savedReq.preferred_date;
      const todayDate = new Date().toISOString().split('T')[0];
      let taskDueDate = todayDate;
      if (prefDate && typeof prefDate === 'string' && prefDate.includes('-')) {
        const parts = prefDate.trim().split('-');
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
          taskDueDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (parts.length === 3 && parts[0].length === 4) {
          taskDueDate = prefDate.trim();
        }
      }
      let taskDesc = `Community Request: ${savedReq.description || payload.description}`;
      if (prefDate) {
        taskDesc += ` (Preferred Date: ${prefDate})`;
      }
      const newTaskId = `task_req_${savedReq.id || Date.now()}`;
      const newTask = {
        id: newTaskId,
        household_id: savedReq.household_id || payload.household_id || 'hh_001',
        household_name: savedReq.household_name || payload.household_name || 'Meena Devi Household',
        beneficiary_name: savedReq.beneficiary_name || payload.beneficiary_name || 'Meena Devi',
        village: savedReq.village || 'Rampur Kalan',
        task_type: `${savedReq.category || payload.category || 'Household visit'} (Requested)`,
        description: taskDesc,
        due_date: taskDueDate,
        priority: savedReq.priority || payload.priority || 'High',
        status: taskDueDate === todayDate ? 'Due today' : 'Upcoming',
        created_from: 'Community Request',
        created_from_request_id: savedReq.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const updatedTasks = [newTask, ...tasks.filter(t => t && t.id !== newTaskId && t.created_from_request_id !== savedReq.id)];
      await AsyncStorage.setItem('@sahayika_tasks', JSON.stringify(updatedTasks));
    } catch (err) {
      console.warn('Error scheduling local task for visit request:', err);
    }

    return savedReq;
  }
};

