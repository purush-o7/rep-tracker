import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getPartnersWithPermissions,
  resolvePartnerView,
} from "@/lib/data/partners";
import { ReportsClient } from "./_components/reports-client";
import { PartnerSwitcher } from "../_components/partner-switcher";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Users } from "lucide-react";
import { startOfWeek, endOfWeek, format as formatDate } from "date-fns";

export const metadata: Metadata = {
  title: "Reports - GymTracker",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    partner?: string;
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

  // Fetch partners and report data concurrently
  const partnersPromise = getPartnersWithPermissions(supabase, currentUserId);
  const tagsPromise = supabase.from("tags").select("*").order("name");
  const workoutsPromise = supabase
    .from("workouts")
    .select("id, name")
    .order("name");

  const { partners, partnerIds } = await partnersPromise;
  const { viewingUserId, partnerName, partnerViewRestricted } =
    resolvePartnerView(params, partners, partnerIds, currentUserId);

  if (partnerViewRestricted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reports</h1>
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

  // Default to current week if no dates provided
  const now = new Date();
  const dateFrom =
    params.dateFrom ??
    formatDate(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const dateTo =
    params.dateTo ??
    formatDate(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Build logs query with server-side date filtering
  let logsQuery = supabase
    .from("workout_logs")
    .select(
      "*, workouts(id, name, workout_tags(tag_id, tags(name))), workout_sets(reps, weight_kg)"
    )
    .eq("user_id", viewingUserId)
    .order("performed_at", { ascending: true });

  logsQuery = logsQuery.gte("performed_at", dateFrom);
  logsQuery = logsQuery.lte("performed_at", `${dateTo}T23:59:59.999Z`);

  const [tagsRes, workoutsRes, logsRes] = await Promise.all([
    tagsPromise,
    workoutsPromise,
    logsQuery,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
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
            Viewing <strong>{partnerName}</strong>&apos;s reports
          </AlertDescription>
        </Alert>
      )}
      <ReportsClient
        logs={logsRes.data ?? []}
        tags={tagsRes.data ?? []}
        workouts={workoutsRes.data ?? []}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  );
}
