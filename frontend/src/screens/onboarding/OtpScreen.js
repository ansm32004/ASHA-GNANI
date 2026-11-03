import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { AppHeader } from '../../components/common/AppHeader';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api/apiClient';
import { useTranslation } from 'react-i18next';

export const OtpScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { sessionId = 'demo_session', phone = '9876543210' } = route.params || {};
  const { setAuth, loginDemoUser } = useAuthStore();

  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/verify', {
        session_id: sessionId,
        phone_number: phone,
        otp: otp
      });
      await setAuth(res.data.access_token, res.data.user);
      setLoading(false);
      navigation.navigate('Permissions');
    } catch (e) {
      await loginDemoUser();
      setLoading(false);
      navigation.navigate('Permissions');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('auth.otpTitle') || 'Verify OTP'}
        showBack
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>

          <Text style={styles.title}>{t('auth.otpTitle') || 'Enter Verification Code'}</Text>
          <Text style={styles.subtitle}>
            +91 {phone} पर भेजा गया 6 अंकों का कोड दर्ज करें
          </Text>

          <View style={styles.demoBanner}>
            <Ionicons name="information-circle" size={18} color={colors.primary} />
            <Text style={styles.demoBannerText}>
              {t('auth.demoOtpHint') || 'Demo mode: Any 6 digits or default "123456" will verify.'}
            </Text>
          </View>

          <View style={styles.formCard}>
            <AppInput
              label="OTP Code (सत्यापन कोड)"
              placeholder="123456"
              value={otp}
              onChangeText={(val) => {
                setOtp(val);
                if (error) setError(null);
              }}
              keyboardType="number-pad"
              error={error}
              style={styles.otpInput}
            />

            <AppButton
              title={t('auth.verifyOtp') || 'Verify & Continue'}
              onPress={handleVerify}
              loading={loading}
              size="large"
              style={styles.verifyButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardView: {
    flex: 1
  },
  container: {
    padding: spacing.screenPadding,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80%',
    paddingBottom: spacing.xxxl
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primaryMuted,
    ...shadows.soft
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    textAlign: 'center'
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    marginBottom: spacing.lg,
    width: '100%'
  },
  demoBannerText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 16
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.largeCard,
    padding: spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 20
  },
  verifyButton: {
    marginTop: spacing.lg
  }
});
