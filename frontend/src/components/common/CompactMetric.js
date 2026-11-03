import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import {
  HouseholdVisitVector,
  ChildHealthVector,
  FollowUpVector,
  CommunityAssistanceVector
} from '../illustrations/CategoryVectors';

export const CompactMetric = ({
  items = [] // [{ label: 'Households', value: 34, color: colors.primary, onPress: ... }, ...]
}) => {
  const getMetricVector = (idx) => {
    switch (idx) {
      case 0:
        return <HouseholdVisitVector size={24} />;
      case 1:
        return <ChildHealthVector size={24} />;
      case 2:
        return <FollowUpVector size={24} />;
      case 3:
      default:
        return <CommunityAssistanceVector size={24} />;
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.headerLeft}>
          <View style={styles.livePulseDot} />
          <Text style={styles.cardHeading}>TODAY'S ACTIVITY OVERVIEW</Text>
        </View>
        <Text style={styles.dateBadge}>4 Nov 2026</Text>
      </View>

      <View style={styles.grid}>
        {items.map((item, idx) => {
          const itemColor = item.dotColor || colors.primary;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => item.onPress && item.onPress()}
              activeOpacity={0.75}
              style={styles.gridTile}
            >
              <View style={styles.iconCircle}>
                {getMetricVector(idx)}
              </View>
              <View style={styles.metricTextWrapper}>
                <Text style={[styles.metricValue, { color: itemColor }]}>{item.value}</Text>
                <Text style={styles.metricLabel}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    marginHorizontal: spacing.screenHorizontal,
    marginTop: 8,
    marginBottom: 0,
    padding: spacing.cardInternal,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8
  },
  dateBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10
  },
  gridTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  iconCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  metricTextWrapper: {
    flex: 1
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1
  }
});

export default CompactMetric;
