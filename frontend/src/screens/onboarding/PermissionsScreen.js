import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { useTranslation } from 'react-i18next';

export const PermissionsScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const handleGrantAndContinue = () => {
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title={t('auth.permissionsTitle') || 'App Permissions'} showLanguageToggle={false} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.iconCircle}>
          <Ionicons name="key" size={36} color={colors.primary} />
        </View>

        <Text style={styles.title}>{t('auth.permissionsTitle') || 'Permissions Needed'}</Text>
        <Text style={styles.subtitle}>
          {t('auth.permissionsSubtitle') || 'To record voice visits and navigate emergency routing'}
        </Text>

        <View style={styles.permList}>
          <View style={styles.permCard}>
            <View style={styles.permIconBg}>
              <Ionicons name="mic" size={22} color={colors.primary} />
            </View>
            <View style={styles.permTextCol}>
              <Text style={styles.permName}>माइक्रोफ़ोन (Microphone)</Text>
              <Text style={styles.permDesc}>
                {t('auth.microphonePerm') || 'Required for voice visits and speech notes'}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>

          <View style={styles.permCard}>
            <View style={styles.permIconBg}>
              <Ionicons name="location" size={22} color={colors.primary} />
            </View>
            <View style={styles.permTextCol}>
              <Text style={styles.permName}>लोकेशन (Location)</Text>
              <Text style={styles.permDesc}>
                {t('auth.locationPerm') || 'Required for SOS 112 emergency routing'}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>

          <View style={styles.permCard}>
            <View style={styles.permIconBg}>
              <Ionicons name="notifications" size={22} color={colors.primary} />
            </View>
            <View style={styles.permTextCol}>
              <Text style={styles.permName}>सूचनाएं (Notifications)</Text>
              <Text style={styles.permDesc}>
                {t('auth.notificationsPerm') || 'Required for due visits and vaccination reminders'}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>
        </View>

        <AppButton
          title={t('auth.grantPermissions') || 'Grant & Continue to SAHAYIKA'}
          onPress={handleGrantAndContinue}
          size="large"
          style={styles.btn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    padding: spacing.screenPadding,
    alignItems: 'center',
    paddingBottom: spacing.xxxl
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
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
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md
  },
  permList: {
    width: '100%',
    marginBottom: spacing.xxl
  },
  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.card,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  permIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  permTextCol: {
    flex: 1,
    marginRight: spacing.sm
  },
  permName: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary
  },
  permDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  btn: {
    width: '100%'
  }
});
