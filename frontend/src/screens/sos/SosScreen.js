import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { AppInput } from '../../components/common/AppInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { EmergencySupportVector } from '../../components/illustrations/CategoryVectors';
import { VectorCategoryIcon } from '../../components/illustrations/VectorCategoryIcon';
import { sosApi } from '../../services/api/sosApi';
import { useTranslation } from 'react-i18next';

export const SosScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [emergencyType, setEmergencyType] = useState('Immediate Emergency');
  const [description, setDescription] = useState('Severe maternal bleeding / high fever emergency');
  const [householdName, setHouseholdName] = useState('Meena Devi');
  const [locationConsent, setLocationConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);

  const handleTriggerSOS = async () => {
    Alert.alert(
      'CONFIRM EMERGENCY ALERT (112)',
      'This will trigger an emergency dispatch simulation and alert your Primary Health Centre emergency team.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'TRIGGER ALERT NOW',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const res = await sosApi.triggerSos({
              household_name: householdName,
              emergency_type: emergencyType,
              description,
              consent_given: locationConsent
            });
            setActiveAlert(res);
            setLoading(false);
          }
        }
      ]
    );
  };

  const classifications = [
    {
      type: 'Immediate Emergency',
      label: 'Immediate Emergency',
      desc: 'Life-threatening, heavy bleeding, unconsciousness, severe distress',
      vector: 'emergency',
      color: colors.danger
    },
    {
      type: 'Urgent Health Concern',
      label: 'Urgent Health Concern',
      desc: 'High fever, persistent vomiting, severe dizziness',
      vector: 'maternal',
      color: colors.warning
    },
    {
      type: 'Routine Assistance',
      label: 'Routine Assistance',
      desc: 'Non-emergency health queries, appointment requests',
      vector: 'household',
      color: colors.primary
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title={t('sos.title') || 'Emergency Protocol (112)'}
        subtitle="Immediate PHC Ambulance & MO Dispatch"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Notice */}
        <View style={styles.simBanner}>
          <Ionicons name="information-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.simText}>Connected to National Emergency Response 112 simulation.</Text>
        </View>

        {activeAlert ? (
          <View style={styles.activeAlertCard}>
            <View style={styles.activeHeader}>
              <View style={styles.alertPulse}>
                <EmergencySupportVector size={28} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.activeTitle}>EMERGENCY ALERT ACTIVE</Text>
                <Text style={styles.activeSub}>Event ID: {activeAlert.id}</Text>
              </View>
            </View>

            <View style={styles.statusBox}>
              <Text style={styles.statusItem}>✓ India 112 Simulation: Dispatch Triggered</Text>
              <Text style={styles.statusItem}>✓ Assigned ASHA (Sunita Devi): Notified</Text>
              <Text style={styles.statusItem}>✓ Level {activeAlert.escalation_level}: Ambulance 108 Dispatched</Text>
              <Text style={styles.statusItem}>✓ Patient: {activeAlert.household_name || householdName}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setActiveAlert(null)}
              style={styles.standDownBtn}
            >
              <Text style={styles.standDownText}>Acknowledge & Stand Down</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formGroup}>
            <Text style={styles.sectionHeader}>Emergency Classification</Text>

            {classifications.map((item) => {
              const isSelected = emergencyType === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  onPress={() => setEmergencyType(item.type)}
                  style={[
                    styles.typeOption,
                    isSelected && {
                      borderColor: item.color,
                      backgroundColor: item.color === colors.danger ? colors.dangerLight : colors.primaryLight
                    }
                  ]}
                >
                  <VectorCategoryIcon category={item.vector} size={24} style={{ marginRight: 10 }} />
                  <View style={styles.typeTextCol}>
                    <Text
                      style={[
                        styles.typeLabel,
                        isSelected && { color: item.color, fontWeight: '700' }
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.typeDesc}>{item.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <AppInput
              label="Household / Patient Name"
              value={householdName}
              onChangeText={setHouseholdName}
            />

            <AppInput
              label="Emergency Situation Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            <TouchableOpacity
              onPress={() => setLocationConsent(!locationConsent)}
              style={styles.consentRow}
            >
              <Ionicons
                name={locationConsent ? 'checkbox' : 'square-outline'}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.consentText}>
                Transmit GPS coordinates for 112 / 108 emergency ambulance routing.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTriggerSOS}
              activeOpacity={0.85}
              style={styles.triggerButton}
            >
              <Text style={styles.triggerBtnText}>🚨 TRIGGER EMERGENCY SOS (112)</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingBottom: 110
  },
  simBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F8B4B4',
    marginBottom: spacing.base
  },
  simText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
    marginLeft: 6,
    flex: 1
  },
  formGroup: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border
  },
  typeTextCol: {
    flex: 1
  },
  typeLabel: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.textPrimary
  },
  typeDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
    fontSize: 11
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12
  },
  consentText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginLeft: 6,
    flex: 1,
    fontSize: 11
  },
  triggerButton: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.base
  },
  triggerBtnText: {
    ...typography.button,
    color: colors.textWhite,
    fontWeight: '700'
  },
  activeAlertCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.base,
    borderWidth: 2,
    borderColor: colors.danger
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base
  },
  alertPulse: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeTitle: {
    ...typography.heading3,
    color: colors.danger,
    fontWeight: '700'
  },
  activeSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  statusBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.base,
    borderRadius: 16,
    gap: 6
  },
  statusItem: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  standDownBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    marginTop: spacing.base
  },
  standDownText: {
    ...typography.button,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13
  }
});
