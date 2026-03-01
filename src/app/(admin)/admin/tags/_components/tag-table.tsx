"use client";

import { useState } from "react";
import { Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { deleteTag } from "../actions";
import { TagForm } from "./tag-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TagWithUsage {
  id: string;
  name: string;
  created_at: string;
  usage_count: number;
}

interface TagTableProps {
  tags: TagWithUsage[];
}

export function TagTable({ tags }: TagTableProps) {
  const [editTag, setEditTag] = useState<TagWithUsage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TagWithUsage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteTag(deleteTarget.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Tag deleted");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (tags.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No tags yet"
        description="Create your first tag to categorize workouts."
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {tag.usage_count} workout{tag.usage_count !== 1 ? "s" : ""}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditTag(tag)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(tag)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{tag.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditTag(tag)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteTarget(tag)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">
                {tag.usage_count} workout{tag.usage_count !== 1 ? "s" : ""}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {editTag && (
        <TagForm
          open={!!editTag}
          onOpenChange={() => setEditTag(null)}
          tag={editTag}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Tag"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
