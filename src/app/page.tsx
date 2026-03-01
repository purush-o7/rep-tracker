import Link from "next/link";
import {
  Dumbbell,
  BarChart3,
  ClipboardList,
  Zap,
  Flame,
  ArrowRight,
  Users,
  Trophy,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { getStreakLeaderboards } from "@/lib/data/leaderboard";

function getInitials(name: string | null, handle: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (handle) return handle[0].toUpperCase();
  return "?";
}

function getRankStyle(rank: number): string {
  if (rank === 1)
    return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold ring-1 ring-yellow-500/30";
  if (rank === 2)
    return "bg-gray-300/20 text-gray-500 dark:text-gray-400 font-bold ring-1 ring-gray-400/30";
  if (rank === 3)
    return "bg-amber-700/20 text-amber-700 dark:text-amber-500 font-bold ring-1 ring-amber-600/30";
  return "bg-muted text-muted-foreground";
}

export default async function LandingPage() {
  const supabase = await createClient();
  const { currentStreaks, longestStreaks } =
    await getStreakLeaderboards(supabase);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-background/60 px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            GymTracker
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">
              Get Started
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden px-4 py-24 md:py-36">
          {/* Glow effect behind hero */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDuration: "500ms" }}
            >
              <Flame className="h-3.5 w-3.5" />
              Free &middot; No credit card required
            </div>

            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
              style={{ animationDuration: "600ms", animationDelay: "100ms" }}
            >
              Track Your
              <br />
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent">
                Fitness Journey
              </span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
              style={{ animationDuration: "600ms", animationDelay: "200ms" }}
            >
              Log workouts, build streaks, and crush your goals with a
              beautifully simple gym tracker.
            </p>

            <div
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
              style={{ animationDuration: "600ms", animationDelay: "300ms" }}
            >
              <Button size="lg" className="px-8 text-base" asChild>
                <Link href="/signup">
                  Start Tracking
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 text-base"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Stats row */}
            <div
              className="mt-16 flex items-center justify-center gap-8 sm:gap-12 animate-in fade-in fill-mode-both"
              style={{ animationDuration: "600ms", animationDelay: "500ms" }}
            >
              {[
                { value: "100%", label: "Free" },
                { value: "PWA", label: "Mobile Ready" },
                { value: "Real-time", label: "Sync" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="relative border-t px-4 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
                Features
              </p>
              <h2 className="text-3xl font-bold md:text-4xl">
                Everything You Need
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                A complete toolkit designed to keep you consistent and motivated
                in the gym.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Dumbbell,
                  title: "Exercise Library",
                  desc: "Browse a curated catalog with images, videos, and muscle group tags.",
                },
                {
                  icon: ClipboardList,
                  title: "Workout Logging",
                  desc: "Log sets, reps, and weight for every session with quick-entry forms.",
                },
                {
                  icon: BarChart3,
                  title: "Progress Charts",
                  desc: "Visualize your gains with weekly activity and per-exercise trends.",
                },
                {
                  icon: Zap,
                  title: "Smart Reports",
                  desc: "Get insights into muscle group balance and volume progression.",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border bg-card/50 p-6 transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                  style={{
                    animationDuration: "500ms",
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="border-t bg-muted/30 px-4 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
                How It Works
              </p>
              <h2 className="text-3xl font-bold md:text-4xl">
                Three Steps to Progress
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: CalendarCheck,
                  title: "Plan Your Day",
                  desc: "Load a routine or pick individual exercises for today's session.",
                },
                {
                  step: "02",
                  icon: Dumbbell,
                  title: "Log Your Sets",
                  desc: "Enter reps and weight as you train. Track every set in seconds.",
                },
                {
                  step: "03",
                  icon: Trophy,
                  title: "See Your Progress",
                  desc: "Watch your streaks grow and your charts trend upward over time.",
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="relative text-center animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                  style={{
                    animationDuration: "500ms",
                    animationDelay: `${index * 120}ms`,
                  }}
                >
                  <span className="mb-4 inline-block text-5xl font-bold text-primary/15">
                    {item.step}
                  </span>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Streak Leaderboards ── */}
        {(currentStreaks.length > 0 || longestStreaks.length > 0) && (
          <section className="border-t px-4 py-20 md:py-28">
            <div className="mx-auto max-w-5xl">
              <div className="mb-16 text-center">
                <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
                  Community
                </p>
                <h2 className="text-3xl font-bold md:text-4xl">
                  Streak Leaderboards
                </h2>
                <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                  See who&apos;s keeping up the consistency. Build your streak
                  and climb the ranks.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Current Streak Leaders */}
                <Card className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Flame className="h-5 w-5 text-orange-500" />
                      Current Streak Leaders
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {currentStreaks.length === 0 ? (
                      <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No streaks yet
                      </p>
                    ) : (
                      <ol className="divide-y">
                        {currentStreaks.map(
                          (
                            user: Record<string, string | number | null>,
                            i: number
                          ) => (
                            <li
                              key={i}
                              className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/30"
                            >
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${getRankStyle(i + 1)}`}
                              >
                                {i + 1}
                              </span>
                              <Avatar size="sm">
                                {user.avatar_url && (
                                  <AvatarImage
                                    src={user.avatar_url as string}
                                    alt=""
                                  />
                                )}
                                <AvatarFallback>
                                  {getInitials(
                                    user.full_name as string | null,
                                    user.handle as string | null
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex-1 truncate text-sm font-medium">
                                {(user.full_name as string) ||
                                  `@${user.handle}`}
                              </span>
                              <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
                                <Flame className="h-3.5 w-3.5" />
                                {user.current_streak}
                              </span>
                            </li>
                          )
                        )}
                      </ol>
                    )}
                  </CardContent>
                </Card>

                {/* All-Time Streak Records */}
                <Card className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      All-Time Streak Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {longestStreaks.length === 0 ? (
                      <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No streaks yet
                      </p>
                    ) : (
                      <ol className="divide-y">
                        {longestStreaks.map(
                          (
                            user: Record<string, string | number | null>,
                            i: number
                          ) => (
                            <li
                              key={i}
                              className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/30"
                            >
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${getRankStyle(i + 1)}`}
                              >
                                {i + 1}
                              </span>
                              <Avatar size="sm">
                                {user.avatar_url && (
                                  <AvatarImage
                                    src={user.avatar_url as string}
                                    alt=""
                                  />
                                )}
                                <AvatarFallback>
                                  {getInitials(
                                    user.full_name as string | null,
                                    user.handle as string | null
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex-1 truncate text-sm font-medium">
                                {(user.full_name as string) ||
                                  `@${user.handle}`}
                              </span>
                              <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
                                <Flame className="h-3.5 w-3.5" />
                                {user.longest_streak}
                              </span>
                            </li>
                          )
                        )}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="border-t px-4 py-20 md:py-28">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border bg-card p-10 text-center md:p-16">
            {/* Subtle glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />

            <div className="relative">
              <h2 className="text-3xl font-bold md:text-4xl">
                Ready to Start?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                Join the community and start building your streak today. It only
                takes a minute to sign up.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" className="px-8 text-base" asChild>
                  <Link href="/signup">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t bg-muted/20 px-4 py-12 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
                <span
                  className="text-lg font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  GymTracker
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Track your workouts, build streaks, and reach your fitness
                goals.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Product
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/signup"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/workouts"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Workouts
                  </Link>
                </li>
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Features
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>Exercise Library</li>
                <li>Workout Logging</li>
                <li>Progress Charts</li>
                <li>Streak Tracking</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} GymTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
