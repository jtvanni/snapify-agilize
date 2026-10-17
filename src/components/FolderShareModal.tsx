import { Dialog, Transition } from "@headlessui/react";
import { Check, Copy, KeyRound, Share2, X } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";

import { ModernSwitch } from "~/components/ModernSwitch";
import { Button } from "~/components/ui/Button";
import { api, type RouterOutputs } from "~/utils/api";

type Folder = Extract<RouterOutputs["folder"]["get"], { locked: false }>;

export function FolderShareModal({ folder }: { folder: Folder }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [copied, setCopied] = useState(false);
  const utils = api.useContext();
  const sharingMutation = api.folder.setSharing.useMutation({
    onMutate: async ({ folderId, sharing }) => {
      await Promise.all([
        utils.folder.get.cancel({ folderId }),
        utils.folder.getAll.cancel(),
      ]);
      const previousFolder = utils.folder.get.getData({ folderId });
      const previousFolders = utils.folder.getAll.getData();

      utils.folder.get.setData({ folderId }, (current) =>
        current && !current.locked ? { ...current, sharing } : current
      );
      utils.folder.getAll.setData(undefined, (current) =>
        current?.map((item) =>
          item.id === folderId ? { ...item, sharing } : item
        )
      );

      return { previousFolder, previousFolders };
    },
    onSuccess: (_, { sharing }) => {
      toast.success(
        sharing ? "Link da pasta ativado" : "Link da pasta desativado"
      );
    },
    onError: (_, { folderId }, context) => {
      if (context?.previousFolder) {
        utils.folder.get.setData({ folderId }, context.previousFolder);
      }
      utils.folder.getAll.setData(undefined, context?.previousFolders);
      toast.error("Não foi possível alterar o compartilhamento");
    },
    onSettled: (_, __, { folderId }) => {
      void utils.folder.get.invalidate({ folderId });
      void utils.folder.getAll.invalidate();
    },
  });
  const pinMutation = api.folder.setPin.useMutation({
    onSuccess: (_, { folderId, pin: nextPin }) => {
      const pinProtected = nextPin !== null;
      utils.folder.get.setData({ folderId }, (current) =>
        current && !current.locked ? { ...current, pinProtected } : current
      );
      utils.folder.getAll.setData(undefined, (current) =>
        current?.map((item) =>
          item.id === folderId ? { ...item, pinProtected } : item
        )
      );
      setPin("");
      toast.success(
        pinProtected
          ? folder.pinProtected
            ? "PIN alterado"
            : "PIN ativado"
          : "PIN removido"
      );
      void utils.folder.get.invalidate({ folderId });
      void utils.folder.getAll.invalidate();
    },
    onError: () => toast.error("Não foi possível salvar o PIN"),
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4" />
        Compartilhar
      </Button>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpen}>
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
                <Dialog.Panel className="w-full max-w-lg border border-line bg-white p-6 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-navy-600">
                        Acesso externo
                      </p>
                      <Dialog.Title className="mt-1 text-2xl font-bold text-navy-900">
                        Compartilhar pasta
                      </Dialog.Title>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpen(false)}
                      aria-label="Fechar"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-4 border border-line bg-navy-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">
                        Link da pasta
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Permite navegar por todos os vídeos desta pasta.
                      </p>
                    </div>
                    <ModernSwitch
                      enabled={folder.sharing}
                      pending={sharingMutation.isLoading}
                      label="Ativar compartilhamento da pasta"
                      toggle={() =>
                        sharingMutation.mutate({
                          folderId: folder.id,
                          sharing: !folder.sharing,
                        })
                      }
                    />
                  </div>
                  {folder.sharing ? (
                    <div className="mt-4 border border-line p-4">
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => void copy()}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copied ? "Link copiado" : "Copiar link da pasta"}
                      </Button>
                      <div className="mt-4 border-t border-line pt-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                          <KeyRound className="h-4 w-4 text-navy-600" />
                          {folder.pinProtected
                            ? "PIN ativado"
                            : "Proteger com PIN"}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Um único desbloqueio libera todos os vídeos por 15
                          minutos.
                        </p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <input
                            value={pin}
                            disabled={pinMutation.isLoading}
                            onChange={(event) =>
                              setPin(
                                event.currentTarget.value
                                  .replace(/\D/g, "")
                                  .slice(0, 4)
                              )
                            }
                            inputMode="numeric"
                            pattern="\d{4}"
                            maxLength={4}
                            placeholder="0000"
                            aria-label="PIN da pasta"
                            className="h-10 min-w-0 flex-1 border border-line px-3 text-center font-mono tracking-[0.35em] outline-none transition-[border-color,opacity] duration-150 focus:border-navy-600 disabled:cursor-wait disabled:opacity-60"
                          />
                          <Button
                            variant="outline"
                            disabled={pin.length !== 4}
                            loading={
                              pinMutation.isLoading &&
                              pinMutation.variables?.pin !== null
                            }
                            loadingLabel="Salvando PIN…"
                            onClick={() =>
                              pinMutation.mutate({ folderId: folder.id, pin })
                            }
                          >
                            {folder.pinProtected ? "Trocar PIN" : "Ativar PIN"}
                          </Button>
                          {folder.pinProtected ? (
                            <Button
                              variant="ghost"
                              loading={
                                pinMutation.isLoading &&
                                pinMutation.variables?.pin === null
                              }
                              loadingLabel="Removendo…"
                              disabled={pinMutation.isLoading}
                              onClick={() =>
                                pinMutation.mutate({
                                  folderId: folder.id,
                                  pin: null,
                                })
                              }
                            >
                              Remover
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
