import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Lightbulb,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveRegistrations } from "@/hooks/useActiveRegistrations";

const tabs = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/sessions", icon: MessageSquare, label: "Sessions" },
  { to: "/app/ideas", icon: Lightbulb, label: "Ideas" },
  { to: "/app/documents", icon: FileText, label: "Docs" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
];

export const BottomTabBar = () => {
  const { registrations } = useActiveRegistrations();
  const activeCount = registrations.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full touch-target transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <div className="relative">
              <tab.icon className="w-5 h-5" />
              {tab.to === "/app/ideas" && activeCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-green-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
