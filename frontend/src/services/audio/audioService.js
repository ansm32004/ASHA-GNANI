import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

class AudioService {
  constructor() {
    this.recording = null;
    this.sound = null;
    this.isRecording = false;
    this.isStarting = false;
    this.webMediaRecorder = null;
    this.webAudioChunks = [];
    this.tempPlaybackUri = null;
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
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
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

      return {
        uri: uri,
        size: fileInfo.size,
        durationMillis: status.durationMillis || 0,
        mime: uri.endsWith('.m4a') ? 'audio/m4a' : 'audio/wav'
      };
    } catch (e) {
      console.warn('[AudioService] Error stopping recording:', e.message);
      this.recording = null;
      this.isRecording = false;
      return null;
    }
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

  /**
   * Play audio from local file URI, data URI, or remote URL
   */
  async playAudio(audioUriOrUrl, onFinish = null) {
    if (!audioUriOrUrl) {
      if (onFinish) onFinish();
      return null;
    }

    try {
      await this.stopAudio();

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
          const base64Data = uriToPlay.includes(',') ? uriToPlay.split(',')[1] : uriToPlay;
          const tempPath = `${FileSystem.cacheDirectory}tts_${Date.now()}.wav`;
          await FileSystem.writeAsStringAsync(tempPath, base64Data, {
            encoding: FileSystem.EncodingType.Base64
          });
          uriToPlay = tempPath;
          this.tempPlaybackUri = tempPath;
        } catch (writeErr) {
          console.warn('[AudioService] Could not write base64 to temp WAV file:', writeErr.message);
        }
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: uriToPlay },
        { shouldPlay: true }
      );
      this.sound = sound;

      const finishHandler = () => {
        if (this.tempPlaybackUri) {
          this.cleanupAudioFile(this.tempPlaybackUri);
          this.tempPlaybackUri = null;
        }
        if (onFinish) onFinish();
      };

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          finishHandler();
        }
      });

      return sound;
    } catch (e) {
      console.warn('[AudioService] Audio playback error:', e.message);
      if (this.tempPlaybackUri) {
        this.cleanupAudioFile(this.tempPlaybackUri);
        this.tempPlaybackUri = null;
      }
      if (onFinish) onFinish();
      return null;
    }
  }

  /**
   * Stop active audio playback
   */
  async stopAudio() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      if (this.tempPlaybackUri) {
        await this.cleanupAudioFile(this.tempPlaybackUri);
        this.tempPlaybackUri = null;
      }
    } catch (e) {
      this.sound = null;
      this.tempPlaybackUri = null;
    }
  }
}

export const audioService = new AudioService();
export default audioService;
