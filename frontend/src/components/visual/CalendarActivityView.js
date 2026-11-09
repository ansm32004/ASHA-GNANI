import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, radius, spacing } from '../../theme';
import { formatDate } from '../../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 48; // width of each day pill in horizontal scroll
const ITEM_MARGIN = 4;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Monday first for Month view

// Utility to format Date into YYYY-MM-DD
const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Utility to parse YYYY-MM-DD into Date object safely
const parseDateString = (str) => {
  if (!str) return new Date();
  if (typeof str === 'number') {
    // If passed just dayNumber (e.g. 4), default to Nov 2026
    return new Date(2026, 10, str);
  }
  const parts = str.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date();
};

/**
 * CalendarActivityView
 * Fully interactive frontline calendar with:
 * 1. Interactive Month dropdown picker modal (clean month names with no badge clutter)
 * 2. Functional Day / Week / Month mode selector
 * 3. Infinite-feel slidable horizontal date strip (past 14 days to future 90+ days)
 * 4. Month grid with task dots
 * 5. Day focus card with quick day step
 * 6. High-contrast selected states and category dots mapped from actual tasks
 */
export const CalendarActivityView = ({
  selectedDate,
  onSelectDate,
  monthLabel,
  initialViewMode = 'Week',
  tasks = [],
  visits = []
}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const todayStr = useMemo(() => toDateString(new Date()), []);

  // Normalize selected date to YYYY-MM-DD
  const initialDateStr = useMemo(() => {
    if (typeof selectedDate === 'number') {
      return `2026-11-${String(selectedDate).padStart(2, '0')}`;
    }
    return selectedDate || todayStr;
  }, [selectedDate, todayStr]);

  const [activeDateStr, setActiveDateStr] = useState(initialDateStr);
  const [viewMonthDate, setViewMonthDate] = useState(() => parseDateString(initialDateStr));

  // Dropdown month picker modal state
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => viewMonthDate.getFullYear());

  const scrollRef = useRef(null);

  // Sync year when viewMonthDate changes
  useEffect(() => {
    setPickerYear(viewMonthDate.getFullYear());
  }, [viewMonthDate]);

  // Update internal date if prop changes externally
  useEffect(() => {
    if (selectedDate) {
      const formatted = typeof selectedDate === 'number'
        ? `2026-11-${String(selectedDate).padStart(2, '0')}`
        : selectedDate;
      setActiveDateStr(formatted);
    }
  }, [selectedDate]);

  // Map tasks and visits to dates for quick activity dot lookup
  const taskMapByDate = useMemo(() => {
    const map = {};

    if (Array.isArray(tasks)) {
      tasks.forEach((t) => {
        const d = t.due_date;
        if (!d) return;
        if (!map[d]) {
          map[d] = {
            count: 0,
            categories: new Set()
          };
        }
        map[d].count += 1;

        const typeLower = (t.task_type || '').toLowerCase();
        const fromLower = (t.created_from || '').toLowerCase();
        if (typeLower.includes('request') || fromLower.includes('request')) {
          map[d].categories.add('request');
        } else if (typeLower.includes('maternal') || typeLower.includes('pregnancy') || typeLower.includes('anc')) {
          map[d].categories.add('pregnancy');
        } else if (typeLower.includes('child') || typeLower.includes('infant')) {
          map[d].categories.add('child');
        } else if (typeLower.includes('vaccin') || typeLower.includes('immun')) {
          map[d].categories.add('vaccination');
        } else if (typeLower.includes('camp') || typeLower.includes('nutrition')) {
          map[d].categories.add('nutrition');
        } else if (typeLower.includes('menstrual') || typeLower.includes('adolescent')) {
          map[d].categories.add('menstrual');
        } else {
          map[d].categories.add('general');
        }
      });
    }

    if (Array.isArray(visits)) {
      visits.forEach((v) => {
        const d = v.visit_date;
        if (!d) return;
        if (!map[d]) {
          map[d] = {
            count: 0,
            categories: new Set()
          };
        }
        map[d].count += 1;

        const catLower = (v.activity_category || '').toLowerCase();
        if (catLower.includes('maternal') || catLower.includes('pregnancy') || catLower.includes('anc')) {
          map[d].categories.add('pregnancy');
        } else if (catLower.includes('child') || catLower.includes('infant') || catLower.includes('pnc')) {
          map[d].categories.add('child');
        } else if (catLower.includes('vaccin') || catLower.includes('immun')) {
          map[d].categories.add('vaccination');
        } else if (catLower.includes('camp') || catLower.includes('nutrition')) {
          map[d].categories.add('nutrition');
        } else if (catLower.includes('menstrual') || catLower.includes('adolescent')) {
          map[d].categories.add('menstrual');
        } else {
          map[d].categories.add('general');
        }
      });
    }

    return map;
  }, [tasks, visits]);

  // Generate 90 consecutive days for smooth horizontal sliding starting with the PRESENT DATE (today) as the first date
  const daysList = useMemo(() => {
    const list = [];
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = 0; i < 90; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const dStr = toDateString(d);
      const taskInfo = taskMapByDate[dStr];

      list.push({
        dateString: dStr,
        dayNumber: d.getDate(),
        dayName: WEEKDAY_NAMES_SHORT[d.getDay()],
        monthName: MONTH_NAMES_SHORT[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        isToday: dStr === todayStr,
        isFirstOfMonth: d.getDate() === 1,
        activities: taskInfo ? Array.from(taskInfo.categories) : [],
        taskCount: taskInfo ? taskInfo.count : 0
      });
    }

    // Safety edge case: if activeDateStr was explicitly set to an earlier date (e.g. from overdue filter),
    // prepend it so it remains accessible in the list
    if (activeDateStr && activeDateStr < todayStr) {
      const activeD = parseDateString(activeDateStr);
      if (!list.some((item) => item.dateString === activeDateStr)) {
        list.unshift({
          dateString: activeDateStr,
          dayNumber: activeD.getDate(),
          dayName: WEEKDAY_NAMES_SHORT[activeD.getDay()],
          monthName: MONTH_NAMES_SHORT[activeD.getMonth()],
          monthIndex: activeD.getMonth(),
          year: activeD.getFullYear(),
          isToday: false,
          isFirstOfMonth: activeD.getDate() === 1,
          activities: taskMapByDate[activeDateStr] ? Array.from(taskMapByDate[activeDateStr].categories) : [],
          taskCount: taskMapByDate[activeDateStr]?.count || 0
        });
      }
    }

    return list;
  }, [activeDateStr, todayStr, taskMapByDate]);

  // Scroll to selected date pill in Week/Day horizontal slider
  useEffect(() => {
    if (viewMode === 'Week' || viewMode === 'Day') {
      const idx = daysList.findIndex((d) => d.dateString === activeDateStr);
      if (idx >= 0 && scrollRef.current) {
        // When today (idx 0) is active, explicitly scroll to start (0)
        const targetX = idx === 0 ? 0 : Math.max(0, idx * (ITEM_WIDTH + ITEM_MARGIN * 2) - SCREEN_WIDTH / 2 + ITEM_WIDTH);
        setTimeout(() => {
          scrollRef.current?.scrollTo({ x: targetX, animated: true });
        }, 120);
      }
    }
  }, [activeDateStr, viewMode, daysList]);

  const handleSelectDate = (dItem) => {
    setActiveDateStr(dItem.dateString);
    setViewMonthDate(parseDateString(dItem.dateString));
    if (onSelectDate) {
      onSelectDate(dItem);
    }
  };

  // Handler for picking a month from the dropdown picker modal
  const handleSelectMonthFromPicker = (monthIndex, year = pickerYear) => {
    const newMonthDate = new Date(year, monthIndex, 1);
    setViewMonthDate(newMonthDate);

    // If selected month is current system month, select today, otherwise 1st of month
    const now = new Date();
    let newDateStr;
    if (year === now.getFullYear() && monthIndex === now.getMonth()) {
      newDateStr = todayStr;
    } else {
      newDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    }

    setActiveDateStr(newDateStr);
    setMonthPickerVisible(false);

    if (onSelectDate) {
      const match = daysList.find((d) => d.dateString === newDateStr) || {
        dateString: newDateStr,
        dayNumber: parseInt(newDateStr.split('-')[2], 10),
        dayName: WEEKDAY_NAMES_SHORT[new Date(year, monthIndex, parseInt(newDateStr.split('-')[2], 10)).getDay()]
      };
      onSelectDate(match);
    }
  };

  // Build Month Grid matrix for Month view
  const monthGridData = useMemo(() => {
    const y = viewMonthDate.getFullYear();
    const m = viewMonthDate.getMonth();

    const firstDayOfMonth = new Date(y, m, 1);
    const lastDayOfMonth = new Date(y, m + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday is 6

    const grid = [];

    // Trailing days from previous month
    const prevMonthLastDate = new Date(y, m, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDateNum = prevMonthLastDate - i;
      const prevDate = new Date(y, m - 1, prevDateNum);
      const dStr = toDateString(prevDate);
      grid.push({
        dateString: dStr,
        dayNumber: prevDateNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        taskCount: taskMapByDate[dStr]?.count || 0
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(y, m, d);
      const dStr = toDateString(curDate);
      grid.push({
        dateString: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        taskCount: taskMapByDate[dStr]?.count || 0,
        activities: taskMapByDate[dStr] ? Array.from(taskMapByDate[dStr].categories) : []
      });
    }

    // Trailing days for next month to complete the row of 7
    const remaining = 7 - (grid.length % 7);
    if (remaining > 0 && remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextDate = new Date(y, m + 1, d);
        const dStr = toDateString(nextDate);
        grid.push({
          dateString: dStr,
          dayNumber: d,
          isCurrentMonth: false,
          isToday: dStr === todayStr,
          taskCount: taskMapByDate[dStr]?.count || 0
        });
      }
    }

    return grid;
  }, [viewMonthDate, todayStr, taskMapByDate]);

  const getDotColor = (activity) => {
    switch (activity) {
      case 'request':
        return colors.danger;
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

  // Header Title computed based on active date and view mode
  const displayMonthLabel = useMemo(() => {
    if (viewMode === 'Month') {
      return `${MONTH_NAMES[viewMonthDate.getMonth()]} ${viewMonthDate.getFullYear()}`;
    }
    const cur = parseDateString(activeDateStr);
    return `${MONTH_NAMES[cur.getMonth()]} ${cur.getFullYear()}`;
  }, [viewMode, viewMonthDate, activeDateStr]);

  const activeDayTasksCount = taskMapByDate[activeDateStr]?.count || 0;
  const isSelectedDateToday = activeDateStr === todayStr;

  return (
    <View style={styles.container}>
      {/* Top Header: Clean Month Dropdown Button & View Mode Selector (Arrows Removed) */}
      <View style={styles.topRow}>
        <View style={styles.monthSelector}>
          {/* Clickable Month Label with Dropdown Chevron */}
          <TouchableOpacity
            style={styles.monthSelectorBtn}
            onPress={() => {
              setPickerYear(viewMonthDate.getFullYear());
              setMonthPickerVisible(true);
            }}
            activeOpacity={0.7}
            accessibilityLabel="Click to change month"
          >
            <Text style={styles.monthText}>{displayMonthLabel}</Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={colors.primaryText}
              style={{ marginLeft: 3 }}
            />
          </TouchableOpacity>
        </View>

        {/* Fully Functional View Mode Toggle Pills (Day / Week / Month) */}
        <View style={styles.viewModeRow}>
          {['Day', 'Week', 'Month'].map((mode) => {
            const isSelected = viewMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.viewPill, isSelected && styles.viewPillActive]}
                onPress={() => setViewMode(mode)}
                activeOpacity={0.8}
              >
                <Text style={[styles.viewPillText, isSelected && styles.viewPillTextActive]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ---------------- DAY VIEW ---------------- */}
      {viewMode === 'Day' && (
        <View style={styles.dayViewWrapper}>
          <View style={styles.dayFocusCard}>
            <View style={styles.dayFocusHeader}>
              <Text style={styles.dayFocusTitle}>
                {`${parseDateString(activeDateStr).toLocaleDateString('en-US', {
                  weekday: 'short'
                })}, ${formatDate(activeDateStr)}`}
              </Text>
              <View style={[styles.taskCountBadge, activeDayTasksCount > 0 ? styles.taskCountBadgeActive : null]}>
                <Text style={[styles.taskCountText, activeDayTasksCount > 0 ? styles.taskCountTextActive : null]}>
                  {activeDayTasksCount === 0
                    ? 'No tasks'
                    : `${activeDayTasksCount} task${activeDayTasksCount > 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>
            <Text style={styles.dayFocusSub}>
              {isSelectedDateToday ? '• Today\'s scheduled follow-ups & visits' : '• Field follow-ups for this date'}
            </Text>
          </View>

          {/* Compact horizontal day slider below Day header for quick sliding */}
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScroll}
          >
            {daysList.map((item) => {
              const isSelected = activeDateStr === item.dateString;
              return (
                <TouchableOpacity
                  key={item.dateString}
                  style={[
                    styles.dayCard,
                    isSelected && styles.dayCardActive,
                    item.isToday && !isSelected && styles.dayCardToday
                  ]}
                  onPress={() => handleSelectDate(item)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayName,
                      item.isToday && styles.dayNameToday,
                      isSelected && styles.dayTextActive
                    ]}
                  >
                    {item.isToday ? 'Today' : item.dayName}
                  </Text>
                  <Text style={[styles.dayNumber, isSelected && styles.dayTextActive]}>
                    {item.dayNumber}
                  </Text>
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
      )}

      {/* ---------------- WEEK VIEW (Slidable horizontal strip) ---------------- */}
      {viewMode === 'Week' && (
        <View>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScroll}
          >
            {daysList.map((item) => {
              const isSelected = activeDateStr === item.dateString;
              return (
                <TouchableOpacity
                  key={item.dateString}
                  style={[
                    styles.dayCard,
                    isSelected && styles.dayCardActive,
                    item.isToday && !isSelected && styles.dayCardToday
                  ]}
                  onPress={() => handleSelectDate(item)}
                  activeOpacity={0.8}
                >
                  {/* Month header tag if first of month */}
                  {item.isFirstOfMonth ? (
                    <Text style={[styles.firstOfMonthTag, isSelected && styles.firstOfMonthTagActive]}>
                      {item.monthName}
                    </Text>
                  ) : null}

                  <Text
                    style={[
                      styles.dayName,
                      item.isToday && styles.dayNameToday,
                      isSelected && styles.dayTextActive
                    ]}
                  >
                    {item.isToday ? 'Today' : item.dayName}
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
      )}

      {/* ---------------- MONTH VIEW (Full 7-col calendar matrix) ---------------- */}
      {viewMode === 'Month' && (
        <View style={styles.monthMatrix}>
          {/* Weekday letter column headers */}
          <View style={styles.weekdaysRow}>
            {WEEKDAY_LETTERS.map((letter, idx) => (
              <Text key={idx} style={styles.weekdayLetterText}>
                {letter}
              </Text>
            ))}
          </View>

          {/* Month grid days */}
          <View style={styles.monthDaysGrid}>
            {monthGridData.map((item, idx) => {
              const isSelected = activeDateStr === item.dateString;
              const hasTasks = item.taskCount > 0;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.monthGridCell,
                    isSelected && styles.monthGridCellActive,
                    item.isToday && !isSelected && styles.monthGridCellToday
                  ]}
                  onPress={() => {
                    const match = daysList.find((d) => d.dateString === item.dateString) || item;
                    handleSelectDate(match);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.monthCellText,
                      !item.isCurrentMonth && styles.monthCellTextMuted,
                      isSelected && styles.monthCellTextActive
                    ]}
                  >
                    {item.dayNumber}
                  </Text>

                  {/* Task indicator dot */}
                  {hasTasks ? (
                    <View
                      style={[
                        styles.monthCellDot,
                        isSelected ? { backgroundColor: colors.surface } : { backgroundColor: colors.primary }
                      ]}
                    />
                  ) : (
                    <View style={styles.emptyMonthDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ---------------- MONTH & YEAR DROPDOWN PICKER MODAL (CLEAN WITH NO TASK NUMBERS) ---------------- */}
      <Modal
        visible={monthPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setMonthPickerVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.pickerModalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Year Switcher */}
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Month</Text>
              <View style={styles.pickerYearRow}>
                <TouchableOpacity
                  onPress={() => setPickerYear((y) => y - 1)}
                  style={styles.pickerYearArrowBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Previous Year"
                >
                  <Ionicons name="chevron-back" size={16} color={colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.pickerYearText}>{pickerYear}</Text>
                <TouchableOpacity
                  onPress={() => setPickerYear((y) => y + 1)}
                  style={styles.pickerYearArrowBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Next Year"
                >
                  <Ionicons name="chevron-forward" size={16} color={colors.primaryText} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 12 Months Clean Grid (3 columns x 4 rows) - Numbers Removed */}
            <View style={styles.monthsGrid}>
              {MONTH_NAMES_SHORT.map((mShort, idx) => {
                const isSelected =
                  viewMonthDate.getFullYear() === pickerYear &&
                  viewMonthDate.getMonth() === idx;

                return (
                  <TouchableOpacity
                    key={mShort}
                    style={[
                      styles.monthGridItem,
                      isSelected && styles.monthGridItemActive
                    ]}
                    onPress={() => handleSelectMonthFromPicker(idx, pickerYear)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.monthGridItemText,
                        isSelected && styles.monthGridItemTextActive
                      ]}
                    >
                      {mShort}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Quick Actions Footer */}
            <View style={styles.pickerFooter}>
              <TouchableOpacity
                onPress={() => {
                  const now = new Date();
                  setPickerYear(now.getFullYear());
                  handleSelectMonthFromPicker(now.getMonth(), now.getFullYear());
                }}
                style={styles.pickerCurrentBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                <Text style={styles.pickerCurrentText}>Current Month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMonthPickerVisible(false)}
                style={styles.pickerCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  monthSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border
  },
  monthText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText
  },
  viewModeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    padding: 2
  },
  viewPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: radius.pill
  },
  viewPillActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle
  },
  viewPillText: {
    fontSize: 11,
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
    paddingVertical: 2,
    gap: 4
  },
  dayCard: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    width: ITEM_WIDTH,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  dayCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    ...shadows.subtle
  },
  dayCardToday: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  firstOfMonthTag: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 1,
    textTransform: 'uppercase'
  },
  firstOfMonthTagActive: {
    color: colors.surface
  },
  dayName: {
    fontSize: 10.5,
    color: colors.secondaryText,
    marginBottom: 2,
    fontWeight: '500'
  },
  dayNameToday: {
    color: colors.primary,
    fontWeight: '700'
  },
  dayNumber: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 4
  },
  dayTextActive: {
    color: colors.textWhite,
    fontWeight: '800'
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
  },

  /* Day View Styles */
  dayViewWrapper: {
    gap: 8
  },
  dayFocusCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 10,
    marginBottom: 4
  },
  dayFocusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  dayFocusTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primaryText
  },
  dayFocusSub: {
    fontSize: 11,
    color: colors.secondaryText
  },
  taskCountBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radius.pill
  },
  taskCountBadgeActive: {
    backgroundColor: colors.primaryLight
  },
  taskCountText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.secondaryText
  },
  taskCountTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },

  /* Month View Matrix Styles */
  monthMatrix: {
    paddingTop: 4
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  weekdayLetterText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryText
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 6
  },
  monthGridCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2
  },
  monthGridCellActive: {
    backgroundColor: colors.primary,
    ...shadows.subtle
  },
  monthGridCellToday: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  monthCellText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.primaryText
  },
  monthCellTextMuted: {
    color: colors.textMuted
  },
  monthCellTextActive: {
    color: colors.textWhite,
    fontWeight: '800'
  },
  monthCellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2
  },
  emptyMonthDot: {
    width: 4,
    height: 4,
    marginTop: 2
  },

  /* Month & Year Dropdown Picker Modal Styles */
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 26, 36, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText
  },
  pickerYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4
  },
  pickerYearArrowBtn: {
    padding: 3
  },
  pickerYearText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
    minWidth: 42,
    textAlign: 'center'
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 14
  },
  monthGridItem: {
    width: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  monthGridItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    ...shadows.subtle
  },
  monthGridItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText
  },
  monthGridItemTextActive: {
    color: colors.textWhite,
    fontWeight: '700'
  },
  pickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10
  },
  pickerCurrentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight
  },
  pickerCurrentText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary
  },
  pickerCloseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  pickerCloseText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText
  }
});

export default CalendarActivityView;
