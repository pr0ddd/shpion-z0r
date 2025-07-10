import { Chip as MuiChip } from '@mui/material';

interface ChipProps {
  label: string;
  variant?: 'filled' | 'outlined';
  color?: 'primary' | 'secondary' | 'default';
}

export const Chip: React.FC<ChipProps> = ({ label, variant = 'outlined', color = 'default' }) => {
  return <MuiChip label={label} variant={variant} color={color} />;
};
