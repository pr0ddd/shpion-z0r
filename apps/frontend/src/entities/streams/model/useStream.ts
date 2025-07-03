import { TrackReference, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";

export const useStream = () => {
  const streamTracks = useTracks([Track.Source.ScreenShare, Track.Source.ScreenShareAudio]);
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);

  // TODO: refactor useScreenShare !!!!!

  useEffect(() => {
    console.log(streamTracks)
  }, [streamTracks])

  return {
    streamTracks,
    screenShareTracks,
  }
};