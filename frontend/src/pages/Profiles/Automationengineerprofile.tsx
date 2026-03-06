import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Mail, Phone, Building, Calendar, MapPin, Code, TrendingUp, 
  Clock, CheckCircle, Activity, Edit, Camera, Award, Zap, 
  BarChart3, Shield, Package, FileText, GitBranch, Target,
  Bug, Layers, Cpu, Star, BookOpen, Bell, ExternalLink
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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

// Automation Engineer / RPA Developer Profile
export function AutomationEngineerProfile() {
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
        activeTab: "processes",
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

  const [profile] = useState({
    userId: 3,
    firstName: "Sapna",
    lastName: "Bharti",
    email: "sapna.bharti@company.com",
    phone: "+91 98765 43210",
    roleName: "Automation Engineer",
    roleId: 3,
    department: "Digital Transformation",
    jobTitle: "Senior RPA Developer",
    location: "Surat, Gujarat, India",
    joinDate: "2022-03-15",
    bio: "Passionate automation engineer with 4+ years of experience in designing and implementing enterprise-level RPA solutions. Specialized in UiPath, process optimization, and delivering high-ROI automation projects.",
    
    // Developer specific statistics
    statistics: {
      botsDeployed: 18,
      inDevelopment: 3,
      totalROI: 2450000,
      codeQualityScore: 94,
      avgDeploymentTime: 28, // days
      defectRate: 2.3, // percentage
      componentReusability: 87, // percentage
      linesOfCode: 45600,
    },
    
    // Current assignments
    activeProjects: [
      {
        id: "P063",
        title: "Budget Variance Analysis Automation",
        stage: "Development",
        progress: 65,
        assignedDate: "2026-02-10",
        targetDate: "2026-03-05",
        estimatedROI: 420000,
        complexity: "Medium"
      },
      {
        id: "P062",
        title: "Vendor Payment Reconciliation",
        stage: "Development",
        progress: 40,
        assignedDate: "2026-02-01",
        targetDate: "2026-03-15",
        estimatedROI: 280000,
        complexity: "High"
      },
      {
        id: "P058",
        title: "Customer Onboarding Automation",
        stage: "QA",
        progress: 90,
        assignedDate: "2026-01-15",
        targetDate: "2026-02-20",
        estimatedROI: 650000,
        complexity: "Medium"
      }
    ],
    
    // Deployed bots
    deployedBots: [
      {
        id: "P054",
        title: "Invoice Processing Automation",
        deployedDate: "2026-02-15",
        status: "Healthy",
        executionsToday: 247,
        successRate: 98.8,
        actualROI: 450000
      },
      {
        id: "P051",
        title: "Employee Onboarding Bot",
        deployedDate: "2026-01-20",
        status: "Healthy",
        executionsToday: 12,
        successRate: 100,
        actualROI: 320000
      },
      {
        id: "P048",
        title: "Timesheet Automation",
        deployedDate: "2025-12-10",
        status: "Warning",
        executionsToday: 156,
        successRate: 94.2,
        actualROI: 280000
      }
    ],
    
    // Technical skills
    skills: [
      { name: "UiPath Development", level: 95 },
      { name: "Process Analysis", level: 90 },
      { name: "Python", level: 85 },
      { name: "SQL & Database", level: 80 },
      { name: "API Integration", level: 88 },
      { name: "Error Handling", level: 92 },
      { name: "Orchestrator", level: 87 },
      { name: "ReFramework", level: 90 }
    ],
    
    // Certifications
    certifications: [
      {
        name: "UiPath Certified Professional Developer",
        issuer: "UiPath",
        date: "2023-06-15",
        credentialId: "UC-PROF-2023-12345",
        verified: true
      },
      {
        name: "UiPath Certified Advanced RPA Developer",
        issuer: "UiPath",
        date: "2023-09-20",
        credentialId: "UC-ADV-2023-67890",
        verified: true
      },
      {
        name: "Microsoft Azure Fundamentals",
        issuer: "Microsoft",
        date: "2023-04-10",
        credentialId: "AZ-900-2023-45678",
        verified: true
      }
    ],
    
    // Reusable components
    components: [
      { name: "Email Handler Library", downloads: 24, rating: 4.8 },
      { name: "Excel Utilities Package", downloads: 31, rating: 4.9 },
      { name: "SAP Connector Framework", downloads: 18, rating: 4.7 },
      { name: "Error Logging Module", downloads: 42, rating: 5.0 }
    ],
    
    recentActivity: [
      {
        type: "deployment",
        description: "Successfully deployed Invoice Processing Bot to production",
        timestamp: "2026-02-15T16:45:00Z",
        processId: 54
      },
      {
        type: "code_review",
        description: "Code review completed for Purchase Order Automation",
        timestamp: "2026-02-14T11:30:00Z",
        processId: 55
      },
      {
        type: "bug_fix",
        description: "Fixed critical bug in Timesheet Automation - improved error handling",
        timestamp: "2026-02-13T14:20:00Z",
        processId: 48
      },
      {
        type: "component",
        description: "Published new version of Email Handler Library v2.1",
        timestamp: "2026-02-12T10:15:00Z"
      }
    ]
  })

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount.toLocaleString()}`
  }

  const getStatusColor = (status: string) => {
    if (status === "Healthy") return "bg-green-500/20 text-green-600 border-green-500/30"
    if (status === "Warning") return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
    if (status === "Error") return "bg-red-500/20 text-red-600 border-red-500/30"
    return "bg-muted text-muted-foreground"
  }

  const getComplexityColor = (complexity: string) => {
    if (complexity === "Low") return "bg-green-500/20 text-green-600"
    if (complexity === "Medium") return "bg-yellow-500/20 text-yellow-600"
    if (complexity === "High") return "bg-red-500/20 text-red-600"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="w-full space-y-6">
        
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 via-card to-card border-2 border-blue-200 dark:border-blue-800 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-blue-500/30 shadow-lg">
                    <AvatarFallback className="text-3xl font-bold bg-blue-500/10">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-sm px-3 py-1 font-semibold">
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

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 dark:from-green-950/20 to-card border-2 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bots Deployed</p>
                  <p className="text-3xl font-bold text-green-600">{profile.statistics.botsDeployed}</p>
                </div>
                <Zap className="w-10 h-10 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-card border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Development</p>
                  <p className="text-3xl font-bold text-blue-600">{profile.statistics.inDevelopment}</p>
                </div>
                <Code className="w-10 h-10 text-blue-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-card border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total ROI</p>
                  <p className="text-3xl font-bold text-purple-600">{formatCurrency(profile.statistics.totalROI)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 dark:from-orange-950/20 to-card border-2 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Code Quality</p>
                  <p className="text-3xl font-bold text-orange-600">{profile.statistics.codeQualityScore}%</p>
                </div>
                <Shield className="w-10 h-10 text-orange-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card border border-border">
            <TabsTrigger value="active">Active Projects</TabsTrigger>
            <TabsTrigger value="deployed">Deployed Bots</TabsTrigger>
            <TabsTrigger value="skills">Skills & Certs</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Active Projects Tab */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Active Development Projects ({profile.statistics.inDevelopment})
                </CardTitle>
                <CardDescription>Automations currently in development or QA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.activeProjects.map((project) => (
                  <div key={project.id} className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/30 dark:bg-blue-950/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{project.id}</Badge>
                          <Badge className="bg-blue-500/20 text-blue-600">{project.stage}</Badge>
                          <Badge className={getComplexityColor(project.complexity)}>{project.complexity}</Badge>
                        </div>
                        <h4 className="font-semibold">{project.title}</h4>
                      </div>
                      <Button size="sm" variant="outline">View Code</Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Assigned</p>
                          <p className="font-medium">{new Date(project.assignedDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target</p>
                          <p className="font-medium">{new Date(project.targetDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Est. ROI</p>
                          <p className="font-medium text-green-600">{formatCurrency(project.estimatedROI)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployed Bots Tab */}
          <TabsContent value="deployed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-success" />
                  Production Bots ({profile.statistics.botsDeployed} Active)
                </CardTitle>
                <CardDescription>Bots running in production with real-time monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.deployedBots.map((bot) => (
                  <div key={bot.id} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{bot.id}</Badge>
                          <Badge className={getStatusColor(bot.status)}>{bot.status}</Badge>
                        </div>
                        <h4 className="font-semibold">{bot.title}</h4>
                      </div>
                      <Button size="sm" variant="outline">
                        <Activity className="w-4 h-4 mr-1" />
                        Monitor
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Deployed</p>
                        <p className="font-medium">{new Date(bot.deployedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Runs Today</p>
                        <p className="font-medium text-blue-600">{bot.executionsToday}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-medium text-green-600">{bot.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actual ROI</p>
                        <p className="font-medium text-purple-600">{formatCurrency(bot.actualROI)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills & Certifications Tab */}
          <TabsContent value="skills" className="space-y-6">
            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Technical Skills
                </CardTitle>
                <CardDescription>Proficiency levels based on experience and assessments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.skills.map((skill, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Professional Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.certifications.map((cert, idx) => (
                  <div key={idx} className="p-4 border border-border rounded-lg hover:border-primary/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{cert.name}</h4>
                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{new Date(cert.date).toLocaleDateString()}</Badge>
                        {cert.verified && (
                          <Badge className="bg-green-500/20 text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">ID: {cert.credentialId}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reusable Components Tab */}
          <TabsContent value="components">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Reusable Components Library
                </CardTitle>
                <CardDescription>Frameworks and utilities built for team reuse</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.components.map((component, idx) => (
                  <div key={idx} className="p-4 border border-border rounded-lg hover:border-primary/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Cpu className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">{component.name}</h4>
                      </div>
                      <Button size="sm" variant="outline">
                        <GitBranch className="w-4 h-4 mr-1" />
                        View Code
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{component.downloads} downloads</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{component.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Development Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Deployment Time</span>
                    <span className="font-bold">{profile.statistics.avgDeploymentTime} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Code Quality Score</span>
                    <span className="font-bold text-green-600">{profile.statistics.codeQualityScore}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Component Reusability</span>
                    <span className="font-bold">{profile.statistics.componentReusability}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lines of Code</span>
                    <span className="font-bold">{profile.statistics.linesOfCode.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="w-5 h-5 text-primary" />
                    Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Production Defect Rate</span>
                    <span className="font-bold text-green-600">{profile.statistics.defectRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bots in Production</span>
                    <span className="font-bold">{profile.statistics.botsDeployed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total ROI Delivered</span>
                    <span className="font-bold text-purple-600">{formatCurrency(profile.statistics.totalROI)}</span>
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