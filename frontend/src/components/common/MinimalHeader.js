import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, typography, spacing, radius } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { AvatarImage } from './AvatarImage';

export const MinimalHeader = ({
  workerName = 'Sunita Devi',
  subtitle = 'Ready for your visits today?',
  showBack = false,
  onBack = null,
  title = null,
  rightAction = null,
  onPressProfile = null,
  onPressNotification = null,
  unreadCount = 2,
  currentLanguage = 'hi',
  onPressLanguage = null
}) => {
  let navigation = null;
  try {
    navigation = useNavigation();
  } catch (e) {
    // Optional fallback if rendered outside NavigationContainer
  }

  const handleNotificationPress = () => {
    if (onPressNotification) {
      try {
        onPressNotification();
        return;
      } catch (err) {
        console.warn('[MinimalHeader] onPressNotification prop error:', err);
      }
    }
    if (navigation) {
      try {
        navigation.navigate('Notifications');
      } catch (err1) {
        try {
          navigation.getParent()?.navigate('Notifications');
        } catch (err2) {
          console.warn('[MinimalHeader] Navigation to Notifications failed:', err2);
        }
      }
    }
  };
  if (showBack) {
    return (
      <View style={styles.subScreenHeader}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel={tr('Back')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.subTitleCol}>
          <Text style={styles.pageTitle} numberOfLines={1}>{tr(title)}</Text>
          {subtitle ? <Text style={styles.pageSubtitle} numberOfLines={1}>{tr(subtitle)}</Text> : null}
        </View>
        {rightAction ? (
          <View style={styles.rightActionWrap}>{rightAction}</View>
        ) : (
          <View style={{ width: spacing.minTouchTarget }} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.header}>
      {/* Worker Greeting Column */}
      <TouchableOpacity
        onPress={onPressProfile}
        activeOpacity={0.8}
        style={styles.profileSection}
      >
        <AvatarImage
          name={workerName}
          role="ASHA"
          size={42}
          showBorder
          borderColor={colors.border}
          style={{ marginRight: 10 }}
        />
        <View style={styles.greetingTextCol}>
          <View style={styles.roleTag}>
            <View style={styles.roleDot} />
            <Text style={styles.roleTagText}>{tr('ASHA • Rampur Kalan')}</Text>
          </View>
          <Text style={styles.greetingTitle}>{tr('Namaste,')}{' '}{tr(workerName)}</Text>
          <Text style={styles.greetingSubtitle}>{tr(subtitle)}</Text>
        </View>
      </TouchableOpacity>

      {/* Right Actions: Language Selector & Notifications */}
      <View style={styles.rightActionsRow}>
        {onPressLanguage && (
          <TouchableOpacity
            onPress={onPressLanguage}
            activeOpacity={0.75}
            style={styles.languagePill}
            accessibilityLabel={tr('Language Selector')}
          >
            <Text style={styles.languageText}>
              {tr(currentLanguage === 'hi' ? 'हिन्दी' : 'EN')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleNotificationPress}
          activeOpacity={0.75}
          style={styles.notificationBtn}
          accessibilityLabel={tr('Notifications')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
              stroke={colors.textPrimary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              stroke={colors.textPrimary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{tr(unreadCount)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.screenTopPadding,
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent'
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.relatedElements
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  avatarInitial: {
    ...typography.heading2,
    color: colors.primary,
    fontWeight: '600'
  },
  greetingTextCol: {
    flex: 1
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6
  },
  roleTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  greetingTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 24
  },
  greetingSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  languagePill: {
    minHeight: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  languageText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  subScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.screenTopPadding,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    width: spacing.minTouchTarget,
    height: spacing.minTouchTarget,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  subTitleCol: {
    flex: 1,
    marginLeft: 4
  },
  pageTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  pageSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  rightActionWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default MinimalHeader;
