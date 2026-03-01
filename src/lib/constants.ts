export const MUSCLE_GROUPS = [
  "biceps",
  "triceps",
  "back",
  "legs",
  "chest",
  "shoulders",
  "core",
  "cardio",
  "glutes",
  "forearms",
  "full_body",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Today", href: "/today", icon: "CalendarCheck" },
  { label: "Workouts", href: "/workouts", icon: "Dumbbell" },
  { label: "My Routines", href: "/routines", icon: "CalendarDays" },
  { label: "My Logs", href: "/my-logs", icon: "ClipboardList" },
  { label: "Reports", href: "/reports", icon: "BarChart3" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Workout Catalog", href: "/admin/workouts", icon: "Dumbbell" },
  { label: "Tags", href: "/admin/tags", icon: "Tag" },
] as const;
