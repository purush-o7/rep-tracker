import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WorkoutCatalog } from "./_components/workout-catalog";
import {
  parsePaginationParams,
  toRange,
  getTotalPages,
  clampPage,
} from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Workouts - GymTracker",
};

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;
  const pagination = parsePaginationParams(params);
  const { from, to } = toRange(pagination);

  // Build paginated + searchable workouts query
  let workoutsQuery = supabase
    .from("workouts")
    .select("*, workout_tags(*, tags(*)), workout_images(*)", {
      count: "exact",
    })
    .order("name");

  if (params.q) {
    workoutsQuery = workoutsQuery.ilike("name", `%${params.q}%`);
  }

  workoutsQuery = workoutsQuery.range(from, to);

  const [workoutsRes, tagsRes, partnersRes] = await Promise.all([
    workoutsQuery,
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
    partners = (profiles ?? [])
      .filter((p) => p.partner_can_edit_logs)
      .map(({ id, full_name }) => ({ id, full_name }));
  }

  const totalCount = workoutsRes.count ?? 0;
  const totalPages = getTotalPages(totalCount, pagination.pageSize);
  const currentPage = clampPage(pagination.page, totalPages);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Workouts</h1>
      <WorkoutCatalog
        workouts={workoutsRes.data ?? []}
        tags={tagsRes.data ?? []}
        partners={partners}
        initialSearch={params.q ?? ""}
        currentPage={currentPage}
        pageSize={pagination.pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </div>
  );
}
