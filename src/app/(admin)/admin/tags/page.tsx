import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TagTable } from "./_components/tag-table";
import { TagFormWrapper } from "./_components/tag-form-wrapper";

export const metadata: Metadata = {
  title: "Tags - Admin - GymTracker",
};

export default async function AdminTagsPage() {
  const supabase = await createClient();

  const { data: tags } = await supabase
    .from("tags")
    .select("*, workout_tags(tag_id)")
    .order("name");

  const tagsWithUsage = (tags ?? []).map((tag) => ({
    id: tag.id,
    name: tag.name,
    created_at: tag.created_at,
    usage_count: tag.workout_tags?.length ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tags</h1>
        <TagFormWrapper />
      </div>
      <TagTable tags={tagsWithUsage} />
    </div>
  );
}
