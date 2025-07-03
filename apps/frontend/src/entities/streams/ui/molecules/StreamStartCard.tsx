import { Box } from '@mui/material';
import { StreamCard } from '../atoms/StreamCard';

interface StreamStartCardProps {
  onClick: () => void;
}

export const StreamStartCard: React.FC<StreamStartCardProps> = ({
  onClick,
}) => {
  return (
    <StreamCard>
      <Box
        component="button"
        sx={{
          height: '90px',
          width: '160px',
          backgroundColor: 'unset',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        + Start stream
      </Box>
    </StreamCard>
  );
};
