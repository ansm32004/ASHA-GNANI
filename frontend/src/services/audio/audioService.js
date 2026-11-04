import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

class AudioService {
  constructor() {
    this.recording = null;
    this.sound = null;
    this.isRecording = false;
  }

  /**
   * Request OS microphone permissions
   */
  async requestPermissions() {
    try {
      if (Platform.OS === 'web') {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          return true;
        }
        return true;
      }
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn('[AudioService] Permission request failed:', e.message);
      return false;
    }
  }

  /**
   * Start microphone audio recording
   */
  async startRecording() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted.');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
      this.isRecording = true;
      return true;
    } catch (e) {
      console.warn('[AudioService] Failed to start recording:', e.message);
      this.isRecording = false;
      throw e;
    }
  }

  /**
   * Stop recording and get temporary file URI
   */
  async stopRecording() {
    try {
      if (!this.recording) return null;
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;
      return uri;
    } catch (e) {
      console.warn('[AudioService] Failed to stop recording:', e.message);
      this.recording = null;
      this.isRecording = false;
      return null;
    }
  }

  /**
   * Convert recorded audio file to base64 for API transmission to backend
   */
  async getAudioBase64(uri) {
    try {
      if (!uri) return null;
      if (Platform.OS === 'web') {
        // On web, fetch blob and convert
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
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
   * Play audio from local file URI or remote URL
   */
  async playAudio(audioUriOrUrl, onFinish = null) {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUriOrUrl },
        { shouldPlay: true }
      );
      this.sound = sound;

      if (onFinish) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            onFinish();
          }
        });
      }

      return sound;
    } catch (e) {
      console.warn('[AudioService] Audio playback error:', e.message);
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
    } catch (e) {
      // Non-fatal
    }
  }
}

export const audioService = new AudioService();
export default audioService;

