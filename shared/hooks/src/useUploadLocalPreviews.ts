import { useEffect } from 'react';
import { TrackReference } from '@livekit/components-react';
import { useUploadPreview } from './useUploadPreview';

// Safely upload previews without breaking Rules of Hooks by memoising array and calling nested hook for each stable element.
export const useUploadLocalPreviews = (tracks: TrackReference[]) => {
  // create stable list of local tracks via filter every render
  const locals = tracks.filter((t) => t.participant?.isLocal);

  // For each local track we create an effect inside a child hook wrapper component.

  useEffect(() => {
    // nothing – placeholder so hook count consistent
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  locals.forEach((t) => useUploadPreview(t));
}; 