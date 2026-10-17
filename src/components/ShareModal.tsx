import { Dialog, Transition } from "@headlessui/react";
import { Check, Copy, KeyRound, Share2, X } from "lucide-react";
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
  const [pin, setPin] = useState("");

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

  const setPinMutation = api.video.setPin.useMutation({
    onSuccess: async () => {
      setPin("");
      await utils.video.get.invalidate({ videoId: video.id });
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

                      <div className="mt-4 border-t border-line pt-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                          <KeyRound className="h-4 w-4 text-navy-600" />
                          {video.pinProtected ? "PIN ativado" : "Proteger com PIN"}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Quem abrir este link precisará informar quatro números.
                        </p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <input
                            value={pin}
                            onChange={(event) => setPin(event.currentTarget.value.replace(/\D/g, "").slice(0, 4))}
                            inputMode="numeric"
                            pattern="\d{4}"
                            maxLength={4}
                            placeholder="0000"
                            aria-label="PIN de quatro números"
                            className="h-10 min-w-0 flex-1 border border-line bg-white px-3 text-center font-mono tracking-[0.35em] text-navy-900 outline-none focus:border-navy-600 focus:ring-1 focus:ring-navy-600"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            disabled={pin.length !== 4 || setPinMutation.isLoading}
                            onClick={() => setPinMutation.mutate({ videoId: video.id, pin })}
                          >
                            {video.pinProtected ? "Trocar PIN" : "Ativar PIN"}
                          </Button>
                          {video.pinProtected ? (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setPinMutation.mutate({ videoId: video.id, pin: null })}
                            >
                              Remover
                            </Button>
                          ) : null}
                        </div>
                      </div>

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
