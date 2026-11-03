import { apiClient } from './apiClient';
import { SEEDED_CLAIMS } from '../local/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sahayika_claims';

export const claimApi = {
  getClaims: async () => {
    try {
      const res = await apiClient.get('/claims');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    } catch (e) {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : SEEDED_CLAIMS;
    }
  },

  prepareClaim: async (month) => {
    try {
      const res = await apiClient.post('/claims/prepare', { month });
      return res.data;
    } catch (e) {
      const claims = await claimApi.getClaims();
      const newClaim = {
        id: `claim_${Date.now()}`,
        month: month || 'November',
        year: 2026,
        asha_name: 'Sunita Devi',
        activities_count: 14,
        total_estimated_amount: 2850,
        status: 'Draft',
        payment_status: 'Pending',
        disclaimer: 'Disclaimer: Incentive calculations shown are illustrative guides for claim compilation.'
      };
      const updated = [newClaim, ...claims];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newClaim;
    }
  },

  submitClaim: async (claimId) => {
    try {
      const res = await apiClient.post(`/claims/${claimId}/submit`);
      return res.data;
    } catch (e) {
      const claims = await claimApi.getClaims();
      const updated = claims.map(c =>
        c.id === claimId ? { ...c, status: 'Submitted for Review', payment_status: 'Under Verification' } : c
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated.find(c => c.id === claimId);
    }
  }
};

