import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FloatingTabBar } from '../components/navigation/FloatingTabBar';
import { HomeScreen } from '../screens/dashboard/HomeScreen';
import { HouseholdListScreen } from '../screens/community/HouseholdListScreen';
import { TaskListScreen } from '../screens/tasks/TaskListScreen';
import { VoiceAssistantScreen } from '../screens/assistant/VoiceAssistantScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: t('nav.home') || 'Home' }}
      />
      <Tab.Screen
        name="CommunityTab"
        component={HouseholdListScreen}
        options={{ tabBarLabel: t('nav.community') || 'Community' }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TaskListScreen}
        options={{ tabBarLabel: t('nav.tasks') || 'Tasks' }}
      />
      <Tab.Screen
        name="VoiceAssistantTab"
        component={VoiceAssistantScreen}
        options={{ tabBarLabel: t('nav.assistant') || 'Voice' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: t('nav.profile') || 'Profile' }}
      />
    </Tab.Navigator>
  );
};
