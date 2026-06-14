"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ListChecks,
  ArrowRight,
  Copy,
  Loader2,
  Sparkles,
  Globe,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResponsiveSheetDrawer } from "@/components/responsive-sheet-drawer";
import { copyRoutine } from "../actions";

export interface RoutineQuickData {
  id: string;
  name: string;
  description: string | null;
  kind: "own" | "discover";
  exercises: { name: string; tags: string[] }[];
  scheduledDays?: number[];
  isPublic?: boolean;
  isSystem?: boolean;
  authorLabel?: string | null;
}

const DAYS = [
  { l: "Mon", v: 1 },
  { l: "Tue", v: 2 },
  { l: "Wed", v: 3 },
  { l: "Thu", v: 4 },
  { l: "Fri", v: 5 },
  { l: "Sat", v: 6 },
  { l: "Sun", v: 0 },
];

export function RoutineQuickView({
  data,
  open,
  onOpenChange,
}: {
  data: RoutineQuickData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [copying, setCopying] = useState(false);

  const copy = async () => {
    if (!data) return;
    setCopying(true);
    const r = await copyRoutine(data.id);
    if ("error" in r && r.error) toast.error(r.error);
    else {
      toast.success("Copied to your routines");
      onOpenChange(false);
      router.refresh();
    }
    setCopying(false);
  };

  return (
    <ResponsiveSheetDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={data?.name ?? ""}
      description={`${data?.exercises.length ?? 0} exercises`}
      icon={<ListChecks className="h-5 w-5 text-primary" />}
      footer={
        data && (
          <div className="flex w-full gap-2">
            {data.kind === "discover" && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={copy}
                disabled={copying}
              >
                {copying ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="mr-1.5 h-4 w-4" />
                )}
                Copy
              </Button>
            )}
            <Button asChild className="flex-1">
              <Link href={`/routines/${data.id}`}>
                Open routine
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )
      }
    >
      {data && (
        <div className="space-y-4">
          {/* badges */}
          <div className="flex flex-wrap items-center gap-2">
            {data.isSystem && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> System program
              </span>
            )}
            {data.kind === "own" && data.isPublic && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Globe className="h-3 w-3" /> Public
              </span>
            )}
            {data.kind === "discover" && !data.isSystem && data.authorLabel && (
              <span className="text-xs text-muted-foreground">
                by {data.authorLabel}
              </span>
            )}
          </div>

          {data.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {data.description}
            </p>
          )}

          {/* scheduled days (own) */}
          {data.kind === "own" && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              {data.scheduledDays && data.scheduledDays.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {DAYS.filter((d) => data.scheduledDays!.includes(d.v)).map(
                    (d) => (
                      <span
                        key={d.v}
                        className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {d.l}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Not scheduled
                </span>
              )}
            </div>
          )}

          {/* exercise list */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Exercises
            </p>
            <ul className="space-y-1.5">
              {data.exercises.map((e, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg border p-2.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    {e.tags.length > 0 && (
                      <p className="truncate text-[11px] capitalize text-muted-foreground">
                        {e.tags.slice(0, 3).join(" · ").replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </ResponsiveSheetDrawer>
  );
}
