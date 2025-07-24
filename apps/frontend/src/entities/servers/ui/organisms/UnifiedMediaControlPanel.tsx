import React, { useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useSessionStore } from '@entities/session';
import { useServerStore } from '@entities/server/model';
import { useSettingsDialogStore, SettingsDialog, GlobalHotkeys } from '@entities/settings';
import { useLocalParticipant, useRoomContext, useConnectionState, ConnectionState as LKConnectionState } from '@livekit/components-react';
import { useSelectedServerName } from '@hooks/useSelectedServerName';
import { MediaControls, PlaceholderControls } from '@ui/molecules/MediaControls';
import { QualityIndicator } from '@ui/atoms/QualityIndicator';
import { Avatar } from '@ui/atoms/Avatar';

export const UnifiedMediaControlPanel: React.FC = () => {
    /* ------------ hooks ------------- */
    const user = useSessionStore((s) => s.user);
    const connectionState = useConnectionState();
    const serverName = useSelectedServerName();
    const toggleSettings = useSettingsDialogStore((s) => s.toggle);
    const { setSelectedServerId } = useServerStore();

    const { localParticipant } = useLocalParticipant();
    const room = useRoomContext(); // needed for status only maybe

    const statusColor = useMemo(() => {
        const colorMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
            connected: 'success',
            connecting: 'warning',
            reconnecting: 'warning',
            disconnected: 'error',
        };
        return colorMap[String(connectionState)] ?? 'info';
    }, [connectionState]);

    const isConnected = connectionState === 'connected';
    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1,
            p: 1,
            backgroundColor: 'new.sidebar',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'new.border'
        }}>

           {/* User info row */}
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
             <Avatar 
               src={user?.avatar || undefined} 
               sx={{ width: 36, height: 36 }} 
             />
             <Box sx={{ flex: 1, minWidth: 0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
               {/* first line – username + quality */}
               <Box sx={{ display:'flex', alignItems:'center', gap:0.5, minWidth:0 }}>
                 <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                   {user?.username || 'Пользователь'}
                 </Typography>
                 {isConnected && localParticipant && (
                   <QualityIndicator participant={localParticipant} />
                 )}
               </Box>

               {/* second line – server name and connection status */}
               <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mt:0.25, minWidth:0 }}>
                 {serverName && (
                   <Typography variant="caption" noWrap sx={{ color:'text.secondary' }}>
                     {serverName}
                   </Typography>
                 )}
                 <Chip
                   label={<LKConnectionState />}
                   color={statusColor}
                   size="small"
                   sx={{ height: 18, fontSize: '0.7rem' }}
                 />
                 </Box>
             </Box>
           </Box>

           {/* Controls row – reserve space even while not connected to prevent layout shift */}
           {isConnected ? (
             <MediaControls userId={user?.id} onOpenSettings={toggleSettings} onLeave={() => setSelectedServerId(null)} />
           ) : (
             <PlaceholderControls />
           )}

         {/* Dialogs / hotkeys */}
         <SettingsDialog />
         <GlobalHotkeys />
       </Box>
     );
   };

// end of component file; MediaControls extracted to separate molecule 