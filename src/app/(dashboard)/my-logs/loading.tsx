import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function MyLogsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-[58px] animate-pulse p-2.5 sm:p-3" />
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[130px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Day cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className="animate-in fade-in fill-mode-both p-0"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <div className="border-b bg-muted/30 p-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
          <div className="space-y-3 p-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
