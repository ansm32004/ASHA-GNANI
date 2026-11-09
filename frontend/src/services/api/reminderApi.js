import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sahayika_reminders';

const SEEDED_REMINDERS = [
  {
    id: 'rem_001',
    title: 'तृतीय तिमाही प्रसव पूर्व जांच (3rd Trimester ANC)',
    beneficiary_name: 'मीना देवी (Meena Devi)',
    household_id: 'hh_001',
    due_date: '2026-11-04',
    due_time: '11:30 AM',
    provider: 'आशा कार्यकर्ता सुनीता देवी द्वारा गृह भेंट',
    details: 'रक्तचाप माप (BP check), वजन, हीमोग्लोबिन स्तर और लाल आयरन की 30 गोलियों का वितरण।',
    priority: 'Urgent',
    status: 'Scheduled'
  },
  {
    id: 'rem_002',
    title: 'एमआर-1 खसरा रूबेला टीका (MR-1 Vaccine)',
    beneficiary_name: 'आरव कुमार (Aarav Kumar)',
    household_id: 'hh_001',
    due_date: '2026-11-06',
    due_time: '10:00 AM',
    provider: 'प्राथमिक स्वास्थ्य केंद्र / आंगनवाड़ी केंद्र',
    details: 'नियमित टीकाकरण सत्र में विटामिन-ए और खसरा रूबेला की खुराक।',
    priority: 'High',
    status: 'Scheduled'
  },
  {
    id: 'rem_003',
    title: 'पोषण राशन वितरण एवं परामर्श (POSHAN VHSND)',
    beneficiary_name: 'समस्त परिवार (Family)',
    household_id: 'hh_001',
    due_date: '2026-11-10',
    due_time: '09:30 AM',
    provider: 'आंगनवाड़ी केंद्र, वार्ड 3',
    details: 'गर्भवती महिलाओं और धात्री माताओं के लिए मासिक टेक-होम राशन (THR) वितरण।',
    priority: 'Routine',
    status: 'Upcoming'
  }
];

const STORAGE_KEY = '@sahayika_reminders';

let _inMemoryReminders = null;
let _lastRemindersFetchTime = 0;
const CACHE_TTL_MS = 25000;

export const reminderApi = {
  /**
   * Get upcoming health reminders for authenticated family
   * Expected backend endpoint: GET /api/v1/reminders
   */
  getReminders: async (params = {}) => {
    const now = Date.now();
    if (_inMemoryReminders && (now - _lastRemindersFetchTime < CACHE_TTL_MS)) {
      return _inMemoryReminders;
    }
    try {
      const res = await apiClient.get('/reminders', { params });
      _inMemoryReminders = res.data;
      _lastRemindersFetchTime = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data)).catch(() => {});
      return res.data;
    } catch (e) {
      if (_inMemoryReminders) return _inMemoryReminders;
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = cached ? JSON.parse(cached) : SEEDED_REMINDERS;
      _inMemoryReminders = parsed;
      _lastRemindersFetchTime = Date.now();
      return parsed;
    }
  },

  /**
   * Acknowledge or dismiss reminder
   * Expected backend endpoint: POST /api/v1/reminders/{id}/dismiss
   */
  dismissReminder: async (reminderId) => {
    try {
      const res = await apiClient.post(`/reminders/${reminderId}/dismiss`);
      if (_inMemoryReminders) {
        _inMemoryReminders = _inMemoryReminders.filter((r) => r.id !== reminderId);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryReminders)).catch(() => {});
      }
      return res.data;
    } catch (e) {
      const list = await reminderApi.getReminders();
      const updated = list.filter((r) => r.id !== reminderId);
      _inMemoryReminders = updated;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return { success: true, id: reminderId };
    }
  }
};

export default reminderApi;

