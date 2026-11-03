import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, shadows, radius, spacing } from '../../theme';

/**
 * CalendarActivityView
 * Responsive calendar strip with Day/Week/Month selector, date navigation,
 * restrained category dots, and high-contrast selected date pill.
 */
export const CalendarActivityView = ({
  selectedDate = 4,
  onSelectDate,
  monthLabel = "November 2026",
  initialViewMode = "Week"
}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [activeDate, setActiveDate] = useState(selectedDate);

  const daysList = [
    { dayNumber: 2, dayName: 'Mon', activities: ['pregnancy'] },
    { dayNumber: 3, dayName: 'Tue', activities: ['child', 'vaccination'] },
    { dayNumber: 4, dayName: 'Wed', activities: ['pregnancy', 'child'], isToday: true },
    { dayNumber: 5, dayName: 'Thu', activities: ['vaccination'] },
    { dayNumber: 6, dayName: 'Fri', activities: ['pregnancy', 'menstrual'] },
    { dayNumber: 7, dayName: 'Sat', activities: ['nutrition'] },
    { dayNumber: 8, dayName: 'Sun', activities: [] }
  ];

  const handleDatePress = (d) => {
    setActiveDate(d.dayNumber);
    if (onSelectDate) onSelectDate(d);
  };

  const getDotColor = (activity) => {
    switch (activity) {
      case 'pregnancy':
        return colors.coral;
      case 'menstrual':
        return colors.lavender;
      case 'child':
        return colors.teal;
      case 'vaccination':
        return colors.primary;
      case 'nutrition':
        return colors.yellow;
      default:
        return colors.secondaryText;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header: Month & View Mode Pills */}
      <View style={styles.topRow}>
        <View style={styles.monthSelector}>
          <Text style={styles.monthText}>{monthLabel}</Text>
          <View style={styles.navArrows}>
            <TouchableOpacity style={styles.arrowBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18L9 12L15 6" stroke={colors.secondaryText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.arrowBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M9 18L15 12L9 6" stroke={colors.secondaryText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* View mode toggle pills */}
        <View style={styles.viewModeRow}>
          {['Day', 'Week', 'Month'].map((mode) => {
            const isSelected = viewMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.viewPill, isSelected && styles.viewPillActive]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[styles.viewPillText, isSelected && styles.viewPillTextActive]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Horizontal Days Strip with Responsive Scroll/Flex */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScroll}
      >
        {daysList.map((item) => {
          const isSelected = activeDate === item.dayNumber;
          return (
            <TouchableOpacity
              key={item.dayNumber}
              style={[styles.dayCard, isSelected && styles.dayCardActive]}
              onPress={() => handleDatePress(item)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayName, isSelected && styles.dayTextActive]}>
                {item.dayName}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayTextActive]}>
                {item.dayNumber}
              </Text>

              {/* Activity indicator dots */}
              <View style={styles.dotsRow}>
                {item.activities.length > 0 ? (
                  item.activities.slice(0, 3).map((act, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        { backgroundColor: isSelected ? colors.surface : getDotColor(act) }
                      ]}
                    />
                  ))
                ) : (
                  <View style={styles.emptyDot} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.screenPadding,
    marginVertical: 4,
    padding: 12,
    ...shadows.subtle
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  monthText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText
  },
  navArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  arrowBtn: {
    padding: 3
  },
  viewModeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    padding: 2
  },
  viewPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  viewPillActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle
  },
  viewPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.secondaryText
  },
  viewPillTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  daysScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 4
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 12,
    minWidth: 36
  },
  dayCardActive: {
    backgroundColor: colors.primary,
    ...shadows.subtle
  },
  dayName: {
    fontSize: 10,
    color: colors.secondaryText,
    marginBottom: 2
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 4
  },
  dayTextActive: {
    color: colors.textWhite
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 5
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2
  },
  emptyDot: {
    width: 4,
    height: 4
  }
});

export default CalendarActivityView;
