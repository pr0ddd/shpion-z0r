import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { useServer } from '@shared/hooks';
import { ChatMessage } from '@shared/ui';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

const MessageList = () => {
    const { messages } = useServer();
    const listRef = useRef<List>(null);

    // Scroll to the bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            listRef.current?.scrollToItem(messages.length - 1, 'end');
        }
    }, [messages, messages.length]);

    // This is the component that react-window will render for each row.
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const message = messages[index];
        const rowStyle = {
            ...style,
            paddingTop: '10px', // Creates vertical space between items
            paddingLeft: '16px',
            paddingRight: '16px',
            height: `${parseFloat(style.height as string) + 10}px`, // Adjust height to include padding
        };

        return (
            <div style={rowStyle}>
                <ChatMessage message={message} />
            </div>
        );
    };

    return (
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}> {/* Changed overflowY to hidden */}
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        ref={listRef}
                        height={height}
                        itemCount={messages.length}
                        itemSize={85} // Increased item size to accommodate padding
                        width={width}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </Box>
    );
};

export default React.memo(MessageList); 