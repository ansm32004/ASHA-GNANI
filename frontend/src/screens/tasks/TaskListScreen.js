import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
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
import { taskApi } from '../../services/api/taskApi';
import { useTranslation } from 'react-i18next';

export const TaskListScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Reschedule modal state
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    const list = await taskApi.getTasks();
    setTasks(list);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleComplete = async (taskId) => {
    await taskApi.completeTask(taskId, 'Task marked complete during field visit');
    await loadTasks();
  };

  const openRescheduleModal = (task) => {
    setSelectedTask(task);
    setNewDueDate(task.due_date);
    setRescheduleNotes('');
    setRescheduleModalVisible(true);
  };

  const handleSaveReschedule = async () => {
    if (!newDueDate.trim()) {
      Alert.alert('Required', 'Please enter new due date.');
      return;
    }
    await taskApi.rescheduleTask(selectedTask.id, newDueDate.trim(), rescheduleNotes.trim());
    setRescheduleModalVisible(false);
    await loadTasks();
  };

  const filterTabs = [
    { key: 'All', label: 'All' },
    { key: 'Due today', label: 'Today' },
    { key: 'Upcoming', label: 'Upcoming' },
    { key: 'Overdue', label: 'Overdue' },
    { key: 'Completed', label: 'Completed' }
  ];

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      activeFilter === 'All'
        ? true
        : (task.status || '').toLowerCase() === activeFilter.toLowerCase();

    if (!matchesFilter) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const name = (task.household_name || '').toLowerCase();
    const type = (task.task_type || '').toLowerCase();
    const desc = (task.description || '').toLowerCase();
    const village = (task.village || '').toLowerCase();
    return name.includes(query) || type.includes(query) || desc.includes(query) || village.includes(query);
  });

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
        subtitle={`${filteredTasks.length} tasks scheduled`}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateTask')}
            style={styles.addBtn}
            accessibilityLabel="Add Task"
          >
            <Ionicons name="add" size={20} color={colors.textWhite} />
          </TouchableOpacity>
        }
      />

      {/* Search Input */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search follow-ups, families..."
        onClear={() => setSearchQuery('')}
      />

      {/* Visual Calendar & Activity Strip */}
      <CalendarActivityView
        selectedDate={4}
        monthLabel="November 2026"
        onSelectDate={(d) => {
          if (d.dayNumber === 4) {
            setActiveFilter('Due today');
          } else {
            setActiveFilter('Upcoming');
          }
        }}
      />

      {/* Filter Tabs Horizontal Strip */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterTabs.map((f) => {
            const isSelected = activeFilter === f.key;
            const count = tasks.filter((t) =>
              f.key === 'All' ? true : (t.status || '').toLowerCase() === f.key.toLowerCase()
            ).length;

            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {f.label}
                </Text>
                <View style={[styles.pillBadge, isSelected && styles.pillBadgeActive]}>
                  <Text style={[styles.pillBadgeText, isSelected && styles.pillBadgeTextActive]}>
                    {count}
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
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isCompleted = item.status === 'Completed';
            const leftColor = getBorderColor(item);

            return (
              <View style={[styles.taskCard, { borderLeftColor: leftColor }]}>
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
                        {formatTaskTitle(item)}
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
                      {item.description}
                    </Text>

                    {/* Metadata & Actions Row */}
                    <View style={styles.cardFooter}>
                      <View style={styles.metaCol}>
                        <View style={styles.metaLine}>
                          <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                          <Text style={styles.metaText}>Due: {item.due_date}</Text>
                        </View>
                        <Text style={styles.villageText}>📍 {item.village || 'Rampur Kalan'}</Text>
                      </View>

                      {/* Right Action Buttons */}
                      {!isCompleted ? (
                        <View style={styles.actionBtns}>
                          <TouchableOpacity
                            onPress={() => openRescheduleModal(item)}
                            style={styles.rescheduleIconBtn}
                            accessibilityLabel="Reschedule"
                          >
                            <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                            <Text style={styles.rescheduleBtnText}>Delay</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleComplete(item.id)}
                            style={styles.doneIconBtn}
                            accessibilityLabel="Mark Done"
                          >
                            <Ionicons name="checkmark" size={15} color={colors.textWhite} />
                            <Text style={styles.doneBtnText}>Done</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.completedTag}>
                          <Ionicons name="checkmark-done" size={14} color={colors.success} />
                          <Text style={styles.completedTagText}>Completed</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
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

      {/* Reschedule Sheet Modal */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Reschedule Follow-up</Text>
            <Text style={styles.modalSub}>
              {selectedTask?.household_name} • {selectedTask?.task_type}
            </Text>

            <AppInput
              label="New Due Date (YYYY-MM-DD)"
              value={newDueDate}
              onChangeText={setNewDueDate}
              placeholder="e.g. 2026-11-10"
            />

            <AppInput
              label="Reason for Rescheduling"
              value={rescheduleNotes}
              onChangeText={setRescheduleNotes}
              placeholder="e.g. Beneficiary visiting maternal home"
            />

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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
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
    fontWeight: '700'
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
    fontWeight: '700',
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
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
    fontWeight: '700',
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
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  rescheduleIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    gap: 3
  },
  rescheduleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText
  },
  doneIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    gap: 3
  },
  doneBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
    fontWeight: '700',
    color: colors.success
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(32, 38, 49, 0.4)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.base
  },
  modalTitle: {
    fontSize: 18,
    color: colors.primaryText,
    fontWeight: '700'
  },
  modalSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
    marginBottom: spacing.base
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: spacing.base
  }
});

export default TaskListScreen;
