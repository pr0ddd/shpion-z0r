import { ServerCreateDto } from '@shared/data';
import { useState } from 'react';
import { useCreateServerMutation } from '../api';

type CreateServerFormValues = {
  name: string;
  description: string;
  icon: string;
  sfuId: string;
};

type CreateServerFormErrors = Partial<
  Record<keyof CreateServerFormValues, string>
>;

export function useCreateServerDialog() {
  const { mutate, error: serverError, isPending } = useCreateServerMutation();

  const [values, setValues] = useState<CreateServerFormValues>({
    name: '',
    description: '',
    icon: '',
    sfuId: '',
  });

  const [errors, setErrors] = useState<CreateServerFormErrors>({});

  // Простая валидация
  const validate = (): boolean => {
    const newErrors: CreateServerFormErrors = {};
    if (!values.name) {
      newErrors.name = 'Name is required';
    }

    if (!values.description) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof CreateServerFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!validate()) throw new Error('Validation failed');

    const payload: ServerCreateDto = {
      name: values.name,
      description: values.description,
      icon: values.icon,
      sfuId: values.sfuId || undefined,
    };

    mutate(payload);
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
