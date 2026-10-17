import { KeyRound, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import AppHeader from "~/components/AppHeader";
import { Button } from "~/components/ui/Button";
import { api } from "~/utils/api";

type Props = {
  scope: "folder" | "video";
  targetId: string;
  title: string;
  onUnlocked: () => Promise<unknown> | void;
};

export function ShareUnlock({ scope, targetId, title, onUnlocked }: Props) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const folderUnlock = api.folder.unlock.useMutation();
  const videoUnlock = api.video.unlock.useMutation();
  const pending = folderUnlock.isLoading || videoUnlock.isLoading;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      if (scope === "folder") {
        await folderUnlock.mutateAsync({ folderId: targetId, pin });
      } else {
        await videoUnlock.mutateAsync({ videoId: targetId, pin });
      }
      await onUnlocked();
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "data" in error
          ? (error as { data?: { code?: string } }).data?.code
          : undefined;
      setMessage(
        code === "TOO_MANY_REQUESTS"
          ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
          : "PIN incorreto. Confira os quatro números."
      );
    }
  };

  return (
    <main className="min-h-screen bg-navy-50">
      <AppHeader />
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-md place-items-center px-4 py-10">
        <form onSubmit={(event) => void submit(event)} className="w-full border border-line bg-white p-6 shadow-sm sm:p-8">
          <div className="grid h-12 w-12 place-items-center bg-navy-100 text-navy-900">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-6 text-sm font-semibold text-navy-600">Conteúdo protegido</p>
          <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-navy-900">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Digite o PIN de quatro números para continuar. O acesso ficará ativo por 15 minutos.
          </p>

          <label htmlFor="share-pin" className="mt-6 block text-sm font-semibold text-navy-900">
            PIN de acesso
          </label>
          <input
            id="share-pin"
            value={pin}
            onChange={(event) => setPin(event.currentTarget.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{4}"
            maxLength={4}
            required
            autoFocus
            aria-describedby={message ? "pin-error" : undefined}
            className="mt-2 h-12 w-full border border-line bg-white px-4 text-center font-mono text-xl tracking-[0.5em] text-navy-900 outline-none transition-colors focus:border-navy-600 focus:ring-1 focus:ring-navy-600"
          />
          {message ? <p id="pin-error" className="mt-2 text-sm text-destructive">{message}</p> : null}
          <Button type="submit" className="mt-5 w-full" disabled={pin.length !== 4 || pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Acessar
          </Button>
        </form>
      </div>
    </main>
  );
}
