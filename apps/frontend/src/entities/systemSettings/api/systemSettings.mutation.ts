import { adminAPI } from '@shared/data';
import { SystemSetting, SystemSettingsPayload } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';


const bulkUpdateSystemSettings = async (payload: SystemSettingsPayload): Promise<SystemSetting[]> => {
  try {
    const res = await adminAPI.bulkUpdateSystemSettings(payload);
    if (res.success && res.data) return res.data;
  
    throw new Error('Failed to update system settings');
  } catch (error) {
    throw error.response?.data.error;
  }
};

export const useBulkUpdateSystemSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SystemSettingsPayload) => await bulkUpdateSystemSettings(payload),
    onSuccess: (data: SystemSetting[]) => {
      queryClient.setQueryData(['systemSettingsList'], (_: SystemSetting[]) => data);
      alert('System settings updated successfully');
    },
    onError: (error: unknown) => {
      console.error(error)
    },
  });
};
