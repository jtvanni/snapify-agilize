import { Dialog, Transition } from "@headlessui/react";
import { Check, Copy, Share2, X } from "lucide-react";
import { Fragment, useState } from "react";

import ExpireDateSelectMenu from "~/components/ExpireDateSelectMenu";
import { ModernSwitch } from "~/components/ModernSwitch";
import { Button } from "~/components/ui/Button";
import { api, type RouterOutputs } from "~/utils/api";

interface Props {
  video: Extract<RouterOutputs["video"]["get"], { isOwner: true }>;
}

export function ShareModal({ video }: Props) {
  const utils = api.useContext();
  const [open, setOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const setSharingMutation = api.video.setSharing.useMutation({
    onMutate: async ({ videoId, sharing }) => {
      await utils.video.get.cancel();
      const previousValue = utils.video.get.getData({ videoId });
      if (previousValue?.isOwner) {
        utils.video.get.setData({ videoId }, { ...previousValue, sharing });
      }
      return { previousValue };
    },
    onError: (error, { videoId }, context) => {
      if (context?.previousValue) utils.video.get.setData({ videoId }, context.previousValue);
      console.error(error.message);
    },
  });

  const deleteAfterExpirationMutation = api.video.setDeleteAfterLinkExpires.useMutation({
    onMutate: async ({ videoId, delete_after_link_expires }) => {
      await utils.video.get.cancel();
      const previousValue = utils.video.get.getData({ videoId });
      if (previousValue?.isOwner) {
        utils.video.get.setData(
          { videoId },
          { ...previousValue, delete_after_link_expires }
        );
      }
      return { previousValue };
    },
    onError: (error, { videoId }, context) => {
      if (context?.previousValue) utils.video.get.setData({ videoId }, context.previousValue);
      console.error(error.message);
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <>
      <Button type="button" variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Compartilhar</span>
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
                <Dialog.Panel className="w-full max-w-lg border border-line bg-white p-5 shadow-xl sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-navy-600">Acesso externo</p>
                      <Dialog.Title className="mt-1 text-2xl font-bold text-navy-900">
                        Compartilhar demonstração
                      </Dialog.Title>
                    </div>
                    <Button
                      type="button"
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
                      <p className="text-sm font-semibold text-navy-900">Link público</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Permite que qualquer pessoa com o link assista.
                      </p>
                    </div>
                    <ModernSwitch
                      enabled={video.sharing}
                      label="Ativar link público"
                      toggle={() =>
                        setSharingMutation.mutate({
                          videoId: video.id,
                          sharing: !video.sharing,
                        })
                      }
                    />
                  </div>

                  {video.sharing ? (
                    <div className="mt-4 border border-line p-4">
                      <Button type="button" className="w-full" onClick={() => void handleCopy()}>
                        {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {linkCopied ? "Link copiado" : "Copiar link público"}
                      </Button>

                      <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
                        <span className="text-sm font-medium text-navy-900">Expiração do link</span>
                        <ExpireDateSelectMenu
                          videoId={video.id}
                          shareLinkExpiresAt={video.shareLinkExpiresAt}
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
                        <span className="text-sm font-medium text-navy-900">
                          Excluir vídeo quando o link expirar
                        </span>
                        <ModernSwitch
                          enabled={video.delete_after_link_expires}
                          label="Excluir vídeo após expiração"
                          toggle={() =>
                            deleteAfterExpirationMutation.mutate({
                              videoId: video.id,
                              delete_after_link_expires: !video.delete_after_link_expires,
                            })
                          }
                        />
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
