import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Optimized speech recognition recording preset.
 * Configured for 16kHz mono 16-bit audio as recommended by Gnani Prisma ASR.
 */
export const SPEECH_RECORDING_OPTIONS = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000
  }
};

class AudioService {
  constructor() {
    this.recording = null;
    this.sound = null;
    this.isRecording = false;
    this.isStarting = false;
    this.webMediaRecorder = null;
    this.webAudioChunks = [];
    this.tempPlaybackUri = null;

    // Playback state tracking
    this.playbackState = 'idle'; // 'idle' | 'loading' | 'playing' | 'paused'
    this.currentAudioUrl = null;
    this.currentAudioId = null;
    this.playbackPosition = 0;
    this.playbackDuration = 0;
    this.activeOnFinish = null;
    this.listeners = new Set();
  }

  /**
   * Check current microphone permission status without prompting
   */
  async checkPermissions() {
    try {
      if (Platform.OS === 'web') {
        return { granted: true, canAskAgain: true, status: 'granted' };
      }
      const response = await Audio.getPermissionsAsync();
      return {
        granted: response.status === 'granted',
        canAskAgain: response.canAskAgain,
        status: response.status,
        expires: response.expires
      };
    } catch (e) {
      console.warn('[AudioService] checkPermissions error:', e);
      return { granted: false, canAskAgain: true, status: 'undetermined' };
    }
  }

  /**
   * Request microphone permission from operating system
   */
  async requestPermissions() {
    try {
      if (Platform.OS === 'web') {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          return { granted: true, canAskAgain: true, status: 'granted' };
        }
        return { granted: true, canAskAgain: true, status: 'granted' };
      }

      const response = await Audio.requestPermissionsAsync();
      return {
        granted: response.status === 'granted',
        canAskAgain: response.canAskAgain,
        status: response.status,
        permanentlyDenied: response.status === 'denied' && !response.canAskAgain
      };
    } catch (e) {
      console.warn('[AudioService] requestPermissions error:', e);
      return { granted: false, canAskAgain: false, status: 'denied', permanentlyDenied: true };
    }
  }

  /**
   * Start microphone audio recording.
   * Guarantees only a single active recording session.
   */
  async startRecording() {
    if (this.isRecording || this.isStarting) {
      console.warn('[AudioService] Recording session already active or starting.');
      return false;
    }

    this.isStarting = true;

    try {
      // 1. Unload any existing audio playback to release audio focus
      await this.stopAudio();

      // 2. Validate permissions
      const perm = await this.requestPermissions();
      if (!perm.granted) {
        this.isStarting = false;
        const err = new Error(
          perm.permanentlyDenied
            ? 'Microphone permission is permanently denied. Please enable it in Settings.'
            : 'Microphone permission was not granted.'
        );
        err.permanentlyDenied = perm.permanentlyDenied;
        throw err;
      }

      // 3. Configure audio session for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      // 4. Web MediaRecorder implementation
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.webAudioChunks = [];
        this.webMediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        this.webMediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.webAudioChunks.push(event.data);
          }
        };
        this.webMediaRecorder.start();
        this.isRecording = true;
        this.isStarting = false;
        return true;
      }

      // 5. Native Android / iOS Recording via Expo-AV
      // Safe cleanup of dangling recorder if any
      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (_) {}
        this.recording = null;
      }

      const { recording } = await Audio.Recording.createAsync(
        SPEECH_RECORDING_OPTIONS,
        (status) => {
          // Status update callback if needed
        },
        200 // progress update interval in ms
      );

      this.recording = recording;
      this.isRecording = true;
      this.isStarting = false;
      return true;
    } catch (e) {
      this.isRecording = false;
      this.isStarting = false;
      this.recording = null;
      console.warn('[AudioService] Failed to start recording:', e.message);
      throw e;
    }
  }

  /**
   * Stop recording, validate audio file existence & non-zero size, return URI
   */
  async stopRecording() {
    if (!this.isRecording && !this.recording && !this.webMediaRecorder) {
      return null;
    }

    try {
      // 1. Web handling
      if (Platform.OS === 'web' && this.webMediaRecorder) {
        return new Promise((resolve) => {
          this.webMediaRecorder.onstop = () => {
            const blob = new Blob(this.webAudioChunks, { type: 'audio/webm' });
            const uri = URL.createObjectURL(blob);
            this.webMediaRecorder.stream.getTracks().forEach((t) => t.stop());
            this.webMediaRecorder = null;
            this.webAudioChunks = [];
            this.isRecording = false;
            resolve({ uri, size: blob.size, mime: 'audio/webm' });
          };
          this.webMediaRecorder.stop();
        });
      }

      // 2. Native Expo-AV handling
      if (!this.recording) {
        this.isRecording = false;
        return null;
      }

      const currentRecorder = this.recording;
      this.recording = null;
      this.isRecording = false;

      const status = await currentRecorder.getStatusAsync();
      await currentRecorder.stopAndUnloadAsync();
      const uri = currentRecorder.getURI();

      if (!uri) {
        console.warn('[AudioService] Recorder produced null URI.');
        return null;
      }

      // 3. Validate audio file exists and has non-zero size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        console.warn('[AudioService] Audio file is empty or does not exist:', uri);
        await this.cleanupAudioFile(uri);
        return null;
      }

      const mime = uri.endsWith('.m4a')
        ? 'audio/m4a'
        : (uri.endsWith('.wav') ? 'audio/wav' : (uri.endsWith('.webm') ? 'audio/webm' : 'audio/m4a'));

      return {
        uri: uri,
        size: fileInfo.size,
        durationMillis: status.durationMillis || 0,
        mime: mime
      };
    } catch (e) {
      console.warn('[AudioService] Error stopping recording:', e.message);
      this.recording = null;
      this.isRecording = false;
      this.isStarting = false;
      return null;
    }
  }

  /**
   * Cancel and discard current active recording session
   */
  async cancelRecording() {
    try {
      if (Platform.OS === 'web' && this.webMediaRecorder) {
        this.webMediaRecorder.stream.getTracks().forEach((t) => t.stop());
        this.webMediaRecorder = null;
        this.webAudioChunks = [];
      } else if (this.recording) {
        const rec = this.recording;
        this.recording = null;
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        if (uri) await this.cleanupAudioFile(uri);
      }
    } catch (_) {}
    this.isRecording = false;
    this.isStarting = false;
  }

  /**
   * Safely delete temporary audio file to prevent cache bloat
   */
  async cleanupAudioFile(uri) {
    if (!uri) return;
    try {
      if (Platform.OS === 'web') {
        if (uri.startsWith('blob:')) {
          URL.revokeObjectURL(uri);
        }
        return;
      }
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (e) {
      // Non-fatal
    }
  }

  /**
   * Convert recorded audio file to base64
   */
  async getAudioBase64(uri) {
    try {
      if (!uri) return null;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result;
            const base64data = typeof result === 'string' ? result.split(',')[1] : null;
            resolve(base64data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });
    } catch (e) {
      console.warn('[AudioService] Could not convert audio to base64:', e.message);
      return null;
    }
  }

  // ==========================================
  // PLAYBACK SUBSCRIPTION & EVENT SYSTEM
  // ==========================================

  /**
   * Get an immutable snapshot of current audio playback status
   */
  getPlaybackStatus() {
    return {
      state: this.playbackState,
      isPlaying: this.playbackState === 'playing',
      isPaused: this.playbackState === 'paused',
      isLoading: this.playbackState === 'loading',
      isIdle: this.playbackState === 'idle',
      audioId: this.currentAudioId,
      url: this.currentAudioUrl,
      position: this.playbackPosition,
      duration: this.playbackDuration
    };
  }

  /**
   * Subscribe to playback status updates.
   * Returns an unsubscribe function.
   */
  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      // Immediately notify subscriber with current status snapshot
      listener(this.getPlaybackStatus());
      return () => {
        this.listeners.delete(listener);
      };
    }
    return () => {};
  }

  /**
   * Internal helper to notify all subscribed listeners of a state change
   */
  _notifyListeners() {
    const status = this.getPlaybackStatus();
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch (err) {
        console.warn('[AudioService] Listener callback error:', err);
      }
    }
  }

  /**
   * Cleanup any temporary decoded WAV file created for Android/iOS playback
   */
  _cleanupTempPlaybackFile() {
    if (this.tempPlaybackUri) {
      const uriToClean = this.tempPlaybackUri;
      this.tempPlaybackUri = null;
      this.cleanupAudioFile(uriToClean);
    }
  }

  /**
   * Internal handler for playback completion
   */
  _handlePlaybackFinish() {
    this._cleanupTempPlaybackFile();
    const finishCb = this.activeOnFinish;
    this.sound = null;
    this.playbackState = 'idle';
    this.currentAudioUrl = null;
    this.currentAudioId = null;
    this.playbackPosition = 0;
    this.playbackDuration = 0;
    this.activeOnFinish = null;
    this._notifyListeners();

    if (finishCb) {
      try {
        finishCb();
      } catch (cbErr) {
        console.warn('[AudioService] onFinish callback error:', cbErr);
      }
    }
  }

  /**
   * Internal playback status update listener from Expo AV Sound
   */
  _onPlaybackStatusUpdate(status) {
    if (!status.isLoaded) {
      if (status.error) {
        console.warn('[AudioService] Playback error reported by sound:', status.error);
        this._handlePlaybackFinish();
      }
      return;
    }

    this.playbackPosition = status.positionMillis || 0;
    this.playbackDuration = status.durationMillis || 0;

    if (status.didJustFinish) {
      this._handlePlaybackFinish();
    } else if (status.isPlaying && this.playbackState !== 'playing') {
      this.playbackState = 'playing';
      this._notifyListeners();
    } else if (!status.shouldPlay && !status.isPlaying && this.playbackState === 'playing') {
      // Only transition to paused if Expo-AV explicitly reports shouldPlay is false (not buffering)
      this.playbackState = 'paused';
      this._notifyListeners();
    }
  }

  // ==========================================
  // PLAYBACK CONTROLS (PLAY, PAUSE, RESUME, TOGGLE, STOP)
  // ==========================================

  /**
   * Play audio from local file URI, data URI, or remote URL.
   * Guarantees only one audio stream plays at a time across the entire application.
   * If the requested audio is currently paused, seamlessly resumes from the paused position.
   */
  async playAudio(audioUriOrUrl, onFinish = null, audioId = null) {
    if (!audioUriOrUrl) {
      if (onFinish) onFinish();
      return null;
    }

    const targetId = audioId || audioUriOrUrl;

    // 1. If this exact audio is already playing, return active sound
    if (this.sound && this.currentAudioId === targetId && this.playbackState === 'playing') {
      return this.sound;
    }

    // 2. If this exact audio is currently paused, resume immediately from current position!
    if (this.sound && this.currentAudioId === targetId && this.playbackState === 'paused') {
      await this.resumeAudio();
      return this.sound;
    }

    // 3. Stop and unload any other audio currently playing or paused before starting new one
    await this.stopAudio();

    this.playbackState = 'loading';
    this.currentAudioUrl = audioUriOrUrl;
    this.currentAudioId = targetId;
    this.activeOnFinish = onFinish;
    this._notifyListeners();

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      let uriToPlay = audioUriOrUrl;

      // On native Android / iOS, native MediaPlayer cannot directly load large data: URIs
      // Decode and persist to a temporary cached .wav file for seamless hardware decoding
      if (Platform.OS !== 'web' && typeof uriToPlay === 'string' && uriToPlay.startsWith('data:')) {
        try {
          const safeId = String(targetId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(-30);
          const tempPath = `${FileSystem.cacheDirectory}tts_${safeId}.wav`;
          const fileInfo = await FileSystem.getInfoAsync(tempPath);
          if (!fileInfo.exists || fileInfo.size === 0) {
            const base64Data = uriToPlay.includes(',') ? uriToPlay.split(',')[1] : uriToPlay;
            await FileSystem.writeAsStringAsync(tempPath, base64Data, {
              encoding: FileSystem.EncodingType.Base64
            });
          }
          uriToPlay = tempPath;
          this.tempPlaybackUri = tempPath;
        } catch (writeErr) {
          console.warn('[AudioService] Could not write base64 to temp WAV file:', writeErr.message);
        }
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: uriToPlay },
        { shouldPlay: true },
        (status) => this._onPlaybackStatusUpdate(status)
      );

      this.sound = sound;
      this.playbackState = 'playing';
      this._notifyListeners();

      return sound;
    } catch (e) {
      console.warn('[AudioService] Audio playback error:', e.message);
      this._cleanupTempPlaybackFile();
      this.sound = null;
      this.playbackState = 'idle';
      this.currentAudioUrl = null;
      this.currentAudioId = null;
      this.activeOnFinish = null;
      this._notifyListeners();
      if (onFinish) onFinish();
      return null;
    }
  }

  /**
   * Pause active audio playback immediately at its current position
   */
  async pauseAudio() {
    if (this.sound) {
      try {
        await this.sound.pauseAsync();
      } catch (e) {
        console.warn('[AudioService] pauseAudio error:', e.message);
      }
    }
    this.playbackState = 'paused';
    this._notifyListeners();
    return true;
  }

  /**
   * Resume paused audio playback immediately from its exact paused position
   */
  async resumeAudio() {
    if (this.sound) {
      try {
        await this.sound.playAsync();
      } catch (e) {
        console.warn('[AudioService] resumeAudio error:', e.message);
      }
    }
    this.playbackState = 'playing';
    this._notifyListeners();
    return true;
  }

  /**
   * Toggle audio playback:
   * - If currently playing this audio -> pauses immediately.
   * - If currently paused on this audio -> resumes from paused position.
   * - If idle or playing different audio -> starts playing requested audio.
   */
  async toggleAudio(audioUriOrUrl, onFinish = null, audioId = null) {
    const targetId = audioId || audioUriOrUrl;
    if (this.sound && (this.currentAudioId === targetId || !this.currentAudioId)) {
      if (this.playbackState === 'playing') {
        return await this.pauseAudio();
      } else if (this.playbackState === 'paused') {
        return await this.resumeAudio();
      }
    }
    return await this.playAudio(audioUriOrUrl, onFinish, targetId);
  }

  /**
   * Stop active audio playback and unload hardware audio resources
   */
  async stopAudio() {
    try {
      if (this.sound) {
        try {
          await this.sound.stopAsync();
        } catch (_) {}
        try {
          await this.sound.unloadAsync();
        } catch (_) {}
        this.sound = null;
      }
      this._cleanupTempPlaybackFile();
    } catch (e) {
      this.sound = null;
    } finally {
      this.playbackState = 'idle';
      this.currentAudioUrl = null;
      this.currentAudioId = null;
      this.playbackPosition = 0;
      this.playbackDuration = 0;
      this.activeOnFinish = null;
      this._notifyListeners();
    }
  }
}

export const audioService = new AudioService();
export default audioService;

/**
 * React hook to bind any component to centralized audio playback state.
 * Supports play, pause, resume, toggle, and automatic UI synchronization.
 */
export function useAudioPlayback(targetAudioId = null) {
  const [status, setStatus] = useState(() => audioService.getPlaybackStatus());

  useEffect(() => {
    const unsubscribe = audioService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const isThisPlaying = status.isPlaying && (!targetAudioId || status.audioId === targetAudioId);
  const isThisPaused = status.isPaused && (!targetAudioId || status.audioId === targetAudioId);
  const isThisLoading = status.isLoading && (!targetAudioId || status.audioId === targetAudioId);
  const isThisActive = !targetAudioId || status.audioId === targetAudioId;

  return {
    ...status,
    isThisPlaying,
    isThisPaused,
    isThisLoading,
    isThisActive,
    play: (url, onFinish, id) => audioService.playAudio(url, onFinish, id || targetAudioId),
    pause: () => audioService.pauseAudio(),
    resume: () => audioService.resumeAudio(),
    toggle: (url, onFinish, id) => audioService.toggleAudio(url, onFinish, id || targetAudioId),
    stop: () => audioService.stopAudio()
  };
}

