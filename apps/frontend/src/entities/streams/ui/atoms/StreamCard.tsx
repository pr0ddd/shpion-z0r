import { Box } from '@mui/material';

interface StreamCardProps {
  grow?: boolean;
  children: React.ReactNode;
}
export const StreamCard: React.FC<StreamCardProps> = ({ children, grow = false }) => {
  return (
    <Box
      sx={{
        backgroundColor: '#2B2D31',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 1,
        overflow: 'hidden',
        ...(grow && {
          width: '100%',
        }),
      }}
    >
      {children}
    </Box>
  );
};
