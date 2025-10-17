import { useState } from "react"
import { Calendar, Target, Users, Clock, Plus, Edit, Play, Pause, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SprintTask {
  id: string
  title: string
  description: string
  type: "Development" | "Analysis" | "Testing" | "Deployment" | "Documentation"
  priority: "Low" | "Medium" | "High" | "Critical"
  status: "Not Started" | "In Progress" | "Blocked" | "Completed"
  assignee: { name: string; avatar?: string }
  estimatedHours: number
  actualHours: number
  storyPoints: number
  tags: string[]
  dependencies: string[]
  dueDate: string
}

interface Sprint {
  id: string
  name: string
  goal: string
  startDate: string
  endDate: string
  status: "Planning" | "Active" | "Completed" | "Cancelled"
  capacity: number // total story points
  commitment: number // committed story points
  velocity: number // completed story points from previous sprints
  tasks: SprintTask[]
  retrospective?: {
    whatWentWell: string[]
    whatToImprove: string[]
    actionItems: string[]
  }
}

const sprintData: Sprint[] = [
  {
    id: "sprint-6",
    name: "Sprint 6 - Q1 2024",
    goal: "Complete invoice processing automation MVP and begin employee onboarding system",
    startDate: "2024-02-05",
    endDate: "2024-02-16",
    status: "Active",
    capacity: 85,
    commitment: 78,
    velocity: 72, // average from previous sprints
    tasks: [
      {
        id: "task-1",
        title: "Invoice OCR Integration",
        description: "Integrate OCR service for invoice text extraction",
        type: "Development",
        priority: "High",
        status: "In Progress",
        assignee: { name: "Sarah Chen", avatar: "/api/placeholder/32/32" },
        estimatedHours: 24,
        actualHours: 16,
        storyPoints: 8,
        tags: ["Invoice", "OCR", "Integration"],
        dependencies: ["API Setup"],
        dueDate: "2024-02-10"
      },
      {
        id: "task-2",
        title: "Approval Workflow Engine",
        description: "Build automated approval routing based on business rules",
        type: "Development",
        priority: "High",
        status: "In Progress",
        assignee: { name: "Alex Kumar", avatar: "/api/placeholder/32/32" },
        estimatedHours: 32,
        actualHours: 20,
        storyPoints: 13,
        tags: ["Workflow", "Business Rules", "Automation"],
        dependencies: ["Database Schema"],
        dueDate: "2024-02-14"
      },
      {
        id: "task-3",
        title: "User Acceptance Testing",
        description: "Coordinate UAT sessions with finance team",
        type: "Testing",
        priority: "Medium",
        status: "Not Started",
        assignee: { name: "Maria Rodriguez", avatar: "/api/placeholder/32/32" },
        estimatedHours: 16,
        actualHours: 0,
        storyPoints: 5,
        tags: ["UAT", "Testing", "Finance"],
        dependencies: ["Invoice OCR Integration"],
        dueDate: "2024-02-15"
      },
      {
        id: "task-4",
        title: "Employee Onboarding Requirements",
        description: "Gather detailed requirements from HR stakeholders",
        type: "Analysis",
        priority: "Medium",
        status: "Completed",
        assignee: { name: "Michael Thompson", avatar: "/api/placeholder/32/32" },
        estimatedHours: 12,
        actualHours: 14,
        storyPoints: 3,
        tags: ["Requirements", "HR", "Analysis"],
        dependencies: [],
        dueDate: "2024-02-08"
      },
      {
        id: "task-5",
        title: "Security Review Documentation",
        description: "Complete security assessment for invoice processing system",
        type: "Documentation",
        priority: "High",
        status: "In Progress",
        assignee: { name: "Lisa Park", avatar: "/api/placeholder/32/32" },
        estimatedHours: 8,
        actualHours: 4,
        storyPoints: 2,
        tags: ["Security", "Documentation", "Compliance"],
        dependencies: ["Approval Workflow Engine"],
        dueDate: "2024-02-12"
      }
    ]
  },
  {
    id: "sprint-5",
    name: "Sprint 5 - Q1 2024",
    goal: "Foundation setup for invoice processing automation",
    startDate: "2024-01-22",
    endDate: "2024-02-02",
    status: "Completed",
    capacity: 80,
    commitment: 75,
    velocity: 73,
    tasks: [
      {
        id: "task-6",
        title: "Database Schema Design",
        description: "Design database schema for invoice processing workflow",
        type: "Development",
        priority: "High",
        status: "Completed",
        assignee: { name: "Alex Kumar", avatar: "/api/placeholder/32/32" },
        estimatedHours: 16,
        actualHours: 18,
        storyPoints: 5,
        tags: ["Database", "Schema", "Design"],
        dependencies: [],
        dueDate: "2024-01-26"
      },
      {
        id: "task-7",
        title: "API Architecture Planning",
        description: "Define REST API architecture and endpoints",
        type: "Analysis",
        priority: "High",
        status: "Completed",
        assignee: { name: "Sarah Chen", avatar: "/api/placeholder/32/32" },
        estimatedHours: 12,
        actualHours: 10,
        storyPoints: 3,
        tags: ["API", "Architecture", "Planning"],
        dependencies: [],
        dueDate: "2024-01-28"
      }
    ],
    retrospective: {
      whatWentWell: [
        "Strong collaboration between development and business analysis teams",
        "Clear requirements gathering process",
        "Effective daily standups"
      ],
      whatToImprove: [
        "Better estimation accuracy for complex technical tasks",
        "More frequent stakeholder check-ins",
        "Clearer definition of done criteria"
      ],
      actionItems: [
        "Implement story point poker for better estimations",
        "Schedule weekly stakeholder demos",
        "Create detailed acceptance criteria templates"
      ]
    }
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Not Started": return "bg-muted text-muted-foreground"
    case "In Progress": return "bg-primary/20 text-primary-foreground border-primary/30"
    case "Blocked": return "bg-destructive/20 text-destructive-foreground border-destructive/30"
    case "Completed": return "bg-success/20 text-success-foreground border-success/30"
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
    case "Development": return "bg-primary/20 text-primary-foreground"
    case "Analysis": return "bg-blue-500/20 text-blue-400"
    case "Testing": return "bg-warning/20 text-warning-foreground"
    case "Deployment": return "bg-success/20 text-success-foreground"
    case "Documentation": return "bg-secondary/20 text-secondary-foreground"
    default: return "bg-muted text-muted-foreground"
  }
}

export function SprintPlanning() {
  const [selectedSprint, setSelectedSprint] = useState("sprint-6")
  const [selectedView, setSelectedView] = useState("tasks")

  const currentSprint = sprintData.find(sprint => sprint.id === selectedSprint)!
  
  const completedTasks = currentSprint.tasks.filter(task => task.status === "Completed")
  const inProgressTasks = currentSprint.tasks.filter(task => task.status === "In Progress")
  const blockedTasks = currentSprint.tasks.filter(task => task.status === "Blocked")
  
  const totalStoryPoints = currentSprint.tasks.reduce((sum, task) => sum + task.storyPoints, 0)
  const completedStoryPoints = completedTasks.reduce((sum, task) => sum + task.storyPoints, 0)
  const sprintProgress = (completedStoryPoints / totalStoryPoints) * 100

  const totalHoursSpent = currentSprint.tasks.reduce((sum, task) => sum + task.actualHours, 0)
  const totalHoursEstimated = currentSprint.tasks.reduce((sum, task) => sum + task.estimatedHours, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sprint Planning</h2>
            <p className="text-muted-foreground">Agile development cycles for automation projects</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedSprint} onValueChange={setSelectedSprint}>
            <SelectTrigger className="w-48 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sprintData.map(sprint => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name} ({sprint.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                New Sprint
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sprint</DialogTitle>
                <DialogDescription>
                  Plan a new sprint for your automation development cycle.
                </DialogDescription>
              </DialogHeader>
              {/* Add form content here */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sprint Overview */}
      <Card className="bg-gradient-card border-border shadow-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                {currentSprint.name}
                <Badge className={getStatusColor(currentSprint.status)}>
                  {currentSprint.status}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2 text-base">{currentSprint.goal}</CardDescription>
            </div>
            
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">
                {new Date(currentSprint.startDate).toLocaleDateString()} - {new Date(currentSprint.endDate).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2">
                {currentSprint.status === "Active" && <Play className="w-4 h-4 text-success" />}
                {currentSprint.status === "Completed" && <CheckCircle className="w-4 h-4 text-success" />}
                {currentSprint.status === "Planning" && <Calendar className="w-4 h-4 text-warning" />}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-primary border-primary/30 shadow-glow">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-primary-foreground/80 text-sm font-medium">Progress</p>
                  <p className="text-2xl font-bold text-primary-foreground">{Math.round(sprintProgress)}%</p>
                  <Progress value={sprintProgress} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-success border-success/30 shadow-glow">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-success-foreground/80 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-success-foreground">{completedTasks.length}</p>
                  <p className="text-xs text-success-foreground/80">{completedStoryPoints} points</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-warning border-warning/30 shadow-glow">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-warning-foreground/80 text-sm font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-warning-foreground">{inProgressTasks.length}</p>
                  <p className="text-xs text-warning-foreground/80">
                    {inProgressTasks.reduce((sum, task) => sum + task.storyPoints, 0)} points
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm font-medium">Capacity</p>
                  <p className="text-2xl font-bold text-foreground">{currentSprint.capacity}</p>
                  <p className="text-xs text-muted-foreground">story points</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm font-medium">Velocity</p>
                  <p className="text-2xl font-bold text-foreground">{currentSprint.velocity}</p>
                  <p className="text-xs text-muted-foreground">avg. points</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="tasks">Sprint Tasks</TabsTrigger>
          <TabsTrigger value="burndown">Burndown Chart</TabsTrigger>
          <TabsTrigger value="team">Team Allocation</TabsTrigger>
          <TabsTrigger value="retrospective">Retrospective</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Sprint Tasks ({currentSprint.tasks.length})</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Sprint Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to the current sprint.
                  </DialogDescription>
                </DialogHeader>
                {/* Add form content here */}
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {currentSprint.tasks.map((task) => (
              <Card key={task.id} className="bg-card border-border shadow-card hover:shadow-elevated transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getTypeColor(task.type)}>
                          {task.type}
                        </Badge>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">{task.storyPoints} SP</p>
                      <p className="text-xs text-muted-foreground">
                        {task.actualHours}/{task.estimatedHours}h
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{task.assignee.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.dependencies.length > 0 && (
                        <Badge variant="outline">
                          {task.dependencies.length} deps
                        </Badge>
                      )}
                      {task.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar for in-progress tasks */}
                  {task.status === "In Progress" && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{Math.round((task.actualHours / task.estimatedHours) * 100)}%</span>
                      </div>
                      <Progress value={(task.actualHours / task.estimatedHours) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="burndown" className="space-y-4">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Sprint Burndown Chart</CardTitle>
              <CardDescription>
                Track remaining work throughout the sprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Burndown chart visualization would be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Team Allocation</CardTitle>
              <CardDescription>
                Current team member allocation for this sprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(new Set(currentSprint.tasks.map(task => task.assignee.name))).map(memberName => {
                  const memberTasks = currentSprint.tasks.filter(task => task.assignee.name === memberName)
                  const memberStoryPoints = memberTasks.reduce((sum, task) => sum + task.storyPoints, 0)
                  const memberHours = memberTasks.reduce((sum, task) => sum + task.actualHours, 0)
                  
                  return (
                    <div key={memberName} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={memberTasks[0]?.assignee.avatar} />
                          <AvatarFallback>
                            {memberName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{memberName}</p>
                          <p className="text-sm text-muted-foreground">{memberTasks.length} tasks assigned</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{memberStoryPoints} story points</p>
                        <p className="text-sm text-muted-foreground">{memberHours} hours logged</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retrospective" className="space-y-4">
          {currentSprint.retrospective ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-success border-success/30 shadow-glow">
                <CardHeader>
                  <CardTitle className="text-success-foreground">What Went Well</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentSprint.retrospective.whatWentWell.map((item, idx) => (
                      <li key={idx} className="text-sm text-success-foreground/90 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-success-foreground/60 rounded-full mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-warning border-warning/30 shadow-glow">
                <CardHeader>
                  <CardTitle className="text-warning-foreground">What to Improve</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentSprint.retrospective.whatToImprove.map((item, idx) => (
                      <li key={idx} className="text-sm text-warning-foreground/90 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-warning-foreground/60 rounded-full mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-primary border-primary/30 shadow-glow">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Action Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentSprint.retrospective.actionItems.map((item, idx) => (
                      <li key={idx} className="text-sm text-primary-foreground/90 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-foreground/60 rounded-full mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">No Retrospective Available</p>
                    <p className="text-muted-foreground">
                      Retrospective data will be available after the sprint is completed.
                    </p>
                  </div>
                  {currentSprint.status === "Active" && (
                    <Button className="bg-gradient-primary text-primary-foreground">
                      Plan Retrospective
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}