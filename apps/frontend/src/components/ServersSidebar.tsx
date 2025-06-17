import React, { useState, memo, useCallback } from 'react';
import { useServer } from '@shared/hooks';
import { useAuth } from '@shared/hooks';
import { useServerStore } from '@shared/hooks';
import { CreateServerDialog } from '@shared/ui';
import { ServerSidebarView } from '@shared/ui';
import { Menu, MenuItem } from '@mui/material';
import { serverAPI } from '@shared/data';
import { RenameServerDialog } from '@shared/ui';

const ServersSidebar: React.FC = () => {
  const { servers, selectedServer, isLoading, error, selectServer } = useServer();
  const { user, logout } = useAuth();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{x:number;y:number}|null>(null);
  const [contextId,setContextId]=useState<string|null>(null);
  const [isRenameOpen,setRenameOpen]=useState(false);

  const handleSelect = useCallback(
    (id: string | null) => {
      if (id === null) {
        selectServer(null);
        return;
      }
      const srv = servers.find((s) => s.id === id);
      if (srv) selectServer(srv);
    },
    [servers, selectServer]
  );

  const handleContext = (id:string,x:number,y:number)=>{
    setContextId(id);
    setMenuAnchor({x,y});
  };

  const closeMenu=()=>{setMenuAnchor(null);};

  const openRename=()=>{
    setRenameOpen(true);
    closeMenu();
  };

  const handleDelete = async ()=>{
    if(!contextId) return;
    try{
      await serverAPI.deleteServer(contextId);
      if(selectedServer?.id===contextId){
        selectServer(null);
      }
      useServerStore.getState().setServers(prev=>prev.filter(s=>s.id!==contextId));
    }finally{closeMenu();}
  };

  const currentContextServer = servers.find(s=>s.id===contextId) ?? null;

  return (
    <>
      <ServerSidebarView
        servers={servers.map(({ id, name, icon, ownerId }) => ({ id, name, icon: icon ?? undefined, canManage: ownerId===user?.id }))}
        selectedId={selectedServer?.id ?? null}
        loading={isLoading}
        error={error}
        onSelect={handleSelect}
        onCreate={() => setCreateDialogOpen(true)}
        onLogout={logout}
        onContextMenu={handleContext}
      />
      <Menu
        open={!!menuAnchor}
        onClose={closeMenu}
        anchorReference="anchorPosition"
        anchorPosition={menuAnchor ? {top:menuAnchor.y,left:menuAnchor.x}:undefined}
      >
        <MenuItem onClick={openRename}>Переименовать</MenuItem>
        <MenuItem onClick={handleDelete}>Удалить сервер</MenuItem>
      </Menu>
      <CreateServerDialog
        open={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
      <RenameServerDialog open={isRenameOpen} server={currentContextServer} onClose={()=>setRenameOpen(false)} />
    </>
  );
};

export default memo(ServersSidebar); 