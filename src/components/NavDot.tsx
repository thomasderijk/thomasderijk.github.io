import { cn } from "@/lib/utils";

interface NavDotProps {
  className?: string;
}

// Unicode middle dot separator
export function NavDot({ className }: NavDotProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block font-display font-normal text-current select-none pointer-events-none align-middle leading-none",
        className,
      )}
    >
      ·
    </span>
  );
}
