import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "~/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-[color,background-color,border-color,transform,opacity] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-navy-900 text-white hover:bg-navy-800",
        signal: "bg-signal text-navy-900 hover:bg-navy-900 hover:text-white",
        outline:
          "border border-line bg-white text-navy-900 hover:border-navy-200 hover:bg-navy-50",
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
  loading?: boolean;
  loadingLabel?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      children,
      className,
      disabled,
      loading = false,
      loadingLabel,
      size,
      variant,
      ...props
    },
    ref
  ) => {
    const styles = cn(buttonVariants({ className, size, variant }));

    if (asChild) {
      return (
        <Slot ref={ref} className={styles} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={styles}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin"
            aria-hidden="true"
          />
        ) : null}
        {loading && loadingLabel ? loadingLabel : children}
      </button>
    );
  }
);

Button.displayName = "Button";
