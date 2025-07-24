import React from 'react';
import { Box, Typography } from '@mui/material';
import { SectionAction, SectionActionBar } from '@ui/molecules/SectionActionBar';

interface Props {
  icon?: React.ReactNode;
  onIconClick?: () => void;
  title?: string;
  subtitle?: string;
  actions?: SectionAction[];
}

export const SectionHeader: React.FC<Props> = ({ icon, onIconClick, title, subtitle, actions = [] }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1}}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
      {icon && (onIconClick ? <Box onClick={onIconClick} sx={{cursor:'pointer'}}>{icon}</Box> : icon)}
      <Box sx={{ minWidth: 0 }}>
        {title && (
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    {actions.length > 0 && <SectionActionBar actions={actions} />}
  </Box>
); 