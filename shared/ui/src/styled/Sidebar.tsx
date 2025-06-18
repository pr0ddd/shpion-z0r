import { Box, Divider } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { lighten } from '@mui/material/styles';

// Animated gradient keyframes
const gradientFlow = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Common sidebar wrapper (72px width, vertical stack)
export const SidebarWrapper = styled(Box)(({ theme }) => ({
  width: 72,
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
  // default non-selected state
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,

  // gradient styles for selected
  ...(isselected === 'true' && {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.text.primary,
  }),

  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.getContrastText(theme.palette.primary.main),
    transform: 'scale(1.05)',
  },
}));

export const StyledDivider = styled(Divider)(({ theme }) => ({
  width: 32,
  backgroundColor: theme.palette.background.paper,
  margin: theme.spacing(0.5, 'auto'),
})); 