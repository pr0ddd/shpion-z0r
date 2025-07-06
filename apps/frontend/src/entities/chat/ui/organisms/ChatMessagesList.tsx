import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { Message } from '@shared/types';
import { useServerStore } from '@entities/server/model';

import { useMessagesQuery } from '../../api/messagse.query';
import { useMessagesSocketSync } from '../../model/useMessagesSocketSync';
import { ChatMessagesLoading } from '../molecules/ChatMessagesLoading';
import { ChatMessageItem } from '../molecules/ChatMessageItem';


export const ChatMessagesList: React.FC = () => {
  const serverId = useServerStore((s) => s.selectedServerId);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessagesQuery(serverId!);

  // keep socket & query in sync
  useMessagesSocketSync(serverId!);

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

  if (isLoading) {
    return <ChatMessagesLoading />;
  }

  return (
    <Virtuoso<Message>
      ref={virtuosoRef}
      data={messages}
      firstItemIndex={firstIndex}
      initialTopMostItemIndex={firstIndex + messages.length - 1}
      itemContent={(_, msg) => <ChatMessageItem key={msg.id} message={msg} />}
      startReached={loadMore}
      followOutput="auto"
      overscan={200}
    />
  );
};
