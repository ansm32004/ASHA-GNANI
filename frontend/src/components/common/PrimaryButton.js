import { tr } from '../../localisation/tr';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, typography, radius, shadows, spacing } from '../../theme';

export const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon = null,
  size = 'large', // 'small' | 'medium' | 'large'
  style = null,
  textStyle = null
}) => {
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
      activeOpacity={0.85}
      style={[
        styles.button,
        {
          minHeight: getMinHeight(),
          backgroundColor: disabled ? colors.surfaceSecondary : colors.ink
        },
        !disabled && shadows.soft,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textWhite} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { color: disabled ? colors.textMuted : colors.textWhite },
              textStyle
            ]}
          >
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
    paddingHorizontal: spacing.xl,
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

