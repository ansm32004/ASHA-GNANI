import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, typography, radius, spacing } from '../../theme';

export const SecondaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon = null,
  variant = 'light', // 'light' | 'outline'
  size = 'large',
  style = null,
  textStyle = null
}) => {
  const isOutline = variant === 'outline';

  const getMinHeight = () => {
    switch (size) {
      case 'small': return 38;
      case 'medium': return 46;
      default: return 52;
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
          minHeight: getMinHeight(),
          backgroundColor: isOutline ? 'transparent' : colors.primaryLight,
          borderWidth: isOutline ? 1 : 0,
          borderColor: colors.border
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { color: isOutline ? colors.textPrimary : colors.primary },
              textStyle
            ]}
          >
            {title}
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
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconWrap: {
    marginRight: spacing.sm
  },
  text: {
    ...typography.button,
    fontWeight: '600',
    textAlign: 'center'
  }
});

