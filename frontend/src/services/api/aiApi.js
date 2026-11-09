import { apiClient } from './apiClient';

export const aiApi = {
  transcribe: async (payload) => {
    const res = await apiClient.post('/ai/transcribe', payload, { timeout: 35000 });
    return res.data;
  },

  transcribeAudio: async (audioUri, language = 'hi-IN') => {
    // Multipart form upload
    const formData = new FormData();
    const filename = audioUri.split('/').pop() || 'recording.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'm4a';
    const mimeTypes = {
      m4a: 'audio/m4a',
      wav: 'audio/wav',
      mp3: 'audio/mpeg',
      aac: 'audio/aac',
      ogg: 'audio/ogg',
      webm: 'audio/webm'
    };
    const mime = mimeTypes[ext] || 'audio/m4a';

    formData.append('audio_file', {
      uri: audioUri,
      name: filename,
      type: mime
    });
    formData.append('language', language);

    const res = await apiClient.post('/ai/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 35000
    });
    return res.data;
  },

  extractVisit: async (transcript, householdId = 'hh_001', language = 'hi') => {
    const res = await apiClient.post('/ai/extract', {
      transcript,
      task_type: 'visit_logging',
      household_id: householdId,
      language
    }, { timeout: 35000 });
    const resData = res.data || {};
    if (resData.data && !resData.extracted_fields) {
      resData.extracted_fields = resData.data;
    }
    return resData;
  },

  extract: async (transcript, taskType = 'visit_logging', householdId = null, language = 'hi') => {
    const res = await apiClient.post('/ai/extract', {
      transcript,
      task_type: taskType,
      household_id: householdId,
      language
    }, { timeout: 35000 });
    const resData = res.data || {};
    if (resData.data && !resData.extracted_fields) {
      resData.extracted_fields = resData.data;
    }
    return resData;
  },

  queryAssistant: async (query, language = 'hi', voiceEnabled = false) => {
    const res = await apiClient.post(
      '/ai/assistant',
      { query, language, voice_enabled: voiceEnabled },
      { timeout: 35000 }
    );
    return res.data;
  },

  speak: async ({ text, language = 'hi', voice = 'Shivani' }) => {
    const res = await apiClient.post(
      '/ai/speak',
      { text, language, voice },
      { timeout: 35000 }
    );
    return res.data;
  }
};

