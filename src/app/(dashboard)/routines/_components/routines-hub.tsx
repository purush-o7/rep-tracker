"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Globe,
  Lock,
  Copy,
  Loader2,
  Sparkles,
  Dumbbell,
  MoreVertical,
  Eye,
  CalendarClock,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteWorkoutGroup,
  setRoutineVisibility,
  copyRoutine,
} from "../actions";
import {
  RoutineQuickView,
  type RoutineQuickData,
} from "./routine-quick-view";

export interface RoutineExercise {
  name: string;
  tags: string[];
}
export interface OwnRoutine {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  exercises: RoutineExercise[];
  scheduledDays: number[];
}
export interface DiscoverRoutine {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  authorLabel: string | null;
  exercises: RoutineExercise[];
}

const DAYS = [
  { l: "M", v: 1 },
  { l: "T", v: 2 },
  { l: "W", v: 3 },
  { l: "T", v: 4 },
  { l: "F", v: 5 },
  { l: "S", v: 6 },
  { l: "S", v: 0 },
];

function muscleSummary(exercises: RoutineExercise[]) {
  return [...new Set(exercises.flatMap((e) => e.tags))];
}

function MuscleChips({ exercises }: { exercises: RoutineExercise[] }) {
  const muscles = muscleSummary(exercises).slice(0, 5);
  if (muscles.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {muscles.map((m) => (
        <span
          key={m}
          className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium capitalize text-primary"
        >
          {m.replace(/_/g, " ")}
        </span>
      ))}
    </div>
  );
}

function ExercisePreview({ exercises }: { exercises: RoutineExercise[] }) {
  if (exercises.length === 0) {
    return (
      <p className="text-xs italic text-muted-foreground">No exercises yet</p>
    );
  }
  const shown = exercises.slice(0, 3);
  const more = exercises.length - shown.length;
  return (
    <ul className="space-y-1">
      {shown.map((e, i) => (
        <li
          key={i}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-muted">
            <Dumbbell className="h-2.5 w-2.5" />
          </span>
          <span className="truncate">{e.name}</span>
        </li>
      ))}
      {more > 0 && (
        <li className="pl-6 text-xs font-medium text-primary">+{more} more</li>
      )}
    </ul>
  );
}

function DayDots({ days }: { days: number[] }) {
  return (
    <div className="flex items-center gap-1">
      {DAYS.map((d, i) => {
        const on = days.includes(d.v);
        return (
          <span
            key={i}
            title={on ? "Scheduled" : undefined}
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
              on
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground/50"
            }`}
          >
            {d.l}
          </span>
        );
      })}
    </div>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 26 },
  },
};

function AccentCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={item}>
      <Card className="group relative flex h-full flex-col overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <div className="h-1 w-full bg-gradient-to-r from-primary/70 via-primary/40 to-transparent" />
        <div className="flex flex-1 flex-col gap-3 p-4">{children}</div>
      </Card>
    </motion.div>
  );
}

/* ---------------- Own routine card ---------------- */

function OwnCard({
  routine,
  onQuickView,
}: {
  routine: OwnRoutine;
  onQuickView: () => void;
}) {
  const [busy, setBusy] = useState<null | "share" | "delete">(null);

  const totalSets = routine.exercises.length;

  const share = async () => {
    setBusy("share");
    const r = await setRoutineVisibility(routine.id, !routine.isPublic);
    if (r.error) toast.error(r.error);
    else toast.success(routine.isPublic ? "Made private" : "Shared publicly");
    setBusy(null);
  };
  const remove = async () => {
    setBusy("delete");
    const r = await deleteWorkoutGroup(routine.id);
    if (r.error) toast.error(r.error);
    else toast.success("Routine deleted");
    setBusy(null);
  };

  return (
    <AccentCard>
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onQuickView}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="flex items-center gap-1.5 font-semibold leading-tight">
            <span className="truncate hover:underline">{routine.name}</span>
            {routine.isPublic && (
              <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </h3>
          {routine.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {routine.description}
            </p>
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-1 h-7 w-7 shrink-0">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/routines/${routine.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={share}>
              {routine.isPublic ? (
                <>
                  <Lock className="mr-2 h-4 w-4" /> Make private
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" /> Share publicly
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={remove}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MuscleChips exercises={routine.exercises} />
      <ExercisePreview exercises={routine.exercises} />

      <div className="mt-auto space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" />
            {totalSets} {totalSets === 1 ? "exercise" : "exercises"}
          </span>
          {routine.scheduledDays.length > 0 ? (
            <DayDots days={routine.scheduledDays} />
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarClock className="h-3 w-3" /> No days
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onQuickView}
        >
          <Eye className="mr-1.5 h-4 w-4" /> Quick view
        </Button>
      </div>
    </AccentCard>
  );
}

/* ---------------- Discover card ---------------- */

function DiscoverCard({
  routine,
  onQuickView,
}: {
  routine: DiscoverRoutine;
  onQuickView: () => void;
}) {
  const router = useRouter();
  const [copying, setCopying] = useState(false);

  const copy = async () => {
    setCopying(true);
    const r = await copyRoutine(routine.id);
    if ("error" in r && r.error) toast.error(r.error);
    else {
      toast.success("Copied to your routines");
      router.refresh();
    }
    setCopying(false);
  };

  return (
    <AccentCard>
      <div className="flex items-start justify-between gap-2">
        <button onClick={onQuickView} className="min-w-0 flex-1 text-left">
          <h3 className="truncate font-semibold leading-tight hover:underline">
            {routine.name}
          </h3>
          {routine.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {routine.description}
            </p>
          )}
        </button>
        {routine.isSystem ? (
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <Sparkles className="h-2.5 w-2.5" /> System
          </span>
        ) : (
          routine.authorLabel && (
            <span className="shrink-0 truncate text-[10px] text-muted-foreground">
              {routine.authorLabel}
            </span>
          )
        )}
      </div>

      <MuscleChips exercises={routine.exercises} />
      <ExercisePreview exercises={routine.exercises} />

      <div className="mt-auto flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onQuickView}
        >
          <Eye className="mr-1.5 h-4 w-4" /> View
        </Button>
        <Button size="sm" className="flex-1" onClick={copy} disabled={copying}>
          {copying ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Copy className="mr-1.5 h-4 w-4" />
          )}
          Copy
        </Button>
      </div>
    </AccentCard>
  );
}

/* ---------------- Hub ---------------- */

export function RoutinesHub({
  own,
  discover,
}: {
  own: OwnRoutine[];
  discover: DiscoverRoutine[];
}) {
  const [tab, setTab] = useState<"mine" | "discover">("mine");
  const [quick, setQuick] = useState<RoutineQuickData | null>(null);

  const openOwn = (r: OwnRoutine) =>
    setQuick({
      id: r.id,
      name: r.name,
      description: r.description,
      kind: "own",
      exercises: r.exercises,
      scheduledDays: r.scheduledDays,
      isPublic: r.isPublic,
    });
  const openDiscover = (r: DiscoverRoutine) =>
    setQuick({
      id: r.id,
      name: r.name,
      description: r.description,
      kind: "discover",
      exercises: r.exercises,
      isSystem: r.isSystem,
      authorLabel: r.authorLabel,
    });

  const tabs = [
    { key: "mine" as const, label: "My Routines", count: own.length },
    { key: "discover" as const, label: "Discover", count: discover.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Routines</h1>
          <p className="text-sm text-muted-foreground">
            Build your splits, schedule them, and discover ready-made programs.
          </p>
        </div>
        <Button asChild>
          <Link href="/routines/new">
            <Plus className="mr-1.5 h-4 w-4" /> New routine
          </Link>
        </Button>
      </div>

      {/* Segmented control */}
      <div className="inline-flex rounded-lg border bg-muted/40 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === t.key && (
              <motion.span
                layoutId="routine-tab"
                className="absolute inset-0 rounded-md bg-background shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
            <span className="relative z-10 rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "mine" ? (
        own.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Dumbbell className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">No routines yet</p>
              <p className="text-sm text-muted-foreground">
                Create your own split, or copy one from Discover.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/routines/new">
                  <Plus className="mr-1.5 h-4 w-4" /> Create
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setTab("discover")}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Browse programs
              </Button>
            </div>
          </Card>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {own.map((r) => (
              <OwnCard key={r.id} routine={r} onQuickView={() => openOwn(r)} />
            ))}
          </motion.div>
        )
      ) : discover.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-14 text-center text-muted-foreground">
          <Sparkles className="h-8 w-8" />
          <p className="text-sm">No public routines yet.</p>
        </Card>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {discover.map((r) => (
            <DiscoverCard
              key={r.id}
              routine={r}
              onQuickView={() => openDiscover(r)}
            />
          ))}
        </motion.div>
      )}

      <RoutineQuickView
        data={quick}
        open={!!quick}
        onOpenChange={(o) => !o && setQuick(null)}
      />
    </div>
  );
}
