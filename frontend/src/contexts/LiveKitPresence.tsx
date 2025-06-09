import React, { useEffect } from 'react';
import { useParticipants } from '@livekit/components-react';
import { useServer } from './ServerContext';

// This component's only job is to sync LiveKit participants with our ServerContext
export const LiveKitPresence: React.FC = () => {
    const participants = useParticipants();
    const { updateMembersFromLiveKit } = useServer();

    useEffect(() => {
        // This effect will run whenever the participant list changes.
        updateMembersFromLiveKit(participants);
    }, [participants, updateMembersFromLiveKit]);

    // It renders nothing.
    return null;
}; 