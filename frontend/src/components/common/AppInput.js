import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';

export const AppInput = ({
  label = null,
  value,
  onChangeText,
  placeholder = '',
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  error = null,
  helperText = null,
  editable = true,
  rightIcon = null,
  style = null
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          multiline && { minHeight: numberOfLines * 24 + 24 },
          error && styles.errorWrapper,
          !editable && styles.disabledWrapper
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            !editable && { color: colors.textSecondary }
          ]}
        />
        {rightIcon && <View style={styles.iconWrapper}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    width: '100%'
  },
  label: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 6
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    minHeight: 48,
    paddingHorizontal: spacing.base,
    width: '100%'
  },
  errorWrapper: {
    borderColor: colors.danger
  },
  disabledWrapper: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border
  },
  input: {
    ...typography.bodyMedium,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: spacing.sm
  },
  iconWrapper: {
    marginLeft: spacing.sm
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs
  }
});
