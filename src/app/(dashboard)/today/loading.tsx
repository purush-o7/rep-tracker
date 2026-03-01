import { Skeleton } from "@/components/ui/skeleton";

export default function TodayLoading() {
  return (
    <div className="space-y-4">
      {/* Progress bar skeleton */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Plan item skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border p-3 animate-in fade-in fill-mode-both"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 flex-1 max-w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}

      {/* Add button skeleton */}
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
