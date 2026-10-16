import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "~/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-[color,background-color,border-color,transform,opacity] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-navy-900 text-white hover:bg-navy-800",
        signal: "bg-signal text-navy-900 hover:bg-navy-900 hover:text-white",
        outline: "border border-line bg-white text-navy-900 hover:border-navy-200 hover:bg-navy-50",
        ghost: "text-navy-900 hover:bg-navy-100",
        destructive: "bg-destructive text-white hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3",
        default: "h-10 px-4",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size, variant, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ className, size, variant }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
