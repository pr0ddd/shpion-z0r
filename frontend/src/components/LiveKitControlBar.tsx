import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useRoomContext } from '@livekit/components-react';
import { VoiceControls } from './VoiceControls';

export const LiveKitControlBar: React.FC = () => {
    const room = useRoomContext();
    const portalContainer = useMemo(() => document.getElementById('voice-controls-portal-target'), []);

    const handleDisconnect = () => {
        room.disconnect();
    };

    if (!portalContainer) {
        return null;
    }

    return ReactDOM.createPortal(
        <VoiceControls 
            onDisconnect={handleDisconnect}
        />,
        portalContainer
    );
}; 