import { tr } from '../../localisation/tr';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { MinimalListRow } from '../../components/common/MinimalListRow';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ClaimsIncentiveVector } from '../../components/illustrations/CategoryVectors';
import { claimApi } from '../../services/api/claimApi';
import { useTranslation } from 'react-i18next';

export const ClaimScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const loadClaims = async () => {
    setLoading(true);
    const list = await claimApi.getClaims();
    setClaims(list);
    setLoading(false);
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handlePrepareNewClaim = async () => {
    setLoading(true);
    const newClaim = await claimApi.prepareClaim('November');
    await loadClaims();
    setLoading(false);
    Alert.alert(
      tr('Draft Claim Prepared'),
      `${tr('Claim for November 2026 prepared with ₹')}${newClaim.total_estimated_amount} ${tr('eligible activities.')}`
    );
  };

  const handleSubmitClaim = async (claimId) => {
    setSubmittingId(claimId);
    await claimApi.submitClaim(claimId);
    setSubmittingId(null);
    await loadClaims();
    Alert.alert(
      tr('Submitted to Supervisor'),
      tr('Claim submitted to Medical Officer and ANM for register verification.')
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title={t('claims.title') || 'Work & Incentives'}
        subtitle="NHM ASHA Activity & Claim Assistant"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Active Month Incentive Hero Pod */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.coinWrap}>
              <ClaimsIncentiveVector size={30} />
            </View>
            <View style={styles.cycleBadge}>
              <Text style={styles.cycleBadgeText}>{tr('CURRENT CYCLE')}</Text>
            </View>
          </View>

          <Text style={styles.monthLabel}>{tr('November 2026')}</Text>
          <Text style={styles.amountText}>₹3,400</Text>
          <Text style={styles.subtext}>{tr('14 verified activities eligible for NHM incentive')}</Text>

          <TouchableOpacity
            onPress={handlePrepareNewClaim}
            activeOpacity={0.85}
            style={styles.prepareBtn}
          >
            <Ionicons name="add-circle" size={16} color={colors.primary} />
            <Text style={styles.prepareBtnText}>{tr('Prepare Draft Claim')}</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer Notice */}
        <View style={styles.disclaimerRow}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>{tr('Incentive claims are compiled based on verified field records and subject to ANM/MO approval.')}</Text>
        </View>

        {/* History List */}
        <Text style={styles.sectionHeader}>{tr('Claim Records History')}</Text>
        <View style={styles.listContainer}>
          {claims.map((claim, idx) => (
            <MinimalListRow
              key={claim.id}
              category="claim"
              title={`${tr(claim.month)} ${tr(claim.year)} — ₹${tr(claim.total_estimated_amount)}`}
              subtitle={`${tr(claim.activities_count)} ${tr('activities logged •')} ${tr(claim.supervisor_notes || 'Pending ANM verification')}`}
              status={claim.status}
              showDivider={idx < claims.length - 1}
              rightAction={
                claim.status === 'Draft' ? (
                  <TouchableOpacity
                    onPress={() => handleSubmitClaim(claim.id)}
                    style={styles.submitPill}
                  >
                    <Text style={styles.submitPillText}>{tr('Submit')}</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          ))}
        </View>

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
    paddingBottom: 110
  },
  heroCard: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: spacing.base,
    marginBottom: spacing.sm
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  coinWrap: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cycleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: radius.pill
  },
  cycleBadgeText: {
    ...typography.caption,
    color: colors.textWhite,
    fontWeight: '600',
    fontSize: 9.5,
  },
  monthLabel: {
    ...typography.caption,
    color: colors.primaryMuted,
    marginTop: spacing.sm,
    fontWeight: '600'
  },
  amountText: {
    ...typography.displayLarge,
    fontSize: 30,
    color: colors.textWhite,
    fontWeight: '600',
    marginVertical: 2
  },
  subtext: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: spacing.md
  },
  prepareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderRadius: radius.pill
  },
  prepareBtnText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 13
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 6
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10.5,
    flex: 1,
    lineHeight: 14
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs
  },
  listContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border
  },
  submitPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill
  },
  submitPillText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11
  }
});
