import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MaternalHero, ChildHealthIllustration } from '../../components/illustrations';
import { AvatarImage } from '../../components/common/AvatarImage';
import { useAuthStore } from '../../store/authStore';

export const CommunityFamilyScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const members = user?.family_members || [
    {
      id: 'mem_001_1',
      name: 'Meena Devi',
      relation: 'Self',
      age: 24,
      gender: 'Female',
      category: 'Pregnant Woman',
      status: '3rd Trimester (32 wks)',
      next_checkup: 'Today, 11:30 AM',
      abha_id: '91-4521-8834-0192',
      blood_group: 'B+',
      rch_id: 'RCH-UP-2026-89102',
      vitals: [
        { date: '28-10-2026', bp: '118/76 mmHg', weight: '54 kg', hb: '9.2 g/dL' },
        { date: '14-09-2026', bp: '114/72 mmHg', weight: '52 kg', hb: '9.5 g/dL' }
      ],
      immunizations: [
        { vaccine: 'TT-1 (Tetanus Toxoid)', date: '14-09-2026', status: 'Given' },
        { vaccine: 'TT-2 Booster', date: '12-11-2026', status: 'Due Soon' }
      ],
      schemes: [
        'प्रधानमंत्री मातृ वंदना योजना (PMMVY)',
        'जननी सुरक्षा योजना (JSY)',
        'आयुष्मान भारत (PM-JAY)'
      ],
      doctor_notes: 'Mild anaemia noted (Hb 9.2 g/dL). Prescribed 100 IFA tablets and nutrition counseling.'
    },
    {
      id: 'mem_001_2',
      name: 'Rajesh Kumar',
      relation: 'Husband',
      age: 28,
      gender: 'Male',
      category: 'Adult',
      status: 'Healthy',
      abha_id: '91-4521-8834-0193',
      blood_group: 'O+',
      vitals: [
        { date: '10-08-2026', bp: '122/80 mmHg', weight: '68 kg', hb: '13.8 g/dL' }
      ],
      immunizations: [
        { vaccine: 'COVID-19 Precaution Dose', date: '12-04-2025', status: 'Given' }
      ],
      schemes: [
        'आयुष्मान भारत (PM-JAY)',
        'PM किसान सम्मान निधि'
      ],
      doctor_notes: 'Routine adult checkup normal. Non-smoker, active lifestyle.'
    },
    {
      id: 'mem_001_3',
      name: 'Aarav Kumar',
      relation: 'Son',
      age: 2,
      gender: 'Male',
      category: 'Child (1-5)',
      next_vaccine: 'DPT Booster 1 Due',
      abha_id: '91-4521-8834-0194',
      blood_group: 'B+',
      rch_id: 'RCH-UP-2024-11029',
      vitals: [
        { date: '20-07-2026', bp: 'Normal', weight: '11.8 kg', height: '86 cm' }
      ],
      immunizations: [
        { vaccine: 'BCG', date: '02-08-2024', status: 'Given' },
        { vaccine: 'Pentavalent 1, 2, 3', date: '10-12-2024', status: 'Given' },
        { vaccine: 'MR-1 (9 mo)', date: '15-05-2025', status: 'Given' },
        { vaccine: 'DPT Booster 1', date: '06-11-2026', status: 'Due Soon' }
      ],
      schemes: [
        'मिशन इंद्रधनुष (Mission Indradhanush)',
        'पोषण अभियान राशन योजना'
      ],
      doctor_notes: 'Child development normal. MCP card green zone confirmed.'
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Family Health</Text>
          <Text style={styles.headerSubtitle}>
            Household {user?.household_code || 'HH-RK-001'} • {user?.village_name || 'Rampur Kalan'}
          </Text>
        </View>

        {/* Digital Health Identity Card with High-Contrast Navy & Verified Badging */}
        <View style={styles.idCard}>
          <View style={styles.idCardTop}>
            <View style={styles.flagDot} />
            <Text style={styles.idCardScheme}>National Health Authority • Govt of India</Text>
            <View style={styles.verifiedChip}>
              <Ionicons name="checkmark-circle" size={12} color="#34D399" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.headName}>{user?.name || 'Meena Devi'}</Text>
          <Text style={styles.idNumber}>ABHA: 91-4521-8834-0192 • HH-RK-001</Text>
          <View style={styles.idCardFooter}>
            <Ionicons name="person-circle-outline" size={16} color="#B8D5F6" />
            <Text style={styles.idCardFooterText}>Assigned ASHA: Sunita Devi (+91 9876543210)</Text>
          </View>
        </View>

        {/* Family Members List */}
        <Text style={styles.sectionTitle}>Registered Family Members ({members.length})</Text>

        {members.map((member) => {
          const isMother = member.category === 'Pregnant Woman';
          const isChild = member.category.includes('Child');
          return (
            <TouchableOpacity
              key={member.id}
              style={styles.memberCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MemberHealthDetail', { member })}
            >
              <View style={styles.memberCardHeader}>
                <AvatarImage
                  name={member.name}
                  role={member.category}
                  size={46}
                  showBorder
                  borderColor={colors.border}
                  style={{ marginRight: 12 }}
                />

                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View style={[styles.badge, isMother && { backgroundColor: colors.coralLight }]}>
                      <Text style={[styles.badgeText, isMother && { color: colors.coral }]}>
                        {member.relation}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.memberMeta}>
                    {member.age} yrs • {member.gender} • {member.category}
                  </Text>
                  {member.status ? (
                    <Text style={styles.memberStatusText}>Status: {member.status}</Text>
                  ) : null}
                  {member.next_checkup ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Ionicons name="calendar-outline" size={12} color={colors.teal} style={{ marginRight: 4 }} />
                      <Text style={styles.memberActionNote}>Next Checkup: {member.next_checkup}</Text>
                    </View>
                  ) : null}
                  {member.next_vaccine ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Ionicons name="shield-checkmark-outline" size={12} color={colors.teal} style={{ marginRight: 4 }} />
                      <Text style={styles.memberActionNote}>Vaccine Due: {member.next_vaccine}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.cardActionBtn}>
                <Text style={styles.cardActionBtnText}>View Health History & ABHA</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Privacy Note */}
        <View style={styles.privacyNotice}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.teal} />
          <Text style={styles.privacyText}>
            Your family health records are encrypted under Ayushman Bharat Digital Mission (ABDM) standards and strictly accessible only to your assigned ASHA worker and PHC.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.base,
    paddingBottom: 110
  },
  header: {
    marginBottom: spacing.md
  },
  headerTitle: {
    ...typography.heading1,
    color: colors.primaryText,
    fontWeight: '700'
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2
  },
  idCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: spacing.base,
    marginBottom: spacing.lg,
    ...shadows.card
  },
  idCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  flagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginRight: 6
  },
  idCardScheme: {
    ...typography.caption,
    fontWeight: '600',
    color: '#CBD5E1',
    flex: 1
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radius.pill
  },
  verifiedText: {
    ...typography.caption,
    color: '#34D399',
    fontWeight: '600',
    fontSize: 10
  },
  headName: {
    ...typography.heading2,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  idNumber: {
    ...typography.caption,
    color: '#38BDF8',
    marginTop: 2,
    marginBottom: 10
  },
  idCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  idCardFooterText: {
    ...typography.caption,
    color: '#CBD5E1',
    fontWeight: '500'
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.primaryText,
    fontWeight: '700',
    marginBottom: spacing.md
  },
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  memberCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  memberAvatarPod: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  genericAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  genericAvatarText: {
    ...typography.heading3,
    color: '#4F46E5',
    fontWeight: '700'
  },
  memberInfo: {
    flex: 1
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  memberName: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.primaryText
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.secondaryText
  },
  memberMeta: {
    ...typography.caption,
    color: colors.secondaryText,
    marginBottom: 4
  },
  memberStatusText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2
  },
  memberActionNote: {
    ...typography.caption,
    color: colors.teal,
    fontWeight: '600',
    marginTop: 2
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 4
  },
  cardActionBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDFA',
    padding: spacing.base,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 8
  },
  privacyText: {
    ...typography.caption,
    color: '#0F766E',
    flex: 1,
    lineHeight: 18
  }
});

export default CommunityFamilyScreen;
