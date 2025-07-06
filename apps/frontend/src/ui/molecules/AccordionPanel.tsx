import { Typography, Box } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import React, { useState } from 'react';
import { IconButton } from '@ui/atoms/IconButton';

type AccordionPanelProps = {
  title: string;
  subtitle?: string;
  expanded?: boolean;
  disabled?: boolean;
  showToggle?: boolean;
  children: React.ReactNode;
};

export const AccordionPanel: React.FC<AccordionPanelProps> = ({
  title,
  subtitle,
  children,
  expanded = true,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const handleExpand = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsExpanded(!isExpanded);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: isExpanded ? 1 : 0,
      }}
    >
      {/* Header */}
      <Box
        component="button"
        onClick={disabled ? undefined : handleExpand}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'unset',
          border: 'none',
          borderBottom: isExpanded ? '1px solid' : 'none',
          borderColor: 'new.border',
          gap: 1,
          paddingInline: 2,
          paddingBlock: 1,
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <Typography component="h6" variant="h6" color="new.foreground">
            {title}
          </Typography>
          {subtitle && (
            <Typography component="span" color="new.mutedForeground">
              {subtitle}
            </Typography>
          )}
        </Box>

        {!disabled && (
          <IconButton
            hasBorder={false}
            component="div"
            icon={isExpanded ? <ExpandMore /> : <ExpandLess />}
            color="transparent"
            onClick={handleExpand}
          >
            {isExpanded ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
        )}
      </Box>

      {/* content */}
      {isExpanded && children}
    </Box>
  );
};
