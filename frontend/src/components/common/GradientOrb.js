import React, { useId } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { shadows } from '../../theme';

// The single accent surface used for voice and AI actions.
export const GradientOrb = ({ size = 46, style = null, children }) => {
  const gradientId = `orb${useId().replace(/:/g, '')}`;

  return (
    <View style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0.15" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor="#6EA8FF" />
            <Stop offset="1" stopColor="#1D4ED8" />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradientId})`} />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
    shadowColor: '#2563EB',
    shadowOpacity: 0.32,
    shadowRadius: 16
  }
});
