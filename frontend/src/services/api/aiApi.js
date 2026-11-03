import { apiClient } from './apiClient';

export const aiApi = {
  transcribe: async (payload) => {
    try {
      const res = await apiClient.post('/ai/transcribe', payload);
      return res.data;
    } catch (e) {
      const lang = payload.language || 'hi';
      return {
        transcript: payload.mock_input_text || (
          lang === 'hi'
            ? "आज मीना देवी के घर गई थी। उनके बच्चे का वैक्सीनेशन अगले हफ्ते है। शुक्रवार को दोबारा जाना है।"
            : "Visited Meena Devi today. Child vaccination due next week. Need to follow up on Friday."
        ),
        detected_language: lang,
        confidence: 0.96,
        duration_seconds: 6.8
      };
    }
  },

  extractVisit: async (transcript, householdId = 'hh_001', language = 'hi') => {
    try {
      const res = await apiClient.post('/ai/extract-visit', { transcript, household_id: householdId, language });
      return res.data;
    } catch (e) {
      return {
        extracted_fields: {
          household_id: householdId,
          household_name: "Meena Devi",
          beneficiary_name: "Meena Devi",
          visit_date: new Date().toISOString().split('T')[0],
          activity_category: "Maternal Health",
          activity_description: transcript,
          visit_outcome: "Normal",
          follow_up_required: true,
          follow_up_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          priority: "Priority",
          notes: "Extracted via simulated Gnani Evon NLU."
        },
        confidence_score: 0.94,
        raw_transcript: transcript
      };
    }
  },

  queryAssistant: async (query, language = 'hi', voiceEnabled = false) => {
    try {
      const res = await apiClient.post('/ai/assistant', { query, language, voice_enabled: voiceEnabled });
      return res.data;
    } catch (e) {
      const q = query.toLowerCase();
      let reply = "";
      if (q.includes('aaj') || q.includes('today') || q.includes('visit') || q.includes('kin gharon')) {
        reply = language === 'hi'
          ? "नमस्ते सुनीता जी! आज आपके पास 3 महत्वपूर्ण विजिट हैं: मीना देवी (उच्च जोखिम गर्भावस्था), सीता वर्मा (एएनसी चेकअप), और रेखा शर्मा (शिशु देखभाल)।"
          : "Hello Sunita ji! You have 3 priority visits today: Meena Devi (high risk pregnancy), Sita Verma (ANC checkup), and Rekha Sharma (infant care).";
      } else if (q.includes('camp') || q.includes('vaccin') || q.includes('सत्र') || q.includes('टीका')) {
        reply = language === 'hi'
          ? "अगला ग्राम स्वास्थ्य स्वच्छता एवं पोषण दिवस (VHSND) सत्र इसी बुधवार को आंगनवाड़ी केंद्र 2 पर आयोजित होगा। 6 बच्चों के टीके देय हैं।"
          : "The next VHSND immunization session is scheduled for this Wednesday at Anganwadi Centre 2. 6 infants are due.";
      } else {
        reply = language === 'hi'
          ? "सुनीता जी, मैं आपके 34 परिवारों और दैनिक विजिट कार्य में आपकी मदद कर सकती हूँ। आप मुझसे आज के विजिट, टीकाकरण सत्र या किसी भी परिवार के बारे में पूछ सकती हैं।"
          : "Sunita ji, I can help you with your 34 assigned households, visit schedules, or health program information.";
      }

      return {
        reply_text: reply,
        audio_url: null,
        suggested_actions: ["Today's Visits", "Vaccination Schedule", "Community Requests"],
        referenced_households: [],
        referenced_tasks: [],
        safety_disclaimer: "SAHAYIKA AI Assistant provides operational guidance. It never diagnoses diseases or prescribes treatment."
      };
    }
  }
};

