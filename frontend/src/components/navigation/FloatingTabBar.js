import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { colors, typography, radius, shadows, spacing } from '../../theme';
import { GradientOrb } from '../common/GradientOrb';
import { useTranslation } from 'react-i18next';

export const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const { t } = useTranslation();

  const getTabLabel = (routeName) => {
    switch (routeName) {
      case 'HomeTab':
        return t('nav.home') || 'Home';
      case 'CommunityTab':
        return t('nav.community') || 'Directory';
      case 'TasksTab':
        return t('nav.tasks') || 'Tasks';
      case 'VoiceAssistantTab':
        return t('nav.assistant') || 'Voice';
      case 'ProfileTab':
        return t('nav.profile') || 'Profile';
      default:
        return routeName;
    }
  };

  const renderTabSvg = (routeName, isFocused) => {
    const color = isFocused ? colors.ink : colors.iconMuted;
    const strokeWidth = isFocused ? 2.1 : 1.8;

    switch (routeName) {
      case 'HomeTab':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 10.5L12 3l9 7.5v10a1.5 1.5 0 0 1-1.5 1.5h-5a1 1 0 0 1-1-1v-5h-3v5a1 1 0 0 1-1 1h-5A1.5 1.5 0 0 1 3 20.5v-10z"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        );
      case 'CommunityTab':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx="9"
              cy="7"
              r="4"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Path
              d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </Svg>
        );
      case 'TasksTab':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Rect
              x="3"
              y="4"
              width="18"
              height="17"
              rx="3"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M9 15l2 2 4-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );
      case 'VoiceAssistantTab':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Rect x="9" y="2" width="6" height="12" rx="3" fill="#FFFFFF" />
            <Path
              d="M5 10v2a7 7 0 0 0 14 0v-2"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <Line x1="12" y1="19" x2="12" y2="22" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          </Svg>
        );
      case 'ProfileTab':
      default:
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx="12"
              cy="7"
              r="4"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
          </Svg>
        );
    }
  };

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = getTabLabel(route.name);
          const isVoice = route.name === 'VoiceAssistantTab';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tr(options.tabBarAccessibilityLabel || label)}
              testID={options.tabBarTestID}
              onPress={onPress}
              activeOpacity={0.7}
              style={[styles.tabItem, isFocused && !isVoice && styles.tabItemFocused]}
            >
              {isVoice ? (
                <GradientOrb size={46} style={isFocused && styles.voiceFocused}>
                  {renderTabSvg(route.name, isFocused)}
                </GradientOrb>
              ) : (
                <View style={styles.iconContainer}>{renderTabSvg(route.name, isFocused)}</View>
              )}

              {isFocused && !isVoice ? (
                <Text style={styles.tabLabelFocused} numberOfLines={1}>
                  {tr(label)}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    pointerEvents: 'box-none',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 26 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: radius.pill,
    height: 66,
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 8,
    ...shadows.floating
  },
  tabItem: {
    flexGrow: 1,
    flexDirection: 'row',
    height: 50,
    minWidth: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  tabItemFocused: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26
  },
  voiceFocused: {
    transform: [{ scale: 1.05 }]
  },
  tabLabelFocused: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginLeft: 7
  }
});
