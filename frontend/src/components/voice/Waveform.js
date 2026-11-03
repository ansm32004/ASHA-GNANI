import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme';

export const Waveform = ({ isRecording = false, barCount = 14 }) => {
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(10))
  ).current;

  useEffect(() => {
    let animations = [];
    if (isRecording) {
      animations = animatedValues.map((anim, i) => {
        const randomHeight = Math.floor(Math.random() * 32) + 12;
        const randomDuration = 350 + (i % 4) * 120;
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: randomHeight,
              duration: randomDuration,
              useNativeDriver: false
            }),
            Animated.timing(anim, {
              toValue: 8,
              duration: randomDuration,
              useNativeDriver: false
            })
          ])
        );
      });
      animations.forEach(anim => anim.start());
    } else {
      animatedValues.forEach(anim => anim.setValue(8));
    }

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [isRecording]);

  return (
    <View style={styles.container}>
      {animatedValues.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: anim,
              backgroundColor: isRecording ? colors.primary : colors.borderStrong
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginVertical: 10
  },
  bar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 3
  }
});

