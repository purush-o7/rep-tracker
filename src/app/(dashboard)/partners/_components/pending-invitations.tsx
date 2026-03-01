"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { respondToInvite } from "../actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  created_at: string;
}

export function PendingInvitations({ invitations }: { invitations: PartnerInfo[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRespond = async (
    partnershipId: string,
    action: "accepted" | "rejected"
  ) => {
    setLoadingId(partnershipId);
    const result = await respondToInvite({
      partnership_id: partnershipId,
      action,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        action === "accepted" ? "Partner request accepted!" : "Request declined"
      );
    }
    setLoadingId(null);
  };

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Pending Invitations
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
                <p className="text-xs text-muted-foreground">
                  Wants to be your partner
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() =>
                    handleRespond(inv.partnership_id, "accepted")
                  }
                  disabled={loadingId === inv.partnership_id}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleRespond(inv.partnership_id, "rejected")
                  }
                  disabled={loadingId === inv.partnership_id}
                >
                  <X className="mr-1 h-4 w-4" />
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
