import { tr } from '../../localisation/tr';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppButton } from '../../components/common/AppButton';
import { GradientOrb } from '../../components/common/GradientOrb';
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

  const signupLabels = [
    ['Full name', 'पूरा नाम'],
    ['Email address', 'ईमेल पता'],
    ['Mobile number', 'मोबाइल नंबर'],
    ['Date of birth', 'जन्म तिथि'],
    ['Gender', 'लिंग']
  ];
  const label = (en, hi, required = false) => `${en}${required ? ' *' : ''} · ${hi}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Sahayika" showBack onBack={handleHeaderBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <GradientOrb size={56}>
              <Ionicons name="medical" size={24} color={colors.textWhite} />
            </GradientOrb>
            <Text style={styles.title}>Welcome to Sahayika</Text>
            <Text style={styles.subtitle}>आशा कार्यकर्ताओं और परिवारों की स्वास्थ्य साथी</Text>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Choose your role</Text>
            <Text style={styles.sectionSubtitle}>अपनी भूमिका चुनें</Text>
          </View>

          <TouchableOpacity
            style={styles.roleOption}
            onPress={handleDemoAshaLogin}
            activeOpacity={0.85}
            accessibilityLabel="Continue as ASHA Worker"
          >
            <View style={styles.roleIconPod}>
              <Ionicons name="clipboard-outline" size={21} color={colors.ink} />
            </View>
            <View style={styles.roleTextCol}>
              <Text style={styles.roleTitle}>ASHA Worker</Text>
              <Text style={styles.roleSubtitle}>फील्ड भेंट और परिवारों का रिकॉर्ड</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleOption}
            onPress={handleDemoCommunityLogin}
            activeOpacity={0.85}
            accessibilityLabel="Continue as Community Member"
          >
            <View style={styles.roleIconPod}>
              <Ionicons name="heart-outline" size={21} color={colors.ink} />
            </View>
            <View style={styles.roleTextCol}>
              <Text style={styles.roleTitle}>Community Member</Text>
              <Text style={styles.roleSubtitle}>स्वास्थ्य जानकारी और आशा दीदी से संपर्क</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              {formMode === 'signin' ? 'Sign in with email' : 'Create an account'}
            </Text>
            <Text style={[styles.sectionSubtitle, styles.formSubtitle]}>
              {formMode === 'signin' ? 'ईमेल और पासवर्ड से साइन इन करें' : 'नया खाता बनाएं'}
            </Text>

            {error ? <Text style={styles.errorText}>{tr(error)}</Text> : null}

            {formMode === 'signin' ? (
              <>
                <AppInput
                  label={label('Email address', 'ईमेल पता')}
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <AppInput
                  label={label('Password', 'पासवर्ड')}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setError(null);
                  }}
                  secureTextEntry
                />

                <AppButton
                  title="Sign in · साइन इन करें"
                  onPress={handleCredentialsLogin}
                  loading={loading}
                  size="large"
                  style={{ marginTop: spacing.sm }}
                />

                <View style={styles.signupPromptRow}>
                  <Text style={styles.signupPromptText}>New here? · खाता नहीं है?{' '}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setFormMode('signup');
                      setError(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.signupLinkText}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.roleSelector}>
                  {[
                    ['ASHA', 'ASHA Worker', 'आशा कार्यकर्ता'],
                    ['COMMUNITY', 'Community Member', 'समुदाय सदस्य']
                  ].map(([value, en, hi]) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.roleTab, signupRole === value && styles.roleTabActive]}
                      onPress={() => {
                        setSignupRole(value);
                        setError(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text numberOfLines={1} style={[styles.roleTabText, signupRole === value && styles.roleTabTextActive]}>
                        {en}
                      </Text>
                      <Text numberOfLines={1} style={styles.roleTabHint}>{hi}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <AppInput
                  label={label(...signupLabels[0], true)}
                  placeholder="Sunita Devi"
                  value={signupName}
                  onChangeText={(v) => {
                    setSignupName(v);
                    setError(null);
                  }}
                />

                <AppInput
                  label={label(...signupLabels[1], true)}
                  placeholder="name@example.com"
                  value={signupEmail}
                  onChangeText={(v) => {
                    setSignupEmail(v);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <AppInput
                  label={label(...signupLabels[2], true)}
                  placeholder="9876543210"
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
                      label={label(...signupLabels[3])}
                      placeholder="DD-MM-YYYY"
                      value={signupDob}
                      onChangeText={setSignupDob}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <AppInput
                      label={label(...signupLabels[4])}
                      placeholder="Female / महिला"
                      value={signupGender}
                      onChangeText={setSignupGender}
                    />
                  </View>
                </View>

                {signupRole === 'ASHA' ? (
                  <>
                    <AppInput
                      label={label('ASHA ID', 'आशा ID')}
                      placeholder="ASHA-UP-VNS-2026-001"
                      value={signupAshaId}
                      onChangeText={setSignupAshaId}
                    />
                    <AppInput
                      label={label('Block', 'ब्लॉक')}
                      placeholder="Kashi Block"
                      value={signupBlock}
                      onChangeText={setSignupBlock}
                    />
                  </>
                ) : (
                  <>
                    <AppInput
                      label={label('Household code', 'परिवार कोड')}
                      placeholder="HH-RK-042"
                      value={signupHouseholdCode}
                      onChangeText={setSignupHouseholdCode}
                    />
                    <AppInput
                      label={label('Ward / area', 'वार्ड / क्षेत्र')}
                      placeholder="Ward 3"
                      value={signupSubArea}
                      onChangeText={setSignupSubArea}
                    />
                  </>
                )}

                <AppInput
                  label={label('Village', 'गांव', true)}
                  placeholder="Rampur Kalan"
                  value={signupVillageName}
                  onChangeText={(v) => {
                    setSignupVillageName(v);
                    setError(null);
                  }}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <AppInput
                      label={label('District', 'ज़िला')}
                      placeholder="Varanasi"
                      value={signupDistrict}
                      onChangeText={setSignupDistrict}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <AppInput
                      label={label('State', 'राज्य')}
                      placeholder="Uttar Pradesh"
                      value={signupState}
                      onChangeText={setSignupState}
                    />
                  </View>
                </View>

                <AppInput
                  label={label('Address', 'पता')}
                  placeholder="House, street or landmark"
                  value={signupAddress}
                  onChangeText={setSignupAddress}
                />

                <AppInput
                  label={label('Password', 'पासवर्ड', true)}
                  placeholder="Min 8 characters · कम से कम 8 अक्षर"
                  value={signupPassword}
                  onChangeText={(v) => {
                    setSignupPassword(v);
                    setError(null);
                  }}
                  secureTextEntry
                />

                <AppInput
                  label={label('Confirm password', 'पासवर्ड दोबारा', true)}
                  placeholder="••••••••"
                  value={signupConfirmPassword}
                  onChangeText={(v) => {
                    setSignupConfirmPassword(v);
                    setError(null);
                  }}
                  secureTextEntry
                />

                <AppButton
                  title="Create account · खाता बनाएं"
                  onPress={handleSignup}
                  loading={loading}
                  size="large"
                  style={{ marginTop: spacing.md }}
                />

                <View style={styles.signupPromptRow}>
                  <Text style={styles.signupPromptText}>Have an account? · पहले से खाता है?{' '}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setFormMode('signin');
                      setError(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.signupLinkText}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  keyboardView: {
    flex: 1
  },
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.base,
    paddingBottom: spacing.xxxl
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  title: {
    ...typography.displayLarge,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.base
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs
  },
  sectionHead: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs
  },
  sectionTitle: {
    ...typography.heading2,
    color: colors.textPrimary
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2
  },
  formSubtitle: {
    marginBottom: spacing.base
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
    ...shadows.card
  },
  roleIconPod: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  roleTextCol: {
    flex: 1,
    marginRight: spacing.sm
  },
  roleTitle: {
    ...typography.heading3,
    fontSize: 16,
    color: colors.textPrimary
  },
  roleSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.card
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    overflow: 'hidden'
  },
  signupPromptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.base
  },
  signupPromptText: {
    ...typography.bodySmall,
    color: colors.textSecondary
  },
  signupLinkText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    textDecorationLine: 'underline'
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.base
  },
  roleTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radius.pill
  },
  roleTabActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle
  },
  roleTabText: {
    ...typography.label,
    fontSize: 13,
    color: colors.textMuted
  },
  roleTabTextActive: {
    color: colors.textPrimary
  },
  roleTabHint: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
    marginTop: 1
  },
  rowInputs: {
    flexDirection: 'row'
  }
});

export default LoginScreen;
