import { Box, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { lighten } from '@mui/material/styles';

// Horizontal top bar (full width, horizontal stack)
export const SidebarWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 54,
  flex: '0 0 54px',
  flexShrink: 0,
  padding: theme.spacing(1, 2),
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  position: 'relative',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

// Round-ish button for server avatar / action
export const ServerButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})<{ isSelected?: string }>(({ theme, isSelected }) => ({
  width: 38,
  height: 38,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'context-menu',
  transition: 'transform .2s',
  borderRadius: 9,
  position: 'relative',
  // default non-selected state
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,

  // gradient styles for selected
  ...(isSelected === 'true' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  }),

  // dot indicator
  '&::after': {
    content: '""',
    position: 'absolute',
    left: -8,
    top: 15,
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    opacity: isSelected === 'true' ? 1 : 0,
    transition: 'opacity .2s',
  },

  '&:hover': {
    transform: 'scale(1.05)',
    ...(isSelected === 'true'
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
  height: 24,
  backgroundColor: theme.palette.background.paper,
  margin: theme.spacing('auto', 0.5),
})); 

export const ActionButtons = styled(Box)({
  marginLeft: 'auto',
  display: 'flex',
  flexDirection: 'row',
  gap: 8,
  alignItems: 'center',
});

// Quick Switch Panel Styles
export const QuickSwitchButton = styled(Box)(({ theme }) => ({
  height: 38,
  padding: theme.spacing(0.75, 1.5),
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  borderRadius: 9,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,
  position: 'relative',
  gap: theme.spacing(0.75),
  
  '&:hover': {
    backgroundColor: lighten(theme.palette.background.paper, 0.1),
    color: theme.palette.text.primary,
    transform: 'scale(1.05)',
  },
}));

export const QuickSwitchPanel = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: '100%',
  top: 0,
  marginLeft: theme.spacing(1),
  width: 280,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 9,
  padding: theme.spacing(1.5),
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  border: `1px solid ${theme.palette.divider}`,
  zIndex: 1000,
  opacity: 0,
  visibility: 'hidden',
  transform: 'translateX(-10px)',
  transition: 'all 0.2s ease',
  
  '&.visible': {
    opacity: 1,
    visibility: 'visible',
    transform: 'translateX(0)',
  },
}));

export const ServerGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  width: '100%',
}));

export const ServerGridItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.5),
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: isSelected ? theme.palette.primary.main : 'transparent',
  color: isSelected ? theme.palette.primary.contrastText : theme.palette.text.primary,
  minHeight: 60,
  maxHeight: 60,
  width: '100%',
  aspectRatio: '1',
  
  '&:hover': {
    backgroundColor: isSelected 
      ? lighten(theme.palette.primary.main, 0.1)
      : theme.palette.action.hover,
  },
  
  '& .server-icon': {
    marginBottom: theme.spacing(0.25),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  '& .server-name': {
    fontSize: '9px',
    fontWeight: 600,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    lineHeight: 1,
  },
  
  '& .server-count': {
    fontSize: '8px',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 1,
    marginTop: theme.spacing(0.25),
  },
}));

export const AddServerButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.5),
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: `2px dashed ${theme.palette.divider}`,
  color: theme.palette.text.secondary,
  minHeight: 60,
  maxHeight: 60,
  width: '100%',
  aspectRatio: '1',
  
  '&:hover': {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  
  '& .add-icon': {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginBottom: theme.spacing(0.25),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
}));

// Compact Voice Control Bar for top panel
export const CompactVoiceControlBar = styled(Box)(({ theme }) => ({
  height: 38,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.75, 1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: 9,
  
  '& .MuiIconButton-root': {
    width: 28,
    height: 28,
    padding: theme.spacing(0.25),
    
    '& .MuiSvgIcon-root': {
      fontSize: '16px',
    },
  },
}));