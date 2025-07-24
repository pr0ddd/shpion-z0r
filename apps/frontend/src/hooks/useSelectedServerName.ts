import { useMemo } from 'react';
import { useServerStore } from '@entities/server/model';
import { useServersQuery } from '@entities/servers/api';

export const useSelectedServerName = () => {
  const selectedServerId = useServerStore((s) => s.selectedServerId);
  const { data: servers } = useServersQuery();

  return useMemo(() => {
    if (!servers || !selectedServerId) return '';
    const srv = servers.find((s) => s.id === selectedServerId);
    return srv?.name || '';
  }, [servers, selectedServerId]);
}; 