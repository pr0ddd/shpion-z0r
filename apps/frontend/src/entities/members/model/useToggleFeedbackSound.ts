import { waitForGlobalAudioContext } from '@libs/audioContext';

export const useToggleFeedbackSound = () => {
  const play = async () => {
    const ctx = await waitForGlobalAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 660;
    gain.gain.value = 0.05;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);

    // cleanup nodes after stop
    oscillator.onended = () => {
      try {
        oscillator.disconnect();
        gain.disconnect();
      } catch {}
    };
  };

  return { play };
};
