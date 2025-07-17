import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
} from '@mui/material';

type TextFieldProps = MuiTextFieldProps<'standard' | 'outlined' | 'filled'> & {
};

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  placeholder,
  value,
  variant = 'filled',
  onChange,
  ...props
}) => {
  return (
    <MuiTextField
      fullWidth
      hiddenLabel
      variant={variant}
      id={id}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};
