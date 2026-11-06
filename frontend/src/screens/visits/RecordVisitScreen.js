import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { AppInput } from '../../components/common/AppInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { VoiceControl } from '../../components/voice/VoiceControl';
import { VectorCategoryIcon } from '../../components/illustrations/VectorCategoryIcon';
import { householdApi } from '../../services/api/householdApi';
import { aiApi } from '../../services/api/aiApi';
import { audioService } from '../../services/audio/audioService';
import { useTranslation } from 'react-i18next';

export const RecordVisitScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const preselectedId = route?.params?.preselectedHouseholdId || 'hh_001';

  const [households, setHouseholds] = useState([]);
  const [selectedHhId, setSelectedHhId] = useState(preselectedId);
  const [selectedHousehold, setSelectedHousehold] = useState(null);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [capturedTranscript, setCapturedTranscript] = useState('');
  const [manualText, setManualText] = useState('');

  useEffect(() => {
    const loadHhs = async () => {
      const list = await householdApi.getHouseholds();
      setHouseholds(list);
      const cur = list.find((h) => h.id === selectedHhId) || list[0];
      setSelectedHousehold(cur);
    };
    loadHhs();
  }, [selectedHhId]);

  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleRecord = async () => {
    if (!isRecording) {
      try {
        const started = await audioService.startRecording();
        if (started) {
          setSeconds(0);
          setIsRecording(true);
          setCapturedTranscript('');
        }
      } catch (err) {
        Alert.alert(
          'Microphone Permission Required',
          err.permanentlyDenied
            ? 'Microphone permission has been permanently denied. Please enable it in Settings.'
            : 'Please grant microphone access to record visit voice notes.'
        );
      }
    } else {
      setIsRecording(false);
      const recResult = await audioService.stopRecording();
      const audioUri = typeof recResult === 'object' ? recResult?.uri : recResult;
      if (audioUri) {
        processAudioRecording(audioUri);
      } else {
        Alert.alert('Recording Failed', 'No valid audio was captured. Please speak again.');
      }
    }
  };

  const handleCancelRecording = async () => {
    try {
      const recResult = await audioService.stopRecording();
      const audioUri = typeof recResult === 'object' ? recResult?.uri : recResult;
      if (audioUri) {
        await audioService.cleanupAudioFile(audioUri);
      }
    } catch (e) {
      // non-fatal
    }
    setIsRecording(false);
    setSeconds(0);
  };

  const processAudioRecording = async (audioUri) => {
    setIsProcessing(true);
    try {
      let transcriptText = '';
      if (audioUri) {
        const base64 = await audioService.getAudioBase64(audioUri);
        await audioService.cleanupAudioFile(audioUri);
        if (base64) {
          const audioFormat = audioUri?.endsWith('.m4a') ? 'm4a' : (audioUri?.endsWith('.webm') ? 'webm' : 'wav');
          const transcribeRes = await aiApi.transcribe({
            audio_base64: base64,
            audio_format: audioFormat,
            language: 'hi'
          });
          if (transcribeRes?.error) {
            setIsProcessing(false);
            Alert.alert('Speech Recognition Notice', transcribeRes.error);
            return;
          }
          transcriptText = transcribeRes?.transcript || '';
        }
      }

      if (!transcriptText || !transcriptText.trim()) {
        Alert.alert(
          'No Speech Detected',
          'Could not detect speech in the audio recording. Please speak clearly into the microphone or switch to manual typing.'
        );
        setCapturedTranscript('');
      } else {
        setCapturedTranscript(transcriptText.trim());
      }
      setIsProcessing(false);
    } catch (e) {
      setIsProcessing(false);
      const msg = e.userFriendlyMessage || e.response?.data?.detail || e.message || 'Could not transcribe voice. You can retry speaking or switch to typing.';
      Alert.alert('Transcription Error', msg);
    }
  };

  const handleExtractAndNavigate = async (textToExtract) => {
    const cleanText = (textToExtract || capturedTranscript || manualText).trim();
    if (!cleanText) {
      Alert.alert('Required', 'Please speak or enter your visit report first.');
      return;
    }

    setIsProcessing(true);
    try {
      const extractRes = await aiApi.extract(cleanText, 'visit_logging', selectedHhId, 'hi');
      setIsProcessing(false);
      const fields = extractRes.extracted_fields || extractRes.data || {};
      navigation.navigate('VisitConfirm', {
        extractedData: fields,
        missingFields: extractRes.missing_fields || [],
        rawTranscript: cleanText
      });
    } catch (e) {
      setIsProcessing(false);
      Alert.alert('Extraction Error', 'Could not structure visit fields. Please try again.');
    }
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) {
      Alert.alert('Required', 'Please write your visit notes.');
      return;
    }
    handleExtractAndNavigate(manualText.trim());
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title={t('visits.title') || 'Record Visit'}
        subtitle="Voice documentation for field visits"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Household Horizontal Selector */}
        <Text style={styles.sectionLabel}>Select Household</Text>
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
                  setSelectedHousehold(h);
                }}
                style={[styles.hhPill, isSelected && styles.hhPillActive]}
              >
                <VectorCategoryIcon category="household" size={18} style={{ marginRight: 6 }} />
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

        {selectedHousehold && (
          <View style={styles.selectedBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.selectedText}>
              Selected: <Text style={{ fontWeight: '700' }}>{selectedHousehold.primary_contact_name}</Text>{' '}
              ({selectedHousehold.village})
            </Text>
          </View>
        )}

        {/* Voice Studio, Transcript Review, or Manual Input */}
        {capturedTranscript ? (
          <View style={styles.studioCard}>
            <View style={styles.transcriptHeaderRow}>
              <View style={styles.micTag}>
                <Ionicons name="mic" size={14} color={colors.primary} />
                <Text style={styles.micTagText}>Voice Transcript (Gnani STT)</Text>
              </View>
              <TouchableOpacity onPress={() => setCapturedTranscript('')} style={styles.discardBtn}>
                <Ionicons name="refresh" size={14} color={colors.danger} />
                <Text style={styles.discardText}>Re-record</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.transcriptReviewLabel}>Review or edit your spoken report before extraction:</Text>
            <AppInput
              value={capturedTranscript}
              onChangeText={setCapturedTranscript}
              multiline
              numberOfLines={4}
              style={styles.transcriptInput}
            />

            <PrimaryButton
              title="Extract Details with AI"
              onPress={() => handleExtractAndNavigate(capturedTranscript)}
              loading={isProcessing}
              size="large"
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : !manualMode ? (
          <View style={styles.studioCard}>
            <VoiceControl
              isRecording={isRecording}
              isProcessing={isProcessing}
              durationSeconds={seconds}
              onPress={handleToggleRecord}
              instructionText="Tap microphone and speak in Hindi or English about mother, infant, or advice"
            />

            {isRecording && (
              <TouchableOpacity onPress={handleCancelRecording} style={styles.cancelRecBtn}>
                <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.cancelRecText}>Cancel Recording</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setManualMode(true)}
              style={styles.switchModeBtn}
            >
              <Ionicons name="create-outline" size={15} color={colors.primary} />
              <Text style={styles.switchModeText}>Switch to typing notes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.studioCard}>
            <View style={styles.manualHeader}>
              <Text style={styles.manualTitle}>Manual Field Notes</Text>
              <TouchableOpacity onPress={() => setManualMode(false)} style={styles.voiceTogglePill}>
                <Ionicons name="mic" size={14} color={colors.primary} />
                <Text style={styles.voiceToggleText}>Use Voice</Text>
              </TouchableOpacity>
            </View>

            <AppInput
              placeholder="e.g. आज मीना देवी के घर गई थी। बीपी 118/76 सामान्य था। शुक्रवार को दोबारा जाना है।"
              value={manualText}
              onChangeText={setManualText}
              multiline
              numberOfLines={4}
              style={styles.transcriptInput}
            />

            <PrimaryButton
              title="Extract Details with AI"
              onPress={handleManualSubmit}
              loading={isProcessing}
              size="large"
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        {/* Example Spoken Dialogue Guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Example Spoken Report:</Text>
          <Text style={styles.guideHindi}>
            "आज मीना देवी के घर गई थी। उनके बच्चे का वैक्सीनेशन अगले हफ्ते है। शुक्रवार को दोबारा जाना है।"
          </Text>
          <Text style={styles.guideSub}>
            SAHAYIKA extracts the outcome, child immunisation status, and automatically creates a reminder for Friday!
          </Text>
        </View>

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
    paddingBottom: 40
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  hhScroll: {
    gap: 8,
    paddingVertical: 2,
    marginBottom: spacing.sm
  },
  hhPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  hhPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  hhName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary
  },
  hhNameActive: {
    color: colors.primary
  },
  hhVillage: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10
  },
  hhVillageActive: {
    color: colors.primaryDark
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  selectedText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginLeft: 6
  },
  studioCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.base
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    marginTop: spacing.md
  },
  switchModeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 5
  },
  manualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm
  },
  manualTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  voiceTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  voiceToggleText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 4
  },
  guideCard: {
    backgroundColor: colors.tealLight,
    borderRadius: 20,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#C7EBE4'
  },
  guideTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.tealDark,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  guideHindi: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 20
  },
  guideSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4
  },
  transcriptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xs
  },
  micTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill
  },
  micTagText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 5
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  discardText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
    marginLeft: 3
  },
  transcriptReviewLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: '100%',
    marginVertical: spacing.xs
  },
  cancelRecBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerLight,
    marginTop: spacing.xs
  },
  cancelRecText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
    marginLeft: 4
  },
  transcriptInput: {
    width: '100%',
    alignSelf: 'stretch'
  }
});
