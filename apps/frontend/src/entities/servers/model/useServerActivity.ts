import { useEffect } from 'react';
import { create } from 'zustand';
import { useSocket } from '@libs/socket';

interface ActivityInfo {
  streamCount: number;
}

interface ServerActivityState {
  activities: Record<string, ActivityInfo>;
  setStreamCount: (serverId: string, count: number) => void;
  getActivity: (serverId: string) => ActivityInfo;
}

const useServerActivityStore = create<ServerActivityState>((set, get) => ({
  activities: {},
  setStreamCount: (serverId, count) =>
    set((state) => ({
      activities: { ...state.activities, [serverId]: { streamCount: count } },
    })),
  getActivity: (serverId) => get().activities[serverId] || { streamCount: 0 },
}));

// Hook that returns helpers and also sets up socket subscription once
export const useServerActivity = () => {
  const { setStreamCount, getActivity } = useServerActivityStore();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleStreamCount = (
      data: { serverId: string; streamCount: number }
    ) => {
      setStreamCount(data.serverId, data.streamCount);
    };

    // Custom event from backend (implement there) or fallback to 0
    (socket as any).on('server:stream-count', handleStreamCount);
    return () => {
      (socket as any).off('server:stream-count', handleStreamCount);
    };
  }, [socket, setStreamCount]);

  return {
    getServerActivity: getActivity,
    setStreamCount,
  };
};

// expose store for subscription
export { useServerActivityStore }; 