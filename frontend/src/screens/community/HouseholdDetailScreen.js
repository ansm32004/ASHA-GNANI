import { tr } from '../../localisation/tr';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { MinimalListRow } from '../../components/common/MinimalListRow';
import { EditorialContentCard } from '../../components/visual/EditorialContentCard';
import { StatusIndicator } from '../../components/common/StatusIndicator';
import { AvatarImage } from '../../components/common/AvatarImage';
import { HouseholdVisitVector } from '../../components/illustrations/CategoryVectors';
import { householdApi } from '../../services/api/householdApi';
import { visitApi } from '../../services/api/visitApi';
import { taskApi } from '../../services/api/taskApi';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/dateUtils';

export const HouseholdDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { householdId } = route.params || { householdId: 'hh_001' };

  const [household, setHousehold] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [visits, setVisits] = useState([]);
  const [tasks, setTasks] = useState([]);

  const loadData = useCallback(async () => {
    const hh = await householdApi.getHouseholdById(householdId);
    setHousehold(hh);
    const vList = await visitApi.getVisits({ household_id: householdId });
    setVisits(vList);
    const tList = await taskApi.getTasks({ household_id: householdId });
    setTasks(tList);
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (!household) return null;

  const handleCall = () => {
    if (household.contact_number) {
      Linking.openURL(`tel:${household.contact_number}`).catch(() => {
        Alert.alert(tr('Call Simulation'), `${tr('Dialing primary contact: +91')} ${household.contact_number}`);
      });
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: `${tr('Members')} (${(household.members || []).length})` },
    { key: 'visits', label: `${tr('Visits')} (${visits.length})` },
    { key: 'tasks', label: `${tr('Tasks')} (${tasks.length})` }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title={household.primary_contact_name}
        subtitle={`${tr(household.household_id)} • ${tr(household.village)}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Profile Block */}
        <View style={styles.heroBlock}>
          <View style={styles.heroTop}>
            <AvatarImage
              name={household.primary_contact_name}
              role="COMMUNITY"
              size={50}
              showBorder
              borderColor={colors.primaryMuted}
              style={{ marginRight: spacing.md }}
            />
            <View style={styles.heroInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName}>{tr(household.primary_contact_name)}</Text>
                <StatusIndicator status={household.priority} isPriority />
              </View>
              <Text style={styles.heroMeta}>
                {tr(household.village)} • {tr(household.sub_area || 'Ward 3')}
              </Text>
              <Text style={styles.heroPhone}>+91 {tr(household.contact_number)}</Text>
            </View>
          </View>

          {/* Quick Action Strip */}
          <View style={styles.actionStrip}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('RecordVisit', { preselectedHouseholdId: household.id })
              }
              style={styles.actionRecord}
            >
              <Ionicons name="mic" size={15} color={colors.textWhite} />
              <Text style={styles.actionRecordText}>{tr('Record Visit')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCall} style={styles.actionCall}>
              <Ionicons name="call" size={15} color={colors.primary} />
              <Text style={styles.actionCallText}>{tr('Call')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('CreateTask', { householdId: household.id })
              }
              style={styles.actionTask}
            >
              <Ionicons name="add" size={16} color={colors.textPrimary} />
              <Text style={styles.actionTaskText}>{tr('Follow-up')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Pills */}
        <View style={styles.tabScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tabPill, isActive && styles.tabPillActive]}
                >
                  <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                    {tr(tab.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <View style={styles.overviewSection}>
            <View style={styles.detailsGroup}>
              <Text style={styles.groupHeader}>{tr('Household Details')}</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{tr('Primary Contact')}</Text>
                <Text style={styles.infoValue}>{tr(household.primary_contact_name)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{tr('Mobile Number')}</Text>
                <Text style={styles.infoValue}>+91 {tr(household.contact_number)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{tr('Location')}</Text>
                <Text style={styles.infoValue}>{tr(household.village)} ({tr(household.sub_area || 'Main Area')})</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{tr('Street / Address')}</Text>
                <Text style={styles.infoValue}>{tr(household.address || 'Near village centre')}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{tr('Language')}</Text>
                <Text style={styles.infoValue}>{tr('Hindi (हिन्दी)')}</Text>
              </View>

              {household.last_visit_date && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr('Last Field Visit')}</Text>
                  <Text style={styles.infoValue}>{tr(formatDate(household.last_visit_date))}</Text>
                </View>
              )}

              {household.next_follow_up && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr('Next Follow-up Due')}</Text>
                  <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '600' }]}>{tr(formatDate(household.next_follow_up))}</Text>
                </View>
              )}

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>{tr('Data Consent')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle-outline" size={13} color={colors.teal} style={{ marginRight: 4 }} />
                  <Text style={[styles.infoValue, { color: colors.teal, fontWeight: '600' }]}>{tr('Verified Consent')}</Text>
                </View>
              </View>
            </View>

            {/* Health Scheme Card with Vector Illustration */}
            <View style={{ marginTop: spacing.md, marginHorizontal: -spacing.screenPadding }}>
              <EditorialContentCard
                badge="Scheme Registered"
                title="Janani Suraksha Yojana (JSY)"
                summary="Institutional delivery assistance verified for Rampur PHC. Eligible for maternity cash incentive under NRHM."
                readTime="Active"
                actionText="View eligibility guidelines"
                illustrationType="maternal"
                onPressAction={() => Alert.alert(tr('JSY Scheme'), tr('Active entitlement under NRHM. Cash assistance of ₹1,400 + ₹600 ASHA incentive.'))}
              />
            </View>
          </View>
        )}

        {/* Tab 2: Members */}
        {activeTab === 'members' && (
          <View style={styles.listContainer}>
            {(household.members || []).map((m, idx) => (
              <MinimalListRow
                key={m.id || idx}
                category={m.category}
                title={`${tr(m.name)} (${tr(m.relation)})`}
                subtitle={`${tr(m.age)} ${tr('yrs •')} ${tr(m.gender)} • ${tr(m.category)}`}
                meta={m.is_high_risk ? `High Risk: ${m.high_risk_reason || 'Requires monitoring'}` : (m.next_due_vaccine ? `Next vaccine: ${m.next_due_vaccine}` : null)}
                priority={m.is_high_risk ? 'Urgent' : null}
                showDivider={idx < (household.members || []).length - 1}
              />
            ))}
          </View>
        )}

        {/* Tab 3: Visits History */}
        {activeTab === 'visits' && (
          <View style={styles.listContainer}>
            {visits.length === 0 ? (
              <Text style={styles.emptyText}>{tr('No field visits logged for this household yet.')}</Text>
            ) : (
              visits.map((v, idx) => (
                <MinimalListRow
                  key={v.id || idx}
                  category={v.activity_category}
                  title={v.activity_description}
                  subtitle={`${tr('Outcome:')} ${tr(v.visit_outcome)}${tr(v.follow_up_date ? ` • Follow-up: ${formatDate(v.follow_up_date)}` : '')}`}
                  meta={`${tr('Date:')} ${tr(formatDate(v.visit_date))} • ${tr(v.activity_category)}`}
                  onPress={() => navigation.navigate('VisitDetail', { visitId: v.id, visit: v })}
                  showDivider={idx < visits.length - 1}
                />
              ))
            )}
          </View>
        )}

        {/* Tab 4: Tasks */}
        {activeTab === 'tasks' && (
          <View style={styles.listContainer}>
            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>{tr('No pending tasks for this family.')}</Text>
            ) : (
              tasks.map((t, idx) => (
                <MinimalListRow
                  key={t.id || idx}
                  category={t.task_type}
                  title={t.task_type}
                  subtitle={t.description}
                  meta={`${tr('Due:')} ${tr(formatDate(t.due_date))}`}
                  status={t.status}
                  priority={t.priority}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: t.id, task: t })}
                  showDivider={idx < tasks.length - 1}
                />
              ))
            )}
          </View>
        )}

        <View style={{ height: 84 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  scrollContent: {
    paddingBottom: 20
  },
  heroBlock: {
    backgroundColor: colors.surface,
    padding: spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  heroInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  heroName: {
    ...typography.heading2,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  heroMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1
  },
  heroPhone: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1
  },
  actionStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: spacing.xs
  },
  actionRecord: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    paddingVertical: 9,
    borderRadius: radius.pill
  },
  actionRecordText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textWhite,
    marginLeft: 5
  },
  actionCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 9,
    borderRadius: radius.pill
  },
  actionCallText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4
  },
  actionTask: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 9,
    borderRadius: radius.pill
  },
  actionTaskText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 3
  },
  tabScrollWrap: {
    marginVertical: spacing.sm
  },
  tabScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: 8
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  tabPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  tabPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  tabPillTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  overviewSection: {
    paddingHorizontal: spacing.screenPadding
  },
  detailsGroup: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border
  },
  groupHeader: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500'
  },
  listContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginHorizontal: spacing.screenPadding,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl
  }
});
