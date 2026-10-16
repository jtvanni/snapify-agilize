import { Listbox, Transition } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { Fragment } from "react";

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

export default function ExpireDateSelectMenu({ shareLinkExpiresAt, videoId }: Props) {
  const utils = api.useContext();
  const mutation = api.video.setShareLinkExpiresAt.useMutation({
    onMutate: async ({ videoId: id, shareLinkExpiresAt: expiresAt }) => {
      await utils.video.get.cancel();
      const previousValue = utils.video.get.getData({ videoId: id });
      if (previousValue?.isOwner) {
        utils.video.get.setData({ videoId: id }, { ...previousValue, shareLinkExpiresAt: expiresAt });
      }
      return { previousValue };
    },
    onError: (error, { videoId: id }, context) => {
      if (context?.previousValue) utils.video.get.setData({ videoId: id }, context.previousValue);
      console.error(error.message);
    },
  });

  const handleChange = (hours: number | null) => {
    const expiresAt = hours === null ? null : new Date(Date.now() + hours * 60 * 60 * 1000);
    mutation.mutate({ videoId, shareLinkExpiresAt: expiresAt });
  };

  const currentLabel = shareLinkExpiresAt
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(shareLinkExpiresAt)
      )
    : "Nunca";

  return (
    <Listbox value={null} onChange={handleChange}>
      <div className="relative">
        <Listbox.Button className="inline-flex h-9 min-w-28 items-center justify-between gap-2 border border-line bg-white px-3 text-xs font-semibold text-navy-900 hover:bg-navy-50">
          <span className="truncate">{currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
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
                  `cursor-pointer px-3 py-2 text-sm text-navy-900 ${active ? "bg-navy-50" : ""}`
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
