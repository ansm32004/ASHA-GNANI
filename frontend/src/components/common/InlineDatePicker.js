import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../theme';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Universal date parser that handles:
 * - DD-MM-YYYY
 * - YYYY-MM-DD
 * - Date object
 */
export const parseFlexibleDate = (input) => {
  if (!input) return new Date();
  if (input instanceof Date && !isNaN(input.getTime())) return input;

  const str = String(input).trim();

  // DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  // YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const clean = str.split('T')[0];
    const parts = clean.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export const toDDMMYYYY = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

export const toYYYYMMDD = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${y}-${m}-${d}`;
};

/**
 * InlineDatePicker
 * A working interactive calendar component for choosing a new date.
 * Features:
 * - Direct month/year navigation with previous and next buttons
 * - Quick reschedule shortcut pills (+1d tomorrow, +2d, +3d, +1w, +2w)
 * - 7-day weekday grid layout
 * - Highlighted today and active selection
 * - Reference to original date when rescheduling
 * - Clean summary banner showing selected date and delay delta
 */
export const InlineDatePicker = ({
  value,
  onChangeDate,
  originalDate = null,
  minDate = true, // true defaults to start of today
  showShortcuts = true,
  title = 'Choose New Due Date'
}) => {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const minDateObj = useMemo(() => {
    if (minDate === false || minDate === null) return null;
    if (minDate instanceof Date) {
      return new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    }
    return today;
  }, [minDate, today]);

  const originalDateObj = useMemo(() => {
    if (!originalDate) return null;
    const d = parseFlexibleDate(originalDate);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, [originalDate]);

  // Selected date parsed from prop
  const selectedDateObj = useMemo(() => {
    const d = parseFlexibleDate(value);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, [value]);

  // Month & Year view state (defaults to month of selected date or today)
  const [viewDate, setViewDate] = useState(() => {
    return new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
  });

  // Keep viewDate in sync when value changes externally
  useEffect(() => {
    setViewDate(new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1));
  }, [selectedDateObj]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Check if we can navigate to previous month
  const canGoPrev = useMemo(() => {
    if (!minDateObj) return true;
    const minMonthDate = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1);
    const curMonthDate = new Date(viewYear, viewMonth, 1);
    return curMonthDate.getTime() > minMonthDate.getTime();
  }, [minDateObj, viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleSelectDay = (dayDate) => {
    if (minDateObj && dayDate.getTime() < minDateObj.getTime()) {
      return; // disabled past date
    }
    const formattedDDMMYYYY = toDDMMYYYY(dayDate);
    const isoDate = toYYYYMMDD(dayDate);
    if (onChangeDate) {
      onChangeDate(formattedDDMMYYYY, dayDate, isoDate);
    }
  };

  const handleShortcutPress = (daysToAdd) => {
    const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToAdd);
    setViewDate(new Date(target.getFullYear(), target.getMonth(), 1));
    handleSelectDay(target);
  };

  // Build 7-column calendar matrix
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Monday-first indexing: getDay() gives 0 for Sunday, 1 for Monday...
    let startDayIdx = firstDayOfMonth.getDay() - 1;
    if (startDayIdx === -1) startDayIdx = 6; // Sunday is index 6

    const cells = [];

    // 1. Previous month trailing days
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayIdx - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDate - i;
      const d = new Date(viewYear, viewMonth - 1, dayNum);
      cells.push({
        key: `prev-${dayNum}`,
        day: dayNum,
        date: d,
        isCurrentMonth: false,
        disabled: true
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      const isPast = minDateObj ? dateObj.getTime() < minDateObj.getTime() : false;
      const isTodayDate = dateObj.getTime() === today.getTime();
      const isSelected = dateObj.getTime() === selectedDateObj.getTime();
      const isOriginal = originalDateObj ? dateObj.getTime() === originalDateObj.getTime() : false;

      cells.push({
        key: `curr-${d}`,
        day: d,
        date: dateObj,
        isCurrentMonth: true,
        isToday: isTodayDate,
        isSelected,
        isOriginal,
        disabled: isPast
      });
    }

    // 3. Next month trailing days to complete grid rows (multiples of 7)
    const remainder = cells.length % 7;
    if (remainder > 0) {
      const needed = 7 - remainder;
      for (let d = 1; d <= needed; d++) {
        const dateObj = new Date(viewYear, viewMonth + 1, d);
        cells.push({
          key: `next-${d}`,
          day: d,
          date: dateObj,
          isCurrentMonth: false,
          disabled: true
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth, today, selectedDateObj, originalDateObj, minDateObj]);

  // Formatted display string for selected date
  const selectedDisplayLabel = useMemo(() => {
    if (!selectedDateObj || isNaN(selectedDateObj.getTime())) return '';
    return selectedDateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, [selectedDateObj]);

  // Compute days difference between selected date and today / original
  const deltaLabel = useMemo(() => {
    if (!selectedDateObj) return null;
    const diffMs = selectedDateObj.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '+1 day (Tomorrow)';
    if (diffDays > 1) return `+${diffDays} days from today`;
    return `${Math.abs(diffDays)} days ago`;
  }, [selectedDateObj, today]);

  return (
    <View style={styles.container}>
      {/* Title */}
      {title ? (
        <View style={styles.headerTitleRow}>
          <Ionicons name="calendar" size={15} color={colors.primary} />
          <Text style={styles.headerTitleText}>{title}</Text>
        </View>
      ) : null}

      {/* Quick Delay Shortcuts */}
      {showShortcuts ? (
        <View style={styles.shortcutsWrap}>
          <Text style={styles.shortcutsTitle}>Quick Delay:</Text>
          <View style={styles.shortcutBtnsRow}>
            {[
              { label: '+1d (Tomorrow)', days: 1 },
              { label: '+2d', days: 2 },
              { label: '+3d', days: 3 },
              { label: '+1w', days: 7 },
              { label: '+2w', days: 14 }
            ].map((sc) => {
              const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() + sc.days);
              const isMatch = target.getTime() === selectedDateObj.getTime();
              return (
                <TouchableOpacity
                  key={sc.label}
                  onPress={() => handleShortcutPress(sc.days)}
                  style={[styles.shortcutChip, isMatch && styles.shortcutChipActive]}
                  activeOpacity={0.7}
                  accessibilityLabel={sc.label}
                >
                  <Text style={[styles.shortcutText, isMatch && styles.shortcutTextActive]}>
                    {sc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Interactive Month & Year Navigator */}
      <View style={styles.monthNavRow}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          disabled={!canGoPrev}
          style={[styles.navArrowBtn, !canGoPrev && styles.navArrowBtnDisabled]}
          activeOpacity={0.7}
          accessibilityLabel="Previous month"
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={canGoPrev ? colors.primaryText : colors.borderStrong}
          />
        </TouchableOpacity>

        <View style={styles.monthTitleWrapper}>
          <Text style={styles.monthTitleText}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNextMonth}
          style={styles.navArrowBtn}
          activeOpacity={0.7}
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={18} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Weekday Header Row (Mon - Sun) */}
      <View style={styles.weekdaysRow}>
        {WEEKDAY_HEADERS.map((w, idx) => (
          <View key={idx} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, (idx === 5 || idx === 6) && styles.weekendText]}>
              {w}
            </Text>
          </View>
        ))}
      </View>

      {/* 7-Col Month Days Grid */}
      <View style={styles.gridWrap}>
        {calendarCells.map((cell) => {
          const isClickable = !cell.disabled;
          return (
            <TouchableOpacity
              key={cell.key}
              onPress={() => isClickable && handleSelectDay(cell.date)}
              disabled={!isClickable}
              style={[
                styles.dayCell,
                cell.isSelected && styles.dayCellSelected,
                cell.isToday && !cell.isSelected && styles.dayCellToday,
                cell.isOriginal && !cell.isSelected && styles.dayCellOriginal,
                cell.disabled && styles.dayCellDisabled
              ]}
              activeOpacity={0.7}
              accessibilityLabel={`${cell.day} ${MONTH_NAMES[viewMonth]}`}
            >
              <Text
                style={[
                  styles.dayNumberText,
                  !cell.isCurrentMonth && styles.dayNumberMuted,
                  cell.disabled && styles.dayNumberDisabled,
                  cell.isToday && !cell.isSelected && styles.dayNumberToday,
                  cell.isSelected && styles.dayNumberSelected
                ]}
              >
                {cell.day}
              </Text>

              {/* Sub-label indicators */}
              {cell.isSelected ? (
                <View style={styles.selectedDot} />
              ) : cell.isToday ? (
                <View style={styles.todayIndicatorDot} />
              ) : cell.isOriginal ? (
                <Text style={styles.origSubText}>Orig</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Date Confirmation Banner */}
      <View style={styles.selectedSummaryCard}>
        <View style={styles.summaryLeft}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Chosen Due Date</Text>
            <Text style={styles.summaryDateText}>{selectedDisplayLabel}</Text>
          </View>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeText}>{toDDMMYYYY(selectedDateObj)}</Text>
          {deltaLabel ? <Text style={styles.summaryDeltaText}>{deltaLabel}</Text> : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 6
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  headerTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark
  },
  shortcutsWrap: {
    marginBottom: 10,
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  shortcutsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 6
  },
  shortcutBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  shortcutChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  shortcutChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryText
  },
  shortcutTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary
  },
  navArrowBtnDisabled: {
    opacity: 0.35
  },
  monthTitleWrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  monthTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primaryText
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingHorizontal: 2
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2
  },
  weekdayText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textSecondary
  },
  weekendText: {
    color: colors.textMuted
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 1,
    position: 'relative'
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    ...shadows.subtle
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  dayCellOriginal: {
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningLight
  },
  dayCellDisabled: {
    opacity: 0.3
  },
  dayNumberText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.primaryText
  },
  dayNumberMuted: {
    color: colors.textMuted
  },
  dayNumberDisabled: {
    color: colors.textMuted
  },
  dayNumberToday: {
    color: colors.primaryDark,
    fontWeight: '700'
  },
  dayNumberSelected: {
    color: colors.textWhite,
    fontWeight: '800'
  },
  selectedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textWhite,
    position: 'absolute',
    bottom: 3
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    position: 'absolute',
    bottom: 3
  },
  origSubText: {
    position: 'absolute',
    bottom: 1,
    fontSize: 7.5,
    fontWeight: '700',
    color: colors.warning
  },
  selectedSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 8
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  summaryLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.primaryDark
  },
  summaryDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark
  },
  summaryBadge: {
    alignItems: 'flex-end'
  },
  summaryBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primaryDark,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primaryMuted
  },
  summaryDeltaText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2
  }
});
