import { tr } from '../../localisation/tr';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Modal, Alert, ScrollView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { AppInput } from '../../components/common/AppInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusIndicator } from '../../components/common/StatusIndicator';
import { VectorCategoryIcon } from '../../components/illustrations/VectorCategoryIcon';
import { CalendarActivityView } from '../../components/visual/CalendarActivityView';
import { InlineDatePicker } from '../../components/common/InlineDatePicker';
import { taskApi } from '../../services/api/taskApi';
import { visitApi } from '../../services/api/visitApi';
import { useTranslation } from 'react-i18next';
import { formatDate, toBackendDate } from '../../utils/dateUtils';

export const TaskListScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [tasks, setTasks] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState(null);

  const todayDateStr = React.useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Reschedule modal state
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, vList] = await Promise.all([
        taskApi.getTasks(),
        visitApi.getVisits().catch(() => [])
      ]);
      setTasks(list || []);
      setVisits(vList || []);
    } catch (err) {
      console.warn('Error loading schedule data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleComplete = async (taskId) => {
    await taskApi.completeTask(taskId, 'Task marked complete during field visit');
    await loadData();
  };

  const openRescheduleModal = (task) => {
    setSelectedTask(task);
    setNewDueDate(formatDate(task.due_date));
    setRescheduleNotes('');
    setRescheduleModalVisible(true);
  };

  const handleSaveReschedule = async () => {
    if (!newDueDate || !newDueDate.trim()) {
      Alert.alert(tr('Required'), tr('Please choose a new due date on the calendar.'));
      return;
    }
    const targetPerson = selectedTask?.beneficiary_name || selectedTask?.household_name || 'beneficiary';
    const backendDate = toBackendDate(newDueDate.trim());
    await taskApi.rescheduleTask(selectedTask.id, backendDate, rescheduleNotes.trim());
    setRescheduleModalVisible(false);
    await loadData();
    Alert.alert(
      tr('Visit Rescheduled'),
      `${tr('Visit for')} ${targetPerson} ${tr('has been moved to')} ${newDueDate}${tr('. A notification has been sent to the family.')}`
    );
  };

  const filterTabs = [
    { key: 'All', label: 'All' },
    { key: 'Due today', label: 'Today' },
    { key: 'Upcoming', label: 'Upcoming' },
    { key: 'Overdue', label: 'Overdue' },
    { key: 'Completed', label: 'Completed' }
  ];

  const handleFilterTabPress = (key) => {
    setActiveFilter(key);
    if (key === 'All') {
      setSelectedDate(null);
    }
  };

  // Combined tasks and visits filtered by active date and tab
  const combinedItems = React.useMemo(() => {
    const list = [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeVisits = Array.isArray(visits) ? visits : [];

    // 1. Process Tasks
    safeTasks.forEach((task) => {
      if (!task) return;
      if (selectedDate && task.due_date !== selectedDate) {
        return;
      }

      const matchesFilter =
        activeFilter === 'All'
          ? true
          : (task.status || '').toLowerCase() === activeFilter.toLowerCase();

      if (!matchesFilter) return;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (task.household_name || '').toLowerCase();
        const type = (task.task_type || '').toLowerCase();
        const desc = (task.description || '').toLowerCase();
        const village = (task.village || '').toLowerCase();
        if (
          !name.includes(query) &&
          !type.includes(query) &&
          !desc.includes(query) &&
          !village.includes(query)
        ) {
          return;
        }
      }

      list.push({
        ...task,
        itemType: 'task'
      });
    });

    // 2. Process Completed Visits (Show in 'All' or 'Completed')
    if (activeFilter === 'All' || activeFilter === 'Completed') {
      safeVisits.forEach((visit) => {
        if (!visit) return;
        if (selectedDate && visit.visit_date !== selectedDate) {
          return;
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const name = (visit.household_name || '').toLowerCase();
          const ben = (visit.beneficiary_name || '').toLowerCase();
          const cat = (visit.activity_category || '').toLowerCase();
          const desc = (visit.activity_description || '').toLowerCase();
          if (
            !name.includes(query) &&
            !ben.includes(query) &&
            !cat.includes(query) &&
            !desc.includes(query)
          ) {
            return;
          }
        }

        list.push({
          ...visit,
          itemType: 'visit',
          status: 'Completed'
        });
      });
    }

    return list;
  }, [tasks, visits, selectedDate, activeFilter, searchQuery]);

  const formatTaskTitle = (task) => {
    const hhName = task.household_name || 'Household';
    const benName = task.beneficiary_name;
    if (!benName || hhName.toLowerCase().includes(benName.toLowerCase())) {
      return `${hhName} • ${task.task_type || 'Follow-up'}`;
    }
    return `${hhName} • ${benName}`;
  };

  const getBorderColor = (task) => {
    if (task.status === 'Completed') return colors.success;
    if (task.priority === 'Urgent') return colors.danger;
    if (task.priority === 'High') return colors.warning;
    return colors.primary;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title={t('tasks.title') || 'Work Schedule'}
        subtitle={`${tr(combinedItems.length)} ${tr('items on schedule')}`}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateTask')}
            style={styles.addBtn}
            accessibilityLabel={tr('Add Task')}
          >
            <Ionicons name="add" size={20} color={colors.textWhite} />
          </TouchableOpacity>
        }
      />

      {/* Search Input */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={tr('Search follow-ups, families...')}
        onClear={() => setSearchQuery('')}
      />

      {/* Visual Slidable Calendar & Dynamic Activity Strip */}
      <CalendarActivityView
        selectedDate={selectedDate || todayDateStr}
        tasks={tasks}
        visits={visits}
        onSelectDate={(d) => {
          if (selectedDate === d.dateString) {
            setSelectedDate(null); // Click again to clear
          } else {
            setSelectedDate(d.dateString);
            setActiveFilter('All'); // Show all tasks & visits for this date
          }
        }}
      />

      {/* Active Date Filter Banner if a specific date is selected */}
      {selectedDate ? (
        <View style={styles.activeDateBanner}>
          <View style={styles.activeDateLeft}>
            <Ionicons name="calendar" size={14} color={colors.primary} />
            <Text style={styles.activeDateText} numberOfLines={1}>{tr('Date:')}{' '}{tr(formatDate(selectedDate))} ({tr(combinedItems.length)}{' '}{tr('item')}{tr(combinedItems.length !== 1 ? 's' : '')})
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedDate(null)}
            style={styles.clearDateBtn}
            activeOpacity={0.7}
            accessibilityLabel={tr('Clear date filter')}
          >
            <Ionicons name="close-circle" size={14} color={colors.secondaryText} />
            <Text style={styles.clearDateText}>{tr('Show All')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Filter Tabs Horizontal Strip */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterTabs.map((f) => {
            const isSelected = activeFilter === f.key;
            let count = 0;
            const safeTasks = Array.isArray(tasks) ? tasks : [];
            const safeVisits = Array.isArray(visits) ? visits : [];
            if (f.key === 'All') {
              const tCount = safeTasks.filter((t) => t && (!selectedDate || t.due_date === selectedDate)).length;
              const vCount = safeVisits.filter((v) => v && (!selectedDate || v.visit_date === selectedDate)).length;
              count = tCount + vCount;
            } else if (f.key === 'Completed') {
              const tCount = safeTasks.filter(
                (t) => t && (!selectedDate || t.due_date === selectedDate) && (t.status || '').toLowerCase() === 'completed'
              ).length;
              const vCount = safeVisits.filter((v) => v && (!selectedDate || v.visit_date === selectedDate)).length;
              count = tCount + vCount;
            } else {
              count = safeTasks.filter(
                (t) => t && (!selectedDate || t.due_date === selectedDate) && (t.status || '').toLowerCase() === f.key.toLowerCase()
              ).length;
            }

            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => handleFilterTabPress(f.key)}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {tr(f.label)}
                </Text>
                <View style={[styles.pillBadge, isSelected && styles.pillBadgeActive]}>
                  <Text style={[styles.pillBadgeText, isSelected && styles.pillBadgeTextActive]}>
                    {tr(count)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingState message={t('common.loading')} />
      ) : (
        <FlatList
          data={combinedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (item.itemType === 'visit') {
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('VisitDetail', { visitId: item.id, visit: item })}
                  style={[styles.taskCard, styles.visitCard]}
                >
                  <View style={styles.taskCardTop}>
                    <View style={styles.iconCol}>
                      <VectorCategoryIcon category={item.activity_category} size={28} />
                    </View>

                    <View style={styles.taskDetailsCol}>
                      {/* Title & Visit Badge Row */}
                      <View style={styles.titleRow}>
                        <Text style={styles.taskTitle} numberOfLines={1}>
                          {tr(item.household_name || 'Household')} • {tr(item.beneficiary_name || 'Visit')}
                        </Text>
                        <View style={styles.visitPill}>
                          <Ionicons name="checkmark-done-circle" size={12} color={colors.tealDark} />
                          <Text style={styles.visitPillText}>{tr('Field Visit')}</Text>
                        </View>
                      </View>

                      {/* AI Description / Summary */}
                      <Text style={styles.taskDesc} numberOfLines={2}>
                        {tr(item.activity_description)}
                      </Text>

                      {/* ASHA Worker Spoken Voice Note Preview */}
                      {item.speech_transcript ? (
                        <View style={styles.listMicSnippet}>
                          <Ionicons name="mic" size={11} color="#0D47A1" />
                          <Text style={styles.listMicSnippetText} numberOfLines={1}>
                            “{tr(item.speech_transcript)}”
                          </Text>
                        </View>
                      ) : null}

                      {/* Card Footer */}
                      <View style={styles.cardFooter}>
                        <View style={styles.metaCol}>
                          <View style={styles.metaLine}>
                            <Ionicons name="calendar-outline" size={12} color={colors.tealDark} />
                            <Text style={[styles.metaText, { color: colors.tealDark }]}>{tr('Visited:')}{' '}{tr(formatDate(item.visit_date))}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.viewRecordBtn}>
                          <Text style={styles.viewRecordBtnText}>{tr('View Record')}</Text>
                          <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }

            const isCompleted = item.status === 'Completed';
            const leftColor = getBorderColor(item);

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('TaskDetail', { taskId: item.id, task: item })}
                style={styles.taskCard}
              >
                <View style={styles.taskCardTop}>
                  <View style={styles.iconCol}>
                    <VectorCategoryIcon category={item.task_type} size={28} />
                  </View>

                  <View style={styles.taskDetailsCol}>
                    {/* Title and Priority Row (Collisions Prevented with flex) */}
                    <View style={styles.titleRow}>
                      <Text
                        style={[styles.taskTitle, isCompleted && styles.completedTitle]}
                        numberOfLines={1}
                      >
                        {tr(formatTaskTitle(item))}
                      </Text>
                      {item.priority ? (
                        <View style={styles.badgeWrap}>
                          <StatusIndicator status={item.priority} isPriority />
                        </View>
                      ) : null}
                    </View>

                    {/* Sensible Line Limit for Description */}
                    <Text
                      style={[styles.taskDesc, isCompleted && styles.completedDesc]}
                      numberOfLines={2}
                    >
                      {tr(item.description)}
                    </Text>

                    {/* Metadata & Actions Row */}
                    <View style={styles.cardFooter}>
                      <View style={styles.metaCol}>
                        <View style={styles.metaLine}>
                          <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                          <Text style={styles.metaText}>{tr('Due:')}{' '}{tr(formatDate(item.due_date))}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                          <Ionicons name="location-outline" size={11.5} color={colors.textMuted} style={{ marginRight: 2 }} />
                          <Text style={styles.villageText}>{tr(item.village || 'Rampur Kalan')}</Text>
                        </View>
                      </View>

                      {/* Right Action Buttons */}
                      {!isCompleted ? (
                        <View style={styles.actionBtns}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              openRescheduleModal(item);
                            }}
                            style={styles.rescheduleIconBtn}
                            accessibilityLabel={tr('Reschedule')}
                          >
                            <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                            <Text style={styles.rescheduleBtnText}>{tr('Delay')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              handleComplete(item.id);
                            }}
                            style={styles.doneIconBtn}
                            accessibilityLabel={tr('Mark Done')}
                          >
                            <Ionicons name="checkmark" size={15} color={colors.textWhite} />
                            <Text style={styles.doneBtnText}>{tr('Done')}</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.completedTag}>
                          <Ionicons name="checkmark-done" size={14} color={colors.success} />
                          <Text style={styles.completedTagText}>{tr('Completed')}</Text>
                          <Ionicons name="chevron-forward" size={12} color={colors.success} style={{ marginLeft: 2 }} />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="checkbox-outline"
              title={t('tasks.emptyTasks') || 'No tasks found'}
              message="No follow-up tasks match this filter. Keep up the great field work!"
              actionTitle={t('tasks.createTask') || 'Create Follow-up'}
              onAction={() => navigation.navigate('CreateTask')}
            />
          }
        />
      )}

      {/* Reschedule / Delay Sheet Modal with Working Interactive Calendar */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{tr('Reschedule Follow-up')}</Text>
                  <Text style={styles.modalSub}>
                    {tr(selectedTask?.household_name)} • {tr(selectedTask?.task_type)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setRescheduleModalVisible(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                  accessibilityLabel={tr('Close')}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Current Date Reference */}
              <View style={styles.originalDateBanner}>
                <Ionicons name="time-outline" size={14} color={colors.warning} />
                <Text style={styles.originalDateText}>{tr('Current Due Date:')}{' '}<Text style={styles.originalDateBold}>{tr(formatDate(selectedTask?.due_date))}</Text>
                </Text>
              </View>

              {/* Working Interactive Calendar Date Picker */}
              <InlineDatePicker
                value={newDueDate}
                onChangeDate={(formattedDate) => setNewDueDate(formattedDate)}
                originalDate={selectedTask?.due_date}
                minDate={new Date()}
                showShortcuts={true}
                title="Choose New Due Date on Calendar"
              />

              {/* Reason for Rescheduling with Quick Chips */}
              <Text style={styles.reasonSectionTitle}>{tr('Reason for Rescheduling')}</Text>
              <View style={styles.reasonChipsWrap}>
                {[
                  'Beneficiary traveling',
                  'Family unavailable',
                  'Mother sick / resting',
                  'Work in field',
                  'Follow-up postponed'
                ].map((reason) => {
                  const isSelected = rescheduleNotes === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => setRescheduleNotes(reason)}
                      style={[styles.reasonChip, isSelected && styles.reasonChipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.reasonChipText, isSelected && styles.reasonChipTextActive]}>
                        {tr(reason)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppInput
                value={rescheduleNotes}
                onChangeText={setRescheduleNotes}
                placeholder={tr('Or type a custom reason...')}
              />

              {/* Action Buttons */}
              <View style={styles.modalBtnRow}>
                <SecondaryButton
                  title="Cancel"
                  onPress={() => setRescheduleModalVisible(false)}
                  variant="outline"
                  size="medium"
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <PrimaryButton
                  title="Save Date"
                  onPress={handleSaveReschedule}
                  size="medium"
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginHorizontal: spacing.screenPadding,
    marginVertical: 4
  },
  activeDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1
  },
  activeDateText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primaryDark
  },
  clearDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface
  },
  clearDateText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.secondaryText
  },
  filterRow: {
    marginVertical: 4
  },
  filterScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: 8
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  filterText: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '500',
    marginRight: 6
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary
  },
  pillBadgeActive: {
    backgroundColor: 'rgba(36, 120, 208, 0.15)'
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary
  },
  pillBadgeTextActive: {
    color: colors.primary
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: 110 // Full clearance for bottom navigation
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 4,
    padding: 12,
    ...shadows.subtle
  },
  taskCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  iconCol: {
    marginRight: 10,
    marginTop: 2
  },
  taskDetailsCol: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    flex: 1,
    marginRight: 8
  },
  badgeWrap: {
    flexShrink: 0
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary
  },
  taskDesc: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 16,
    marginBottom: 8
  },
  completedDesc: {
    color: colors.textMuted
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 2
  },
  metaCol: {
    flex: 1
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaText: {
    fontSize: 11,
    color: colors.primaryText,
    fontWeight: '600'
  },
  villageText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  rescheduleIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    gap: 4,
    minHeight: 32
  },
  rescheduleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  doneIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    gap: 4,
    minHeight: 32
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textWhite
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  completedTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success
  },
  visitCard: {
  },
  visitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tealLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill
  },
  visitPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.tealDark
  },
  listMicSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF1FF',
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6
  },
  listMicSnippetText: {
    flex: 1,
    fontSize: 11,
    color: '#1E3A8A',
    fontStyle: 'italic'
  },
  transcriptIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginTop: 3
  },
  transcriptIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primaryDark
  },
  viewRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  viewRecordBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(32, 38, 49, 0.45)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%'
  },
  modalScrollContent: {
    paddingBottom: 16
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.sm
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary
  },
  modalTitle: {
    fontSize: 18,
    color: colors.primaryText,
    fontWeight: '600'
  },
  modalSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2
  },
  originalDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginVertical: 8,
    alignSelf: 'flex-start'
  },
  originalDateText: {
    fontSize: 11.5,
    color: colors.primaryText
  },
  originalDateBold: {
    fontWeight: '600',
    color: colors.primaryDark
  },
  reasonSectionTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.primaryDark,
    marginTop: 8,
    marginBottom: 6
  },
  reasonChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8
  },
  reasonChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  reasonChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  reasonChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryText
  },
  reasonChipTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: spacing.base
  }
});

export default TaskListScreen;
