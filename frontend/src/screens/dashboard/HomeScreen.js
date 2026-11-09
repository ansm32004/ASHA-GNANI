import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { CategoryScroller } from '../../components/common/CategoryScroller';
import { CompactMetric } from '../../components/common/CompactMetric';
import { VisitHighlightCard } from '../../components/common/VisitHighlightCard';
import { IllustrationCard } from '../../components/common/IllustrationCard';
import { SectionHeader } from '../../components/common/SectionHeader';
import { MinimalListRow } from '../../components/common/MinimalListRow';
import { useAuthStore } from '../../store/authStore';
import { householdApi } from '../../services/api/householdApi';
import { taskApi } from '../../services/api/taskApi';
import { visitApi } from '../../services/api/visitApi';
import { requestApi } from '../../services/api/requestApi';
import { notificationApi } from '../../services/api/notificationApi';
import { SEEDED_TASKS, SEEDED_HOUSEHOLDS } from '../../services/local/mockData';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/dateUtils';

export const HomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [householdsCount, setHouseholdsCount] = useState(SEEDED_HOUSEHOLDS.length);
  const [tasks, setTasks] = useState(SEEDED_TASKS);
  const [urgentRequestsCount, setUrgentRequestsCount] = useState(1);
  const [completedTodayCount, setCompletedTodayCount] = useState(1);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(2);

  const loadDashboardData = async () => {
    try {
      const [hhs, tList, reqs, vList, notifs] = await Promise.all([
        householdApi.getHouseholds().catch(() => SEEDED_HOUSEHOLDS),
        taskApi.getTasks().catch(() => SEEDED_TASKS),
        requestApi.getRequests().catch(() => []),
        visitApi.getVisits().catch(() => []),
        notificationApi.getNotifications().catch(() => [])
      ]);
      const validHhs = Array.isArray(hhs) ? hhs : SEEDED_HOUSEHOLDS;
      setHouseholdsCount(validHhs.length);

      const validTasks = Array.isArray(tList) ? tList : SEEDED_TASKS;
      setTasks(validTasks);

      const validReqs = Array.isArray(reqs) ? reqs : [];
      const pendingReqs = validReqs.filter((r) => r && r.status !== 'Resolved');
      setUrgentRequestsCount(pendingReqs.length);

      const validNotifs = Array.isArray(notifs) ? notifs : [];
      const unreadCount = validNotifs.filter((n) => n && !n.is_read).length;
      setUnreadNotifsCount(unreadCount);

      // Track confirmed visits count
      const validVisits = Array.isArray(vList) ? vList : [];
      const confirmedVisits = validVisits.filter((v) => v && (v.status === 'Confirmed' || v.status === 'Completed'));
      const completedTasks = validTasks.filter((t) => t && t.status === 'Completed').length;
      setCompletedTodayCount(Math.max(completedTasks, confirmedVisits.length, 1));
    } catch (e) {
      console.error('Error loading dashboard data', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'households') {
      navigation.navigate('CommunityTab');
    } else if (categoryId === 'followups' || categoryId === 'vaccination') {
      navigation.navigate('TasksTab');
    } else if (categoryId === 'requests') {
      navigation.navigate('CommunityRequests');
    } else if (categoryId === 'claims') {
      navigation.navigate('WorkClaims');
    }
  };

  const safeTasks = React.useMemo(() => {
    const list = Array.isArray(tasks) ? [...tasks] : [...SEEDED_TASKS];
    list.sort((a, b) => {
      const isReqA = (a.created_from || '').includes('Request') || (a.task_type || '').includes('Requested');
      const isReqB = (b.created_from || '').includes('Request') || (b.task_type || '').includes('Requested');
      if (isReqA && !isReqB) return -1;
      if (!isReqA && isReqB) return 1;
      if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
      if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
      return 0;
    });
    return list;
  }, [tasks]);

  const pendingFollowups = safeTasks.filter(
    (t) => t && (t.status === 'Due today' || t.status === 'Upcoming')
  ).length;

  const todaysPriorities = safeTasks.filter((t) => t && t.status !== 'Completed').slice(0, 4);

  const displayedTasks = searchQuery.trim()
    ? safeTasks.filter(
        (t) =>
          t &&
          ((t.household_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.task_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : todaysPriorities;

  const overviewMetrics = [
    {
      label: 'Households',
      value: householdsCount,
      dotColor: colors.primary,
      onPress: () => navigation.navigate('CommunityTab')
    },
    {
      label: 'Visits Done',
      value: completedTodayCount,
      dotColor: colors.teal,
      onPress: () => navigation.navigate('TasksTab')
    },
    {
      label: 'Follow-ups',
      value: pendingFollowups,
      dotColor: colors.yellow,
      onPress: () => navigation.navigate('TasksTab')
    },
    {
      label: 'Requests',
      value: urgentRequestsCount,
      dotColor: colors.danger,
      onPress: () => navigation.navigate('CommunityRequests')
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* 1. Header: Worker Profile, Language Toggle, Notification Badge */}
        <MinimalHeader
          workerName={user?.name ? user.name.split(' ')[0] : 'Sunita'}
          subtitle="Ready for your visits today?"
          unreadCount={unreadNotifsCount}
          currentLanguage={i18n.language}
          onPressLanguage={handleLanguageToggle}
          onPressProfile={() => navigation.navigate('ProfileTab')}
          onPressNotification={() => navigation.navigate('Notifications')}
        />

        {/* 2. Minimal rounded search input */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search households, beneficiaries or tasks..."
          onClear={() => setSearchQuery('')}
        />

        {/* 3. Horizontal category navigation with custom 2D vector icons */}
        <CategoryScroller
          selectedId={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* 4. Today's Overview: Compact metric layout (glanceable field stats) */}
        <CompactMetric items={overviewMetrics} />

        {/* 5. Upcoming Visit: Dynamic next scheduled visit or completed banner */}
        <SectionHeader
          title="Upcoming Field Visit"
          actionText="View schedule"
          onAction={() => navigation.navigate('TasksTab')}
        />

        {(() => {
          const upcomingTask = safeTasks.find(
            (t) => t && (t.status === 'Due today' || t.status === 'Upcoming' || t.status === 'Overdue')
          );

          if (upcomingTask) {
            return (
              <VisitHighlightCard
                beneficiaryName={upcomingTask.beneficiary_name || upcomingTask.household_name || 'Meena Devi'}
                householdId={
                  upcomingTask.household_code ||
                  (upcomingTask.household_id?.startsWith('hh_')
                    ? `HH-RK-${upcomingTask.household_id.slice(-3)}`
                    : upcomingTask.household_id) ||
                  'HH-RK-001'
                }
                visitPurpose={upcomingTask.task_type || 'Maternal Health (ANC Checkup)'}
                scheduledDate={formatDate(upcomingTask.due_date) || 'Today'}
                scheduledTime="11:30 AM"
                priority={upcomingTask.priority || 'Urgent'}
                onPressRecord={() =>
                  navigation.navigate('RecordVisit', {
                    preselectedHouseholdId: upcomingTask.household_id || 'hh_001'
                  })
                }
                onPressReschedule={() => navigation.navigate('TasksTab')}
              />
            );
          }

          return (
            <View style={styles.allDoneCard}>
              <View style={styles.allDoneIconWrap}>
                <Ionicons name="checkmark-circle" size={28} color={colors.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.allDoneTitle}>All Field Visits Completed!</Text>
                <Text style={styles.allDoneSub}>
                  Great work! You have completed all scheduled field visits. Tap to log an unscheduled visit.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.allDoneRecordBtn}
                onPress={() => navigation.navigate('RecordVisit')}
              >
                <Ionicons name="mic" size={14} color="#FFFFFF" />
                <Text style={styles.allDoneRecordText}>Record</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* 6. My Incentives & Earnings Section */}
        <SectionHeader
          title="My Incentives & Earnings"
          subtitle="Track your hard work. Know what you've earned."
          actionText="View all"
          onAction={() => navigation.navigate('MyIncentives')}
        />

        <TouchableOpacity
          style={styles.incentivesCard}
          onPress={() => navigation.navigate('MyIncentives')}
          activeOpacity={0.88}
          accessibilityLabel="My Incentives & Earnings"
        >
          <View style={styles.incentivesTopRow}>
            <View style={styles.incentivesIconWrap}>
              <Ionicons name="cash" size={24} color={colors.primary} />
            </View>
            <View style={styles.incentivesBadge}>
              <Text style={styles.incentivesBadgeText}>NHM Guidelines</Text>
            </View>
          </View>

          <Text style={styles.incentivesHeading}>Your hard work deserves recognition</Text>
          <Text style={styles.incentivesText}>
            Track your eligible incentives, check pending claims and keep your earnings organised.
          </Text>

          <TouchableOpacity
            style={styles.incentivesCtaRow}
            onPress={() => navigation.navigate('MyIncentives')}
            activeOpacity={0.7}
            accessibilityLabel="View My Earnings"
          >
            <Text style={styles.incentivesCtaText}>View My Earnings</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.primaryDark} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* 7. Pending Follow-ups: Clean list rows */}
        <SectionHeader
          title={searchQuery.trim() ? `Search Results (${displayedTasks.length})` : 'Pending Follow-ups'}
          subtitle={
            searchQuery.trim()
              ? `Matching "${searchQuery}"`
              : 'Priority visits needing attention'
          }
          actionText={searchQuery.trim() ? 'Clear' : 'See all'}
          onAction={() => {
            if (searchQuery.trim()) setSearchQuery('');
            else navigation.navigate('TasksTab');
          }}
        />

        <View style={styles.followupList}>
          {displayedTasks.map((task) => {
            const hhName = task.household_name || 'Household';
            const benName = task.beneficiary_name;
            const displayTitle = (!benName || hhName.toLowerCase().includes(benName.toLowerCase()))
              ? `${hhName} • ${task.task_type || 'Follow-up'}`
              : `${hhName} • ${benName}`;

            return (
              <MinimalListRow
                key={task.id}
                category={task.task_type}
                title={displayTitle}
                subtitle={task.description}
                meta={`Due: ${formatDate(task.due_date)} • ${task.village || 'Rampur Kalan'}`}
                priority={task.priority}
                status={task.status}
                onPress={() => navigation.navigate('TasksTab')}
              />
            );
          })}
        </View>

        {/* Bottom space so content is never obscured by floating bottom bar */}
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    paddingBottom: 20
  },
  followupList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: spacing.screenHorizontal,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  allDoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: spacing.screenHorizontal,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.base
  },
  allDoneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  allDoneTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary
  },
  allDoneSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  allDoneRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginLeft: 8,
    gap: 4
  },
  allDoneRecordText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  incentivesCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: spacing.screenHorizontal,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    ...shadows.subtle
  },
  incentivesTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  incentivesIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  incentivesBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border
  },
  incentivesBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary
  },
  incentivesHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4
  },
  incentivesText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12
  },
  incentivesCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill
  },
  incentivesCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark
  }
});

export default HomeScreen;
