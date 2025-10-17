import { useState } from "react"
import { Users, Calendar, BarChart3, Clock, Target, AlertCircle, Plus, Edit } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface TeamMember {
  id: string
  name: string
  role: string
  department: string
  avatar?: string
  skills: string[]
  capacity: number // hours per week
  currentAllocation: number // percentage
  projects: {
    id: string
    name: string
    allocation: number // percentage
    endDate: string
  }[]
  availability: {
    week: string
    availableHours: number
  }[]
}

interface Team {
  id: string
  name: string
  department: string
  lead: string
  members: TeamMember[]
  projects: string[]
  capacity: {
    total: number
    allocated: number
    available: number
  }
}

const teamData: Team[] = [
  {
    id: "team-1",
    name: "Automation Development",
    department: "IT",
    lead: "Sarah Chen",
    members: [
      {
        id: "member-1",
        name: "Sarah Chen",
        role: "Lead Developer",
        department: "IT",
        avatar: "/api/placeholder/40/40",
        skills: ["Python", "RPA", "AI/ML", "System Integration"],
        capacity: 40,
        currentAllocation: 85,
        projects: [
          { id: "P001", name: "Invoice Processing", allocation: 50, endDate: "2024-03-30" },
          { id: "P005", name: "IT Ticket Auto-Assignment", allocation: 35, endDate: "2024-02-28" }
        ],
        availability: [
          { week: "2024-W06", availableHours: 6 },
          { week: "2024-W07", availableHours: 8 },
          { week: "2024-W08", availableHours: 12 }
        ]
      },
      {
        id: "member-2",
        name: "Alex Kumar",
        role: "Senior Developer",
        department: "IT",
        avatar: "/api/placeholder/40/40",
        skills: ["JavaScript", "Node.js", "API Development", "Database Design"],
        capacity: 40,
        currentAllocation: 70,
        projects: [
          { id: "P001", name: "Invoice Processing", allocation: 40, endDate: "2024-03-30" },
          { id: "P003", name: "Customer Data Reconciliation", allocation: 30, endDate: "2024-02-15" }
        ],
        availability: [
          { week: "2024-W06", availableHours: 12 },
          { week: "2024-W07", availableHours: 14 },
          { week: "2024-W08", availableHours: 16 }
        ]
      },
      {
        id: "member-3",
        name: "Maria Rodriguez",
        role: "Junior Developer",
        department: "IT",
        avatar: "/api/placeholder/40/40",
        skills: ["Python", "Testing", "Documentation", "UI/UX"],
        capacity: 40,
        currentAllocation: 60,
        projects: [
          { id: "P002", name: "Employee Onboarding Bot", allocation: 60, endDate: "2024-04-15" }
        ],
        availability: [
          { week: "2024-W06", availableHours: 16 },
          { week: "2024-W07", availableHours: 18 },
          { week: "2024-W08", availableHours: 20 }
        ]
      }
    ],
    projects: ["P001", "P002", "P005"],
    capacity: {
      total: 120,
      allocated: 86,
      available: 34
    }
  },
  {
    id: "team-2",
    name: "Business Analysis",
    department: "Operations",
    lead: "Michael Thompson",
    members: [
      {
        id: "member-4",
        name: "Michael Thompson",
        role: "Senior Business Analyst",
        department: "Operations",
        avatar: "/api/placeholder/40/40",
        skills: ["Process Mapping", "Requirements Analysis", "Stakeholder Management", "ROI Analysis"],
        capacity: 40,
        currentAllocation: 75,
        projects: [
          { id: "P003", name: "Customer Data Reconciliation", allocation: 40, endDate: "2024-02-28" },
          { id: "P004", name: "Expense Report Processing", allocation: 35, endDate: "2024-03-15" }
        ],
        availability: [
          { week: "2024-W06", availableHours: 10 },
          { week: "2024-W07", availableHours: 12 },
          { week: "2024-W08", availableHours: 15 }
        ]
      },
      {
        id: "member-5", 
        name: "Lisa Park",
        role: "Business Analyst",
        department: "Operations",
        avatar: "/api/placeholder/40/40",
        skills: ["Process Design", "Data Analysis", "Project Management", "Change Management"],
        capacity: 40,
        currentAllocation: 65,
        projects: [
          { id: "P002", name: "Employee Onboarding Bot", allocation: 65, endDate: "2024-04-30" }
        ],
        availability: [
          { week: "2024-W06", availableHours: 14 },
          { week: "2024-W07", availableHours: 16 },
          { week: "2024-W08", availableHours: 18 }
        ]
      }
    ],
    projects: ["P002", "P003", "P004"],
    capacity: {
      total: 80,
      allocated: 56,
      available: 24
    }
  },
  {
    id: "team-3",
    name: "AI & Data Science",
    department: "IT",
    lead: "Dr. James Wilson",
    members: [
      {
        id: "member-6",
        name: "Dr. James Wilson",
        role: "Data Science Lead",
        department: "IT",
        avatar: "/api/placeholder/40/40",
        skills: ["Machine Learning", "NLP", "Python", "Deep Learning"],
        capacity: 40,
        currentAllocation: 90,
        projects: [
          { id: "P006", name: "Customer Service Chatbot", allocation: 60, endDate: "2024-03-31" },
          { id: "P007", name: "Predictive Analytics Platform", allocation: 30, endDate: "2024-05-15" }
        ],
        availability: [
          { week: "2024-W06", availableHours: 4 },
          { week: "2024-W07", availableHours: 6 },
          { week: "2024-W08", availableHours: 8 }
        ]
      },
      {
        id: "member-7",
        name: "Emma Davis",
        role: "ML Engineer",
        department: "IT", 
        avatar: "/api/placeholder/40/40",
        skills: ["TensorFlow", "PyTorch", "MLOps", "Cloud Platforms"],
        capacity: 40,
        currentAllocation: 80,
        projects: [
          { id: "P006", name: "Customer Service Chatbot", allocation: 50, endDate: "2024-03-31" },
          { id: "P008", name: "Fraud Detection System", allocation: 30, endDate: "2024-04-30" }
        ],
        availability: [
          { week: "2024-W06", availableHours: 8 },
          { week: "2024-W07", availableHours: 10 },
          { week: "2024-W08", availableHours: 12 }
        ]
      }
    ],
    projects: ["P006", "P007", "P008"],
    capacity: {
      total: 80,
      allocated: 68,
      available: 12
    }
  }
]

const getUtilizationColor = (utilization: number) => {
  if (utilization >= 90) return "text-destructive"
  if (utilization >= 75) return "text-warning"
  if (utilization >= 50) return "text-success"
  return "text-muted-foreground"
}

const getUtilizationBg = (utilization: number) => {
  if (utilization >= 90) return "bg-destructive/10 border-destructive/30"
  if (utilization >= 75) return "bg-warning/10 border-warning/30"
  if (utilization >= 50) return "bg-success/10 border-success/30"
  return "bg-muted/10 border-muted/30"
}

export function ResourcePlanning() {
  const [selectedDepartment, setSelectedDepartment] = useState("All")
  const [selectedTimeframe, setSelectedTimeframe] = useState("current")

  const filteredTeams = teamData.filter(team => 
    selectedDepartment === "All" || team.department === selectedDepartment
  )

  const totalCapacity = filteredTeams.reduce((sum, team) => sum + team.capacity.total, 0)
  const totalAllocated = filteredTeams.reduce((sum, team) => sum + team.capacity.allocated, 0)
  const totalAvailable = filteredTeams.reduce((sum, team) => sum + team.capacity.available, 0)
  const utilizationRate = Math.round((totalAllocated / totalCapacity) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Resource Planning</h2>
            <p className="text-muted-foreground">Team capacity and allocation management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Departments</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Sprint</SelectItem>
              <SelectItem value="next">Next Sprint</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Team Member</DialogTitle>
                <DialogDescription>
                  Add a new team member to track their capacity and assignments.
                </DialogDescription>
              </DialogHeader>
              {/* Add form content here */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Total Capacity</p>
                <p className="text-2xl font-bold text-primary-foreground">{totalCapacity}h</p>
              </div>
              <Clock className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">Allocated</p>
                <p className="text-2xl font-bold text-warning-foreground">{totalAllocated}h</p>
              </div>
              <Target className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Available</p>
                <p className="text-2xl font-bold text-success-foreground">{totalAvailable}h</p>
              </div>
              <Users className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${getUtilizationBg(utilizationRate)} shadow-glow`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${getUtilizationColor(utilizationRate)}`}>Utilization</p>
                <p className={`text-2xl font-bold ${getUtilizationColor(utilizationRate)}`}>{utilizationRate}%</p>
              </div>
              <BarChart3 className={`w-8 h-8 ${getUtilizationColor(utilizationRate)}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger value="teams">Team Overview</TabsTrigger>
          <TabsTrigger value="members">Individual Members</TabsTrigger>
          <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="bg-card border-border shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {team.name}
                      <Badge variant="outline">{team.department}</Badge>
                    </CardTitle>
                    <CardDescription>Lead: {team.lead} • {team.members.length} members</CardDescription>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Utilization: <span className={getUtilizationColor((team.capacity.allocated / team.capacity.total) * 100)}>
                        {Math.round((team.capacity.allocated / team.capacity.total) * 100)}%
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {team.capacity.allocated}h / {team.capacity.total}h allocated
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Capacity Bar */}
                  <div className="space-y-2">
                    <Progress 
                      value={(team.capacity.allocated / team.capacity.total) * 100} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Available: {team.capacity.available}h</span>
                      <span>Total: {team.capacity.total}h</span>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {team.members.map((member) => (
                      <Card key={member.id} className={`${getUtilizationBg(member.currentAllocation)} border`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                            {member.currentAllocation >= 90 && (
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Allocation</span>
                              <span className={getUtilizationColor(member.currentAllocation)}>
                                {member.currentAllocation}%
                              </span>
                            </div>
                            <Progress value={member.currentAllocation} className="h-2" />
                          </div>

                          <div className="mt-3 space-y-1">
                            {member.projects.slice(0, 2).map((project) => (
                              <div key={project.id} className="flex justify-between text-xs">
                                <span className="truncate">{project.name}</span>
                                <span className="text-muted-foreground">{project.allocation}%</span>
                              </div>
                            ))}
                            {member.projects.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{member.projects.length - 2} more projects
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Active Projects */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-2">Active Projects</p>
                    <div className="flex gap-2 flex-wrap">
                      {team.projects.map((projectId) => (
                        <Badge key={projectId} variant="secondary">
                          {projectId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.flatMap(team => team.members).map((member) => (
              <Card key={member.id} className={`${getUtilizationBg(member.currentAllocation)} border shadow-card`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <CardDescription>{member.role}</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Allocation */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Allocation</span>
                      <span className={getUtilizationColor(member.currentAllocation)}>
                        {member.currentAllocation}%
                      </span>
                    </div>
                    <Progress value={member.currentAllocation} className="h-2" />
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 4 && (
                        <Badge variant="secondary">
                          +{member.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Current Projects */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Current Projects</p>
                    <div className="space-y-1">
                      {member.projects.map((project) => (
                        <div key={project.id} className="flex justify-between text-xs">
                          <span className="truncate">{project.name}</span>
                          <span className="text-muted-foreground">{project.allocation}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming availability */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upcoming Availability</p>
                    <div className="space-y-1">
                      {member.availability.slice(0, 2).map((week) => (
                        <div key={week.week} className="flex justify-between text-xs">
                          <span>{week.week.replace('2024-W', 'Week ')}</span>
                          <span className="text-success">{week.availableHours}h available</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Capacity Planning Matrix</CardTitle>
              <CardDescription>Weekly capacity overview for the next 4 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2">Team Member</th>
                      <th className="text-center p-2">Current</th>
                      <th className="text-center p-2">Week 6</th>
                      <th className="text-center p-2">Week 7</th>
                      <th className="text-center p-2">Week 8</th>
                      <th className="text-center p-2">Week 9</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.flatMap(team => team.members).map((member) => (
                      <tr key={member.id} className="border-b border-border/50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <Badge className={getUtilizationBg(member.currentAllocation)}>
                            {member.currentAllocation}%
                          </Badge>
                        </td>
                        {member.availability.map((week) => (
                          <td key={week.week} className="text-center p-2">
                            <span className="text-success font-medium">{week.availableHours}h</span>
                          </td>
                        ))}
                        {/* Fill remaining weeks with estimated data */}
                        <td className="text-center p-2">
                          <span className="text-success font-medium">16h</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}