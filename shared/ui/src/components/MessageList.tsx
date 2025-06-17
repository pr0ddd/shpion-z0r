import React, { useRef, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useServer } from '@shared/hooks';
import { ChatMessage } from './ChatMessage';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List, ListOnScrollProps } from 'react-window';

const ITEM_HEIGHT = 96;

const MessageList: React.FC = () => {
  const { messages, selectedServer } = useServer();
  const listRef = useRef<List>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (messages.length && autoScroll) {
      listRef.current?.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length, autoScroll]);

  const handleScroll = ({ scrollOffset, scrollUpdateWasRequested }: ListOnScrollProps) => {
    if (scrollUpdateWasRequested) return;
    const listAny = listRef.current as any;
    if (!listAny || !listAny._outerRef) return;
    const { clientHeight, scrollHeight } = listAny._outerRef;
    const atBottom = scrollOffset >= scrollHeight - clientHeight - 16;
    setAutoScroll(atBottom);
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={{ ...style, padding: '4px 16px 12px 16px' }}>
      <ChatMessage message={messages[index]} />
    </div>
  );

  return (
    <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={messages.length}
            itemSize={ITEM_HEIGHT}
            key={`${selectedServer?.id ?? 'nosel'}-${messages.length}`}
            initialScrollOffset={Math.max(0, messages.length - 1) * ITEM_HEIGHT}
            overscanCount={5}
            onScroll={handleScroll}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </Box>
  );
};

export default React.memo(MessageList); 