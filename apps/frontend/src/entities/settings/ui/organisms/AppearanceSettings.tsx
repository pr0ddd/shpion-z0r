import React from 'react';
import { Box, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useThemeModeStore } from '../../model/themeMode.store';

export const AppearanceSettings: React.FC = () => {
  const mode = useThemeModeStore((s) => s.mode);
  const setMode = useThemeModeStore((s) => s.setMode);

  return (
    <Box sx={{ maxWidth: 300 }}>
      <FormControl component="fieldset">
        <FormLabel component="legend">Тема интерфейса</FormLabel>
        <RadioGroup
          value={mode}
          onChange={(e) => setMode(e.target.value as 'light' | 'dark')}
        >
          <FormControlLabel value="dark" control={<Radio />} label="Тёмная" />
          <FormControlLabel value="light" control={<Radio />} label="Светлая" />
        </RadioGroup>
      </FormControl>
    </Box>
  );
}; 