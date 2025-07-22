import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { ListItem } from '@mui/material';

import { Message } from '@shared/types';
import { useServerStore } from '@entities/server/model';
import { useSessionStore } from '@entities/session';

import { useMessagesQuery } from '../../api/messagse.query';
import { useMessagesSocketSync } from '../../model/useMessagesSocketSync';
import { ChatMessagesLoading } from '../molecules/ChatMessagesLoading';
import { ChatMessageItem } from '../molecules/ChatMessageItem';
import { ChatImageCollage } from '../molecules/ChatImageCollage';
import { useGalleryStore } from '../../model/imageGallery.store';
import { useTypingStore } from '../../model/typing.store';
import { useTypingSocketSync } from '../../model/useTypingSocketSync';
import { Avatar } from '@ui/atoms/Avatar';
import { Typography, Box, ListItemAvatar } from '@mui/material';
import { useListening } from '../../model/useListening';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';


export const ChatMessagesList: React.FC = () => {
  const serverId = useServerStore((s) => s.selectedServerId);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessagesQuery(serverId!);

  // keep socket & query in sync
  useMessagesSocketSync(serverId!);
  useTypingSocketSync(serverId!);

  const typingState = useTypingStore(s=>s.state);

  // Flatten pages to chronological (oldest → newest) without resorting each render
  const rawMessages = useMemo(() => {
    if (!data) return [];
    // pages[0] = newest range, older pages are pushed later; reverse to prepend
    return [...data.pages]
      .reverse() // oldest page first
      .flatMap((p) => p.messages);
  }, [data]);

  // current user
  const user = useSessionStore(s => s.user);

  // Group consecutive image messages from same author
  const messages = useMemo(() => {
    const out: (Message | { collage: true; items: Message[] })[] = [];
    for (const m of rawMessages) {
      const last = out[out.length - 1];
      if (
        m.type === 'IMAGE' &&
        last &&
        'collage' in last &&
        last.items[last.items.length - 1].authorId === m.authorId
      ) {
        last.items.push(m);
      } else if (
        m.type === 'IMAGE' &&
        last &&
        !( 'collage' in last) &&
        (last as Message).type === 'IMAGE' &&
        (last as Message).authorId === m.authorId
      ) {
        out[out.length - 1] = { collage: true, items: [last as Message, m] };
      } else {
        out.push(m);
      }
    }
    return out;
  }, [rawMessages]);

  // Maintain firstItemIndex so Virtuoso compensates scroll when we prepend
  const [firstIndex, setFirstIndex] = useState(0);
  const prevPagesRef = useRef<number>(0);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (!data) return;

    if (prevPagesRef.current === 0) {
      prevPagesRef.current = data.pages.length;
      return;
    }

    if (data.pages.length > prevPagesRef.current) {
      const added = data.pages[data.pages.length - 1].messages.length;
      setFirstIndex((prev) => prev + added);
      prevPagesRef.current = data.pages.length;

      // shift viewport down by 'added' items to keep visual position and avoid immediate startReached
      // store rAF id so we can cancel if effect is cleaned up early
      const rafId = requestAnimationFrame(() => {
        (virtuosoRef.current as any)?.scrollToIndex({
          index: added,
          align: 'start',
          behavior: 'auto',
        });
      });

      // cancel scheduled frame on next cleanup to avoid dangling callbacks
      return () => cancelAnimationFrame(rafId);
    }
  }, [data]);

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const globalImages = useMemo(() => {
    return rawMessages
      .filter((m) => m.type === 'IMAGE' && m.attachment)
      .map((m) => {
        const isPrefixed = (m.attachment as string).startsWith('/api/upload/file');
        return isPrefixed
          ? (m.attachment as string)
          : `/api/upload/file/${encodeURIComponent(m.attachment as string)}`;
      });
  }, [rawMessages]);

  const typingUsers = Object.values(typingState).filter(t=>t.typing).map(t=>t.username).filter(n=>!!n && n!==user?.username);
  const selfTyping = typingState[user?.id ?? '']?.typing;
  const typingDisplay = typingUsers.length > 0 ? `${typingUsers.join(', ')} печатает…` : '';

  const [atBottom,setAtBottom] = useState(true);
  useListening(serverId!, atBottom);

  const [newCount,setNewCount]=useState(0);
  const prevLenRef = useRef(messages.length);

  useEffect(()=>{
    if(messages.length>prevLenRef.current){
      const diff = messages.length-prevLenRef.current;
      if(!atBottom){
        setNewCount(c=>c+diff);
      } else {
        // if we are at bottom just reset
        setNewCount(0);
      }
    }
    prevLenRef.current = messages.length;
  },[messages.length, atBottom]);

  // reset when user scrolls to bottom
  useEffect(()=>{
    if(atBottom){
      setNewCount(0);
    }
  },[atBottom]);

  if (isLoading) {
    return <ChatMessagesLoading />;
  }

  const handleImageClick = (url: string) => {
    const index = globalImages.indexOf(url);
    if (index === -1) return;
    useGalleryStore.getState().open(globalImages, index);
  };

  const scrollToBottom = ()=>{
    virtuosoRef.current?.scrollToIndex({ index: messages.length-1, align:'end', behavior:'smooth' });
    setNewCount(0);
  };

  return (
    <>
    <Virtuoso<any>
      ref={virtuosoRef}
      data={messages as any}
      firstItemIndex={firstIndex}
      initialTopMostItemIndex={firstIndex + messages.length - 1}
      atBottomStateChange={setAtBottom}
      itemContent={(index, item) => {
        if ((item as any).collage) {
          const group = item as { collage: true; items: Message[] };
          const isMine = !!user && user.id === group.items[0].authorId;
          const first = group.items[0];
          const time = new Date(first.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

          return (
            <ListItem
              sx={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 1,
                py: 1,
                px: 1,
              }}
            >
              {!isMine && (
                <ListItemAvatar sx={{ minWidth: 'auto', mt: 0.5 }}>
                  <Avatar src={first.author?.avatar || undefined} sx={{ width: 32, height: 32 }} />
                </ListItemAvatar>
              )}

              <Box sx={{ display:'flex',flexDirection:'column',alignItems:isMine?'flex-end':'flex-start'}}>
                {!isMine && (
                  <Box sx={{ display:'flex',alignItems:'center',gap:1, mb:0.5 }}>
                    <Typography variant="body2" sx={{color:'new.foreground',fontWeight:600,fontSize:'0.875rem'}}>
                      {first.author?.username || 'Неизвестный'}
                    </Typography>
                    <Typography variant="caption" sx={{color:'new.mutedForeground',fontSize:'0.75rem'}}>
                      {time}
                    </Typography>
                  </Box>
                )}

                <ChatImageCollage
                  messages={group.items}
                  isMine={isMine}
                  serverId={serverId!}
                  onImageClick={handleImageClick}
                  onAllLoaded={index === messages.length - 1 ? scrollToBottom : undefined}
                />

                {isMine && (
                  <Typography variant="caption" sx={{ color:'new.mutedForeground',fontSize:'0.75rem', mt:0.5 }}>
                    {time}
                  </Typography>
                )}
              </Box>
            </ListItem>
          );
        }
        const msg = item as Message;
        return <ChatMessageItem key={msg.id} message={msg} serverId={serverId!} onImageClick={handleImageClick} />;
      }}
      startReached={loadMore}
      followOutput="auto"
      overscan={200}
    />
    {typingDisplay && (
      <Box sx={{ position:'absolute', bottom:48, left:0, right:0, display:'flex', justifyContent:'center', pointerEvents:'none' }}>
        <Typography variant="caption" sx={{ color:'new.mutedForeground', backgroundColor:'rgba(0,0,0,0.4)', px:1.5, py:0.25, borderRadius:6 }}>
          {typingDisplay}
        </Typography>
      </Box>
    )}
    { !atBottom && newCount>0 && (
      <Box sx={{ position:'absolute', bottom:72, left:0, right:0, display:'flex', justifyContent:'center' }}>
        <Box onClick={scrollToBottom} sx={{ cursor:'pointer', backgroundColor:'new.primary', color:'white', px:2, py:0.5, borderRadius:16, display:'flex', alignItems:'center', gap:0.5 }}>
          <ArrowDownwardIcon fontSize="small" />
          <Typography variant="body2">{newCount}</Typography>
        </Box>
      </Box>
    )}
    </>
  );
};
