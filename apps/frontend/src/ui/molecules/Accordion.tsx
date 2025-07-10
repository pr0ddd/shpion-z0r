import { Box } from '@mui/material';
import React from 'react';

type AccordionProps = {
  children: React.ReactNode;
};

export const Accordion: React.FC<AccordionProps> = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        '& > *': {
          borderBottom: '1px solid',
          borderColor: 'new.border',
        },
        '& > *:last-child': {
          borderBottom: 'none',
        },
      }}
    >
      {children}
    </Box>
  );
};
