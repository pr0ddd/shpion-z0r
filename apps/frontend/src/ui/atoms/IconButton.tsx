import {
  IconButton as MuiIconButton,
  IconButtonProps as MuiIconButtonProps,
  Tooltip,
} from '@mui/material';

type IconButtonBgColor = 'default' | 'primary' | 'accent' | 'error' | 'transparent';
type IconButtonProps = MuiIconButtonProps & {
  icon: React.ReactNode;
  hasBorder?: boolean;
  tooltip?: string;
  color?: IconButtonBgColor;
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  hasBorder = true,
  tooltip = '',
  color = 'default',
  size = 'medium',
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <Tooltip title={tooltip} placement="top" arrow>
      <MuiIconButton
        onClick={handleClick}
        size={size}
        color={color}
        sx={{
          transition: 'color .2s ease',
          borderRadius: 1,
          border: hasBorder ? '1px solid' : 'none',
          borderColor: hasBorder ? 'new.borderLight' : 'transparent',
        }}
        {...props}
      >
        {icon}
      </MuiIconButton>
    </Tooltip>
  );
};
