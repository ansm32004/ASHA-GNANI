import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Switch, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { AvatarImage } from '../../components/common/AvatarImage';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { useAppStore } from '../../store/appStore';
import { syncService } from '../../services/local/syncService';
import { useTranslation } from 'react-i18next';

export const ProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { uiLanguage, setUiLanguage } = useLanguageStore();
  const { offlineQueue } = useAppStore();

  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSyncNow = async () => {
    setSyncing(true);
    const result = await syncService.syncPendingRecords();
    setSyncing(false);
    Alert.alert(
      'Database Sync Status',
      `Synchronized ${result.syncedCount || 0} offline records. All field data is up to date.`
    );
  };

  const handleCallSupervisor = () => {
    Linking.openURL('tel:18001801104').catch(() => {
      Alert.alert('Supervisor Helpline', 'Dialing ANM/Supervisor Helpline: 1800-180-1104');
    });
  };

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
    setUiLanguage(nextLang);
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
      <MinimalHeader
        title={t('profile.title') || 'Profile & Settings'}
        subtitle="Credentials, sync & preferences"
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Worker Identity Pod */}
        <View style={styles.workerPod}>
          <AvatarImage
            name={user?.name || 'Sunita Devi'}
            role="ASHA"
            size={52}
            showBorder
            borderColor={colors.primaryMuted}
            style={{ marginRight: spacing.md }}
          />
          <View style={styles.workerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name || 'Sunita Devi'}</Text>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>
            <Text style={styles.userRole}>ASHA Worker (स्वास्थ्य सखी)</Text>
            <Text style={styles.userPhone}>+91 {user?.phone || '98765 43210'}</Text>
          </View>
        </View>

        {/* 2. ASHA Credentials & Coverage Card */}
        <View style={styles.groupCard}>
          <Text style={styles.groupHeader}>ASHA Credentials & Coverage</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.ashaId') || 'ASHA ID'}</Text>
            <Text style={styles.infoValue}>{user?.asha_id || 'ASHA-UP-VNS-2024-042'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.assignedSubcentre') || 'Subcentre'}</Text>
            <Text style={styles.infoValue}>{user?.sub_centre || 'Rampur SC-04'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.assignedPhc') || 'PHC'}</Text>
            <Text style={styles.infoValue}>{user?.phc_name || 'Kashi PHC'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Village</Text>
            <Text style={styles.infoValue}>{user?.village_name || 'Rampur Kalan'}</Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Coverage</Text>
            <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '700' }]}>
              {user?.total_assigned_households || 34} Households (5 Clusters)
            </Text>
          </View>
        </View>

        {/* 3. Preferences & Database Sync */}
        <View style={styles.groupCard}>
          <Text style={styles.groupHeader}>Preferences & Field Sync</Text>

          {/* Language Switch */}
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>{t('profile.interfaceLang') || 'App Language'}</Text>
              <Text style={styles.settingDesc}>
                Current: {i18n.language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLanguageToggle} style={styles.pillButton}>
              <Text style={styles.pillButtonText}>
                {i18n.language === 'hi' ? 'Switch to EN' : 'हिन्दी चुनें'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Voice Feedback Toggle */}
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Voice Assistant Audio</Text>
              <Text style={styles.settingDesc}>Read out answers aloud during visits</Text>
            </View>
            <Switch
              value={voiceFeedbackEnabled}
              onValueChange={setVoiceFeedbackEnabled}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.surface}
            />
          </View>

          {/* Offline Sync State */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>{t('profile.offlineSync') || 'Offline Database'}</Text>
              {offlineQueue.length === 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="checkmark-circle-outline" size={13} color={colors.teal} style={{ marginRight: 4 }} />
                  <Text style={styles.settingDesc}>All records synchronized</Text>
                </View>
              ) : (
                <Text style={styles.settingDesc}>{`${offlineQueue.length} records pending`}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleSyncNow}
              disabled={syncing}
              style={[styles.pillButton, { backgroundColor: colors.tealLight }]}
            >
              <Text style={[styles.pillButtonText, { color: colors.tealDark }]}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Support Helpline */}
        <TouchableOpacity style={styles.helplineBox} onPress={handleCallSupervisor} activeOpacity={0.85}>
          <View style={styles.helplineIconWrap}>
            <Ionicons name="call" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.helplineTitle}>ANM / Supervisor Helpline</Text>
            <Text style={styles.helplineText}>1800-180-1104 (Toll-Free Government Helpline)</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.secondaryText} />
        </TouchableOpacity>

        {/* 5. Demo Account Label */}
        <View style={styles.demoAccountPill}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.secondaryText} />
          <Text style={styles.demoAccountText}>
            Logged in as ASHA Demo: asha.demo@sahayika.test
          </Text>
        </View>

        {/* 6. Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.85}
          accessibilityLabel="Log Out"
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.logoutButtonText}>{t('profile.logout') || 'Log Out of SAHAYIKA'}</Text>
        </TouchableOpacity>

        {/* Bottom padding to guarantee complete clearance above floating navigation bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* In-App Confirmation Logout Modal */}
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
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out from SAHAYIKA? You will need to sign in again to access field records.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>Log Out</Text>
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
    backgroundColor: colors.background
  },
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: 20
  },
  workerPod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.cardPadding,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.card
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primaryMuted
  },
  avatarInitial: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700'
  },
  workerInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tealLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.teal,
    marginRight: 4
  },
  activeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.tealDark
  },
  userRole: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2
  },
  userPhone: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.card
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: spacing.sm,
    letterSpacing: 0.2
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  infoLabel: {
    fontSize: 12,
    color: colors.secondaryText
  },
  infoValue: {
    fontSize: 12,
    color: colors.primaryText,
    fontWeight: '600'
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText
  },
  settingDesc: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  pillButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  helplineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: 10,
    ...shadows.subtle
  },
  helplineIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  helplineTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText
  },
  helplineText: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 1
  },
  demoAccountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: spacing.xs
  },
  demoAccountText: {
    fontSize: 11,
    color: colors.secondaryText
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#F8D7D7',
    borderRadius: radius.pill,
    paddingVertical: 12,
    marginTop: spacing.sm
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(32, 38, 49, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...shadows.floating
  },
  modalIconPod: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 6
  },
  modalMessage: {
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center'
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textWhite
  }
});

export default ProfileScreen;
