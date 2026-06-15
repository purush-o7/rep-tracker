import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { Topbar } from "./_components/topbar";
import { BottomNav } from "./_components/bottom-nav";
import { RestTimerProvider } from "@/components/rest-timer/rest-timer-provider";
import { RestTimerOverlay } from "@/components/rest-timer/rest-timer-overlay";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RestTimerProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Topbar />
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
          <BottomNav />
        </SidebarInset>
      </SidebarProvider>
      <RestTimerOverlay />
    </RestTimerProvider>
  );
}
