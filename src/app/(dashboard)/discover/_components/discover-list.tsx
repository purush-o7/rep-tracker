"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Search, Send, Check, Clock, UserX } from "lucide-react";
import { toast } from "sonner";
import { searchPublicProfiles } from "../actions";
import { sendPartnerInvite } from "../../partners/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProfileResult {
  id: string;
  handle: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface DiscoverListProps {
  initialProfiles: ProfileResult[];
  partnershipMap: Record<string, string>;
}

export function DiscoverList({
  initialProfiles,
  partnershipMap: initialPartnershipMap,
}: DiscoverListProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [partnershipMap, setPartnershipMap] = useState(initialPartnershipMap);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    setSearching(true);
    const result = await searchPublicProfiles(searchQuery);
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setProfiles(result.data);
    }
    setSearching(false);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    // Debounced search
    const timer = setTimeout(() => handleSearch(value), 400);
    return () => clearTimeout(timer);
  };

  const handleInvite = async (profile: ProfileResult) => {
    if (!profile.handle) return;
    setInvitingId(profile.id);
    const result = await sendPartnerInvite({ handle: profile.handle });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Invite sent to @${profile.handle}!`);
      setPartnershipMap((prev) => ({ ...prev, [profile.id]: "pending" }));
    }
    setInvitingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by handle or name..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
      </div>

      {searching && (
        <p className="text-center text-sm text-muted-foreground">Searching...</p>
      )}

      {!searching && profiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <UserX className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">No public profiles found</p>
          <p className="text-sm">
            {query
              ? "Try a different search term"
              : "No users have made their profiles public yet"}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {profiles.map((profile) => {
          const initials =
            profile.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() ?? "U";

          const status = partnershipMap[profile.id];

          return (
            <Card key={profile.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Link href={`/profile/${profile.handle}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <Link
                    href={`/profile/${profile.handle}`}
                    className="font-medium hover:underline"
                  >
                    {profile.full_name ?? "Unknown"}
                  </Link>
                  {profile.handle && (
                    <p className="text-xs text-muted-foreground">
                      @{profile.handle}
                    </p>
                  )}
                </div>
                {status === "accepted" ? (
                  <Badge variant="secondary">
                    <Check className="mr-1 h-3 w-3" />
                    Partner
                  </Badge>
                ) : status === "pending" ? (
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleInvite(profile)}
                    disabled={invitingId === profile.id}
                  >
                    <Send className="mr-1 h-3 w-3" />
                    {invitingId === profile.id ? "Sending..." : "Invite"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
