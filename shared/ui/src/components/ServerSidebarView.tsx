import React, { memo } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  Typography,
  Skeleton,
} from '@mui/material';
import { SidebarWrapper, ServerButton, StyledDivider } from '@shared/ui';
import { styled as muiStyled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';

const ActionBox = muiStyled(Box)({
  marginTop: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  paddingBottom: 8,
});

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
                  <Avatar src={s.icon} variant="square" sx={{ width:48, height:48, borderRadius:1.5, objectFit:'cover' }}/>
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

        <ActionBox>
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
        </ActionBox>
      </SidebarWrapper>
    );
  }
);

export default ServerSidebarView; 