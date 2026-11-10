import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, radius, spacing } from '../../theme';

/**
 * FloatingPanel
 * Reusable clean white floating panel with soft border, gentle elevation,
 * and balanced padding. Used throughout the mature Phase 2 redesign.
 */
export const FloatingPanel = ({
  children,
  style,
  onPress,
  activeOpacity = 0.85,
  highlightColor,
  padding = spacing.cardPadding
}) => {
  const containerStyle = [
    styles.panel,
    { padding },
        style
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.screenPadding,
    marginVertical: spacing.xs,
    ...shadows.card
  }
});

export default FloatingPanel;

