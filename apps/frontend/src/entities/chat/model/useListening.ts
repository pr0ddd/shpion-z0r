import { useEffect, useRef } from 'react';
import { useSocket } from '@libs/socket';
import { useListeningStore } from './listening.store';
import { useUnreadStore } from './unread.store';

export const useListening = (serverId: string, atBottom: boolean) => {
  const { socket } = useSocket();
  const setListening = useListeningStore(s=>s.set);
  const clearUnread = useUnreadStore(s=>s.clear);
  const visibleRef = useRef(document.visibilityState === 'visible');

  useEffect(()=>{
    const onVis = ()=>{
      visibleRef.current = document.visibilityState === 'visible';
      maybeEmit();
    };
    document.addEventListener('visibilitychange', onVis);
    return ()=>document.removeEventListener('visibilitychange', onVis);
  },[]);

  useEffect(()=>{
    maybeEmit();

    // cleanup on unmount: mark as not listening
    return ()=>{
      setListening(serverId, false);
      if(socket){
        (socket as any).emit('user:listening', { serverId, listening: false });
      }
    };
  },[atBottom, serverId]);

  const maybeEmit = ()=>{
    const listening = visibleRef.current && atBottom;
    setListening(serverId, listening);
    if(socket){
      (socket as any).emit('user:listening', { serverId, listening });
    }
    if(listening){
      clearUnread(serverId);
    }
  };
}; 