import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { formatDate } from '../../utils/dateUtils';
import { AvatarImage } from '../common/AvatarImage';

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
        <AvatarImage
          name={member.name}
          role={member.category}
          size={38}
          showBorder
          borderColor={colors.border}
          style={{ marginRight: 10 }}
        />
        <View style={styles.infoLeft}>
          <Text style={styles.name}>{tr(member.name)}</Text>
          <Text style={styles.meta}>{tr(member.relation)} • {tr(member.age)}{' '}{tr('yrs •')}{' '}{tr(member.gender)}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg, borderColor: catStyle.border }]}>
          <Text style={[styles.categoryText, { color: catStyle.text }]}>{tr(member.category)}</Text>
        </View>
      </View>

      {member.rch_id && (
        <Text style={styles.rchText}>{tr('RCH ID:')}{' '}{tr(member.rch_id)}</Text>
      )}

      {member.is_high_risk && member.high_risk_reason && (
        <View style={styles.alertBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.danger} style={{ marginRight: 5 }} />
            <Text style={styles.alertText}>{tr('High Risk:')}{' '}{tr(member.high_risk_reason)}</Text>
          </View>
        </View>
      )}

      {member.pregnancy_month && (
        <Text style={styles.subDetail}>{tr('Pregnancy: Month')}{' '}{tr(member.pregnancy_month)}{' '}{tr('(EDD:')}{' '}{tr(member.expected_delivery_date ? formatDate(member.expected_delivery_date) : 'N/A')})</Text>
      )}

      {member.next_due_vaccine && (
        <View style={styles.vaccineRow}>
          <Text style={styles.vaccineLabel}>{tr('Next Due Vaccine:')}</Text>
          <Text style={styles.vaccineVal}>{tr(member.next_due_vaccine)}</Text>
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
    borderColor: 'rgba(11, 18, 32, 0.06)'
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
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4
  }
});
