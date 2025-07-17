import { SystemSetting } from '@shared/types';
import { TextField } from '@ui/atoms/TextField';

interface SystemSettingsItemProps {
  setting: SystemSetting;
  value: string;
  onChange: (value: string) => void;
}

export const SystemSettingsItem: React.FC<SystemSettingsItemProps> = ({
  setting,
  value,
  onChange,
}) => {
  return (
    <TextField
      sx={{ mb: 2 }}
      margin="normal"
      variant="outlined"
      fullWidth
      label={setting.code_name}
      helperText={setting.description}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type="text"
    />
  );
};
