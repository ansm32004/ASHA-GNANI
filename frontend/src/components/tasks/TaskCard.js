import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { formatDate } from '../../utils/dateUtils';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { useTranslation } from 'react-i18next';

export const TaskCard = ({ task, onComplete, onReschedule, onPress }) => {
  const { t } = useTranslation();
  const isCompleted = task.status === 'Completed';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, isCompleted && styles.completedCard]}
    >
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={[styles.householdName, isCompleted && styles.completedText]}>
            {tr(task.household_name)} {tr(task.beneficiary_name ? `• ${tr(task.beneficiary_name)}` : '')}
          </Text>
          <Text style={styles.taskType}>{tr(task.task_type)}</Text>
        </View>
        <PriorityBadge priority={task.priority} />
      </View>

      <Text style={[styles.description, isCompleted && styles.completedText]} numberOfLines={2}>
        {tr(task.description)}
      </Text>

      <View style={styles.middleRow}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.dateText}>{tr('Due:')}{' '}{tr(formatDate(task.due_date))}</Text>
        </View>
        <StatusBadge status={task.status} size="small" />
      </View>

      {task.completion_notes && (
        <View style={styles.completionBox}>
          <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} style={{ marginRight: 4 }} />
          <Text style={styles.completionText}>{tr(task.completion_notes)}</Text>
        </View>
      )}

      {!isCompleted && (
        <View style={styles.actionRow}>
          {onReschedule && (
            <TouchableOpacity
              onPress={() => onReschedule(task)}
              style={styles.rescheduleBtn}
            >
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.rescheduleText}>{tr('Reschedule')}</Text>
            </TouchableOpacity>
          )}

          {onComplete && (
            <TouchableOpacity
              onPress={() => onComplete(task.id)}
              style={styles.doneBtn}
            >
              <Ionicons name="checkmark-circle" size={15} color={colors.textWhite} />
              <Text style={styles.doneText}>{tr('Mark Done')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  completedCard: {
    backgroundColor: colors.surfaceSecondary,
    opacity: 0.75
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  topLeft: {
    flex: 1,
    marginRight: spacing.sm
  },
  householdName: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  taskType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginTop: spacing.xs
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4
  },
  completionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    padding: spacing.xs,
    borderRadius: radius.xs,
    marginTop: spacing.xs
  },
  completionText: {
    ...typography.caption,
    color: colors.success,
    fontSize: 11
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    gap: 8
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  rescheduleText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 4
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  doneText: {
    ...typography.caption,
    color: colors.textWhite,
    fontWeight: '600',
    marginLeft: 4
  }
});
