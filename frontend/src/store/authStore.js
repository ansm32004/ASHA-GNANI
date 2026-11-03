import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api/apiClient';

export const DEMO_ASHA_PROFILE = {
  id: 'asha_sunita_001',
  email: 'asha.demo@sahayika.test',
  name: 'Sunita Devi',
  phone: '9876543210',
  role: 'ASHA',
  asha_id: 'ASHA-UP-VNS-2024-042',
  village_name: 'Rampur Kalan',
  sub_centre: 'Rampur SC-04',
  phc_name: 'Kashi Primary Health Centre',
  district: 'Varanasi',
  state: 'Uttar Pradesh',
  assigned_clusters: ['Rampur Kalan', 'Lakshmi Nagar', 'Shanti Kunj', 'Kalyanpur', 'Basti Vikas'],
  total_assigned_households: 34
};

export const DEMO_COMMUNITY_PROFILE = {
  id: 'comm_meena_001',
  email: 'community.demo@sahayika.test',
  name: 'Meena Devi',
  phone: '9871100221',
  role: 'COMMUNITY',
  household_id: 'hh_001',
  household_code: 'HH-RK-001',
  village_name: 'Rampur Kalan',
  sub_area: 'Ward 3, Near Primary School',
  district: 'Varanasi',
  state: 'Uttar Pradesh',
  assigned_asha: {
    id: 'asha_sunita_001',
    name: 'Sunita Devi',
    phone: '9876543210',
    village: 'Rampur Kalan',
    sub_centre: 'Rampur SC-04'
  },
  family_members: [
    {
      id: 'mem_001_1',
      name: 'Meena Devi',
      relation: 'Self',
      age: 24,
      gender: 'Female',
      category: 'Pregnant Woman',
      status: '3rd Trimester (32 wks)',
      next_checkup: 'Today, 11:30 AM'
    },
    {
      id: 'mem_001_2',
      name: 'Rajesh Kumar',
      relation: 'Husband',
      age: 28,
      gender: 'Male',
      category: 'Adult'
    },
    {
      id: 'mem_001_3',
      name: 'Aarav Kumar',
      relation: 'Son',
      age: 2,
      gender: 'Male',
      category: 'Child',
      next_vaccine: 'MR 2nd Dose Due'
    }
  ]
};

export const useAuthStore = create((set, get) => ({
  user: DEMO_ASHA_PROFILE, // Default demo user
  token: 'demo_token_asha_sunita_001',
  isAuthenticated: true,
  isLoading: false,
  isOnboardingCompleted: true,

  initializeAuth: async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@sahayika_token');
      const storedUser = await AsyncStorage.getItem('@sahayika_user');

      if (storedToken && storedUser) {
        set({
          token: storedToken,
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          isOnboardingCompleted: true,
          isLoading: false
        });
      } else {
        set({
          user: DEMO_ASHA_PROFILE,
          token: 'demo_token_asha_sunita_001',
          isAuthenticated: true,
          isOnboardingCompleted: true,
          isLoading: false
        });
      }
    } catch (e) {
      console.error('Error loading auth from storage', e);
      set({ isLoading: false });
    }
  },

  loginDemoAsha: async () => {
    try {
      const token = 'demo_token_asha_sunita_001';
      const user = DEMO_ASHA_PROFILE;
      await AsyncStorage.setItem('@sahayika_token', token);
      await AsyncStorage.setItem('@sahayika_user', JSON.stringify(user));
      await AsyncStorage.setItem('@sahayika_onboarded', 'true');
      set({
        token,
        user,
        isAuthenticated: true,
        isOnboardingCompleted: true,
        isLoading: false
      });
      return true;
    } catch (e) {
      console.error('Error logging in demo ASHA', e);
      return false;
    }
  },

  loginDemoCommunity: async () => {
    try {
      const token = 'demo_token_comm_meena_001';
      const user = DEMO_COMMUNITY_PROFILE;
      await AsyncStorage.setItem('@sahayika_token', token);
      await AsyncStorage.setItem('@sahayika_user', JSON.stringify(user));
      await AsyncStorage.setItem('@sahayika_onboarded', 'true');
      set({
        token,
        user,
        isAuthenticated: true,
        isOnboardingCompleted: true,
        isLoading: false
      });
      return true;
    } catch (e) {
      console.error('Error logging in demo community', e);
      return false;
    }
  },

  loginWithCredentials: async (email, password) => {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      try {
        const res = await apiClient.post('/auth/login-credentials', {
          email: cleanEmail,
          password: password || 'Sahayika@123'
        });
        if (res.data?.user) {
          const user = res.data.user;
          const token = res.data.access_token || 'demo_token';
          await AsyncStorage.setItem('@sahayika_token', token);
          await AsyncStorage.setItem('@sahayika_user', JSON.stringify(user));
          set({
            token,
            user,
            isAuthenticated: true,
            isOnboardingCompleted: true
          });
          return { success: true, user };
        }
      } catch (apiErr) {
        // Fallback to local profile check
      }

      // Local credential check
      if (cleanEmail === 'community.demo@sahayika.test' || cleanEmail.includes('community')) {
        await get().loginDemoCommunity();
        return { success: true, user: DEMO_COMMUNITY_PROFILE };
      } else {
        await get().loginDemoAsha();
        return { success: true, user: DEMO_ASHA_PROFILE };
      }
    } catch (e) {
      console.error('Credentials login error', e);
      return { success: false, error: e.message };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('@sahayika_token');
    await AsyncStorage.removeItem('@sahayika_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  }
}));
