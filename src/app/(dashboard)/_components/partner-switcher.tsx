"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Users, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { partnerLabel } from "@/lib/data/partners";

interface PartnerSwitcherProps {
  partners: { id: string; full_name: string | null; handle?: string | null }[];
  activePartnerId?: string;
}

export function PartnerSwitcher({
  partners,
  activePartnerId,
}: PartnerSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (partners.length === 0) return null;

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "myself") {
      params.delete("partner");
    } else {
      params.set("partner", value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Users className="h-4 w-4 text-muted-foreground" />
      )}
      <Select
        value={activePartnerId ?? "myself"}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="myself">My Data</SelectItem>
          {partners.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {partnerLabel({ full_name: p.full_name, handle: p.handle ?? null })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
