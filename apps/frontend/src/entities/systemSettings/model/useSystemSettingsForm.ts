import { SystemSetting, SystemSettingsPayload } from '@shared/types';
import { useEffect, useState } from 'react';
import { useBulkUpdateSystemSettingsMutation } from '../api/systemSettings.mutation';
import { useSystemSettingsQuery } from '../api/systemSettings.query';

interface SystemSettingsForm {
  [key: number]: string;
}

export const useSystemSettingsForm = () => {
  const { data: systemSettings, isLoading } = useSystemSettingsQuery();
  const { mutate: bulkUpdateSystemSettings } =
    useBulkUpdateSystemSettingsMutation();

  const [formData, setFormData] = useState<SystemSettingsForm>({});
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (systemSettings) {
      initForm(systemSettings);
    }
  }, [systemSettings]);

  const handleChange = (id: number, value: string) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bulkUpdateSystemSettings(getPayload());
  };

  const initForm = (systemSettings: SystemSetting[]) => {
    const formData = systemSettings.reduce((acc, setting) => {
      acc[setting.id] = setting.value;
      return acc;
    }, {} as SystemSettingsForm);
    setFormData(formData);
    setIsFormInitialized(true);
  };

  const getPayload = (): SystemSettingsPayload => {
    return Object.entries(formData).reduce((acc, [id, value]) => {
      acc.push({ id: Number(id), value });
      return acc;
    }, [] as SystemSettingsPayload);
  };

  return {
    isReady: !isLoading && isFormInitialized,
    formData,
    systemSettings,
    handleChange,
    handleSubmit,
  };
};
