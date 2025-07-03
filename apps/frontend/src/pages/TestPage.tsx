import React from 'react';
import { Box } from '@mui/material';

import { ServersLayout } from '@entities/servers/ui';
import { ServerLayout } from '@entities/server/ui';
import { useServerStore } from '@entities/server/model';

const TestPage: React.FC = () => {
  const { selectedServerId } = useServerStore();

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
      }}
    >
      <ServersLayout />

      {selectedServerId ? <ServerLayout /> : <div>No server selected</div>}
    </Box>
  );
};

export default TestPage;
