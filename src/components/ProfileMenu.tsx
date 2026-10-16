import { Menu, Transition } from "@headlessui/react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Fragment } from "react";

import defaultProfileIcon from "~/assets/default profile icon.jpg";

export default function ProfileMenu() {
  const { data: session } = useSession();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex rounded-full transition-transform duration-150 ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 focus-visible:ring-offset-2">
        <span className="sr-only">Abrir menu do usuário</span>
        <Image
          className="h-9 w-9 rounded-full border border-line object-cover"
          src={session?.user?.image ?? defaultProfileIcon}
          alt={`Foto de ${session?.user?.name ?? "usuário"}`}
          width={36}
          height={36}
          unoptimized
        />
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
        <Menu.Items className="absolute right-0 z-40 mt-2 w-52 origin-top-right border border-line bg-white p-1 shadow-lg focus:outline-none">
          {session?.user?.name ? (
            <div className="border-b border-line px-3 py-2">
              <p className="truncate text-xs text-muted-foreground">Conectado como</p>
              <p className="truncate text-sm font-semibold text-navy-900">{session.user.name}</p>
            </div>
          ) : null}
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={() => void signOut()}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-navy-900 ${active ? "bg-navy-50" : ""}`}
              >
                <LogOut className="h-4 w-4 text-navy-600" aria-hidden="true" />
                Sair
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
