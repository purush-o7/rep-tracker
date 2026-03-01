import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getPartnersWithPermissions,
  resolvePartnerView,
} from "@/lib/data/partners";
import { LogList } from "./_components/log-list";
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
  let query = supabase
    .from("workout_logs")
    .select(
      "*, workouts(name), workout_sets(id, set_number, reps, weight_kg)",
      { count: "exact" }
    )
    .eq("user_id", viewingUserId)
    .order("performed_at", { ascending: false });

  if (params.dateFrom) {
    query = query.gte("performed_at", params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte("performed_at", `${params.dateTo}T23:59:59.999Z`);
  }

  query = query.range(from, to);

  const { data: logs, count } = await query;

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
      <LogList
        logs={logs ?? []}
        readOnly={isViewingPartner}
        currentPage={currentPage}
        pageSize={pagination.pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        dateFrom={params.dateFrom}
        dateTo={params.dateTo}
      />
    </div>
  );
}
