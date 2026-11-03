import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  MaternalHealthVector,
  ChildHealthVector,
  VaccinationVector,
  NutritionVector,
  HouseholdVisitVector,
  CommunityAssistanceVector,
  FollowUpVector,
  VoiceAssistantVector,
  EmergencySupportVector,
  ClaimsIncentiveVector
} from './CategoryVectors';

export const VectorCategoryIcon = ({
  category = 'household',
  size = 32,
  style = null
}) => {
  const norm = (category || '').toLowerCase();

  const renderVector = () => {
    if (norm.includes('maternal') || norm.includes('pregnant') || norm.includes('anc') || norm.includes('mother')) {
      return <MaternalHealthVector size={size} />;
    }
    if (norm.includes('child') || norm.includes('infant') || norm.includes('baby') || norm.includes('newborn')) {
      return <ChildHealthVector size={size} />;
    }
    if (norm.includes('vaccin') || norm.includes('immun') || norm.includes('camp') || norm.includes('tika')) {
      return <VaccinationVector size={size} />;
    }
    if (norm.includes('nutri') || norm.includes('poshan') || norm.includes('diet') || norm.includes('ration') || norm.includes('ifa')) {
      return <NutritionVector size={size} />;
    }
    if (norm.includes('request') || norm.includes('community') || norm.includes('assist') || norm.includes('help')) {
      return <CommunityAssistanceVector size={size} />;
    }
    if (norm.includes('follow') || norm.includes('task') || norm.includes('schedule') || norm.includes('calendar')) {
      return <FollowUpVector size={size} />;
    }
    if (norm.includes('claim') || norm.includes('incentive') || norm.includes('payout') || norm.includes('wallet')) {
      return <ClaimsIncentiveVector size={size} />;
    }
    if (norm.includes('emergency') || norm.includes('sos') || norm.includes('urgent') || norm.includes('112')) {
      return <EmergencySupportVector size={size} />;
    }
    if (norm.includes('voice') || norm.includes('assistant') || norm.includes('nlu') || norm.includes('ai')) {
      return <VoiceAssistantVector size={size} />;
    }
    return <HouseholdVisitVector size={size} />;
  };

  return <View style={[styles.container, style]}>{renderVector()}</View>;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});

