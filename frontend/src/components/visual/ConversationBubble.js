import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, radius, spacing } from '../../theme';

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
            <View style={styles.avatarMini}>
              <Text style={styles.avatarInitial}>S</Text>
            </View>
            <Text style={styles.assistantName}>Sahayika Companion</Text>
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
                    isPlayingAudio ? 'Pause Audio' : isPausedAudio ? 'Resume Audio' : 'Listen to Audio'
                  }
                >
                  {isLoadingAudio ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ transform: [{ scale: 0.7 }], width: 14, height: 14 }} />
                  ) : isPlayingAudio ? (
                    <Ionicons name="pause" size={13} color="#92400E" />
                  ) : isPausedAudio ? (
                    <Ionicons name="play" size={13} color="#15803D" />
                  ) : (
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M11 5L6 9H2V15H6L11 19V5Z"
                        stroke={colors.primary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M19.07 4.93C20.94 6.81 22 9.35 22 12C22 14.65 20.94 17.19 19.07 19.07M15.54 8.46C16.47 9.4 17 10.66 17 12C17 13.34 16.47 14.6 15.54 15.54"
                        stroke={colors.primary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                  <Text
                    style={[
                      styles.listenLabel,
                      isPlayingAudio && styles.listenLabelPlaying,
                      isPausedAudio && styles.listenLabelPaused,
                      isLoadingAudio && styles.listenLabelLoading
                    ]}
                  >
                    {isLoadingAudio ? 'Loading...' : isPlayingAudio ? 'Pause' : isPausedAudio ? 'Resume' : 'Listen'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.messageText, !isAssistant && styles.userMessageText]}>
          {text}
        </Text>

        {timestamp ? (
          <Text style={[styles.timeText, !isAssistant && styles.userTimeText]}>
            {timestamp}
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
    borderRadius: 20,
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
    backgroundColor: colors.primary,
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
    borderRadius: 10,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.tealDark
  },
  assistantName: {
    fontSize: 11,
    fontWeight: '700',
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
    borderColor: '#FCD34D'
  },
  speakerBtnPaused: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  listenLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary
  },
  listenLabelPlaying: {
    color: '#92400E',
    fontWeight: '700'
  },
  listenLabelPaused: {
    color: '#15803D',
    fontWeight: '700'
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


