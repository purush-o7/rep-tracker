import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DiscoverList } from "./_components/discover-list";

export const metadata: Metadata = {
  title: "Discover - GymTracker",
};

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  // Fetch initial public profiles (RLS ensures only public ones are returned)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, full_name, avatar_url")
    .not("handle", "is", null)
    .neq("id", userId)
    .order("handle")
    .limit(20);

  // Fetch existing partnerships to show status
  const { data: partnerships } = await supabase
    .from("workout_partners")
    .select("requester_id, addressee_id, status")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  const partnershipMap: Record<string, string> = {};
  (partnerships ?? []).forEach((p) => {
    const partnerId =
      p.requester_id === userId ? p.addressee_id : p.requester_id;
    partnershipMap[partnerId] = p.status;
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover Partners</h1>
        <p className="text-sm text-muted-foreground">
          Find and connect with other users who have public profiles
        </p>
      </div>
      <DiscoverList
        initialProfiles={profiles ?? []}
        partnershipMap={partnershipMap}
      />
    </div>
  );
}
