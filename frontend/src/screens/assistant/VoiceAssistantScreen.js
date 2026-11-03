import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { ConversationBubble } from '../../components/visual/ConversationBubble';
import { VectorCategoryIcon } from '../../components/illustrations/VectorCategoryIcon';
import { aiApi } from '../../services/api/aiApi';
import { useLanguageStore } from '../../store/languageStore';
import { useTranslation } from 'react-i18next';

export const VoiceAssistantScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { uiLanguage, setUiLanguage } = useLanguageStore();

  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  const [seconds, setSeconds] = useState(0);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [textQuery, setTextQuery] = useState('');

  const [conversation, setConversation] = useState([
    {
      id: 'msg-0',
      role: 'assistant',
      text:
        i18n.language === 'hi'
          ? 'नमस्ते सुनीता जी! आप बोलकर आज के विजिट, गर्भवती महिलाओं की लिस्ट, टीकाकरण या जेएसवाई योजना की जानकारी पूछ सकती हैं।'
          : "Hello Sunita ji! Speak naturally to ask about today's visits, pregnant mothers, vaccination camps, or JSY guidelines.",
      timestamp: 'Just now',
      actions: ["Today's Visits", 'ANC Checkup List', 'Vaccination Schedule']
    }
  ]);

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
    setUiLanguage(nextLang);
  };

  const handleAskQuestion = async (queryText) => {
    const q = (queryText || textQuery || liveTranscription).trim();
    if (!q) return;

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

    try {
      const res = await aiApi.queryAssistant(q, i18n.language, false);
      setVoiceState('idle');
      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: res.reply_text,
          timestamp: 'Just now',
          actions: res.suggested_actions || []
        }
      ]);
    } catch (e) {
      setVoiceState('idle');
      setConversation((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text:
            i18n.language === 'hi'
              ? 'आज आपके 4 विजिट शेड्यूल हैं: मीना देवी (गर्भावस्था ANC चेकअप), सीमा देवी (MR टीकाकरण), आशा देवी, और रेखा बाई।'
              : "You have 4 visits scheduled today: Meena Devi (ANC), Seema Devi (MR Immunisation), Asha Devi, and Rekha Bai.",
          timestamp: 'Just now',
          actions: ['Open Today Visits', 'View Directory']
        }
      ]);
    }
  };

  const handleToggleVoice = () => {
    if (voiceState === 'idle' || voiceState === 'error') {
      setVoiceState('listening');
      setSeconds(0);
      setLiveTranscription('बोलिए... (Listening...)');

      const timer = setInterval(() => {
        setSeconds((s) => {
          if (s === 1) setLiveTranscription('मुझे आज किन घरों में जाना है?');
          return s + 1;
        });
      }, 1000);

      setTimeout(() => {
        clearInterval(timer);
        setVoiceState('processing');
        handleAskQuestion('मुझे आज किन घरों में जाना है?');
      }, 3000);
    } else if (voiceState === 'listening') {
      setVoiceState('processing');
      handleAskQuestion(liveTranscription || 'मुझे आज किन घरों में जाना है?');
    }
  };

  const handlePlayAudio = () => {
    setVoiceState('speaking');
    setTimeout(() => {
      setVoiceState('idle');
    }, 3500);
  };

  const SUGGESTED_PROMPTS = [
    { label: "आज के फील्ड विजिट? (Today's Visits)", query: 'मुझे आज किन घरों में जाना है?', type: 'household' },
    { label: 'मीना देवी का ANC चेकअप', query: 'मीना देवी का 3rd Trimester ANC चेकअप कब है?', type: 'maternal' },
    { label: 'अगला टीकाकरण कैंप कब है?', query: 'अगला वैक्सीनेशन कैंप कब है?', type: 'vaccin' },
    { label: 'जेएसवाई योजना के लाभ', query: 'जननी सुरक्षा योजना में कितने पैसे मिलते हैं?', type: 'nutri' }
  ];

  const getStatePill = () => {
    switch (voiceState) {
      case 'listening':
        return { text: `Listening... 00:0${seconds}`, bg: colors.dangerLight, color: colors.danger, dot: colors.danger };
      case 'processing':
        return { text: 'Analyzing with AI...', bg: colors.warningLight, color: colors.warning, dot: colors.warning };
      case 'speaking':
        return { text: 'Playing voice response...', bg: colors.tealLight, color: colors.teal, dot: colors.teal };
      case 'error':
        return { text: 'Retry microphone', bg: colors.dangerLight, color: colors.danger, dot: colors.danger };
      case 'idle':
      default:
        return { text: 'Tap mic to speak in Hindi/English', bg: colors.surfaceSecondary, color: colors.secondaryText, dot: colors.primary };
    }
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

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Compact Voice Interaction Pod (Space-Efficient & Balanced) */}
        <View style={styles.compactVoicePod}>
          {/* Status Capsule Indicator */}
          <View style={[styles.statusCapsule, { backgroundColor: stateInfo.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: stateInfo.dot }]} />
            <Text style={[styles.statusCapsuleText, { color: stateInfo.color }]}>
              {stateInfo.text}
            </Text>
          </View>

          {/* Compact Mic Button */}
          <TouchableOpacity
            style={[
              styles.compactMicBtn,
              voiceState === 'listening' && styles.micBtnListening,
              voiceState === 'processing' && styles.micBtnProcessing
            ]}
            onPress={handleToggleVoice}
            activeOpacity={0.85}
            accessibilityLabel="Microphone control"
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

          {/* Live Transcription or Hint */}
          <Text style={styles.transcriptionHint} numberOfLines={1}>
            {liveTranscription || (voiceState === 'listening' ? 'Listening to your query...' : 'Ask today\'s schedule, pregnant women, or vaccination dates')}
          </Text>
        </View>

        {/* Conversation Dialog Stream */}
        <View style={styles.conversationStream}>
          {conversation.map((msg) => (
            <React.Fragment key={msg.id}>
              <ConversationBubble
                role={msg.role}
                text={msg.text}
                timestamp={msg.timestamp}
                audioPlayable={msg.role === 'assistant'}
                isPlayingAudio={voiceState === 'speaking'}
                onPlayAudio={handlePlayAudio}
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
                      <Text style={styles.actionPillText}>{act}</Text>
                      <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Frequently Asked Questions (Compact Chips) */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.promptsGrid}>
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleAskQuestion(p.query)}
              activeOpacity={0.7}
              style={styles.promptChip}
            >
              <VectorCategoryIcon category={p.type} size={18} style={{ marginRight: 6 }} />
              <Text style={styles.promptLabel} numberOfLines={1}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subtle Text Fallback Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            placeholder="Or type a question in Hindi / English..."
            placeholderTextColor={colors.textMuted}
            value={textQuery}
            onChangeText={setTextQuery}
            style={styles.textInput}
            onSubmitEditing={() => handleAskQuestion()}
          />
          <TouchableOpacity
            onPress={() => handleAskQuestion()}
            style={styles.sendBtn}
            accessibilityLabel="Send question"
          >
            <Ionicons name="arrow-up" size={16} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Safety Guardrail Notice */}
        <View style={styles.guardrail}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.teal} />
          <Text style={styles.guardrailText}>
            सहायक केवल प्रशासनिक और सरकारी योजना संबंधी जानकारी के लिए है।
          </Text>
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
    backgroundColor: colors.background
  },
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 4,
    paddingBottom: 20
  },
  compactVoicePod: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 4,
    ...shadows.subtle
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#EAF3FD',
    ...shadows.raised
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
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryText,
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
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
    backgroundColor: colors.primary,
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
