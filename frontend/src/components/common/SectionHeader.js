import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export const SectionHeader = ({
  title,
  subtitle = null,
  actionText = 'See all',
  onAction = null,
  style = null
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleColumn}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.75}
          style={styles.actionBtn}
          accessibilityLabel={actionText}
        >
          <Text style={styles.actionText}>{actionText} ➔</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    marginTop: spacing.majorSection,
    marginBottom: spacing.relatedElements
  },
  titleColumn: {
    flex: 1,
    marginRight: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  actionBtn: {
    minHeight: 36,
    justifyContent: 'center',
    paddingLeft: 8
  },
  actionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700'
  }
});

export default SectionHeader;
