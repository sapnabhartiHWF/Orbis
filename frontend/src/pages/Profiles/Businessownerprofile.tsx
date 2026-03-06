import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  User, Mail, Phone, Building, Calendar, MapPin, Target, TrendingUp, 
  Clock, CheckCircle, FileText, Users, Activity, Edit, Save, X, 
  Camera, Loader2, AlertCircle, BarChart3, Briefcase, DollarSign,
  ClipboardList, Package, Award, Bell, ExternalLink
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

// Business Owner Profile Component
export function BusinessOwnerProfile() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

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

  const [profile, setProfile] = useState({
    userId: 15,
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@company.com",
    phone: "+91 98765 12345",
    roleName: "Business Owner",
    roleId: 15,
    department: "Finance",
    jobTitle: "Finance Manager",
    location: "Mumbai, Maharashtra, India",
    joinDate: "2021-05-10",
    bio: "Finance leader focused on process optimization and cost reduction through intelligent automation. Champion of digital transformation initiatives.",
    
    // Business Owner specific stats
    statistics: {
      requestsSubmitted: 12,
      automationsLive: 8,
      inUATReview: 2,
      totalTimeSaved: 1840, // hours per year
      costSavingsRealized: 1850000, // in currency
      departmentROI: 325, // percentage
      avgUATApprovalTime: 2.5, // days
    },
    
    // Active automation requests
    activeRequests: [
      {
        id: "P054",
        title: "Invoice Processing Automation",
        currentStage: "UAT",
        status: "Pending Your Review",
        submittedDate: "2026-01-15",
        estimatedSavings: 450000
      },
      {
        id: "P062",
        title: "Vendor Payment Reconciliation",
        currentStage: "Development",
        status: "In Progress",
        submittedDate: "2026-02-01",
        estimatedSavings: 280000
      }
    ],
    
    // Completed automations (deployed to production)
    completedAutomations: [
      {
        id: "P041",
        title: "Monthly Financial Report Generation",
        deployedDate: "2025-11-20",
        timeSaved: 320, // hours/year
        actualROI: 385000,
        status: "Active"
      },
      {
        id: "P038",
        title: "Expense Claim Processing",
        deployedDate: "2025-10-15",
        timeSaved: 480, // hours/year
        actualROI: 520000,
        status: "Active"
      },
      {
        id: "P033",
        title: "Bank Reconciliation Automation",
        deployedDate: "2025-08-10",
        timeSaved: 640, // hours/year
        actualROI: 680000,
        status: "Active"
      }
    ],
    
    recentActivity: [
      {
        type: "uat_approval",
        description: "Approved UAT for Employee Reimbursement Bot",
        timestamp: "2026-02-18T15:30:00Z",
        processId: 49
      },
      {
        type: "request",
        description: "Submitted automation request for Budget Variance Analysis",
        timestamp: "2026-02-15T10:20:00Z",
        processId: 63
      },
      {
        type: "uat_testing",
        description: "Completed UAT testing for Purchase Order Automation",
        timestamp: "2026-02-12T14:45:00Z",
        processId: 52
      }
    ]
  })

  const [isEditing, setIsEditing] = useState(false)

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount.toLocaleString()}`
  }

  const getStatusColor = (status: string) => {
    if (status.includes("Pending")) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
    if (status === "Active") return "bg-green-500/20 text-green-600 border-green-500/30"
    if (status === "In Progress") return "bg-blue-500/20 text-blue-600 border-blue-500/30"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="w-full space-y-6">
        
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-green-50 dark:from-green-950/20 via-card to-card border-2 border-green-200 dark:border-green-800 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-green-500/30 shadow-lg">
                    <AvatarFallback className="text-3xl font-bold bg-green-500/10">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 bg-green-600 rounded-full shadow-lg hover:bg-green-700 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-sm px-3 py-1 font-semibold">
                  {profile.roleName}
                </Badge>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium">{profile.jobTitle}</p>
                  </div>
                  
                  <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{profile.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{profile.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{profile.department}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{profile.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">Member since {new Date(profile.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-card border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requests Submitted</p>
                  <p className="text-3xl font-bold text-blue-600">{profile.statistics.requestsSubmitted}</p>
                </div>
                <ClipboardList className="w-10 h-10 text-blue-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 dark:from-green-950/20 to-card border-2 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Automations Live</p>
                  <p className="text-3xl font-bold text-green-600">{profile.statistics.automationsLive}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-card border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time Saved/Year</p>
                  <p className="text-3xl font-bold text-purple-600">{profile.statistics.totalTimeSaved}h</p>
                </div>
                <Clock className="w-10 h-10 text-purple-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 dark:from-orange-950/20 to-card border-2 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cost Savings</p>
                  <p className="text-3xl font-bold text-orange-600">{formatCurrency(profile.statistics.costSavingsRealized)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-orange-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
            <TabsTrigger value="active">Active Requests</TabsTrigger>
            <TabsTrigger value="completed">Completed Automations</TabsTrigger>
            <TabsTrigger value="impact">Business Impact</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          {/* Active Requests Tab */}
          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Active Automation Requests
                </CardTitle>
                <CardDescription>Requests currently in the automation pipeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.activeRequests.map((request) => (
                  <div key={request.id} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{request.id}</Badge>
                          <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                        </div>
                        <h4 className="font-semibold text-foreground">{request.title}</h4>
                      </div>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Stage</p>
                        <p className="font-medium">{request.currentStage}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">{new Date(request.submittedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expected Savings</p>
                        <p className="font-medium text-green-600">{formatCurrency(request.estimatedSavings)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Automations Tab */}
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Completed Automations ({profile.statistics.automationsLive} Active)
                </CardTitle>
                <CardDescription>Bots deployed to production and delivering value</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.completedAutomations.map((automation) => (
                  <div key={automation.id} className="p-4 border border-border rounded-lg bg-green-50/30 dark:bg-green-950/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{automation.id}</Badge>
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                            {automation.status}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-foreground">{automation.title}</h4>
                      </div>
                      <Button variant="outline" size="sm">Monitor</Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Deployed</p>
                        <p className="font-medium">{new Date(automation.deployedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time Saved/Year</p>
                        <p className="font-medium text-purple-600">{automation.timeSaved}h</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actual ROI</p>
                        <p className="font-medium text-green-600">{formatCurrency(automation.actualROI)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Impact Tab */}
          <TabsContent value="impact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Department Efficiency Gains
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Time Saved</span>
                      <span className="font-bold">{profile.statistics.totalTimeSaved} hours/year</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">FTE Equivalent</span>
                      <span className="font-bold">{(profile.statistics.totalTimeSaved / 2080).toFixed(1)} FTEs</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Productivity Increase</span>
                      <span className="font-bold text-green-600">+{((profile.statistics.totalTimeSaved / 2080) * 100 / 10).toFixed(0)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                    Financial Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Cost Savings</span>
                      <span className="font-bold text-green-600">{formatCurrency(profile.statistics.costSavingsRealized)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Department ROI</span>
                      <span className="font-bold text-green-600">{profile.statistics.departmentROI}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avg per Automation</span>
                      <span className="font-bold">{formatCurrency(profile.statistics.costSavingsRealized / profile.statistics.automationsLive)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
                      <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}