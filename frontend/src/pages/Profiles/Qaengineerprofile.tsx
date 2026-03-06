import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Mail, Phone, Building, Calendar, MapPin, Shield, TrendingUp, 
  Clock, CheckCircle, Activity, Edit, Camera, Award, Bug, 
  BarChart3, XCircle, Package, FileText, AlertCircle, Target,
  Zap, ClipboardCheck, TestTube, PlayCircle, Bell, ExternalLink
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

// QA Engineer / Test Automation Specialist Profile
export function QAEngineerProfile() {
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
    userId: 8,
    firstName: "Neha",
    lastName: "Singh",
    email: "neha.singh@company.com",
    phone: "+91 98765 11122",
    roleName: "QA Engineer",
    roleId: 8,
    department: "Digital Transformation",
    jobTitle: "Senior QA Automation Engineer",
    location: "Pune, Maharashtra, India",
    joinDate: "2021-08-20",
    bio: "Quality assurance specialist with 5+ years of experience in RPA testing and automation validation. Expert in test automation, defect management, and ensuring production-ready bot quality.",
    
    // QA specific statistics
    statistics: {
      botsTestedThisMonth: 8,
      totalBotsValidated: 42,
      testCasesExecuted: 1247,
      defectsIdentified: 156,
      criticalBugsFound: 23,
      testCoverage: 96, // percentage
      passRate: 94.2, // percentage
      avgTestTime: 3.5, // days per bot
    },
    
    // Current testing queue
    activeTesting: [
      {
        id: "P063",
        title: "Budget Variance Analysis Automation",
        developer: "Sapna Bharti",
        assignedDate: "2026-02-18",
        targetDate: "2026-02-22",
        progress: 60,
        testCases: 45,
        executed: 27,
        passed: 25,
        failed: 2,
        blocked: 0
      },
      {
        id: "P058",
        title: "Customer Onboarding Automation",
        developer: "Priya Patel",
        assignedDate: "2026-02-15",
        targetDate: "2026-02-20",
        progress: 85,
        testCases: 62,
        executed: 53,
        passed: 50,
        failed: 2,
        blocked: 1
      },
      {
        id: "P059",
        title: "Contract Review Automation",
        developer: "Rahul Sharma",
        assignedDate: "2026-02-17",
        targetDate: "2026-02-24",
        progress: 30,
        testCases: 38,
        executed: 12,
        passed: 11,
        failed: 1,
        blocked: 0
      }
    ],
    
    // Active defects
    activeDefects: [
      {
        id: "DEF-542",
        processId: "P058",
        title: "Null reference error in customer validation step",
        severity: "High",
        status: "Open",
        reportedDate: "2026-02-19T10:30:00Z",
        assignedTo: "Priya Patel"
      },
      {
        id: "DEF-541",
        processId: "P063",
        title: "Excel formatting issue in variance report",
        severity: "Medium",
        status: "In Progress",
        reportedDate: "2026-02-18T14:20:00Z",
        assignedTo: "Sapna Bharti"
      },
      {
        id: "DEF-540",
        processId: "P058",
        title: "Email notification not triggering on timeout",
        severity: "Low",
        status: "Open",
        reportedDate: "2026-02-17T16:15:00Z",
        assignedTo: "Priya Patel"
      }
    ],
    
    // Completed validations
    completedValidations: [
      {
        id: "P054",
        title: "Invoice Processing Automation",
        completedDate: "2026-02-14",
        testCases: 58,
        passRate: 100,
        defectsFound: 3,
        status: "Approved for Production"
      },
      {
        id: "P051",
        title: "Employee Onboarding Bot",
        completedDate: "2026-02-10",
        testCases: 44,
        passRate: 97.7,
        defectsFound: 2,
        status: "Approved for Production"
      },
      {
        id: "P048",
        title: "Timesheet Automation",
        completedDate: "2026-02-05",
        testCases: 51,
        passRate: 94.1,
        defectsFound: 5,
        status: "Approved for Production"
      }
    ],
    
    // Skills
    skills: [
      { name: "Manual Testing", level: 95 },
      { name: "Test Automation", level: 88 },
      { name: "RPA Platform Testing", level: 92 },
      { name: "Defect Management", level: 90 },
      { name: "Test Case Design", level: 93 },
      { name: "SQL & Data Validation", level: 85 },
      { name: "API Testing", level: 82 },
      { name: "Performance Testing", level: 78 }
    ],
    
    // Certifications
    certifications: [
      {
        name: "ISTQB Certified Tester - Foundation Level",
        issuer: "ISTQB",
        date: "2022-03-15",
        credentialId: "ISTQB-FL-2022-34567"
      },
      {
        name: "UiPath Test Suite Certification",
        issuer: "UiPath",
        date: "2023-06-20",
        credentialId: "UC-TEST-2023-78901"
      },
      {
        name: "Certified Agile Tester",
        issuer: "IIST",
        date: "2022-11-10",
        credentialId: "CAT-2022-45678"
      }
    ],
    
    recentActivity: [
      {
        type: "defect",
        description: "Identified critical null reference bug in Customer Onboarding",
        timestamp: "2026-02-19T10:30:00Z",
        severity: "High",
        processId: 58
      },
      {
        type: "approval",
        description: "Approved Invoice Processing Bot for production deployment",
        timestamp: "2026-02-14T16:45:00Z",
        processId: 54
      },
      {
        type: "test_complete",
        description: "Completed QA testing for Employee Onboarding (97.7% pass rate)",
        timestamp: "2026-02-10T11:20:00Z",
        processId: 51
      }
    ]
  })

  const getSeverityColor = (severity: string) => {
    if (severity === "Critical") return "bg-red-500/20 text-red-600 border-red-500/30"
    if (severity === "High") return "bg-orange-500/20 text-orange-600 border-orange-500/30"
    if (severity === "Medium") return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
    if (severity === "Low") return "bg-blue-500/20 text-blue-600 border-blue-500/30"
    return "bg-muted text-muted-foreground"
  }

  const getDefectStatusColor = (status: string) => {
    if (status === "Open") return "bg-red-500/20 text-red-600"
    if (status === "In Progress") return "bg-yellow-500/20 text-yellow-600"
    if (status === "Fixed") return "bg-green-500/20 text-green-600"
    if (status === "Closed") return "bg-gray-500/20 text-gray-600"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="w-full space-y-6">
        
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-orange-50 dark:from-orange-950/20 via-card to-card border-2 border-orange-200 dark:border-orange-800 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-orange-500/30 shadow-lg">
                    <AvatarFallback className="text-3xl font-bold bg-orange-500/10">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 bg-orange-600 rounded-full shadow-lg hover:bg-orange-700">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 text-sm px-3 py-1 font-semibold">
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
                  <p className="text-sm font-medium text-muted-foreground">Bots Tested (Month)</p>
                  <p className="text-3xl font-bold text-blue-600">{profile.statistics.botsTestedThisMonth}</p>
                </div>
                <TestTube className="w-10 h-10 text-blue-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 dark:from-green-950/20 to-card border-2 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                  <p className="text-3xl font-bold text-green-600">{profile.statistics.passRate}%</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 dark:from-red-950/20 to-card border-2 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Defects Found</p>
                  <p className="text-3xl font-bold text-red-600">{profile.statistics.defectsIdentified}</p>
                </div>
                <Bug className="w-10 h-10 text-red-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-card border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Test Coverage</p>
                  <p className="text-3xl font-bold text-purple-600">{profile.statistics.testCoverage}%</p>
                </div>
                <Shield className="w-10 h-10 text-purple-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="testing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card border border-border">
            <TabsTrigger value="testing">Active Testing</TabsTrigger>
            <TabsTrigger value="defects">Defect Log</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="skills">Skills & Certs</TabsTrigger>
            <TabsTrigger value="metrics">Quality Metrics</TabsTrigger>
          </TabsList>

          {/* Active Testing Tab */}
          <TabsContent value="testing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-primary" />
                  Active Testing Queue ({profile.activeTesting.length})
                </CardTitle>
                <CardDescription>Bots currently in QA testing phase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.activeTesting.map((test) => (
                  <div key={test.id} className="p-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/30 dark:bg-orange-950/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{test.id}</Badge>
                          <Badge className="bg-orange-500/20 text-orange-600">Testing</Badge>
                        </div>
                        <h4 className="font-semibold mb-1">{test.title}</h4>
                        <p className="text-sm text-muted-foreground">Developer: {test.developer}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <PlayCircle className="w-4 h-4 mr-1" />
                        Run Tests
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{test.progress}%</span>
                        </div>
                        <Progress value={test.progress} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Cases</p>
                          <p className="font-bold">{test.testCases}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Executed</p>
                          <p className="font-bold text-blue-600">{test.executed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Passed</p>
                          <p className="font-bold text-green-600">{test.passed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Failed</p>
                          <p className="font-bold text-red-600">{test.failed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Blocked</p>
                          <p className="font-bold text-yellow-600">{test.blocked}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                        <span>Assigned: {new Date(test.assignedDate).toLocaleDateString()}</span>
                        <span>Target: {new Date(test.targetDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Defect Log Tab */}
          <TabsContent value="defects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-red-600" />
                  Active Defects ({profile.activeDefects.length})
                </CardTitle>
                <CardDescription>Defects identified and being tracked</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.activeDefects.map((defect) => (
                  <div key={defect.id} className="p-4 border border-border rounded-lg hover:border-red-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{defect.id}</Badge>
                          <Badge variant="outline">{defect.processId}</Badge>
                          <Badge className={getSeverityColor(defect.severity)}>{defect.severity}</Badge>
                          <Badge className={getDefectStatusColor(defect.status)}>{defect.status}</Badge>
                        </div>
                        <h4 className="font-semibold">{defect.title}</h4>
                      </div>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Assigned to: {defect.assignedTo}</span>
                      <span className="text-muted-foreground">
                        Reported: {new Date(defect.reportedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Validations Tab */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Completed Validations ({profile.statistics.totalBotsValidated} Total)
                </CardTitle>
                <CardDescription>Bots approved for production deployment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.completedValidations.map((validation) => (
                  <div key={validation.id} className="p-4 border border-border rounded-lg bg-green-50/30 dark:bg-green-950/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{validation.id}</Badge>
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                            {validation.status}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{validation.title}</h4>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium">{new Date(validation.completedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Test Cases</p>
                        <p className="font-medium">{validation.testCases}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pass Rate</p>
                        <p className="font-medium text-green-600">{validation.passRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Defects Found</p>
                        <p className="font-medium text-red-600">{validation.defectsFound}</p>
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
                  <Target className="w-5 h-5 text-primary" />
                  Testing Skills
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

          {/* Quality Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Testing Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Bots Validated</span>
                    <span className="font-bold">{profile.statistics.totalBotsValidated}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Test Cases Executed</span>
                    <span className="font-bold">{profile.statistics.testCasesExecuted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Average Test Time</span>
                    <span className="font-bold">{profile.statistics.avgTestTime} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Test Coverage</span>
                    <span className="font-bold text-green-600">{profile.statistics.testCoverage}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    Defect Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Defects Identified</span>
                    <span className="font-bold">{profile.statistics.defectsIdentified}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Critical Bugs Found</span>
                    <span className="font-bold text-red-600">{profile.statistics.criticalBugsFound}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Pass Rate</span>
                    <span className="font-bold text-green-600">{profile.statistics.passRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Defects per Bot (Avg)</span>
                    <span className="font-bold">{(profile.statistics.defectsIdentified / profile.statistics.totalBotsValidated).toFixed(1)}</span>
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