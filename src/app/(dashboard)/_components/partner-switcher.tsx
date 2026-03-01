"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PartnerSwitcherProps {
  partners: { id: string; full_name: string | null }[];
  activePartnerId?: string;
}

export function PartnerSwitcher({
  partners,
  activePartnerId,
}: PartnerSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (partners.length === 0) return null;

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "myself") {
      params.delete("partner");
    } else {
      params.set("partner", value);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select
        value={activePartnerId ?? "myself"}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="myself">My Data</SelectItem>
          {partners.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.full_name ?? "Partner"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
