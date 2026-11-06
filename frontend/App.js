import firebaseApp from './src/services/firebase/firebaseConfig';
import React, { useEffect } from 'react';
import { StyleSheet, View, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useLanguageStore } from './src/store/languageStore';
import { useAppStore } from './src/store/appStore';
import { colors } from './src/theme';
import { notificationService } from './src/services/notifications/notificationService';
import './src/localisation'; // initialize i18n


export default function App() {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const { initializeLanguage } = useLanguageStore();
  const { loadOfflineQueue, initializeNetworkListener } = useAppStore();

  useEffect(() => {
    initializeLanguage();
    loadOfflineQueue();
    const unsubscribeNet = initializeNetworkListener();
    const unsubscribeNotifications = notificationService.initialize(
      (notification) => {
        console.log('[App] Foreground alert received:', notification?.request?.content?.title);
      },
      (response) => {
        console.log('[App] Notification tapped by user:', response?.notification?.request?.content?.title);
      }
    );

    return () => {
      if (typeof unsubscribeNet === 'function') unsubscribeNet();
      if (typeof unsubscribeNotifications === 'function') unsubscribeNotifications();
    };
  }, []);

  const isWeb = Platform.OS === 'web';

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.provider}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={isWeb ? styles.webWrapper : styles.nativeWrapper}>
        <View style={isWeb ? styles.mobileFrame : styles.nativeWrapper}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  provider: {
    flex: 1,
    height: '100%'
  },
  nativeWrapper: {
    flex: 1,
    backgroundColor: colors.background
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#EEF1F5', // Soft neutral background for web framing
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  mobileFrame: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    backgroundColor: colors.background,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: 'rgba(34, 40, 49, 0.12)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#DFE3E8'
  }
});
