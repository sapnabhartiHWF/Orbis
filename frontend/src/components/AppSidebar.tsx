import { useState } from "react"
import { 
  Activity, 
  Target, 
  Book, 
  AlertTriangle, 
  Ticket, 
  BarChart3, 
  Kanban,
  Shield,
  ChevronRight,
  Rocket,
  Users,
  Calculator,
  Trophy,
  Zap,
  Settings,
  TrendingUp,
  LogOut
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
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
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

// Organized navigation groups for better UX
const navigationGroups = [
  {
    label: "Dashboard",
    items: [
      { 
        title: "Operations", 
        url: "/", 
        icon: Activity,
        description: "Live monitoring & bot status",
        isNew: false
      }
    ]
  },
  {
    label: "Automation Excellence",
    items: [
      { 
        title: "Collaboration Hub", 
        url: "/collaboration-hub", 
        icon: Users,
        description: "Team collaboration & projects",
        isNew: false
      },
      { 
        title: "Center of Excellence", 
        url: "/center-of-excellence", 
        icon: Rocket,
        description: "Automation pipeline & innovation",
        isNew: false
      },
      { 
        title: "ROI Assessment", 
        url: "/roi-assessment-engine", 
        icon: Calculator,
        description: "Financial analysis & tracking",
        isNew: false
      }
    ]
  },
  {
    label: "Analytics & Management",
    items: [
      { 
        title: "Tickets", 
        url: "/tickets", 
        icon: Ticket,
        description: "Collaboration & requests",
        isNew: false
      },
      { 
        title: "Analytics", 
        url: "/analytics", 
        icon: BarChart3,
        description: "Insights & reporting",
        isNew: false
      },
      { 
        title: "Leaderboard", 
        url: "/leaderboard", 
        icon: Trophy,
        description: "Gamification & recognition",
        isNew: true
      },
      { 
        title: "Agile Board", 
        url: "/agile", 
        icon: Kanban,
        description: "Project management",
        isNew: false
      }
    ]
  },
  {
    label: "Performance & Governance",
    items: [
      { 
        title: "SLA & KPIs", 
        url: "/sla", 
        icon: Target,
        description: "Performance tracking",
        isNew: false
      },
      { 
        title: "Rule Book", 
        url: "/rules", 
        icon: Book,
        description: "Process rules & versions",
        isNew: false
      },
      { 
        title: "Exceptions", 
        url: "/exceptions", 
        icon: AlertTriangle,
        description: "Error analysis & patterns",
        isNew: false
      }
    ]
  }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  const getGroupIcon = (label: string) => {
    switch(label) {
      case "Dashboard": return <Activity className="w-4 h-4" />
      case "Automation Excellence": return <Rocket className="w-4 h-4" />
      case "Performance & Governance": return <Settings className="w-4 h-4" />
      case "Analytics & Management": return <TrendingUp className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  return (
    <Sidebar className={`border-r border-border ${collapsed ? "w-36 mr-5" : "w-72"}`} collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-card to-card/50 backdrop-blur-sm">
        {/* Header */}
        <div className={`p-6 border-b border-border/50 ${collapsed ? "px-3 py-4" : ""}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <img 
                  src="/ICAT-logo.svg" 
                  alt="ICAT Logo" 
                  className="h-10 w-auto"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">RPA Command</h1>
                <p className="text-xs text-muted-foreground font-medium">Automation Control Center</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center mx-auto">
              <img 
                src="/ICAT-logo.svg" 
                alt="ICAT Logo" 
                className="h-10 w-auto"
              />
            </div>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4">
          {navigationGroups.map((group, groupIndex) => (
            <SidebarGroup key={group.label} className={groupIndex > 0 ? "mt-8" : ""}>
              {!collapsed && (
                <SidebarGroupLabel className="px-6 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                  {getGroupIcon(group.label)}
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title} className={collapsed ? "px-1 pr-5" : "px-4 mb-1"}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${
                            isActive(item.url)
                              ? "bg-gradient-primary text-primary-foreground shadow-glow scale-[1.02]"
                              : "text-muted-foreground hover:text-foreground hover:bg-gradient-subtle hover:scale-[1.01]"
                          }`}
                        >
                          <div className={`flex-shrink-0 ${isActive(item.url) ? "animate-pulse" : ""}`}>
                            <item.icon className={`${collapsed ? "w-5 h-5" : "w-5 h-5"} transition-transform group-hover:scale-110`} />
                          </div>
                          {!collapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold truncate">{item.title}</span>
                                {item.isNew && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-success text-success-foreground">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              {!isActive(item.url) && (
                                <div className="text-xs opacity-70 truncate mt-0.5">{item.description}</div>
                              )}
                            </div>
                          )}
                          {!collapsed && isActive(item.url) && (
                            <ChevronRight className="w-4 h-4 opacity-80 animate-pulse" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>

        {/* Footer Status and Logout */}
        {!collapsed && (
          <div className="mt-auto border-t border-border/50">
            <div className="p-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-success/10 border border-success/20 backdrop-blur-sm mb-4">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-glow"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">System Status</div>
                  <div className="text-xs text-success font-medium">All systems operational • 99.9% uptime</div>
                </div>
                <Shield className="w-4 h-4 text-success opacity-80" />
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 border border-red-500/20 text-red-600 hover:text-red-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsed Footer */}
        {collapsed && (
          <div className="mt-auto p-3 border-t border-border/50">
            <div className="mb-3">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse mx-auto shadow-glow"></div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 border border-red-500/20 text-red-600 hover:text-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}