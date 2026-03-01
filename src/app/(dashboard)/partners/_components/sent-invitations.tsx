"use client";

import { useState } from "react";
import { Clock, X } from "lucide-react";
import { toast } from "sonner";
import { removePartner } from "../actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PartnerInfo {
  partnership_id: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    handle: string | null;
  };
}

export function SentInvitations({ invitations }: { invitations: PartnerInfo[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCancel = async (partnershipId: string) => {
    setLoadingId(partnershipId);
    const result = await removePartner(partnershipId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Invitation cancelled");
    }
    setLoadingId(null);
  };

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Sent Invitations
      </h3>
      {invitations.map((inv) => {
        const initials =
          inv.profile.full_name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "U";

        return (
          <Card key={inv.partnership_id}>
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={inv.profile.avatar_url ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {inv.profile.full_name ?? "Unknown"}
                </p>
                {inv.profile.handle && (
                  <p className="text-xs text-muted-foreground">
                    @{inv.profile.handle}
                  </p>
                )}
              </div>
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                Pending
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCancel(inv.partnership_id)}
                disabled={loadingId === inv.partnership_id}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
