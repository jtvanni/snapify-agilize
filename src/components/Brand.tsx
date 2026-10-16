import Image from "next/image";
import Link from "next/link";

import { cn } from "~/lib/utils";

interface BrandProps {
  compact?: boolean;
  href?: string;
  className?: string;
}

export default function Brand({ compact = false, href = "/", className }: BrandProps) {
  const content = (
    <>
      <Image
        src="/agilize-logo.webp"
        alt="Logo da Agilize IA"
        width={40}
        height={40}
        className="h-9 w-9 shrink-0 object-cover sm:h-10 sm:w-10"
        priority
      />
      {!compact && (
        <span className="font-display text-base font-bold tracking-[-0.02em] text-navy-900 sm:text-lg">
          Demonstrações <span className="hidden font-medium text-navy-600 sm:inline">— Agilize IA</span>
        </span>
      )}
    </>
  );

  const classes = cn("inline-flex items-center gap-3", className);
  return href ? (
    <Link href={href} className={classes} aria-label="Demonstrações — Agilize IA">
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}
