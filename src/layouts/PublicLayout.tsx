import { Outlet } from "react-router-dom";
import { PublicHeader } from "@/components/navigation/PublicHeader";
import { PublicFooter } from "@/components/navigation/PublicFooter";
import { ChatFAB } from "@/components/chat/ChatFAB";
import { SocialProofNotifications } from "@/components/landing/SocialProofNotifications";

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <PublicFooter />
      <ChatFAB />
      <SocialProofNotifications />
    </div>
  );
};
