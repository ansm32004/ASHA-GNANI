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

export const notificationApi = {
  getNotifications: async () => {
    try {
      const res = await apiClient.get('/notifications');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    } catch (e) {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : INITIAL_NOTIFICATIONS;
    }
  },

  markAsRead: async (notifId) => {
    try {
      const res = await apiClient.post(`/notifications/${notifId}/read`);
      return res.data;
    } catch (e) {
      const list = await notificationApi.getNotifications();
      const updated = list.map(n => n.id === notifId ? { ...n, is_read: true } : n);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated.find(n => n.id === notifId);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.post('/notifications/read-all');
    } catch (e) {
      const list = await notificationApi.getNotifications();
      const updated = list.map(n => ({ ...n, is_read: true }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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

