import { useState } from "react"
import { 
  Activity, 
  Target, 
  Book, 
  AlertTriangle, 
  Ticket, 
  BarChart3, 
  Kanban,
  Bot,
  Shield,
  ChevronRight,
  Rocket,
  Users,
  Calculator,
  Trophy,
  Zap,
  Settings,
  TrendingUp
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
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
        title: "Center of Excellence", 
        url: "/center-of-excellence", 
        icon: Rocket,
        description: "Automation pipeline & innovation",
        isNew: false
      },
      { 
        title: "Collaboration Hub", 
        url: "/collaboration-hub", 
        icon: Users,
        description: "Team collaboration & projects",
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
  }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

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
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">RPA Command</h1>
                <p className="text-xs text-muted-foreground font-medium">Automation Control Center</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto shadow-glow">
              <Bot className="w-5 h-5 text-primary-foreground" />
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

        {/* Footer Status */}
        {!collapsed && (
          <div className="mt-auto p-6 border-t border-border/50">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-success/10 border border-success/20 backdrop-blur-sm">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-glow"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">System Status</div>
                <div className="text-xs text-success font-medium">All systems operational • 99.9% uptime</div>
              </div>
              <Shield className="w-4 h-4 text-success opacity-80" />
            </div>
          </div>
        )}

        {/* Collapsed Footer */}
        {collapsed && (
          <div className="mt-auto p-3">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse mx-auto shadow-glow"></div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}