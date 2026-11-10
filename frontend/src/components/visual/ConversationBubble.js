import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, radius, spacing } from '../../theme';
import { AvatarImage } from '../common/AvatarImage';

/**
 * ConversationBubble
 * Clean conversational speech bubble for voice dialogues.
 * Supports worker prompts (right aligned, light blue/white) and Sahayika assistant responses (left aligned, crisp white with speaker and pause/resume controls).
 */
export const ConversationBubble = ({
  role = 'assistant', // 'assistant' | 'user'
  text,
  timestamp,
  audioPlayable = false,
  isPlayingAudio = false,
  isPausedAudio = false,
  isLoadingAudio = false,
  onPlayAudio,
  onPauseAudio,
  onResumeAudio,
  onToggleAudio
}) => {
  const isAssistant = role === 'assistant';

  const handleAudioPress = () => {
    if (onToggleAudio) {
      onToggleAudio();
    } else if (isPlayingAudio && onPauseAudio) {
      onPauseAudio();
    } else if (isPausedAudio && onResumeAudio) {
      onResumeAudio();
    } else if (onPlayAudio) {
      onPlayAudio();
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        isAssistant ? styles.wrapperLeft : styles.wrapperRight
      ]}
    >
      <View
        style={[
          styles.bubble,
          isAssistant ? styles.bubbleAssistant : styles.bubbleUser
        ]}
      >
        {isAssistant && (
          <View style={styles.assistantHeader}>
            <AvatarImage
              name="Sahayika Companion"
              role="ASHA"
              size={20}
            />
            <Text style={styles.assistantName}>{tr('Sahayika Companion')}</Text>
            {audioPlayable && (onPlayAudio || onToggleAudio) && (
              <View style={styles.audioControlsRow}>
                {/* Single In-Place Listen / Pause / Resume Button */}
                <TouchableOpacity
                  style={[
                    styles.speakerBtn,
                    isPlayingAudio && styles.speakerBtnPlaying,
                    isPausedAudio && styles.speakerBtnPaused
                  ]}
                  onPress={handleAudioPress}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={
                    tr(isPlayingAudio ? 'Pause Audio' : isPausedAudio ? 'Resume Audio' : 'Listen to Audio')
                  }
                >
                  {isLoadingAudio ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ transform: [{ scale: 0.7 }], width: 14, height: 14 }} />
                  ) : isPlayingAudio ? (
                    <Ionicons name="pause" size={13} color="#92400E" />
                  ) : isPausedAudio ? (
                    <Ionicons name="play" size={13} color="#15803D" />
                  ) : (
                    <Ionicons name="volume-high-outline" size={14} color={colors.primary} />
                  )}
                  <Text
                    style={[
                      styles.listenLabel,
                      isPlayingAudio && styles.listenLabelPlaying,
                      isPausedAudio && styles.listenLabelPaused,
                      isLoadingAudio && styles.listenLabelLoading
                    ]}
                  >
                    {tr(isLoadingAudio ? 'Loading...' : isPlayingAudio ? 'Pause' : isPausedAudio ? 'Resume' : 'Listen')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.messageText, !isAssistant && styles.userMessageText]}>
          {tr(text)}
        </Text>

        {timestamp ? (
          <Text style={[styles.timeText, !isAssistant && styles.userTimeText]}>
            {tr(timestamp)}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
    paddingHorizontal: spacing.screenPadding,
    width: '100%'
  },
  wrapperLeft: {
    alignItems: 'flex-start'
  },
  wrapperRight: {
    alignItems: 'flex-end'
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 4,
    ...shadows.card
  },
  bubbleUser: {
    backgroundColor: colors.ink,
    borderTopRightRadius: 4,
    ...shadows.subtle
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.tealDark
  },
  assistantName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryText,
    flex: 1
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  speakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4
  },
  speakerBtnPlaying: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  speakerBtnPaused: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  listenLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary
  },
  listenLabelPlaying: {
    color: '#92400E',
    fontWeight: '600'
  },
  listenLabelPaused: {
    color: '#15803D',
    fontWeight: '600'
  },
  listenLabelLoading: {
    color: colors.primary,
    fontStyle: 'italic'
  },
  messageText: {
    fontSize: 14,
    color: colors.primaryText,
    lineHeight: 20
  },
  userMessageText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '500'
  },
  timeText: {
    fontSize: 10,
    color: colors.secondaryText,
    marginTop: 6,
    alignSelf: 'flex-end'
  },
  userTimeText: {
    color: '#E0EEFA',
    marginTop: 6,
    alignSelf: 'flex-end'
  }
});

export default ConversationBubble;


