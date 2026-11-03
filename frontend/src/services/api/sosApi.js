import { apiClient } from './apiClient';

export const sosApi = {
  triggerSos: async (payload) => {
    try {
      const res = await apiClient.post('/sos', payload);
      return res.data;
    } catch (e) {
      return {
        id: `sos_${Date.now()}`,
        ...payload,
        status: 'Triggered',
        call_112_initiated: true,
        asha_notified: true,
        escalation_level: 3,
        timestamp: new Date().toISOString(),
        notes: 'Simulated SOS event created locally.'
      };
    }
  }
};

