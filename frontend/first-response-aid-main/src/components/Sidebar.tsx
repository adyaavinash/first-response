import { NavLink, useLocation } from "react-router-dom";
import { Home, Heart, Droplets, Map, ScanLine, Settings, Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const navigationItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "First Aid", url: "/dashboard/first-aid", icon: Heart },
  { title: "Rationing", url: "/dashboard/rationing", icon: Droplets },
  { title: "Safe Route", url: "/dashboard/safe-route", icon: Map },
  { title: "Flyer Scanner", url: "/dashboard/flyer-scanner", icon: ScanLine },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isExpanded = navigationItems.some((item) => isActive(item.url));

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    `w-full justify-start transition-smooth ${
      isActive
        ? "bg-sidebar-accent text-sidebar-primary border-l-4 border-sidebar-primary"
        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary"
    }`;

  return (
    <Sidebar
      className={`${state === "collapsed" ? "w-14" : "w-64"} transition-smooth bg-sidebar border-r border-sidebar-border`}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        {/* Logo section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-sidebar-primary" />
            {state !== "collapsed" && (
              <span className="ml-2 font-bold text-sidebar-foreground">FirstResponse</span>
            )}
          </div>
        </div>

        <SidebarGroup className="px-2 py-4">
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wide">
            {state !== "collapsed" && "Emergency Tools"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClassName}>
                      <item.icon className={`${state === "collapsed" ? "h-5 w-5" : "h-4 w-4 mr-3"}`} />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}