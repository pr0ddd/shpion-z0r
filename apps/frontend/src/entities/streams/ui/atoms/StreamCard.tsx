import { Box } from '@mui/material';

interface StreamCardProps {
  grow?: boolean;
  children: React.ReactNode;
}
export const StreamCard: React.FC<StreamCardProps> = ({ children, grow = false }) => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
        border: '1px solid',
        borderColor: 'new.border',
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
