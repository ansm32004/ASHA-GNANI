import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../../theme';

export const StatusIndicator = ({ status = 'Normal', isPriority = false }) => {
  const norm = (status || '').toLowerCase();

  const getStyle = () => {
    if (isPriority) {
      if (norm.includes('urgent')) return { bg: colors.dangerLight, text: colors.danger };
      if (norm.includes('high') || norm.includes('priority')) return { bg: colors.warningLight, text: colors.warning };
      return { bg: colors.surfaceSecondary, text: colors.textSecondary };
    }

    if (norm.includes('completed') || norm.includes('resolved') || norm.includes('verified')) {
      return { bg: colors.successLight, text: colors.success };
    }
    if (norm.includes('due today') || norm.includes('in progress') || norm.includes('acknowledged')) {
      return { bg: colors.primaryLight, text: colors.primary };
    }
    if (norm.includes('overdue') || norm.includes('urgent') || norm.includes('escalated')) {
      return { bg: colors.dangerLight, text: colors.danger };
    }
    return { bg: colors.surfaceSecondary, text: colors.textSecondary };
  };

  const current = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: current.bg }]}>
      <Text style={[styles.badgeText, { color: current.text }]}>
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start'
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700'
  }
});

