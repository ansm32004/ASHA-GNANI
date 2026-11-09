import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import { useAuthStore } from '../../store/authStore';

export const SplashScreen = ({ navigation }) => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      const timer = setTimeout(() => {
        navigation.replace('MainTabs');
      }, 1400);
      return () => clearTimeout(timer);
    };
    init();
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => navigation.replace('MainTabs')}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.logoBadge}>
        <Ionicons name="heart-pulse" size={54} color={colors.primary} />
      </View>
      <Text style={styles.title}>सहायिका</Text>
      <Text style={styles.subTitle}>SAHAYIKA</Text>
      <Text style={styles.tagline}>Voice-First Digital Companion for ASHA Workers</Text>

      <View style={styles.enterButton}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.enterText}>प्रवेश करें (Enter App)</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textWhite} style={{ marginLeft: 4 }} />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.motto}>
          "Spend less time managing records. Spend more time supporting people."
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl']
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryMuted,
    ...shadows.soft
  },
  title: {
    ...typography.displayLarge,
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: 0.5
  },
  subTitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.primary,
    letterSpacing: 3,
    fontWeight: '700',
    marginTop: 4
  },
  tagline: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 280
  },
  enterButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
    marginTop: spacing.xl,
    ...shadows.soft
  },
  enterText: {
    ...typography.button,
    fontWeight: '700',
    color: colors.textWhite
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    paddingHorizontal: spacing.lg
  },
  motto: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18
  }
});
