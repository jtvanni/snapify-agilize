import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import { api } from "~/utils/api";

import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "~/styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <Toaster
        position="bottom-right"
        duration={3200}
        closeButton
        richColors
        visibleToasts={4}
        mobileOffset={16}
        containerAriaLabel="Notificações"
        toastOptions={{
          classNames: {
            toast: "!rounded-none !border-line !font-sans !shadow-lg",
            title: "!font-semibold",
            description: "!text-muted-foreground",
          },
        }}
      />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
