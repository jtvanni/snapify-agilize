const MEDIA_TIMEOUT_MS = 8000;

export default async function generateThumbnail(video: HTMLVideoElement): Promise<Blob> {
  if (video.readyState < HTMLMediaElement.HAVE_METADATA || !Number.isFinite(video.duration)) {
    video.load();
    await waitForMediaEvent(video, "loadedmetadata");
  }

  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await waitForMediaEvent(video, "loadeddata");
  }

  const targetTime = Math.max(0, Math.min(video.duration / 2, video.duration - 0.05));
  if (Number.isFinite(targetTime) && Math.abs(video.currentTime - targetTime) > 0.01) {
    const seeked = waitForMediaEvent(video, "seeked");
    video.currentTime = targetTime;
    await seeked;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Não foi possível gerar a miniatura do vídeo."));
    }, "image/png");
  });
}

function waitForMediaEvent(
  video: HTMLVideoElement,
  eventName: "loadedmetadata" | "loadeddata" | "seeked"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Tempo esgotado ao preparar o vídeo (${eventName}).`));
    }, MEDIA_TIMEOUT_MS);

    const handleSuccess = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Não foi possível carregar o vídeo selecionado."));
    };
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener(eventName, handleSuccess);
      video.removeEventListener("error", handleError);
    };

    video.addEventListener(eventName, handleSuccess, { once: true });
    video.addEventListener("error", handleError, { once: true });
  });
}
