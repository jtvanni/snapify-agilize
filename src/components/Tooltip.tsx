import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { type ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

const Tooltip = ({ title, children }: Props) => {
  return (
    <TooltipPrimitive.Provider delayDuration={300} disableHoverableContent>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <div className="group">
            {children}
          </div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          sideOffset={4}
          className={
            "z-50 inline-flex items-center bg-navy-900 px-3 py-2"
          }
        >
          <TooltipPrimitive.Arrow className="fill-current text-navy-900" />
          <span className="block text-xs leading-none text-white">
            {title}
          </span>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

export default Tooltip;
