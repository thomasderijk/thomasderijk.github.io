import { cn } from "@/lib/utils";

interface NavDotProps {
  className?: string;
}

// CSS-only dot: relies on vertical-align: middle (x-height) and a tiny nudge using ex units.
export function NavDot({ className }: NavDotProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block font-display font-bold text-current select-none pointer-events-none align-middle leading-none",
        className,
      )}
    >
      -
    </span>
  );
}
