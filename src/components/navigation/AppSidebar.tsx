import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  FileText,
  Settings,
  Rocket,
  ShieldCheck,
  BarChart3,
  Receipt,
  Gift,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useActiveRegistrations } from "@/hooks/useActiveRegistrations";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/trends", icon: TrendingUp, label: "Trends" },
  { to: "/app/sessions", icon: MessageSquare, label: "Sessions" },
  { to: "/app/ideas", icon: Lightbulb, label: "Ideas" },
  { to: "/app/documents", icon: FileText, label: "Documents" },
  { to: "/app/orders", icon: Receipt, label: "Orders" },
  { to: "/app/referrals", icon: Gift, label: "Referrals" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
];

const adminItems = [
  { to: "/app/admin/grants", icon: ShieldCheck, label: "Grants" },
  { to: "/app/admin/analytics", icon: BarChart3, label: "Analytics" },
];

export const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { registrations } = useActiveRegistrations();
  const { profile } = useAuth();
  const activeCount = registrations.length;
  const isAdmin = profile?.roles?.includes("admin");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Rocket className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg text-sidebar-foreground">
              FastTrack
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2",
                          isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.to === "/app/ideas" && activeCount > 0 && !collapsed && (
                        <Badge className="ml-auto bg-green-600 hover:bg-green-600 text-white text-xs h-5 min-w-[20px] flex items-center justify-center">
                          {activeCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - only visible to admins */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2",
                            isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
