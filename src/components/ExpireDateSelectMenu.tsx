import { Listbox, Transition } from "@headlessui/react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Fragment } from "react";
import { toast } from "sonner";

import { api } from "~/utils/api";

interface Props {
  shareLinkExpiresAt: Date | null;
  videoId: string;
}

const expirationOptions = [
  { label: "Nunca", hours: null },
  { label: "Em 1 hora", hours: 1 },
  { label: "Em 24 horas", hours: 24 },
  { label: "Em 7 dias", hours: 24 * 7 },
  { label: "Em 30 dias", hours: 24 * 30 },
] as const;

export default function ExpireDateSelectMenu({
  shareLinkExpiresAt,
  videoId,
}: Props) {
  const utils = api.useContext();
  const mutation = api.video.setShareLinkExpiresAt.useMutation({
    onMutate: async ({ videoId: id, shareLinkExpiresAt: expiresAt }) => {
      await utils.video.get.cancel({ videoId: id });
      const previousValue = utils.video.get.getData({ videoId: id });
      if (previousValue?.isOwner) {
        utils.video.get.setData(
          { videoId: id },
          { ...previousValue, shareLinkExpiresAt: expiresAt }
        );
      }
      return { previousValue };
    },
    onSuccess: () => toast.success("Expiração do link atualizada"),
    onError: (_, { videoId: id }, context) => {
      if (context?.previousValue)
        utils.video.get.setData({ videoId: id }, context.previousValue);
      toast.error("Não foi possível atualizar a expiração");
    },
    onSettled: (_, __, { videoId: id }) => {
      void utils.video.get.invalidate({ videoId: id });
    },
  });

  const handleChange = (hours: number | null) => {
    const expiresAt =
      hours === null ? null : new Date(Date.now() + hours * 60 * 60 * 1000);
    mutation.mutate({ videoId, shareLinkExpiresAt: expiresAt });
  };

  const currentLabel = shareLinkExpiresAt
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(shareLinkExpiresAt))
    : "Nunca";

  return (
    <Listbox value={null} onChange={handleChange} disabled={mutation.isLoading}>
      <div className="relative">
        <Listbox.Button
          aria-busy={mutation.isLoading || undefined}
          className="inline-flex h-9 min-w-28 items-center justify-between gap-2 border border-line bg-white px-3 text-xs font-semibold text-navy-900 transition-[background-color,opacity] duration-150 hover:bg-navy-50 aria-disabled:cursor-wait aria-disabled:opacity-70"
        >
          <span className="truncate">{currentLabel}</span>
          {mutation.isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
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
          <Listbox.Options className="absolute right-0 z-50 mt-1 w-48 border border-line bg-white p-1 shadow-lg focus:outline-none">
            {expirationOptions.map((option) => (
              <Listbox.Option
                key={option.label}
                value={option.hours}
                className={({ active }) =>
                  `cursor-pointer px-3 py-2 text-sm text-navy-900 ${
                    active ? "bg-navy-50" : ""
                  }`
                }
              >
                {option.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
