import { tr } from '../../localisation/tr';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { MinimalListRow } from '../../components/common/MinimalListRow';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { householdApi } from '../../services/api/householdApi';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/dateUtils';

const VILLAGES = ['All', 'Rampur Kalan', 'Lakshmi Nagar', 'Shanti Kunj', 'Kalyanpur', 'Basti Vikas'];

export const HouseholdListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [households, setHouseholds] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  const loadHouseholds = useCallback(async () => {
    const data = await householdApi.getHouseholds();
    setHouseholds(data);
    setFilteredList(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHouseholds();
    }, [loadHouseholds])
  );

  useEffect(() => {
    let result = [...households];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (h) =>
          h.primary_contact_name.toLowerCase().includes(q) ||
          h.household_id.toLowerCase().includes(q) ||
          (h.members || []).some((m) => m.name.toLowerCase().includes(q))
      );
    }

    if (selectedVillage !== 'All') {
      result = result.filter((h) => h.village.toLowerCase() === selectedVillage.toLowerCase());
    }

    if (selectedPriority !== 'All') {
      result = result.filter(
        (h) => (h.priority || '').toLowerCase() === selectedPriority.toLowerCase()
      );
    }

    setFilteredList(result);
  }, [search, selectedVillage, selectedPriority, households]);

  const getHouseholdCategory = (item) => {
    const mems = item.members || [];
    if (mems.some((m) => m.category === 'Pregnant Woman')) return 'maternal';
    if (mems.some((m) => m.category === 'Infant' || m.category === 'Child')) return 'child';
    if (mems.some((m) => m.is_high_risk)) return 'emergency';
    return 'household';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title="Community Directory"
        subtitle={`${tr(filteredList.length)} ${tr('families assigned')}`}
        showBack={false}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('AddHousehold')}
            style={styles.addBtn}
            accessibilityLabel={tr('Add new household')}
          >
            <Ionicons name="add" size={20} color={colors.textWhite} />
          </TouchableOpacity>
        }
      />

      {/* Search Input */}
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={tr('Search family head, child or ID...')}
        onClear={() => setSearch('')}
      />

      {/* Village Filter Horizontal Scrolling Strip */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {VILLAGES.map((v) => {
            const isSelected = selectedVillage === v;
            return (
              <TouchableOpacity
                key={v}
                onPress={() => setSelectedVillage(v)}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {tr(v)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Priority Filters */}
      <View style={styles.priorityRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.priorityScroll}
        >
          {['All', 'Urgent', 'Priority', 'Routine'].map((p) => {
            const isSelected = selectedPriority === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setSelectedPriority(p)}
                style={[styles.priorityPill, isSelected && styles.priorityPillActive]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.priorityPillText,
                    isSelected && styles.priorityPillTextActive
                  ]}
                >
                  {tr(p)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingState message="Loading directory..." />
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.rowCard}>
              <MinimalListRow
                category={getHouseholdCategory(item)}
                title={item.primary_contact_name}
                subtitle={`${tr(item.household_id)} • ${tr(item.village)} (${tr(item.sub_area || 'Ward 3')})`}
                meta={`${tr((item.members || []).length)} ${tr('members • Last visit:')} ${tr(item.last_visit_date ? formatDate(item.last_visit_date) : 'None')}`}
                priority={item.priority}
                onPress={() => navigation.navigate('HouseholdDetail', { householdId: item.id })}
                showDivider={false}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No households found"
              message="Try adjusting your village filter or search term."
              actionTitle="Reset Filters"
              onAction={() => {
                setSearch('');
                setSelectedVillage('All');
                setSelectedPriority('All');
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterRow: {
    marginVertical: 4
  },
  filterScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: 8
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  filterPillText: {
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: '500'
  },
  filterPillTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  priorityRow: {
    marginVertical: 4
  },
  priorityScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: 6
  },
  priorityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  priorityPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  priorityPillText: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '500'
  },
  priorityPillTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: 110 // Full clearance for bottom navigation
  },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 4,
    overflow: 'hidden',
    ...shadows.subtle
  }
});

export default HouseholdListScreen;
