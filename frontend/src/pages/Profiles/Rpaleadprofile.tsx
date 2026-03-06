import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Mail, Phone, Building, Calendar, MapPin, Target, TrendingUp, 
  Clock, CheckCircle, Users, Edit, Camera,
  Zap, Shield, Bell, ExternalLink
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"

// Notification interface
interface Notification {
  NotificationId: number
  Title: string
  Message: string
  IsRead: boolean
  CreatedAt: string
  EntityType?: string | null
  EntityId?: number | null
}

// RPA Lead / COE Manager Profile
export function RPALeadProfile() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoadingNotifications(true)
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await fetch("https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/team/notifications?page=1&pageSize=50", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.data)) {
            setNotifications(data.data)
            setUnreadCount(data.data.filter((n: Notification) => !n.IsRead).length)
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setIsLoadingNotifications(false)
      }
    }

    fetchNotifications()
  }, [])

  // Format process ID as P078 pattern
  const formatProcessId = (processId: number | null | undefined): string => {
    if (!processId) return ""
    return `P${String(processId).padStart(3, "0")}`
  }

  // Render notification message with highlighted process id + name
  const renderHighlightedMessage = (notification: Notification) => {
    const raw = notification.Message || ""
    const processId = notification.EntityId
    const formattedId = formatProcessId(processId)

    if (!formattedId) return raw

    const match = raw.match(/\((\d+)\)\s*([^.]+)/)
    if (!match) {
      return (
        <>
          <span className="font-semibold text-primary">{formattedId}</span>{" "}
          {raw}
        </>
      )
    }

    const full = match[0]
    const processName = match[2]?.trim() || ""
    const [before, after] = raw.split(full)

    return (
      <>
        {before}
        <span className="font-semibold text-primary">
          {formattedId} {processName}
        </span>
        {after}
      </>
    )
  }

  // Navigate to process
  const handleViewProcess = (processId: number | null | undefined) => {
    if (!processId) return
    navigate("/center-of-excellence", {
      state: {
        activeTab: "approvals",
        processId: String(processId),
      },
    })
  }

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/team/notifications/mark-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ NotificationId: notificationId }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.NotificationId === notificationId ? { ...n, IsRead: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const [profile] = useState({
    userId: 14,
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.johnson@company.com",
    phone: "+91 98765 67890",
    roleName: "RPA Lead / COE Manager",
    roleId: 14,
    department: "Digital Transformation",
    jobTitle: "Head of RPA Center of Excellence",
    location: "Bangalore, Karnataka, India",
    joinDate: "2020-02-15",
    bio: "RPA Center of Excellence leader with 8+ years of experience in enterprise automation. Leading a team of 12 developers delivering $15M+ in annual cost savings.",

    statistics: {
      teamSize: 12,
      totalBots: 87,
      portfolioROI: 15200000,
      approvalsThisMonth: 18,
      avgApprovalTime: 1.8,
      approvalAccuracy: 96.5,
      teamUtilization: 92,
      botSuccessRate: 94.2,
      totalTimeSaved: 18400,
    },

    teamMembers: [
      { name: "Sapna Bharti",  role: "Senior RPA Developer", bots: 18, status: "Active"   },
      { name: "Rahul Sharma",  role: "RPA Developer",        bots: 12, status: "Active"   },
      { name: "Priya Patel",   role: "RPA Developer",        bots: 15, status: "Active"   },
      { name: "Amit Kumar",    role: "Junior RPA Developer", bots:  8, status: "Training" },
      { name: "Neha Singh",    role: "QA Engineer",          bots:  0, status: "Active"   },
    ],

    recentDecisions: [
      {
        type: "approval",
        processId: "P054",
        title: "Invoice Processing Automation",
        stage: "Detailed Analysis",
        decision: "Approved",
        timestamp: "2026-02-19T11:00:00Z",
        notes: "PDD is comprehensive. Good automation candidate."
      },
      {
        type: "rejection",
        processId: "P057",
        title: "Contract Review Automation",
        stage: "Initial Triage",
        decision: "Rejected",
        timestamp: "2026-02-18T15:30:00Z",
        notes: "Too many exceptions. Requires AI/ML capabilities beyond current scope."
      },
      {
        type: "approval",
        processId: "P051",
        title: "Employee Onboarding Bot",
        stage: "Go Live",
        decision: "Approved",
        timestamp: "2026-02-17T09:15:00Z",
        notes: "Production ready. Excellent QA results."
      }
    ],

    quarterlyGoals: {
      botsDeployed:      { target: 25,      actual: 19,      progress: 76 },
      costSavings:       { target: 5000000, actual: 3800000, progress: 76 },
      teamGrowth:        { target: 15,      actual: 12,      progress: 80 },
      avgDeploymentTime: { target: 45,      actual: 38,      progress: 84 },
    }
  })

  // ── Formatters ──────────────────────────────────────────────
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000)   return `₹${(amount / 100000).toFixed(1)}L`
    return `₹${amount.toLocaleString()}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-500/20 text-red-600 border-red-500/30"
      case "High":     return "bg-orange-500/20 text-orange-600 border-orange-500/30"
      case "Medium":   return "bg-blue-500/20 text-blue-600 border-blue-500/30"
      case "Low":      return "bg-gray-500/20 text-gray-600 border-gray-500/30"
      default:         return "bg-muted text-muted-foreground"
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="w-full space-y-6">

        {/* ── Header Card ── */}
        <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/20 via-card to-card border-2 border-purple-200 dark:border-purple-800 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-purple-500/30 shadow-lg">
                    <AvatarFallback className="text-3xl font-bold bg-purple-500/10">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full shadow-lg hover:bg-purple-700">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-sm px-3 py-1 font-semibold">
                  {profile.roleName}
                </Badge>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{profile.firstName} {profile.lastName}</h1>
                    <p className="text-lg text-muted-foreground font-medium">{profile.jobTitle}</p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Since {new Date(profile.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-card border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team Size</p>
                  <p className="text-3xl font-bold text-blue-600">{profile.statistics.teamSize}</p>
                </div>
                <Users className="w-10 h-10 text-blue-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 dark:from-green-950/20 to-card border-2 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bots</p>
                  <p className="text-3xl font-bold text-green-600">{profile.statistics.totalBots}</p>
                </div>
                <Zap className="w-10 h-10 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-card border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio ROI</p>
                  <p className="text-3xl font-bold text-purple-600">{formatCurrency(profile.statistics.portfolioROI)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Main Tabs ── */}
        <Tabs defaultValue="decisions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
            <TabsTrigger value="decisions">Recent Decisions</TabsTrigger>
            <TabsTrigger value="team">Team Overview</TabsTrigger>
            <TabsTrigger value="goals">Strategic Goals</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* ── Recent Decisions Tab ── */}
          <TabsContent value="decisions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Recent Decisions
                </CardTitle>
                <CardDescription>Your recent approvals and rejections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.recentDecisions.map((decision, idx) => (
                  <div key={idx} className={`p-4 border rounded-lg ${
                    decision.decision === "Approved"
                      ? "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10"
                      : "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10"
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{decision.processId}</Badge>
                          <Badge className={decision.decision === "Approved"
                            ? "bg-green-500/20 text-green-600"
                            : "bg-red-500/20 text-red-600"}>
                            {decision.decision}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{decision.title}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{decision.notes}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Stage: {decision.stage}</span>
                      <span>{new Date(decision.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Team Overview Tab ── */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Team Members ({profile.statistics.teamSize})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.teamMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{member.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{member.bots} Bots</p>
                          <Badge className={member.status === "Active"
                            ? "bg-green-500/20 text-green-600 text-xs"
                            : "bg-blue-500/20 text-blue-600 text-xs"}>
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Strategic Goals Tab ── */}
          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Q1 2026 Strategic Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Bots Deployed</span>
                    <span className="text-muted-foreground">
                      {profile.quarterlyGoals.botsDeployed.actual} / {profile.quarterlyGoals.botsDeployed.target}
                    </span>
                  </div>
                  <Progress value={profile.quarterlyGoals.botsDeployed.progress} className="h-3" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Cost Savings Target</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(profile.quarterlyGoals.costSavings.actual)} / {formatCurrency(profile.quarterlyGoals.costSavings.target)}
                    </span>
                  </div>
                  <Progress value={profile.quarterlyGoals.costSavings.progress} className="h-3" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Team Growth</span>
                    <span className="text-muted-foreground">
                      {profile.quarterlyGoals.teamGrowth.actual} / {profile.quarterlyGoals.teamGrowth.target} members
                    </span>
                  </div>
                  <Progress value={profile.quarterlyGoals.teamGrowth.progress} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Performance Tab ── */}
          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Approval Metrics</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Approvals This Month</span>
                    <span className="font-bold">{profile.statistics.approvalsThisMonth}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Approval Time</span>
                    <span className="font-bold">{profile.statistics.avgApprovalTime} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Decision Accuracy</span>
                    <span className="font-bold text-green-600">{profile.statistics.approvalAccuracy}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Team Performance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Team Utilization</span>
                    <span className="font-bold">{profile.statistics.teamUtilization}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bot Success Rate</span>
                    <span className="font-bold text-green-600">{profile.statistics.botSuccessRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Deployment Time</span>
                    <span className="font-bold">{profile.quarterlyGoals.avgDeploymentTime.actual} days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
} 