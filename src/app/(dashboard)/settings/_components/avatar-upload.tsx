"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { uploadAvatar } from "../actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  currentUrl: string | null;
  initials: string;
}

export function AvatarUpload({ currentUrl, initials }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadAvatar(formData);
    if (result.error) {
      toast.error(result.error);
      setPreviewUrl(currentUrl);
    } else {
      toast.success("Avatar updated");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={previewUrl ?? undefined} />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
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
            <Camera className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Change Avatar"}
          </span>
        </Button>
      </label>
    </div>
  );
}
