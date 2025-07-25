import React from 'react';
import { Box, Typography } from '@mui/material';
import { Send, AttachFile } from '@mui/icons-material';

import { TextField } from '@ui/atoms/TextField';
import { IconButton } from '@ui/atoms/IconButton';

import { useServerStore } from '@entities/server/model';
import { useChatMessagesForm } from '@entities/chat/model/useChatMessagesForm';
import { useFileUpload } from '@entities/chat/model/useFileUpload';
import { createOptimisticMessage } from '@entities/chat/utils/createOptimisticMessage';
import { useSessionStore } from '@entities/session';
import { updateMessagesCache } from '@entities/chat/api/updateMessagesCache';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useSendMessageMutation } from '@entities/chat/api/sendMessage.mutation';
import { useReplyStore } from '@entities/chat/model/reply.store';
import { useEditStore } from '@entities/chat/model/edit.store';
import { useEditMessageMutation } from '@entities/chat/api/editMessage.mutation';
import { IconButton as MuiIconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSocket } from '@libs/socket';
import { useTypingStore } from '@entities/chat/model/typing.store';

/**
 * ChatMessagesForm – textarea + send-button для ввода и отправки сообщений.
 * Подходит как чатовая нижняя панель.
 */
export const ChatMessagesForm: React.FC = () => {
  const serverId = useServerStore((s) => s.selectedServerId)!;
  const { text, setText, inputRef, handleSubmit, handleKeyDown, sendMessage } =
    useChatMessagesForm(serverId);

  const replyTo = useReplyStore(s=>s.replyTo);
  const clearReply = useReplyStore(s=>s.clear);

  const editing = useEditStore(s=>s.editing);
  const clearEdit = useEditStore(s=>s.clear);
  const { mutate: editMutate } = useEditMessageMutation(serverId);

  const { upload } = useFileUpload();
  const { socket } = useSocket();

  const emitTyping = (typing:boolean)=>{
    if(!socket) return;
    (socket as any).emit('typing',{ serverId, typing });
    // update local store so indicator shows for self
    useTypingStore.getState().set(useSessionStore.getState().user!.id, useSessionStore.getState().user!.username, typing);
  };

  // on change debounce
  React.useEffect(() => {
    if(!text.trim()) { emitTyping(false); return; }
    emitTyping(true);
    const id=setTimeout(()=>emitTyping(false),2000);
    return ()=>clearTimeout(id);
  },[text]);

  React.useEffect(()=>{
    if(editing){
      setText(editing.content);
      inputRef.current?.focus();
    }
  },[editing]);

  const user = useSessionStore(s=>s.user)!;
  const qc = useQueryClient();
  const { mutate: mutateRaw } = useSendMessageMutation(serverId);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      // optimistic uploading message
      const optimistic = createOptimisticMessage(file.name, user, serverId, { attachment: file.name, type: file.type.startsWith('image/')?'IMAGE':'FILE' } as any);
      optimistic.status = 'uploading';
      optimistic.uploadTotal = file.size;
      optimistic.uploadLoaded = 0;

      updateMessagesCache(qc, serverId!, msgs=>[...msgs, optimistic]);

      const { url, type } = await upload(file, (loaded,total)=>{
        updateMessagesCache(qc, serverId!, msgs=>msgs.map(m=> m.id===optimistic.id ? {...m, uploadLoaded: loaded} : m));
      });

      // turn optimistic into sent by replacing attachment and clearing status
      updateMessagesCache(qc, serverId!, msgs=>msgs.map(m=> m.id===optimistic.id ? {...m, attachment:url, content:file.name, status: undefined, uploadLoaded: undefined, uploadTotal: undefined, type} : m));

      mutateRaw(file.name, { attachment: url, type });

    }

    // reset
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Box
      sx={{
        p: 1,
        borderTop: '1px solid',
        borderColor: 'new.border',
        backgroundColor: 'new.card',
      }}
    >
      {replyTo && (
        <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5, pl:1 }}>
          <Typography variant="caption" sx={{color:'new.mutedForeground', fontWeight:600}}>
            Reply {replyTo.author?.username ? `@${replyTo.author.username}`:''}
          </Typography>
          <Typography variant="caption" sx={{color:'new.mutedForeground', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
            {replyTo.content}
          </Typography>
          <MuiIconButton size="small" onClick={clearReply}>
            <CloseIcon sx={{fontSize:16}}/>
          </MuiIconButton>
        </Box>
      )}
      {editing && (
        <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5, pl:1 }}>
          <Typography variant="caption" sx={{color:'new.mutedForeground', fontWeight:600}}>
            Editing
          </Typography>
          <Typography variant="caption" sx={{color:'new.mutedForeground', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
            {editing.content}
          </Typography>
          <MuiIconButton size="small" onClick={clearEdit}>
            <CloseIcon sx={{fontSize:16}}/>
          </MuiIconButton>
        </Box>
      )}
      <Box
        component="form"
        onSubmit={(e)=>{
          e.preventDefault();
          if(editing){
            const value=text.trim();
            if(!value) return;
            editMutate({ id: editing.id, content: value });
            clearEdit();
            setText('');
            return;
          }
          handleSubmit(e);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          placeholder={'Write a message...'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e)=>{
            if(e.key==='Enter' && !e.shiftKey){
              if(editing){
                e.preventDefault();
                const value=text.trim();
                if(!value) return;
                editMutate({ id: editing.id, content: value });
                clearEdit();
                setText('');
                return;
              }
            }
            handleKeyDown(e);
          }}
          disabled={!serverId}
          inputRef={inputRef}
          autoComplete="off"
          inputProps={{ autoComplete: 'off', spellCheck: 'false' }}
        />
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          onChange={onSelectFiles}
        />
        <IconButton
          icon={<AttachFile />}
          color="default"
          hasBorder={true}
          tooltip="Attach file"
          onClick={() => fileInputRef.current?.click()}
        />
        <IconButton
          icon={<Send />}
          color="primary"
          type="submit"
          disabled={!text.trim() || !serverId}
        />
      </Box>
    </Box>
  );
};
