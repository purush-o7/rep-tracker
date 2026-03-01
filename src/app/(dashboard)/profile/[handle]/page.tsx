import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Ruler, Weight, Calendar } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle} - GymTracker` };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Use admin client to find the profile regardless of privacy setting
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, handle, full_name, avatar_url, age, gender, height_cm, weight_kg, is_public")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Profile Not Found</h1>
        <p className="text-muted-foreground">
          No user exists with the handle @{handle}
        </p>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  // Check if they are partners
  let isPartner = false;
  if (user && !isOwnProfile) {
    const { data: partnership } = await supabase
      .from("workout_partners")
      .select("id")
      .eq("status", "accepted")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(addressee_id.eq.${user.id},requester_id.eq.${profile.id})`
      )
      .maybeSingle();
    isPartner = !!partnership;
  }

  // Private profile: only visible to self and partners
  if (!profile.is_public && !isOwnProfile && !isPartner) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">@{profile.handle}</h1>
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            This profile is private.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  const genderLabels: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {profile.full_name ?? "Unknown"}
                </h1>
                {profile.is_public ? (
                  <Badge variant="secondary">Public</Badge>
                ) : (
                  <Badge variant="outline">Private</Badge>
                )}
              </div>
              <p className="text-muted-foreground">@{profile.handle}</p>
              {isOwnProfile && (
                <p className="mt-1 text-xs text-muted-foreground">This is your profile</p>
              )}
              {isPartner && (
                <Badge className="mt-1" variant="secondary">Partner</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {profile.age && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{profile.age} years old</span>
              </div>
            )}
            {profile.gender && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Gender:</span>
                <span>{genderLabels[profile.gender] ?? profile.gender}</span>
              </div>
            )}
            {profile.height_cm && (
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span>{profile.height_cm} cm</span>
              </div>
            )}
            {profile.weight_kg && (
              <div className="flex items-center gap-2 text-sm">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <span>{profile.weight_kg} kg</span>
              </div>
            )}
            {!profile.age && !profile.gender && !profile.height_cm && !profile.weight_kg && (
              <p className="text-sm text-muted-foreground">No details shared</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
