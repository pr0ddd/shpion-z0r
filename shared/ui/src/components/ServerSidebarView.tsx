import React, { memo } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  Divider,
  Typography,
  Skeleton,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';

const SidebarWrapper = styled(Box)(({ theme }) => ({
  width: 72,
  height: '100vh',
  padding: theme.spacing(1.5, 0),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  backgroundColor: theme.palette.background.default,
}));

const ServerButton = styled(Box)<{ isselected?: string }>(({ theme, isselected }) => ({
  width: 48,
  height: 48,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-radius 0.2s ease, background-color 0.2s ease, transform 0.2s ease',
  backgroundColor:
    isselected === 'true' ? theme.palette.primary.main : theme.palette.background.paper,
  color:
    isselected === 'true'
      ? theme.palette.getContrastText(theme.palette.primary.main)
      : theme.palette.text.secondary,
  borderRadius: isselected === 'true' ? '16px' : '50%',
  '&:hover': {
    borderRadius: '16px',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.getContrastText(theme.palette.primary.main),
    transform: 'scale(1.05)',
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  width: 32,
  backgroundColor: theme.palette.background.paper,
  margin: theme.spacing(0.5, 'auto'),
}));

interface ServerSidebarViewProps {
  servers: Array<{ id: string; name: string; icon?: string; canManage: boolean }>;
  selectedId: string | null;
  loading?: boolean;
  error?: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onLogout: () => void;
  onContextMenu?: (id: string, x: number, y: number) => void;
}

const ServerSkeletonList = () => (
  <>
    {[...Array(3)].map((_, idx) => (
      <Skeleton
        key={idx}
        variant="circular"
        width={48}
        height={48}
        sx={{ bgcolor: 'grey.800' }}
      />
    ))}
  </>
);

export const ServerSidebarView: React.FC<ServerSidebarViewProps> = memo(
  ({ servers, selectedId, loading, error, onSelect, onCreate, onLogout, onContextMenu }) => {
    return (
      <SidebarWrapper>
        {/* Home / none */}
        <Tooltip title="Космическое пространство" placement="right">
          <ServerButton
            isselected={(selectedId === null).toString()}
            onClick={() => onSelect(null)}
          >
            <Typography sx={{ fontWeight: 'bold' }}>@</Typography>
          </ServerButton>
        </Tooltip>
        <StyledDivider />

        {loading ? (
          <ServerSkeletonList />
        ) : (
          servers.map((s) => (
            <Tooltip key={s.id} title={s.name} placement="right">
              <ServerButton
                isselected={(selectedId === s.id).toString()}
                onClick={() => onSelect(s.id)}
                onContextMenu={s.canManage ? (e)=>{e.preventDefault(); onContextMenu?.(s.id,e.clientX,e.clientY);} : undefined}
              >
                {s.icon ? (
                  <Avatar src={s.icon} sx={{ width: 48, height: 48 }} />
                ) : (
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {s.name.charAt(0).toUpperCase()}
                  </Typography>
                )}
              </ServerButton>
            </Tooltip>
          ))
        )}

        {error && (
          <Typography
            color="error"
            sx={{ maxWidth: '60px', overflowWrap: 'break-word', fontSize: '10px' }}
          >
            {error}
          </Typography>
        )}

        <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1, pb: 1 }}>
          <Tooltip title="Создать сервер" placement="right">
            <ServerButton onClick={onCreate}>
              <AddIcon />
            </ServerButton>
          </Tooltip>
          <Tooltip title="Выйти" placement="right">
            <ServerButton onClick={onLogout}>
              <LogoutIcon />
            </ServerButton>
          </Tooltip>
        </Box>
      </SidebarWrapper>
    );
  }
);

export default ServerSidebarView; 