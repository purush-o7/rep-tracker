import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RoutineForm } from "../_components/routine-form";

export const metadata: Metadata = {
  title: "Create Routine - GymTracker",
};

export default async function NewRoutinePage() {
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/routines">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Routine</h1>
      </div>
      <RoutineForm workouts={workouts ?? []} />
    </div>
  );
}
