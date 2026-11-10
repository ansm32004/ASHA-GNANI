import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, shadows, spacing } from '../../theme';
import { Waveform } from './Waveform';
import { VoiceStudioHeroVector } from '../illustrations/CategoryVectors';

export const VoiceControl = ({
  isRecording = false,
  isProcessing = false,
  durationSeconds = 0,
  onPress,
  instructionText = 'Tap to speak naturally in Hindi or English'
}) => {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      {/* Waveform representation */}
      <View style={styles.waveformWrap}>
        <Waveform isRecording={isRecording} />
      </View>

      {/* Main Microphone Action Sphere */}
      <TouchableOpacity
        onPress={onPress}
        disabled={isProcessing}
        activeOpacity={0.85}
        style={[
          styles.outerOrb,
          isRecording && styles.outerOrbActive,
          isProcessing && styles.outerOrbProcessing
        ]}
      >
        {isProcessing ? (
          <View style={styles.processingSphere}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isRecording ? (
          <View style={styles.recordingSphere}>
            <View style={styles.stopIcon} />
          </View>
        ) : (
          <View style={styles.idleSphere}>
            <Ionicons name="mic" size={36} color={colors.textWhite} />
          </View>
        )}
      </TouchableOpacity>

      {/* Live Recording Timer or Instructions */}
      {isRecording ? (
        <View style={styles.timerRow}>
          <View style={styles.livePulse} />
          <Text style={styles.timerText}>{tr(formatTime(durationSeconds))}</Text>
          <Text style={styles.listeningNotice}>{tr('Listening... (Tap to finish)')}</Text>
        </View>
      ) : (
        <Text style={styles.instruction}>{tr(instructionText)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg
  },
  waveformWrap: {
    marginBottom: spacing.md
  },
  outerOrb: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft
  },
  outerOrbActive: {
    backgroundColor: colors.dangerLight,
    borderWidth: 2,
    borderColor: colors.danger
  },
  outerOrbProcessing: {
    backgroundColor: colors.surfaceSecondary
  },
  idleSphere: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recordingSphere: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stopIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: colors.textWhite
  },
  processingSphere: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    marginRight: 6
  },
  timerText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.danger,
    marginRight: 8
  },
  listeningNotice: {
    ...typography.caption,
    color: colors.textSecondary
  },
  instruction: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
    maxWidth: 240
  }
});

