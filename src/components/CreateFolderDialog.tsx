import { Dialog, Transition } from "@headlessui/react";
import { FolderPlus, X } from "lucide-react";
import { Fragment, useState, type FormEvent } from "react";

import { Button } from "~/components/ui/Button";
import { api } from "~/utils/api";

export function CreateFolderDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const utils = api.useContext();
  const mutation = api.folder.create.useMutation({
    onSuccess: async () => {
      setName("");
      setOpen(false);
      await utils.folder.getAll.invalidate();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate({ name });
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FolderPlus className="h-4 w-4" />
        <span className="hidden sm:inline">Nova pasta</span>
      </Button>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpen}>
          <Transition.Child as={Fragment} enter="transition-opacity duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-navy-900/40" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-4"><div className="flex min-h-full items-center justify-center">
            <Dialog.Panel className="w-full max-w-md border border-line bg-white p-6 shadow-xl">
              <form onSubmit={submit}>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-semibold text-navy-600">Organização</p><Dialog.Title className="mt-1 text-2xl font-bold text-navy-900">Criar pasta</Dialog.Title></div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fechar"><X className="h-5 w-5" /></Button>
                </div>
                <label htmlFor="folder-name" className="mt-6 block text-sm font-semibold text-navy-900">Nome da pasta</label>
                <input id="folder-name" value={name} onChange={(event) => setName(event.currentTarget.value)} maxLength={120} required autoFocus className="mt-2 h-10 w-full border border-line px-3 text-sm outline-none focus:border-navy-600 focus:ring-1 focus:ring-navy-600" />
                <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={!name.trim() || mutation.isLoading}>Criar pasta</Button></div>
              </form>
            </Dialog.Panel>
          </div></div>
        </Dialog>
      </Transition>
    </>
  );
}
