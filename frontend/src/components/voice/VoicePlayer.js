import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';

export const VoicePlayer = ({ title = "Audio Playback", duration = "0:07" }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setIsPlaying(!isPlaying)}
        style={styles.playButton}
        accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={20}
          color={colors.textWhite}
        />
      </TouchableOpacity>
      <View style={styles.infoColumn}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.track}>
          <View style={[styles.progress, { width: isPlaying ? '65%' : '0%' }]} />
        </View>
      </View>
      <Text style={styles.duration}>{duration}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryMuted
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  infoColumn: {
    flex: 1,
    marginRight: spacing.md
  },
  title: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDeep,
    marginBottom: 4
  },
  track: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden'
  },
  progress: {
    height: '100%',
    backgroundColor: colors.primary
  },
  duration: {
    ...typography.caption,
    color: colors.textSecondary
  }
});

