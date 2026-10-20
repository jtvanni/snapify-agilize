import "@vidstack/react/player/styles/base.css";

import React, { useRef } from "react";

import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
} from "@vidstack/react";

import { VideoLayout } from "./VideoLayout";

interface Props {
  video_url: string;
  contentType?: string;
  thumbnailUrl?: string;
}

export default function VideoPlayer({
  video_url,
  contentType = "video/webm",
  thumbnailUrl,
}: Props) {
  const player = useRef<MediaPlayerInstance>(null);

  function onProviderChange(provider: MediaProviderAdapter | null) {
    // We can configure provider's here.
    if (isHLSProvider(provider)) {
      provider.config = {};
    }
  }

  return (
    <MediaPlayer
      aria-label="Player da demonstração"
      data-testid="video-player"
      className="ring-media-focus aspect-video h-full w-full overflow-hidden bg-black font-sans text-white data-[focus]:ring-2 data-[focus]:ring-signal"
      src={[
        {
          src: video_url,
          type: contentType === "video/mp4" ? "video/mp4" : "video/webm",
        },
      ]}
      crossOrigin
      playsInline
      onProviderChange={onProviderChange}
      ref={player}
      keyTarget="document"
    >
      <MediaProvider>
        {thumbnailUrl ? (
          <Poster
            className="absolute inset-0 block h-full w-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
            src={thumbnailUrl}
            alt="Miniatura da demonstração"
          />
        ) : null}
      </MediaProvider>

      <VideoLayout />
    </MediaPlayer>
  );
}
