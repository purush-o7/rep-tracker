"use client";

import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser } from "@/hooks/use-user";
import { UserNav } from "./user-nav";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/today": "Today",
  "/workouts": "Workouts",
  "/routines": "My Routines",
  "/my-logs": "My Logs",
  "/reports": "Reports",
  "/partners": "Partners",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const { profile } = useUser();
  const title = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  const streak = profile?.current_streak ?? 0;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      {title && (
        <span className="text-sm text-muted-foreground">{title}</span>
      )}
      <div className="flex-1" />
      {streak > 0 && (
        <div className="flex items-center gap-1">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-bold">{streak}</span>
        </div>
      )}
      <ThemeToggle />
      <UserNav />
    </header>
  );
}
