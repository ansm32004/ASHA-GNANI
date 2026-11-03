import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, Alert } from 'react-native';
import { colors, spacing, typography } from '../../theme';
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
import { requestApi } from '../../services/api/requestApi';
import { SEEDED_TASKS, SEEDED_HOUSEHOLDS } from '../../services/local/mockData';
import { useTranslation } from 'react-i18next';

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

  const loadDashboardData = async () => {
    try {
      const [hhs, tList, reqs] = await Promise.all([
        householdApi.getHouseholds(),
        taskApi.getTasks(),
        requestApi.getRequests()
      ]);
      setHouseholdsCount(hhs.length);
      setTasks(tList);
      const urgentReqs = reqs.filter((r) => r.priority === 'Urgent' && r.status !== 'Resolved');
      setUrgentRequestsCount(urgentReqs.length);
      const completed = tList.filter((t) => t.status === 'Completed').length;
      setCompletedTodayCount(completed);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const pendingFollowups = tasks.filter(
    (t) => t.status === 'Due today' || t.status === 'Upcoming'
  ).length;

  const todaysPriorities = tasks.filter((t) => t.status !== 'Completed').slice(0, 4);

  const displayedTasks = searchQuery.trim()
    ? tasks.filter(
        (t) =>
          (t.household_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.task_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
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
          unreadCount={2}
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

        {/* 5. Upcoming Visit: Prominent blue feature card */}
        <SectionHeader
          title="Upcoming Field Visit"
          actionText="View schedule"
          onAction={() => navigation.navigate('TasksTab')}
        />

        <VisitHighlightCard
          beneficiaryName="Meena Devi"
          householdId="HH-RK-001"
          visitPurpose="Maternal Health (ANC Checkup)"
          scheduledDate="Today, Nov 4"
          scheduledTime="11:30 AM"
          priority="Urgent"
          onPressRecord={() =>
            navigation.navigate('RecordVisit', { preselectedHouseholdId: 'hh_001' })
          }
          onPressReschedule={() => navigation.navigate('TasksTab')}
        />

        {/* 6. Programme Updates: Single teal information card with NHM vector illustration */}
        <SectionHeader
          title="Health Programme Updates"
          actionText="Schemes"
          onAction={() => navigation.navigate('WorkClaims')}
        />

        <IllustrationCard
          badge="National Health Mission"
          title="Janani Suraksha Yojana (JSY)"
          description="Facilitate institutional delivery for registered mothers. ₹1,400 financial assistance directly credited to rural mothers, with ₹600 ASHA incentive."
          actionText="View guidelines"
          onPressAction={() => {
            Alert.alert(
              'Janani Suraksha Yojana (JSY)',
              'Under JSY, institutional delivery at primary health centres entitles rural mothers to ₹1,400 and ASHA incentive of ₹600 for ANC accompaniment.'
            );
          }}
        />

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
                meta={`Due: ${task.due_date} • ${task.village || 'Rampur Kalan'}`}
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
  }
});

export default HomeScreen;
