import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../services/storage/secureStorage';
import { authApi } from '../services/api/authApi';
import { notificationService } from '../services/notifications/notificationService';

// Explicit development configuration for demo accounts
const IS_DEMO_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEMO_LOGIN === 'true';

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
  user: DEMO_ASHA_PROFILE, // Default active dev profile
  token: 'demo_token_asha_sunita_001',
  isAuthenticated: true,
  isLoading: false,
  isOnboardingCompleted: true,

  initializeAuth: async () => {
    try {
      // Securely read JWT token from hardware-backed keystore
      const storedToken = await secureStorage.getItem('@sahayika_token');
      const storedUser = await AsyncStorage.getItem('@sahayika_user');

      if (storedToken && storedUser) {
        set({
          token: storedToken,
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          isOnboardingCompleted: true,
          isLoading: false
        });
        notificationService.registerForPushNotificationsAsync().catch(() => {});
      } else if (IS_DEMO_ENABLED) {
        // Dev convenience default
        set({
          user: DEMO_ASHA_PROFILE,
          token: 'demo_token_asha_sunita_001',
          isAuthenticated: true,
          isOnboardingCompleted: true,
          isLoading: false
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (e) {
      console.warn('[authStore] Error restoring session:', e.message);
      set({ isLoading: false });
    }
  },

  setSession: async (token, user) => {
    try {
      if (token) await secureStorage.setItem('@sahayika_token', token);
      if (user) await AsyncStorage.setItem('@sahayika_user', JSON.stringify(user));
      set({
        token,
        user,
        isAuthenticated: true,
        isOnboardingCompleted: true
      });
      notificationService.registerForPushNotificationsAsync().catch(() => {});
      return true;
    } catch (e) {
      console.warn('[authStore] Error setting session:', e.message);
      return false;
    }
  },

  loginDemoAsha: async () => {
    if (!IS_DEMO_ENABLED) {
      return { success: false, error: 'Demo logins are disabled in production builds.' };
    }
    try {
      const token = 'demo_token_asha_sunita_001';
      const user = DEMO_ASHA_PROFILE;
      await secureStorage.setItem('@sahayika_token', token);
      await AsyncStorage.setItem('@sahayika_user', JSON.stringify(user));
      await AsyncStorage.setItem('@sahayika_onboarded', 'true');
      set({
        token,
        user,
        isAuthenticated: true,
        isOnboardingCompleted: true,
        isLoading: false
      });
      notificationService.registerForPushNotificationsAsync().catch(() => {});
      return { success: true, user };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  loginDemoCommunity: async () => {
    if (!IS_DEMO_ENABLED) {
      return { success: false, error: 'Demo logins are disabled in production builds.' };
    }
    try {
      const token = 'demo_token_comm_meena_001';
      const user = DEMO_COMMUNITY_PROFILE;
      await secureStorage.setItem('@sahayika_token', token);
      await AsyncStorage.setItem('@sahayika_user', JSON.stringify(user));
      await AsyncStorage.setItem('@sahayika_onboarded', 'true');
      set({
        token,
        user,
        isAuthenticated: true,
        isOnboardingCompleted: true,
        isLoading: false
      });
      notificationService.registerForPushNotificationsAsync().catch(() => {});
      return { success: true, user };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  loginWithCredentials: async (email, password) => {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      try {
        const res = await authApi.loginWithCredentials(cleanEmail, password);
        if (res?.user && res?.access_token) {
          await secureStorage.setItem('@sahayika_token', res.access_token);
          await AsyncStorage.setItem('@sahayika_user', JSON.stringify(res.user));
          set({
            token: res.access_token,
            user: res.user,
            isAuthenticated: true,
            isOnboardingCompleted: true,
            isLoading: false
          });
          notificationService.registerForPushNotificationsAsync().catch(() => {});
          return { success: true, user: res.user };
        }
        return { success: false, error: 'Unexpected response from server' };
      } catch (apiErr) {
        const serverMsg =
          apiErr.response?.data?.message ||
          apiErr.response?.data?.detail?.message ||
          (typeof apiErr.response?.data?.detail === 'string' ? apiErr.response?.data?.detail : null);

        if (serverMsg) {
          return { success: false, error: serverMsg };
        }

        if (apiErr.response?.status === 401) {
          return { success: false, error: 'Invalid email or password.' };
        }

        if (apiErr.response?.status >= 500) {
          return { success: false, error: 'Authentication service temporarily unavailable. Please try again.' };
        }

        if (apiErr.isNetworkError || !apiErr.response) {
          return {
            success: false,
            error: apiErr.userFriendlyMessage || 'Cannot connect to SAHAYIKA server. Please verify your connection.'
          };
        }

        return { success: false, error: apiErr.message || 'Authentication failed. Please check credentials.' };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  register: async (registrationData) => {
    try {
      if (!registrationData?.email || !registrationData?.password) {
        return { success: false, error: 'Email and password are required' };
      }

      try {
        const res = await authApi.register(registrationData);
        if (res?.user && res?.access_token) {
          await secureStorage.setItem('@sahayika_token', res.access_token);
          await AsyncStorage.setItem('@sahayika_user', JSON.stringify(res.user));
          set({
            token: res.access_token,
            user: res.user,
            isAuthenticated: true,
            isOnboardingCompleted: true,
            isLoading: false
          });
          notificationService.registerForPushNotificationsAsync().catch(() => {});
          return { success: true, user: res.user };
        }
        return { success: false, error: 'Unexpected registration response from server' };
      } catch (apiErr) {
        const serverMsg =
          apiErr.response?.data?.message ||
          apiErr.response?.data?.detail?.message ||
          (typeof apiErr.response?.data?.detail === 'string' ? apiErr.response?.data?.detail : null);

        if (serverMsg) {
          return { success: false, error: serverMsg };
        }

        if (apiErr.response?.status === 409) {
          return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
        }

        if (apiErr.response?.status === 422) {
          return { success: false, error: 'Please check your input fields and try again.' };
        }

        if (apiErr.response?.status >= 500) {
          return { success: false, error: 'Registration service temporarily unavailable. Please try again.' };
        }

        if (apiErr.isNetworkError || !apiErr.response) {
          return {
            success: false,
            error: apiErr.userFriendlyMessage || 'Cannot connect to SAHAYIKA server. Please verify your connection.'
          };
        }

        return { success: false, error: apiErr.message || 'Registration failed.' };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  logout: async () => {
    // 1. Unregister device token with backend before wiping credentials
    try {
      await notificationService.unregisterPushNotificationsAsync();
    } catch (e) {
      // Non-blocking
    }

    try {
      await authApi.logout();
    } catch (e) {
      // Non-blocking
    }

    // 2. Purge secure credentials
    await secureStorage.deleteItem('@sahayika_token');

    // 2. Purge private user records to prevent cross-role data leaks on shared devices
    const privateKeys = [
      '@sahayika_user',
      '@sahayika_households',
      '@sahayika_visits',
      '@sahayika_tasks',
      '@sahayika_requests',
      '@sahayika_claims',
      '@sahayika_notifications'
    ];
    await AsyncStorage.multiRemove(privateKeys);

    // NOTE: @sahayika_offline_queue is intentionally preserved so un-synced offline records are not lost.

    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  }
}));
