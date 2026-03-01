import { Dumbbell } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, oklch(0.84 0.18 128 / 0.08), transparent 70%)",
        }}
      />
      {/* Dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.84 0.18 128 / 0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
            style={{ animationDuration: "500ms" }}
          >
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <h1
            className="text-2xl font-bold animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
            style={{ animationDuration: "500ms", animationDelay: "100ms" }}
          >
            GymTracker
          </h1>
          <p
            className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
            style={{ animationDuration: "500ms", animationDelay: "200ms" }}
          >
            Track your fitness journey
          </p>
        </div>
        <div
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
          style={{ animationDuration: "500ms", animationDelay: "300ms" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
