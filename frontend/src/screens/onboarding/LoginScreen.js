import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { AppHeader } from '../../components/common/AppHeader';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api/authApi';
import { useTranslation } from 'react-i18next';
import { toBackendDate } from '../../utils/dateUtils';

export const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { loginDemoAsha, loginDemoCommunity, loginWithCredentials, register } = useAuthStore();

  const [formMode, setFormMode] = useState('signin'); // 'signin' | 'signup'
  const [signupRole, setSignupRole] = useState('ASHA'); // 'ASHA' | 'COMMUNITY'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // In-place signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [signupGender, setSignupGender] = useState('Female');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupState, setSignupState] = useState('Uttar Pradesh');
  const [signupDistrict, setSignupDistrict] = useState('Varanasi');
  const [signupVillageName, setSignupVillageName] = useState('Rampur Kalan');
  const [signupAshaId, setSignupAshaId] = useState('');
  const [signupBlock, setSignupBlock] = useState('Kashi Block');
  const [signupHouseholdCode, setSignupHouseholdCode] = useState('');
  const [signupSubArea, setSignupSubArea] = useState('');

  const handleDemoAshaLogin = async () => {
    setLoading(true);
    const result = await loginDemoAsha();
    if (!result?.success) setError(result?.error || 'Demo login failed. Please try again.');
    setLoading(false);
  };

  const handleDemoCommunityLogin = async () => {
    setLoading(true);
    const result = await loginDemoCommunity();
    if (!result?.success) setError(result?.error || 'Demo login failed. Please try again.');
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

  const handleSignup = async () => {
    if (!signupName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() || !/\S+@\S+\.\S+/.test(signupEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    const cleanPhone = signupPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!signupVillageName.trim()) {
      setError('Please specify your village or assigned area.');
      return;
    }
    if (!signupPassword || signupPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    const payload = {
      role: signupRole,
      name: signupName.trim(),
      email: signupEmail.trim().toLowerCase(),
      phone: cleanPhone,
      password: signupPassword,
      dob: signupDob.trim() ? toBackendDate(signupDob.trim()) : undefined,
      gender: signupGender,
      address: signupAddress.trim() || undefined,
      state: signupState.trim() || 'Uttar Pradesh',
      district: signupDistrict.trim() || 'Varanasi',
      village_name: signupVillageName.trim(),
      ...(signupRole === 'ASHA'
        ? {
            asha_id: signupAshaId.trim() || undefined,
            block: signupBlock.trim() || undefined
          }
        : {
            household_code: signupHouseholdCode.trim() || undefined,
            sub_area: signupSubArea.trim() || undefined
          })
    };

    const res = await register(payload);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed. Please check details.');
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

  useEffect(() => {
    const onBackPress = () => {
      if (formMode === 'signup') {
        setFormMode('signin');
        setError(null);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [formMode]);

  const handleHeaderBack = () => {
    if (formMode === 'signup') {
      setFormMode('signin');
      setError(null);
      return;
    }
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Welcome');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="SAHAYIKA Access" showBack onBack={handleHeaderBack} />

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

          {/* Role Selection & Quick Access Section */}
          <View style={styles.roleCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flash-outline" size={13} color={colors.deepBlue} style={{ marginRight: 4 }} />
              <Text style={styles.roleSectionTitle}>Quick Role Access</Text>
            </View>
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
                    <Text style={[styles.roleBadgeText, { color: colors.primary }]}>Field App</Text>
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
                    <Text style={[styles.roleBadgeText, { color: colors.teal }]}>Family App</Text>
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

          {/* Credentials Card (In-place Sign In or Sign Up Form) */}
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>
              {formMode === 'signin' ? 'Or Sign In with Credentials' : 'Create New Account'}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {formMode === 'signin' ? (
              <>
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

                <View style={styles.signupPromptRow}>
                  <Text style={styles.signupPromptText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setFormMode('signup');
                      setError(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.signupLinkText}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Role Tabs for in-place signup */}
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.roleTab,
                      signupRole === 'ASHA' && [
                        styles.roleTabActive,
                        { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                      ]
                    ]}
                    onPress={() => {
                      setSignupRole('ASHA');
                      setError(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="clipboard-outline"
                      size={16}
                      color={signupRole === 'ASHA' ? colors.primary : colors.textMuted}
                    />
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      style={[
                        styles.roleTabText,
                        signupRole === 'ASHA' && { color: colors.primary, fontWeight: '700' }
                      ]}
                    >
                      ASHA Worker
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleTab,
                      signupRole === 'COMMUNITY' && [
                        styles.roleTabActive,
                        { borderColor: colors.teal, backgroundColor: colors.tealLight }
                      ]
                    ]}
                    onPress={() => {
                      setSignupRole('COMMUNITY');
                      setError(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="heart-outline"
                      size={16}
                      color={signupRole === 'COMMUNITY' ? colors.teal : colors.textMuted}
                    />
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      style={[
                        styles.roleTabText,
                        signupRole === 'COMMUNITY' && { color: colors.teal, fontWeight: '700' }
                      ]}
                    >
                      Community Member
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formCardHeader}>
                  <View
                    style={[
                      styles.badgePill,
                      { backgroundColor: signupRole === 'ASHA' ? colors.primaryLight : colors.tealLight }
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: signupRole === 'ASHA' ? colors.primary : colors.teal }
                      ]}
                    >
                      {signupRole === 'ASHA'
                        ? 'ASHA WORKER REGISTRATION'
                        : 'COMMUNITY MEMBER REGISTRATION'}
                    </Text>
                  </View>
                </View>

                <AppInput
                  label="Full Name *"
                  placeholder="e.g. Sunita Devi"
                  value={signupName}
                  onChangeText={(v) => {
                    setSignupName(v);
                    setError(null);
                  }}
                />

                <AppInput
                  label="Email Address *"
                  placeholder="e.g. name@example.com"
                  value={signupEmail}
                  onChangeText={(v) => {
                    setSignupEmail(v);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <AppInput
                  label="10-Digit Mobile Number *"
                  placeholder="e.g. 9876543210"
                  value={signupPhone}
                  onChangeText={(v) => {
                    setSignupPhone(v);
                    setError(null);
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <AppInput
                      label="Date of Birth (DD-MM-YYYY)"
                      placeholder="DD-MM-YYYY (e.g. 15-08-1995)"
                      value={signupDob}
                      onChangeText={setSignupDob}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <AppInput
                      label="Gender"
                      placeholder="Female / Male"
                      value={signupGender}
                      onChangeText={setSignupGender}
                    />
                  </View>
                </View>

                {signupRole === 'ASHA' ? (
                  <>
                    <AppInput
                      label="ASHA Worker ID / Badge"
                      placeholder="e.g. ASHA-UP-VNS-2026-001"
                      value={signupAshaId}
                      onChangeText={setSignupAshaId}
                    />
                    <AppInput
                      label="Block / Sub-District"
                      placeholder="e.g. Kashi Block"
                      value={signupBlock}
                      onChangeText={setSignupBlock}
                    />
                  </>
                ) : (
                  <>
                    <AppInput
                      label="Household / Family Code"
                      placeholder="e.g. HH-RK-042"
                      value={signupHouseholdCode}
                      onChangeText={setSignupHouseholdCode}
                    />
                    <AppInput
                      label="Ward / Sub-Area"
                      placeholder="e.g. Ward 3, Near Primary School"
                      value={signupSubArea}
                      onChangeText={setSignupSubArea}
                    />
                  </>
                )}

                <AppInput
                  label="Village / Assigned Area *"
                  placeholder="e.g. Rampur Kalan"
                  value={signupVillageName}
                  onChangeText={(v) => {
                    setSignupVillageName(v);
                    setError(null);
                  }}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <AppInput
                      label="District"
                      placeholder="District"
                      value={signupDistrict}
                      onChangeText={setSignupDistrict}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <AppInput
                      label="State"
                      placeholder="State"
                      value={signupState}
                      onChangeText={setSignupState}
                    />
                  </View>
                </View>

                <AppInput
                  label="Street Address"
                  placeholder="House number, street or landmark"
                  value={signupAddress}
                  onChangeText={setSignupAddress}
                />

                <AppInput
                  label="Password (min 8 characters) *"
                  placeholder="Create strong password"
                  value={signupPassword}
                  onChangeText={(v) => {
                    setSignupPassword(v);
                    setError(null);
                  }}
                  secureTextEntry
                />

                <AppInput
                  label="Confirm Password *"
                  placeholder="Re-enter password"
                  value={signupConfirmPassword}
                  onChangeText={(v) => {
                    setSignupConfirmPassword(v);
                    setError(null);
                  }}
                  secureTextEntry
                />

                <AppButton
                  title={`Register as ${signupRole === 'ASHA' ? 'ASHA Worker' : 'Community Member'}`}
                  onPress={handleSignup}
                  loading={loading}
                  size="large"
                  variant={signupRole === 'ASHA' ? 'primary' : 'teal'}
                  style={{ marginTop: spacing.md }}
                />

                <View style={styles.signupPromptRow}>
                  <Text style={styles.signupPromptText}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setFormMode('signin');
                      setError(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.signupLinkText,
                        { color: signupRole === 'ASHA' ? colors.primary : colors.teal }
                      ]}
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.deepBlue
  },
  roleSectionDesc: {
    fontSize: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  roleSubtitle: {
    fontSize: 12,
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
    paddingHorizontal: 16,
    paddingVertical: spacing.cardPadding,
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
  },
  signupPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md
  },
  signupPromptText: {
    fontSize: 13,
    color: colors.secondaryText
  },
  signupLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  roleSelector: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 3,
    marginBottom: spacing.md,
    gap: 6
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden'
  },
  roleTabActive: {
    ...shadows.soft
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 5,
    flexShrink: 1
  },
  formCardHeader: {
    marginBottom: spacing.sm,
    alignItems: 'center'
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  rowInputs: {
    flexDirection: 'row'
  }
});

export default LoginScreen;
