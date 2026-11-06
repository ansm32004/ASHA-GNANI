import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { AppInput } from '../../components/common/AppInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VectorCategoryIcon } from '../../components/illustrations/VectorCategoryIcon';
import { householdApi } from '../../services/api/householdApi';
import { taskApi } from '../../services/api/taskApi';
import { aiApi } from '../../services/api/aiApi';
import { audioService } from '../../services/audio/audioService';
import { useTranslation } from 'react-i18next';

const TASK_CATEGORIES = [
  { name: 'Household visit', type: 'household' },
  { name: 'Maternal health follow-up', type: 'maternal' },
  { name: 'Child health follow-up', type: 'child' },
  { name: 'Vaccination reminder', type: 'vaccin' },
  { name: 'Health camp', type: 'vaccin' },
  { name: 'Community request', type: 'request' },
  { name: 'Nutrition follow-up', type: 'nutri' },
  { name: 'Referral follow-up', type: 'emergency' }
];

const PRIORITIES = [
  { key: 'Urgent', color: colors.danger, bg: colors.dangerLight },
  { key: 'High', color: colors.warning, bg: colors.warningLight },
  { key: 'Medium', color: colors.primary, bg: colors.primaryLight },
  { key: 'Low', color: colors.textSecondary, bg: colors.surfaceSecondary }
];

export const CreateTaskScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const preHhId = route?.params?.householdId || 'hh_001';

  const [households, setHouseholds] = useState([]);
  const [selectedHhId, setSelectedHhId] = useState(preHhId);
  const [selectedHh, setSelectedHh] = useState(null);

  const [taskType, setTaskType] = useState('Household visit');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  useEffect(() => {
    const loadHhs = async () => {
      const list = await householdApi.getHouseholds();
      setHouseholds(list);
      const cur = list.find((h) => h.id === selectedHhId) || list[0];
      setSelectedHh(cur);
    };
    loadHhs();
  }, [selectedHhId]);

  const handleVoiceFill = async () => {
    if (!isRecording) {
      try {
        const started = await audioService.startRecording();
        if (started) {
          setIsRecording(true);
        }
      } catch (err) {
        Alert.alert(
          'Microphone Permission Required',
          err.permanentlyDenied
            ? 'Microphone permission has been permanently denied. Please enable it in Settings.'
            : 'Please allow microphone access to dictate tasks.'
        );
      }
    } else {
      setIsRecording(false);
      setIsProcessingVoice(true);
      try {
        const recResult = await audioService.stopRecording();
        const audioUri = typeof recResult === 'object' ? recResult?.uri : recResult;
        let transcript = '';
        if (audioUri) {
          const base64 = await audioService.getAudioBase64(audioUri);
          await audioService.cleanupAudioFile(audioUri);
          if (base64) {
            const isWebm = Platform.OS === 'web' || audioUri?.endsWith('.webm');
            const isM4a = Platform.OS === 'android' || audioUri?.endsWith('.m4a');
            const audioFormat = isWebm ? 'webm' : (isM4a ? 'm4a' : 'wav');
            const tr = await aiApi.transcribe({ audio_base64: base64, audio_format: audioFormat, language: 'hi' });
            if (tr?.error) {
              setIsProcessingVoice(false);
              Alert.alert('Speech Recognition Notice', tr.error);
              return;
            }
            transcript = tr?.transcript;
          }
        }
        if (!transcript || !transcript.trim()) {
          setIsProcessingVoice(false);
          Alert.alert(
            'No Speech Detected',
            'Could not detect speech in recording. Please try speaking again or fill details manually.'
          );
          return;
        }

        const ext = await aiApi.extract(transcript, 'follow_up_task', selectedHhId, 'hi');
        const f = ext.extracted_fields || {};
        if (f.description) setDescription(f.description);
        if (f.due_date) setDueDate(f.due_date);
        if (f.priority) setPriority(f.priority);
        if (f.task_type) setTaskType(f.task_type);

        if (f.beneficiary_name) {
          const matched = households.find(h =>
            h.primary_contact_name.toLowerCase().includes(f.beneficiary_name.toLowerCase()) ||
            (h.members && h.members.some(m => m.name.toLowerCase().includes(f.beneficiary_name.toLowerCase())))
          );
          if (matched) {
            setSelectedHhId(matched.id);
            setSelectedHh(matched);
          }
        }
        setIsProcessingVoice(false);
      } catch (e) {
        setIsProcessingVoice(false);
        const msg = e.userFriendlyMessage || e.response?.data?.detail || e.message || 'Could not auto-fill from voice. Please enter details manually.';
        Alert.alert('Notice', msg);
      }
    }
  };

  const handleCreate = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe the task or reminder.');
      return;
    }

    setLoading(true);
    try {
      await taskApi.createTask({
        household_id: selectedHhId,
        household_name: selectedHh?.primary_contact_name || 'Household',
        village: selectedHh?.village || 'Rampur Kalan',
        task_type: taskType,
        description: description.trim(),
        due_date: dueDate,
        priority: priority,
        created_from: 'Manual'
      });
      setLoading(false);
      Alert.alert('Task Created', 'Follow-up reminder has been added to your schedule.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Could not create task. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title={t('tasks.createTask') || 'New Follow-up'}
        subtitle="Schedule a field visit or reminder"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Quick Voice Assistant Auto-Fill */}
        <TouchableOpacity
          onPress={handleVoiceFill}
          style={[styles.voiceFillPill, isRecording && styles.voiceFillPillRecording]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isRecording ? "stop-circle" : "mic"}
            size={18}
            color={isRecording ? colors.danger : colors.primary}
          />
          <Text style={[styles.voiceFillText, isRecording && styles.voiceFillTextRecording]}>
            {isProcessingVoice
              ? "Transcribing & Extracting with AI..."
              : isRecording
              ? "Recording... (Tap to finish)"
              : "Tap to dictate follow-up task with Voice AI"}
          </Text>
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>Household *</Text>
          <Text style={styles.sectionSubtitle}>Select family this follow-up belongs to</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hhScroll}
          >
            {households.slice(0, 10).map((h) => {
              const isSelected = selectedHhId === h.id;
              return (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => {
                    setSelectedHhId(h.id);
                    setSelectedHh(h);
                  }}
                  style={[styles.hhPill, isSelected && styles.hhPillActive]}
                >
                  <View style={[styles.avatarCircle, isSelected && styles.avatarCircleActive]}>
                    <Ionicons
                      name="home"
                      size={14}
                      color={isSelected ? colors.textWhite : colors.primary}
                    />
                  </View>
                  <View>
                    <Text style={[styles.hhName, isSelected && styles.hhNameActive]}>
                      {h.primary_contact_name}
                    </Text>
                    <Text style={[styles.hhVillage, isSelected && styles.hhVillageActive]}>
                      {h.village}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionTitle}>Task Category *</Text>
          <View style={styles.pillWrap}>
            {TASK_CATEGORIES.map((cat) => {
              const isSelected = taskType === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  onPress={() => setTaskType(cat.name)}
                  style={[styles.catPill, isSelected && styles.catPillActive]}
                >
                  <VectorCategoryIcon category={cat.type} size={16} style={{ marginRight: 5 }} />
                  <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppInput
            label="Task Description *"
            placeholder="e.g. Check IFA supplement intake & newborn temperature"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <AppInput
            label="Due Date (YYYY-MM-DD) *"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-11-05"
          />

          <Text style={styles.sectionTitle}>Priority Level</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => {
              const isSelected = priority === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setPriority(p.key)}
                  style={[
                    styles.priorityChip,
                    {
                      borderColor: isSelected ? p.color : colors.border,
                      backgroundColor: isSelected ? p.bg : colors.surface
                    }
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: p.color }]} />
                  <Text
                    style={[
                      styles.priorityText,
                      { color: isSelected ? p.color : colors.textSecondary }
                    ]}
                  >
                    {p.key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <PrimaryButton
          title="Save Follow-up Task"
          onPress={handleCreate}
          loading={loading}
          size="large"
          style={{ marginTop: spacing.md }}
        />

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
    padding: spacing.screenPadding,
    paddingBottom: spacing['3xl']
  },
  formGroup: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: 2
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  hhScroll: {
    gap: 8,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md
  },
  hhPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  hhPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  avatarCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)'
  },
  hhName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary
  },
  hhNameActive: {
    color: colors.textWhite
  },
  hhVillage: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10
  },
  hhVillageActive: {
    color: colors.primaryLight
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
    marginTop: spacing.xs
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  catPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  catPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  catPillTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xs,
    marginBottom: spacing.xs
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  priorityText: {
    ...typography.caption,
    fontWeight: '600'
  },
  voiceFillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: 8
  },
  voiceFillPillRecording: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.danger
  },
  voiceFillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary
  },
  voiceFillTextRecording: {
    color: colors.danger
  }
});
