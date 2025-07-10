import {
  Avatar as MuiAvatar,
  AvatarProps as MuiAvatarProps,
} from '@mui/material';

type AvatarProps = MuiAvatarProps & {
  src: string;
  borderColor?: string;
  borderWidth?: number;
};

export const Avatar: React.FC<AvatarProps> = ({
  borderColor = 'new.border',
  borderWidth = 1,
  ...props
}) => {
  return (
    <MuiAvatar
      variant="circular"
      sx={{
        backgroundColor: 'new.sidebarAccent',
        border: `${borderWidth}px solid`,
        borderColor: borderColor,
      }}
      {...props}
    />
  );
};
