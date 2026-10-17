import { Dialog, Menu, Transition } from "@headlessui/react";
import { MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/router";
import { Fragment, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "~/components/ui/Button";
import { api, type RouterOutputs } from "~/utils/api";

type Folder = Extract<RouterOutputs["folder"]["get"], { locked: false }>;

export function FolderMoreMenu({ folder }: { folder: Folder }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(folder.name);
  const router = useRouter();
  const utils = api.useContext();
  const rename = api.folder.rename.useMutation({
    onMutate: async ({ folderId, name: nextName }) => {
      await Promise.all([
        utils.folder.get.cancel({ folderId }),
        utils.folder.getAll.cancel(),
      ]);
      const previousFolder = utils.folder.get.getData({ folderId });
      const previousFolders = utils.folder.getAll.getData();
      utils.folder.get.setData({ folderId }, (current) =>
        current ? { ...current, name: nextName } : current
      );
      utils.folder.getAll.setData(undefined, (current) =>
        current?.map((item) =>
          item.id === folderId ? { ...item, name: nextName } : item
        )
      );
      return { previousFolder, previousFolders };
    },
    onSuccess: (_, { folderId }) => {
      setOpen(false);
      toast.success("Pasta renomeada");
      void utils.folder.get.invalidate({ folderId });
      void utils.folder.getAll.invalidate();
    },
    onError: (_, { folderId }, context) => {
      if (context?.previousFolder)
        utils.folder.get.setData({ folderId }, context.previousFolder);
      utils.folder.getAll.setData(undefined, context?.previousFolders);
      toast.error("Não foi possível renomear a pasta");
    },
  });
  const remove = api.folder.delete.useMutation({
    onMutate: () => ({ toastId: toast.loading("Excluindo pasta…") }),
    onSuccess: (_, { folderId }, context) => {
      utils.folder.getAll.setData(undefined, (current) =>
        current?.filter((item) => item.id !== folderId)
      );
      toast.success("Pasta excluída", { id: context?.toastId });
      void router.push("/videos");
      void utils.folder.getAll.invalidate();
      void utils.video.getAll.invalidate();
    },
    onError: (_, __, context) =>
      toast.error("Não foi possível excluir a pasta", { id: context?.toastId }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    rename.mutate({ folderId: folder.id, name });
  };

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button
          className={buttonVariants({ variant: "outline", size: "icon" })}
          aria-label="Mais opções da pasta"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition duration-150"
          enterFrom="translate-y-1 opacity-0"
          enterTo="translate-y-0 opacity-100"
          leave="transition duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Menu.Items className="absolute right-0 z-40 mt-2 w-52 border border-line bg-white p-1 shadow-lg focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${
                    active ? "bg-navy-50" : ""
                  }`}
                >
                  <Pencil className="h-4 w-4 text-navy-600" />
                  Renomear
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Excluir esta pasta? Os vídeos voltarão para a área sem pasta."
                      )
                    )
                      remove.mutate({ folderId: folder.id });
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-destructive ${
                    active ? "bg-red-50" : ""
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir pasta
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpen}>
          <div className="fixed inset-0 bg-navy-900/40" />
          <div className="fixed inset-0 overflow-y-auto p-4">
            <div className="flex min-h-full items-center justify-center">
              <Dialog.Panel className="w-full max-w-md border border-line bg-white p-6 shadow-xl">
                <form onSubmit={submit}>
                  <div className="flex items-start justify-between gap-4">
                    <Dialog.Title className="text-2xl font-bold text-navy-900">
                      Renomear pasta
                    </Dialog.Title>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={rename.isLoading}
                      onClick={() => setOpen(false)}
                      aria-label="Fechar"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <label
                    htmlFor="rename-folder"
                    className="mt-6 block text-sm font-semibold text-navy-900"
                  >
                    Nome
                  </label>
                  <input
                    id="rename-folder"
                    value={name}
                    disabled={rename.isLoading}
                    onChange={(event) => setName(event.currentTarget.value)}
                    required
                    maxLength={120}
                    className="mt-2 h-10 w-full border border-line px-3 text-sm outline-none focus:border-navy-600 disabled:cursor-wait disabled:opacity-60"
                  />
                  <div className="mt-6 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={rename.isLoading}
                      onClick={() => setOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={!name.trim()}
                      loading={rename.isLoading}
                      loadingLabel="Salvando…"
                    >
                      Salvar
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
