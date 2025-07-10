import { useState } from 'react';

import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

import CreateServerDialog from '@entities/server/ui/organisms/CreateServerDialog';

export const LobbyTemplate = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'new.foreground',
          gap: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            zIndex: 0,
          },
        }}
      >
        <Typography
          component={motion.h3}
          variant="h3"
          sx={{ textShadow: '0 0 10px new.primary', zIndex: 1 }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          Enter the Shadows of Shpion <img src="/lobby.png" alt="Shpion" />
        </Typography>

        <Typography
          component={motion.p}
          variant="subtitle1"
          color="new.mutedForeground"
          sx={{ maxWidth: '600px', textAlign: 'center', zIndex: 1 }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        >
          Your covert communication network awaits. Forge alliances, share
          secrets, and dominate the digital espionage world.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, zIndex: 1 }}>
          <Button
            component={motion.button}
            variant="contained"
            color="primary"
            onClick={() => setIsCreateDialogOpen(true)}
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px new.primary' }}
            transition={{ duration: 0.3 }}
          >
            Create Secret Server
          </Button>
        </Box>
      </Box>

      <CreateServerDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  );
};
