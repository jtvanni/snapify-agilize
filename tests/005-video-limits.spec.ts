import { expect, test } from "@playwright/test";

import {
  DEFAULT_VIDEO_QUALITY,
  estimateRemainingSeconds,
  getVideoFileError,
  MAX_VIDEO_BYTES,
  VIDEO_QUALITY_PROFILES,
} from "../src/utils/videoLimits";
import { videoUploadInput } from "../src/server/api/videoUploadInput";

test.describe("limites e qualidade de vídeo", () => {
  test("mantém os três perfis e usa a qualidade equilibrada por padrão", () => {
    expect(DEFAULT_VIDEO_QUALITY).toBe("balanced");
    expect(VIDEO_QUALITY_PROFILES.economy).toMatchObject({
      width: 1280,
      height: 720,
      frameRate: 15,
      videoBitsPerSecond: 600_000,
      audioBitsPerSecond: 64_000,
    });
    expect(VIDEO_QUALITY_PROFILES.balanced).toMatchObject({
      width: 1280,
      height: 720,
      frameRate: 30,
      videoBitsPerSecond: 1_200_000,
      audioBitsPerSecond: 96_000,
    });
    expect(VIDEO_QUALITY_PROFILES.high).toMatchObject({
      width: 1920,
      height: 1080,
      frameRate: 30,
      videoBitsPerSecond: 2_500_000,
      audioBitsPerSecond: 128_000,
    });
  });

  test("aceita somente WebM ou MP4 de até 48 MB", () => {
    expect(getVideoFileError({ size: MAX_VIDEO_BYTES, type: "video/webm" })).toBeNull();
    expect(getVideoFileError({ size: MAX_VIDEO_BYTES, type: "video/mp4" })).toBeNull();
    expect(
      getVideoFileError({ size: MAX_VIDEO_BYTES + 1, type: "video/webm" })
    ).toContain("O limite é 48 MB");
    expect(getVideoFileError({ size: 1_000, type: "video/quicktime" })).toBe(
      "Envie um arquivo WebM ou MP4."
    );
    expect(getVideoFileError({ size: 0, type: "video/webm" })).toBe(
      "O arquivo de vídeo está vazio."
    );
  });

  test("reduz o tempo estimado conforme os blocos são gravados", () => {
    const profile = VIDEO_QUALITY_PROFILES.balanced;
    const initial = estimateRemainingSeconds(0, 0, profile);
    const afterOneMinute = estimateRemainingSeconds(10_000_000, 60, profile);

    expect(initial).toBeGreaterThan(afterOneMinute);
    expect(afterOneMinute).toBeGreaterThan(0);
    expect(estimateRemainingSeconds(MAX_VIDEO_BYTES, 60, profile)).toBe(0);
  });

  test("o backend exige um tamanho válido dentro do limite", () => {
    const validInput = {
      key: "demonstração.webm",
      contentType: "video/webm" as const,
      size: MAX_VIDEO_BYTES,
    };

    expect(videoUploadInput.safeParse(validInput).success).toBe(true);
    expect(videoUploadInput.safeParse({ ...validInput, size: MAX_VIDEO_BYTES + 1 }).success).toBe(false);
    expect(videoUploadInput.safeParse({ ...validInput, size: 0 }).success).toBe(false);
    expect(videoUploadInput.safeParse({ ...validInput, size: 1.5 }).success).toBe(false);
    expect(videoUploadInput.safeParse({ key: validInput.key, contentType: validInput.contentType }).success).toBe(false);
  });
});
