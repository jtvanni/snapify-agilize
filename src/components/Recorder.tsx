import { useState, useRef, Fragment, useEffect } from "react";
import RecordRTC, { invokeSaveAsDialog } from "recordrtc";
import { Listbox, Transition } from "@headlessui/react";
import {
  Check,
  ChevronsUpDown,
  CloudUpload,
  Download,
  Loader2,
  Mic,
  Pause,
  Play,
  Square,
  Trash2,
  X,
} from "lucide-react";
import StopTime from "~/components/StopTime";
import axios from "axios";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { TRPCClientError } from "@trpc/client";
import { useAtom } from "jotai";
import recordVideoModalOpen from "~/atoms/recordVideoModalOpen";
import Tooltip from "~/components/Tooltip";
import generateThumbnail from "~/utils/generateThumbnail";
import * as EBML from "ts-ebml";
import VideoPlayer from "~/components/VideoPlayer";
import { Button } from "~/components/ui/Button";
import {
  DEFAULT_VIDEO_QUALITY,
  estimateRemainingSeconds,
  formatVideoBytes,
  formatVideoDuration,
  MAX_VIDEO_BYTES,
  VIDEO_QUALITY_PROFILES,
  VIDEO_SIZE_WARNING_BYTES,
  type VideoQualityId,
} from "~/utils/videoLimits";

const RECORDING_TIMESLICE_MS = 1_000;
const FINAL_CHUNK_RESERVE_BYTES = 500_000;

interface Props {
  closeModal: () => void;
  step: string;
  setStep: (
    value:
      | ((prevState: "pre" | "in" | "post") => "pre" | "in" | "post")
      | "pre"
      | "in"
      | "post"
  ) => void;
}

export default function Recorder({ closeModal, step, setStep }: Props) {
  const [blob, setBlob] = useState<null | Blob>(null);
  const recorderRef = useRef<null | RecordRTC>(null);
  const streamRef = useRef<null | MediaStream>(null);
  const stoppingRef = useRef(false);
  const discardedRef = useRef(false);
  const durationRef = useRef(0);
  const recordedBytesRef = useRef(0);
  const [pause, setPause] = useState<boolean>(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MediaDeviceInfo | null>(
    null
  );
  const router = useRouter();
  const [, setRecordOpen] = useAtom(recordVideoModalOpen);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const apiUtils = api.useContext();
  const getSignedUrl = api.video.getUploadUrl.useMutation();
  const abortUpload = api.video.abortUpload.useMutation();
  const [duration, setDuration] = useState<number>(0);
  const [recordedBytes, setRecordedBytes] = useState(0);
  const [qualityId, setQualityId] =
    useState<VideoQualityId>(DEFAULT_VIDEO_QUALITY);
  const [stoppedAtLimit, setStoppedAtLimit] = useState(false);
  const [sizeError, setSizeError] = useState<string>();
  const videoRef = useRef<null | HTMLVideoElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const selectedProfile = VIDEO_QUALITY_PROFILES[qualityId];
  const estimatedSecondsRemaining = estimateRemainingSeconds(
    recordedBytes,
    duration,
    selectedProfile
  );

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (!blob) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const handleRecording = async () => {
    setBlob(null);
    setSizeError(undefined);
    setStoppedAtLimit(false);
    setRecordedBytes(0);
    setDuration(0);
    recordedBytesRef.current = 0;
    durationRef.current = 0;
    stoppingRef.current = false;
    discardedRef.current = false;

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: selectedProfile.width,
        height: selectedProfile.height,
        frameRate: selectedProfile.frameRate,
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });

    let micStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDevice?.deviceId },
      });
    } catch (error) {
      console.error("Não foi possível acessar o microfone:", error);
    }

    const mediaStream = new MediaStream();
    if (micStream) {
      micStream
        .getAudioTracks()
        .forEach((track) => mediaStream.addTrack(track));
    }
    screenStream
      .getVideoTracks()
      .forEach((track) => mediaStream.addTrack(track));

    const firstVideoTrack = screenStream.getVideoTracks()[0];
    if (firstVideoTrack) {
      firstVideoTrack.addEventListener("ended", () => stopRecording());
    }

    streamRef.current = mediaStream;
    recorderRef.current = new RecordRTC(mediaStream, {
      type: "video",
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: selectedProfile.videoBitsPerSecond,
      audioBitsPerSecond: selectedProfile.audioBitsPerSecond,
      timeSlice: RECORDING_TIMESLICE_MS,
      ondataavailable: (chunk: Blob) => {
        const nextSize = recordedBytesRef.current + chunk.size;
        recordedBytesRef.current = nextSize;
        setRecordedBytes(nextSize);

        if (
          nextSize >= MAX_VIDEO_BYTES - FINAL_CHUNK_RESERVE_BYTES &&
          !stoppingRef.current
        ) {
          stopRecording(true);
        }
      },
    });
    recorderRef.current.startRecording();

    setStep("in");
  };

  function getSeekableBlob(inputBlob: Blob, callback: (blob: Blob) => void) {
    const reader = new EBML.Reader();
    const decoder = new EBML.Decoder();
    const tools = EBML.tools;

    const fileReader = new FileReader();
    fileReader.onload = function () {
      if (!this.result || typeof this.result === "string") return;
      const ebmlElms = decoder.decode(this.result);
      ebmlElms.forEach(function (element) {
        reader.read(element);
      });
      reader.stop();

      const refinedMetadataBuf = tools.makeMetadataSeekable(
        reader.metadatas,
        durationRef.current * 1000,
        reader.cues
      );

      const body = this.result.slice(reader.metadataSize);
      const newBlob = new Blob([refinedMetadataBuf, body], {
        type: "video/webm",
      });

      callback(newBlob);
    };
    fileReader.readAsArrayBuffer(inputBlob);
  }

  function stopRecording(reachedLimit = false) {
    const recorder = recorderRef.current;
    if (!recorder || stoppingRef.current) return;
    stoppingRef.current = true;
    setPause(false);
    setStoppedAtLimit(reachedLimit);
    setStep("post");
    streamRef.current?.getTracks().forEach((track) => track.stop());

    const finishRecording = () => {
      recorder.stopRecording(() => {
        if (discardedRef.current) return;
        getSeekableBlob(recorder.getBlob(), (fixedBlob) => {
          if (discardedRef.current) return;
          setRecordedBytes(fixedBlob.size);
          recordedBytesRef.current = fixedBlob.size;
          setBlob(fixedBlob);
          if (fixedBlob.size > MAX_VIDEO_BYTES) {
            setSizeError(
              `A gravação terminou com ${formatVideoBytes(fixedBlob.size)} e não pode ser enviada. O limite é ${formatVideoBytes(MAX_VIDEO_BYTES)}.`
            );
          }
        });
      });
    };

    if (recorder.state === "paused") {
      recorder.resumeRecording();
      window.setTimeout(finishRecording, 0);
    } else {
      finishRecording();
    }
  }

  const handleDelete = () => {
    discardedRef.current = true;
    setBlob(null);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (step === "in" && recorderRef.current) {
      stoppingRef.current = true;
      if (recorderRef.current.state === "paused") {
        recorderRef.current.resumeRecording();
      }
      recorderRef.current.stopRecording();
    }
    setPause(false);
    setDuration(0);
    setRecordedBytes(0);
    setStoppedAtLimit(false);
    setSizeError(undefined);
    streamRef.current = null;
    recorderRef.current = null;
    closeModal();
  };

  const handlePause = () => {
    if (recorderRef.current) {
      if (pause) {
        recorderRef.current?.resumeRecording();
      } else {
        recorderRef.current.pauseRecording();
      }
      setPause(!pause);
    }
  };

  useEffect(() => {
    async function getAudioDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false },
        });
        stream.getTracks().forEach((track) => track.stop()); // release the stream

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );
        setAudioDevices(audioDevices);
        if (audioDevices[0]) setSelectedDevice(audioDevices[0]);
      } catch (error) {
        console.error(error);
      }
    }

    void getAudioDevices();
  }, []);

  const handleSave = () => {
    if (blob) {
      const dateString = getRecordingFileName();
      invokeSaveAsDialog(blob, dateString);
    }
  };

  const handleUpload = async () => {
    if (!blob || !videoRef.current) return;
    if (blob.size > MAX_VIDEO_BYTES) {
      setSizeError(`O limite para envio é ${formatVideoBytes(MAX_VIDEO_BYTES)}.`);
      return;
    }

    const dateString = getRecordingFileName();
    setSubmitting(true);
    let videoId: string | undefined;

    try {
      const { signedVideoUrl, signedThumbnailUrl, id } =
        await getSignedUrl.mutateAsync({
          key: dateString,
          contentType: "video/webm",
          size: blob.size,
        });
      videoId = id;

      await axios.put(signedVideoUrl, blob.slice(), {
        headers: { "Content-Type": "video/webm" },
      });
      await axios.put(
        signedThumbnailUrl,
        await generateThumbnail(videoRef.current),
        { headers: { "Content-Type": "image/png" } }
      );
      await router.push("/share/" + id);
      setRecordOpen(false);
    } catch (err) {
      if (videoId) {
        await abortUpload.mutateAsync({ videoId }).catch(console.error);
      }
      if (err instanceof TRPCClientError) {
        if (err.message === "UNAUTHORIZED") {
          window.open(
            `/sign-in?redirect=${encodeURIComponent("/window-close")}`,
            "Entrar",
            "width=500,height=500"
          );
        }
      } else {
        throw err;
      }
    } finally {
      setSubmitting(false);
    }

    void apiUtils.video.getAll.invalidate();
  };

  return (
    <div className="w-full">
      {step === "pre" ? (
        <div className="mx-auto w-full max-w-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-navy-600">Nova demonstração</p>
              <h2 className="mt-1 text-2xl font-bold text-navy-900">Gravar a tela</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Escolha o microfone e, em seguida, selecione a tela ou janela que deseja compartilhar.
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={closeModal} aria-label="Fechar">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <label className="mt-6 block text-sm font-semibold text-navy-900">Microfone</label>
          <Listbox value={selectedDevice} onChange={setSelectedDevice}>
            <div className="relative mt-2">
              <Listbox.Button className="relative flex h-11 w-full cursor-default items-center border border-line bg-white py-2 pl-3 pr-10 text-left text-sm text-navy-900 hover:bg-navy-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 focus-visible:ring-offset-2">
                <Mic className="mr-2 h-5 w-5 text-navy-600" aria-hidden="true" />
                <span className="block truncate">
                  {selectedDevice?.label || "Microfone padrão"}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown className="h-4 w-4 text-navy-600" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                enter="transition duration-150 ease-out"
                enterFrom="translate-y-1 opacity-0 scale-[0.97]"
                enterTo="translate-y-0 opacity-100 scale-100"
                leave="transition duration-100 ease-out"
                leaveFrom="translate-y-0 opacity-100 scale-100"
                leaveTo="translate-y-1 opacity-0 scale-[0.97]"
              >
                <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto border border-line bg-white p-1 text-sm shadow-lg focus:outline-none">
                  {audioDevices.map((audioDevice, i) => (
                    <Listbox.Option
                      key={i}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-9 pr-4 text-navy-900 ${
                          active ? "bg-navy-50" : ""
                        }`
                      }
                      value={audioDevice}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {audioDevice.label}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-navy-600">
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-navy-900">
              Qualidade da gravação
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {Object.values(VIDEO_QUALITY_PROFILES).map((profile) => {
                const selected = profile.id === qualityId;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setQualityId(profile.id)}
                    className={`border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 focus-visible:ring-offset-2 ${
                      selected
                        ? "border-navy-600 bg-navy-50"
                        : "border-line bg-white hover:border-navy-300"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                      {selected ? <Check className="h-4 w-4 text-navy-600" /> : null}
                      {profile.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {profile.description}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              A duração é uma estimativa. A gravação será finalizada automaticamente antes de {formatVideoBytes(MAX_VIDEO_BYTES)}.
            </p>
          </fieldset>
          <Button
            type="button"
            className="mt-6 w-full"
            onClick={() => void handleRecording()}
          >
            <Square className="h-4 w-4 fill-signal text-signal" />
            Iniciar gravação
          </Button>
        </div>
      ) : null}
      {step === "in" ? (
        <div className="flex flex-col items-center py-8">
          <p className="text-sm font-semibold text-navy-600">Gravação em andamento</p>
          <div className="mt-5 flex items-center border border-line bg-navy-50 p-2">
          <Tooltip title="Finalizar gravação">
            <button
              type="button"
              onClick={() => stopRecording()}
              className="flex h-10 items-center gap-2 px-3 text-lg font-semibold text-navy-900 transition-colors hover:bg-white"
            >
              <Square className="h-5 w-5 fill-destructive text-destructive" aria-hidden="true" />
              <StopTime
                running={!pause}
                duration={duration}
                setDuration={setDuration}
              />
            </button>
          </Tooltip>
          <div className="mx-1 h-6 w-px bg-line" />
          <Tooltip title={pause ? "Retomar" : "Pausar"}>
            <button
              type="button"
              onClick={handlePause}
              className="grid h-10 w-10 place-items-center text-navy-600 transition-colors hover:bg-white"
            >
              {pause ? (
                <Play className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Pause className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </Tooltip>
          <Tooltip title="Cancelar gravação">
            <button
              type="button"
              onClick={handleDelete}
              className="grid h-10 w-10 place-items-center text-destructive transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </Tooltip>
          </div>
          <div className="mt-5 w-full max-w-md" aria-live="polite">
            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>
                {formatVideoBytes(recordedBytes)} de {formatVideoBytes(MAX_VIDEO_BYTES)}
              </span>
              <span>cerca de {formatVideoDuration(estimatedSecondsRemaining)} restantes</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden bg-navy-100">
              <div
                className={`h-full transition-[width] duration-300 ${
                  recordedBytes >= VIDEO_SIZE_WARNING_BYTES ? "bg-signal" : "bg-navy-600"
                }`}
                style={{
                  width: `${Math.min(100, (recordedBytes / MAX_VIDEO_BYTES) * 100)}%`,
                }}
              />
            </div>
            <p
              className={`mt-3 text-center text-xs ${
                recordedBytes >= VIDEO_SIZE_WARNING_BYTES
                  ? "font-semibold text-signal"
                  : "text-muted-foreground"
              }`}
            >
              {recordedBytes >= VIDEO_SIZE_WARNING_BYTES
                ? "A gravação está próxima do limite e será finalizada automaticamente."
                : "Volte a esta janela para pausar ou finalizar."}
            </p>
          </div>
        </div>
      ) : null}
      {step === "post" ? (
        <div>
          <div className="mb-5">
            <p className="text-sm font-semibold text-navy-600">Prévia</p>
            <h2 className="mt-1 text-2xl font-bold text-navy-900">Sua gravação está pronta</h2>
          </div>
          {previewUrl ? (
            <div className="aspect-video w-full border border-line bg-navy-900">
              <VideoPlayer video_url={previewUrl} />
              <video
                src={previewUrl}
                ref={videoRef}
                className="absolute h-px w-px opacity-0"
                preload="auto"
                muted
                playsInline
              />
            </div>
          ) : null}
          {stoppedAtLimit ? (
            <p className="mt-4 border border-navy-200 bg-navy-50 p-3 text-sm text-navy-900" role="status">
              A gravação foi finalizada automaticamente para permanecer abaixo do limite de {formatVideoBytes(MAX_VIDEO_BYTES)}.
            </p>
          ) : null}
          {sizeError ? (
            <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-destructive" role="alert">
              {sizeError} Você ainda pode baixar o arquivo no dispositivo.
            </p>
          ) : blob ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Tamanho final: {formatVideoBytes(blob.size)}
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground" role="status">
              Preparando a prévia e calculando o tamanho final...
            </p>
          )}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              disabled={submitting || !blob || !!sizeError}
              onClick={() => void handleUpload()}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
              {submitting ? "Salvando..." : "Salvar na biblioteca"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => void handleSave()}
            >
              <Download className="h-4 w-4" /> Baixar no dispositivo
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="sm:ml-auto"
              disabled={submitting}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" /> Descartar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getRecordingFileName() {
  const date = new Intl.DateTimeFormat("pt-BR").format(new Date()).replaceAll("/", "-");
  return `Demonstração Agilize - ${date}.webm`;
}
