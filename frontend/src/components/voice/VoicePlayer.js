import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import { audioService, useAudioPlayback } from '../../services/audio/audioService';

export const VoicePlayer = ({
  title = "Audio Playback",
  duration = "0:07",
  audioUrl = null,
  audioId = 'voice_player_default',
  isPlaying: propIsPlaying,
  isPaused: propIsPaused,
  onPlay,
  onPause,
  onResume,
  onToggle
}) => {
  const playback = useAudioPlayback(audioId);

  const isPlaying = propIsPlaying !== undefined ? propIsPlaying : playback.isPlaying;
  const isPaused = propIsPaused !== undefined ? propIsPaused : playback.isPaused;

  const handlePress = async () => {
    if (onToggle) {
      onToggle();
      return;
    }

    if (isPlaying) {
      if (onPause) {
        onPause();
      } else {
        await audioService.pauseAudio();
      }
    } else if (isPaused) {
      if (onResume) {
        onResume();
      } else {
        await audioService.resumeAudio();
      }
    } else {
      if (onPlay) {
        onPlay();
      } else if (audioUrl) {
        await audioService.playAudio(audioUrl, null, audioId);
      }
    }
  };

  const handlePause = async () => {
    if (onPause) {
      onPause();
    } else {
      await audioService.pauseAudio();
    }
  };

  const handleResume = async () => {
    if (onResume) {
      onResume();
    } else {
      await audioService.resumeAudio();
    }
  };

  const progressPct =
    playback.durationMillis > 0
      ? Math.min(100, Math.round((playback.positionMillis / playback.durationMillis) * 100))
      : isPlaying
      ? 60
      : isPaused
      ? 40
      : 0;

  return (
    <View
      style={[
        styles.container,
        isPlaying && styles.containerPlaying,
        isPaused && styles.containerPaused
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.playButton,
          isPlaying && styles.playButtonPlaying,
          isPaused && styles.playButtonPaused
        ]}
        accessibilityRole="button"
        accessibilityLabel={tr(isPlaying ? "Pause audio" : isPaused ? "Resume audio" : "Play audio")}
      >
        <Ionicons
          name={isPlaying ? "pause" : isPaused ? "play" : "play"}
          size={18}
          color={colors.textWhite}
        />
      </TouchableOpacity>

      <View style={styles.infoColumn}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{tr(title)}</Text>
          {isPlaying && <Text style={styles.statusBadgePlaying}>{tr('Playing')}</Text>}
          {isPaused && <Text style={styles.statusBadgePaused}>{tr('Paused')}</Text>}
        </View>
        <View style={styles.track}>
          <View style={[styles.progress, { width: `${progressPct}%` }]} />
        </View>
      </View>

      {/* Explicit Pause Button when playing */}
      {isPlaying && (
        <TouchableOpacity
          style={styles.actionPillPause}
          onPress={handlePause}
          accessibilityLabel={tr('Pause audio')}
        >
          <Ionicons name="pause" size={12} color="#92400E" />
          <Text style={styles.actionPillPauseText}>{tr('Pause')}</Text>
        </TouchableOpacity>
      )}

      {/* Explicit Resume Button when paused */}
      {isPaused && (
        <TouchableOpacity
          style={styles.actionPillResume}
          onPress={handleResume}
          accessibilityLabel={tr('Resume audio')}
        >
          <Ionicons name="play" size={12} color="#15803D" />
          <Text style={styles.actionPillResumeText}>{tr('Resume')}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.duration}>
        {tr(playback.durationMillis > 0
          ? `${tr(Math.floor(playback.positionMillis / 1000))}s`
          : duration)}
      </Text>
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
    borderColor: colors.primaryMuted,
    gap: 8
  },
  containerPlaying: {
    backgroundColor: '#E0F2FE',
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  containerPaused: {
    backgroundColor: '#FFFBEB',
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center'
  },
  playButtonPlaying: {
    backgroundColor: '#0284C7'
  },
  playButtonPaused: {
    backgroundColor: '#D97706'
  },
  infoColumn: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  title: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primaryDeep,
    flexShrink: 1
  },
  statusBadgePlaying: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7',
    backgroundColor: '#BAE6FD',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  statusBadgePaused: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  track: {
    height: 4,
    backgroundColor: '#E8ECF3',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progress: {
    height: '100%',
    backgroundColor: colors.ink
  },
  actionPillPause: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    gap: 4
  },
  actionPillPauseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E'
  },
  actionPillResume: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    gap: 4
  },
  actionPillResumeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D'
  },
  duration: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11
  }
});

