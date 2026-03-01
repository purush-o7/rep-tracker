"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Trash2,
  Users,
} from "lucide-react";
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
    is_public: boolean;
    partner_can_view_logs: boolean;
  };
}

export function ActivePartners({ partners }: { partners: PartnerInfo[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRemove = async (partnershipId: string) => {
    setLoadingId(partnershipId);
    const result = await removePartner(partnershipId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Partner removed");
    }
    setLoadingId(null);
  };

  if (partners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Users className="mb-4 h-12 w-12" />
        <p className="text-lg font-medium">No active partners</p>
        <p className="text-sm">Send an invite to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Active Partners
      </h3>
      {partners.map((p) => {
        const initials =
          p.profile.full_name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "U";

        return (
          <Card key={p.partnership_id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={p.profile.avatar_url ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {p.profile.full_name ?? "Unknown"}
                    </p>
                    <Badge variant={p.profile.is_public ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                      {p.profile.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                  {p.profile.handle && (
                    <Link
                      href={`/profile/${p.profile.handle}`}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      @{p.profile.handle}
                    </Link>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemove(p.partnership_id)}
                  disabled={loadingId === p.partnership_id}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.profile.partner_can_view_logs && (
                  <>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard?partner=${p.profile.id}`}>
                        <LayoutDashboard className="mr-1 h-3 w-3" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/my-logs?partner=${p.profile.id}`}>
                        <ClipboardList className="mr-1 h-3 w-3" />
                        Logs
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/reports?partner=${p.profile.id}`}>
                        <BarChart3 className="mr-1 h-3 w-3" />
                        Reports
                      </Link>
                    </Button>
                  </>
                )}
                {!p.profile.partner_can_view_logs && (
                  <p className="text-xs text-muted-foreground">
                    This partner has restricted access to their data
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
