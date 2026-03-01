import Link from "next/link";
import { Dumbbell, BarChart3, ClipboardList, Zap, Flame } from "lucide-react";
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
  if (rank === 1) return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold";
  if (rank === 2) return "bg-gray-300/20 text-gray-500 dark:text-gray-400 font-bold";
  if (rank === 3) return "bg-amber-700/20 text-amber-700 dark:text-amber-500 font-bold";
  return "bg-muted text-muted-foreground";
}

export default async function LandingPage() {
  const supabase = await createClient();
  const { currentStreaks, longestStreaks } = await getStreakLeaderboards(supabase);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-sm md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <span
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            GymTracker
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-4 py-20 text-center md:py-32">
          <h1
            className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
            style={{ animationDuration: "600ms" }}
          >
            Track Your Fitness Journey
          </h1>
          <p
            className="mt-4 max-w-xl text-lg text-muted-foreground md:text-xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
            style={{ animationDuration: "600ms", animationDelay: "150ms" }}
          >
            Log workouts, monitor progress, and reach your goals with a simple
            and powerful gym tracker.
          </p>
          <div
            className="mt-8 flex gap-3 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
            style={{ animationDuration: "600ms", animationDelay: "300ms" }}
          >
            <Button size="lg" asChild>
              <Link href="/signup">Start Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 px-4 py-16 md:py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything You Need
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Dumbbell,
                  title: "Exercise Library",
                  desc: "Browse a curated catalog of exercises with images and muscle group tags.",
                },
                {
                  icon: ClipboardList,
                  title: "Workout Logging",
                  desc: "Log sets, reps, and weight for every session with easy-to-use forms.",
                },
                {
                  icon: BarChart3,
                  title: "Progress Charts",
                  desc: "Visualize your gains with weekly, monthly, and per-exercise charts.",
                },
                {
                  icon: Zap,
                  title: "Smart Reports",
                  desc: "Get insights into muscle group balance and exercise progression.",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="text-center animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                  style={{ animationDuration: "500ms", animationDelay: `${index * 100}ms` }}
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Streak Leaderboards */}
        {(currentStreaks.length > 0 || longestStreaks.length > 0) && (
          <section className="border-t px-4 py-16 md:py-24">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-4 text-center text-3xl font-bold">
                Streak Leaderboards
              </h2>
              <p className="mb-12 text-center text-muted-foreground">
                See who&apos;s keeping up the consistency
              </p>
              <div className="grid gap-8 md:grid-cols-2">
                {/* Current Streak Leaders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      Current Streak Leaders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentStreaks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No streaks yet
                      </p>
                    ) : (
                      <ol className="space-y-3">
                        {currentStreaks.map((user: Record<string, string | number | null>, i: number) => (
                          <li key={i} className="flex items-center gap-3">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${getRankStyle(i + 1)}`}
                            >
                              {i + 1}
                            </span>
                            <Avatar size="sm">
                              {user.avatar_url && (
                                <AvatarImage src={user.avatar_url as string} alt="" />
                              )}
                              <AvatarFallback>
                                {getInitials(user.full_name as string | null, user.handle as string | null)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex-1 truncate text-sm font-medium">
                              {(user.full_name as string) || `@${user.handle}`}
                            </span>
                            <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
                              <Flame className="h-3.5 w-3.5" />
                              {user.current_streak}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                </Card>

                {/* All-Time Streak Records */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      All-Time Streak Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {longestStreaks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No streaks yet
                      </p>
                    ) : (
                      <ol className="space-y-3">
                        {longestStreaks.map((user: Record<string, string | number | null>, i: number) => (
                          <li key={i} className="flex items-center gap-3">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${getRankStyle(i + 1)}`}
                            >
                              {i + 1}
                            </span>
                            <Avatar size="sm">
                              {user.avatar_url && (
                                <AvatarImage src={user.avatar_url as string} alt="" />
                              )}
                              <AvatarFallback>
                                {getInitials(user.full_name as string | null, user.handle as string | null)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex-1 truncate text-sm font-medium">
                              {(user.full_name as string) || `@${user.handle}`}
                            </span>
                            <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
                              <Flame className="h-3.5 w-3.5" />
                              {user.longest_streak}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
        Built with Next.js, Supabase & shadcn/ui
      </footer>
    </div>
  );
}
