import { tr } from '../../localisation/tr';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { AppInput } from '../../components/common/AppInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { InlineDatePicker } from '../../components/common/InlineDatePicker';
import { householdApi } from '../../services/api/householdApi';
import { claimApi } from '../../services/api/claimApi';
import { formatDate } from '../../utils/dateUtils';

const CLAIM_MONTHS = ['November 2026', 'October 2026', 'September 2026', 'August 2026'];

const INCENTIVE_CATEGORIES = [
  { key: 'Maternal health', label: 'Maternal Health', icon: 'woman-outline' },
  { key: 'Child health', label: 'Child Health & HBNC', icon: 'happy-outline' },
  { key: 'Immunisation', label: 'Immunisation & Vaccines', icon: 'shield-outline' },
  { key: 'Home visits', label: 'Home Visits', icon: 'home-outline' },
  { key: 'TB treatment', label: 'TB Treatment Follow-up', icon: 'medkit-outline' },
  { key: 'Other eligible NHM activities', label: 'Other NHM Activities', icon: 'apps-outline' }
];

const HEALTHCARE_ACTIVITIES = [
  {
    type: 'Pregnancy registration and antenatal care follow-ups',
    category: 'Maternal health',
    title: 'Pregnancy Registration & ANC Follow-ups',
    subtitle: 'Registration within 12 weeks & accompanied checkups',
    rate: 300,
    rateDisplay: '₹300 / mother'
  },
  {
    type: 'Institutional delivery support',
    category: 'Maternal health',
    title: 'Institutional Delivery Support (JSY)',
    subtitle: 'Accompaniment to accredited public health facility',
    rate: 600,
    rateDisplay: '₹600 / delivery'
  },
  {
    type: 'Child immunisation and vaccination follow-ups',
    category: 'Immunisation',
    title: 'Child Immunisation & Vaccination Follow-ups',
    subtitle: 'Infant complete routine vaccine mobilisation',
    rate: 400,
    rateDisplay: '₹400 / child'
  },
  {
    type: 'Home visits',
    category: 'Child health',
    title: 'Home Based Newborn Care (HBNC Visits)',
    subtitle: 'Complete 6 scheduled home visits logged in MCP',
    rate: 250,
    rateDisplay: '₹250 / newborn'
  },
  {
    type: 'TB treatment follow-ups',
    category: 'TB treatment',
    title: 'TB Treatment Supporter Follow-up (DOTS)',
    subtitle: 'Directly observed therapy adherence support',
    rate: 1000,
    rateDisplay: '₹1,000 / treatment'
  },
  {
    type: 'Other eligible NHM activities',
    category: 'Other eligible NHM activities',
    title: 'Other Eligible NHM Special Activities',
    subtitle: 'Special health campaign or non-standard drive',
    rate: null, // Amount pending verification
    rateDisplay: 'Amount pending verification'
  }
];

export const CreateClaimScreen = ({ navigation }) => {
  const [selectedMonth, setSelectedMonth] = useState('November 2026');
  const [selectedCategory, setSelectedCategory] = useState('Maternal health');
  const [selectedActivity, setSelectedActivity] = useState(HEALTHCARE_ACTIVITIES[0]);

  // Activity Date state (DD-MM-YYYY)
  const [activityDate, setActivityDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${m}-${d.getFullYear()}`;
  });

  // Households
  const [households, setHouseholds] = useState([]);
  const [selectedHh, setSelectedHh] = useState(null);

  // Stepper count
  const [activityCount, setActivityCount] = useState(1);

  // Supporting notes
  const [supportingNotes, setSupportingNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Confirmation Success Modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [createdClaim, setCreatedClaim] = useState(null);

  useEffect(() => {
    const loadHhs = async () => {
      try {
        const list = await householdApi.getHouseholds();
        setHouseholds(list || []);
        if (list && list.length > 0) {
          setSelectedHh(list[0]);
        }
      } catch (err) {
        console.warn('Error loading households:', err);
      }
    };
    loadHhs();
  }, []);

  // Filter activities matching selected category
  const visibleActivities = useMemo(() => {
    return HEALTHCARE_ACTIVITIES.filter(
      (a) => a.category.toLowerCase() === selectedCategory.toLowerCase() || selectedCategory === 'Other eligible NHM activities'
    );
  }, [selectedCategory]);

  // Live estimated amount calculation
  const isPendingVerification = selectedActivity?.rate === null;
  const estimatedAmount = useMemo(() => {
    if (isPendingVerification) return null;
    return (selectedActivity?.rate || 0) * activityCount;
  }, [selectedActivity, activityCount, isPendingVerification]);

  const handleSubmitClaim = async () => {
    if (!selectedActivity) {
      Alert.alert(tr('Required'), tr('Please choose a completed healthcare activity.'));
      return;
    }
    if (!activityDate) {
      Alert.alert(tr('Required'), tr('Please select the date on which the activity was completed.'));
      return;
    }

    setLoading(true);
    try {
      const monthOnly = selectedMonth.split(' ')[0];
      const yearOnly = parseInt(selectedMonth.split(' ')[1] || '2026', 10);

      const payload = {
        month: monthOnly,
        year: yearOnly,
        category: selectedCategory,
        activities: [
          {
            activity_type: selectedActivity.type,
            category: selectedActivity.category,
            activity_date: activityDate,
            household_id: selectedHh?.id || 'hh_001',
            beneficiary_name: selectedHh?.primary_contact_name || 'Community Beneficiary',
            completed_count: activityCount,
            estimated_amount: estimatedAmount,
            amount_pending_verification: isPendingVerification,
            notes: supportingNotes.trim() || undefined
          }
        ],
        supporting_notes: supportingNotes.trim() || undefined,
        total_estimated_amount: estimatedAmount,
        amount_pending_verification: isPendingVerification
      };

      const result = await claimApi.createClaim(payload);
      setCreatedClaim(result);
      setSuccessModalVisible(true);
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Could not submit claim. Please try again.';
      Alert.alert(tr('Submission Notice'), tr(errMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title="Create New Claim"
        subtitle="Compile completed activities for incentive approval"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Step 1: Claim Period */}
        <Text style={styles.stepTitle}>{tr('1. Select Claim Month')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {CLAIM_MONTHS.map((m) => {
            const isSelected = selectedMonth === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setSelectedMonth(m)}
                style={[styles.monthPill, isSelected && styles.monthPillActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.monthPillText, isSelected && styles.monthPillTextActive]}>{tr(m)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Step 2: Incentive Category */}
        <Text style={styles.stepTitle}>{tr('2. Select Incentive Category')}</Text>
        <View style={styles.categoryGrid}>
          {INCENTIVE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => {
                  setSelectedCategory(cat.key);
                  const firstMatch = HEALTHCARE_ACTIVITIES.find(
                    (a) => a.category.toLowerCase() === cat.key.toLowerCase()
                  ) || HEALTHCARE_ACTIVITIES[HEALTHCARE_ACTIVITIES.length - 1];
                  setSelectedActivity(firstMatch);
                }}
                style={[styles.categoryTile, isSelected && styles.categoryTileActive]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon}
                  size={18}
                  color={isSelected ? colors.primary : colors.secondaryText}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.categoryTileText, isSelected && styles.categoryTileTextActive]}>
                  {tr(cat.label)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Step 3: Choose Completed Healthcare Activity */}
        <Text style={styles.stepTitle}>{tr('3. Choose Completed Healthcare Activity')}</Text>
        <View style={styles.activitiesWrapper}>
          {visibleActivities.map((act) => {
            const isSelected = selectedActivity?.type === act.type;
            return (
              <TouchableOpacity
                key={act.type}
                onPress={() => setSelectedActivity(act)}
                style={[styles.activityOptionCard, isSelected && styles.activityOptionCardActive]}
                activeOpacity={0.85}
              >
                <View style={styles.activityOptionLeft}>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityOptionTitle, isSelected && styles.activityOptionTitleActive]}>
                      {tr(act.title)}
                    </Text>
                    <Text style={styles.activityOptionSub}>{tr(act.subtitle)}</Text>
                  </View>
                </View>
                <View style={styles.rateBadge}>
                  <Text style={[styles.rateBadgeText, act.rate === null && styles.ratePendingText]}>
                    {tr(act.rateDisplay)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Step 4: Activity Date */}
        <Text style={styles.stepTitle}>{tr('4. Activity Date')}</Text>
        <InlineDatePicker
          value={activityDate}
          onChangeDate={(formattedDate) => setActivityDate(formattedDate)}
          showShortcuts={false}
          title="Date Activity Was Completed"
        />

        {/* Step 5: Select Beneficiary / Household */}
        <Text style={styles.stepTitle}>{tr('5. Select Beneficiary / Household')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {households.map((h) => {
            const isSelected = selectedHh?.id === h.id;
            return (
              <TouchableOpacity
                key={h.id}
                onPress={() => setSelectedHh(h)}
                style={[styles.hhChip, isSelected && styles.hhChipActive]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person"
                  size={13}
                  color={isSelected ? colors.textWhite : colors.primary}
                  style={{ marginRight: 5 }}
                />
                <View>
                  <Text style={[styles.hhChipName, isSelected && styles.hhChipNameActive]}>
                    {tr(h.primary_contact_name)}
                  </Text>
                  <Text style={[styles.hhChipVillage, isSelected && styles.hhChipVillageActive]}>
                    {tr(h.village)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Step 6: Number of Completed Activities */}
        <Text style={styles.stepTitle}>{tr('6. Number of Completed Activities')}</Text>
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            onPress={() => setActivityCount((prev) => Math.max(1, prev - 1))}
            style={styles.stepperBtn}
            disabled={activityCount <= 1}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={18} color={activityCount <= 1 ? colors.borderStrong : colors.primaryText} />
          </TouchableOpacity>
          <View style={styles.stepperValueBox}>
            <Text style={styles.stepperValueText}>{tr(activityCount)}</Text>
            <Text style={styles.stepperUnitText}>{tr('facilitation')}{tr(activityCount > 1 ? 's' : '')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setActivityCount((prev) => Math.min(20, prev + 1))}
            style={styles.stepperBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        {/* Step 7: Supporting Evidence & Verification Notes */}
        <Text style={styles.stepTitle}>{tr('7. Verification Notes & Register References')}</Text>
        <AppInput
          label="Supporting Details / RCH Register No. (Optional)"
          placeholder={tr('e.g. RCH Register Vol 2, Page 14 • ANM verified')}
          value={supportingNotes}
          onChangeText={setSupportingNotes}
          multiline
          numberOfLines={2}
        />

        {/* ================= 8. LIVE REVIEW BEFORE SUBMISSION ================= */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Ionicons name="calculator-outline" size={18} color={colors.primary} />
            <Text style={styles.reviewHeaderTitle}>{tr('Claim Estimation Summary')}</Text>
          </View>

          <View style={styles.reviewRow}>
            <Text style={styles.reviewKey}>{tr('Claim Period:')}</Text>
            <Text style={styles.reviewVal}>{tr(selectedMonth)}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewKey}>{tr('Beneficiary:')}</Text>
            <Text style={styles.reviewVal}>{tr(selectedHh?.primary_contact_name || 'Community Member')}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewKey}>{tr('Activity Date:')}</Text>
            <Text style={styles.reviewVal}>{tr(activityDate)}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewKey}>{tr('Quantity:')}</Text>
            <Text style={styles.reviewVal}>{tr(activityCount)}{' '}{tr('completed')}</Text>
          </View>

          <View style={styles.reviewDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{tr('Estimated Incentive:')}</Text>
            <Text style={[styles.totalAmount, isPendingVerification && styles.totalPendingText]}>
              {tr(isPendingVerification ? 'Amount pending verification' : `₹${tr(estimatedAmount.toLocaleString('en-IN'))}`)}
            </Text>
          </View>

          {isPendingVerification ? (
            <Text style={styles.pendingHintText}>{tr('The official applicable rate for this non-standard activity will be determined by the Medical Officer upon review.')}</Text>
          ) : null}
        </View>

        {/* Submit Button */}
        <View style={styles.submitBtnWrapper}>
          <PrimaryButton
            title="Submit Claim for Verification"
            onPress={handleSubmitClaim}
            loading={loading}
            icon="checkmark-circle"
            size="large"
          />
        </View>
      </ScrollView>

      {/* ================= CONFIRMATION MODAL ================= */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done" size={32} color={colors.success} />
            </View>

            <Text style={styles.successTitle}>{tr('Claim Submitted Successfully!')}</Text>
            <Text style={styles.successSubtitle}>{tr('Your claim record has been generated and queued for supervisor verification.')}</Text>

            {createdClaim ? (
              <View style={styles.claimReceipt}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>{tr('Claim ID:')}</Text>
                  <Text style={styles.receiptVal}>{tr(createdClaim.id)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>{tr('Submission Date:')}</Text>
                  <Text style={styles.receiptVal}>{tr(formatDate(createdClaim.submitted_at || new Date().toISOString()))}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>{tr('Claim Period:')}</Text>
                  <Text style={styles.receiptVal}>{tr(createdClaim.month)} {tr(createdClaim.year)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>{tr('Claimed Amount:')}</Text>
                  <Text style={[styles.receiptVal, { color: colors.primaryDark, fontWeight: '600' }]}>
                    {tr(createdClaim.amount_pending_verification
                      ? 'Pending verification'
                      : `₹${tr((createdClaim.total_estimated_amount || 0).toLocaleString('en-IN'))}`)}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>{tr('Current Status:')}</Text>
                  <Text style={[styles.receiptVal, { color: '#B45309', fontWeight: '600' }]}>
                    {tr(createdClaim.status)}
                  </Text>
                </View>
              </View>
            ) : null}

            <PrimaryButton
              title="View Claim in History"
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.goBack();
              }}
              style={{ width: '100%', marginTop: 8 }}
            />
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
  container: {
    padding: spacing.screenPadding,
    paddingBottom: 48
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 14,
    marginBottom: 8
  },
  pillsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4
  },
  monthPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  monthPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.primaryDark
  },
  monthPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.primaryText
  },
  monthPillTextActive: {
    color: colors.textWhite,
    fontWeight: '600'
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  categoryTile: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryTileActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  categoryTileText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.secondaryText,
    textAlign: 'center'
  },
  categoryTileTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  activitiesWrapper: {
    gap: 8
  },
  activityOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle
  },
  activityOptionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  activityOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioCircleActive: {
    borderColor: colors.primary
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.ink
  },
  activityOptionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText
  },
  activityOptionTitleActive: {
    color: colors.primaryDark
  },
  activityOptionSub: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2
  },
  rateBadge: {
    alignItems: 'flex-end',
    marginLeft: 8
  },
  rateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  ratePendingText: {
    fontSize: 10,
    color: colors.textMuted
  },
  hhChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  hhChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.primaryDark
  },
  hhChipName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText
  },
  hhChipNameActive: {
    color: colors.textWhite
  },
  hhChipVillage: {
    fontSize: 9.5,
    color: colors.secondaryText
  },
  hhChipVillageActive: {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    width: 180
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperValueBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText
  },
  stepperUnitText: {
    fontSize: 9.5,
    color: colors.secondaryText
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
    ...shadows.subtle
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  reviewHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.primaryDark
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3
  },
  reviewKey: {
    fontSize: 12,
    color: colors.secondaryText
  },
  reviewVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primaryDark
  },
  totalPendingText: {
    fontSize: 12,
    color: colors.textMuted
  },
  pendingHintText: {
    fontSize: 10.5,
    color: colors.secondaryText,
    marginTop: 6,
    lineHeight: 14,
    fontStyle: 'italic'
  },
  submitBtnWrapper: {
    marginTop: 20
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(32, 38, 49, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  successCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    ...shadows.subtle
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'center'
  },
  successSubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  claimReceipt: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    gap: 6
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  receiptKey: {
    fontSize: 11.5,
    color: colors.secondaryText
  },
  receiptVal: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primaryText
  }
});

export default CreateClaimScreen;
