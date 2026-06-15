import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { getPartnersWithPermissions, partnerLabel } from "@/lib/data/partners";
import { fromLoggedSet, type SetEntry } from "@/lib/set-entry";
import { LogStation, type LogPerson } from "./_components/log-station";
import type { TaggedWorkout } from "@/lib/types";

export const metadata: Metadata = {
  title: "Log Workout - GymTracker",
};

type LoggedSetRow = {
  set_number: number;
  reps: number | null;
  weight_kg: number;
  duration_seconds: number | null;
  distance_m: number | null;
};

function sortedSets(rows: LoggedSetRow[] | undefined | null): SetEntry[] {
  if (!rows || rows.length === 0) return [];
  return [...rows]
    .sort((a, b) => a.set_number - b.set_number)
    .map(fromLoggedSet);
}

export default async function LogStationPage({
  params,
}: {
  params: Promise<{ planItemId: string }>;
}) {
  const { planItemId } = await params;
  const supabase = await createClient();
  const user = await getAuthUser(supabase);
  if (!user) redirect("/login");

  // The plan item we navigated from — gives us the workout + the date.
  // RLS lets us read our own item and an accepted partner's.
  const { data: anchor } = await supabase
    .from("daily_plan_items")
    .select(
      "id, user_id, plan_date, workout_id, workouts(*, workout_tags(tags(*)))"
    )
    .eq("id", planItemId)
    .maybeSingle();

  if (!anchor || !anchor.workouts) notFound();

  const workout = anchor.workouts as unknown as TaggedWorkout;
  const workoutId = anchor.workout_id;
  const planDate = anchor.plan_date;

  // Everyone who might be training this today: me + accepted partners.
  const { partners, partnerIds } = await getPartnersWithPermissions(
    supabase,
    user.id
  );

  // Edit permission per partner
  const editById = new Map<string, boolean>();
  if (partnerIds.length > 0) {
    const { data: editProfiles } = await supabase
      .from("profiles")
      .select("id, partner_can_edit_logs")
      .in("id", partnerIds);
    for (const p of editProfiles ?? [])
      editById.set(p.id, !!p.partner_can_edit_logs);
  }

  // Fetch each person's plan item for this workout today (+ its logged sets).
  const personIds = [user.id, ...partnerIds];
  const { data: itemRows } = await supabase
    .from("daily_plan_items")
    .select(
      "id, user_id, workout_log_id, workout_logs(notes, workout_sets(set_number, reps, weight_kg, duration_seconds, distance_m))"
    )
    .in("user_id", personIds)
    .eq("workout_id", workoutId)
    .eq("plan_date", planDate);

  const itemByUser = new Map<
    string,
    {
      id: string;
      notes: string;
      sets: SetEntry[];
    }
  >();
  for (const row of itemRows ?? []) {
    const log = Array.isArray(row.workout_logs)
      ? row.workout_logs[0]
      : row.workout_logs;
    itemByUser.set(row.user_id, {
      id: row.id,
      notes: log?.notes ?? "",
      sets: sortedSets(log?.workout_sets as LoggedSetRow[] | undefined),
    });
  }

  // Build the ordered people list: me first, then partners who allow viewing.
  const people: LogPerson[] = [];

  const mine = itemByUser.get(user.id);
  people.push({
    userId: user.id,
    label: "You",
    isSelf: true,
    canEdit: true,
    canView: true,
    planItemId: mine?.id ?? null,
    initialSets: mine?.sets ?? [],
    initialNotes: mine?.notes ?? "",
  });

  for (const partner of partners) {
    if (!partner.partner_can_view_logs) continue;
    const item = itemByUser.get(partner.id);
    people.push({
      userId: partner.id,
      label: partnerLabel(partner),
      isSelf: false,
      canEdit: !!editById.get(partner.id),
      canView: true,
      planItemId: item?.id ?? null,
      initialSets: item?.sets ?? [],
      initialNotes: item?.notes ?? "",
    });
  }

  return <LogStation workout={workout} people={people} />;
}
