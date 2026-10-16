import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import { useAtom } from "jotai";
import { FileVideo, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/router";
import { type ChangeEvent, Fragment, useEffect, useRef, useState } from "react";

import uploadVideoModalOpen from "~/atoms/uploadVideoModalOpen";
import { Button } from "~/components/ui/Button";
import generateThumbnail from "~/utils/generateThumbnail";
import { api } from "~/utils/api";

export default function VideoUploadModal() {
  const [open, setOpen] = useAtom(uploadVideoModalOpen);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const getSignedUrl = api.video.getUploadUrl.useMutation();
  const abortUpload = api.video.abortUpload.useMutation();
  const apiUtils = api.useContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const closeModal = () => {
    if (submitting) return;
    setOpen(false);
    setFile(undefined);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    if (file.type !== "video/webm" && file.type !== "video/mp4") {
      alert("Envie um arquivo WebM ou MP4.");
      return;
    }

    setSubmitting(true);
    let videoId: string | undefined;
    try {
      const { signedVideoUrl, signedThumbnailUrl, id } = await getSignedUrl.mutateAsync({
        key: file.name,
        contentType: file.type,
      });
      videoId = id;
      await axios.put(signedVideoUrl, file.slice(), {
        headers: { "Content-Type": file.type },
      });
      if (!videoRef.current) throw new Error("Prévia do vídeo indisponível");
      await axios.put(signedThumbnailUrl, await generateThumbnail(videoRef.current), {
        headers: { "Content-Type": "image/png" },
      });
      setOpen(false);
      setFile(undefined);
      await router.push(`/share/${id}`);
    } catch (error) {
      if (videoId) await abortUpload.mutateAsync({ videoId }).catch(console.error);
      console.error(error);
      alert("Não foi possível enviar o vídeo. Tente novamente.");
    } finally {
      setSubmitting(false);
      void apiUtils.video.getAll.invalidate();
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-150 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-100 ease-out"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-navy-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="transition duration-200 ease-out"
              enterFrom="opacity-0 scale-[0.97]"
              enterTo="opacity-100 scale-100"
              leave="transition duration-150 ease-out"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-[0.97]"
            >
              <Dialog.Panel className="w-full max-w-xl border border-line bg-white p-5 shadow-xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-navy-600">Adicionar ao acervo</p>
                    <Dialog.Title className="mt-1 text-2xl font-bold text-navy-900">
                      Enviar vídeo
                    </Dialog.Title>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={closeModal}
                    disabled={submitting}
                    aria-label="Fechar"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <label className="mt-6 flex min-h-44 cursor-pointer flex-col items-center justify-center border border-dashed border-navy-400 bg-navy-50 px-6 py-8 text-center transition-colors duration-150 ease-out hover:border-navy-600 hover:bg-navy-100 focus-within:ring-2 focus-within:ring-navy-600 focus-within:ring-offset-2">
                  {file ? (
                    <>
                      <FileVideo className="h-8 w-8 text-navy-600" aria-hidden="true" />
                      <span className="mt-3 max-w-full truncate text-sm font-semibold text-navy-900">
                        {file.name}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">Clique para escolher outro arquivo</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-navy-600" aria-hidden="true" />
                      <span className="mt-3 text-sm font-semibold text-navy-900">
                        Selecione ou arraste um vídeo
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">Arquivos MP4 ou WebM</span>
                    </>
                  )}
                  <input
                    accept="video/mp4,video/webm"
                    onChange={handleFileChange}
                    type="file"
                    name="file_upload"
                    className="sr-only"
                    disabled={submitting}
                  />
                </label>

                {previewUrl ? (
                  <video
                    src={previewUrl}
                    ref={videoRef}
                    className="absolute h-px w-px opacity-0"
                    preload="auto"
                    muted
                    playsInline
                  />
                ) : null}

                <div className="mt-6 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={() => void handleSubmit()} disabled={!file || submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {submitting ? "Enviando..." : "Enviar vídeo"}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
