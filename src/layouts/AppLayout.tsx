import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { AppHeader } from "@/components/navigation/AppHeader";
import { ChatFAB } from "@/components/chat/ChatFAB";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";

export const AppLayout = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      {isMobile ? (
        <div className="min-h-screen bg-background flex flex-col w-full">
          <OfflineIndicator />
          <AppHeader />
          <main className="flex-1 overflow-y-auto pb-20 pt-16">
            <Outlet />
          </main>
          <BottomTabBar />
          <ChatFAB />
        </div>
      ) : (
        <div className="min-h-screen flex w-full">
          <OfflineIndicator />
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
};
