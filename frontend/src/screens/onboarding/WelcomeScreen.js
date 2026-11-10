import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppButton } from '../../components/common/AppButton';
import { useTranslation } from 'react-i18next';

export const WelcomeScreen = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topIllustration}>
          <View style={styles.iconCircle}>
            <Ionicons name="people" size={48} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>{tr(t('auth.welcomeTitle') || 'Welcome to SAHAYIKA')}</Text>
        <Text style={styles.subtitle}>
          {tr(t('auth.welcomeSubtitle') || 'Your dependable daily health work companion')}
        </Text>

        <View style={styles.featuresCard}>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="mic-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>{tr('आवाज से रिकॉर्डिंग (Voice-First)')}</Text>
              <Text style={styles.featureDesc}>{tr('विजिट के बाद बोलें, सहायिका खुद सारा विवरण फॉर्म में भर देगी।')}</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.tealLight }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.teal} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>{tr('फॉलो-अप याद दिलाना')}</Text>
              <Text style={styles.featureDesc}>{tr('टीकाकरण और गर्भवती महिलाओं के चेकअप कभी नहीं छूटेंगे।')}</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>{tr('प्रोत्साहन दावा सहायक (Claims)')}</Text>
              <Text style={styles.featureDesc}>{tr('माह के अंत में सभी गतिविधियों का दावा आसानी से तैयार करें।')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            title="शुरू करें (Choose Language)"
            onPress={() => navigation.navigate('LanguageSelection')}
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  container: {
    padding: spacing.screenPadding,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
    paddingBottom: spacing.xxxl
  },
  topIllustration: {
    alignItems: 'center',
    marginVertical: spacing.lg
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryMuted,
    ...shadows.soft
  },
  title: {
    ...typography.heading1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md
  },
  featuresCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadows.soft
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: spacing.sm
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  featureTextCol: {
    flex: 1
  },
  featureTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary
  },
  featureDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.md
  }
});
