import { useState } from "react"
import { Calendar, Target, Users, TrendingUp, Clock, Plus, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Developer {
  id: string
  name: string
  avatar: string
  capacity: number
  skills: string[]
  currentLoad: number
}

interface SprintGoal {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  storyPoints: number
  assignee: string
  status: "todo" | "in-progress" | "done"
  dependencies: string[]
}

const mockDevelopers: Developer[] = [
  {
    id: "dev-1",
    name: "Sarah Chen",
    avatar: "SC",
    capacity: 40,
    skills: ["React", "Python", "RPA"],
    currentLoad: 32
  },
  {
    id: "dev-2", 
    name: "David Liu",
    avatar: "DL",
    capacity: 40,
    skills: ["Node.js", "Database", "API"],
    currentLoad: 25
  },
  {
    id: "dev-3",
    name: "Emma Wilson",
    avatar: "EW",
    capacity: 35,
    skills: ["UI/UX", "Frontend", "Testing"],
    currentLoad: 30
  }
]

const mockSprintGoals: SprintGoal[] = [
  {
    id: "goal-1",
    title: "Multi-currency API Integration",
    description: "Implement currency conversion APIs for expense processing",
    priority: "high",
    storyPoints: 13,
    assignee: "dev-2",
    status: "in-progress",
    dependencies: []
  },
  {
    id: "goal-2",
    title: "Invoice Validation Enhancement",
    description: "Optimize validation rules to prevent timeouts",
    priority: "high", 
    storyPoints: 8,
    assignee: "dev-1",
    status: "in-progress",
    dependencies: ["goal-1"]
  },
  {
    id: "goal-3",
    title: "Error Message UI Updates",
    description: "Improve user-facing error messages and guidance",
    priority: "medium",
    storyPoints: 5,
    assignee: "dev-3",
    status: "done",
    dependencies: []
  },
  {
    id: "goal-4",
    title: "Performance Monitoring Dashboard",
    description: "Create real-time monitoring for automation processes",
    priority: "medium",
    storyPoints: 21,
    assignee: "dev-2",
    status: "todo",
    dependencies: ["goal-2"]
  }
]

export function DevSprintPlanner() {
  const [currentSprint, setCurrentSprint] = useState("Sprint 24.3")
  const [selectedSprint, setSelectedSprint] = useState("current")

  const sprintMetrics = {
    totalCapacity: mockDevelopers.reduce((sum, dev) => sum + dev.capacity, 0),
    totalCommitted: mockSprintGoals.reduce((sum, goal) => sum + goal.storyPoints, 0),
    completed: mockSprintGoals.filter(g => g.status === "done").reduce((sum, goal) => sum + goal.storyPoints, 0),
    inProgress: mockSprintGoals.filter(g => g.status === "in-progress").reduce((sum, goal) => sum + goal.storyPoints, 0),
    sprintProgress: 0,
    velocity: 42 // Previous sprint velocity
  }

  sprintMetrics.sprintProgress = sprintMetrics.totalCommitted > 0 
    ? Math.round((sprintMetrics.completed / sprintMetrics.totalCommitted) * 100)
    : 0

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive bg-destructive/10 border-destructive/20"
      case "medium": return "text-warning bg-warning/10 border-warning/20"
      case "low": return "text-success bg-success/10 border-success/20"
      default: return "text-muted-foreground bg-muted/10 border-border"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "text-success bg-success/10 border-success/20"
      case "in-progress": return "text-warning bg-warning/10 border-warning/20"
      case "todo": return "text-muted-foreground bg-muted/10 border-border"
      default: return "text-muted-foreground bg-muted/10 border-border"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">Development Sprint Planner</h2>
          <p className="text-muted-foreground">Plan and track development sprints for automation projects</p>
        </div>
      </div>

      {/* Sprint Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedSprint} onValueChange={setSelectedSprint}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Sprint (24.3)</SelectItem>
              <SelectItem value="next">Next Sprint (24.4)</SelectItem>
              <SelectItem value="previous">Previous Sprint (24.2)</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-sm">
            Days Remaining: 8
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Burndown Chart
          </Button>
          <Button size="sm" className="bg-gradient-primary gap-2">
            <Plus className="w-4 h-4" />
            Add Story
          </Button>
        </div>
      </div>

      {/* Sprint Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Sprint Goal</span>
              </div>
              <p className="text-lg font-bold">{sprintMetrics.sprintProgress}%</p>
              <Progress value={sprintMetrics.sprintProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Velocity</span>
              </div>
              <p className="text-lg font-bold">{sprintMetrics.velocity}</p>
              <p className="text-xs text-muted-foreground">Story points/sprint</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-sm text-muted-foreground">Committed</span>
              </div>
              <p className="text-lg font-bold">{sprintMetrics.totalCommitted}</p>
              <p className="text-xs text-muted-foreground">Story points</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Team Capacity</span>
              </div>
              <p className="text-lg font-bold">{sprintMetrics.totalCapacity}h</p>
              <p className="text-xs text-muted-foreground">This sprint</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Utilization</span>
              </div>
              <p className="text-lg font-bold">
                {Math.round((mockDevelopers.reduce((sum, dev) => sum + dev.currentLoad, 0) / sprintMetrics.totalCapacity) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Team capacity used</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals">Sprint Goals</TabsTrigger>
          <TabsTrigger value="team">Team Capacity</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {mockSprintGoals.map((goal) => {
              const assignedDev = mockDevelopers.find(dev => dev.id === goal.assignee)
              return (
                <Card key={goal.id} className="bg-gradient-card shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{goal.title}</h3>
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status.replace("-", " ")}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground">{goal.description}</p>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Story Points:</span>
                            <Badge variant="outline">{goal.storyPoints}</Badge>
                          </div>
                          
                          {assignedDev && (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">{assignedDev.avatar}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{assignedDev.name}</span>
                            </div>
                          )}
                          
                          {goal.dependencies.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Depends on:</span>
                              <Badge variant="outline" className="text-xs">
                                {goal.dependencies.length} items
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4">
            {mockDevelopers.map((developer) => (
              <Card key={developer.id} className="bg-gradient-card shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{developer.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{developer.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {developer.skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Capacity: </span>
                        <span className="font-medium">{developer.currentLoad}h / {developer.capacity}h</span>
                      </div>
                      <Progress 
                        value={(developer.currentLoad / developer.capacity) * 100} 
                        className="w-32 h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Dependency Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSprintGoals.filter(goal => goal.dependencies.length > 0).map(goal => (
                  <div key={goal.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Blocked by: {goal.dependencies.join(", ")}
                      </p>
                    </div>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}