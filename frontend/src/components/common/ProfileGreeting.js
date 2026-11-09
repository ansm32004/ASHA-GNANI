import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AvatarImage } from './AvatarImage';

export const ProfileGreeting = ({
  workerName = 'Sunita',
  subtitle = 'Ready for your visits today?',
  unreadNotificationsCount = 2,
  onPressProfile,
  onPressNotification
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPressProfile}
        activeOpacity={0.8}
        style={styles.profileRow}
        accessibilityRole="button"
        accessibilityLabel="Open Profile"
      >
        <View style={styles.avatarContainer}>
          <AvatarImage
            name={workerName}
            role="ASHA"
            size={46}
            showBorder
            borderColor={colors.primaryMuted}
          />
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.textColumn}>
          <Text style={styles.greetingText}>Hello, {workerName}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onPressNotification}
        activeOpacity={0.75}
        style={styles.notifButton}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
        {unreadNotificationsCount > 0 && (
          <View style={styles.badgeIndicator} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md
  },
  avatarInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryMuted
  },
  avatarText: {
    ...typography.heading2,
    color: colors.primary,
    fontWeight: '700'
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface
  },
  textColumn: {
    flex: 1
  },
  greetingText: {
    ...typography.heading2,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  subtitleText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  badgeIndicator: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.danger
  }
});

