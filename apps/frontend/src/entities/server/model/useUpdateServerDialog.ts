import { ServerUpdateDto } from '@shared/data';
import { useEffect, useState } from 'react';
import { useUpdateServerMutation } from '../api';
import { Server } from '@shared/types';

type UpdateServerFormValues = {
  name: string | undefined;
  description: string | undefined;
  icon: string | undefined;
  sfuId: string | undefined;
};

type UpdateServerFormErrors = Partial<
  Record<keyof UpdateServerFormValues, string>
>;

export function useUpdateServerDialog(server: Server) {
  const {
    mutate: updateServer,
    error: serverError,
    isPending,
  } = useUpdateServerMutation();

  const [values, setValues] = useState<UpdateServerFormValues>({
    name: undefined,
    description: undefined,
    icon: undefined,
    sfuId: '',
  });

  const [errors, setErrors] = useState<UpdateServerFormErrors>({});

  useEffect(() => {
    setValues({
      name: server.name || undefined,
      description: server.description || undefined,
      icon: server.icon || undefined,
      sfuId: server.sfuId || '',
    });
  }, [server]);

  // Простая валидация
  const validate = (): boolean => {
    const newErrors: UpdateServerFormErrors = {};
    if (!values.name) {
      newErrors.name = 'Name is required';
    }

    if (!values.description) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof UpdateServerFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (serverId: string) => {
    if (!validate()) throw new Error('Validation failed');

    const payload: ServerUpdateDto = {
      serverId,
      name: values.name,
      description: values.description,
      icon: values.icon,
      // Отправляем sfuId только если он выбран; пустую строку игнорируем
      sfuId: values.sfuId ? values.sfuId : undefined,
    };

    updateServer(payload);
  };

  return {
    values,
    errors,
    serverError,
    isPending,
    handleChange,
    handleSubmit,
  };
}
