import { useState } from 'react';

import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { AnimatedContainer, FadeInUp } from '@ui/motion';

import CreateServerDialog from '@entities/server/ui/organisms/CreateServerDialog';

export const LobbyTemplate = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <AnimatedContainer>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 3,
          }}
        >
          <FadeInUp>
            <Typography
              component={motion.h3}
              variant="h3"
              sx={{ textShadow: '0 0 10px new.primary', zIndex: 1 }}
            >
              Enter the Shadows of Shpion <img src="/lobby.png" alt="Shpion" />
            </Typography>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <Typography
              component={motion.p}
              variant="subtitle1"
              color="new.mutedForeground"
              sx={{ maxWidth: '600px' }}
            >
              Your covert communication network awaits. Forge alliances, share
              secrets, and dominate the digital espionage world.
            </Typography>
          </FadeInUp>

          <FadeInUp delay={0.4}>
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
          </FadeInUp>
        </Box>
      </AnimatedContainer>

      <CreateServerDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  );
};
