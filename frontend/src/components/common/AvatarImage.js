import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { getProfileAvatar } from '../../utils/profileAvatars';
import { colors } from '../../theme';

/**
 * AvatarImage Component
 * Renders an authentic, realistic profile photograph with fallback to styled initials.
 */
export const AvatarImage = ({
  name = '',
  role = '',
  size = 40,
  source = null,
  style = null,
  showBorder = false,
  borderColor = colors.border
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const resolvedSource = source || getProfileAvatar(name, role);
  const initial = String(name || role || 'S').trim().charAt(0).toUpperCase();

  const radius = size / 2;

  if (loadFailed || !resolvedSource) {
    return (
      <View
        style={[
          styles.fallbackContainer,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderColor: showBorder ? borderColor : 'transparent',
            borderWidth: showBorder ? 1.5 : 0
          },
          style
        ]}
      >
        <Text style={[styles.fallbackText, { fontSize: Math.max(12, Math.round(size * 0.42)) }]}>
          {initial}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: showBorder ? borderColor : 'transparent',
          borderWidth: showBorder ? 1.5 : 0
        },
        style
      ]}
    >
      <Image
        source={resolvedSource}
        style={{
          width: size - (showBorder ? 3 : 0),
          height: size - (showBorder ? 3 : 0),
          borderRadius: radius
        }}
        resizeMode="cover"
        onError={() => setLoadFailed(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight
  },
  fallbackText: {
    color: colors.primary,
    fontWeight: '700'
  }
});

export default AvatarImage;
