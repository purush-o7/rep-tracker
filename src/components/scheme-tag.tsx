import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatScheme } from "@/lib/recommendation";

interface SchemeTagProps {
  sets: number | null | undefined;
  reps: string | null | undefined;
  className?: string;
  /** Render as a filled pill instead of plain inline text */
  pill?: boolean;
}

/** Recommended set/rep scheme tagline, e.g. "4 × 10–12". */
export function SchemeTag({ sets, reps, className, pill }: SchemeTagProps) {
  const scheme = formatScheme(sets, reps);
  if (!scheme) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        pill
          ? "rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary"
          : "text-muted-foreground",
        className
      )}
    >
      <Repeat className="h-3 w-3" />
      {scheme}
    </span>
  );
}
