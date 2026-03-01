"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { tagSchema, type TagInput } from "@/lib/validators/tag";
import { createTag, updateTag } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TagFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: { id: string; name: string };
}

export function TagForm({ open, onOpenChange, tag }: TagFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!tag;

  const form = useForm<TagInput>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag?.name ?? "",
    },
  });

  const onSubmit = async (data: TagInput) => {
    setLoading(true);
    const result = isEditing
      ? await updateTag(tag.id, data)
      : await createTag(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEditing ? "Tag updated" : "Tag created");
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tag" : "Create Tag"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Chest" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
