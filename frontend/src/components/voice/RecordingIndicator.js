import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme';

export const RecordingIndicator = ({ durationSeconds = 0, isRecording = false }) => {
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.indicatorDot,
          { backgroundColor: isRecording ? colors.critical : colors.borderStrong }
        ]}
      />
      <Text style={styles.timeText}>{formatTime(durationSeconds)}</Text>
      <Text style={styles.statusText}>
        {isRecording ? "Recording Audio..." : "Ready to speak"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
    marginVertical: spacing.sm
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm
  },
  timeText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary
  }
});

