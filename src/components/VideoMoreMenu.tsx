import { Dialog, Menu, Transition } from "@headlessui/react";
import {
  Download,
  FolderInput,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "~/components/ui/Button";
import { api, type RouterOutputs } from "~/utils/api";

interface Props {
  video: Extract<RouterOutputs["video"]["get"], { isOwner: true }>;
}

export default function VideoMoreMenu({ video }: Props) {
  const [title, setTitle] = useState(video.title);
  const [renameOpen, setRenameOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderId, setFolderId] = useState(video.folder?.id ?? "");
  const utils = api.useContext();
  const router = useRouter();
  const { data: folders } = api.folder.getAll.useQuery();

  const deleteVideoMutation = api.video.deleteVideo.useMutation({
    onMutate: async ({ videoId }) => {
      await utils.video.get.cancel({ videoId });
      const previousValue = utils.video.get.getData({ videoId });
      return {
        previousValue,
        toastId: toast.loading("Excluindo demonstração…"),
      };
    },
    onError: (_, { videoId }, context) => {
      if (context?.previousValue)
        utils.video.get.setData({ videoId }, context.previousValue);
      toast.error("Não foi possível excluir a demonstração", {
        id: context?.toastId,
      });
    },
    onSuccess: (_, { videoId }, context) => {
      utils.video.getAll.setData(undefined, (current) =>
        current?.filter((item) => item.id !== videoId)
      );
      toast.success("Demonstração excluída", { id: context?.toastId });
      void utils.video.getAll.invalidate();
      void router.push("/videos");
    },
  });

  const renameVideoMutation = api.video.renameVideo.useMutation({
    onMutate: async ({ videoId, title: nextTitle }) => {
      await Promise.all([
        utils.video.get.cancel({ videoId }),
        utils.video.getAll.cancel(),
      ]);
      const previousValue = utils.video.get.getData({ videoId });
      const previousVideos = utils.video.getAll.getData();
      if (previousValue)
        utils.video.get.setData(
          { videoId },
          { ...previousValue, title: nextTitle }
        );
      utils.video.getAll.setData(undefined, (current) =>
        current?.map((item) =>
          item.id === videoId ? { ...item, title: nextTitle } : item
        )
      );
      return { previousValue, previousVideos };
    },
    onSuccess: (_, { videoId }) => {
      setRenameOpen(false);
      toast.success("Demonstração renomeada");
      void utils.video.get.invalidate({ videoId });
      void utils.video.getAll.invalidate();
    },
    onError: (_, { videoId }, context) => {
      if (context?.previousValue)
        utils.video.get.setData({ videoId }, context.previousValue);
      utils.video.getAll.setData(undefined, context?.previousVideos);
      toast.error("Não foi possível renomear a demonstração");
    },
  });

  const moveMutation = api.folder.setVideoFolder.useMutation({
    onMutate: async ({ videoId, folderId: nextFolderId }) => {
      await Promise.all([
        utils.video.get.cancel({ videoId }),
        utils.video.getAll.cancel(),
        utils.folder.getAll.cancel(),
      ]);
      const previousVideo = utils.video.get.getData({ videoId });
      const previousVideos = utils.video.getAll.getData();
      const previousFolders = utils.folder.getAll.getData();
      const nextFolder =
        folders?.find((item) => item.id === nextFolderId) ?? null;
      const folderSummary = nextFolder
        ? { id: nextFolder.id, name: nextFolder.name }
        : null;
      const previousFolderId =
        previousVideo && !previousVideo.locked
          ? previousVideo.folder?.id
          : null;

      utils.video.get.setData({ videoId }, (current) =>
        current?.isOwner ? { ...current, folder: folderSummary } : current
      );
      utils.video.getAll.setData(undefined, (current) =>
        current?.map((item) =>
          item.id === videoId ? { ...item, folder: folderSummary } : item
        )
      );
      utils.folder.getAll.setData(undefined, (current) =>
        current?.map((item) => ({
          ...item,
          _count: {
            videos:
              item._count.videos +
              (item.id === nextFolderId && item.id !== previousFolderId
                ? 1
                : 0) -
              (item.id === previousFolderId && item.id !== nextFolderId
                ? 1
                : 0),
          },
        }))
      );
      return { previousVideo, previousVideos, previousFolders };
    },
    onSuccess: () => {
      setFolderOpen(false);
      toast.success(
        folderId ? "Demonstração movida" : "Demonstração removida da pasta"
      );
    },
    onError: (_, { videoId }, context) => {
      if (context?.previousVideo)
        utils.video.get.setData({ videoId }, context.previousVideo);
      utils.video.getAll.setData(undefined, context?.previousVideos);
      utils.folder.getAll.setData(undefined, context?.previousFolders);
      toast.error("Não foi possível mover a demonstração");
    },
    onSettled: (_, __, { videoId }) => {
      void utils.video.get.invalidate({ videoId });
      void utils.video.getAll.invalidate();
      void utils.folder.getAll.invalidate();
    },
  });

  const downloadVideo = async () => {
    const response = await fetch(video.video_url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = video.title;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button
          className={buttonVariants({ variant: "outline", size: "icon" })}
          aria-label="Mais opções"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition duration-150 ease-out"
          enterFrom="translate-y-1 opacity-0 scale-[0.97]"
          enterTo="translate-y-0 opacity-100 scale-100"
          leave="transition duration-100 ease-out"
          leaveFrom="translate-y-0 opacity-100 scale-100"
          leaveTo="translate-y-1 opacity-0 scale-[0.97]"
        >
          <Menu.Items className="absolute right-0 z-40 mt-2 w-52 origin-top-right border border-line bg-white p-1 shadow-lg focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => setRenameOpen(true)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${
                    active ? "bg-navy-50" : ""
                  }`}
                >
                  <Pencil className="h-4 w-4 text-navy-600" /> Renomear
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => setFolderOpen(true)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${
                    active ? "bg-navy-50" : ""
                  }`}
                >
                  <FolderInput className="h-4 w-4 text-navy-600" /> Mover para
                  pasta
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => void downloadVideo()}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${
                    active ? "bg-navy-50" : ""
                  }`}
                >
                  <Download className="h-4 w-4 text-navy-600" /> Baixar
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() =>
                    deleteVideoMutation.mutate({ videoId: video.id })
                  }
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-destructive ${
                    active ? "bg-red-50" : ""
                  }`}
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>

      <Transition appear show={renameOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setRenameOpen}>
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
                <Dialog.Panel className="w-full max-w-md border border-line bg-white p-6 shadow-xl">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      renameVideoMutation.mutate({ videoId: video.id, title });
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Dialog.Title className="text-2xl font-bold text-navy-900">
                        Renomear demonstração
                      </Dialog.Title>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setRenameOpen(false)}
                        aria-label="Fechar"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <label
                      htmlFor="title"
                      className="mt-6 block text-sm font-semibold text-navy-900"
                    >
                      Título
                    </label>
                    <input
                      value={title}
                      disabled={renameVideoMutation.isLoading}
                      onChange={(event) => setTitle(event.currentTarget.value)}
                      id="title"
                      name="title"
                      type="text"
                      required
                      className="mt-2 h-10 w-full border border-line bg-white px-3 text-sm text-foreground outline-none transition-[border-color,opacity] duration-150 focus:border-navy-600 focus:ring-1 focus:ring-navy-600 disabled:cursor-wait disabled:opacity-60"
                    />
                    <div className="mt-6 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={renameVideoMutation.isLoading}
                        onClick={() => setRenameOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        loading={renameVideoMutation.isLoading}
                        loadingLabel="Salvando…"
                      >
                        Salvar
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={folderOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setFolderOpen}>
          <div className="fixed inset-0 bg-navy-900/40" />
          <div className="fixed inset-0 overflow-y-auto p-4">
            <div className="flex min-h-full items-center justify-center">
              <Dialog.Panel className="w-full max-w-md border border-line bg-white p-6 shadow-xl">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    moveMutation.mutate({
                      videoId: video.id,
                      folderId: folderId || null,
                    });
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <Dialog.Title className="text-2xl font-bold text-navy-900">
                      Mover para pasta
                    </Dialog.Title>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFolderOpen(false)}
                      aria-label="Fechar"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <label
                    htmlFor="video-folder"
                    className="mt-6 block text-sm font-semibold text-navy-900"
                  >
                    Pasta
                  </label>
                  <select
                    id="video-folder"
                    value={folderId}
                    disabled={moveMutation.isLoading}
                    onChange={(event) => setFolderId(event.currentTarget.value)}
                    className="mt-2 h-10 w-full border border-line bg-white px-3 text-sm text-navy-900 outline-none focus:border-navy-600 focus:ring-1 focus:ring-navy-600 disabled:cursor-wait disabled:opacity-60"
                  >
                    <option value="">Sem pasta</option>
                    {folders?.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={moveMutation.isLoading}
                      onClick={() => setFolderOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      loading={moveMutation.isLoading}
                      loadingLabel="Movendo…"
                    >
                      Mover
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
