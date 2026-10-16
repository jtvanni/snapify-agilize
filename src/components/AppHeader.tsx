import { type ReactNode } from "react";

import Brand from "~/components/Brand";

interface AppHeaderProps {
  actions?: ReactNode;
  homeHref?: string;
}

export default function AppHeader({ actions, homeHref = "/videos" }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1184px] items-center justify-between gap-4 px-4 sm:px-8">
        <Brand href={homeHref} />
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
