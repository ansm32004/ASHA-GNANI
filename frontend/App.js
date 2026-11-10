import firebaseApp from './src/services/firebase/firebaseConfig';
import React, { useEffect } from 'react';
import { StyleSheet, View, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useLanguageStore } from './src/store/languageStore';
import { useAppStore } from './src/store/appStore';
import { colors } from './src/theme';
import { AppBackdrop } from './src/components/common/AppBackdrop';
import { notificationService } from './src/services/notifications/notificationService';
import './src/localisation'; // initialize i18n


const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent' }
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const { i18n } = useTranslation();
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={isWeb ? styles.webWrapper : styles.nativeWrapper}>
        <View style={isWeb ? styles.mobileFrame : styles.nativeWrapper}>
          <AppBackdrop />
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator key={i18n.language} />
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
    backgroundColor: '#E9EDF5', // Soft neutral background for web framing
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  mobileFrame: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    backgroundColor: colors.background,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#1E3A6D',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 8
  }
});
