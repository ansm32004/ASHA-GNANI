import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';

export const AppCard = ({
  children,
  onPress = null,
  style = null,
  variant = 'default' // 'default' | 'highlight' | 'urgent' | 'teal'
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'highlight':
        return { borderColor: colors.primaryMuted, backgroundColor: colors.primaryLight };
      case 'urgent':
        return { borderColor: 'transparent', backgroundColor: colors.dangerLight };
      case 'teal':
        return { borderColor: 'transparent', backgroundColor: colors.tealLight };
      default:
        return { borderColor: 'transparent', backgroundColor: colors.surface };
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;
  const custom = getCardStyle();

  return (
    <CardComponent
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[
        styles.card,
        {
          borderColor: custom.borderColor,
          backgroundColor: custom.backgroundColor
        },
        style
      ]}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginVertical: spacing.xs,
    borderWidth: 1,
    ...shadows.card
  }
});
