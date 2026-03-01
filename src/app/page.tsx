import Link from "next/link";
import { Dumbbell, BarChart3, ClipboardList, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3 md:px-8">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">GymTracker</span>
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
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Track Your Fitness Journey
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground md:text-xl">
            Log workouts, monitor progress, and reach your goals with a simple
            and powerful gym tracker.
          </p>
          <div className="mt-8 flex gap-3">
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
              ].map((feature) => (
                <div key={feature.title} className="text-center">
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
      </main>

      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
        Built with Next.js, Supabase & shadcn/ui
      </footer>
    </div>
  );
}
