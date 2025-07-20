import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Member } from '@shared/types';
import { waitForGlobalAudioContext } from '@libs/audioContext';
import { useSocket } from '@libs/socket';
import { useSessionStore } from '@entities/session/model/auth.store';

/* ------------------------------------------------------------------
   Pleasant, short notification sounds based on small chords/envelopes
   ------------------------------------------------------------------ */

const playChord = async (frequencies: number[], duration = 0.4) => {
  const ctx = await waitForGlobalAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Shared gain node with fade-in / fade-out envelope
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.02); // attack
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // release
  gain.connect(ctx.destination);

  // Create an oscillator for each note in the chord
  const oscillators: OscillatorNode[] = [];
  frequencies.forEach((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);
    oscillators.push(osc);
  });

  // Cleanup
  oscillators[oscillators.length - 1].onended = () => {
    try {
      oscillators.forEach((o) => o.disconnect());
      gain.disconnect();
    } catch {}
  };
};

const playJoinSound = () => playChord([523.25, 659.25, 783.99]); // C major triad
const playLeaveSound = () => playChord([440.0, 329.63]); // A + E (pleasant lower dyad)

/**
 * Subscribes to `user:joined` / `user:left` socket events for the given server
 * and: 1) keeps the members query cache in sync 2) plays a short audio signal.
 *
 * The sound is NOT played for the current user (only for other participants).
 */
export const useMemberJoinLeaveSound = (serverId: string | null | undefined) => {
  const { socket } = useSocket();
  const currentUserId = useSessionStore((s) => s.user?.id);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !serverId) return;

    /* ---- JOIN ---- */
    const handleJoin = (member: Member, sid: string) => {
      if (sid !== serverId) return;
      if (member.userId === currentUserId) return; // ignore self

      // Update cache – add if absent
      qc.setQueryData<Member[]>(['members', sid], (old) => {
        if (!old) return old;
        if (old.some((m) => m.id === member.id)) return old;
        return [...old, member];
      });

      playJoinSound();
    };

    /* ---- LEAVE ---- */
    const handleLeave = (userId: string, sid: string) => {
      if (sid !== serverId) return;
      if (userId === currentUserId) return; // ignore self

      // Remove from cache
      qc.setQueryData<Member[]>(['members', sid], (old) => {
        if (!old) return old;
        return old.filter((m) => m.userId !== userId);
      });

      playLeaveSound();
    };

    socket.on('user:joined', handleJoin as any);
    socket.on('user:left', handleLeave as any);

    return () => {
      socket.off('user:joined', handleJoin as any);
      socket.off('user:left', handleLeave as any);
    };
  }, [socket, serverId, currentUserId]);
}; 