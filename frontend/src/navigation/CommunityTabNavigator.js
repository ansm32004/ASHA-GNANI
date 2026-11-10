import { tr } from '../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, shadows, spacing } from '../theme';
import { CommunityHomeScreen } from '../screens/community_app/CommunityHomeScreen';
import { CommunityFamilyScreen } from '../screens/community_app/CommunityFamilyScreen';
import { CommunityRemindersScreen } from '../screens/community_app/CommunityRemindersScreen';
import { CommunityProfileScreen } from '../screens/community_app/CommunityProfileScreen';

const Tab = createBottomTabNavigator();

const CommunityFloatingTabBar = ({ state, descriptors, navigation }) => {
  const getTabConfig = (routeName, focused) => {
    switch (routeName) {
      case 'CommunityHome':
        return {
          label: 'Home',
          icon: focused ? 'home' : 'home-outline'
        };
      case 'MyFamily':
        return {
          label: 'My Family',
          icon: focused ? 'people' : 'people-outline'
        };
      case 'RemindersTab':
        return {
          label: 'Reminders',
          icon: focused ? 'calendar' : 'calendar-outline'
        };
      case 'CommunityProfile':
        return {
          label: 'Profile',
          icon: focused ? 'person' : 'person-outline'
        };
      default:
        return {
          label: routeName,
          icon: 'ellipse-outline'
        };
    }
  };

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = getTabConfig(route.name, isFocused);

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
              accessibilityLabel={tr(options.tabBarAccessibilityLabel || config.label)}
              onPress={onPress}
              activeOpacity={0.7}
              style={[styles.tabItem, isFocused && styles.tabItemFocused]}
            >
              <Ionicons
                name={config.icon}
                size={20}
                color={isFocused ? colors.ink : colors.iconMuted}
              />
              {isFocused ? (
                <Text style={styles.tabLabelFocused} numberOfLines={1}>
                  {tr(config.label)}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const CommunityTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CommunityFloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="CommunityHome" component={CommunityHomeScreen} />
      <Tab.Screen name="MyFamily" component={CommunityFamilyScreen} />
      <Tab.Screen name="RemindersTab" component={CommunityRemindersScreen} />
      <Tab.Screen name="CommunityProfile" component={CommunityProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    pointerEvents: 'box-none',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 24 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: radius.pill,
    height: 66,
    paddingHorizontal: 8,
    width: '92%',
    maxWidth: 420,
    ...shadows.floating
  },
  tabItem: {
    flexGrow: 1,
    flexDirection: 'row',
    height: 50,
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: radius.pill
  },
  tabItemFocused: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14
  },
  tabLabelFocused: {
    ...typography.caption,
    fontSize: 13,
    color: colors.ink,
    marginLeft: 7,
    fontWeight: '600'
  }
});

export default CommunityTabNavigator;

