import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import {
  getPartnersWithPermissions,
  resolvePartnerView,
} from "@/lib/data/partners";
import { DashboardStats } from "./_components/dashboard-stats";
import { DashboardCharts } from "./_components/dashboard-charts";
import { WeightGoalCard } from "./_components/weight-goal-card";
import { WeeklyMuscleCoverage } from "./_components/weekly-muscle-coverage";
import { PartnerSwitcher } from "../_components/partner-switcher";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Users, CalendarCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard - GymTracker",
};

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="h-[76px] animate-pulse p-3" />
      ))}
    </div>
  );
}

function CoverageSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}

function WeightCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-[140px] w-full" />
      </CardContent>
    </Card>
  );
}

function ChartsSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  const currentUserId = user!.id;

  const { partners, partnerIds } = await getPartnersWithPermissions(
    supabase,
    currentUserId
  );
  const { viewingUserId, partnerName, partnerViewRestricted } =
    resolvePartnerView(params, partners, partnerIds, currentUserId);

  if (partnerViewRestricted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {partners.length > 0 && (
            <PartnerSwitcher
              partners={partners}
              activePartnerId={params.partner}
            />
          )}
        </div>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>{partnerName}</strong> has restricted access to their
            workout data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isOwn = viewingUserId === currentUserId;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {isOwn ? "Your training at a glance" : `${partnerName}'s training`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {partners.length > 0 && (
            <PartnerSwitcher partners={partners} activePartnerId={params.partner} />
          )}
          {isOwn && (
            <Button asChild>
              <Link href="/today">
                <CalendarCheck className="mr-1.5 h-4 w-4" />
                Today
              </Link>
            </Button>
          )}
        </div>
      </div>
      {partnerName && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Viewing <strong>{partnerName}</strong>&apos;s dashboard
          </AlertDescription>
        </Alert>
      )}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <DashboardStats userId={viewingUserId} />
      </Suspense>

      {/* Coverage + body weight share a row on desktop */}
      <div className={isOwn ? "grid gap-4 lg:grid-cols-2" : ""}>
        <Suspense fallback={<CoverageSkeleton />}>
          <WeeklyMuscleCoverage userId={viewingUserId} />
        </Suspense>
        {isOwn && (
          <Suspense fallback={<WeightCardSkeleton />}>
            <WeightGoalCard userId={currentUserId} />
          </Suspense>
        )}
      </div>
      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardCharts userId={viewingUserId} />
      </Suspense>
    </div>
  );
}
