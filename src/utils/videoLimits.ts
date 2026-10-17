export const MAX_VIDEO_BYTES = 48_000_000;
export const VIDEO_SIZE_WARNING_BYTES = 43_200_000;

export type VideoQualityId = "economy" | "balanced" | "high";

export interface VideoQualityProfile {
  id: VideoQualityId;
  label: string;
  description: string;
  width: number;
  height: number;
  frameRate: number;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
}

export const VIDEO_QUALITY_PROFILES: Record<
  VideoQualityId,
  VideoQualityProfile
> = {
  economy: {
    id: "economy",
    label: "Econômica",
    description: "720p · 15 fps · cerca de 9 min",
    width: 1280,
    height: 720,
    frameRate: 15,
    videoBitsPerSecond: 600_000,
    audioBitsPerSecond: 64_000,
  },
  balanced: {
    id: "balanced",
    label: "Equilibrada",
    description: "720p · 30 fps · cerca de 5 min",
    width: 1280,
    height: 720,
    frameRate: 30,
    videoBitsPerSecond: 1_200_000,
    audioBitsPerSecond: 96_000,
  },
  high: {
    id: "high",
    label: "Alta",
    description: "1080p · 30 fps · cerca de 2 min",
    width: 1920,
    height: 1080,
    frameRate: 30,
    videoBitsPerSecond: 2_500_000,
    audioBitsPerSecond: 128_000,
  },
};

export const DEFAULT_VIDEO_QUALITY: VideoQualityId = "balanced";

export type SupportedVideoContentType = "video/webm" | "video/mp4";

export function isSupportedVideoContentType(
  contentType: string
): contentType is SupportedVideoContentType {
  return contentType === "video/webm" || contentType === "video/mp4";
}

export function getVideoFileError(file: { size: number; type: string }) {
  if (!isSupportedVideoContentType(file.type)) {
    return "Envie um arquivo WebM ou MP4.";
  }
  if (file.size <= 0) {
    return "O arquivo de vídeo está vazio.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return `O vídeo tem ${formatVideoBytes(file.size)}. O limite é ${formatVideoBytes(MAX_VIDEO_BYTES)}.`;
  }
  return null;
}

export function formatVideoBytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1).replace(".0", "")} MB`;
}

export function estimateRemainingSeconds(
  recordedBytes: number,
  elapsedSeconds: number,
  profile: VideoQualityProfile
) {
  const measuredBytesPerSecond =
    elapsedSeconds > 0 && recordedBytes > 0
      ? recordedBytes / elapsedSeconds
      : (profile.videoBitsPerSecond + profile.audioBitsPerSecond) / 8;

  return Math.max(
    0,
    Math.floor((MAX_VIDEO_BYTES - recordedBytes) / measuredBytesPerSecond)
  );
}

export function formatVideoDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
