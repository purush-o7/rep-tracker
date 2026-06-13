import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getPartnersWithPermissions,
  resolvePartnerView,
} from "@/lib/data/partners";
import { LogList } from "./_components/log-list";
import { LogsSummary, LogsSummarySkeleton } from "./_components/logs-summary";
import { LogsHeatmap, LogsHeatmapSkeleton } from "./_components/logs-heatmap";
import { PartnerSwitcher } from "../_components/partner-switcher";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Users } from "lucide-react";
import {
  parsePaginationParams,
  toRange,
  getTotalPages,
  clampPage,
} from "@/lib/pagination";

export const metadata: Metadata = {
  title: "My Logs - GymTracker",
};

export default async function MyLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    partner?: string;
    page?: string;
    pageSize?: string;
    dateFrom?: string;
    dateTo?: string;
    q?: string;
    tag?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user!.id;

  // Fetch partners
  const { partners, partnerIds } = await getPartnersWithPermissions(
    supabase,
    currentUserId
  );
  const { viewingUserId, partnerName, partnerViewRestricted } =
    resolvePartnerView(params, partners, partnerIds, currentUserId);

  if (partnerViewRestricted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Partner Logs</h1>
          {partners.length > 0 && (
            <PartnerSwitcher
              partners={partners}
              activePartnerId={params.partner}
            />
          )}
        </div>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>{partnerName}</strong> has restricted access to their
            workout data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pagination = parsePaginationParams(params);
  const { from, to } = toRange(pagination);

  // Build query with server-side date filtering + pagination
  // workouts is inner-joined so we can filter logs by exercise name / muscle tag.
  // A second aliased inner join on workout_tags powers the tag filter without
  // collapsing the display tags (left-joined via workout_tags(tags(name))).
  const tagJoin = params.tag
    ? ", tag_filter:workout_tags!inner(tag_id)"
    : "";
  const selectStr =
    `*, workouts!inner(name, log_type, default_sets, default_reps, workout_tags(tags(name))${tagJoin}), ` +
    "workout_sets(id, set_number, reps, weight_kg, duration_seconds, distance_m)";

  let query = supabase
    .from("workout_logs")
    .select(selectStr, { count: "exact" })
    .eq("user_id", viewingUserId)
    .order("performed_at", { ascending: false });

  if (params.dateFrom) {
    query = query.gte("performed_at", params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte("performed_at", `${params.dateTo}T23:59:59.999Z`);
  }
  if (params.q) {
    query = query.ilike("workouts.name", `%${params.q}%`);
  }
  if (params.tag) {
    query = query.eq("workouts.tag_filter.tag_id", params.tag);
  }

  query = query.range(from, to);

  const [{ data: logs, count }, tagsRes] = await Promise.all([
    query,
    supabase.from("tags").select("id, name").order("name"),
  ]);

  const totalCount = count ?? 0;
  const totalPages = getTotalPages(totalCount, pagination.pageSize);
  const currentPage = clampPage(pagination.page, totalPages);

  const isViewingPartner = viewingUserId !== currentUserId;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isViewingPartner ? "Partner Logs" : "My Workout Logs"}
        </h1>
        {partners.length > 0 && (
          <PartnerSwitcher
            partners={partners}
            activePartnerId={params.partner}
          />
        )}
      </div>
      {partnerName && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Viewing <strong>{partnerName}</strong>&apos;s workout logs
          </AlertDescription>
        </Alert>
      )}
      <Suspense fallback={<LogsSummarySkeleton />}>
        <LogsSummary userId={viewingUserId} />
      </Suspense>
      <Suspense fallback={<LogsHeatmapSkeleton />}>
        <LogsHeatmap userId={viewingUserId} activePartner={params.partner} />
      </Suspense>
      <LogList
        logs={(logs as unknown as Parameters<typeof LogList>[0]["logs"]) ?? []}
        readOnly={isViewingPartner}
        currentPage={currentPage}
        pageSize={pagination.pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        dateFrom={params.dateFrom}
        dateTo={params.dateTo}
        searchQuery={params.q}
        activeTag={params.tag}
        tags={tagsRes.data ?? []}
      />
    </div>
  );
}
