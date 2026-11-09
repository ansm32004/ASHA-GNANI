import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Switch,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AvatarImage } from '../../components/common/AvatarImage';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';

export const CommunityProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [voicePlaybackSpeed, setVoicePlaybackSpeed] = useState('normal'); // normal, slow
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [phcDataSharing, setPhcDataSharing] = useState(true);

  const handleCallAsha = () => {
    Linking.openURL('tel:9876543210').catch(() => {
      Alert.alert('आशा दीदी को कॉल', 'सुनीता देवी (+91 9876543210) को कॉल मिलाई जा रही है...');
    });
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'आपातकालीन सेवा (112 National Helpline)',
      '112 पर तुरंत कॉल करके एम्बुलेंस एवं आपातकालीन चिकित्सा सहायता प्राप्त करें।',
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: '112 पर कॉल करें',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:112').catch(() => {
              Alert.alert('आपातकालीन कॉल', '112 आपातकालीन सहायता को कॉल मिलाई जा रही है...');
            });
          }
        }
      ]
    );
  };

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>खाता एवं सेटिंग्स (Profile & Settings)</Text>
          <Text style={styles.headerSubtitle}>सहयिका समुदाय सदस्य पोर्टल</Text>
        </View>

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <AvatarImage
            name={user?.name || 'Meena Devi'}
            role="COMMUNITY"
            size={52}
            showBorder
            borderColor={colors.coralLight}
            style={{ marginRight: 14 }}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Meena Devi'}</Text>
            <Text style={styles.userPhone}>+91 {user?.phone || '9871100221'}</Text>
            <Text style={styles.userArea}>
              गृह कोड: {user?.household_code || 'HH-RK-001'} • {user?.village_name || 'Rampur Kalan'}
            </Text>
          </View>
        </View>

        {/* Assigned ASHA Worker Details */}
        <Text style={styles.sectionTitle}>आपकी नामित आशा कार्यकर्ता (Assigned ASHA)</Text>
        <View style={styles.ashaCard}>
          <View style={styles.ashaTopRow}>
            <AvatarImage
              name="Sunita Devi"
              role="ASHA"
              size={44}
              showBorder
              borderColor={colors.primaryMuted}
              style={{ marginRight: 12 }}
            />
            <View style={styles.ashaTextCol}>
              <Text style={styles.ashaName}>सुनीता देवी (Sunita Devi)</Text>
              <Text style={styles.ashaDesignation}>मान्यता प्राप्त सामाजिक स्वास्थ्य कार्यकर्ता (ASHA)</Text>
              <Text style={styles.ashaCentre}>रामपुर उप-केंद्र SC-04 • प्राथमिक स्वास्थ्य केंद्र काशी</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.callAshaBtn} onPress={handleCallAsha} activeOpacity={0.85}>
            <Ionicons name="call" size={16} color="#FFFFFF" />
            <Text style={styles.callAshaBtnText}>आशा दीदी को कॉल करें (+91 9876543210)</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Assistance 112 Button */}
        <Text style={styles.sectionTitle}>आपातकालीन सहायता (Emergency Support)</Text>
        <TouchableOpacity style={styles.emergencyBtn} onPress={handleEmergencyCall} activeOpacity={0.85}>
          <View style={styles.emergencyIconPod}>
            <Ionicons name="warning" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.emergencyTextCol}>
            <Text style={styles.emergencyTitle}>112 राष्ट्रीय आपातकालीन हेल्पलाइन</Text>
            <Text style={styles.emergencySubtitle}>24x7 एम्बुलेंस व त्वरित आपातकालीन सेवा</Text>
          </View>
          <Ionicons name="call" size={20} color={colors.danger} />
        </TouchableOpacity>

        {/* Language & Voice Preferences */}
        <Text style={styles.sectionTitle}>भाषा एवं ध्वनि प्राथमिकताएं (Preferences)</Text>

        <TouchableOpacity style={styles.settingsRow} onPress={handleLanguageToggle} activeOpacity={0.8}>
          <View style={styles.settingsIcon}>
            <Ionicons name="language" size={18} color={colors.primary} />
          </View>
          <View style={styles.settingsTextCol}>
            <Text style={styles.settingsTitle}>ऐप की भाषा (App Language)</Text>
            <Text style={styles.settingsValue}>
              {i18n.language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
            </Text>
          </View>
          <View style={styles.actionChip}>
            <Text style={styles.actionChipText}>बदलें</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.settingsRow}>
          <View style={styles.settingsIcon}>
            <Ionicons name="volume-medium" size={18} color={colors.teal} />
          </View>
          <View style={styles.settingsTextCol}>
            <Text style={styles.settingsTitle}>आवाज पढ़ने की गति (Voice Speed)</Text>
            <Text style={styles.settingsValue}>
              {voicePlaybackSpeed === 'normal' ? 'सामान्य गति (Normal)' : 'धीमी गति (Slow - आसान समझ)'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => setVoicePlaybackSpeed(voicePlaybackSpeed === 'normal' ? 'slow' : 'normal')}
          >
            <Text style={styles.actionChipText}>
              {voicePlaybackSpeed === 'normal' ? 'धीमी करें' : 'सामान्य'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsRow}>
          <View style={styles.settingsIcon}>
            <Ionicons name="notifications" size={18} color={colors.primary} />
          </View>
          <View style={styles.settingsTextCol}>
            <Text style={styles.settingsTitle}>टीकाकरण व जांच रिमाइंडर (Notifications)</Text>
            <Text style={styles.settingsValue}>
              {notificationsEnabled ? 'सक्रिय (Alerts On)' : 'निष्क्रिय (Muted)'}
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#CBD5E1', true: colors.primaryLight }}
            thumbColor={notificationsEnabled ? colors.primary : '#94A3B8'}
          />
        </View>

        {/* Privacy & ABDM Health Records */}
        <Text style={styles.sectionTitle}>डेटा गोपनीयता एवं सुरक्षा (Privacy)</Text>
        <View style={styles.settingsRow}>
          <View style={styles.settingsIcon}>
            <Ionicons name="shield-checkmark" size={18} color="#10B981" />
          </View>
          <View style={styles.settingsTextCol}>
            <Text style={styles.settingsTitle}>PHC डॉक्टर के साथ रिकॉर्ड साझाकरण</Text>
            <Text style={styles.settingsValue}>
              {phcDataSharing ? 'अनुमति दी गई (ABDM Compliant)' : 'निजी (Only ASHA)'}
            </Text>
          </View>
          <Switch
            value={phcDataSharing}
            onValueChange={(val) => {
              setPhcDataSharing(val);
              Alert.alert('गोपनीयता अपडेट', val ? 'स्वास्थ्य रिकॉर्ड PHC डॉक्टर परामर्श हेतु साझा किए जा रहे हैं।' : 'स्वास्थ्य रिकॉर्ड साझाकरण सीमित कर दिया गया है।');
            }}
            trackColor={{ false: '#CBD5E1', true: '#D1FAE5' }}
            thumbColor={phcDataSharing ? '#10B981' : '#94A3B8'}
          />
        </View>

        {/* Demo Account Indicator */}
        <View style={styles.demoCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.demoText}>
            लॉगिन खाता: community.demo@sahayika.test (समुदाय सदस्य)
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutBtnText}>समुदाय ऐप से लॉग आउट करें (Logout)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconPod}>
              <Ionicons name="log-out" size={28} color={colors.danger} />
            </View>
            <Text style={styles.modalTitle}>लॉग आउट की पुष्टि (Confirm Logout)</Text>
            <Text style={styles.modalMessage}>
              क्या आप सुनिश्चित हैं कि आप सहयिका समुदाय ऐप से लॉग आउट करना चाहते हैं?
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>रद्द करें</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>लॉग आउट</Text>
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
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110
  },
  header: {
    marginBottom: 16
  },
  headerTitle: {
    ...typography.heading2,
    fontWeight: '700',
    color: colors.primaryText
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    ...shadows.card
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  avatarText: {
    ...typography.heading2,
    fontWeight: '700',
    color: '#EF4444'
  },
  profileInfo: {
    flex: 1
  },
  userName: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.primaryText
  },
  userPhone: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2
  },
  userArea: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  ashaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
    ...shadows.card
  },
  ashaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  ashaAvatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  ashaInitial: {
    ...typography.heading3,
    color: colors.primary,
    fontWeight: '700'
  },
  ashaTextCol: {
    flex: 1
  },
  ashaName: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.primaryText
  },
  ashaDesignation: {
    ...typography.caption,
    color: colors.secondaryText
  },
  ashaCentre: {
    ...typography.caption,
    color: colors.teal,
    fontWeight: '600',
    marginTop: 2
  },
  callAshaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md
  },
  callAshaBtnText: {
    ...typography.button,
    color: '#FFFFFF'
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 14
  },
  emergencyIconPod: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  emergencyTextCol: {
    flex: 1
  },
  emergencyTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: '#991B1B'
  },
  emergencySubtitle: {
    ...typography.caption,
    color: '#B91C1C',
    marginTop: 2
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  settingsTextCol: {
    flex: 1
  },
  settingsTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.primaryText
  },
  settingsValue: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 1
  },
  actionChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  actionChipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700'
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 12,
    marginBottom: 16
  },
  demoText: {
    ...typography.caption,
    color: '#0369A1',
    flex: 1,
    fontWeight: '500'
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: 4
  },
  logoutBtnText: {
    ...typography.button,
    color: colors.danger,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    ...shadows.floating
  },
  modalIconPod: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  modalTitle: {
    ...typography.heading3,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 6
  },
  modalMessage: {
    ...typography.bodyMedium,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center'
  },
  modalCancelText: {
    ...typography.button,
    color: colors.textSecondary
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center'
  },
  modalConfirmText: {
    ...typography.button,
    color: '#FFFFFF'
  }
});

export default CommunityProfileScreen;
