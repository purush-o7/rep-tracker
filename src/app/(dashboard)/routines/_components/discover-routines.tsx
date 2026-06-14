"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Copy, Loader2, Sparkles, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { copyRoutine } from "../actions";

export interface PublicRoutine {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  isSystem: boolean;
  authorLabel: string | null;
}

interface DiscoverRoutinesProps {
  routines: PublicRoutine[];
}

export function DiscoverRoutines({ routines }: DiscoverRoutinesProps) {
  const router = useRouter();
  const [copying, setCopying] = useState<string | null>(null);

  if (routines.length === 0) return null;

  const handleCopy = async (id: string) => {
    setCopying(id);
    const result = await copyRoutine(id);
    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("Copied to your routines — edit it any time");
      router.refresh();
    }
    setCopying(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          Discover Routines
        </h2>
        <p className="text-sm text-muted-foreground">
          Ready-made and community routines. Copy one to make it yours — then
          tweak freely.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {routines.map((r) => (
          <Card key={r.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-lg">
                <span className="truncate">{r.name}</span>
                {r.isSystem && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    <Sparkles className="h-2.5 w-2.5" />
                    System
                  </span>
                )}
              </CardTitle>
              {r.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {r.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="h-4 w-4" />
                  {r.itemCount} {r.itemCount === 1 ? "exercise" : "exercises"}
                </span>
                {!r.isSystem && r.authorLabel && (
                  <span className="truncate">by {r.authorLabel}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/routines/${r.id}`}>
                    <Eye className="mr-1.5 h-4 w-4" />
                    View
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCopy(r.id)}
                  disabled={copying === r.id}
                >
                  {copying === r.id ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="mr-1.5 h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
