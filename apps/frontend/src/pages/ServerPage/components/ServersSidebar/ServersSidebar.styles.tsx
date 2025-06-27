import { Box, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { lighten } from '@mui/material/styles';

// Common sidebar wrapper (72px width, vertical stack)
export const SidebarWrapper = styled(Box)(({ theme }) => ({
  width: 72,
  flex: '0 0 72px',
  flexShrink: 0,
  height: '100vh',
  padding: theme.spacing(1.5, 0),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  backgroundColor: theme.palette.background.default,
  position: 'relative',
}));

// Round-ish button for server avatar / action
export const ServerButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isselected',
})<{ isselected?: string }>(({ theme, isselected }) => ({
  width: 50,
  height: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'context-menu',
  transition: 'transform .2s',
  borderRadius: 12,
  pb: 2,
  position: 'relative',
  // default non-selected state
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,

  // gradient styles for selected
  ...(isselected === 'true' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  }),

  // dot indicator
  '&::after': {
    content: '""',
    position: 'absolute',
    left: -10,
    top: 20,
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    opacity: isselected === 'true' ? 1 : 0,
    transition: 'opacity .2s',
  },

  '&:hover': {
    transform: 'scale(1.05)',
    ...(isselected === 'true'
      ? {
          backgroundColor: lighten(theme.palette.primary.main, 0.15),
          color: theme.palette.primary.contrastText,
        }
      : {
          backgroundColor: lighten(theme.palette.background.paper, 0.1),
          color: theme.palette.text.primary,
        }),
  },
}));

export const StyledDivider = styled(Divider)(({ theme }) => ({
  width: 32,
  backgroundColor: theme.palette.background.paper,
  margin: theme.spacing(0.5, 'auto'),
})); 