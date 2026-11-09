import { apiClient } from './apiClient';
import { SEEDED_CLAIMS } from '../local/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sahayika_claims';
const OVERVIEW_STORAGE_KEY = '@sahayika_claims_overview';
const GUIDELINES_STORAGE_KEY = '@sahayika_incentive_guidelines';

let _inMemoryClaims = null;
let _lastClaimsFetchTime = 0;
const CACHE_TTL_MS = 15000;

export const claimApi = {
  invalidateCache: () => {
    _inMemoryClaims = null;
    _lastClaimsFetchTime = 0;
  },

  getClaims: async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && _inMemoryClaims && (now - _lastClaimsFetchTime < CACHE_TTL_MS)) {
      return _inMemoryClaims;
    }
    try {
      const res = await apiClient.get('/claims');
      _inMemoryClaims = res.data;
      _lastClaimsFetchTime = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res.data)).catch(() => {});
      return res.data;
    } catch (e) {
      if (_inMemoryClaims) return _inMemoryClaims;
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = cached ? JSON.parse(cached) : SEEDED_CLAIMS;
      _inMemoryClaims = parsed;
      _lastClaimsFetchTime = Date.now();
      return parsed;
    }
  },

  getOverview: async () => {
    try {
      const res = await apiClient.get('/claims/overview');
      AsyncStorage.setItem(OVERVIEW_STORAGE_KEY, JSON.stringify(res.data)).catch(() => {});
      return res.data;
    } catch (e) {
      const cached = await AsyncStorage.getItem(OVERVIEW_STORAGE_KEY);
      if (cached) return JSON.parse(cached);

      // Fallback calculation from claims
      const claims = await claimApi.getClaims();
      let paid = 0;
      let pending_claims = 0;
      let total_earned = 0;
      let eligible_to_claim = 1550;

      claims.forEach((c) => {
        const amt = c.total_estimated_amount || 0;
        const st = (c.status || '').toLowerCase();
        const pst = (c.payment_status || '').toLowerCase();

        if (pst === 'disbursed' || pst === 'paid' || st === 'paid') {
          paid += amt;
          total_earned += amt;
        } else if (st.includes('approved')) {
          total_earned += amt;
        } else if (st.includes('submitted') || pst.includes('under verification')) {
          pending_claims += amt;
        } else if (st.includes('draft')) {
          eligible_to_claim += amt;
        }
      });

      return {
        total_earned,
        pending_claims,
        eligible_to_claim,
        paid,
        total_claims_count: claims.length
      };
    }
  },

  getGuidelines: async (state = 'Delhi') => {
    try {
      const res = await apiClient.get(`/claims/guidelines?state=${encodeURIComponent(state)}`);
      AsyncStorage.setItem(GUIDELINES_STORAGE_KEY, JSON.stringify(res.data)).catch(() => {});
      return res.data;
    } catch (e) {
      const cached = await AsyncStorage.getItem(GUIDELINES_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
      return [
        {
          id: 'g_central_fixed',
          category: 'central_fixed',
          category_label: 'Central Fixed Incentive',
          title: 'Central Fixed Monthly Incentive',
          amount_display: '₹3,500 / month',
          amount_value: 3500,
          frequency: 'Monthly',
          eligibility_conditions: 'Completion of routine monthly reporting, VHSND meetings, and village register updates.',
          applicable_state: 'All India (NHM)',
          verification_required: true,
          status: 'active'
        },
        {
          id: 'g_performance_anc',
          category: 'performance_based',
          category_label: 'Performance-Based',
          title: 'Pregnancy Registration & ANC Follow-ups',
          amount_display: '₹300 per mother',
          amount_value: 300,
          frequency: 'Per Activity',
          eligibility_conditions: 'Registration within 12 weeks of pregnancy and minimum 4 checkups accompanied.',
          applicable_state: 'National Health Mission',
          verification_required: true,
          status: 'active'
        },
        {
          id: 'g_performance_jsy',
          category: 'performance_based',
          category_label: 'Performance-Based',
          title: 'Institutional Delivery Support (JSY)',
          amount_display: '₹600 per delivery',
          amount_value: 600,
          frequency: 'Per Activity',
          eligibility_conditions: 'Accompanied beneficiary to public health facility for institutional delivery.',
          applicable_state: 'National Health Mission',
          verification_required: true,
          status: 'active'
        },
        {
          id: 'g_team_aam',
          category: 'team_incentive',
          category_label: 'Team Incentive',
          title: 'Ayushman Arogya Mandir (AAM) Team Incentive',
          amount_display: 'Up to ₹1,000 / month',
          amount_value: 1000,
          frequency: 'Team Target',
          eligibility_conditions: 'Achieved collective health and wellness centre targets: 100% NCD screening, wellness sessions, and reporting.',
          applicable_state: 'All India (AAM / AB-HWC)',
          verification_required: true,
          status: 'active'
        },
        {
          id: 'g_state_delhi',
          category: 'state_incentive',
          category_label: 'State Government Top-Up',
          title: 'State Government Incentive (Delhi)',
          amount_display: '₹3,000 (Announced increase to ₹6,000 pending gazette)',
          amount_value: 3000,
          frequency: 'Monthly',
          eligibility_conditions: 'Active frontline duty within designated Delhi district dispensaries/mohallas.',
          applicable_state: 'Delhi (NCT)',
          verification_required: true,
          status: 'guideline_pending_verification',
          notes: 'Notice: Delhi government announced increase from ₹3,000 to ₹6,000/month in Sept 2026. This entry serves as an operational guideline requiring official verification before treating it as an applicable entitlement.'
        }
      ];
    }
  },

  createClaim: async (payload) => {
    try {
      const res = await apiClient.post('/claims', payload);
      claimApi.invalidateCache();
      return res.data;
    } catch (e) {
      // Local fallback for offline/demo persistence
      const claims = await claimApi.getClaims();
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const monthCode = (payload.month || 'NOV').slice(0, 3).toUpperCase();
      const claimId = `CLM-2026-${monthCode}-${randSuffix}`;

      let runningTotal = 0;
      let hasPending = false;
      const processedActivities = (payload.activities || []).map((a, i) => {
        const est = a.estimated_amount;
        if (est === null || est === undefined || a.amount_pending_verification) {
          hasPending = true;
        } else {
          runningTotal += Number(est);
        }
        return {
          id: `act_${claimId}_${i + 1}`,
          activity_date: a.activity_date || '2026-11-09',
          category: a.category || payload.category,
          description: `${a.activity_type} (Count: ${a.completed_count || 1})`,
          household_id: a.household_id || 'hh_001',
          beneficiary_name: a.beneficiary_name || 'Community Member',
          eligible_for_claim: true,
          incentive_code: 'ASHA-GEN-01',
          estimated_amount: est || 0,
          amount_pending_verification: hasPending,
          status: 'Submitted'
        };
      });

      const newClaim = {
        id: claimId,
        month: payload.month || 'November',
        year: payload.year || 2026,
        asha_id: 'asha_sunita_001',
        asha_name: 'Sunita Devi',
        activities_count: processedActivities.length,
        activities: processedActivities,
        total_estimated_amount: runningTotal,
        amount_pending_verification: hasPending,
        status: 'Submitted for Review',
        submitted_at: new Date().toISOString(),
        verified_at: null,
        payment_status: 'Under Verification',
        supervisor_notes: 'Claim submitted to Medical Officer and ANM for register verification.',
        supporting_notes: payload.supporting_notes,
        category: payload.category,
        disclaimer: 'Disclaimer: Incentive tracking and claim preparation assistance only. Official disbursements depend on administrative and RCH register verification.'
      };

      _inMemoryClaims = [newClaim, ...claims];
      _lastClaimsFetchTime = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryClaims)).catch(() => {});
      return newClaim;
    }
  },

  prepareClaim: async (month) => {
    try {
      const res = await apiClient.post('/claims/prepare', { month });
      claimApi.invalidateCache();
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
      _inMemoryClaims = [newClaim, ...claims];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_inMemoryClaims)).catch(() => {});
      return newClaim;
    }
  },

  submitClaim: async (claimId) => {
    try {
      const res = await apiClient.post(`/claims/${claimId}/submit`);
      claimApi.invalidateCache();
      return res.data;
    } catch (e) {
      const claims = await claimApi.getClaims();
      const updated = claims.map((c) =>
        c.id === claimId ? { ...c, status: 'Submitted for Review', payment_status: 'Under Verification' } : c
      );
      _inMemoryClaims = updated;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated.find((c) => c.id === claimId);
    }
  },

  getClaimDetails: async (claimId) => {
    try {
      const res = await apiClient.get(`/claims/${claimId}`);
      return res.data;
    } catch (e) {
      const claims = await claimApi.getClaims();
      return claims.find((c) => c.id === claimId);
    }
  }
};
