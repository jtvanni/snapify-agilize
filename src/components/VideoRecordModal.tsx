import { Dialog, Transition } from "@headlessui/react";
import dynamic from "next/dynamic";
import { useAtom } from "jotai";
import { Fragment, useState } from "react";

import recordVideoModalOpen from "~/atoms/recordVideoModalOpen";

const Recorder = dynamic(() => import("~/components/Recorder"), { ssr: false });

export default function VideoRecordModal() {
  const [open, setOpen] = useAtom(recordVideoModalOpen);
  const [step, setStep] = useState<"pre" | "in" | "post">("pre");

  const closeModal = () => {
    setStep("pre");
    setOpen(false);
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => {
          if (step === "pre") closeModal();
        }}
      >
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
              <Dialog.Panel className="w-full max-w-5xl border border-line bg-white p-5 shadow-xl sm:p-6">
                <Dialog.Title className="sr-only">Gravar demonstração</Dialog.Title>
                <Recorder closeModal={closeModal} step={step} setStep={setStep} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
