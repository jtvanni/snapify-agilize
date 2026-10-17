import { Switch } from "@headlessui/react";
import { Loader2 } from "lucide-react";

interface ModernSwitchProps {
  enabled: boolean;
  toggle: () => void;
  label?: string;
  disabled?: boolean;
  pending?: boolean;
}

export function ModernSwitch({
  enabled,
  toggle,
  label = "Alterar opção",
  disabled = false,
  pending = false,
}: ModernSwitchProps) {
  return (
    <Switch
      checked={enabled}
      onChange={toggle}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`${
        enabled ? "bg-navy-900" : "bg-navy-200"
      } relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-[background-color,opacity,transform] duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-wait disabled:opacity-80`}
    >
      <span className="sr-only">{label}</span>
      {pending ? (
        <span
          className={`${
            enabled ? "left-1" : "right-1"
          } absolute top-1/2 grid -translate-y-1/2 place-items-center`}
        >
          <Loader2
            aria-hidden="true"
            className={`h-3 w-3 animate-spin ${
              enabled ? "text-white" : "text-navy-700"
            }`}
          />
        </span>
      ) : null}
      <span
        aria-hidden="true"
        className={`${
          enabled ? "translate-x-5 bg-signal" : "translate-x-0 bg-white"
        } pointer-events-none inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-150 ease-out`}
      />
    </Switch>
  );
}
