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
import { visitApi } from '../../services/api/visitApi';
import { useTranslation } from 'react-i18next';

export const VisitDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { visitId, visit: initialVisit } = route.params || {};

  const [visit, setVisit] = useState(initialVisit || null);
  const [loading, setLoading] = useState(!initialVisit && !!visitId);
  const [error, setError] = useState(null);

  const fetchVisitDetail = useCallback(async () => {
    if (!visitId && !initialVisit?.id) return;
    const targetId = visitId || initialVisit.id;
    try {
      setLoading(true);
      setError(null);
      const data = await visitApi.getVisitById(targetId);
      if (data) {
        setVisit(data);
      } else if (!initialVisit) {
        setError('Visit record not found.');
      }
    } catch (err) {
      console.warn('Error fetching visit detail:', err);
      if (!initialVisit) {
        setError('Unable to load visit record. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [visitId, initialVisit]);

  useEffect(() => {
    fetchVisitDetail();
  }, [fetchVisitDetail]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MinimalHeader
          title="Field Visit Record"
          subtitle="Loading details..."
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching saved visit details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !visit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MinimalHeader
          title="Field Visit Record"
          subtitle="Not Found"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.errorTitle}>{error || 'Visit Record Not Available'}</Text>
          <Text style={styles.errorSub}>The requested visit could not be retrieved from local records or cloud storage.</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>Return to Calendar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Format creation timestamp if available
  const formattedCreatedAt = visit.created_at
    ? new Date(visit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title="Field Visit Record"
        subtitle={`Record ID: ${visit.id}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Hero Identity Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.iconContainer}>
              <VectorCategoryIcon category={visit.activity_category} size={36} />
            </View>
            <View style={styles.heroMetaCol}>
              <Text style={styles.householdName} numberOfLines={1}>
                {visit.household_name || 'Household Visit'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="person-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.beneficiaryName} numberOfLines={1}>
                  {visit.beneficiary_name || 'Primary Beneficiary'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.badgeRow}>
            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-done" size={14} color={colors.success} />
              <Text style={styles.statusBadgeText}>{visit.status || 'Confirmed'}</Text>
            </View>

            {/* Priority Badge */}
            {visit.priority ? (
              <StatusIndicator status={visit.priority} isPriority />
            ) : null}

            {/* Activity Category Pill */}
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{visit.activity_category || 'Health Visit'}</Text>
            </View>
          </View>

          {/* Date & Time Row */}
          <View style={styles.dateMetaRow}>
            <View style={styles.dateMetaItem}>
              <Ionicons name="calendar" size={14} color={colors.primary} />
              <Text style={styles.dateMetaText}>
                Date: <Text style={styles.boldText}>{formatDate(visit.visit_date)}</Text>
              </Text>
            </View>
            {formattedCreatedAt ? (
              <View style={styles.dateMetaItem}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.dateMetaText}>Logged: {formattedCreatedAt}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* 2. AI-Generated Activity Summary Section */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionBadgeAI}>
              <Ionicons name="sparkles" size={13} color={colors.primary} />
              <Text style={styles.sectionBadgeAIText}>AI Structured Summary</Text>
            </View>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              {visit.activity_description || 'Routine frontline field visit conducted.'}
            </Text>
          </View>
        </View>

        {/* 3. Original Speech Transcript Section (Recorded in Mic by ASHA Worker) */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionBadgeMic}>
              <Ionicons name="mic" size={13} color="#1E60AA" />
              <Text style={styles.sectionBadgeMicText}>
                Recorded in Mic by ASHA Worker (Voice Note Text)
              </Text>
            </View>
          </View>

          <View style={[styles.transcriptBox, !visit.speech_transcript && styles.transcriptBoxEmpty]}>
            {visit.speech_transcript && visit.speech_transcript.trim().length > 0 ? (
              <>
                <Text style={styles.transcriptQuoteIcon}>“</Text>
                <Text style={styles.transcriptText}>{visit.speech_transcript.trim()}</Text>
                <View style={styles.transcriptFooterRow}>
                  <Ionicons name="shield-checkmark-outline" size={12} color={colors.primary} />
                  <Text style={styles.transcriptFooterText}>
                    Verbatim text of what the ASHA worker spoke into the microphone
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyTranscriptRow}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
                <Text style={styles.emptyTranscriptText}>
                  No voice recording attached to this record (visit details were saved directly via manual form entry).
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. Clinical Outcome & Observations */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Visit Observations & Outcome</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Clinical Outcome</Text>
              <View style={styles.outcomePill}>
                <Ionicons
                  name={
                    (visit.visit_outcome || '').toLowerCase().includes('refer')
                      ? 'alert-circle'
                      : 'checkmark-circle'
                  }
                  size={14}
                  color={
                    (visit.visit_outcome || '').toLowerCase().includes('refer')
                      ? colors.danger
                      : colors.success
                  }
                />
                <Text style={styles.outcomeText}>{visit.visit_outcome || 'Normal'}</Text>
              </View>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Priority Classification</Text>
              <Text style={styles.infoValue}>{visit.priority || 'Routine'}</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.notesContainer}>
            <Text style={styles.infoLabel}>Field Notes</Text>
            <Text style={styles.notesText}>
              {visit.notes && visit.notes.trim().length > 0
                ? visit.notes.trim()
                : 'No additional observations noted.'}
            </Text>
          </View>
        </View>

        {/* 5. Follow-Up & Actionable Tasks */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Follow-up Plan & Scheduled Tasks</Text>

          <View style={styles.followupCard}>
            <View style={styles.followupRow}>
              <Text style={styles.followupLabel}>Follow-up Required:</Text>
              <Text style={[styles.followupValue, { color: visit.follow_up_required ? colors.primary : colors.textSecondary }]}>
                {visit.follow_up_required ? 'Yes, Scheduled' : 'No Follow-up Needed'}
              </Text>
            </View>

            {visit.follow_up_required && visit.follow_up_date ? (
              <View style={styles.followupRow}>
                <Text style={styles.followupLabel}>Follow-up Due Date:</Text>
                <View style={styles.followupDateBadge}>
                  <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                  <Text style={styles.followupDateText}>{formatDate(visit.follow_up_date)}</Text>
                </View>
              </View>
            ) : null}

            {visit.created_task_id ? (
              <TouchableOpacity
                style={styles.linkedTaskBtn}
                onPress={() => navigation.navigate('TaskDetail', { taskId: visit.created_task_id })}
                activeOpacity={0.8}
              >
                <View style={styles.linkedTaskLeft}>
                  <Ionicons name="checkbox-outline" size={16} color={colors.primary} />
                  <Text style={styles.linkedTaskText}>View Scheduled Follow-up Task</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* 6. Record Integrity & Sync Status */}
        <View style={styles.footerAudit}>
          <Ionicons name="cloud-done-outline" size={14} color={colors.success} />
          <Text style={styles.footerAuditText}>
            Record synced with ABDM and Cloud Firestore ({visit.id})
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
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
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill
  },
  backBtnText: {
    ...typography.button,
    color: colors.textWhite,
    fontWeight: '700'
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
    borderRadius: 14,
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
    fontWeight: '700'
  },
  beneficiaryName: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
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
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success
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
    fontWeight: '700',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  sectionBadgeAI: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  sectionBadgeAIText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  sectionBadgeMic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  sectionBadgeMicText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E60AA'
  },
  sectionTitle: {
    ...typography.heading3,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10
  },
  summaryBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary
  },
  summaryText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 20
  },
  transcriptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative'
  },
  transcriptBoxEmpty: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border
  },
  transcriptQuoteIcon: {
    fontSize: 24,
    color: colors.primary,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: -4
  },
  transcriptText: {
    ...typography.bodyMedium,
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 22,
    paddingHorizontal: 4
  },
  transcriptFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  transcriptFooterText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  emptyTranscriptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4
  },
  emptyTranscriptText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  infoCol: {
    flex: 1
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  outcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  outcomeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  notesContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 10,
    marginTop: 4
  },
  notesText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18
  },
  followupCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 12
  },
  followupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  followupLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary
  },
  followupValue: {
    ...typography.bodyMedium,
    fontWeight: '700'
  },
  followupDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border
  },
  followupDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  linkedTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginTop: 6
  },
  linkedTaskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  linkedTaskText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryDark
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

export default VisitDetailScreen;
