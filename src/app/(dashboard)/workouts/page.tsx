import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WorkoutCatalog } from "./_components/workout-catalog";

export const metadata: Metadata = {
  title: "Workouts - GymTracker",
};

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  const [workoutsRes, tagsRes, partnersRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("*, workout_tags(*, tags(*)), workout_images(*)")
      .order("name"),
    supabase.from("tags").select("*").order("name"),
    supabase
      .from("workout_partners")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
  ]);

  const partnerIds = (partnersRes.data ?? []).map((p) =>
    p.requester_id === userId ? p.addressee_id : p.requester_id
  );

  let partners: { id: string; full_name: string | null }[] = [];
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, partner_can_edit_logs")
      .in("id", partnerIds);
    // Only show partners that allow editing logs on their behalf
    partners = (profiles ?? [])
      .filter((p) => p.partner_can_edit_logs)
      .map(({ id, full_name }) => ({ id, full_name }));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Workouts</h1>
      <WorkoutCatalog
        workouts={workoutsRes.data ?? []}
        tags={tagsRes.data ?? []}
        partners={partners}
      />
    </div>
  );
}
