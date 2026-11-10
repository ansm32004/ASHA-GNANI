import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../../theme';

// Soft haze behind every screen.
export const AppBackdrop = () => (
  <View pointerEvents="none" style={styles.backdrop}>
    <Svg width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="hazeBlue" cx="18%" cy="2%" rx="85%" ry="36%" fx="18%" fy="2%">
          <Stop offset="0" stopColor="#BBD6FF" stopOpacity="0.85" />
          <Stop offset="1" stopColor="#BBD6FF" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="hazeLilac" cx="95%" cy="8%" rx="70%" ry="30%" fx="95%" fy="8%">
          <Stop offset="0" stopColor="#DCCFFF" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#DCCFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={colors.background} />
      <Rect width="100%" height="100%" fill="url(#hazeBlue)" />
      <Rect width="100%" height="100%" fill="url(#hazeLilac)" />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background
  }
});
