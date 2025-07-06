import { ServerUpdateDto } from '@shared/data';
import { useState } from 'react';
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
  const { mutate: updateServer, error: serverError, isPending } = useUpdateServerMutation();

  const [values, setValues] = useState<UpdateServerFormValues>({
    name: server.name || undefined,
    description: server.description || undefined,
    icon: server.icon || undefined,
    sfuId: server.sfuId || undefined,
  });

  const [errors, setErrors] = useState<UpdateServerFormErrors>({});

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
      sfuId: values.sfuId,
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
