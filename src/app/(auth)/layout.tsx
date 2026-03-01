import { Dumbbell } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Dumbbell className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">GymTracker</h1>
          <p className="text-sm text-muted-foreground">
            Track your fitness journey
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
