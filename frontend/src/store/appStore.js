import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export const useAppStore = create((set, get) => ({
  isOnline: true,
  offlineQueue: [],
  selectedVillageFilter: 'All',

  setIsOnline: (status) => set({ isOnline: status }),

  setSelectedVillageFilter: (village) => set({ selectedVillageFilter: village }),

  initializeNetworkListener: () => {
    try {
      const unsubscribe = NetInfo.addEventListener((state) => {
        const connected = Boolean(state.isConnected && (state.isInternetReachable ?? true));
        set({ isOnline: connected });
      });
      return unsubscribe;
    } catch (e) {
      console.warn('[appStore] Could not attach NetInfo listener:', e.message);
      return () => {};
    }
  },

  addToOfflineQueue: async (record) => {
    const queue = [...get().offlineQueue, { ...record, queuedAt: new Date().toISOString() }];
    set({ offlineQueue: queue });
    await AsyncStorage.setItem('@sahayika_offline_queue', JSON.stringify(queue));
  },

  clearOfflineQueue: async () => {
    set({ offlineQueue: [] });
    await AsyncStorage.removeItem('@sahayika_offline_queue');
  },

  loadOfflineQueue: async () => {
    try {
      const stored = await AsyncStorage.getItem('@sahayika_offline_queue');
      if (stored) {
        set({ offlineQueue: JSON.parse(stored) });
      }
    } catch (e) {
      console.warn('[appStore] Error loading offline queue:', e.message);
    }
  }
}));

