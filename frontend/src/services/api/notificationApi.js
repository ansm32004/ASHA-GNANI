import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif_001",
    title: "Urgent Health Request",
    message: "Meena Devi reported dizzy spells. Visit recommended today.",
    category: "Urgent request",
    priority: "Urgent",
    is_read: false,
    timestamp: "Today, 08:30 AM"
  },
  {
    id: "notif_002",
    title: "Follow-up Due Today",
    message: "Maternal follow-up due for Sita Verma (Lakshmi Nagar).",
    category: "Follow-up due",
    priority: "High",
    is_read: false,
    timestamp: "Today, 07:00 AM"
  },
  {
    id: "notif_003",
    title: "VHSND Session Scheduled",
    message: "Immunisation & ANC session this Wednesday at Anganwadi Centre 2.",
    category: "Health camp",
    priority: "Medium",
    is_read: true,
    timestamp: "Yesterday"
  },
  {
    id: "notif_004",
    title: "September Incentive Disbursed",
    message: "Incentive of ₹4,200 for September 2026 credited to registered bank account.",
    category: "Payment status",
    priority: "Medium",
    is_read: true,
    timestamp: "Oct 15, 2026"
  }
];

const STORAGE_KEY = '@sahayika_notifications';

let _inMemoryNotifs = null;
let _lastNotifFetchTime = 0;
const CACHE_TTL_MS = 25000; // 25 seconds

export const notificationApi = {
  invalidateCache: () => {
    _inMemoryNotifs = null;
    _lastNotifFetchTime = 0;
  },

  getNotifications: async () => {
    const now = Date.now();
    if (_inMemoryNotifs && (now - _lastNotifFetchTime < CACHE_TTL_MS)) {
      return _inMemoryNotifs;
    }

    try {
      const res = await apiClient.get('/notifications');
      const remote = Array.isArray(res.data) ? res.data : [];
      let local = _inMemoryNotifs || [];
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
      local.forEach(n => n && n.id && map.set(n.id, n));
      remote.forEach(n => {
        if (!n || !n.id) return;
        const existing = map.get(n.id);
        map.set(n.id, existing ? { ...n, is_read: existing.is_read } : n);
      });
      const merged = Array.from(map.values());
      // Sort newest notifications first: "Just now" and recent created_at appear at the very top
      merged.sort((a, b) => {
        const isJustNowA = (a.timestamp || '').toLowerCase().includes('just now');
        const isJustNowB = (b.timestamp || '').toLowerCase().includes('just now');
        if (isJustNowA && !isJustNowB) return -1;
        if (!isJustNowA && isJustNowB) return 1;
        const timeA = new Date(a.created_at || 0).getTime() || 0;
        const timeB = new Date(b.created_at || 0).getTime() || 0;
        if (timeA && timeB) return timeB - timeA;
        return 0;
      });
      _inMemoryNotifs = merged;
      _lastNotifFetchTime = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    } catch (e) {
      if (_inMemoryNotifs) return _inMemoryNotifs;
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = cached ? JSON.parse(cached) : null;
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.sort((a, b) => {
            const isJustNowA = (a.timestamp || '').toLowerCase().includes('just now');
            const isJustNowB = (b.timestamp || '').toLowerCase().includes('just now');
            if (isJustNowA && !isJustNowB) return -1;
            if (!isJustNowA && isJustNowB) return 1;
            return 0;
          });
          _inMemoryNotifs = parsed;
          _lastNotifFetchTime = Date.now();
          return parsed;
        }
      } catch (err) {
        // fallback
      }
      return INITIAL_NOTIFICATIONS;
    }
  },

  markAsRead: async (notifId) => {
    if (_inMemoryNotifs) {
      _inMemoryNotifs = _inMemoryNotifs.map(n => (n && n.id === notifId) ? { ...n, is_read: true } : n);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryNotifs)).catch(() => {});
    }
    try {
      const res = await apiClient.post(`/notifications/${notifId}/read`);
      return res.data;
    } catch (e) {
      const list = await notificationApi.getNotifications();
      const safeList = Array.isArray(list) ? list : [];
      const updated = safeList.map(n => (n && n.id === notifId) ? { ...n, is_read: true } : n);
      _inMemoryNotifs = updated;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated.find(n => n && n.id === notifId);
    }
  },

  markAllAsRead: async () => {
    if (_inMemoryNotifs) {
      _inMemoryNotifs = _inMemoryNotifs.map(n => n ? { ...n, is_read: true } : n);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryNotifs)).catch(() => {});
    }
    try {
      await apiClient.post('/notifications/read-all');
    } catch (e) {
      const list = await notificationApi.getNotifications();
      const safeList = Array.isArray(list) ? list : [];
      const updated = safeList.map(n => n ? { ...n, is_read: true } : n);
      _inMemoryNotifs = updated;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
    }
  },

  registerDeviceToken: async (token, platform = 'android') => {
    try {
      const res = await apiClient.post('/notifications/device-token', { token, platform });
      return res.data;
    } catch (e) {
      console.log('Device token registration warning:', e.message);
      return null;
    }
  },

  unregisterDeviceToken: async () => {
    try {
      const res = await apiClient.delete('/notifications/device-token');
      return res.data;
    } catch (e) {
      return null;
    }
  }
};

