import { tr } from '../../localisation/tr';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { requestApi } from '../../services/api/requestApi';
import { useAuthStore } from '../../store/authStore';

export const CommunityRemindersScreen = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, dates, requests

  // Selected Request for Detail Modal
  const [selectedRequest, setSelectedRequest] = useState(null);

  // New Request Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCategory, setCreateCategory] = useState('Household visit request');
  const [createBeneficiary, setCreateBeneficiary] = useState('Meena Devi');
  const [createDescription, setCreateDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = async () => {
    try {
      const all = await requestApi.getRequests();
      setRequests(all);
    } catch (e) {
      console.error('Error loading community requests', e);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleCreateRequest = async () => {
    if (!createDescription.trim()) {
      Alert.alert(tr('विवरण आवश्यक है'), tr('कृपया आशा दीदी के लिए अपनी समस्या का विवरण लिखें।'));
      return;
    }

    setIsSubmitting(true);
    try {
      const newReq = await requestApi.createRequest({
        household_id: user?.household_id || 'hh_001',
        beneficiary_name: createBeneficiary,
        category: createCategory,
        description: createDescription.trim(),
        priority: createCategory.includes('Urgent') ? 'Urgent' : 'High'
      });

      setIsSubmitting(false);
      setShowCreateModal(false);
      setCreateDescription('');
      await loadRequests();

      Alert.alert(
        tr('अनुरोध दर्ज हुआ (Request Submitted)'),
        tr('आपका अनुरोध आशा दीदी (सुनीता देवी) को भेज दिया गया है। स्थिति नीचे देखें।'),
        [{ text: tr('ठीक है'), onPress: () => setSelectedRequest(newReq) }]
      );
    } catch (e) {
      setIsSubmitting(false);
      Alert.alert(tr('त्रुटि'), tr('अनुरोध भेजने में समस्या आई। पुनः प्रयास करें।'));
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'resolved':
      case 'completed':
        return { label: 'पूर्ण (Resolved)', bg: '#ECFDF5', text: '#065F46', icon: 'checkmark-circle' };
      case 'scheduled':
        return { label: 'भेंट तय (Scheduled)', bg: '#EAF1FF', text: '#1D4ED8', icon: 'calendar' };
      case 'acknowledged':
        return { label: 'स्वीकृत (Acknowledged)', bg: '#F0FDFA', text: '#0F766E', icon: 'checkbox-outline' };
      case 'in progress':
        return { label: 'प्रगति पर (In Progress)', bg: '#FEF3C7', text: '#92400E', icon: 'time-outline' };
      case 'new':
      default:
        return { label: 'नया (New)', bg: '#FEF3C7', text: '#B45309', icon: 'alert-circle-outline' };
    }
  };

  const UPCOMING_HEALTH_DATES = [
    {
      id: 'anc_visit_1',
      title: 'तृतीय तिमाही प्रसव पूर्व जांच (3rd Trimester ANC)',
      beneficiary: 'मीना देवी (Meena Devi)',
      dateText: 'आज, सुबह 11:30 बजे (Today, 11:30 AM)',
      provider: 'आशा कार्यकर्ता सुनीता देवी द्वारा गृह भेंट',
      details: 'रक्तचाप माप (BP check), वजन, हीमोग्लोबिन स्तर और लाल आयरन की 30 गोलियों का वितरण।',
      priority: 'Urgent',
      accentColor: colors.coral
    },
    {
      id: 'mr_vaccine_2',
      title: 'एमआर-1 खसरा रूबेला टीका (MR-1 Vaccine)',
      beneficiary: 'आरव कुमार (Aarav Kumar - 2 वर्ष)',
      dateText: 'आगामी बुधवार, सुबह 10:00 बजे (VHSND Session)',
      provider: 'प्राथमिक स्वास्थ्य केंद्र / आंगनवाड़ी केंद्र',
      details: 'नियमित टीकाकरण सत्र में विटामिन-ए और खसरा रूबेला की दूसरी खुराक दी जाएगी।',
      priority: 'High',
      accentColor: colors.primary
    },
    {
      id: 'vhsnd_camp_3',
      title: 'पोषण राशन वितरण एवं परामर्श (POSHAN VHSND)',
      beneficiary: 'समस्त परिवार (Family)',
      dateText: '10-11-2026, सुबह 09:30 बजे (10-11-2026)',
      provider: 'आंगनवाड़ी केंद्र, वार्ड 3',
      details: 'गर्भवती महिलाओं और धात्री माताओं के लिए मासिक टेक-होम राशन (THR) वितरण।',
      priority: 'Routine',
      accentColor: colors.teal
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{tr('रिमाइंडर एवं अनुरोध (Reminders)')}</Text>
            <Text style={styles.headerSubtitle}>{tr('आशा कार्यकर्ता सुनीता देवी के साथ लाइव सिंक्रनाइज़ेशन')}</Text>
          </View>
          <TouchableOpacity
            style={styles.newRequestBtn}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
            accessibilityLabel={tr('New Request')}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newRequestText}>{tr('नया अनुरोध')}</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Filters */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'all' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.segmentBtnText, activeTab === 'all' && styles.segmentBtnTextActive]}>{tr('सभी (All)')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'dates' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('dates')}
          >
            <Text style={[styles.segmentBtnText, activeTab === 'dates' && styles.segmentBtnTextActive]}>{tr('स्वास्थ्य तिथियां (')}{tr(UPCOMING_HEALTH_DATES.length)})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'requests' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.segmentBtnText, activeTab === 'requests' && styles.segmentBtnTextActive]}>{tr('आशा अनुरोध (')}{tr(requests.length)})
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 1: Upcoming Clinical Dates */}
        {(activeTab === 'all' || activeTab === 'dates') && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconTitle}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>{tr('आगामी स्वास्थ्य तिथियां (Upcoming Health Dates)')}</Text>
              </View>
            </View>

            {UPCOMING_HEALTH_DATES.map((item) => (
              <View key={item.id} style={[styles.dateCard]}>
                <View style={styles.dateCardHeader}>
                  <View style={styles.beneficiaryBadge}>
                    <Ionicons name="person" size={12} color={colors.primary} />
                    <Text style={styles.beneficiaryText}>{tr(item.beneficiary)}</Text>
                  </View>
                  <Text style={styles.dueTimeText}>{tr(item.dateText)}</Text>
                </View>

                <Text style={styles.dateCardTitle}>{tr(item.title)}</Text>
                <Text style={styles.dateCardDesc}>{tr(item.details)}</Text>

                <View style={styles.providerRow}>
                  <Ionicons name="medkit-outline" size={14} color={colors.teal} />
                  <Text style={styles.providerText}>{tr(item.provider)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 2: Community Requests to ASHA Di */}
        {(activeTab === 'all' || activeTab === 'requests') && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconTitle}>
                <Ionicons name="mail-unread-outline" size={20} color={colors.teal} />
                <Text style={styles.sectionTitle}>{tr('आशा दीदी को भेजे गए अनुरोध (Visit Requests)')}</Text>
              </View>
              <Text style={styles.syncHint}>{tr('लाइव अपडेट')}</Text>
            </View>

            {requests.length > 0 ? (
              requests.map((req) => {
                const badge = getStatusBadge(req.status);
                return (
                  <TouchableOpacity
                    key={req.id}
                    style={styles.requestCard}
                    activeOpacity={0.85}
                    onPress={() => setSelectedRequest(req)}
                  >
                    <View style={styles.requestTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.requestBeneficiary}>
                          {tr(req.beneficiary_name || req.household_name)} • {tr(req.category)}
                        </Text>
                        <Text style={styles.requestTimeText}>{tr('भेजने का समय:')}{' '}{tr(req.time_received || 'हाल ही में')}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Ionicons name={badge.icon} size={13} color={badge.text} />
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                          {tr(badge.label)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.requestDescription} numberOfLines={2}>
                      {tr(req.description)}
                    </Text>

                    {/* Latest Response or scheduled note */}
                    {req.response_history && req.response_history.length > 0 && (
                      <View style={styles.responseBanner}>
                        <Ionicons name="chatbubbles" size={14} color={colors.primary} />
                        <Text style={styles.responseText} numberOfLines={2}>
                          {tr(req.response_history[req.response_history.length - 1])}
                        </Text>
                      </View>
                    )}

                    <View style={styles.requestFooterRow}>
                      <Text style={styles.viewTimelineText}>{tr('विवरण एवं प्रगति देखें')}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="chatbox-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>{tr('कोई सक्रिय अनुरोध नहीं है')}</Text>
                <Text style={styles.emptySub}>{tr('यदि आपको किसी जांच या परामर्श की आवश्यकता है तो \'नया अनुरोध\' दबाएं।')}</Text>
                <TouchableOpacity
                  style={styles.emptyCreateBtn}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Text style={styles.emptyCreateBtnText}>{tr('आशा दीदी को संदेश भेजें')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: Request Details & Progress Timeline */}
      <Modal
        visible={!!selectedRequest}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tr('अनुरोध की स्थिति एवं प्रगति')}</Text>
              <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Status Chip */}
                <View style={styles.modalStatusRow}>
                  {(() => {
                    const badge = getStatusBadge(selectedRequest.status);
                    return (
                      <View style={[styles.modalStatusBadge, { backgroundColor: badge.bg }]}>
                        <Ionicons name={badge.icon} size={16} color={badge.text} />
                        <Text style={[styles.modalStatusText, { color: badge.text }]}>
                          {tr(badge.label)}
                        </Text>
                      </View>
                    );
                  })()}
                  <Text style={styles.modalReqId}>{tr('अनुरोध ID:')}{' '}{tr(selectedRequest.id)}</Text>
                </View>

                {/* Details Card */}
                <View style={styles.modalDetailBox}>
                  <Text style={styles.modalDetailLabel}>{tr('श्रेणी (Category):')}</Text>
                  <Text style={styles.modalDetailVal}>{tr(selectedRequest.category)}</Text>

                  <Text style={[styles.modalDetailLabel, { marginTop: 8 }]}>{tr('लाभार्थी (Beneficiary):')}</Text>
                  <Text style={styles.modalDetailVal}>
                    {tr(selectedRequest.beneficiary_name || selectedRequest.household_name)}
                  </Text>

                  <Text style={[styles.modalDetailLabel, { marginTop: 8 }]}>{tr('अनुरोध विवरण (Message):')}</Text>
                  <Text style={styles.modalDetailDesc}>{tr(selectedRequest.description)}</Text>

                  <Text style={[styles.modalDetailLabel, { marginTop: 8 }]}>{tr('भेजने का समय:')}</Text>
                  <Text style={styles.modalDetailVal}>{tr(selectedRequest.time_received || 'हाल ही में')}</Text>
                </View>

                {/* Response Timeline */}
                <Text style={styles.timelineHeading}>{tr('आशा कार्यकर्ता प्रतिक्रिया एवं प्रगति (Timeline):')}</Text>
                {selectedRequest.response_history && selectedRequest.response_history.length > 0 ? (
                  selectedRequest.response_history.map((step, idx) => (
                    <View key={idx} style={styles.timelineRow}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineTextContainer}>
                        <Text style={styles.timelineText}>{tr(step)}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noTimelineText}>{tr('आशा दीदी को संदेश प्राप्त हो गया है। प्रतिक्रिया प्रतीक्षित है।')}</Text>
                )}

                {/* Assigned ASHA Contact */}
                <View style={styles.ashaCallCard}>
                  <Ionicons name="person-circle" size={32} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.ashaName}>{tr('आशा कार्यकर्ता: सुनीता देवी')}</Text>
                    <Text style={styles.ashaPhone}>{tr('फोन: +91 9876543210 (Rampur SC-04)')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callIconBtn}
                    onPress={() => Alert.alert(tr('कॉल करें'), tr('सुनीता देवी (+91 9876543210) को कॉल मिलाई जा रही है...'))}
                  >
                    <Ionicons name="call" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedRequest(null)}
            >
              <Text style={styles.closeBtnText}>{tr('बंद करें (Close)')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Create New Visit Request */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tr('नया अनुरोध भेजें')}</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{tr('आशा दीदी (सुनीता देवी) से घर आकर मिलने या सलाह का अनुरोध करें।')}</Text>

            {/* Select Beneficiary */}
            <Text style={styles.inputLabel}>{tr('लाभार्थी चुनें:')}</Text>
            <View style={styles.chipsSelectorRow}>
              {['मीना देवी', 'आरव कुमार', 'राजेश कुमार'].map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[styles.selectorChip, createBeneficiary === name && styles.selectorChipActive]}
                  onPress={() => setCreateBeneficiary(name)}
                >
                  <Text style={[styles.selectorChipText, createBeneficiary === name && styles.selectorChipTextActive]}>
                    {tr(name)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Select Category */}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>{tr('अनुरोध का प्रकार:')}</Text>
            <View style={styles.chipsSelectorRow}>
              {[
                'Household visit request',
                'Vaccination information',
                'Urgent health concern',
                'Nutrition advice'
              ].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.selectorChip, createCategory === cat && styles.selectorChipActive]}
                  onPress={() => setCreateCategory(cat)}
                >
                  <Text style={[styles.selectorChipText, createCategory === cat && styles.selectorChipTextActive]}>
                    {tr(cat.replace(' request', ''))}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>{tr('समस्या या संदेश का विवरण:')}</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={createDescription}
              onChangeText={setCreateDescription}
              placeholder={tr('जैसे: मुझे 2 दिन से चक्कर आ रहे हैं, कृपया बीपी की जांच के लिए घर आएं।')}
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.cancelActionBtn}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelActionText}>{tr('रद्द करें')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitActionBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleCreateRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.submitActionText}>{tr('अनुरोध भेजें')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FB'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  headerTitle: {
    ...typography.heading2,
    fontWeight: '600',
    color: colors.primaryText
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2
  },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    ...shadows.subtle
  },
  newRequestText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E8ECF3',
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: 16
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.subtle
  },
  segmentBtnText: {
    ...typography.caption,
    color: colors.secondaryText,
    fontWeight: '600'
  },
  segmentBtnTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  sectionWrapper: {
    marginBottom: 20
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.primaryText,
    fontWeight: '600'
  },
  syncHint: {
    ...typography.caption,
    color: colors.teal,
    fontWeight: '600'
  },
  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    padding: 14,
    marginBottom: 10,
    ...shadows.card
  },
  dateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  beneficiaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  beneficiaryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600'
  },
  dueTimeText: {
    ...typography.caption,
    color: colors.secondaryText,
    fontWeight: '600'
  },
  dateCardTitle: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4
  },
  dateCardDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  providerText: {
    ...typography.caption,
    color: colors.teal,
    fontWeight: '600'
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    padding: 14,
    marginBottom: 10,
    ...shadows.card
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  requestBeneficiary: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.primaryText
  },
  requestTimeText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '600'
  },
  requestDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8
  },
  responseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    marginBottom: 8
  },
  responseText: {
    ...typography.caption,
    color: '#0369A1',
    flex: 1,
    fontWeight: '500'
  },
  requestFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F4FA',
    paddingTop: 8
  },
  viewTimelineText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  emptyTitle: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 10
  },
  emptySub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  emptyCreateBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md
  },
  emptyCreateBtnText: {
    ...typography.button,
    color: '#FFFFFF'
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 24
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    ...typography.heading2,
    fontWeight: '600',
    color: colors.primaryText
  },
  modalSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 14
  },
  modalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  modalStatusText: {
    ...typography.caption,
    fontWeight: '600'
  },
  modalReqId: {
    ...typography.caption,
    color: colors.textMuted
  },
  modalDetailBox: {
    backgroundColor: '#F5F7FB',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    marginBottom: 14
  },
  modalDetailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  modalDetailVal: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 1
  },
  modalDetailDesc: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 20
  },
  timelineHeading: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 8
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ink,
    marginTop: 6
  },
  timelineTextContainer: {
    flex: 1,
    backgroundColor: '#F1F4FA',
    padding: 8,
    borderRadius: radius.sm
  },
  timelineText: {
    ...typography.caption,
    color: colors.textPrimary,
    lineHeight: 18
  },
  noTimelineText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12
  },
  ashaCallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    marginTop: 10,
    marginBottom: 16
  },
  ashaName: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary
  },
  ashaPhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  callIconBtn: {
    backgroundColor: colors.ink,
    width: 36,
    height: 36,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtn: {
    backgroundColor: '#F1F4FA',
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center'
  },
  closeBtnText: {
    ...typography.button,
    color: colors.textPrimary
  },
  inputLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 6
  },
  chipsSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  selectorChip: {
    backgroundColor: '#F1F4FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  selectorChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  selectorChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  selectorChipTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  textArea: {
    backgroundColor: '#F5F7FB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    padding: 12,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    height: 90,
    marginBottom: 16
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12
  },
  cancelActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    alignItems: 'center'
  },
  cancelActionText: {
    ...typography.button,
    color: colors.textSecondary
  },
  submitActionBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.ink,
    paddingVertical: 12,
    borderRadius: radius.md
  },
  submitActionText: {
    ...typography.button,
    color: '#FFFFFF'
  }
});

export default CommunityRemindersScreen;
