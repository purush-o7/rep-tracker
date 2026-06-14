import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitePartnerForm } from "./_components/invite-partner-form";
import { PendingInvitations } from "./_components/pending-invitations";
import { SentInvitations } from "./_components/sent-invitations";
import { ActivePartners } from "./_components/active-partners";

export const metadata: Metadata = {
  title: "Partners - GymTracker",
};

export default async function PartnersPage() {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  const userId = user!.id;

  // The current user's own handle (what they share so others can invite them)
  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", userId)
    .single();
  const ownHandle = ownProfile?.handle ?? null;

  // Fetch all partnerships involving this user
  const { data: partnerships } = await supabase
    .from("workout_partners")
    .select("*")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  // Collect all partner user IDs
  const partnerIds = (partnerships ?? []).map((p) =>
    p.requester_id === userId ? p.addressee_id : p.requester_id
  );
  const uniqueIds = [...new Set(partnerIds)];

  // Fetch partner profiles using admin client (for pending ones, RLS wouldn't allow)
  let profileMap: Record<
    string,
    {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      handle: string | null;
      is_public: boolean;
      partner_can_view_logs: boolean;
      partner_can_edit_logs: boolean;
    }
  > = {};

  if (uniqueIds.length > 0) {
    const admin = createAdminClient();
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, avatar_url, handle, is_public, partner_can_view_logs, partner_can_edit_logs")
      .in("id", uniqueIds);

    profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p])
    );
  }

  const defaultProfile = {
    full_name: null,
    avatar_url: null,
    handle: null,
    is_public: false,
    partner_can_view_logs: true,
    partner_can_edit_logs: true,
  };

  // Categorize partnerships
  const pendingReceived = (partnerships ?? [])
    .filter((p) => p.status === "pending" && p.addressee_id === userId)
    .map((p) => ({
      partnership_id: p.id,
      profile: profileMap[p.requester_id] ?? {
        id: p.requester_id,
        ...defaultProfile,
      },
      created_at: p.created_at,
    }));

  const pendingSent = (partnerships ?? [])
    .filter((p) => p.status === "pending" && p.requester_id === userId)
    .map((p) => ({
      partnership_id: p.id,
      profile: profileMap[p.addressee_id] ?? {
        id: p.addressee_id,
        ...defaultProfile,
      },
    }));

  const accepted = (partnerships ?? [])
    .filter((p) => p.status === "accepted")
    .map((p) => {
      const partnerId =
        p.requester_id === userId ? p.addressee_id : p.requester_id;
      return {
        partnership_id: p.id,
        profile: profileMap[partnerId] ?? {
          id: partnerId,
          ...defaultProfile,
        },
      };
    });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Workout Partners</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add a Partner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ownHandle ? (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              Your handle:{" "}
              <span className="font-semibold text-primary">@{ownHandle}</span>
              <span className="text-muted-foreground">
                {" "}
                — share this so others can invite you.
              </span>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
              Set a handle in{" "}
              <Link href="/settings" className="text-primary underline">
                settings
              </Link>{" "}
              so partners can find and invite you.
            </div>
          )}
          <InvitePartnerForm />
        </CardContent>
      </Card>
      <PendingInvitations invitations={pendingReceived} />
      <SentInvitations invitations={pendingSent} />
      <ActivePartners partners={accepted} />
    </div>
  );
}
