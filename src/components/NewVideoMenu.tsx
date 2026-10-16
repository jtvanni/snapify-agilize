import { Menu, Transition } from "@headlessui/react";
import { useAtom } from "jotai";
import { ChevronDown, MonitorUp, Plus, Video } from "lucide-react";
import { Fragment } from "react";

import recordVideoModalOpen from "~/atoms/recordVideoModalOpen";
import uploadVideoModalOpen from "~/atoms/uploadVideoModalOpen";
import { buttonVariants } from "~/components/ui/Button";

export default function NewVideoMenu() {
  const [, setRecordOpen] = useAtom(recordVideoModalOpen);
  const [, setUploadOpen] = useAtom(uploadVideoModalOpen);

  const openRecordModal = () => {
    if (!navigator?.mediaDevices?.getDisplayMedia) {
      return alert("Seu navegador não oferece suporte à gravação de tela.");
    }
    setRecordOpen(true);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className={buttonVariants({ variant: "signal", size: "sm" })}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Nova demonstração</span>
        <span className="sm:hidden">Nova</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
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
        <Menu.Items className="absolute right-0 z-40 mt-2 w-56 origin-top-right border border-line bg-white p-1 shadow-lg focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={openRecordModal}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${active ? "bg-navy-50" : ""}`}
              >
                <Video className="h-4 w-4 text-navy-600" aria-hidden="true" />
                Gravar a tela
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${active ? "bg-navy-50" : ""}`}
              >
                <MonitorUp className="h-4 w-4 text-navy-600" aria-hidden="true" />
                Enviar um vídeo
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
