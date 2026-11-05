import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { AppHeader } from '../../components/common/AppHeader';
import { useAuthStore } from '../../store/authStore';

export const SignupScreen = ({ navigation }) => {
  const { register } = useAuthStore();

  const [role, setRole] = useState('ASHA'); // 'ASHA' | 'COMMUNITY'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Female');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Uttar Pradesh');
  const [district, setDistrict] = useState('Varanasi');
  const [villageName, setVillageName] = useState('Rampur Kalan');

  // ASHA Specific
  const [ashaId, setAshaId] = useState('');
  const [block, setBlock] = useState('Kashi Block');

  // Community Specific
  const [householdCode, setHouseholdCode] = useState('');
  const [subArea, setSubArea] = useState('');

  const validateForm = () => {
    if (!name.trim()) {
      return 'Please enter your full name.';
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      return 'Please enter a valid email address.';
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return 'Please enter a valid 10-digit Indian mobile number.';
    }
    if (!villageName.trim()) {
      return 'Please specify your village or assigned area.';
    }
    if (!password || password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSignup = async () => {
    setError(null);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const cleanPhone = phone.replace(/\D/g, '');

    const payload = {
      role,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      password,
      dob: dob.trim() || undefined,
      gender,
      address: address.trim() || undefined,
      state: state.trim() || 'Uttar Pradesh',
      district: district.trim() || 'Varanasi',
      village_name: villageName.trim(),
      ...(role === 'ASHA'
        ? {
            asha_id: ashaId.trim() || undefined,
            block: block.trim() || undefined
          }
        : {
            household_code: householdCode.trim() || undefined,
            sub_area: subArea.trim() || undefined
          })
    };

    const res = await register(payload);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed. Please check details.');
    }
  };

  const isAsha = role === 'ASHA';
  const activeColor = isAsha ? colors.primary : colors.teal;
  const activeLight = isAsha ? colors.primaryLight : colors.tealLight;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Create Account"
        showBack
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login'))}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header Title */}
          <Text style={styles.title}>Join SAHAYIKA</Text>
          <Text style={styles.subtitle}>Select your role and enter your details to register</Text>

          {/* Role Selection Tabs */}
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                isAsha && [styles.roleTabActive, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]
              ]}
              onPress={() => {
                setRole('ASHA');
                setError(null);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="clipboard-outline"
                size={16}
                color={isAsha ? colors.primary : colors.textMuted}
              />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[styles.roleTabText, isAsha && { color: colors.primary, fontWeight: '700' }]}
              >
                ASHA Worker
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                !isAsha && [styles.roleTabActive, { borderColor: colors.teal, backgroundColor: colors.tealLight }]
              ]}
              onPress={() => {
                setRole('COMMUNITY');
                setError(null);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="heart-outline"
                size={16}
                color={!isAsha ? colors.teal : colors.textMuted}
              />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[styles.roleTabText, !isAsha && { color: colors.teal, fontWeight: '700' }]}
              >
                Community Member
              </Text>
            </TouchableOpacity>
          </View>

          {/* Registration Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={[styles.badgePill, { backgroundColor: activeLight }]}>
                <Text style={[styles.badgeText, { color: activeColor }]}>
                  {isAsha ? 'ASHA WORKER REGISTRATION' : 'COMMUNITY MEMBER REGISTRATION'}
                </Text>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Basic Info */}
            <AppInput
              label="Full Name *"
              placeholder="e.g. Sunita Devi"
              value={name}
              onChangeText={(v) => {
                setName(v);
                setError(null);
              }}
            />

            <AppInput
              label="Email Address *"
              placeholder="e.g. name@example.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <AppInput
              label="10-Digit Mobile Number *"
              placeholder="e.g. 9876543210"
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                setError(null);
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />

            {/* Demographics */}
            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <AppInput
                  label="Date of Birth"
                  placeholder="YYYY-MM-DD"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <AppInput
                  label="Gender"
                  placeholder="Female / Male"
                  value={gender}
                  onChangeText={setGender}
                />
              </View>
            </View>

            {/* Role Specific Fields */}
            {isAsha ? (
              <>
                <AppInput
                  label="ASHA Worker ID / Badge"
                  placeholder="e.g. ASHA-UP-VNS-2026-001"
                  value={ashaId}
                  onChangeText={setAshaId}
                />
                <AppInput
                  label="Block / Sub-District"
                  placeholder="e.g. Kashi Block"
                  value={block}
                  onChangeText={setBlock}
                />
              </>
            ) : (
              <>
                <AppInput
                  label="Household / Family Code"
                  placeholder="e.g. HH-RK-042"
                  value={householdCode}
                  onChangeText={setHouseholdCode}
                />
                <AppInput
                  label="Ward / Sub-Area"
                  placeholder="e.g. Ward 3, Near Primary School"
                  value={subArea}
                  onChangeText={setSubArea}
                />
              </>
            )}

            {/* Location Details */}
            <AppInput
              label="Village / Assigned Area *"
              placeholder="e.g. Rampur Kalan"
              value={villageName}
              onChangeText={(v) => {
                setVillageName(v);
                setError(null);
              }}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <AppInput
                  label="District"
                  placeholder="District"
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <AppInput
                  label="State"
                  placeholder="State"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            <AppInput
              label="Street Address"
              placeholder="House number, street or landmark"
              value={address}
              onChangeText={setAddress}
            />

            {/* Password Credentials */}
            <AppInput
              label="Password (min 8 characters) *"
              placeholder="Create strong password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError(null);
              }}
              secureTextEntry
            />

            <AppInput
              label="Confirm Password *"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                setError(null);
              }}
              secureTextEntry
            />

            {/* Submit Button */}
            <AppButton
              title={`Register as ${isAsha ? 'ASHA Worker' : 'Community Member'}`}
              onPress={handleSignup}
              loading={loading}
              size="large"
              variant={isAsha ? 'primary' : 'teal'}
              style={{ marginTop: spacing.md }}
            />

            {/* Already have an account prompt */}
            <View style={styles.signInPromptRow}>
              <Text style={styles.signInPromptText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={[styles.signInLinkText, { color: activeColor }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: spacing.xxxl
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginTop: spacing.xs
  },
  subtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.md
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
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.cardPadding,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
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
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: 8
  },
  signInPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md
  },
  signInPromptText: {
    fontSize: 13,
    color: colors.secondaryText
  },
  signInLinkText: {
    fontSize: 13,
    fontWeight: '700'
  }
});

export default SignupScreen;
