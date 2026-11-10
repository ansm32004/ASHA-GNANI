import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../../theme';

export const PriorityBadge = ({ priority }) => {
  const getColors = () => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
        return { bg: colors.dangerLight, text: colors.danger, border: '#F7C5C5' };
      case 'high':
      case 'priority':
        return { bg: colors.warningLight, text: colors.warning, border: '#FCE0B3' };
      case 'medium':
        return { bg: colors.primaryLight, text: colors.primary, border: colors.primaryMuted };
      default:
        return { bg: colors.surfaceSecondary, text: colors.textSecondary, border: colors.border };
    }
  };

  const style = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.text, { color: style.text }]}>{tr(priority || 'Routine')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10
  }
});
