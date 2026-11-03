import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, shadows, spacing } from '../../theme';
import { requestApi } from '../../services/api/requestApi';

export const MemberHealthDetailScreen = ({ route, navigation }) => {
  const member = route.params?.member || {
    id: 'mem_001_1',
    name: 'Meena Devi',
    relation: 'Self',
    age: 24,
    gender: 'Female',
    category: 'Pregnant Woman',
    status: '3rd Trimester (32 wks)',
    abha_id: '91-4521-8834-0192',
    blood_group: 'B+',
    rch_id: 'RCH-UP-2026-89102',
    vitals: [
      { date: '28 Oct 2026', bp: '118/76 mmHg', weight: '54 kg', hb: '9.2 g/dL' },
      { date: '14 Sep 2026', bp: '114/72 mmHg', weight: '52 kg', hb: '9.5 g/dL' }
    ],
    immunizations: [
      { vaccine: 'TT-1 (Tetanus Toxoid)', date: '14 Sep 2026', status: 'Given' },
      { vaccine: 'TT-2 Booster', date: '12 Nov 2026', status: 'Due Soon' }
    ],
    schemes: [
      'प्रधानमंत्री मातृ वंदना योजना (PMMVY)',
      'जननी सुरक्षा योजना (JSY)',
      'आयुष्मान भारत (PM-JAY)'
    ],
    doctor_notes: 'Mild anaemia noted (Hb 9.2 g/dL). Prescribed 100 IFA tablets and nutrition counseling.'
  };

  const [activeTab, setActiveTab] = useState('overview'); // overview, vitals, vaccines, schemes
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestText, setRequestText] = useState(`कृपया ${member.name} की स्वास्थ्य जांच हेतु गृह भेंट करें।`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendVisitRequest = async () => {
    if (!requestText.trim()) {
      Alert.alert('त्रुटि', 'कृपया संदेश लिखें।');
      return;
    }
    setIsSubmitting(true);
    try {
      await requestApi.createRequest({
        household_id: 'hh_001',
        beneficiary_name: member.name,
        category: 'Household visit request',
        description: requestText,
        priority: member.category === 'Pregnant Woman' ? 'Urgent' : 'Medium'
      });
      setIsSubmitting(false);
      setShowRequestModal(false);
      Alert.alert(
        'अनुरोध दर्ज हुआ (Request Submitted)',
        `${member.name} की जांच के लिए आशा दीदी (सुनीता देवी) को अनुरोध भेज दिया गया है।`,
        [{ text: 'ठीक है', onPress: () => navigation.navigate('RemindersTab') }]
      );
    } catch (e) {
      setIsSubmitting(false);
      Alert.alert('त्रुटि', 'अनुरोध भेजने में समस्या आई। पुनः प्रयास करें।');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{member.name} का स्वास्थ्य रिकॉर्ड</Text>
        <TouchableOpacity
          onPress={() => setShowRequestModal(true)}
          style={styles.headerActionBtn}
          accessibilityLabel="Request visit"
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.headerActionText}>जांच मांगें</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Digital ABHA Card Banner */}
        <View style={styles.abhaCard}>
          <View style={styles.abhaTopRow}>
            <View style={styles.flagBadge}>
              <Text style={styles.flagText}>भारत सरकार • National Health Authority</Text>
            </View>
            <View style={styles.verifiedChip}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.verifiedText}>सत्यापित ABHA</Text>
            </View>
          </View>

          <View style={styles.abhaMainRow}>
            <View style={styles.avatarBox}>
              <Ionicons
                name={member.gender === 'Female' ? 'person' : 'person'}
                size={36}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.abhaInfo}>
              <Text style={styles.abhaName}>{member.name}</Text>
              <Text style={styles.abhaSub}>
                {member.relation} • {member.age} वर्ष • {member.gender}
              </Text>
              <Text style={styles.abhaIdText}>ABHA: {member.abha_id || '91-4521-8834-0192'}</Text>
            </View>
          </View>

          <View style={styles.abhaBottomRow}>
            <View>
              <Text style={styles.metaLabel}>ब्लड ग्रुप</Text>
              <Text style={styles.metaValue}>{member.blood_group || 'B+'}</Text>
            </View>
            {member.rch_id && (
              <View>
                <Text style={styles.metaLabel}>RCH ID</Text>
                <Text style={styles.metaValue}>{member.rch_id}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => Alert.alert('ABHA कार्ड डाउनलोड', 'डिजिटल ABHA कार्ड आपके फोन में सुरक्षित रूप से डाउनलोड हो गया है।')}
            >
              <Ionicons name="download-outline" size={14} color="#FFFFFF" />
              <Text style={styles.downloadText}>डाउनलोड</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Filter / Tab Bar */}
        <View style={styles.tabContainer}>
          {[
            { id: 'overview', label: 'सारांश (Overview)' },
            { id: 'vitals', label: 'वाइटल्स (Vitals)' },
            { id: 'vaccines', label: 'टीके (Vaccines)' },
            { id: 'schemes', label: 'योजनाएं (Schemes)' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabButtonText, activeTab === tab.id && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content: Overview */}
        {activeTab === 'overview' && (
          <View>
            {/* Category / Status Banner */}
            <View style={styles.statusBanner}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusCategory}>{member.category}</Text>
                <Text style={styles.statusSub}>{member.status || 'नियमित स्वास्थ्य निगरानी सक्रिय'}</Text>
              </View>
            </View>

            {/* Doctor & ASHA Field Notes */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>स्वास्थ्य परामर्श एवं टिप्पणी</Text>
              </View>
              <Text style={styles.notesText}>
                {member.doctor_notes || 'सभी स्वास्थ्य मानक सामान्य स्तर पर हैं। नियमित भोजन व पानी का ध्यान रखें।'}
              </Text>
              <View style={styles.doctorBadge}>
                <Ionicons name="medkit-outline" size={14} color={colors.teal} />
                <Text style={styles.doctorBadgeText}>PHC काशी • डॉ. आर. के. श्रीवास्तव</Text>
              </View>
            </View>

            {/* Quick Action Button */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => setShowRequestModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar" size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>{member.name} के लिए आशा भेंट मांगें</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Content: Vitals */}
        {activeTab === 'vitals' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>शारीरिक जांच इतिहास (Vitals History)</Text>
            {(member.vitals || [
              { date: '28 Oct 2026', bp: '118/76 mmHg', weight: '54 kg', hb: '9.2 g/dL' }
            ]).map((v, i) => (
              <View key={i} style={styles.vitalCard}>
                <View style={styles.vitalDateRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.vitalDate}>{v.date}</Text>
                  <Text style={styles.vitalBy}>जांचकर्ता: आशा सुनीता देवी</Text>
                </View>
                <View style={styles.vitalGrid}>
                  <View style={styles.vitalMetric}>
                    <Text style={styles.vitalLabel}>रक्तचाप (BP)</Text>
                    <Text style={styles.vitalValue}>{v.bp}</Text>
                  </View>
                  <View style={styles.vitalMetric}>
                    <Text style={styles.vitalLabel}>वजन (Weight)</Text>
                    <Text style={styles.vitalValue}>{v.weight}</Text>
                  </View>
                  {v.hb && (
                    <View style={styles.vitalMetric}>
                      <Text style={styles.vitalLabel}>हीमोग्लोबिन (Hb)</Text>
                      <Text style={[styles.vitalValue, { color: colors.danger }]}>{v.hb}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab Content: Vaccines */}
        {activeTab === 'vaccines' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>टीकाकरण स्थिति (Immunization)</Text>
            {(member.immunizations || [
              { vaccine: 'TT-1 (Tetanus Toxoid)', date: '14 Sep 2026', status: 'Given' },
              { vaccine: 'TT-2 Booster', date: '12 Nov 2026', status: 'Due Soon' }
            ]).map((vac, i) => (
              <View key={i} style={styles.vaccineRow}>
                <View style={[styles.vaccineDot, { backgroundColor: vac.status === 'Given' ? colors.teal : colors.warning }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.vaccineName}>{vac.vaccine}</Text>
                  <Text style={styles.vaccineDate}>तारीख: {vac.date}</Text>
                </View>
                <View style={[styles.vaccineBadge, { backgroundColor: vac.status === 'Given' ? '#ECFDF5' : '#FEF3C7' }]}>
                  <Text style={[styles.vaccineBadgeText, { color: vac.status === 'Given' ? '#065F46' : '#92400E' }]}>
                    {vac.status === 'Given' ? 'लगाया गया' : 'देय (Due)'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab Content: Schemes */}
        {activeTab === 'schemes' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>नामित सरकारी स्वास्थ्य योजनाएं</Text>
            {(member.schemes || ['आयुष्मान भारत (PM-JAY)']).map((scheme, i) => (
              <View key={i} style={styles.schemeItem}>
                <Ionicons name="ribbon" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.schemeItemTitle}>{scheme}</Text>
                  <Text style={styles.schemeItemSub}>सक्रिय लाभार्थी • 100% निःशुल्क चिकित्सा सुविधा</Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal: Request Visit for this Member */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>गृह भेंट का अनुरोध</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              लाभार्थी: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{member.name}</Text> ({member.relation})
            </Text>

            <Text style={styles.modalLabel}>संदेश / समस्या का विवरण:</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={requestText}
              onChangeText={setRequestText}
              placeholder="आशा दीदी को अपनी समस्या बताएं..."
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowRequestModal(false)}
              >
                <Text style={styles.cancelBtnText}>रद्द करें</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSendVisitRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>अनुरोध भेजें</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: 8
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  headerActionText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110
  },
  abhaCard: {
    backgroundColor: '#0F172A',
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 16,
    ...shadows.card
  },
  abhaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 10
  },
  flagBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm
  },
  flagText: {
    ...typography.caption,
    color: '#94A3B8',
    fontSize: 10
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  verifiedText: {
    ...typography.caption,
    color: '#34D399',
    fontWeight: '700',
    fontSize: 10
  },
  abhaMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  },
  abhaInfo: {
    flex: 1
  },
  abhaName: {
    ...typography.heading2,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  abhaSub: {
    ...typography.bodySmall,
    color: '#94A3B8',
    marginTop: 2
  },
  abhaIdText: {
    ...typography.caption,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1
  },
  abhaBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 12
  },
  metaLabel: {
    ...typography.caption,
    color: '#64748B',
    fontSize: 10
  },
  metaValue: {
    ...typography.bodySmall,
    color: '#F1F5F9',
    fontWeight: '700'
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm
  },
  downloadText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: 16
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.subtle
  },
  tabButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  statusCategory: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '700'
  },
  statusSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.subtle
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 12
  },
  notesText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12
  },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    padding: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CCFBF1'
  },
  doctorBadgeText: {
    ...typography.caption,
    color: colors.teal,
    fontWeight: '600'
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: 8
  },
  primaryActionText: {
    ...typography.button,
    color: '#FFFFFF'
  },
  vitalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  vitalDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6
  },
  vitalDate: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  vitalBy: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 'auto'
  },
  vitalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4
  },
  vitalMetric: {
    alignItems: 'center'
  },
  vitalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10
  },
  vitalValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 2
  },
  vaccineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  vaccineDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  vaccineName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  vaccineDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  vaccineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  vaccineBadgeText: {
    ...typography.caption,
    fontWeight: '700'
  },
  schemeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  schemeItemTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  schemeItemSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
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
    marginBottom: 6
  },
  modalTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  modalSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 14
  },
  modalLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: 6
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 16
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    ...typography.button,
    color: colors.textSecondary
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md
  },
  submitBtnText: {
    ...typography.button,
    color: '#FFFFFF'
  }
});

export default MemberHealthDetailScreen;
