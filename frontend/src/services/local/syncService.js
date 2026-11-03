import { useAppStore } from '../../store/appStore';
import { visitApi } from '../api/visitApi';
import { householdApi } from '../api/householdApi';
import { taskApi } from '../api/taskApi';

export const syncService = {
  syncPendingRecords: async () => {
    const store = useAppStore.getState();
    const queue = store.offlineQueue;

    if (!queue || queue.length === 0) {
      return { syncedCount: 0, status: 'up_to_date' };
    }

    let successCount = 0;
    const remaining = [];

    for (const item of queue) {
      try {
        if (item.type === 'visit') {
          await visitApi.confirmVisit(item.data);
          successCount++;
        } else if (item.type === 'household') {
          await householdApi.createHousehold(item.data);
          successCount++;
        } else if (item.type === 'task') {
          await taskApi.createTask(item.data);
          successCount++;
        }
      } catch (e) {
        console.error('Failed to sync item', item, e);
        remaining.push(item);
      }
    }

    useAppStore.setState({ offlineQueue: remaining });
    return { syncedCount: successCount, remainingCount: remaining.length };
  }
};

