import { Dialog, Menu, Transition } from "@headlessui/react";
import { MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/router";
import { Fragment, useState, type FormEvent } from "react";

import { Button, buttonVariants } from "~/components/ui/Button";
import { api, type RouterOutputs } from "~/utils/api";

type Folder = Extract<RouterOutputs["folder"]["get"], { locked: false }>;

export function FolderMoreMenu({ folder }: { folder: Folder }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(folder.name);
  const router = useRouter();
  const utils = api.useContext();
  const rename = api.folder.rename.useMutation({
    onSuccess: async () => {
      setOpen(false);
      await Promise.all([
        utils.folder.get.invalidate({ folderId: folder.id }),
        utils.folder.getAll.invalidate(),
      ]);
    },
  });
  const remove = api.folder.delete.useMutation({
    onSuccess: async () => {
      await utils.folder.getAll.invalidate();
      await utils.video.getAll.invalidate();
      await router.push("/videos");
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    rename.mutate({ folderId: folder.id, name });
  };

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Mais opções da pasta"><MoreHorizontal className="h-5 w-5" /></Menu.Button>
        <Transition as={Fragment} enter="transition duration-150" enterFrom="translate-y-1 opacity-0" enterTo="translate-y-0 opacity-100" leave="transition duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Menu.Items className="absolute right-0 z-40 mt-2 w-52 border border-line bg-white p-1 shadow-lg focus:outline-none">
            <Menu.Item>{({ active }) => <button type="button" onClick={() => setOpen(true)} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${active ? "bg-navy-50" : ""}`}><Pencil className="h-4 w-4 text-navy-600" />Renomear</button>}</Menu.Item>
            <Menu.Item>{({ active }) => <button type="button" onClick={() => { if (window.confirm("Excluir esta pasta? Os vídeos voltarão para a área sem pasta.")) remove.mutate({ folderId: folder.id }); }} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-destructive ${active ? "bg-red-50" : ""}`}><Trash2 className="h-4 w-4" />Excluir pasta</button>}</Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpen}><div className="fixed inset-0 bg-navy-900/40" /><div className="fixed inset-0 overflow-y-auto p-4"><div className="flex min-h-full items-center justify-center"><Dialog.Panel className="w-full max-w-md border border-line bg-white p-6 shadow-xl"><form onSubmit={submit}><div className="flex items-start justify-between gap-4"><Dialog.Title className="text-2xl font-bold text-navy-900">Renomear pasta</Dialog.Title><Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fechar"><X className="h-5 w-5" /></Button></div><label htmlFor="rename-folder" className="mt-6 block text-sm font-semibold text-navy-900">Nome</label><input id="rename-folder" value={name} onChange={(event) => setName(event.currentTarget.value)} required maxLength={120} className="mt-2 h-10 w-full border border-line px-3 text-sm outline-none focus:border-navy-600" /><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={!name.trim() || rename.isLoading}>Salvar</Button></div></form></Dialog.Panel></div></div></Dialog>
      </Transition>
    </>
  );
}
