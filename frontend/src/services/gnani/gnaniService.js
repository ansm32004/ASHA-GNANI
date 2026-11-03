import { aiApi } from '../api/aiApi';

/**
 * Gnani AI Mobile Service Layer
 * Coordinates Prisma STT, Evon NLU extraction, and Timbre TTS.
 * Never stores API keys directly on mobile client; all requests routed securely.
 */
export const gnaniService = {
  transcribeAudio: async (audioBase64, language = 'hi', mockText = null) => {
    return await aiApi.transcribe({
      audio_base64: audioBase64,
      language,
      mock_input_text: mockText
    });
  },

  extractVisitData: async (transcript, householdId = 'hh_001', language = 'hi') => {
    return await aiApi.extractVisit(transcript, householdId, language);
  },

  askAssistant: async (query, language = 'hi', voiceEnabled = false) => {
    return await aiApi.queryAssistant(query, language, voiceEnabled);
  }
};

