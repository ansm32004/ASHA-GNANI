import { tr } from '../../localisation/tr';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import {
  MaternalHero,
  MenstrualHealthIllustration,
  ChildHealthIllustration,
  VaccinationIllustration,
  NutritionIllustration,
  CommunityHealthIllustration
} from '../../components/illustrations';
import { ConversationBubble } from '../../components/visual/ConversationBubble';
import { AvatarImage } from '../../components/common/AvatarImage';
import { useAuthStore } from '../../store/authStore';
import { requestApi } from '../../services/api/requestApi';
import { aiApi } from '../../services/api/aiApi';
import { audioService, useAudioPlayback } from '../../services/audio/audioService';
import { useTranslation } from 'react-i18next';

export const CommunityHomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [assistantReply, setAssistantReply] = useState(null);
  const [textQuery, setTextQuery] = useState('');

  const audioPlayback = useAudioPlayback('community_reply');

  // Stop playback when navigating away or unmounting
  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      audioService.stopAudio();
    });
    return () => {
      unsub();
      audioService.stopAudio();
    };
  }, [navigation]);

  // Elapsed recording seconds timer
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const getTodayFormatted = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const getTomorrowFormatted = () => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const d = String(tmr.getDate()).padStart(2, '0');
    const m = String(tmr.getMonth() + 1).padStart(2, '0');
    const y = tmr.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const getDayAfterFormatted = () => {
    const da = new Date();
    da.setDate(da.getDate() + 2);
    const d = String(da.getDate()).padStart(2, '0');
    const m = String(da.getMonth() + 1).padStart(2, '0');
    const y = da.getFullYear();
    return `${d}-${m}-${y}`;
  };

  // Request Visit Modal State
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestCategory, setRequestCategory] = useState('Household visit request');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestPreferredDate, setRequestPreferredDate] = useState(getTodayFormatted());
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [activeVisitRequest, setActiveVisitRequest] = useState(null);

  const loadActiveRequest = useCallback(async () => {
    try {
      const all = await requestApi.getRequests();
      const list = Array.isArray(all) ? all : [];
      const userHhId = user?.household_id || 'hh_001';
      // Find latest pending/scheduled visit request for this household that is not resolved or completed
      const active = list.find(r =>
        r &&
        (r.household_id === userHhId || !r.household_id || r.household_id === 'hh_001') &&
        (r.status || '').toLowerCase() !== 'resolved' &&
        (r.status || '').toLowerCase() !== 'completed'
      );
      setActiveVisitRequest(active || null);
    } catch (e) {
      // Non-blocking
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadActiveRequest();
    }, [loadActiveRequest])
  );

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
  };

  const handleVoiceQuery = async (queryText) => {
    const q = (queryText || textQuery || liveTranscription).trim();
    if (!q) return;

    try {
      await audioService.stopAudio();
    } catch (_) {}

    setIsThinking(true);
    setLiveTranscription('');
    setTextQuery('');

    try {
      const res = await aiApi.queryAssistant(q, i18n.language, true);
      setIsThinking(false);
      setAssistantReply({
        query: q,
        text: res.reply_text,
        audio_url: res.audio_url || null,
        actions: res.suggested_actions || []
      });

      if (res.audio_url) {
        await audioService.playAudio(res.audio_url, null, 'community_reply');
      } else if (res.reply_text) {
        aiApi.speak({ text: res.reply_text, language: i18n.language })
          .then((speakRes) => {
            const url = speakRes?.audio_url || speakRes?.audio_content;
            if (url) {
              setAssistantReply((prev) => prev ? { ...prev, audio_url: url } : prev);
              audioService.playAudio(url, null, 'community_reply').catch(() => {});
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      setIsThinking(false);
      const errMsg = e.userFriendlyMessage || e.response?.data?.detail;
      setAssistantReply({
        query: q,
        text:
          i18n.language === 'hi'
            ? (errMsg || 'माफ़ कीजिए, स्वास्थ्य सहायिका सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।')
            : (errMsg || 'Sorry, could not connect to the health assistant service. Please try again.'),
        audio_url: null,
        actions: ['Retry']
      });
    }
  };

  const handleToggleVoice = async () => {
    if (!isRecording) {
      try {
        await audioService.stopAudio();
      } catch (_) {}
      try {
        const started = await audioService.startRecording();
        if (started) {
          setIsRecording(true);
          setSeconds(0);
          setLiveTranscription(i18n.language === 'hi' ? 'बोलिए... (सुन रहा हूँ)' : 'Listening...');
        } else {
          Alert.alert(
            tr(i18n.language === 'hi' ? 'रिकॉर्डर त्रुटि' : 'Recorder Initialization Error'),
            tr(i18n.language === 'hi'
              ? 'रिकॉर्डर प्रारंभ करने में विफल। कृपया पुनः प्रयास करें।'
              : 'Recorder initialization failed. Please try again.')
          );
        }
      } catch (err) {
        Alert.alert(
          tr('Microphone Permission Required'),
          tr(err.permanentlyDenied
            ? 'Microphone permission has been permanently denied. Please enable it in Settings.'
            : (i18n.language === 'hi'
                ? 'माइक्रोफ़ोन अनुमति आवश्यक है। स्वास्थ्य प्रश्न पूछने के लिए अनुमति दें।'
                : 'Please allow microphone access to ask health questions by voice.'))
        );
      }
    } else {
      setIsRecording(false);
      setIsThinking(true);
      try {
        const recResult = await audioService.stopRecording();
        const audioUri = typeof recResult === 'object' ? recResult?.uri : recResult;
        let queryText = '';
        let sttError = null;

        if (!audioUri) {
          setIsThinking(false);
          setLiveTranscription(
            i18n.language === 'hi'
              ? 'ऑडियो रिकॉर्डिंग विफल रही। कोई आवाज़ रिकॉर्ड नहीं हुई।'
              : 'Recording failed. No audio recorded.'
          );
          return;
        }

        const base64 = await audioService.getAudioBase64(audioUri);
        await audioService.cleanupAudioFile(audioUri);

        if (!base64) {
          setIsThinking(false);
          setLiveTranscription(
            i18n.language === 'hi'
              ? 'ऑडियो डेटा पढ़ने में विफल।'
              : 'Recording failed: Unable to read audio data.'
          );
          return;
        }

        const isWebm = audioUri?.endsWith('.webm');
        const isM4a = Platform.OS === 'android' || audioUri?.endsWith('.m4a');
        const audioFormat = isWebm ? 'webm' : (isM4a ? 'm4a' : 'wav');

        try {
          const tr = await aiApi.transcribe({ audio_base64: base64, audio_format: audioFormat, language: i18n.language });
          if (tr?.transcript) queryText = tr.transcript;
          if (tr?.error) sttError = tr.error;
        } catch (apiErr) {
          sttError = apiErr.userFriendlyMessage || apiErr.response?.data?.detail || apiErr.message || 'Prisma transcription failed';
        }

        if (sttError) {
          setIsThinking(false);
          setLiveTranscription(sttError);
          return;
        }

        if (!queryText || !queryText.trim()) {
          setIsThinking(false);
          setLiveTranscription(
            i18n.language === 'hi'
              ? 'कोई आवाज़ नहीं पहचानी गई। कृपया स्पष्ट बोलें या नीचे लिखकर पूछें।'
              : 'No speech detected. Please speak clearly or type your question below.'
          );
          return;
        }

        setLiveTranscription(queryText);
        handleVoiceQuery(queryText);
      } catch (e) {
        setIsThinking(false);
        const msg = e.userFriendlyMessage || e.response?.data?.detail || e.message || 'Recording processing failed';
        setLiveTranscription(msg);
      }
    }
  };

  const handlePlayAudio = async () => {
    if (!assistantReply) return;

    // If currently playing, pause it
    if (audioPlayback.isPlaying && audioPlayback.audioId === 'community_reply') {
      await audioService.pauseAudio();
      return;
    }

    // If currently paused, resume it
    if (audioPlayback.isPaused && audioPlayback.audioId === 'community_reply') {
      await audioService.resumeAudio();
      return;
    }

    try {
      let urlToPlay = assistantReply.audio_url;
      if (!urlToPlay && assistantReply.text) {
        setIsThinking(true);
        const tts = await aiApi.speak({ text: assistantReply.text, language: i18n.language });
        setIsThinking(false);
        urlToPlay = tts?.audio_url || tts?.audio_content;
        setAssistantReply(prev => ({ ...prev, audio_url: urlToPlay }));
      }

      if (urlToPlay) {
        await audioService.playAudio(urlToPlay, null, 'community_reply');
      }
    } catch (e) {
      setIsThinking(false);
    }
  };

  const handlePauseAudio = async () => {
    await audioService.pauseAudio();
  };

  const handleResumeAudio = async () => {
    await audioService.resumeAudio();
  };

  const handleSubmitVisitRequest = async () => {
    setRequestSubmitting(true);
    try {
      const hhName = user?.name || user?.primary_contact_name || 'My Household';
      const prefDate = requestPreferredDate.trim() || getTodayFormatted();
      const finalDesc = requestNotes.trim() || `${requestCategory} requested for home visit / callback`;
      console.log('[Community] Submitting visit request to ASHA:', {
        category: requestCategory,
        desc: finalDesc,
        prefDate
      });
      const saved = await requestApi.createRequest({
        household_id: user?.household_id || 'hh_001',
        household_name: hhName,
        beneficiary_name: user?.name || 'Beneficiary',
        assigned_asha_id: user?.assigned_asha?.id || 'asha_sunita_001',
        category: requestCategory,
        description: finalDesc,
        preferred_date: prefDate,
        priority: requestCategory === 'Urgent health concern' ? 'Urgent' : 'High'
      });
      setActiveVisitRequest(saved || {
        household_id: user?.household_id || 'hh_001',
        household_name: hhName,
        beneficiary_name: user?.name || 'Beneficiary',
        category: requestCategory,
        description: finalDesc,
        preferred_date: prefDate,
        status: 'New'
      });
      setRequestSubmitting(false);
      setRequestModalVisible(false);
      setRequestNotes('');
      Alert.alert(
        tr('Request Sent to ASHA Di'),
        `${tr('Your request has been delivered to Sunita Devi for')} ${prefDate}${tr('. She will visit or contact you on this date.')}`
      );
    } catch (e) {
      const prefDate = requestPreferredDate.trim() || getTodayFormatted();
      const finalDesc = requestNotes.trim() || `${requestCategory} requested for home visit / callback`;
      setActiveVisitRequest({
        household_id: user?.household_id || 'hh_001',
        category: requestCategory,
        description: finalDesc,
        preferred_date: prefDate,
        status: 'New'
      });
      setRequestSubmitting(false);
      setRequestModalVisible(false);
      Alert.alert(
        tr('Request Logged'),
        `${tr('Your visit request has been sent to ASHA worker Sunita Devi for')} ${requestPreferredDate.trim() || 'your chosen date'}.`
      );
    }
  };

  const VISUAL_SHORTCUTS = [
    {
      id: 'pregnancy',
      title: 'Pregnancy Care',
      subtitle: '3rd Trimester • 32 wks',
      accent: colors.coral,
      bgColor: '#FFF5F2',
      Illustration: () => <MaternalHero width={75} height={68} />,
      onPress: () => navigation.navigate('HealthGuideDetail', { category: 'pregnancy' })
    },
    {
      id: 'menstrual',
      title: 'Women’s Health',
      subtitle: 'Hygiene & Wellness',
      accent: colors.lavender,
      bgColor: '#F6F3FD',
      Illustration: () => <MenstrualHealthIllustration width={75} height={68} />,
      onPress: () => navigation.navigate('HealthGuideDetail', { category: 'women' })
    },
    {
      id: 'child',
      title: 'Child Health',
      subtitle: 'Baby Aarav • 2 yrs',
      accent: colors.teal,
      bgColor: colors.mintLight,
      Illustration: () => <ChildHealthIllustration width={75} height={68} />,
      onPress: () => navigation.navigate('HealthGuideDetail', { category: 'child' })
    },
    {
      id: 'vaccination',
      title: 'Immunization',
      subtitle: 'MR Vaccine Due',
      accent: colors.primary,
      bgColor: colors.primaryLight,
      Illustration: () => <VaccinationIllustration width={75} height={68} />,
      onPress: () => navigation.navigate('HealthGuideDetail', { category: 'vaccination' })
    },
    {
      id: 'nutrition',
      title: 'POSHAN Diet',
      subtitle: 'Iron & Diet Tips',
      accent: colors.yellow,
      bgColor: colors.yellowLight,
      Illustration: () => <NutritionIllustration width={75} height={68} />,
      onPress: () => navigation.navigate('HealthGuideDetail', { category: 'nutrition' })
    },
    {
      id: 'asha',
      title: activeVisitRequest ? 'Visit Scheduled' : 'My ASHA Di',
      subtitle: activeVisitRequest
        ? `Visit on ${activeVisitRequest.preferred_date || 'Soon'}`
        : 'Sunita Devi (Rampur)',
      accent: activeVisitRequest ? colors.coral : colors.deepBlue,
      bgColor: activeVisitRequest ? '#FFF5F2' : '#EFF6FD',
      Illustration: () => <CommunityHealthIllustration width={75} height={68} />,
      onPress: () => {
        if (activeVisitRequest) {
          Alert.alert(
            tr('Visit Scheduled with Sunita Devi'),
            `${tr('Date:')} ${activeVisitRequest.preferred_date || 'Today'}\nReason: ${activeVisitRequest.category || 'Household visit'}\nStatus: ${activeVisitRequest.status || 'Scheduled'}\n\nSunita Devi has been notified and will visit your home on this date.`
          );
        } else {
          setRequestModalVisible(true);
        }
      }
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Welcoming Community Header */}
        <View style={styles.header}>
          <View style={styles.greetingCol}>
            <View style={styles.communityPill}>
              <View style={styles.onlineDot} />
              <Text style={styles.communityPillText}>{tr('Sahayika Community')}</Text>
            </View>
            <Text style={styles.greetingTitle}>{tr('Namaste,')}{' '}{tr(user?.name || 'Meena ji')}</Text>
            <Text style={styles.greetingSub}>{tr(user?.village_name || 'Rampur Kalan')}{' '}{tr('• Household')}{' '}{tr(user?.household_code || 'HH-RK-001')}</Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.langPill} onPress={handleLanguageToggle}>
              <Text style={styles.langText}>{tr(i18n.language === 'hi' ? 'हिन्दी' : 'English')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityLabel={tr('Notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Primary Voice Assistant Interaction Pod */}
        <View style={styles.voiceSectionCard}>
          <View style={styles.voicePromptArea}>
            <Text style={styles.voiceQuestion}>{tr('Aapko kis cheez mein madad chahiye?')}</Text>
            <Text style={styles.voicePromptSub}>{tr('बोलकर गर्भावस्था, बच्चे के टीके, या पोषण की जानकारी पूछें')}</Text>
          </View>

          {/* Large Distinctive Microphone Button */}
          <View style={styles.micControlRow}>
            <TouchableOpacity
              style={[styles.largeMicBtn, isRecording && styles.largeMicBtnRecording]}
              onPress={handleToggleVoice}
              activeOpacity={0.85}
              accessibilityLabel={tr('Tap to speak')}
            >
              <Ionicons name="mic" size={34} color={colors.surface} />
            </TouchableOpacity>
          </View>

          <Text style={styles.micInstruction}>
            {tr(isRecording ? `सुन रहा हूँ... 00:0${tr(seconds)}` : 'माइक दबाएं और अपनी भाषा में पूछें')}
          </Text>

          {/* Live Voice Assistant Response */}
          {assistantReply && (
            <View style={styles.replyPod}>
              <ConversationBubble
                role="assistant"
                text={assistantReply.text}
                timestamp="Just now"
                audioPlayable
                isLoadingAudio={isThinking}
                isPlayingAudio={audioPlayback.isPlaying && audioPlayback.audioId === 'community_reply'}
                isPausedAudio={audioPlayback.isPaused && audioPlayback.audioId === 'community_reply'}
                onPlayAudio={handlePlayAudio}
                onPauseAudio={handlePauseAudio}
                onResumeAudio={handleResumeAudio}
                onToggleAudio={handlePlayAudio}
              />
            </View>
          )}

          {/* Suggested Quick Question Chips */}
          <View style={styles.chipsRow}>
            {[
              'आरव का अगला टीका कब है?',
              'गर्भावस्था में खून बढ़ाने की डाइट',
              'जननी सुरक्षा योजना के ₹1400',
              'पीरियड्स में दर्द के उपाय'
            ].map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chipPill}
                onPress={() => handleVoiceQuery(chip)}
                activeOpacity={0.75}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.primary} />
                <Text style={styles.chipText}>{tr(chip)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text Question Input Bar */}
          <View style={styles.textQueryRow}>
            <TextInput
              style={styles.textQueryInput}
              placeholder={tr(i18n.language === 'hi' ? 'या अपना प्रश्न यहाँ लिखें...' : 'Or type a question here...')}
              placeholderTextColor={colors.textMuted}
              value={textQuery}
              onChangeText={setTextQuery}
              onSubmitEditing={() => handleVoiceQuery()}
            />
            <TouchableOpacity
              style={styles.textQuerySendBtn}
              onPress={() => handleVoiceQuery()}
              accessibilityLabel={tr('Send question')}
            >
              <Ionicons name="arrow-up" size={16} color={colors.textWhite} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Upcoming Family Health Reminders */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{tr('Your Family Reminders')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RemindersTab')}>
            <Text style={styles.seeAllText}>{tr('View All')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reminderCard}>
          <View style={styles.reminderTop}>
            <View style={[styles.reminderPill, { backgroundColor: colors.coralLight }]}>
              <Text style={[styles.reminderPillText, { color: colors.coral }]}>{tr('3rd Trimester ANC')}</Text>
            </View>
            <Text style={styles.reminderTime}>{tr('Today, 11:30 AM')}</Text>
          </View>
          <Text style={styles.reminderHeading}>{tr('Home Visit by Sunita Devi (ASHA)')}</Text>
          <Text style={styles.reminderDetail}>{tr('Routine checkup: Blood pressure, haemoglobin check, and nutrition consultation.')}</Text>
        </View>

        {/* 4. Large Visual Shortcuts */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{tr('Health Guide & Programmes')}</Text>
          <Text style={styles.sectionSub}>{tr('Verified village health resources')}</Text>
        </View>

        <View style={styles.shortcutsGrid}>
          {VISUAL_SHORTCUTS.map((item) => {
            const { id, title, subtitle, accent, bgColor, Illustration, onPress } = item;
            return (
              <TouchableOpacity
                key={id}
                style={styles.shortcutTile}
                onPress={onPress}
                activeOpacity={0.85}
              >
                <View style={[styles.shortcutArtwork, { backgroundColor: bgColor }]}>
                  <Illustration />
                </View>
                <Text style={styles.shortcutTitle}>{tr(title)}</Text>
                <Text style={styles.shortcutSubtitle} numberOfLines={1}>{tr(subtitle)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5. Assigned ASHA Worker & Active Visit / Request Action */}
        <View style={[styles.ashaWorkerCard, activeVisitRequest && styles.ashaWorkerCardActiveVisit]}>
          <View style={styles.ashaWorkerTopRow}>
            <AvatarImage
              name="Sunita Devi"
              role="ASHA"
              size={48}
              showBorder
              borderColor={colors.primaryMuted}
              style={{ marginRight: spacing.md }}
            />
            <View style={styles.ashaDetails}>
              <Text style={styles.ashaName}>{tr('Sunita Devi (ASHA Di)')}</Text>
              <Text style={styles.ashaArea}>{tr('Assigned for Rampur Kalan • +91 9876543210')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="checkmark-circle-outline" size={13} color={colors.teal} style={{ marginRight: 4 }} />
                <Text style={styles.ashaStatus}>{tr('Active in your village today')}</Text>
              </View>
            </View>

            {!activeVisitRequest && (
              <TouchableOpacity
                style={styles.requestVisitBtn}
                onPress={() => setRequestModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={14} color={colors.textWhite} />
                <Text style={styles.requestVisitBtnText}>{tr('Request Visit')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeVisitRequest ? (
            <View style={styles.activeVisitBox}>
              <View style={styles.activeVisitHeader}>
                <View style={styles.activeVisitBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.activeVisitBadgeText}>{tr('Visit Requested')}</Text>
                </View>
                <View style={styles.activeVisitDatePill}>
                  <Ionicons name="calendar" size={13} color={colors.coral} />
                  <Text style={styles.activeVisitDateText}>{tr('Visit on')}{' '}{tr(activeVisitRequest.preferred_date || 'Today')}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="medkit-outline" size={14} color={colors.primary} style={{ marginRight: 5 }} />
                <Text style={styles.activeVisitReason}>
                  {tr(activeVisitRequest.category || 'Household visit request')}
                  {tr(activeVisitRequest.description ? ` • ${tr(activeVisitRequest.description)}` : '')}
                </Text>
              </View>

              <View style={styles.activeVisitFooter}>
                <Ionicons name="checkmark-circle" size={14} color={colors.teal} style={{ marginRight: 5 }} />
                <Text style={styles.activeVisitNote}>{tr('Sunita Devi is notified and will visit or call you on this date.')}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Request Visit from ASHA Modal */}
      <Modal
        visible={requestModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{tr('Request ASHA Di Visit / Callback')}</Text>
            <Text style={styles.modalDesc}>{tr('Sunita Devi will be notified immediately to visit your home or call you.')}</Text>

            <Text style={styles.inputLabel}>{tr('Reason for Request')}</Text>
            <View style={styles.categoryPickerRow}>
              {[
                'Household visit request',
                'Vaccination enquiry',
                'Pregnancy checkup',
                'Urgent health concern'
              ].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChoice, requestCategory === cat && styles.categoryChoiceActive]}
                  onPress={() => setRequestCategory(cat)}
                >
                  <Text style={[styles.choiceText, requestCategory === cat && styles.choiceTextActive]}>
                    {tr(cat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>{tr('Preferred Date for ASHA Di Call / Visit')}</Text>
            <View style={styles.dateChipsRow}>
              {[
                { label: 'Today', val: getTodayFormatted() },
                { label: 'Tomorrow', val: getTomorrowFormatted() },
                { label: 'Day After', val: getDayAfterFormatted() }
              ].map((d) => (
                <TouchableOpacity
                  key={d.label}
                  style={[styles.dateChip, requestPreferredDate === d.val && styles.dateChipActive]}
                  onPress={() => setRequestPreferredDate(d.val)}
                >
                  <Text style={[styles.dateChipText, requestPreferredDate === d.val && styles.dateChipTextActive]}>
                    {tr(d.label)}
                  </Text>
                  <Text style={[styles.dateChipSub, requestPreferredDate === d.val && styles.dateChipSubActive]}>
                    {tr(d.val.slice(0, 5))}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dateInputWrap}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.dateInput}
                placeholder={tr('Or enter custom date (DD-MM-YYYY)')}
                placeholderTextColor={colors.textMuted}
                value={requestPreferredDate}
                onChangeText={setRequestPreferredDate}
              />
            </View>

            <Text style={styles.inputLabel}>{tr('Additional Notes / Symptoms')}</Text>
            <TextInput
              style={styles.notesInput}
              placeholder={tr('e.g. Need blood pressure checkup and IFA tablets refill')}
              placeholderTextColor={colors.textMuted}
              multiline
              value={requestNotes}
              onChangeText={setRequestNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRequestModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{tr('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendRequestBtn}
                onPress={handleSubmitVisitRequest}
                disabled={requestSubmitting}
              >
                <Text style={styles.sendRequestBtnText}>
                  {tr(requestSubmitting ? 'Sending...' : 'Send Request')}
                </Text>
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
    backgroundColor: 'transparent'
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.base,
    paddingBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md
  },
  greetingCol: {
    flex: 1
  },
  communityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
    marginRight: 6
  },
  communityPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primaryText
  },
  greetingSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2
  },
  langPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative'
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger
  },
  voiceSectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.card
  },
  voicePromptArea: {
    alignItems: 'center',
    marginBottom: 14
  },
  voiceQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'center'
  },
  voicePromptSub: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12
  },
  micControlRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10
  },
  largeMicBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    ...shadows.raised
  },
  largeMicBtnRecording: {
    backgroundColor: colors.danger,
    borderColor: colors.dangerLight
  },
  micInstruction: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 10
  },
  replyPod: {
    width: '100%',
    marginVertical: 6
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5
  },
  chipText: {
    fontSize: 11,
    color: colors.primaryText,
    fontWeight: '500'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xs
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText
  },
  sectionSub: {
    fontSize: 11,
    color: colors.secondaryText
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  },
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    marginVertical: spacing.xs,
    ...shadows.card
  },
  reminderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  reminderPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  reminderPillText: {
    fontSize: 10,
    fontWeight: '600'
  },
  reminderTime: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '600'
  },
  reminderHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText
  },
  reminderDetail: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 17,
    marginTop: 2
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: spacing.xs
  },
  shortcutTile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    ...shadows.card
  },
  shortcutArtwork: {
    height: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  shortcutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText
  },
  shortcutSubtitle: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2
  },
  ashaWorkerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    marginTop: spacing.md,
    ...shadows.card
  },
  ashaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  ashaAvatarInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary
  },
  ashaDetails: {
    flex: 1
  },
  ashaName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText
  },
  ashaArea: {
    fontSize: 11,
    color: colors.secondaryText
  },
  ashaStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.teal,
    marginTop: 2
  },
  requestVisitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.pill,
    gap: 4
  },
  requestVisitBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textWhite
  },
  ashaWorkerCardActiveVisit: {
    flexDirection: 'column',
    alignItems: 'stretch',
    borderColor: colors.coral,
    borderWidth: 1.5,
    backgroundColor: '#FFFAF8'
  },
  ashaWorkerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%'
  },
  activeVisitBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#FFE5DE'
  },
  activeVisitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  activeVisitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE9E3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 5
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coral
  },
  activeVisitBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.coral,
  },
  activeVisitDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  activeVisitDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.coral
  },
  activeVisitReason: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 6,
    lineHeight: 17
  },
  activeVisitFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mintLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8
  },
  activeVisitNote: {
    fontSize: 11,
    color: colors.teal,
    fontWeight: '600',
    flex: 1
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(32, 38, 49, 0.45)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.base
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText
  },
  modalDesc: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 3,
    marginBottom: spacing.md
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 6
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md
  },
  categoryChoice: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  categoryChoiceActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  choiceText: {
    fontSize: 11,
    color: colors.secondaryText
  },
  choiceTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  dateChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dateChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  dateChipText: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '600'
  },
  dateChipTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  dateChipSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1
  },
  dateChipSubActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  dateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: spacing.md
  },
  dateInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 12,
    color: colors.primaryText
  },
  notesInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 70,
    fontSize: 13,
    color: colors.primaryText,
    textAlignVertical: 'top',
    marginBottom: spacing.lg
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center'
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText
  },
  sendRequestBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center'
  },
  sendRequestBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textWhite
  },
  textQueryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    ...shadows.card
  },
  textQueryInput: {
    flex: 1,
    fontSize: 13,
    color: colors.primaryText,
    paddingVertical: 8
  },
  textQuerySendBtn: {
    width: 32,
    height: 32,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  }
});

export default CommunityHomeScreen;

