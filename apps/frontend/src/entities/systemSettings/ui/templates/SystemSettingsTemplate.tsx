import { SystemSettingsItem } from '../molecules/SystemSettingsItem';
import { Box, Button, Typography } from '@mui/material';

import { useSystemSettingsForm } from '../../model/useSystemSettingsForm';
import { CircularProgress } from '@ui/atoms/CircularProgress';

export const SystemSettingsTemplate = () => {
  const { isReady, formData, systemSettings, handleChange, handleSubmit } =
    useSystemSettingsForm();

  return (
    <Box
      sx={{
        margin: 'auto',
        width: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <Box>
        <Typography variant="h3">System Settings</Typography>
      </Box>
      {!isReady ? (
        <Box>
          <CircularProgress />
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
          {systemSettings && systemSettings.length > 0 ? (
            systemSettings.map((setting) => (
              <SystemSettingsItem
                key={setting.id}
                setting={setting}
                value={formData[setting.id]}
                onChange={(value) => handleChange(setting.id, value)}
              />
            ))
          ) : (
            <Box>
              <Typography variant="body1">
                You don't have any system settings set up
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            type="submit"
            sx={{ marginTop: '10px', width: '100%' }}
          >
            Save
          </Button>
        </Box>
      )}
    </Box>
  );
};
