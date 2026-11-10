import { tr } from '../../localisation/tr';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme';

export const AppButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'teal'
  size = 'medium',     // 'small' | 'medium' | 'large'
  disabled = false,
  loading = false,
  icon = null,
  style = null,
  textStyle = null
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceSecondary;
    switch (variant) {
      case 'primary': return colors.ink;
      case 'secondary': return colors.surfaceSecondary;
      case 'teal': return colors.teal;
      case 'danger': return colors.danger;
      case 'outline': return 'transparent';
      default: return colors.ink;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary': return colors.textWhite;
      case 'secondary': return colors.ink;
      case 'teal': return colors.textWhite;
      case 'danger': return colors.textWhite;
      case 'outline': return colors.ink;
      default: return colors.textWhite;
    }
  };

  const getMinHeight = () => {
    switch (size) {
      case 'small': return 40;
      case 'large': return 56;
      default: return 48; // minimum comfortable touch target
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          minHeight: getMinHeight(),
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: variant === 'outline' ? colors.borderStrong : 'transparent',
          paddingHorizontal: size === 'small' ? spacing.md : spacing.xl
        },
        variant === 'primary' && !disabled && shadows.soft,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {tr(title)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: spacing.xs
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconContainer: {
    marginRight: spacing.sm
  },
  text: {
    ...typography.button,
    textAlign: 'center'
  }
});
