import { Box, useTheme } from '@mui/material';

interface StreamCardProps {
  grow?: boolean;
  children: React.ReactNode;
}
export const StreamCard: React.FC<StreamCardProps> = ({
  children,
  grow = false,
}) => {
  const theme = useTheme();
  const bgDark = 'linear-gradient(135deg, #111827 0%, #1f2937 100%)';
  const bgLight = 'linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%)';

  return (
    <Box
      sx={{
        background: theme.palette.mode === 'dark' ? bgDark : bgLight,
        border: '1px solid',
        borderColor: 'new.border',
        borderRadius: 1,
        overflow: 'hidden',
        flexShrink: 0,
        ...(grow && {
          flex: 1,
        }),
      }}
    >
      {children}
    </Box>
  );
};
