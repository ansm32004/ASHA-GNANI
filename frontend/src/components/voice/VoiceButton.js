import { tr } from '../../localisation/tr';
import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';

export const VoiceButton = ({
  isRecording = false,
  isProcessing = false,
  onPress,
  size = 76,
  disabled = false
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isRecording]);

  const buttonBg = isRecording ? colors.critical : colors.primary;

  return (
    <View style={styles.container}>
      {isRecording && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 28,
              height: size + 28,
              borderRadius: (size + 28) / 2,
              backgroundColor: colors.criticalLight,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        />
      )}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || isProcessing}
        activeOpacity={0.85}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: buttonBg
          }
        ]}
        accessibilityRole="button"
        accessibilityLabel={tr(isRecording ? "Stop voice recording" : "Start voice recording")}
      >
        <Ionicons
          name={isRecording ? "stop" : (isProcessing ? "hourglass" : "mic")}
          size={size * 0.48}
          color={colors.textWhite}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16
  },
  pulseRing: {
    position: 'absolute'
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowElevated,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6
  }
});

