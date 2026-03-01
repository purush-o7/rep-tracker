"use client";

import { useState } from "react";
import { MoreHorizontal, ShieldCheck, ShieldOff, Users } from "lucide-react";
import { toast } from "sonner";
import { toggleUserRole } from "../actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/search-input";
import { DataPagination } from "@/components/data-pagination";
import { UserActivityBadge } from "./user-activity-badge";
import type { Profile } from "@/lib/types";

interface UserWithActivity extends Profile {
  email: string;
  total_workouts: number;
  last_workout: string | null;
}

interface UsersTableProps {
  users: UserWithActivity[];
  currentUserId: string;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function UsersTable({
  users,
  currentUserId,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
}: UsersTableProps) {
  const [roleTarget, setRoleTarget] = useState<{
    userId: string;
    name: string;
    newRole: "user" | "super_admin";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async () => {
    if (!roleTarget) return;
    setLoading(true);
    const result = await toggleUserRole(roleTarget.userId, roleTarget.newRole);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        roleTarget.newRole === "super_admin"
          ? `${roleTarget.name} is now an admin`
          : `${roleTarget.name} is no longer an admin`
      );
    }
    setLoading(false);
    setRoleTarget(null);
  };

  const getInitials = (name: string | null) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  if (users.length === 0 && totalCount === 0) {
    return (
      <>
        <SearchInput placeholder="Search by name or handle..." />
        <EmptyState
          icon={Users}
          title="No users found"
          description="No users match your search criteria."
        />
      </>
    );
  }

  return (
    <>
      <SearchInput placeholder="Search by name or handle..." />

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No results"
          description="No users match your search. Try a different query."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isAdmin = user.role === "super_admin";
                  const isSelf = user.id === currentUserId;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.avatar_url ?? undefined}
                            />
                            <AvatarFallback>
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.full_name ?? "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isAdmin ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <UserActivityBadge
                          lastWorkout={user.last_workout}
                          totalWorkouts={user.total_workouts}
                          memberSince={user.created_at}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAdmin ? (
                              <DropdownMenuItem
                                disabled={isSelf}
                                onClick={() =>
                                  setRoleTarget({
                                    userId: user.id,
                                    name: user.full_name ?? "User",
                                    newRole: "user",
                                  })
                                }
                              >
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Remove Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setRoleTarget({
                                    userId: user.id,
                                    name: user.full_name ?? "User",
                                    newRole: "super_admin",
                                  })
                                }
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {users.map((user) => {
              const isAdmin = user.role === "super_admin";
              const isSelf = user.id === currentUserId;
              return (
                <Card key={user.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {user.full_name ?? "Unknown"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={isAdmin ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAdmin ? (
                              <DropdownMenuItem
                                disabled={isSelf}
                                onClick={() =>
                                  setRoleTarget({
                                    userId: user.id,
                                    name: user.full_name ?? "User",
                                    newRole: "user",
                                  })
                                }
                              >
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Remove Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setRoleTarget({
                                    userId: user.id,
                                    name: user.full_name ?? "User",
                                    newRole: "super_admin",
                                  })
                                }
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <UserActivityBadge
                      lastWorkout={user.last_workout}
                      totalWorkouts={user.total_workouts}
                      memberSince={user.created_at}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />

      <ConfirmDialog
        open={!!roleTarget}
        onOpenChange={(open) => !open && setRoleTarget(null)}
        title={
          roleTarget?.newRole === "super_admin" ? "Make Admin" : "Remove Admin"
        }
        description={
          roleTarget?.newRole === "super_admin"
            ? `Are you sure you want to make ${roleTarget?.name} an admin? They will have full access to the admin panel.`
            : `Are you sure you want to remove admin access from ${roleTarget?.name}?`
        }
        confirmLabel={
          roleTarget?.newRole === "super_admin" ? "Make Admin" : "Remove Admin"
        }
        variant={roleTarget?.newRole === "user" ? "destructive" : "default"}
        onConfirm={handleRoleChange}
        loading={loading}
      />
    </>
  );
}
