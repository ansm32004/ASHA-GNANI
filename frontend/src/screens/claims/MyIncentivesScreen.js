import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { StatusIndicator } from '../../components/common/StatusIndicator';
import { claimApi } from '../../services/api/claimApi';
import { formatDate } from '../../utils/dateUtils';

export const MyIncentivesScreen = ({ navigation }) => {
  const [claims, setClaims] = useState([]);
  const [overview, setOverview] = useState({
    total_earned: 0,
    pending_claims: 0,
    eligible_to_claim: 0,
    paid: 0,
    total_claims_count: 0
  });
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  // Selected claim detail modal state
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [claimList, overviewData, guidelinesData] = await Promise.all([
        claimApi.getClaims(true),
        claimApi.getOverview(),
        claimApi.getGuidelines('Delhi')
      ]);
      setClaims(claimList || []);
      setOverview(overviewData || {});
      setGuidelines(guidelinesData || []);
    } catch (err) {
      console.warn('Error loading incentive data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    claimApi.invalidateCache();
    loadData();
  };

  const handleOpenClaimDetail = (claim) => {
    setSelectedClaim(claim);
    setDetailModalVisible(true);
  };

  const handleSubmitDraftClaim = async (claimId) => {
    try {
      setSubmittingId(claimId);
      await claimApi.submitClaim(claimId);
      setDetailModalVisible(false);
      await loadData();
    } catch (err) {
      console.warn('Error submitting draft claim:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  // Status Filter Tabs
  const STATUS_TABS = ['All', 'Draft', 'Submitted', 'Under Verification', 'Approved', 'Rejected', 'Paid'];

  const filteredClaims = useMemo(() => {
    if (activeTab === 'All') return claims;
    return claims.filter((c) => {
      const st = (c.status || '').toLowerCase();
      const pst = (c.payment_status || '').toLowerCase();
      const target = activeTab.toLowerCase();

      if (target === 'draft') return st.includes('draft');
      if (target === 'submitted') return st.includes('submitted');
      if (target === 'under verification') return pst.includes('under verification') || st.includes('under verification');
      if (target === 'approved') return st.includes('approved');
      if (target === 'rejected') return st.includes('rejected') || pst.includes('rejected');
      if (target === 'paid') return pst === 'paid' || pst === 'disbursed' || st === 'paid';
      return true;
    });
  }, [claims, activeTab]);

  const getStatusBadge = (claim) => {
    const st = (claim.status || '').toLowerCase();
    const pst = (claim.payment_status || '').toLowerCase();

    if (pst === 'paid' || pst === 'disbursed' || st === 'paid') {
      return { label: 'Paid', bg: colors.successLight, text: colors.success, icon: 'checkmark-circle' };
    }
    if (st.includes('approved')) {
      return { label: 'Approved', bg: colors.tealLight, text: colors.tealDark, icon: 'shield-checkmark' };
    }
    if (st.includes('rejected') || pst.includes('rejected')) {
      return { label: 'Rejected', bg: colors.dangerLight, text: colors.danger, icon: 'close-circle' };
    }
    if (pst.includes('under verification') || st.includes('under verification')) {
      return { label: 'Under Verification', bg: colors.warningLight, text: colors.primaryDark, icon: 'hourglass-outline' };
    }
    if (st.includes('submitted')) {
      return { label: 'Submitted', bg: colors.primaryLight, text: colors.primary, icon: 'paper-plane-outline' };
    }
    return { label: 'Draft', bg: colors.surfaceSecondary, text: colors.secondaryText, icon: 'document-text-outline' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title="My Incentives & Earnings"
        subtitle="Your work, your incentives, all in one place."
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* ================= 1. FOUR SUMMARY CARDS (OVERVIEW) ================= */}
        <View style={styles.overviewHeaderRow}>
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
        </View>

        <View style={styles.overviewGrid}>
          {/* Card 1: Total Earned */}
          <View style={styles.overviewCard}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="trophy-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.cardValue}>₹{(overview.total_earned || 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.cardLabel}>Total Earned</Text>
            <Text style={styles.cardHint}>Verified incentives</Text>
          </View>

          {/* Card 2: Pending Claims */}
          <View style={styles.overviewCard}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="time-outline" size={20} color="#D97706" />
            </View>
            <Text style={[styles.cardValue, { color: '#B45309' }]}>₹{(overview.pending_claims || 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.cardLabel}>Pending Claims</Text>
            <Text style={styles.cardHint}>Submitted, awaiting MO</Text>
          </View>

          {/* Card 3: Eligible to Claim */}
          <View style={styles.overviewCard}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.tealLight }]}>
              <Ionicons name="sparkles-outline" size={20} color={colors.tealDark} />
            </View>
            <Text style={[styles.cardValue, { color: colors.tealDark }]}>₹{(overview.eligible_to_claim || 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.cardLabel}>Eligible to Claim</Text>
            <Text style={styles.cardHint}>From recorded activities</Text>
          </View>

          {/* Card 4: Paid */}
          <View style={styles.overviewCard}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-done-circle-outline" size={20} color={colors.success} />
            </View>
            <Text style={[styles.cardValue, { color: colors.success }]}>₹{(overview.paid || 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.cardLabel}>Paid</Text>
            <Text style={styles.cardHint}>Confirmed disbursed</Text>
          </View>
        </View>

        {/* Official Governance Notice Banner */}
        <View style={styles.disclaimerBanner}>
          <Ionicons name="information-circle-outline" size={16} color={colors.secondaryText} style={{ marginTop: 1 }} />
          <Text style={styles.disclaimerText}>
            Sahayika is an incentive tracking and claim preparation system. Official payments require Medical Officer register verification and PFMS treasury disbursement.
          </Text>
        </View>

        {/* ================= 2. CLAIM MONEY FLOW CTA ================= */}
        <View style={styles.ctaWrapper}>
          <TouchableOpacity
            style={styles.createClaimBtn}
            onPress={() => navigation.navigate('CreateClaim')}
            activeOpacity={0.88}
            accessibilityLabel="Create New Claim"
          >
            <View style={styles.createClaimBtnContent}>
              <View style={styles.plusCircle}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.createClaimTitle}>+ Create New Claim</Text>
                <Text style={styles.createClaimSub}>Compile completed healthcare activities for incentive approval</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ================= 3. CLAIM HISTORY SECTION ================= */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionTitle}>Claim Records History</Text>
          <Text style={styles.historyCountText}>{filteredClaims.length} records</Text>
        </View>

        {/* Horizontal Status Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {STATUS_TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.statusTab, isSelected && styles.statusTabActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.statusTabText, isSelected && styles.statusTabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Claim Cards List */}
        <View style={styles.claimsList}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
          ) : filteredClaims.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="folder-open-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Claims in "{activeTab}"</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'All'
                  ? 'You have not submitted any incentive claims yet. Tap "+ Create New Claim" above.'
                  : `No claim records currently match the status "${activeTab}".`}
              </Text>
            </View>
          ) : (
            filteredClaims.map((claim) => {
              const badge = getStatusBadge(claim);
              const amountStr = claim.amount_pending_verification
                ? 'Amount pending verification'
                : `₹${(claim.total_estimated_amount || 0).toLocaleString('en-IN')}`;

              return (
                <TouchableOpacity
                  key={claim.id}
                  style={styles.claimCard}
                  onPress={() => handleOpenClaimDetail(claim)}
                  activeOpacity={0.85}
                  accessibilityLabel={`Claim for ${claim.month} ${claim.year}`}
                >
                  <View style={styles.claimCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.claimMonthYear}>
                        {claim.month} {claim.year}
                      </Text>
                      <Text style={styles.claimIdText}>{claim.id}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                      <Ionicons name={badge.icon} size={13} color={badge.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusPillText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <View style={styles.claimDivider} />

                  <View style={styles.claimCardBottom}>
                    <View>
                      <Text style={styles.claimActivitiesCount}>
                        {claim.activities_count || (claim.activities ? claim.activities.length : 0)} activities included
                      </Text>
                      <Text style={styles.claimSubmittedDate}>
                        {claim.submitted_at ? `Submitted: ${formatDate(claim.submitted_at)}` : 'Draft record'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.claimAmount, claim.amount_pending_verification && styles.pendingAmtText]}>
                        {amountStr}
                      </Text>
                      <Text style={styles.viewDetailText}>View Details →</Text>
                    </View>
                  </View>

                  {/* If Rejected: Show subtle inline highlight */}
                  {badge.label === 'Rejected' && claim.rejection_reason ? (
                    <View style={styles.rejectionBanner}>
                      <Ionicons name="alert-circle" size={14} color={colors.danger} />
                      <Text style={styles.rejectionBannerText} numberOfLines={2}>
                        Reason: {claim.rejection_reason}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ================= 4. INCENTIVE GUIDELINES ("KNOW YOUR INCENTIVES") ================= */}
        <View style={styles.guidelinesHeader}>
          <View>
            <Text style={styles.sectionTitle}>Know Your Incentives</Text>
            <Text style={styles.sectionSubtitle}>Official NHM payment categories & eligibility norms</Text>
          </View>
        </View>

        <View style={styles.guidelinesContainer}>
          {guidelines.map((item) => {
            const isStateNotice = item.status === 'guideline_pending_verification';
            return (
              <View key={item.id} style={[styles.guidelineCard, isStateNotice && styles.stateGuidelineCard]}>
                <View style={styles.guidelineTopRow}>
                  <View style={[styles.categoryPill, isStateNotice && styles.stateCategoryPill]}>
                    <Text style={[styles.categoryPillText, isStateNotice && styles.stateCategoryPillText]}>
                      {item.category_label || item.category}
                    </Text>
                  </View>
                  <Text style={[styles.guidelineAmount, isStateNotice && styles.stateGuidelineAmount]}>
                    {item.amount_display}
                  </Text>
                </View>

                <Text style={styles.guidelineTitle}>{item.title}</Text>
                <Text style={styles.guidelineConditions}>{item.eligibility_conditions}</Text>

                {item.notes ? (
                  <View style={styles.guidelineNoteBox}>
                    <Ionicons
                      name={isStateNotice ? 'alert-circle-outline' : 'information-circle-outline'}
                      size={13}
                      color={isStateNotice ? '#B45309' : colors.secondaryText}
                    />
                    <Text style={[styles.guidelineNoteText, isStateNotice && styles.stateNoteText]}>
                      {item.notes}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ================= 5. CLAIM DETAIL MODAL ================= */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            {selectedClaim ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Modal Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>
                      {selectedClaim.month} {selectedClaim.year} Claim
                    </Text>
                    <Text style={styles.modalClaimId}>{selectedClaim.id}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setDetailModalVisible(false)}
                    style={styles.modalCloseBtn}
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Status & Amount Summary Pod */}
                <View style={styles.modalSummaryPod}>
                  <View>
                    <Text style={styles.modalAmountLabel}>Claimed Amount</Text>
                    <Text style={styles.modalAmountValue}>
                      {selectedClaim.amount_pending_verification
                        ? 'Pending Verification'
                        : `₹${(selectedClaim.total_estimated_amount || 0).toLocaleString('en-IN')}`}
                    </Text>
                  </View>
                  {(() => {
                    const b = getStatusBadge(selectedClaim);
                    return (
                      <View style={[styles.statusPill, { backgroundColor: b.bg, paddingHorizontal: 10, paddingVertical: 5 }]}>
                        <Ionicons name={b.icon} size={14} color={b.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusPillText, { color: b.text, fontSize: 12 }]}>{b.label}</Text>
                      </View>
                    );
                  })()}
                </View>

                {/* If Rejected: Prominent Rejection Reason Box */}
                {selectedClaim.rejection_reason ? (
                  <View style={styles.rejectionDetailBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="close-circle" size={18} color={colors.danger} />
                      <Text style={styles.rejectionTitle}>Official Rejection Reason</Text>
                    </View>
                    <Text style={styles.rejectionDetailText}>{selectedClaim.rejection_reason}</Text>
                  </View>
                ) : null}

                {/* Supervisor Remarks / Verification Notes */}
                {selectedClaim.supervisor_notes ? (
                  <View style={styles.remarksBox}>
                    <Text style={styles.remarksTitle}>Supervisor / ANM Remarks</Text>
                    <Text style={styles.remarksText}>{selectedClaim.supervisor_notes}</Text>
                  </View>
                ) : null}

                {/* Verification Timestamps */}
                <View style={styles.metaBox}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaKey}>Submission Date:</Text>
                    <Text style={styles.metaVal}>{selectedClaim.submitted_at ? formatDate(selectedClaim.submitted_at) : 'Not submitted yet'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaKey}>Payment Status:</Text>
                    <Text style={styles.metaVal}>{selectedClaim.payment_status || 'Under Verification'}</Text>
                  </View>
                  {selectedClaim.verified_at ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaKey}>Verified Date:</Text>
                      <Text style={styles.metaVal}>{formatDate(selectedClaim.verified_at)}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Itemized Activities List */}
                <Text style={styles.activitiesHeaderTitle}>Itemized Healthcare Activities</Text>
                {selectedClaim.activities && selectedClaim.activities.length > 0 ? (
                  selectedClaim.activities.map((act, i) => (
                    <View key={act.id || i} style={styles.activityItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityDesc}>{act.description}</Text>
                        <Text style={styles.activityMeta}>
                          {act.category} • Beneficiary: {act.beneficiary_name || 'Community Member'} • {formatDate(act.activity_date)}
                        </Text>
                      </View>
                      <Text style={styles.activityAmt}>
                        {act.amount_pending_verification ? 'Pending' : `₹${act.estimated_amount}`}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noActivitiesText}>No itemized activity breakdown attached to this record.</Text>
                )}

                {/* Action Button for Drafts */}
                {selectedClaim.status === 'Draft' ? (
                  <View style={{ marginTop: 20 }}>
                    <PrimaryButton
                      title="Submit Draft Claim"
                      onPress={() => handleSubmitDraftClaim(selectedClaim.id)}
                      loading={submittingId === selectedClaim.id}
                      icon="paper-plane"
                    />
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
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
  container: {
    padding: spacing.screenPadding,
    paddingBottom: 48
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: colors.primaryText
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary
  },
  liveBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryDark
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6
  },
  overviewCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  cardValue: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 2
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText
  },
  cardHint: {
    fontSize: 10,
    color: colors.secondaryText,
    marginTop: 1
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    marginBottom: 16
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: colors.secondaryText
  },
  ctaWrapper: {
    marginBottom: 22
  },
  createClaimBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 16,
    ...shadows.subtle
  },
  createClaimBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  plusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  createClaimTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.textWhite
  },
  createClaimSub: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2
  },
  guidelinesHeader: {
    marginBottom: 10
  },
  guidelinesContainer: {
    gap: 10,
    marginBottom: 24
  },
  guidelineCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  stateGuidelineCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FEFDF8'
  },
  guidelineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  categoryPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryDark
  },
  stateCategoryPill: {
    backgroundColor: '#FEF3C7'
  },
  stateCategoryPillText: {
    color: '#92400E'
  },
  guidelineAmount: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primaryDark
  },
  stateGuidelineAmount: {
    color: '#B45309'
  },
  guidelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 4
  },
  guidelineConditions: {
    fontSize: 11.5,
    color: colors.secondaryText,
    lineHeight: 16
  },
  guidelineNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 6,
    marginTop: 6
  },
  guidelineNoteText: {
    flex: 1,
    fontSize: 10.5,
    color: colors.secondaryText,
    lineHeight: 14
  },
  stateNoteText: {
    color: '#B45309'
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  historyCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText
  },
  tabsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10
  },
  statusTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  statusTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  statusTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText
  },
  statusTabTextActive: {
    color: colors.textWhite,
    fontWeight: '700'
  },
  claimsList: {
    gap: 10,
    marginTop: 4
  },
  claimCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle
  },
  claimCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  claimMonthYear: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText
  },
  claimIdText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.pill
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700'
  },
  claimDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10
  },
  claimCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  claimActivitiesCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText
  },
  claimSubmittedDate: {
    fontSize: 10.5,
    color: colors.secondaryText,
    marginTop: 2
  },
  claimAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark
  },
  pendingAmtText: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600'
  },
  viewDetailText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2
  },
  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerLight,
    padding: 8,
    borderRadius: 8,
    marginTop: 10
  },
  rejectionBannerText: {
    flex: 1,
    fontSize: 11,
    color: colors.danger,
    fontWeight: '600'
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16
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
    marginBottom: 12
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
    fontWeight: '700',
    color: colors.primaryText
  },
  modalClaimId: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2
  },
  modalSummaryPod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primaryMuted
  },
  modalAmountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark
  },
  modalAmountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2
  },
  rejectionDetailBox: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  rejectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.danger
  },
  rejectionDetailText: {
    fontSize: 12,
    color: colors.danger,
    lineHeight: 16
  },
  remarksBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  remarksTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 3
  },
  remarksText: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 16
  },
  metaBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 14,
    gap: 4
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  metaKey: {
    fontSize: 11.5,
    color: colors.secondaryText
  },
  metaVal: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primaryText
  },
  activitiesHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 8
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  activityDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText
  },
  activityMeta: {
    fontSize: 10.5,
    color: colors.secondaryText,
    marginTop: 2
  },
  activityAmt: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: 8
  },
  noActivitiesText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginVertical: 8
  }
});

export default MyIncentivesScreen;
