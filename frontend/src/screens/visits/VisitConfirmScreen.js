import { tr } from '../../localisation/tr';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { AppInput } from '../../components/common/AppInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VectorCategoryIcon } from '../../components/illustrations/VectorCategoryIcon';
import { visitApi } from '../../services/api/visitApi';
import { formatDate, toBackendDate } from '../../utils/dateUtils';
import { useTranslation } from 'react-i18next';

export const VisitConfirmScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { extractedData = {}, rawTranscript = '', missingFields = [] } = route.params || {};

  const [householdId] = useState(extractedData.household_id || 'hh_001');
  const [householdName, setHouseholdName] = useState(
    extractedData.household_name || extractedData.beneficiary_name || ''
  );
  const [beneficiaryName, setBeneficiaryName] = useState(
    extractedData.beneficiary_name || extractedData.household_name || ''
  );
  const [visitDate, setVisitDate] = useState(
    formatDate(extractedData.visit_date || new Date())
  );
  const [category, setCategory] = useState(extractedData.activity_category || 'Maternal Health');
  const [description, setDescription] = useState(extractedData.activity_description || rawTranscript || '');
  const [outcome, setOutcome] = useState(extractedData.visit_outcome || 'Normal');
  const [followUpRequired, setFollowUpRequired] = useState(extractedData.follow_up_required ?? false);
  const [followUpDate, setFollowUpDate] = useState(
    extractedData.follow_up_date
      ? formatDate(extractedData.follow_up_date)
      : (extractedData.follow_up_required ? formatDate(new Date(Date.now() + 4 * 86400000)) : '')
  );
  const [priority, setPriority] = useState(extractedData.priority || 'Routine');
  const [notes, setNotes] = useState(extractedData.notes || 'Verified by ASHA worker.');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const payload = {
        household_id: householdId || 'hh_001',
        household_name: householdName || beneficiaryName || 'Household',
        beneficiary_name: beneficiaryName || householdName || 'Household Member',
        visit_date: toBackendDate(visitDate) || new Date().toISOString().split('T')[0],
        activity_category: category || 'Maternal Health',
        activity_description: (description || '').trim() || 'Routine field visit checkup',
        visit_outcome: outcome || 'Normal',
        follow_up_required: !!followUpRequired,
        follow_up_date: followUpRequired && followUpDate ? toBackendDate(followUpDate) : null,
        priority: priority || 'Routine',
        notes: notes || 'Verified by ASHA worker.',
        speech_transcript: rawTranscript,
        auto_create_task: true
      };

      await visitApi.confirmVisit(payload);
      setSaving(false);

      Alert.alert(
        tr('Visit Record Confirmed!'),
        `${tr('Visit saved successfully.')}${
          followUpRequired ? ` ${tr('Follow-up task scheduled for')} ${followUpDate}.` : ''
        }`,
        [
          {
            text: tr('Go to Dashboard'),
            onPress: () =>
              navigation.navigate('MainTabs', {
                screen: 'HomeTab',
                params: { refreshedAt: Date.now() }
              })
          }
        ]
      );
    } catch (e) {
      setSaving(false);
      console.warn('Confirm visit error:', e);
      Alert.alert(tr('Error'), tr('Could not confirm visit record. Please try again.'));
    }
  };

  const categories = [
    { label: 'Maternal Health', type: 'maternal' },
    { label: 'Child Health', type: 'child' },
    { label: 'Immunisation', type: 'vaccin' },
    { label: 'Nutrition', type: 'nutri' },
    { label: 'General', type: 'household' }
  ];

  const outcomes = ['Normal', 'Requires Monitoring', 'Referred to PHC', 'Medicine Taken'];
  const priorities = ['Urgent', 'Priority', 'Routine'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title="Confirm Visit Record"
        subtitle="Review AI-structured details"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Raw Voice Transcript Banner */}
        {rawTranscript ? (
          <View style={styles.transcriptBanner}>
            <View style={styles.micCircle}>
              <Ionicons name="mic" size={15} color={colors.primary} />
            </View>
            <View style={styles.transcriptTextCol}>
              <Text style={styles.transcriptLabel}>{tr('Spoken Voice Note:')}</Text>
              <Text style={styles.transcriptBody}>"{tr(rawTranscript)}"</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <AppInput
            label="Beneficiary / Patient Name"
            value={beneficiaryName}
            onChangeText={setBeneficiaryName}
          />

          <AppInput
            label="Visit Date (DD-MM-YYYY)"
            value={visitDate}
            onChangeText={setVisitDate}
            placeholder={tr('e.g. 07-11-2026')}
          />

          <Text style={styles.label}>{tr('Activity Category')}</Text>
          <View style={styles.pillRow}>
            {categories.map((cat) => {
              const isSelected = category === cat.label;
              return (
                <TouchableOpacity
                  key={cat.label}
                  onPress={() => setCategory(cat.label)}
                  style={[styles.pill, isSelected && styles.pillActive]}
                >
                  <VectorCategoryIcon category={cat.type} size={16} style={{ marginRight: 5 }} />
                  <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                    {tr(cat.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppInput
            label="Visit Observations & Findings"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>{tr('Visit Outcome')}</Text>
          <View style={styles.pillRow}>
            {outcomes.map((out) => {
              const isSelected = outcome === out;
              return (
                <TouchableOpacity
                  key={out}
                  onPress={() => setOutcome(out)}
                  style={[styles.pill, isSelected && styles.pillActive]}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{tr(out)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Follow-up Toggle */}
          <TouchableOpacity
            onPress={() => setFollowUpRequired(!followUpRequired)}
            style={styles.toggleRow}
          >
            <Ionicons
              name={followUpRequired ? 'checkbox' : 'square-outline'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.toggleText}>{tr('Follow-up visit required')}</Text>
          </TouchableOpacity>

          {followUpRequired && (
            <View style={styles.followupBox}>
              <AppInput
                label="Follow-up Due Date (DD-MM-YYYY)"
                value={followUpDate}
                onChangeText={setFollowUpDate}
                placeholder={tr('e.g. 11-11-2026')}
              />
              <View style={styles.noticeRow}>
                <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                <Text style={styles.autoTaskNotice}>{tr('Task will be scheduled automatically on your calendar.')}</Text>
              </View>
            </View>
          )}

          <Text style={styles.label}>{tr('Priority')}</Text>
          <View style={styles.pillRow}>
            {priorities.map((p) => {
              const isSelected = priority === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[styles.pill, isSelected && styles.pillActive]}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{tr(p)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppInput label="Additional Notes / Advice" value={notes} onChangeText={setNotes} />
        </View>

        <PrimaryButton
          title="Save Visit Record"
          onPress={handleConfirm}
          loading={saving}
          size="large"
          style={{ marginTop: spacing.md }}
        />

        <View style={{ height: 40 }} />
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
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: 40
  },
  transcriptBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base
  },
  micCircle: {
    width: 28,
    height: 28,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  transcriptTextCol: {
    flex: 1
  },
  transcriptLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary
  },
  transcriptBody: {
    ...typography.caption,
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 18
  },
  formGroup: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  pillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  pillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingVertical: 2
  },
  toggleText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm
  },
  followupBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: 22,
    marginBottom: spacing.sm
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  autoTaskNotice: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 5
  }
});
