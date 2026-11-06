import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationApi } from '../api/notificationApi';

// Configure global notification handler for how alerts are shown when app is in the foreground
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    // Non-blocking
  }
}

let cachedToken = null;
let isChannelConfigured = false;

export const notificationService = {
  /**
   * Configure Android high-importance notification channel with sound & vibration.
   */
  setupNotificationChannel: async () => {
    if (Platform.OS !== 'android' || isChannelConfigured) {
      return;
    }
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Alerts',
        description: 'Urgent visits, community requests and task updates for SAHAYIKA',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0052CC',
        sound: 'default',
        enableVibrate: true,
        showBadge: true
      });
      isChannelConfigured = true;
    } catch (err) {
      console.warn('[NotificationService] Failed to configure Android channel:', err.message);
    }
  },

  /**
   * Request notification permissions and register the FCM token with the backend.
   * Safe against non-device environments (web, simulators) and Expo Go limitations.
   */
  registerForPushNotificationsAsync: async () => {
    // 1. Must be a physical device
    if (!Device.isDevice || Platform.OS === 'web') {
      console.log('[NotificationService] Push notifications require a physical device.');
      return null;
    }

    try {
      // 2. Ensure Android channel is set up
      await notificationService.setupNotificationChannel();

      // 3. Check existing permissions to avoid nagging user repeatedly
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] Notification permission not granted by user.');
        return null;
      }

      // 4. Retrieve push token
      let token = null;

      try {
        // Native FCM registration token on Android development build / standalone APK
        const deviceTokenResult = await Notifications.getDevicePushTokenAsync();
        token = deviceTokenResult?.data;
      } catch (nativeErr) {
        // In Expo Go or when native Google Play Services are missing
        console.log(
          '[NotificationService] Native FCM token not available in current environment:',
          nativeErr.message
        );

        // Fallback attempt with Expo Push Token (if EAS / project ID configured)
        try {
          const expoTokenResult = await Notifications.getExpoPushTokenAsync();
          token = expoTokenResult?.data;
        } catch (expoErr) {
          console.log('[NotificationService] Expo push token unavailable:', expoErr.message);
        }
      }

      if (!token) {
        console.log('[NotificationService] No push token acquired.');
        return null;
      }

      cachedToken = token;

      // 5. Securely register token with the FastAPI backend
      const res = await notificationApi.registerDeviceToken(token, Platform.OS);
      if (res?.status === 'success') {
        console.log('[NotificationService] Device token registered successfully with backend.');
      }
      return token;
    } catch (e) {
      console.warn('[NotificationService] Error registering for push notifications:', e.message);
      return null;
    }
  },

  /**
   * Unregister token with backend during logout.
   */
  unregisterPushNotificationsAsync: async () => {
    try {
      cachedToken = null;
      await notificationApi.unregisterDeviceToken();
      console.log('[NotificationService] Device token unregistered from backend.');
    } catch (e) {
      // Non-blocking
    }
  },

  /**
   * Initialize notification channels and listeners.
   * Returns a cleanup function to unsubscribe listeners on unmount.
   */
  initialize: (onNotificationReceived, onNotificationTapped) => {
    if (Platform.OS === 'web') {
      return () => {};
    }
    notificationService.setupNotificationChannel();

    try {
      // 1. Foreground notification received listener
      const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log(
          '[NotificationService] Foreground notification received:',
          notification?.request?.content?.title
        );
        if (typeof onNotificationReceived === 'function') {
          onNotificationReceived(notification);
        }
      });

      // 2. Notification response listener (user tapped notification in background or killed state)
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log(
          '[NotificationService] Notification tapped by user:',
          response?.notification?.request?.content?.title
        );
        if (typeof onNotificationTapped === 'function') {
          onNotificationTapped(response);
        }
      });

      // Return cleanup unsubscribe function
      return () => {
        if (receivedSubscription && typeof receivedSubscription.remove === 'function') {
          receivedSubscription.remove();
        }
        if (responseSubscription && typeof responseSubscription.remove === 'function') {
          responseSubscription.remove();
        }
      };
    } catch (e) {
      console.warn('[NotificationService] Error initializing listeners:', e.message);
      return () => {};
    }
  }
};
