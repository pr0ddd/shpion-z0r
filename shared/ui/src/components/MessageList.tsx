import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useAppStore, useInfiniteMessagesQuery, useMessagesSocketSync } from '@shared/hooks';
import { ChatMessage } from './ChatMessage';
import { Message } from '@shared/types';

const MessageList: React.FC = () => {
  const serverId = useAppStore((s) => s.selectedServerId);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMessagesQuery(serverId);

  // keep socket & query in sync
  useMessagesSocketSync();

  // Flatten pages to chronological (oldest → newest) without resorting each render
  const messages = useMemo(() => {
    if (!data) return [];
    // pages[0] = newest range, older pages are pushed later; reverse to prepend
    return [...data.pages]
      .reverse() // oldest page first
      .flatMap((p) => p.messages);
  }, [data]);

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
        (virtuosoRef.current as any)?.scrollToIndex({ index: added, align: 'start', behavior: 'auto' });
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

  return (
    <Box sx={{ flexGrow: 1, minHeight: 0 }}>
      <Virtuoso<Message>
        ref={virtuosoRef}
        data={messages}
        style={{ height: '100%' }}
        firstItemIndex={firstIndex}
        initialTopMostItemIndex={firstIndex + messages.length - 1}
        itemContent={(_, msg) => (
          <Box sx={{ px: 2, py: 1 }} key={msg.id}>
            <ChatMessage message={msg} />
          </Box>
        )}
        startReached={loadMore}
        followOutput="auto"
        overscan={200}
      />
    </Box>
  );
};

export default React.memo(MessageList); 