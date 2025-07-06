import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
} from '@mui/material';

type TextFieldProps = MuiTextFieldProps<'standard'> & {
};

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
}) => {
  return (
    <MuiTextField
      fullWidth
      hiddenLabel
      variant='filled'
      id={id}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};
