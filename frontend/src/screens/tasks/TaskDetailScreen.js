import { tr } from '../../localisation/tr';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { VectorCategoryIcon } from '../../components/illustrations/VectorCategoryIcon';
import { StatusIndicator } from '../../components/common/StatusIndicator';
import { formatDate } from '../../utils/dateUtils';
import { taskApi } from '../../services/api/taskApi';
import { visitApi } from '../../services/api/visitApi';
import { useTranslation } from 'react-i18next';

export const TaskDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { taskId, task: initialTask } = route.params || {};

  const [task, setTask] = useState(initialTask || null);
  const [loading, setLoading] = useState(!initialTask && !!taskId);
  const [linkedVisit, setLinkedVisit] = useState(null);
  const [error, setError] = useState(null);

  const fetchTaskDetail = useCallback(async () => {
    if (!taskId && !initialTask?.id) return;
    const targetId = taskId || initialTask.id;
    try {
      setLoading(true);
      setError(null);
      const data = await taskApi.getTaskById(targetId);
      const currentTask = data || initialTask;
      if (currentTask) {
        setTask(currentTask);
        // Look up any linked visit
        try {
          const visits = await visitApi.getVisits();
          let found = visits.find((v) => v.created_task_id === currentTask.id);
          if (!found && currentTask.created_from_visit_id) {
            found = visits.find((v) => v.id === currentTask.created_from_visit_id);
          }
          if (!found) {
            found = visits.find(
              (v) =>
                v.household_id === currentTask.household_id &&
                (v.follow_up_date === currentTask.due_date || v.visit_date === currentTask.due_date)
            );
          }
          if (!found) {
            found = visits.find((v) => v.household_id === currentTask.household_id);
          }
          if (found) {
            setLinkedVisit(found);
          }
        } catch (vErr) {
          console.warn('Could not query linked visit:', vErr);
        }
      } else {
        setError('Task record not found.');
      }
    } catch (err) {
      console.warn('Error fetching task detail:', err);
      if (!initialTask) {
        setError('Unable to load task record.');
      }
    } finally {
      setLoading(false);
    }
  }, [taskId, initialTask]);

  useEffect(() => {
    fetchTaskDetail();
  }, [fetchTaskDetail]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MinimalHeader
          title="Task Details"
          subtitle="Loading record..."
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{tr('Fetching saved task record...')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !task) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MinimalHeader
          title="Task Details"
          subtitle="Not Found"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.errorTitle}>{tr(error || 'Task Record Not Found')}</Text>
          <Text style={styles.errorSub}>{tr('The requested task could not be retrieved from the database.')}</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>{tr('Back to Work Schedule')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = task.status === 'Completed';

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title="Task Details"
        subtitle={`${tr('Task ID:')} ${tr(task.id)}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Hero Identity Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.iconContainer}>
              <VectorCategoryIcon category={task.task_type} size={36} />
            </View>
            <View style={styles.heroMetaCol}>
              <Text style={styles.householdName} numberOfLines={1}>
                {tr(task.household_name || 'Household Task')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="person-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.beneficiaryName} numberOfLines={1}>
                  {tr(task.beneficiary_name || 'Family Member')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} style={{ marginRight: 3 }} />
                <Text style={styles.villageText}>{tr(task.village || 'Rampur Kalan')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.badgeRow}>
            {/* Status Indicator */}
            <View
              style={[
                styles.statusBadge,
                isCompleted ? styles.statusBadgeCompleted : styles.statusBadgePending
              ]}
            >
              <Ionicons
                name={isCompleted ? 'checkmark-done-circle' : 'hourglass-outline'}
                size={14}
                color={isCompleted ? colors.success : colors.primary}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isCompleted ? colors.success : colors.primary }
                ]}
              >
                {tr(task.status || 'Upcoming')}
              </Text>
            </View>

            {/* Priority Indicator */}
            {task.priority ? (
              <StatusIndicator status={task.priority} isPriority />
            ) : null}

            {/* Task Type Pill */}
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{tr(task.task_type)}</Text>
            </View>
          </View>

          {/* Due Date Row */}
          <View style={styles.dateMetaRow}>
            <View style={styles.dateMetaItem}>
              <Ionicons name="calendar" size={14} color={colors.primary} />
              <Text style={styles.dateMetaText}>{tr('Due Date:')}{' '}<Text style={styles.boldText}>{tr(formatDate(task.due_date))}</Text>
              </Text>
            </View>
            <View style={styles.dateMetaItem}>
              <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.dateMetaText}>{tr('Origin:')}{' '}{tr(task.created_from || 'Manual')}</Text>
            </View>
          </View>
        </View>

        {/* 2. Task Description Card */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>{tr('Task Instructions & Description')}</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              {tr(task.description || 'Routine frontline field follow-up scheduled.')}
            </Text>
          </View>
        </View>

        {/* 3. Completion Summary (Read-Only) */}
        {isCompleted ? (
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.completedBadgeText}>{tr('Completed Record')}</Text>
              </View>
            </View>

            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>{tr('Completion Notes:')}</Text>
              <Text style={styles.notesText}>
                {tr(task.completion_notes || 'Marked as completed by ASHA worker during field visit.')}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 4. Linked Field Visit Record or Direct Frontline Action */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>
            {tr(linkedVisit ? 'Linked Field Visit Record' : 'Direct Frontline Health Action')}
          </Text>

          {linkedVisit ? (
            <View style={styles.linkedVisitCard}>
              <View style={styles.linkedVisitHeader}>
                <View style={styles.linkedVisitHeaderLeft}>
                  <VectorCategoryIcon category={linkedVisit.activity_category} size={24} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.linkedVisitTitle}>{tr(linkedVisit.activity_category)}</Text>
                    <Text style={styles.linkedVisitDate}>{tr('Visit Date:')}{' '}{tr(formatDate(linkedVisit.visit_date))}
                    </Text>
                  </View>
                </View>
                <View style={styles.linkedVisitOutcomePill}>
                  <Text style={styles.linkedVisitOutcomeText}>
                    {tr(linkedVisit.visit_outcome || 'Normal')}
                  </Text>
                </View>
              </View>

              {/* AI Structured Summary */}
              <View style={styles.aiSummaryContainer}>
                <View style={styles.aiBadgeRow}>
                  <Ionicons name="sparkles" size={11} color={colors.primary} />
                  <Text style={styles.aiBadgeText}>{tr('AI Structured Summary')}</Text>
                </View>
                <Text style={styles.linkedVisitSummary}>
                  {tr(linkedVisit.activity_description)}
                </Text>
              </View>

              {/* Spoken Voice Note (Recorded in Mic by ASHA Worker in Text Format) */}
              {linkedVisit.speech_transcript && linkedVisit.speech_transcript.trim().length > 0 ? (
                <View style={styles.voiceNotePod}>
                  <View style={styles.voiceNoteHeader}>
                    <View style={styles.voiceMicCircle}>
                      <Ionicons name="mic" size={13} color="#0D47A1" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.voiceNoteTitle}>{tr('Recorded in Mic by ASHA Worker (Voice Note):')}</Text>
                      <Text style={styles.voiceNoteSub}>{tr('Verbatim transcription of field recording')}</Text>
                    </View>
                  </View>
                  <View style={styles.voiceQuoteBox}>
                    <Text style={styles.voiceQuoteMark}>“</Text>
                    <Text style={styles.voiceNoteText}>
                      {tr(linkedVisit.speech_transcript.trim())}
                    </Text>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.openVisitBtn}
                onPress={() =>
                  navigation.navigate('VisitDetail', {
                    visitId: linkedVisit.id,
                    visit: linkedVisit
                  })
                }
                activeOpacity={0.8}
              >
                <Text style={styles.openVisitBtnText}>{tr('Open Complete Visit Record')}</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textWhite} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.directActionCard}>
              <View style={styles.directActionHeader}>
                <View style={styles.directActionIconCircle}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.directActionHeaderCol}>
                  <Text style={styles.directActionTitle}>
                    {tr(task.created_from === 'Community Request'
                      ? 'Community Visit Request'
                      : 'Direct Frontline Health Micro-Plan')}
                  </Text>
                  <Text style={styles.directActionSubtitle}>
                    {tr(task.created_from === 'Community Request'
                      ? 'Requested Directly by Beneficiary / Household'
                      : task.created_from === 'Camp'
                      ? 'Health Camp / VHSND Session Mobilization'
                      : task.created_from === 'Manual'
                      ? 'Routine Village Register Micro-Planning'
                      : 'Community Health Mobilization Action')}
                  </Text>
                </View>
              </View>

              <View style={styles.directActionBody}>
                <Text style={styles.directActionDescription}>
                  {tr(task.created_from === 'Community Request'
                    ? isCompleted
                      ? `${tr('This visit requested by')} ${tr(task.beneficiary_name || task.household_name)} ${tr('has been completed and verified on the field.')}`
                      : `${tr(task.beneficiary_name || task.household_name)} ${tr('requested an in-person home visit: "')}${tr(task.description)}${tr('". Tap below to record your visit once you attend to the family.')}`
                    : isCompleted
                    ? `${tr('This task was directly completed and verified on the field for')} ${tr(task.household_name || 'this household')}${tr('. Routine actions (such as immunization sessions, growth monitoring, or health camp mobilization) are logged directly from frontline micro-planning.')}`
                    : `${tr('This task is scheduled as part of direct frontline micro-planning for')} ${tr(task.household_name || 'this household')}${tr('. When you conduct this home visit or action, you can record your voice note directly using the microphone.')}`)}
                </Text>

                <View style={styles.directActionMetaGrid}>
                  <View style={styles.directActionMetaItem}>
                    <Text style={styles.directActionMetaLabel}>{tr('Origin Source')}</Text>
                    <Text style={styles.directActionMetaVal}>
                      {tr(task.created_from || 'Frontline Register')}
                    </Text>
                  </View>
                  <View style={styles.directActionMetaItem}>
                    <Text style={styles.directActionMetaLabel}>{tr('Action Status')}</Text>
                    {isCompleted ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle-outline" size={12} color={colors.success} style={{ marginRight: 3 }} />
                        <Text style={[styles.directActionMetaVal, { color: colors.success }]}>{tr('Completed')}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.directActionMetaVal, { color: colors.primary }]}>{tr('Scheduled Action')}</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Action Button: Record Field Visit with Mic */}
              {!isCompleted && (
                <TouchableOpacity
                  style={styles.recordVisitBtn}
                  onPress={() =>
                    navigation.navigate('RecordVisit', {
                      household: {
                        id: task.household_id,
                        household_name: task.household_name,
                        primary_contact_name: task.beneficiary_name || task.household_name,
                        village: task.village
                      }
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.micCircleBtn}>
                    <Ionicons name="mic" size={16} color={colors.textWhite} />
                  </View>
                  <Text style={styles.recordVisitBtnText}>{tr('Record Field Visit for this Household')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 5. Audit info */}
        <View style={styles.footerAudit}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
          <Text style={styles.footerAuditText}>{tr('Verified Frontline Action Record (')}{tr(task.id)})
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  container: {
    padding: spacing.screenPadding,
    paddingBottom: 40
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 12
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  errorTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center'
  },
  errorSub: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20
  },
  backBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill
  },
  backBtnText: {
    ...typography.button,
    color: colors.textWhite,
    fontWeight: '600'
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.soft
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  heroMetaCol: {
    flex: 1
  },
  householdName: {
    ...typography.heading2,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600'
  },
  beneficiaryName: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2
  },
  villageText: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  statusBadgeCompleted: {
    backgroundColor: colors.successLight
  },
  statusBadgePending: {
    backgroundColor: colors.primaryLight
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  categoryPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border
  },
  categoryPillText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  dateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10
  },
  dateMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  dateMetaText: {
    fontSize: 12.5,
    color: colors.textSecondary
  },
  boldText: {
    fontWeight: '600',
    color: colors.textPrimary
  },
  cardSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.subtle
  },
  sectionTitle: {
    ...typography.heading3,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success
  },
  descriptionBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 12,
  },
  descriptionText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 20
  },
  notesBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 12
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4
  },
  notesText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 19
  },
  linkedVisitCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  linkedVisitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  linkedVisitHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  linkedVisitTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  linkedVisitDate: {
    fontSize: 11.5,
    color: colors.textSecondary
  },
  linkedVisitOutcomePill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border
  },
  linkedVisitOutcomeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary
  },
  linkedVisitSummary: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 8
  },
  aiSummaryContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4
  },
  aiBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.primary
  },
  voiceNotePod: {
    backgroundColor: '#F0F7FF',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    marginVertical: 8
  },
  voiceNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  voiceMicCircle: {
    width: 24,
    height: 24,
    borderRadius: 16,
    backgroundColor: '#E0EAFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  voiceNoteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF'
  },
  voiceNoteSub: {
    fontSize: 10,
    color: '#3B82F6',
    marginTop: 1
  },
  voiceQuoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: radius.sm,
  },
  voiceQuoteMark: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '600',
    color: '#2563EB',
    marginRight: 4
  },
  voiceNoteText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#0B1220',
    fontStyle: 'italic'
  },
  directActionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  directActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  directActionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  directActionHeaderCol: {
    flex: 1
  },
  directActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  directActionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  directActionBody: {
    marginTop: 2
  },
  directActionDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textPrimary,
    marginBottom: 10
  },
  directActionMetaGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 4
  },
  directActionMetaItem: {
    flex: 1
  },
  directActionMetaLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginBottom: 2
  },
  directActionMetaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  recordVisitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 10,
    marginTop: 10
  },
  micCircleBtn: {
    width: 24,
    height: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  recordVisitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textWhite
  },
  footerAudit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10
  },
  footerAuditText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500'
  }
});

export default TaskDetailScreen;
