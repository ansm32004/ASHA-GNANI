import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, shadows, radius, spacing } from '../../theme';

/**
 * ConversationBubble
 * Clean conversational speech bubble for voice dialogues.
 * Supports worker prompts (right aligned, light blue/white) and Sahayika assistant responses (left aligned, crisp white with speaker icon).
 */
export const ConversationBubble = ({
  role = 'assistant', // 'assistant' | 'user'
  text,
  timestamp,
  audioPlayable = false,
  isPlayingAudio = false,
  onPlayAudio
}) => {
  const isAssistant = role === 'assistant';

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
            {audioPlayable && onPlayAudio && (
              <TouchableOpacity
                style={styles.speakerBtn}
                onPress={onPlayAudio}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
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
                    stroke={isPlayingAudio ? colors.teal : colors.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.listenLabel}>{isPlayingAudio ? 'Playing...' : 'Listen'}</Text>
              </TouchableOpacity>
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
  speakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4
  },
  listenLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary
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

