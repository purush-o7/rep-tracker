import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./_components/reports-client";
import { PartnerSwitcher } from "../_components/partner-switcher";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Reports - GymTracker",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user!.id;
  let viewingUserId = currentUserId;
  let partnerName: string | null = null;

  // Fetch accepted partners
  const { data: partnerRows } = await supabase
    .from("workout_partners")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(
      `requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`
    );

  const partnerIds = (partnerRows ?? []).map((p) =>
    p.requester_id === currentUserId ? p.addressee_id : p.requester_id
  );

  let partners: { id: string; full_name: string | null; partner_can_view_logs: boolean }[] = [];
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, partner_can_view_logs")
      .in("id", partnerIds);
    partners = profiles ?? [];
  }

  let partnerViewRestricted = false;
  if (params.partner && partnerIds.includes(params.partner)) {
    viewingUserId = params.partner;
    const partnerProfile = partners.find((p) => p.id === params.partner);
    partnerName = partnerProfile?.full_name ?? "Partner";
    if (partnerProfile && !partnerProfile.partner_can_view_logs) {
      partnerViewRestricted = true;
    }
  }

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
            <strong>{partnerName}</strong> has restricted access to their workout data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [logsRes, tagsRes, workoutsRes] = await Promise.all([
    supabase
      .from("workout_logs")
      .select(
        "*, workouts(id, name, workout_tags(tag_id, tags(name))), workout_sets(reps, weight_kg)"
      )
      .eq("user_id", viewingUserId)
      .order("performed_at", { ascending: true }),
    supabase.from("tags").select("*").order("name"),
    supabase.from("workouts").select("id, name").order("name"),
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
      />
    </div>
  );
}
