import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useLanguageStore } from '../../store/languageStore';

export const AppHeader = ({
  title,
  subtitle = null,
  showBack = false,
  onBack = null,
  rightAction = null,
  showLanguageToggle = false
}) => {
  const { uiLanguage, setUiLanguage } = useLanguageStore();

  const toggleLanguage = () => {
    setUiLanguage(uiLanguage === 'hi' ? 'en' : 'hi');
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityLabel={tr('Back')}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleColumn}>
          <Text style={styles.title} numberOfLines={1}>{tr(title)}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{tr(subtitle)}</Text>}
        </View>
      </View>

      <View style={styles.rightRow}>
        {showLanguageToggle && (
          <TouchableOpacity
            onPress={toggleLanguage}
            style={styles.langPill}
            accessibilityLabel={tr('Toggle Language')}
            activeOpacity={0.8}
          >
            <Text style={styles.langText}>
              {tr(uiLanguage === 'hi' ? 'English' : 'हिन्दी')}
            </Text>
          </TouchableOpacity>
        )}
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent'
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    ...shadows.soft
  },
  titleColumn: {
    flex: 1
  },
  title: {
    ...typography.heading1,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  langPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    ...shadows.soft,
    marginLeft: spacing.sm
  },
  langText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600'
  }
});
