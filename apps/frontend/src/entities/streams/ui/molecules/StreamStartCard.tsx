import { Box, Typography } from '@mui/material';
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
          height: '110px',
          width: '190px',
          backgroundColor: 'unset',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        <Typography variant="body1" color="new.foreground">
          + Start stream
        </Typography>
      </Box>
    </StreamCard>
  );
};
