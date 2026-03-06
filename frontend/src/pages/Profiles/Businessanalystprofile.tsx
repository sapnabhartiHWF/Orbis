import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Mail, Phone, Building, Calendar, MapPin, FileText, TrendingUp, 
  Clock, CheckCircle, Activity, Edit, Camera, Award, Users, 
  BarChart3, Package, ClipboardList, MessageSquare, Target,
  BookOpen, Presentation, GitBranch, Star, Bell, ExternalLink
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

// Business Analyst Profile
export function BusinessAnalystProfile() {
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

  const [profile] = useState({
    userId: 9,
    firstName: "Priya",
    lastName: "Patel",
    email: "priya.patel@company.com",
    phone: "+91 98765 33344",
    roleName: "Business Analyst",
    roleId: 9,
    department: "Digital Transformation",
    jobTitle: "Senior Business Analyst",
    location: "Ahmedabad, Gujarat, India",
    joinDate: "2021-06-10",
    bio: "Business analyst with 6+ years of experience in process analysis, requirements gathering, and automation feasibility assessment. Expert in creating comprehensive PDDs and facilitating stakeholder workshops.",
    
    // BA specific statistics
    statistics: {
      processesAnalyzed: 35,
      pddsCreated: 28,
      stakeholderInterviews: 142,
      workshopsConducted: 24,
      requirementsAccuracy: 94.5, // percentage
      avgAnalysisTime: 5.2, // days
      pddApprovalRate: 96.4, // percentage
      stakeholderSatisfaction: 4.7, // out of 5
    },
    
    // Active analysis projects
    activeAnalysis: [
      {
        id: "P064",
        title: "Inventory Management Automation",
        stage: "Requirements Gathering",
        progress: 45,
        stakeholder: "Operations Team",
        startedDate: "2026-02-15",
        targetDate: "2026-02-28",
        interviewsCompleted: 5,
        interviewsPlanned: 8,
        complexity: "High"
      },
      {
        id: "P065",
        title: "Travel Expense Reimbursement",
        stage: "Process Mapping",
        progress: 70,
        stakeholder: "Finance Department",
        startedDate: "2026-02-10",
        targetDate: "2026-02-25",
        interviewsCompleted: 6,
        interviewsPlanned: 6,
        complexity: "Medium"
      },
      {
        id: "P066",
        title: "Supplier Master Data Update",
        stage: "PDD Creation",
        progress: 85,
        stakeholder: "Procurement Team",
        startedDate: "2026-02-05",
        targetDate: "2026-02-22",
        interviewsCompleted: 4,
        interviewsPlanned: 4,
        complexity: "Low"
      }
    ],
    
    // Completed PDDs
    completedPDDs: [
      {
        id: "P063",
        title: "Budget Variance Analysis Automation",
        completedDate: "2026-02-12",
        pages: 24,
        processSteps: 18,
        businessRules: 12,
        approvalStatus: "Approved",
        stakeholder: "Finance Team"
      },
      {
        id: "P058",
        title: "Customer Onboarding Automation",
        completedDate: "2026-02-01",
        pages: 32,
        processSteps: 24,
        businessRules: 18,
        approvalStatus: "Approved",
        stakeholder: "Sales Team"
      },
      {
        id: "P054",
        title: "Invoice Processing Automation",
        completedDate: "2026-01-20",
        pages: 28,
        processSteps: 22,
        businessRules: 15,
        approvalStatus: "Approved",
        stakeholder: "Accounts Payable"
      }
    ],
    
    // Upcoming stakeholder meetings
    upcomingMeetings: [
      {
        title: "Inventory Process Workshop",
        stakeholders: ["Operations Manager", "Warehouse Team", "IT Support"],
        date: "2026-02-21T10:00:00Z",
        duration: 120, // minutes
        type: "Workshop"
      },
      {
        title: "Travel Expense Review Meeting",
        stakeholders: ["Finance Manager", "HR Team"],
        date: "2026-02-22T14:00:00Z",
        duration: 60,
        type: "Review"
      },
      {
        title: "PDD Walkthrough - Supplier Data",
        stakeholders: ["Procurement Head", "RPA Lead"],
        date: "2026-02-23T11:00:00Z",
        duration: 90,
        type: "Presentation"
      }
    ],
    
    // Skills
    skills: [
      { name: "Process Analysis", level: 95 },
      { name: "Requirements Gathering", level: 93 },
      { name: "Stakeholder Management", level: 90 },
      { name: "Business Process Modeling", level: 92 },
      { name: "PDD Documentation", level: 94 },
      { name: "Workshop Facilitation", level: 88 },
      { name: "Change Management", level: 85 },
      { name: "Data Analysis", level: 82 }
    ],
    
    // Certifications
    certifications: [
      {
        name: "Certified Business Analysis Professional (CBAP)",
        issuer: "IIBA",
        date: "2022-09-15",
        credentialId: "CBAP-2022-12345"
      },
      {
        name: "Six Sigma Green Belt",
        issuer: "ASQ",
        date: "2021-11-20",
        credentialId: "SSGB-2021-67890"
      },
      {
        name: "Certified ScrumMaster (CSM)",
        issuer: "Scrum Alliance",
        date: "2022-03-10",
        credentialId: "CSM-2022-45678"
      }
    ],
    
    recentActivity: [
      {
        type: "pdd_submission",
        description: "Submitted PDD for Budget Variance Analysis (24 pages, 18 steps)",
        timestamp: "2026-02-12T16:30:00Z",
        processId: 63
      },
      {
        type: "workshop",
        description: "Conducted process mapping workshop with Operations team (8 participants)",
        timestamp: "2026-02-10T10:00:00Z",
        processId: 64
      },
      {
        type: "interview",
        description: "Completed stakeholder interview with Finance Manager",
        timestamp: "2026-02-08T14:00:00Z",
        processId: 65
      }
    ]
  })

  const getComplexityColor = (complexity: string) => {
    if (complexity === "Low") return "bg-green-500/20 text-green-600"
    if (complexity === "Medium") return "bg-yellow-500/20 text-yellow-600"
    if (complexity === "High") return "bg-red-500/20 text-red-600"
    return "bg-muted text-muted-foreground"
  }

  const getMeetingTypeColor = (type: string) => {
    if (type === "Workshop") return "bg-purple-500/20 text-purple-600"
    if (type === "Review") return "bg-blue-500/20 text-blue-600"
    if (type === "Presentation") return "bg-green-500/20 text-green-600"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="w-full space-y-6">
        
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-cyan-50 dark:from-cyan-950/20 via-card to-card border-2 border-cyan-200 dark:border-cyan-800 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-cyan-500/30 shadow-lg">
                    <AvatarFallback className="text-3xl font-bold bg-cyan-500/10">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 bg-cyan-600 rounded-full shadow-lg hover:bg-cyan-700">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                <Badge className="bg-cyan-500/20 text-cyan-600 border-cyan-500/30 text-sm px-3 py-1 font-semibold">
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
          <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-card border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processes Analyzed</p>
                  <p className="text-3xl font-bold text-blue-600">{profile.statistics.processesAnalyzed}</p>
                </div>
                <ClipboardList className="w-10 h-10 text-blue-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 dark:from-green-950/20 to-card border-2 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">PDDs Created</p>
                  <p className="text-3xl font-bold text-green-600">{profile.statistics.pddsCreated}</p>
                </div>
                <FileText className="w-10 h-10 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-card border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stakeholder Meetings</p>
                  <p className="text-3xl font-bold text-purple-600">{profile.statistics.stakeholderInterviews}</p>
                </div>
                <Users className="w-10 h-10 text-purple-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 dark:from-orange-950/20 to-card border-2 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">PDD Approval Rate</p>
                  <p className="text-3xl font-bold text-orange-600">{profile.statistics.pddApprovalRate}%</p>
                </div>
                <CheckCircle className="w-10 h-10 text-orange-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card border border-border">
            <TabsTrigger value="analysis">Active Analysis</TabsTrigger>
            <TabsTrigger value="pdds">Completed PDDs</TabsTrigger>
            <TabsTrigger value="meetings">Upcoming Meetings</TabsTrigger>
            <TabsTrigger value="skills">Skills & Certs</TabsTrigger>
            <TabsTrigger value="metrics">Performance</TabsTrigger>
          </TabsList>

          {/* Active Analysis Tab */}
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Active Analysis Projects ({profile.activeAnalysis.length})
                </CardTitle>
                <CardDescription>Processes currently being analyzed and documented</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.activeAnalysis.map((analysis) => (
                  <div key={analysis.id} className="p-4 border-2 border-cyan-200 dark:border-cyan-800 rounded-lg bg-cyan-50/30 dark:bg-cyan-950/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{analysis.id}</Badge>
                          <Badge className="bg-cyan-500/20 text-cyan-600">{analysis.stage}</Badge>
                          <Badge className={getComplexityColor(analysis.complexity)}>{analysis.complexity}</Badge>
                        </div>
                        <h4 className="font-semibold mb-1">{analysis.title}</h4>
                        <p className="text-sm text-muted-foreground">Stakeholder: {analysis.stakeholder}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{analysis.progress}%</span>
                        </div>
                        <Progress value={analysis.progress} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Interviews Done</p>
                          <p className="font-bold">{analysis.interviewsCompleted} / {analysis.interviewsPlanned}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Started</p>
                          <p className="font-medium">{new Date(analysis.startedDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target</p>
                          <p className="font-medium">{new Date(analysis.targetDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed PDDs Tab */}
          <TabsContent value="pdds">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-success" />
                  Completed Process Definition Documents ({profile.statistics.pddsCreated})
                </CardTitle>
                <CardDescription>Approved PDDs ready for development</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.completedPDDs.map((pdd) => (
                  <div key={pdd.id} className="p-4 border border-border rounded-lg bg-green-50/30 dark:bg-green-950/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{pdd.id}</Badge>
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                            {pdd.approvalStatus}
                          </Badge>
                        </div>
                        <h4 className="font-semibold mb-1">{pdd.title}</h4>
                        <p className="text-sm text-muted-foreground">Stakeholder: {pdd.stakeholder}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <BookOpen className="w-4 h-4 mr-1" />
                        View PDD
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium">{new Date(pdd.completedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pages</p>
                        <p className="font-medium">{pdd.pages}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Process Steps</p>
                        <p className="font-medium">{pdd.processSteps}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Business Rules</p>
                        <p className="font-medium">{pdd.businessRules}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Meetings Tab */}
          <TabsContent value="meetings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Upcoming Stakeholder Meetings
                </CardTitle>
                <CardDescription>Scheduled interviews, workshops, and reviews</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.upcomingMeetings.map((meeting, idx) => (
                  <div key={idx} className="p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/30 dark:bg-purple-950/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getMeetingTypeColor(meeting.type)}>{meeting.type}</Badge>
                          <Badge variant="outline">{meeting.duration} min</Badge>
                        </div>
                        <h4 className="font-semibold">{meeting.title}</h4>
                      </div>
                      <Button size="sm" variant="outline">
                        <Calendar className="w-4 h-4 mr-1" />
                        Add to Calendar
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(meeting.date).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">
                          {meeting.stakeholders.join(', ')}
                        </span>
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
                  Business Analysis Skills
                </CardTitle>
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
                      <Badge variant="outline">{new Date(cert.date).toLocaleDateString()}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">ID: {cert.credentialId}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Analysis Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processes Analyzed</span>
                    <span className="font-bold">{profile.statistics.processesAnalyzed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Average Analysis Time</span>
                    <span className="font-bold">{profile.statistics.avgAnalysisTime} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Requirements Accuracy</span>
                    <span className="font-bold text-green-600">{profile.statistics.requirementsAccuracy}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Workshops Conducted</span>
                    <span className="font-bold">{profile.statistics.workshopsConducted}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Stakeholder Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stakeholder Interviews</span>
                    <span className="font-bold">{profile.statistics.stakeholderInterviews}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Satisfaction Rating</span>
                    <span className="font-bold text-green-600">{profile.statistics.stakeholderSatisfaction} / 5.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">PDD Approval Rate</span>
                    <span className="font-bold text-green-600">{profile.statistics.pddApprovalRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">PDDs Created</span>
                    <span className="font-bold">{profile.statistics.pddsCreated}</span>
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