import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { MinimalListRow } from '../../components/common/MinimalListRow';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { requestApi } from '../../services/api/requestApi';
import { useTranslation } from 'react-i18next';

export const RequestListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  // Selected Request for Action Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionScheduleTime, setActionScheduleTime] = useState('Today, 11:30 AM');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const list = await requestApi.getRequests();
      setRequests(list);
    } catch (e) {
      console.error('Error fetching requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Simulated Call', `Calling beneficiary at +91 ${phone}`);
    });
  };

  const handlePerformAction = async (actionType) => {
    if (!selectedRequest) return;
    setIsProcessingAction(true);
    try {
      let notes = actionNotes.trim();
      if (actionType === 'schedule') {
        notes = `Visit scheduled for ${actionScheduleTime}. ${notes}`.trim();
      } else if (!notes) {
        notes = `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} by ASHA Sunita Devi`;
      }

      await requestApi.actOnRequest(selectedRequest.id, actionType, notes);
      setIsProcessingAction(false);
      setSelectedRequest(null);
      setActionNotes('');
      await loadRequests();
      Alert.alert(
        'Action Recorded',
        `Request status updated to "${actionType === 'schedule' ? 'Scheduled' : actionType}". Synchronized with community member.`
      );
    } catch (e) {
      setIsProcessingAction(false);
      Alert.alert('Error', 'Could not update request action.');
    }
  };

  const filterTabs = ['All', 'New', 'Acknowledged', 'Scheduled', 'In progress', 'Resolved'];

  const filtered = requests.filter((r) => {
    if (activeTab === 'All') return true;
    return (r.status || '').toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title={t('requests.title') || 'Community Requests'}
        subtitle={`${filtered.length} requests in coverage area`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterTabs.map((tab) => {
            const isSelected = activeTab === tab;
            const count = requests.filter((r) =>
              tab === 'All' ? true : (r.status || '').toLowerCase() === tab.toLowerCase()
            ).length;

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {tab}
                </Text>
                <View style={[styles.pillBadge, isSelected && styles.pillBadgeActive]}>
                  <Text style={[styles.pillBadgeText, isSelected && styles.pillBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingState message={t('common.loading')} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MinimalListRow
              category={item.category}
              title={`${item.household_name} • ${item.beneficiary_name || item.category}`}
              subtitle={item.description}
              meta={`Received: ${item.time_received} • ${item.village || 'Rampur Kalan'}${item.preferred_date ? ` • Date: ${item.preferred_date}` : ''}`}
              priority={item.priority}
              status={item.status}
              showDivider={index < filtered.length - 1}
              onPress={() => setSelectedRequest(item)}
              rightAction={
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => handleCall(item.contact_number)}
                    style={styles.callBtn}
                    accessibilityLabel="Call"
                  >
                    <Ionicons name="call" size={13} color={colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedRequest(item)}
                    style={styles.actionOpenBtn}
                  >
                    <Text style={styles.actionOpenText}>Review</Text>
                    <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No Community Requests"
              message="No requests currently matching this filter status."
            />
          }
        />
      )}

      {/* MODAL: Request Details & Action Confirmation */}
      <Modal
        visible={!!selectedRequest}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Details & Response</Text>
                <Text style={styles.modalSubtitle}>ID: {selectedRequest?.id} • Synchronized with Family</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Beneficiary Header */}
                <View style={styles.detailHeaderCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailHhName}>{selectedRequest.household_name}</Text>
                    <Text style={styles.detailBenName}>
                      Beneficiary: {selectedRequest.beneficiary_name || 'Family Member'}
                    </Text>
                    <Text style={styles.detailMeta}>
                      {selectedRequest.village} • Contact: +91 {selectedRequest.contact_number}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailCallBtn}
                    onPress={() => handleCall(selectedRequest.contact_number)}
                  >
                    <Ionicons name="call" size={16} color="#FFFFFF" />
                    <Text style={styles.detailCallText}>Call</Text>
                  </TouchableOpacity>
                </View>

                {/* Request Content */}
                <View style={styles.detailBody}>
                  <Text style={styles.detailCategoryTag}>{selectedRequest.category}</Text>
                  <Text style={styles.detailDescription}>{selectedRequest.description}</Text>
                  {selectedRequest.preferred_date ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' }}>
                      <Ionicons name="calendar" size={13} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                        Preferred Call / Visit Date: {selectedRequest.preferred_date}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.detailTimeReceived}>Time Received: {selectedRequest.time_received}</Text>
                </View>

                {/* Response History */}
                <Text style={styles.historyHeading}>Update & Audit History:</Text>
                {selectedRequest.response_history && selectedRequest.response_history.length > 0 ? (
                  selectedRequest.response_history.map((hist, idx) => (
                    <View key={idx} style={styles.historyRow}>
                      <View style={styles.historyDot} />
                      <Text style={styles.historyText}>{hist}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noHistoryText}>No responses logged yet.</Text>
                )}

                {/* Action Controls Section */}
                <View style={styles.actionControlsBox}>
                  <Text style={styles.actionControlsHeading}>Take ASHA Action:</Text>

                  {/* Schedule visit time selector if scheduling */}
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Visit Schedule:</Text>
                    <TextInput
                      style={styles.scheduleInput}
                      value={actionScheduleTime}
                      onChangeText={setActionScheduleTime}
                      placeholder="e.g. Today, 11:30 AM"
                    />
                  </View>

                  <TextInput
                    style={styles.notesInput}
                    placeholder="Optional notes for household..."
                    placeholderTextColor={colors.textMuted}
                    value={actionNotes}
                    onChangeText={setActionNotes}
                  />

                  {/* Primary Action Buttons */}
                  <View style={styles.buttonActionGrid}>
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: '#F0FDFA', borderColor: colors.teal }]}
                      onPress={() => handlePerformAction('acknowledge')}
                      disabled={isProcessingAction}
                    >
                      <Ionicons name="checkbox-outline" size={16} color={colors.teal} />
                      <Text style={[styles.btnActionText, { color: colors.teal }]}>Acknowledge</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                      onPress={() => handlePerformAction('schedule')}
                      disabled={isProcessingAction}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Text style={[styles.btnActionText, { color: colors.primary }]}>Schedule Visit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}
                      onPress={() => handlePerformAction('resolve')}
                      disabled={isProcessingAction}
                    >
                      <Ionicons name="checkmark-done" size={16} color="#059669" />
                      <Text style={[styles.btnActionText, { color: '#059669' }]}>Resolve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedRequest(null)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
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
  filterRow: {
    marginVertical: spacing.xs
  },
  filterScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: 8
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
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
  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    marginRight: 6
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary
  },
  pillBadgeActive: {
    backgroundColor: 'rgba(36, 120, 208, 0.15)'
  },
  pillBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary
  },
  pillBadgeTextActive: {
    color: colors.primary
  },
  listContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.sm,
    paddingBottom: 110,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  callBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    gap: 2
  },
  actionOpenText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    paddingBottom: 30
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  modalTitle: {
    ...typography.heading3,
    fontWeight: '700',
    color: colors.primaryText
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  detailHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12
  },
  detailHhName: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.primaryText
  },
  detailBenName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1
  },
  detailMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  detailCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  detailCallText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  detailBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12
  },
  detailCategoryTag: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4
  },
  detailDescription: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 6
  },
  detailTimeReceived: {
    ...typography.caption,
    color: colors.textMuted
  },
  historyHeading: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 6
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6
  },
  historyText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18
  },
  noHistoryText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8
  },
  actionControlsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 14
  },
  actionControlsHeading: {
    ...typography.label,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 8
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  scheduleLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary
  },
  scheduleInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...typography.caption,
    color: colors.textPrimary
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...typography.caption,
    color: colors.textPrimary,
    marginBottom: 10
  },
  buttonActionGrid: {
    flexDirection: 'row',
    gap: 8
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1
  },
  btnActionText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center'
  },
  closeBtnText: {
    ...typography.button,
    color: colors.textPrimary
  }
});

export default RequestListScreen;
