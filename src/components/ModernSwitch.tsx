import { Switch } from "@headlessui/react";

interface ModernSwitchProps {
  enabled: boolean;
  toggle: () => void;
  label?: string;
}

export function ModernSwitch({ enabled, toggle, label = "Alterar opção" }: ModernSwitchProps) {
  return (
    <Switch
      checked={enabled}
      onChange={toggle}
      className={`${enabled ? "bg-navy-900" : "bg-navy-200"} relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 focus-visible:ring-offset-2`}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={`${enabled ? "translate-x-5 bg-signal" : "translate-x-0 bg-white"} pointer-events-none inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-150 ease-out`}
      />
    </Switch>
  );
}
