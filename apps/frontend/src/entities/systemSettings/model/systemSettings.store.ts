import { SystemSetting } from '@shared/types';
import { RoomOptions, VideoCodec } from 'livekit-client';
import { create } from 'zustand';

export interface DeepFilterOptions {
  attenLim: number;
  postFilterBeta: number;
  outputGain: number;
  sabRingCapacity: number;
}

export interface CompressorOptions {
  threshold: number;
  knee: number;
  ratio: number;
  attack: number;
  release: number;
}

interface SystemSettingsStore {
  isReady: boolean;
  compressorOptions: CompressorOptions | null;
  deepFilterOptions: DeepFilterOptions | null;
  roomOptions: RoomOptions | null;
  previewCaptureInterval: number | null;
  maxScreenShares: number | null;
  setSystemSettings: (settings: SystemSetting[]) => void;
}

// TODO: handle LIVEKIT_VIDEO_PRESET

export const useSystemSettingsStore = create<SystemSettingsStore>((set) => ({
  compressorOptions: null,
  deepFilterOptions: null,
  roomOptions: null,
  previewCaptureInterval: null,
  maxScreenShares: null,
  isReady: false,
  setSystemSettings: (settings: SystemSetting[]) => {
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.code_name] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    const setValue = <T>(key: string, defaultValue: T): T => {
      if (settingsMap[key] === undefined) {
        console.warn(
          `System setting ${key} is not defined. Falling back to ${defaultValue}.`
        );
        return defaultValue;
      }

      if (typeof defaultValue === 'boolean') {
        return (settingsMap[key] === '1') as T;
      }

      if (typeof defaultValue === 'number') {
        return Number(settingsMap[key]) as T;
      }

      if (typeof defaultValue === 'string') {
        return settingsMap[key] as T;
      }

      return settingsMap[key] as T;
    };

    set({
      isReady: true,
      roomOptions: {
        adaptiveStream: setValue<boolean>('LIVEKIT_ADAPTIVE_STREAM', false),
        dynacast: setValue<boolean>('LIVEKIT_DYNACAST', false),
        publishDefaults: {
          simulcast: setValue<boolean>('LIVEKIT_SIMULCAST', true),
          videoCodec: setValue<VideoCodec>(
            'LIVEKIT_VIDEO_CODEC_BALANCED',
            'av1'
          ),
          videoEncoding: {
            maxBitrate: setValue<number>(
              'LIVEKIT_VIDEO_ENCODING_MAX_BITRATE_BALANCED',
              3_000_000
            ),
            maxFramerate: setValue<number>(
              'LIVEKIT_VIDEO_ENCODING_MAX_FRAMERATE_BALANCED',
              30
            ),
            priority: setValue<RTCPriorityType | undefined>(
              'LIVEKIT_VIDEO_ENCODING_PRIORITY_BALANCED',
              undefined
            ),
          },
          screenShareEncoding: {
            maxBitrate: setValue<number>(
              'LIVEKIT_SCREEN_SHARE_ENCODING_MAX_BITRATE_BALANCED',
              3_000_000
            ),
            maxFramerate: setValue<number>(
              'LIVEKIT_SCREEN_SHARE_ENCODING_MAX_FRAMERATE_BALANCED',
              30
            ),
            priority: setValue<RTCPriorityType | undefined>(
              'LIVEKIT_SCREEN_SHARE_ENCODING_PRIORITY_BALANCED',
              undefined
            ),
          },
          audioPreset: {
            maxBitrate: setValue<number>('LIVEKIT_AUDIO_MAX_BITRATE', 24_000),
          },
          dtx: setValue<boolean>('LIVEKIT_AUDIO_DTX', true),
          red: setValue<boolean>('LIVEKIT_AUDIO_RED', false),
          degradationPreference: setValue<RTCDegradationPreference>(
            'LIVEKIT_DEGRADATION_PREFERENCE',
            'maintain-framerate'
          ),
        },
        audioCaptureDefaults: {
          echoCancellation: setValue<boolean>('AUDIO_ECHO_CANCELLATION', false),
          noiseSuppression: setValue<boolean>('AUDIO_NOISE_SUPPRESSION', false),
          autoGainControl: setValue<boolean>('AUDIO_AUTO_GAIN_CONTROL', false),
          voiceIsolation: setValue<boolean>('AUDIO_VOICE_ISOLATION', false),
        },
      },
      deepFilterOptions: {
        attenLim: setValue<number>('DEEPFILTER_ATTEN_LIM', 40),
        postFilterBeta: setValue<number>('DEEPFILTER_POSTFILTER_BETA', 0.05),
        outputGain: setValue<number>('DEEPFILTER_OUTPUT_GAIN', 1.2),
        sabRingCapacity: setValue<number>('DEEPFILTER_SAB_RING_CAPACITY', 32),
      },
      compressorOptions: {
        threshold: setValue<number>('COMPRESSOR_THRESHOLD', -24),
        knee: setValue<number>('COMPRESSOR_KNEE', 30),
        ratio: setValue<number>('COMPRESSOR_RATIO', 4),
        attack: setValue<number>('COMPRESSOR_ATTACK', 0.003),
        release: setValue<number>('COMPRESSOR_RELEASE', 0.25),
      },
      previewCaptureInterval: setValue<number>(
        'PREVIEW_CAPTURE_INTERVAL',
        1000
      ),
      maxScreenShares: setValue<number>('MAX_SCREEN_SHARES', 4),
    });
  },
}));
