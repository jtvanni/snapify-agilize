import { Dialog, Menu, Transition } from "@headlessui/react";
import { Download, FolderInput, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";

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
      await utils.video.get.cancel();
      const previousValue = utils.video.get.getData({ videoId });
      void utils.video.getAll.invalidate();
      return { previousValue };
    },
    onError: (error, { videoId }, context) => {
      if (context?.previousValue) utils.video.get.setData({ videoId }, context.previousValue);
      console.error(error.message);
    },
    onSettled: () => {
      void utils.video.getAll.invalidate();
      void router.push("/videos");
    },
  });

  const renameVideoMutation = api.video.renameVideo.useMutation({
    onMutate: async ({ videoId, title: nextTitle }) => {
      await utils.video.get.cancel();
      const previousValue = utils.video.get.getData({ videoId });
      if (previousValue) utils.video.get.setData({ videoId }, { ...previousValue, title: nextTitle });
      return { previousValue };
    },
    onError: (error, { videoId }, context) => {
      if (context?.previousValue) utils.video.get.setData({ videoId }, context.previousValue);
      console.error(error.message);
    },
  });

  const moveMutation = api.folder.setVideoFolder.useMutation({
    onSuccess: async () => {
      setFolderOpen(false);
      await Promise.all([
        utils.video.get.invalidate({ videoId: video.id }),
        utils.video.getAll.invalidate(),
        utils.folder.getAll.invalidate(),
      ]);
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
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${active ? "bg-navy-50" : ""}`}
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
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${active ? "bg-navy-50" : ""}`}
                >
                  <FolderInput className="h-4 w-4 text-navy-600" /> Mover para pasta
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => void downloadVideo()}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${active ? "bg-navy-50" : ""}`}
                >
                  <Download className="h-4 w-4 text-navy-600" /> Baixar
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => deleteVideoMutation.mutate({ videoId: video.id })}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-destructive ${active ? "bg-red-50" : ""}`}
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
                      setRenameOpen(false);
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
                    <label htmlFor="title" className="mt-6 block text-sm font-semibold text-navy-900">
                      Título
                    </label>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.currentTarget.value)}
                      id="title"
                      name="title"
                      type="text"
                      required
                      className="mt-2 h-10 w-full border border-line bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-navy-600 focus:ring-1 focus:ring-navy-600"
                    />
                    <div className="mt-6 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Salvar</Button>
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
          <div className="fixed inset-0 overflow-y-auto p-4"><div className="flex min-h-full items-center justify-center">
            <Dialog.Panel className="w-full max-w-md border border-line bg-white p-6 shadow-xl">
              <form onSubmit={(event) => { event.preventDefault(); moveMutation.mutate({ videoId: video.id, folderId: folderId || null }); }}>
                <div className="flex items-start justify-between gap-4"><Dialog.Title className="text-2xl font-bold text-navy-900">Mover para pasta</Dialog.Title><Button type="button" variant="ghost" size="icon" onClick={() => setFolderOpen(false)} aria-label="Fechar"><X className="h-5 w-5" /></Button></div>
                <label htmlFor="video-folder" className="mt-6 block text-sm font-semibold text-navy-900">Pasta</label>
                <select id="video-folder" value={folderId} onChange={(event) => setFolderId(event.currentTarget.value)} className="mt-2 h-10 w-full border border-line bg-white px-3 text-sm text-navy-900 outline-none focus:border-navy-600 focus:ring-1 focus:ring-navy-600">
                  <option value="">Sem pasta</option>
                  {folders?.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                </select>
                <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFolderOpen(false)}>Cancelar</Button><Button type="submit" disabled={moveMutation.isLoading}>Mover</Button></div>
              </form>
            </Dialog.Panel>
          </div></div>
        </Dialog>
      </Transition>
    </>
  );
}
