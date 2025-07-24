import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { SmallIconButton } from '@ui/atoms/SmallIconButton';

export interface SectionAction {
  key: string;
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}

interface Props {
  actions: SectionAction[];
}

export const SectionActionBar: React.FC<Props> = ({ actions }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
    {actions.map((a) => (
      <Tooltip key={a.key} title={a.tooltip} arrow placement="top">
        <SmallIconButton onClick={a.onClick} disabled={a.disabled}>
          {a.icon}
        </SmallIconButton>
      </Tooltip>
    ))}
  </Box>
); 