import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@shared/data';
import { SystemSetting } from '@shared/types';

const fetchSystemSettings = async (): Promise<SystemSetting[]> => {
  const res = await adminAPI.getSystemSettings();
  if (res.success && res.data) return res.data;
  throw new Error('Failed to fetch system settings');
};

export const useSystemSettingsQuery = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['systemSettingsList'],
    queryFn: fetchSystemSettings,
  });

  return { data, isLoading };
};
