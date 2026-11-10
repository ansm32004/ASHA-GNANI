import { tr } from '../../localisation/tr';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Platform, Alert, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { ConversationBubble } from '../../components/visual/ConversationBubble';
import { VectorCategoryIcon } from '../../components/illustrations/VectorCategoryIcon';
import { aiApi } from '../../services/api/aiApi';
import { audioService, useAudioPlayback } from '../../services/audio/audioService';
import { useLanguageStore } from '../../store/languageStore';
import { useTranslation } from 'react-i18next';

export const VoiceAssistantScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { uiLanguage, setUiLanguage } = useLanguageStore();

  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  const [seconds, setSeconds] = useState(0);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [textQuery, setTextQuery] = useState('');
  const [loadingAudioId, setLoadingAudioId] = useState(null);

  const audioPlayback = useAudioPlayback();

  // Scroll and Animation References
  const scrollViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const waveAnim1 = useRef(new Animated.Value(0.4)).current;
  const waveAnim2 = useRef(new Animated.Value(1.0)).current;
  const waveAnim3 = useRef(new Animated.Value(0.7)).current;

  // Smooth scroll to bottom where question & answer appear
  const scrollToQuestion = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 120);
  };

  // Mic pulse, ripple, and voice wave animation when recording
  useEffect(() => {
    let pulseLoop = null;
    let waveLoop = null;

    if (voiceState === 'listening') {
      pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 650,
              useNativeDriver: true
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 650,
              useNativeDriver: true
            })
          ]),
          Animated.sequence([
            Animated.parallel([
              Animated.timing(rippleAnim, {
                toValue: 1.6,
                duration: 1300,
                useNativeDriver: true
              }),
              Animated.timing(rippleOpacity, {
                toValue: 0,
                duration: 1300,
                useNativeDriver: true
              })
            ]),
            Animated.parallel([
              Animated.timing(rippleAnim, {
                toValue: 1,
                duration: 0,
                useNativeDriver: true
              }),
              Animated.timing(rippleOpacity, {
                toValue: 0.7,
                duration: 0,
                useNativeDriver: true
              })
            ])
          ])
        ])
      );
      pulseLoop.start();

      waveLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(waveAnim1, { toValue: 1.4, duration: 240, useNativeDriver: true }),
            Animated.timing(waveAnim2, { toValue: 0.4, duration: 240, useNativeDriver: true }),
            Animated.timing(waveAnim3, { toValue: 1.2, duration: 240, useNativeDriver: true })
          ]),
          Animated.parallel([
            Animated.timing(waveAnim1, { toValue: 0.4, duration: 240, useNativeDriver: true }),
            Animated.timing(waveAnim2, { toValue: 1.5, duration: 240, useNativeDriver: true }),
            Animated.timing(waveAnim3, { toValue: 0.5, duration: 240, useNativeDriver: true })
          ])
        ])
      );
      waveLoop.start();
    } else {
      pulseAnim.setValue(1);
      rippleAnim.setValue(1);
      rippleOpacity.setValue(0);
      waveAnim1.setValue(0.4);
      waveAnim2.setValue(1.0);
      waveAnim3.setValue(0.7);
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
      if (waveLoop) waveLoop.stop();
    };
  }, [voiceState]);

  // Stop playback when navigating away or unmounting
  useEffect(() => {
    const unsubBlur = navigation.addListener('blur', () => {
      audioService.stopAudio();
    });
    return () => {
      unsubBlur();
      audioService.stopAudio();
    };
  }, [navigation]);

  // Synchronize voice state if audio completes or is paused/stopped externally
  useEffect(() => {
    if ((audioPlayback.isIdle || audioPlayback.isPaused) && voiceState === 'speaking') {
      setVoiceState('idle');
    }
  }, [audioPlayback.isIdle, audioPlayback.isPaused]);

  // Elapsed recording seconds timer
  useEffect(() => {
    let timer;
    if (voiceState === 'listening') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [voiceState]);

  const GREETING_AUDIO_HI = '/api/v1/ai/audio/e36fe86111fe134de3ace5342e507b40.wav';
  const GREETING_AUDIO_EN = '/api/v1/ai/audio/40a769cd08e733fd395f062541796b5b.wav';

  const [conversation, setConversation] = useState([
    {
      id: 'msg-0',
      role: 'assistant',
      text:
        i18n.language === 'hi'
          ? 'नमस्ते सुनीता जी! आप बोलकर आज के विजिट, गर्भवती महिलाओं की लिस्ट, टीकाकरण या जेएसवाई योजना की जानकारी पूछ सकती हैं।'
          : "Hello Sunita ji! Speak naturally to ask about today's visits, pregnant mothers, vaccination camps, or JSY guidelines.",
      audioUrl: i18n.language === 'hi' ? GREETING_AUDIO_HI : GREETING_AUDIO_EN,
      timestamp: 'Just now',
      actions: ["Today's Visits", 'ANC Checkup List', 'Vaccination Schedule']
    }
  ]);

  // Automatically scroll down whenever new conversation bubble is added
  useEffect(() => {
    if (conversation && conversation.length > 1 && voiceState !== 'listening') {
      scrollToQuestion(true);
    }
  }, [conversation?.length]);

  // Pre-fetch initial greeting TTS audio if missing
  useEffect(() => {
    const initialMsg = conversation[0];
    if (initialMsg && !initialMsg.audioUrl && initialMsg.text) {
      aiApi.speak({ text: initialMsg.text, language: i18n.language })
        .then((res) => {
          const url = res?.audio_url || res?.audio_content;
          if (url) {
            setConversation((prev) =>
              prev.map((m) => (m.id === initialMsg.id ? { ...m, audioUrl: url } : m))
            );
          }
        })
        .catch(() => {});
    }
  }, [i18n.language]);

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
    setUiLanguage(nextLang);
    const nextAudio = nextLang === 'hi' ? GREETING_AUDIO_HI : GREETING_AUDIO_EN;
    const nextText =
      nextLang === 'hi'
        ? 'नमस्ते सुनीता जी! आप बोलकर आज के विजिट, गर्भवती महिलाओं की लिस्ट, टीकाकरण या जेएसवाई योजना की जानकारी पूछ सकती हैं।'
        : "Hello Sunita ji! Speak naturally to ask about today's visits, pregnant mothers, vaccination camps, or JSY guidelines.";
    setConversation((prev) =>
      prev.map((m) => (m.id === 'msg-0' ? { ...m, text: nextText, audioUrl: nextAudio } : m))
    );
  };

  const handleAskQuestion = async (queryText, voiceEnabled = false) => {
    const q = (queryText || textQuery || liveTranscription).trim();
    if (!q) return;

    // Immediately stop and unload any active or paused audio playback
    if (audioPlayback.isPlaying || audioPlayback.isPaused || voiceState === 'speaking') {
      try {
        await audioService.stopAudio();
      } catch (_) {}
    }

    setTextQuery('');
    setLiveTranscription('');
    setVoiceState('processing');

    const userMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: 'Just now'
    };

    setConversation((prev) => [...prev, userMessage]);
    scrollToQuestion(true);

    try {
      const res = await aiApi.queryAssistant(q, i18n.language, voiceEnabled);
      setVoiceState('idle');
      const asstMsg = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: res.reply_text,
        timestamp: 'Just now',
        actions: res.suggested_actions || [],
        audioUrl: res.audio_url || null
      };
      setConversation((prev) => [...prev, asstMsg]);
      scrollToQuestion(true);

      // Pre-fetch TTS audio in background if not already present
      if (!res.audio_url && res.reply_text) {
        aiApi.speak({ text: res.reply_text, language: i18n.language })
          .then((speakRes) => {
            const url = speakRes?.audio_url || speakRes?.audio_content;
            if (url) {
              setConversation((prev) =>
                prev.map((m) => (m.id === asstMsg.id ? { ...m, audioUrl: url } : m))
              );
              if (voiceEnabled) {
                handlePlayAudio(url, res.reply_text, asstMsg.id);
              }
            }
          })
          .catch(() => {});
      }

      if (voiceEnabled && res.audio_url) {
        handlePlayAudio(res.audio_url, res.reply_text, asstMsg.id);
      }
    } catch (e) {
      setVoiceState('idle');
      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text:
            i18n.language === 'hi'
              ? 'माफ़ कीजिए, सहायिका सर्वर से संपर्क नहीं हो पाया। कृपया इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।'
              : 'Sorry, could not connect to SAHAYIKA server. Please check your connection and try again.',
          timestamp: 'Just now',
          actions: ['Retry']
        }
      ]);
    }
  };

  const handleToggleVoice = async () => {
    // 1. If currently recording speech, finish recording and process
    if (voiceState === 'listening') {
      setVoiceState('processing');
      try {
        const recResult = await audioService.stopRecording();
        const audioUri = typeof recResult === 'object' ? recResult?.uri : recResult;
        let queryText = '';
        let sttError = null;

        if (!audioUri) {
          setVoiceState('error');
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
          setVoiceState('error');
          setLiveTranscription(
            i18n.language === 'hi'
              ? 'ऑडियो डेटा पढ़ने में विफल।'
              : 'Recording failed: Unable to read audio data.'
          );
          return;
        }

        try {
          const isWebm = audioUri?.endsWith('.webm');
          const isM4a = Platform.OS === 'android' || audioUri?.endsWith('.m4a');
          const audioFormat = isWebm ? 'webm' : (isM4a ? 'm4a' : 'wav');
          const tr = await aiApi.transcribe({ audio_base64: base64, audio_format: audioFormat, language: i18n.language });
          if (tr?.transcript) queryText = tr.transcript;
          if (tr?.error) sttError = tr.error;
        } catch (e) {
          sttError = e.userFriendlyMessage || e.response?.data?.detail || e.message || 'Prisma transcription failed';
        }

        if (sttError) {
          setVoiceState('error');
          setLiveTranscription(sttError);
          return;
        }

        if (!queryText || !queryText.trim()) {
          setVoiceState('idle');
          setLiveTranscription(
            i18n.language === 'hi'
              ? 'कोई आवाज़ नहीं पहचानी गई। कृपया स्पष्ट बोलें या लिखकर पूछें।'
              : 'No speech detected. Please speak clearly or type your question.'
          );
          return;
        }
        handleAskQuestion(queryText, true);
      } catch (procErr) {
        setVoiceState('error');
        setLiveTranscription(
          procErr.userFriendlyMessage || procErr.message || 'Recording processing failed'
        );
      }
      return;
    }

    // 2. If AI is currently generating response, ignore mic taps
    if (voiceState === 'processing') {
      return;
    }

    // 3. If audio playback is active or paused, stop and unload it completely
    // so the user can immediately record a new question
    if (audioPlayback.isPlaying || audioPlayback.isPaused || voiceState === 'speaking') {
      try {
        await audioService.stopAudio();
      } catch (_) {}
    }

    // 4. Start recording new question
    try {
      const started = await audioService.startRecording();
      if (started) {
        setVoiceState('listening');
        setSeconds(0);
        setLiveTranscription(
          i18n.language === 'hi' ? 'बोलिए... (सुन रहे हैं)' : 'Listening... Speak now'
        );
      } else {
        setVoiceState('error');
        setLiveTranscription(
          i18n.language === 'hi'
            ? 'रिकॉर्डर प्रारंभ करने में विफल। कृपया पुनः प्रयास करें।'
            : 'Recorder initialization failed. Please try again.'
        );
      }
    } catch (err) {
      setVoiceState('error');
      setLiveTranscription(
        err.permanentlyDenied
          ? (i18n.language === 'hi' ? 'माइक्रोफ़ोन अनुमति हमेशा के लिए अस्वीकृत है। सेटिंग्स में चालू करें।' : 'Microphone permission permanently denied. Enable in Settings.')
          : (i18n.language === 'hi' ? 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया अनुमति दें।' : 'Microphone permission denied. Please allow microphone access.')
      );
    }
  };

  const handlePlayAudio = async (audioUrl = null, text = null, msgId = null) => {
    const targetId = msgId || audioUrl || text;
    const currentStatus = audioService.getPlaybackStatus();
    const isSameAudio = Boolean(currentStatus.audioId && currentStatus.audioId === targetId);

    // If currently playing this audio, pause it immediately
    if ((currentStatus.isPlaying || voiceState === 'speaking') && !currentStatus.isPaused && isSameAudio) {
      await audioService.pauseAudio();
      setVoiceState('idle');
      return;
    }

    // If currently paused on this audio, resume it immediately
    if (currentStatus.isPaused && isSameAudio) {
      await audioService.resumeAudio();
      setVoiceState('speaking');
      return;
    }

    let urlToPlay = audioUrl;
    if (!urlToPlay && text) {
      setLoadingAudioId(targetId);
      try {
        const tts = await aiApi.speak({ text, language: i18n.language });
        urlToPlay = tts?.audio_url || tts?.audio_content;
        if (urlToPlay && msgId) {
          // Cache directly on conversation item so subsequent plays are 0ms!
          setConversation((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, audioUrl: urlToPlay } : m))
          );
        }
      } catch (e) {
        // non-fatal
      } finally {
        setLoadingAudioId(null);
      }
    }

    if (urlToPlay) {
      setVoiceState('speaking');
      await audioService.playAudio(
        urlToPlay,
        () => {
          setVoiceState('idle');
        },
        targetId
      );
    } else {
      setVoiceState('idle');
      Alert.alert(
        tr(i18n.language === 'hi' ? 'ऑडियो अनुपलब्ध' : 'Audio Unavailable'),
        tr(i18n.language === 'hi'
          ? 'इस संदेश का ऑडियो उत्पन्न नहीं हो सका। कृपया पुनः प्रयास करें।'
          : 'Could not generate speech audio for this message. Please try again.')
      );
    }
  };

  const handlePauseAudio = async () => {
    await audioService.pauseAudio();
    setVoiceState('idle');
  };

  const handleResumeAudio = async () => {
    await audioService.resumeAudio();
    setVoiceState('speaking');
  };

  const handleToggleAudio = async (audioUrl = null, text = null, msgId = null) => {
    const targetId = msgId || audioUrl || text;
    const currentStatus = audioService.getPlaybackStatus();
    const isSameAudio = !currentStatus.audioId || currentStatus.audioId === targetId;

    if ((currentStatus.isPlaying || voiceState === 'speaking') && !currentStatus.isPaused && isSameAudio) {
      await audioService.pauseAudio();
      setVoiceState('idle');
      return;
    }
    if (currentStatus.isPaused && isSameAudio) {
      await audioService.resumeAudio();
      setVoiceState('speaking');
      return;
    }
    await handlePlayAudio(audioUrl, text, msgId);
  };

  const SUGGESTED_PROMPTS = [
    { label: "आज के फील्ड विजिट? (Today's Visits)", query: 'मुझे आज किन घरों में जाना है?', type: 'household' },
    { label: 'मीना देवी का ANC चेकअप', query: 'मीना देवी का 3rd Trimester ANC चेकअप कब है?', type: 'maternal' },
    { label: 'अगला टीकाकरण कैंप कब है?', query: 'अगला वैक्सीनेशन कैंप कब है?', type: 'vaccin' },
    { label: 'जेएसवाई योजना के लाभ', query: 'जननी सुरक्षा योजना में कितने पैसे मिलते हैं?', type: 'nutri' }
  ];

  const getStatePill = () => {
    if (voiceState === 'listening') {
      return {
        text: `Listening... 00:0${seconds}`,
        bg: colors.dangerLight,
        color: colors.danger,
        dot: colors.danger
      };
    }
    if (voiceState === 'processing') {
      return {
        text: i18n.language === 'hi' ? 'एआई द्वारा उत्तर तैयार हो रहा है...' : 'Analyzing with AI...',
        bg: colors.warningLight,
        color: colors.warning,
        dot: colors.warning
      };
    }
    if (audioPlayback.isPaused) {
      return {
        text: i18n.language === 'hi' ? 'आवाज़ रुकी हुई है (माइक दबाकर नया प्रश्न पूछें)' : 'Voice paused (tap mic to ask new question)',
        bg: '#FEF3C7',
        color: '#B45309',
        dot: '#D97706'
      };
    }
    if (voiceState === 'speaking' || audioPlayback.isPlaying) {
      return {
        text: i18n.language === 'hi' ? 'उत्तर सुनाया जा रहा है...' : 'Playing voice response...',
        bg: colors.tealLight,
        color: colors.teal,
        dot: colors.teal
      };
    }
    if (voiceState === 'error') {
      return {
        text: i18n.language === 'hi' ? 'माइक्रोफ़ोन पुनः प्रयास करें' : 'Retry microphone',
        bg: colors.dangerLight,
        color: colors.danger,
        dot: colors.danger
      };
    }
    return {
      text: i18n.language === 'hi' ? 'हिंदी / अंग्रेज़ी में बोलने के लिए माइक दबाएँ' : 'Tap mic to speak in Hindi/English',
      bg: colors.surfaceSecondary,
      color: colors.secondaryText,
      dot: colors.primary
    };
  };

  const stateInfo = getStatePill();

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title={t('assistant.title') || 'Voice Companion'}
        subtitle="Voice visit logging & health protocol advice"
        showBack={false}
        currentLanguage={i18n.language}
        onPressLanguage={handleLanguageToggle}
      />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (voiceState === 'processing') {
            scrollToQuestion(true);
          }
        }}
      >
        {/* Compact Voice Interaction Pod (Space-Efficient & Balanced) */}
        <View style={styles.compactVoicePod}>
          {/* Status Capsule Indicator */}
          <View style={[styles.statusCapsule, { backgroundColor: stateInfo.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: stateInfo.dot }]} />
            <Text style={[styles.statusCapsuleText, { color: stateInfo.color }]}>
              {tr(stateInfo.text)}
            </Text>
          </View>

          {/* Animated Mic Container with Ripple Wave */}
          <View style={styles.micContainer}>
            <Animated.View
              style={[
                styles.micRipple,
                {
                  transform: [{ scale: rippleAnim }],
                  opacity: rippleOpacity,
                  backgroundColor: voiceState === 'listening' ? colors.danger : colors.primary
                }
              ]}
            />
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.compactMicBtn,
                  voiceState === 'listening' && styles.micBtnListening,
                  voiceState === 'processing' && styles.micBtnProcessing
                ]}
                onPress={handleToggleVoice}
                activeOpacity={0.85}
                accessibilityLabel={tr('Microphone control')}
              >
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2Z"
                    fill={colors.surface}
                  />
                  <Path
                    d="M19 10V11C19 14.53 16.39 17.44 13 17.93V21H11V17.93C7.61 17.44 5 14.53 5 11V10H7V11C7 13.76 9.24 16 12 16C14.76 16 17 13.76 17 11V10H19Z"
                    fill={colors.surface}
                  />
                </Svg>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Dynamic Voice Waveform Animation when Speaking */}
          {voiceState === 'listening' && (
            <View style={styles.waveRow}>
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim1 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim2 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim3 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim2 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim1 }] }]} />
            </View>
          )}

          {/* Live Transcription or Hint */}
          <Text style={styles.transcriptionHint} numberOfLines={1}>
            {tr(liveTranscription || (voiceState === 'listening' ? 'Listening to your query...' : 'Ask today\'s schedule, pregnant women, or vaccination dates'))}
          </Text>
        </View>

        {/* Conversation Dialog Stream */}
        <View style={styles.conversationStream}>
          {conversation.map((msg) => {
            const isTarget = audioPlayback.audioId === msg.id || (!audioPlayback.audioId && conversation[conversation.length - 1]?.id === msg.id);
            const isPlayingThis = (audioPlayback.isPlaying || (voiceState === 'speaking' && !audioPlayback.isPaused)) && isTarget;
            const isPausedThis = audioPlayback.isPaused && isTarget;

            return (
              <React.Fragment key={msg.id}>
                <ConversationBubble
                  role={msg.role}
                  text={msg.text}
                  timestamp={msg.timestamp}
                  audioPlayable={msg.role === 'assistant'}
                  isLoadingAudio={loadingAudioId === msg.id}
                  isPlayingAudio={isPlayingThis}
                  isPausedAudio={isPausedThis}
                  onPlayAudio={() => handlePlayAudio(msg.audioUrl, msg.text, msg.id)}
                  onPauseAudio={handlePauseAudio}
                  onResumeAudio={handleResumeAudio}
                  onToggleAudio={() => handleToggleAudio(msg.audioUrl, msg.text, msg.id)}
                />

              {/* Action suggestion pills */}
              {msg.actions && msg.actions.length > 0 && (
                <View style={styles.actionPillRow}>
                  {msg.actions.map((act, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        if (act.toLowerCase().includes('visit') || act.toLowerCase().includes('today')) {
                          navigation.navigate('TasksTab');
                        } else {
                          navigation.navigate('CommunityTab');
                        }
                      }}
                      style={styles.actionPill}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionPillText}>{tr(act)}</Text>
                      <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </React.Fragment>
          );
        })}
        </View>

        {/* Frequently Asked Questions (Compact Chips) */}
        <Text style={styles.sectionTitle}>{tr('Frequently Asked Questions')}</Text>
        <View style={styles.promptsGrid}>
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleAskQuestion(p.query)}
              activeOpacity={0.7}
              style={styles.promptChip}
            >
              <VectorCategoryIcon category={p.type} size={18} style={{ marginRight: 6 }} />
              <Text style={styles.promptLabel} numberOfLines={1}>{tr(p.label)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subtle Text Fallback Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            placeholder={tr('Or type a question in Hindi / English...')}
            placeholderTextColor={colors.textMuted}
            value={textQuery}
            onChangeText={setTextQuery}
            style={styles.textInput}
            onSubmitEditing={() => handleAskQuestion()}
          />
          <TouchableOpacity
            onPress={() => handleAskQuestion()}
            style={styles.sendBtn}
            accessibilityLabel={tr('Send question')}
          >
            <Ionicons name="arrow-up" size={16} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Safety Guardrail Notice */}
        <View style={styles.guardrail}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.teal} />
          <Text style={styles.guardrailText}>{tr('सहायक केवल प्रशासनिक और सरकारी योजना संबंधी जानकारी के लिए है।')}</Text>
        </View>

        {/* Full clearance for bottom navigation */}
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 4,
    paddingBottom: 20
  },
  compactVoicePod: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 4,
    ...shadows.subtle
  },
  micContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  micRipple: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    pointerEvents: 'none'
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 22,
    marginTop: 4,
    marginBottom: 2
  },
  waveBar: {
    width: 3.5,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.danger
  },
  statusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 8
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  statusCapsuleText: {
    fontSize: 11,
    fontWeight: '600'
  },
  compactMicBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(11, 18, 32, 0.06)',
    ...shadows.soft
  },
  micBtnListening: {
    backgroundColor: colors.danger,
    borderColor: colors.dangerLight
  },
  micBtnProcessing: {
    backgroundColor: colors.warning,
    borderColor: colors.warningLight
  },
  transcriptionHint: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  conversationStream: {
    marginVertical: 4
  },
  actionPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginHorizontal: spacing.cardPadding,
    marginTop: 4,
    marginBottom: 8
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
    marginTop: 8,
    marginBottom: 4,
  },
  promptsGrid: {
    gap: 6,
    marginBottom: 8
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle
  },
  promptLabel: {
    fontSize: 12,
    color: colors.primaryText,
    fontWeight: '500',
    flex: 1
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.base,
    paddingRight: 5,
    paddingVertical: 4,
    marginTop: 4,
    ...shadows.subtle
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: colors.primaryText,
    paddingVertical: 4
  },
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center'
  },
  guardrail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 6
  },
  guardrailText: {
    color: colors.textMuted,
    fontSize: 10.5,
    flex: 1,
    lineHeight: 14
  }
});

export default VoiceAssistantScreen;
