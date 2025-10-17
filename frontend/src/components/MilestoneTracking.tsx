import { useState } from "react"
import { Calendar, Target, Clock, CheckCircle, AlertCircle, Flag, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Milestone {
  id: string
  title: string
  description: string
  type: "Project" | "Phase" | "Delivery" | "Review" | "Launch"
  status: "Upcoming" | "In Progress" | "At Risk" | "Completed" | "Overdue"
  priority: "Low" | "Medium" | "High" | "Critical"
  dueDate: string
  completedDate?: string
  project: string
  owner: { name: string; avatar?: string }
  dependencies: string[]
  deliverables: {
    name: string
    status: "Not Started" | "In Progress" | "Completed"
    dueDate: string
  }[]
  progress: number
  impactLevel: "Low" | "Medium" | "High" | "Critical"
  stakeholders: string[]
  notes?: string
}

const milestoneData: Milestone[] = [
  {
    id: "mile-1",
    title: "Invoice Processing MVP Deployment",
    description: "Deploy minimum viable product for automated invoice processing to production environment",
    type: "Launch",
    status: "In Progress",
    priority: "High",
    dueDate: "2024-03-15",
    project: "Invoice Processing Automation",
    owner: { name: "Sarah Chen", avatar: "/api/placeholder/32/32" },
    dependencies: ["Security Review", "User Acceptance Testing"],
    deliverables: [
      { name: "Production Deployment", status: "In Progress", dueDate: "2024-03-10" },
      { name: "User Training Materials", status: "Completed", dueDate: "2024-03-05" },
      { name: "Go-Live Support Plan", status: "In Progress", dueDate: "2024-03-12" },
      { name: "Rollback Procedures", status: "Completed", dueDate: "2024-03-08" }
    ],
    progress: 75,
    impactLevel: "High",
    stakeholders: ["Finance Team", "IT Operations", "Executive Sponsor"],
    notes: "Final testing phase in progress. Production deployment scheduled for next week."
  },
  {
    id: "mile-2",
    title: "Employee Onboarding System Requirements Sign-off",
    description: "Complete stakeholder review and formal approval of system requirements",
    type: "Review",
    status: "At Risk",
    priority: "Medium",
    dueDate: "2024-02-20",
    project: "Employee Onboarding Automation",
    owner: { name: "Michael Rodriguez", avatar: "/api/placeholder/32/32" },
    dependencies: ["Stakeholder Interviews", "Process Documentation"],
    deliverables: [
      { name: "Requirements Document", status: "Completed", dueDate: "2024-02-15" },
      { name: "Stakeholder Review Sessions", status: "In Progress", dueDate: "2024-02-18" },
      { name: "Sign-off Documentation", status: "Not Started", dueDate: "2024-02-20" }
    ],
    progress: 60,
    impactLevel: "Medium",
    stakeholders: ["HR Leadership", "IT Architecture", "Legal Compliance"],
    notes: "Delayed due to scheduling conflicts with key stakeholders. Rescheduling review sessions."
  },
  {
    id: "mile-3",
    title: "Customer Service Chatbot Beta Launch", 
    description: "Launch beta version of AI-powered customer service chatbot for limited user group",
    type: "Delivery",
    status: "Upcoming",
    priority: "High",
    dueDate: "2024-04-01",
    project: "Customer Service Automation",
    owner: { name: "Dr. James Wilson", avatar: "/api/placeholder/32/32" },
    dependencies: ["NLP Model Training", "Integration Testing"],
    deliverables: [
      { name: "Beta Environment Setup", status: "Not Started", dueDate: "2024-03-20" },
      { name: "User Selection & Communication", status: "Not Started", dueDate: "2024-03-25" },
      { name: "Monitoring Dashboard", status: "In Progress", dueDate: "2024-03-28" },
      { name: "Beta Launch Plan", status: "Not Started", dueDate: "2024-03-30" }
    ],
    progress: 25,
    impactLevel: "Critical",
    stakeholders: ["Customer Service Team", "Product Management", "QA Team"],
    notes: "Preparation phase. AI model training showing promising results."
  },
  {
    id: "mile-4",
    title: "IT Ticket Automation Phase 1 Complete",
    description: "Complete first phase of intelligent IT ticket routing and assignment system",
    type: "Phase",
    status: "Completed",
    priority: "Medium",
    dueDate: "2024-01-31",
    completedDate: "2024-01-28",
    project: "IT Support Automation",
    owner: { name: "Lisa Wang", avatar: "/api/placeholder/32/32" },
    dependencies: [],
    deliverables: [
      { name: "NLP Classification Model", status: "Completed", dueDate: "2024-01-20" },
      { name: "Routing Engine", status: "Completed", dueDate: "2024-01-25" },
      { name: "Integration with Ticketing System", status: "Completed", dueDate: "2024-01-30" },
      { name: "Performance Testing", status: "Completed", dueDate: "2024-01-28" }
    ],
    progress: 100,
    impactLevel: "Medium",
    stakeholders: ["IT Support Team", "System Administrators"],
    notes: "Successfully delivered 3 days ahead of schedule. Exceeded performance targets by 15%."
  },
  {
    id: "mile-5",
    title: "Data Reconciliation System Go-Live",
    description: "Production deployment of automated customer data reconciliation across all systems",
    type: "Launch",
    status: "Overdue",
    priority: "Critical",
    dueDate: "2024-02-05",
    project: "Customer Data Reconciliation",
    owner: { name: "Emma Thompson", avatar: "/api/placeholder/32/32" },
    dependencies: ["Data Migration", "System Integration Testing"],
    deliverables: [
      { name: "Production Deployment", status: "In Progress", dueDate: "2024-02-05" },
      { name: "Data Validation Reports", status: "Completed", dueDate: "2024-02-01" },
      { name: "Monitoring Setup", status: "Completed", dueDate: "2024-02-03" },
      { name: "Team Training", status: "In Progress", dueDate: "2024-02-08" }
    ],
    progress: 85,
    impactLevel: "Critical",
    stakeholders: ["Operations Team", "Data Team", "Customer Support"],
    notes: "Deployment delayed due to data migration complexity. Working on resolution with vendor."
  },
  {
    id: "mile-6",
    title: "Q1 Automation Portfolio Review",
    description: "Quarterly review of all automation initiatives, ROI analysis, and strategic planning",
    type: "Review",
    status: "Upcoming",
    priority: "High",
    dueDate: "2024-03-30",
    project: "Portfolio Management",
    owner: { name: "Michael Thompson", avatar: "/api/placeholder/32/32" },
    dependencies: ["Project Status Reports", "ROI Calculations"],
    deliverables: [
      { name: "Portfolio Dashboard", status: "Not Started", dueDate: "2024-03-20" },
      { name: "ROI Analysis Report", status: "Not Started", dueDate: "2024-03-25" },
      { name: "Strategic Recommendations", status: "Not Started", dueDate: "2024-03-28" },
      { name: "Executive Presentation", status: "Not Started", dueDate: "2024-03-29" }
    ],
    progress: 10,
    impactLevel: "High",
    stakeholders: ["Executive Leadership", "Department Heads", "Project Managers"],
    notes: "Planning phase initiated. Data collection from all projects in progress."
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Upcoming": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "In Progress": return "bg-primary/20 text-primary-foreground border-primary/30"
    case "At Risk": return "bg-warning/20 text-warning-foreground border-warning/30"
    case "Completed": return "bg-success/20 text-success-foreground border-success/30"
    case "Overdue": return "bg-destructive/20 text-destructive-foreground border-destructive/30"
    default: return "bg-muted text-muted-foreground"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Low": return "bg-muted text-muted-foreground"
    case "Medium": return "bg-blue-500/20 text-blue-400"
    case "High": return "bg-warning/20 text-warning-foreground"
    case "Critical": return "bg-destructive/20 text-destructive-foreground"
    default: return "bg-muted text-muted-foreground"
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "Project": return "bg-primary/20 text-primary-foreground"
    case "Phase": return "bg-blue-500/20 text-blue-400"
    case "Delivery": return "bg-success/20 text-success-foreground"
    case "Review": return "bg-warning/20 text-warning-foreground"
    case "Launch": return "bg-gradient-primary text-primary-foreground"
    default: return "bg-muted text-muted-foreground"
  }
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "Low": return "text-muted-foreground"
    case "Medium": return "text-blue-400"
    case "High": return "text-warning"
    case "Critical": return "text-destructive"
    default: return "text-muted-foreground"
  }
}

export function MilestoneTracking() {
  const [selectedProject, setSelectedProject] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [selectedView, setSelectedView] = useState("timeline")

  const filteredMilestones = milestoneData.filter(milestone => {
    const matchesProject = selectedProject === "All" || milestone.project.includes(selectedProject.split(" - ")[0])
    const matchesStatus = selectedStatus === "All" || milestone.status === selectedStatus
    return matchesProject && matchesStatus
  })

  const totalMilestones = filteredMilestones.length
  const completedMilestones = filteredMilestones.filter(m => m.status === "Completed").length
  const atRiskMilestones = filteredMilestones.filter(m => m.status === "At Risk" || m.status === "Overdue").length
  const upcomingMilestones = filteredMilestones.filter(m => m.status === "Upcoming").length

  const getDaysUntilDue = (dueDate: string, completedDate?: string) => {
    if (completedDate) return 0
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Flag className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Milestone Tracking</h2>
            <p className="text-muted-foreground">Key deliverables and deadlines management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Projects</SelectItem>
              <SelectItem value="Invoice - Processing Automation">Invoice Processing</SelectItem>
              <SelectItem value="Employee - Onboarding Automation">Employee Onboarding</SelectItem>
              <SelectItem value="Customer - Service Automation">Customer Service</SelectItem>
              <SelectItem value="IT - Support Automation">IT Support</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="At Risk">At Risk</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Total Milestones</p>
                <p className="text-2xl font-bold text-primary-foreground">{totalMilestones}</p>
              </div>
              <Target className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-success-foreground">{completedMilestones}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">At Risk</p>
                <p className="text-2xl font-bold text-warning-foreground">{atRiskMilestones}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Upcoming</p>
                <p className="text-2xl font-bold text-foreground">{upcomingMilestones}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <div className="space-y-6">
            {filteredMilestones
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map((milestone, index) => {
                const daysUntilDue = getDaysUntilDue(milestone.dueDate, milestone.completedDate)
                const isOverdue = daysUntilDue < 0 && !milestone.completedDate
                const isDueSoon = daysUntilDue <= 7 && daysUntilDue > 0

                return (
                  <div key={milestone.id} className="relative">
                    {/* Timeline Line */}
                    {index < filteredMilestones.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-20 bg-border"></div>
                    )}
                    
                    {/* Timeline Node */}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center shadow-lg ${
                        milestone.status === 'Completed' ? 'bg-success border-success/30' :
                        milestone.status === 'Overdue' ? 'bg-destructive border-destructive/30' :
                        milestone.status === 'At Risk' ? 'bg-warning border-warning/30' :
                        'bg-primary border-primary/30'
                      }`}>
                        {milestone.status === 'Completed' ? (
                          <CheckCircle className="w-6 h-6 text-success-foreground" />
                        ) : milestone.status === 'Overdue' || milestone.status === 'At Risk' ? (
                          <AlertCircle className="w-6 h-6 text-white" />
                        ) : (
                          <Flag className="w-6 h-6 text-primary-foreground" />
                        )}
                      </div>

                      <Card className="flex-1 bg-card border-border shadow-card hover:shadow-elevated transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={getTypeColor(milestone.type)}>
                                {milestone.type}
                              </Badge>
                              <Badge className={getStatusColor(milestone.status)}>
                                {milestone.status}
                              </Badge>
                              <Badge className={getPriorityColor(milestone.priority)}>
                                {milestone.priority}
                              </Badge>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Due: {new Date(milestone.dueDate).toLocaleDateString()}
                              </p>
                              {milestone.completedDate && (
                                <p className="text-sm text-success">
                                  Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                                </p>
                              )}
                              {isOverdue && (
                                <p className="text-sm text-destructive font-medium">
                                  {Math.abs(daysUntilDue)} days overdue
                                </p>
                              )}
                              {isDueSoon && (
                                <p className="text-sm text-warning font-medium">
                                  Due in {daysUntilDue} days
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <CardTitle className="text-lg">{milestone.title}</CardTitle>
                          <CardDescription>{milestone.description}</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span className="font-medium">{milestone.progress}%</span>
                            </div>
                            <Progress value={milestone.progress} className="h-2" />
                          </div>

                          {/* Project and Owner */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Project:</span>
                              <Badge variant="outline">{milestone.project}</Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={milestone.owner.avatar} />
                                <AvatarFallback className="text-xs">
                                  {milestone.owner.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">{milestone.owner.name}</span>
                            </div>
                          </div>

                          {/* Deliverables Summary */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Deliverables ({milestone.deliverables.length})</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {milestone.deliverables.map((deliverable, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <div className={`w-2 h-2 rounded-full ${
                                    deliverable.status === 'Completed' ? 'bg-success' :
                                    deliverable.status === 'In Progress' ? 'bg-primary' :
                                    'bg-muted'
                                  }`} />
                                  <span className={deliverable.status === 'Completed' ? 'line-through text-muted-foreground' : ''}>
                                    {deliverable.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Impact and Notes */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Impact:</span>
                              <span className={`text-sm font-medium ${getImpactColor(milestone.impactLevel)}`}>
                                {milestone.impactLevel}
                              </span>
                            </div>
                            
                            {milestone.dependencies.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Dependencies:</span>
                                <Badge variant="outline">
                                  {milestone.dependencies.length}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {milestone.notes && (
                            <div className="p-3 bg-muted/50 rounded-lg border border-border">
                              <p className="text-sm text-muted-foreground">{milestone.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMilestones.map((milestone) => (
              <Card key={milestone.id} className="bg-card border-border shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getTypeColor(milestone.type)}>
                      {milestone.type}
                    </Badge>
                    <Badge className={getStatusColor(milestone.status)}>
                      {milestone.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{milestone.title}</CardTitle>
                  <CardDescription>{milestone.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>
                      <p className="font-medium">{new Date(milestone.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <p className={`font-medium ${getPriorityColor(milestone.priority).replace('bg-', 'text-').replace('/20', '')}`}>
                        {milestone.priority}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Owner:</span>
                      <p className="font-medium">{milestone.owner.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Impact:</span>
                      <p className={`font-medium ${getImpactColor(milestone.impactLevel)}`}>
                        {milestone.impactLevel}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{milestone.progress}%</span>
                    </div>
                    <Progress value={milestone.progress} className="h-2" />
                  </div>

                  {/* Deliverables */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Deliverables</p>
                    <div className="space-y-2">
                      {milestone.deliverables.map((deliverable, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              deliverable.status === 'Completed' ? 'bg-success' :
                              deliverable.status === 'In Progress' ? 'bg-primary' :
                              'bg-muted-foreground'
                            }`} />
                            <span className={`text-sm ${
                              deliverable.status === 'Completed' ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {deliverable.name}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(deliverable.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stakeholders */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Stakeholders</p>
                    <div className="flex gap-2 flex-wrap">
                      {milestone.stakeholders.map((stakeholder, idx) => (
                        <Badge key={idx} variant="secondary">
                          {stakeholder}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {milestone.notes && (
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground">{milestone.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Milestone Calendar</CardTitle>
              <CardDescription>
                Visual calendar view of all upcoming milestones and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                <p>Calendar view visualization would be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}