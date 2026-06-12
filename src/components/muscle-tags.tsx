import { cn } from "@/lib/utils";

interface MuscleTagsProps {
  tags: { tags: { name: string } | null }[] | undefined;
  className?: string;
  max?: number;
}

/** Compact muscle group badges shown under an exercise name */
export function MuscleTags({ tags, className, max = 4 }: MuscleTagsProps) {
  const names = (tags ?? [])
    .map((t) => t.tags?.name)
    .filter((n): n is string => !!n)
    .slice(0, max);

  if (names.length === 0) return null;

  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {names.map((name) => (
        <span
          key={name}
          className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary"
        >
          {name}
        </span>
      ))}
    </span>
  );
}
