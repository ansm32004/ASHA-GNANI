import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../../theme';

export const StatusBadge = ({ status, size = 'medium' }) => {
  const getBadgeStyle = () => {
    const s = (status || '').toLowerCase();
    if (s.includes('urgent') || s.includes('overdue') || s.includes('danger')) {
      return { bg: colors.dangerLight, text: colors.danger, border: '#F7C5C5' };
    }
    if (s.includes('today') || s.includes('due') || s.includes('progress') || s.includes('acknowledged') || s.includes('pending')) {
      return { bg: colors.warningLight, text: colors.warning, border: '#FCE0B3' };
    }
    if (s.includes('complete') || s.includes('confirm') || s.includes('resolve') || s.includes('approve') || s.includes('verified') || s.includes('disbursed')) {
      return { bg: colors.successLight, text: colors.success, border: '#C0E6D6' };
    }
    return { bg: colors.surfaceSecondary, text: colors.textSecondary, border: colors.border };
  };

  const badgeTheme = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeTheme.bg,
          borderColor: badgeTheme.border,
          paddingVertical: size === 'small' ? 2 : 4,
          paddingHorizontal: size === 'small' ? 8 : 10
        }
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: badgeTheme.text,
            fontSize: size === 'small' ? 10 : 11
          }
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  text: {
    ...typography.caption,
    fontWeight: '600'
  }
});
