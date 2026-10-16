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
  thumbnailUrl?: string;
}

export default function VideoPlayer({ video_url, thumbnailUrl }: Props) {
  const player = useRef<MediaPlayerInstance>(null);

  function onProviderChange(provider: MediaProviderAdapter | null) {
    // We can configure provider's here.
    if (isHLSProvider(provider)) {
      provider.config = {};
    }
  }

  return (
    <MediaPlayer
      className="ring-media-focus aspect-video w-full overflow-hidden rounded-md bg-black font-sans text-white data-[focus]:ring-4"
      src={[
        {
          src: video_url,
          type: "video/webm",
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
            className="absolute inset-0 block h-full w-full rounded-md object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
            src={thumbnailUrl}
            alt="video thumbnail"
          />
        ) : null}
      </MediaProvider>

      <VideoLayout />
    </MediaPlayer>
  );
}
