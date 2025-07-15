import React, { useEffect } from 'react';
import { useHotkeysStore, useHotkeyCaptureStore } from '../../model/hotkeys.store';
import { useLocalParticipantMic } from '@entities/members/model/useLocalParticipantMic';
import { useLocalParticipantVolume } from '@entities/members/model/useLocalParticipantVolume';
import { useScreenShare } from '@entities/members/model/useScreenShare';
import { useLocalParticipantCamera } from '@entities/members/model/useLocalParticipantCamera';
import { useSessionStore } from '@entities/session';

/**
 * Компонент-невидимка, который регистрирует глобальные «сочетания клавиш»
 * (горячие клавиши) пользователя и вызывает соответствующие действия.
 * Должен находиться внутри LiveKitRoom (там доступны хуки управления микрофоном/громкостью).
 */
export const GlobalHotkeys: React.FC = () => {
  const hotkeys = useHotkeysStore((s) => s.hotkeys);
  const isCapturing = useHotkeyCaptureStore((s) => s.isCapturing);
  const { toggleMicEnabled } = useLocalParticipantMic();
  const { toggleVolumeEnabled } = useLocalParticipantVolume();
  const { toggleCameraEnabled, isCameraEnabled } = useLocalParticipantCamera();
  const { enabled: screenEnabled, stopAll: stopAllScreenShare, startNew } = useScreenShare();
  const userId = useSessionStore((s) => s.user?.id ?? 'unknown');

  useEffect(() => {
    const isModifierOnly = (code: string) =>
      [
        'ControlLeft',
        'ControlRight',
        'ShiftLeft',
        'ShiftRight',
        'AltLeft',
        'AltRight',
        'MetaLeft',
        'MetaRight',
      ].includes(code);

    const buildCombo = (e: KeyboardEvent): string | null => {
      if (isModifierOnly(e.code)) return null; // не интересуемся чистыми модификаторами

      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Meta');

      const keyPart = e.code.startsWith('Key')
        ? e.code.slice(3)
        : e.code.startsWith('Digit')
        ? e.code.slice(5)
        : e.code;

      parts.push(keyPart);
      return parts.join('+');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCapturing) return;

      const combo = buildCombo(e);
      if (!combo) return;

      if (combo === hotkeys['toggle-mic']) {
        e.preventDefault();
        toggleMicEnabled();
      } else if (combo === hotkeys['toggle-camera']) {
        e.preventDefault();
        toggleCameraEnabled();
      } else if (combo === hotkeys['toggle-screen']) {
        e.preventDefault();
        startNew(userId);
      } else if (combo === hotkeys['stop-streams']) {
        e.preventDefault();
        stopAllScreenShare();
      } else if (combo === hotkeys['toggle-speaker']) {
        e.preventDefault();
        toggleVolumeEnabled();
      }
      // push-to-talk можно реализовать позднее
    };

    const handleKeyUp = (e: KeyboardEvent) => {};

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [hotkeys, toggleMicEnabled, toggleCameraEnabled, toggleVolumeEnabled, stopAllScreenShare, startNew, isCapturing, userId]);

  return null; // ничего не рендерим
}; 