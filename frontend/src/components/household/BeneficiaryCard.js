import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme';

export const BeneficiaryCard = ({ member }) => {
  const getCategoryColor = () => {
    switch (member.category) {
      case 'Pregnant Woman': return { bg: colors.warningLight, text: colors.warning, border: '#FCE0B3' };
      case 'Lactating Mother': return { bg: colors.tealLight, text: colors.tealDark, border: '#C7EBE4' };
      case 'Infant': return { bg: colors.primaryLight, text: colors.primary, border: colors.primaryMuted };
      case 'Child (1-5)': return { bg: colors.surfaceSecondary, text: colors.textSecondary, border: colors.border };
      case 'Elder': return { bg: colors.surfaceSecondary, text: colors.textSecondary, border: colors.border };
      default: return { bg: colors.surfaceSecondary, text: colors.textSecondary, border: colors.border };
    }
  };

  const catStyle = getCategoryColor();

  return (
    <View style={[styles.card, member.is_high_risk && styles.highRiskCard]}>
      <View style={styles.headerRow}>
        <View style={styles.infoLeft}>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.meta}>{member.relation} • {member.age} yrs • {member.gender}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg, borderColor: catStyle.border }]}>
          <Text style={[styles.categoryText, { color: catStyle.text }]}>{member.category}</Text>
        </View>
      </View>

      {member.rch_id && (
        <Text style={styles.rchText}>RCH ID: {member.rch_id}</Text>
      )}

      {member.is_high_risk && member.high_risk_reason && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>⚠️ High Risk: {member.high_risk_reason}</Text>
        </View>
      )}

      {member.pregnancy_month && (
        <Text style={styles.subDetail}>Pregnancy: Month {member.pregnancy_month} (EDD: {member.expected_delivery_date || 'N/A'})</Text>
      )}

      {member.next_due_vaccine && (
        <View style={styles.vaccineRow}>
          <Text style={styles.vaccineLabel}>Next Due Vaccine:</Text>
          <Text style={styles.vaccineVal}>{member.next_due_vaccine}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  highRiskCard: {
    borderColor: colors.danger,
    borderLeftWidth: 4
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  infoLeft: {
    flex: 1
  },
  name: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1
  },
  categoryText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10
  },
  rchText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4
  },
  alertBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: radius.medium,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#F7C5C5'
  },
  alertText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600'
  },
  subDetail: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 4,
    fontWeight: '500'
  },
  vaccineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  vaccineLabel: {
    ...typography.caption,
    color: colors.textSecondary
  },
  vaccineVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4
  }
});
