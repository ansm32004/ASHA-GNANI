import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';

// Onboarding & Auth Screens
import { LoginScreen } from '../screens/onboarding/LoginScreen';
import { SignupScreen } from '../screens/onboarding/SignupScreen';
import { OtpScreen } from '../screens/onboarding/OtpScreen';
import { SplashScreen } from '../screens/onboarding/SplashScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { LanguageScreen } from '../screens/onboarding/LanguageScreen';
import { PermissionsScreen } from '../screens/onboarding/PermissionsScreen';


// Phase 1: ASHA Worker App Navigation
import { MainTabNavigator } from './MainTabNavigator';

// Phase 2: Community / Beneficiary App Navigation
import { CommunityTabNavigator } from './CommunityTabNavigator';
import { HealthGuideDetailScreen } from '../screens/community_app/HealthGuideDetailScreen';
import { MemberHealthDetailScreen } from '../screens/community_app/MemberHealthDetailScreen';

// Shared Action & Feature Screens
import { RecordVisitScreen } from '../screens/visits/RecordVisitScreen';
import { VisitConfirmScreen } from '../screens/visits/VisitConfirmScreen';
import { VisitDetailScreen } from '../screens/visits/VisitDetailScreen';
import { AddHouseholdScreen } from '../screens/community/AddHouseholdScreen';
import { HouseholdDetailScreen } from '../screens/community/HouseholdDetailScreen';
import { CreateTaskScreen } from '../screens/tasks/CreateTaskScreen';
import { TaskDetailScreen } from '../screens/tasks/TaskDetailScreen';
import { RequestListScreen } from '../screens/requests/RequestListScreen';
import { ClaimScreen } from '../screens/claims/ClaimScreen';
import { MyIncentivesScreen } from '../screens/claims/MyIncentivesScreen';
import { CreateClaimScreen } from '../screens/claims/CreateClaimScreen';
import { SosScreen } from '../screens/sos/SosScreen';
import { NotificationScreen } from '../screens/notifications/NotificationScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isCommunityUser = isAuthenticated && user?.role === 'COMMUNITY';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        // Unauthenticated Stack (Login & Onboarding)
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OtpVerification" component={OtpScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="LanguageSelection" component={LanguageScreen} />
          <Stack.Screen name="Permissions" component={PermissionsScreen} />
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Group>
      ) : isCommunityUser ? (
        // Phase 2: Community / Beneficiary App Stack
        <Stack.Group>
          <Stack.Screen name="CommunityTabs" component={CommunityTabNavigator} />
          <Stack.Screen name="HealthGuideDetail" component={HealthGuideDetailScreen} />
          <Stack.Screen name="MemberHealthDetail" component={MemberHealthDetailScreen} />
          <Stack.Screen name="CommunityRequests" component={RequestListScreen} />
          <Stack.Screen name="EmergencySos" component={SosScreen} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          <Stack.Screen name="LanguageSettings" component={LanguageScreen} />
        </Stack.Group>
      ) : (
        // Phase 1: ASHA Worker App Stack
        <Stack.Group>
          <Stack.Screen name="AshaTabs" component={MainTabNavigator} />
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="HealthGuideDetail" component={HealthGuideDetailScreen} />
          <Stack.Screen name="MemberHealthDetail" component={MemberHealthDetailScreen} />
          <Stack.Screen name="RecordVisit" component={RecordVisitScreen} />
          <Stack.Screen name="VisitConfirm" component={VisitConfirmScreen} />
          <Stack.Screen name="VisitDetail" component={VisitDetailScreen} />
          <Stack.Screen name="AddHousehold" component={AddHouseholdScreen} />
          <Stack.Screen name="HouseholdDetail" component={HouseholdDetailScreen} />
          <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
          <Stack.Screen name="CommunityRequests" component={RequestListScreen} />
          <Stack.Screen name="MyIncentives" component={MyIncentivesScreen} />
          <Stack.Screen name="MyIncentivesScreen" component={MyIncentivesScreen} />
          <Stack.Screen name="CreateClaim" component={CreateClaimScreen} />
          <Stack.Screen name="WorkClaims" component={MyIncentivesScreen} />
          <Stack.Screen name="EmergencySos" component={SosScreen} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          <Stack.Screen name="LanguageSettings" component={LanguageScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
