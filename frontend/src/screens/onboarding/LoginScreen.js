import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { AppHeader } from '../../components/common/AppHeader';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api/authApi';
import { useTranslation } from 'react-i18next';

export const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { loginDemoAsha, loginDemoCommunity, loginWithCredentials } = useAuthStore();

  const [loginMode, setLoginMode] = useState('demo'); // 'demo' | 'credentials' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDemoAshaLogin = async () => {
    setLoading(true);
    await loginDemoAsha();
    setLoading(false);
  };

  const handleDemoCommunityLogin = async () => {
    setLoading(true);
    await loginDemoCommunity();
    setLoading(false);
  };

  const handleCredentialsLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await loginWithCredentials(email.trim(), password.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid email or password.');
    }
  };

  const handleRequestOtp = async () => {
    const clean = phone.trim().replace(/\D/g, '');
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const data = await authApi.requestOtp(clean);
      setLoading(false);
      navigation.navigate('OtpVerification', {
        sessionId: data.session_id,
        phone: clean
      });
    } catch (e) {
      setLoading(false);
      navigation.navigate('OtpVerification', {
        sessionId: 'demo_session',
        phone: clean
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="SAHAYIKA Access" showBack onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Logo Brand Emblem */}
          <View style={styles.iconCircle}>
            <Ionicons name="medical" size={32} color={colors.primary} />
          </View>

          <Text style={styles.title}>Welcome to SAHAYIKA</Text>
          <Text style={styles.subtitle}>Select your application role or sign in below</Text>

          {/* Role Selection & Demo Accounts Section */}
          <View style={styles.roleCard}>
            <Text style={styles.roleSectionTitle}>⚡ ONE-TAP DEMO ACCESS</Text>
            <Text style={styles.roleSectionDesc}>
              Two independent experiences for ASHA Workers and Community Members.
            </Text>

            {/* 1. Continue as ASHA Worker */}
            <TouchableOpacity
              style={styles.roleOption}
              onPress={handleDemoAshaLogin}
              activeOpacity={0.85}
            >
              <View style={[styles.roleIconPod, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="clipboard-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.roleTextCol}>
                <View style={styles.roleHeaderRow}>
                  <Text style={styles.roleTitle}>Continue as ASHA Worker</Text>
                  <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.roleBadgeText, { color: colors.primary }]}>PHASE 1</Text>
                  </View>
                </View>
                <Text style={styles.roleSubtitle}>Professional field-work & household management app</Text>
                <Text style={styles.credentialPill}>asha.demo@sahayika.test • Sunita Devi</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </TouchableOpacity>

            {/* 2. Continue as Community Member */}
            <TouchableOpacity
              style={[styles.roleOption, { borderColor: colors.teal, marginTop: 10 }]}
              onPress={handleDemoCommunityLogin}
              activeOpacity={0.85}
            >
              <View style={[styles.roleIconPod, { backgroundColor: colors.tealLight }]}>
                <Ionicons name="heart-outline" size={22} color={colors.teal} />
              </View>
              <View style={styles.roleTextCol}>
                <View style={styles.roleHeaderRow}>
                  <Text style={styles.roleTitle}>Continue as Community Member</Text>
                  <View style={[styles.roleBadge, { backgroundColor: colors.tealLight }]}>
                    <Text style={[styles.roleBadgeText, { color: colors.teal }]}>PHASE 2</Text>
                  </View>
                </View>
                <Text style={styles.roleSubtitle}>Voice-first health guide & ASHA connection for families</Text>
                <Text style={[styles.credentialPill, { color: colors.teal }]}>
                  community.demo@sahayika.test • Meena Devi
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.teal} />
            </TouchableOpacity>
          </View>

          {/* Credentials Sign In Card */}
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>Or Sign In with Credentials</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <AppInput
              label="Email Address"
              placeholder="e.g. asha.demo@sahayika.test"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <AppInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError(null);
              }}
              secureTextEntry
            />

            <AppButton
              title="Sign In with Email"
              onPress={handleCredentialsLogin}
              loading={loading}
              size="large"
              style={{ marginTop: spacing.sm }}
            />
          </View>

          <Text style={styles.footerNote}>
            SAHAYIKA Ecosystem • Shared Backend & Dedicated Experiences
          </Text>
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
    paddingBottom: spacing.xxxl
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primaryMuted,
    ...shadows.soft
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.md
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.cardPadding,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card
  },
  roleSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.deepBlue,
    letterSpacing: 0.6
  },
  roleSectionDesc: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
    marginBottom: 10
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.primary
  },
  roleIconPod: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  roleTextCol: {
    flex: 1
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700'
  },
  roleSubtitle: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 1
  },
  credentialPill: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 3
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.cardPadding,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  formCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 8
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: 8
  },
  footerNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg
  }
});

export default LoginScreen;
