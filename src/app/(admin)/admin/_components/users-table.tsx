"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserActivityBadge } from "./user-activity-badge";
import type { Profile } from "@/lib/types";

interface UserWithActivity extends Profile {
  email: string;
  total_workouts: number;
  last_workout: string | null;
}

interface UsersTableProps {
  users: UserWithActivity[];
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const initials =
                user.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() ?? "U";
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url ?? undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
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
                    <Badge
                      variant={
                        user.role === "super_admin" ? "default" : "secondary"
                      }
                    >
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {users.map((user) => {
          const initials =
            user.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() ?? "U";
          return (
            <Card key={user.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {user.full_name ?? "Unknown"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Badge
                    variant={
                      user.role === "super_admin" ? "default" : "secondary"
                    }
                  >
                    {user.role}
                  </Badge>
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
  );
}
