"use client";

import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { uploadWorkoutImage, deleteWorkoutImage } from "../actions";
import type { WorkoutImage } from "@/lib/types";

interface ImageUploadProps {
  workoutId: string;
  images: WorkoutImage[];
  supabaseUrl: string;
}

export function ImageUpload({
  workoutId,
  images,
  supabaseUrl,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadWorkoutImage(workoutId, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Image uploaded");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteWorkoutImage(deleteTarget.id, deleteTarget.storage_path);
    toast.success("Image deleted");
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-video overflow-hidden rounded-md border"
          >
            <img
              src={`${supabaseUrl}/storage/v1/object/public/workout-images/${img.storage_path}`}
              alt="Workout"
              className="h-full w-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => setDeleteTarget(img)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button variant="outline" size="sm" asChild disabled={uploading}>
            <span>
              <ImagePlus className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Add Image"}
            </span>
          </Button>
        </label>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
