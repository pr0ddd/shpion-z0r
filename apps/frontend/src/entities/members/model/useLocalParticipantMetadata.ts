
import { LocalParticipant, Participant } from 'livekit-client';

type Metadata = {
  volumeOn: boolean;
  streams: number;
};

type ParticipantMetadata = Partial<{
  volumeOn: boolean;
  streams: number;
}>;

function parseMetadata(metadata: string | undefined): ParticipantMetadata {
  try {
    return metadata ? JSON.parse(metadata) : {};
  } catch {
    return {};
  }
}

export function useParticipantMetadata(participant: Participant) {

  const getAllMetadata = (): ParticipantMetadata => {
    return parseMetadata(participant.metadata);
  };

  const getMetadata = (
    key: keyof Metadata
  ): Metadata[keyof Metadata] | undefined => {
    const metadata = getAllMetadata();
    return metadata[key];
  };

  const updateMetadata = (partial: Partial<Metadata>) => {
    if (participant.isLocal) {
      const current = getAllMetadata();
      const updated = { ...current, ...partial };
      return (participant as LocalParticipant).setMetadata(JSON.stringify(updated));
    }
  };

  return {
    getMetadata,
    getAllMetadata,
    updateMetadata,
  };
}
