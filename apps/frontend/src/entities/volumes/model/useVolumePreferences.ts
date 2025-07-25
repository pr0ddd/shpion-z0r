import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { volumeAPI } from '@shared/data';
import { useVolumeStore } from '@libs/livekit/hooks/useVolumeStore';

export const useVolumePreferences = () => {
  const setVolume = useVolumeStore((s) => s.setVolume);

  const fetchPreferences = async () => {
    const res = await volumeAPI.getPreferences();
    if (res.success) return res.data;
    throw new Error('Failed to fetch volume preferences');
  };

  const { data } = useQuery({
    queryKey: ['volumePreferences'],
    queryFn: fetchPreferences,
  });

  useEffect(() => {
    if (data) {
      data.forEach((pref) => {
        setVolume(pref.targetUserId, pref.volume);
      });
    }
  }, [data, setVolume]);
}; 