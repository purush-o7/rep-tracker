import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPartnersWithPermissions(
  supabase: SupabaseClient,
  currentUserId: string
) {
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

  let partners: {
    id: string;
    full_name: string | null;
    partner_can_view_logs: boolean;
  }[] = [];
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, partner_can_view_logs")
      .in("id", partnerIds);
    partners = profiles ?? [];
  }

  return { partners, partnerIds };
}

export function resolvePartnerView(
  params: { partner?: string },
  partners: {
    id: string;
    full_name: string | null;
    partner_can_view_logs: boolean;
  }[],
  partnerIds: string[],
  currentUserId: string
) {
  let viewingUserId = currentUserId;
  let partnerName: string | null = null;
  let partnerViewRestricted = false;

  if (params.partner && partnerIds.includes(params.partner)) {
    viewingUserId = params.partner;
    const partnerProfile = partners.find((p) => p.id === params.partner);
    partnerName = partnerProfile?.full_name ?? "Partner";
    if (partnerProfile && !partnerProfile.partner_can_view_logs) {
      partnerViewRestricted = true;
    }
  }

  return { viewingUserId, partnerName, partnerViewRestricted };
}
