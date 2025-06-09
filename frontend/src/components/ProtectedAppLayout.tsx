import React from 'react';
import { Box } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import LiveKitManager from './LiveKitManager';

const ProtectedAppLayout: React.FC = () => {
    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <ServersSidebar />
            <LiveKitManager />
        </Box>
    );
};

export default ProtectedAppLayout; 