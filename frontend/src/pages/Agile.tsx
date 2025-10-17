import { useState, useMemo } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
  Kanban, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  TrendingDown,
  TrendingUp,
  Users,
  MapPin,
  AlertTriangle,
  Clock,
  Link,
  Ticket,
  FileText,
  Target,
  Settings,
  MoreHorizontal,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DevSprintPlanner } from "@/components/DevSprintPlanner"
import { useToast } from "@/hooks/use-toast"

// Mock data for project cards
const mockProjects = [
  {
    id: "PROJ-001",
    title: "Multi-currency Expense Processing",
    description: "Add support for EUR, GBP, and JPY expense processing",
    department: "Finance",
    country: "Global",
    priority: "high",
    slaRisk: "medium",
    status: "backlog",
    assignee: "Sarah Chen",
    assigneeAvatar: "SC",
    storyPoints: 13,
    progress: 0,
    linkedTickets: ["TKT-002", "TKT-008"],
    linkedRules: ["RULE-005", "RULE-012"],
    tags: ["internationalization", "finance", "api-integration"],
    created: "2024-01-10",
    dueDate: "2024-02-15",
    epic: "Financial Automation"
  },
  {
    id: "PROJ-002", 
    title: "Invoice Validation Enhancement",
    description: "Improve validation rules to reduce timeout errors",
    department: "Operations",
    country: "US",
    priority: "high",
    slaRisk: "high",
    status: "in-progress",
    assignee: "David Liu",
    assigneeAvatar: "DL",
    storyPoints: 8,
    progress: 45,
    linkedTickets: ["TKT-001"],
    linkedRules: ["RULE-001", "RULE-003"],
    tags: ["validation", "performance", "critical"],
    created: "2024-01-08",
    dueDate: "2024-01-25",
    epic: "Process Optimization"
  },
  {
    id: "PROJ-003",
    title: "Customer Onboarding UX Improvements", 
    description: "Update error messages and user guidance",
    department: "Sales",
    country: "UK",
    priority: "medium",
    slaRisk: "low",
    status: "testing",
    assignee: "Emma Wilson",
    assigneeAvatar: "EW",
    storyPoints: 5,
    progress: 85,
    linkedTickets: ["TKT-003"],
    linkedRules: ["RULE-002"],
    tags: ["ux", "onboarding", "messaging"],
    created: "2024-01-05",
    dueDate: "2024-01-20",
    epic: "Customer Experience"
  },
  {
    id: "PROJ-004",
    title: "Report Generation Performance",
    description: "Optimize database queries and caching",
    department: "IT",
    country: "DE",
    priority: "low",
    slaRisk: "low", 
    status: "live",
    assignee: "Mike Johnson",
    assigneeAvatar: "MJ",
    storyPoints: 3,
    progress: 100,
    linkedTickets: [],
    linkedRules: ["RULE-007"],
    tags: ["performance", "database", "optimization"],
    created: "2024-01-01",
    dueDate: "2024-01-15",
    epic: "Infrastructure"
  },
  {
    id: "PROJ-005",
    title: "Email Template Automation",
    description: "Automate customer notification templates",
    department: "Marketing",
    country: "CA",
    priority: "medium",
    slaRisk: "medium",
    status: "backlog",
    assignee: "Anna Smith",
    assigneeAvatar: "AS",
    storyPoints: 8,
    progress: 0,
    linkedTickets: ["TKT-007"],
    linkedRules: [],
    tags: ["email", "templates", "automation"],
    created: "2024-01-12",
    dueDate: "2024-02-10",
    epic: "Communication"
  },
  {
    id: "PROJ-006",
    title: "Data Privacy Compliance Updates",
    description: "Update processes for GDPR compliance",
    department: "Legal",
    country: "EU",
    priority: "high",
    slaRisk: "high",
    status: "in-progress",
    assignee: "Tom Brown",
    assigneeAvatar: "TB",
    storyPoints: 21,
    progress: 25,
    linkedTickets: ["TKT-009", "TKT-010"],
    linkedRules: ["RULE-004", "RULE-006"],
    tags: ["compliance", "gdpr", "data-privacy"],
    created: "2024-01-14",
    dueDate: "2024-03-01",
    epic: "Compliance"
  }
]

const columns = [
  { id: "backlog", title: "Backlog", color: "bg-muted" },
  { id: "in-progress", title: "In Progress", color: "bg-warning/10" },
  { id: "testing", title: "Testing", color: "bg-primary/10" },
  { id: "live", title: "Live", color: "bg-success/10" }
]

interface ProjectCardProps {
  project: typeof mockProjects[0]
  isDragging?: boolean
}

function ProjectCard({ project, isDragging = false }: ProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20'
      case 'medium': return 'text-warning bg-warning/10 border-warning/20'
      case 'low': return 'text-success bg-success/10 border-success/20'
      default: return 'text-muted-foreground bg-muted/10 border-border'
    }
  }

  const getSlaRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-destructive'
      case 'medium': return 'text-warning'
      case 'low': return 'text-success'
      default: return 'text-muted-foreground'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ArrowUp className="w-3 h-3" />
      case 'medium': return <Minus className="w-3 h-3" />
      case 'low': return <ArrowDown className="w-3 h-3" />
      default: return <Minus className="w-3 h-3" />
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move shadow-card hover:shadow-elevated transition-all duration-200 bg-gradient-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{project.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge className={getPriorityColor(project.priority)}>
            <div className="flex items-center gap-1">
              {getPriorityIcon(project.priority)}
              {project.priority}
            </div>
          </Badge>
          <Badge variant="outline" className="text-xs">
            {project.storyPoints} pts
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">{project.department}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">{project.country}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-xs">{project.assigneeAvatar}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{project.assignee}</span>
          </div>
          
          <div className={`flex items-center gap-1 text-xs ${getSlaRiskColor(project.slaRisk)}`}>
            <Target className="w-3 h-3" />
            <span>SLA {project.slaRisk}</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {project.linkedTickets.length > 0 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                <Ticket className="w-3 h-3 mr-1" />
                {project.linkedTickets.length}
              </Badge>
            )}
            {project.linkedRules.length > 0 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                <FileText className="w-3 h-3 mr-1" />
                {project.linkedRules.length}
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            Due {new Date(project.dueDate).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {project.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              +{project.tags.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface ColumnProps {
  column: typeof columns[0]
  projects: typeof mockProjects
}

function Column({ column, projects }: ColumnProps) {
  const columnProjects = projects.filter(project => project.status === column.id)
  
  return (
    <div className="flex-1 min-w-[300px]">
      <div className={`${column.color} rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{column.title}</h3>
          <Badge variant="outline" className="bg-background">
            {columnProjects.length}
          </Badge>
        </div>
      </div>
      
      <SortableContext items={columnProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-2">
            {columnProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </ScrollArea>
      </SortableContext>
    </div>
  )
}

export default function Agile() {
  const [projects, setProjects] = useState(mockProjects)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [filterCountry, setFilterCountry] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterSlaRisk, setFilterSlaRisk] = useState("all")
  const [activeProject, setActiveProject] = useState<typeof mockProjects[0] | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDepartment = filterDepartment === "all" || project.department === filterDepartment
      const matchesCountry = filterCountry === "all" || project.country === filterCountry
      const matchesPriority = filterPriority === "all" || project.priority === filterPriority
      const matchesSlaRisk = filterSlaRisk === "all" || project.slaRisk === filterSlaRisk
      
      return matchesSearch && matchesDepartment && matchesCountry && matchesPriority && matchesSlaRisk
    })
  }, [projects, searchQuery, filterDepartment, filterCountry, filterPriority, filterSlaRisk])

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find(p => p.id === event.active.id)
    setActiveProject(project || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProject(null)

    if (!over) return

    const activeProject = projects.find(p => p.id === active.id)
    if (!activeProject) return

    // Determine the new status based on which column was dropped on
    let newStatus = activeProject.status
    
    // Check if dropped on a column or another project
    const overProject = projects.find(p => p.id === over.id)
    if (overProject) {
      newStatus = overProject.status
    } else {
      // Check if dropped directly on a column
      const column = columns.find(c => c.id === over.id)
      if (column) {
        newStatus = column.id
      }
    }

    if (newStatus !== activeProject.status) {
      setProjects(prev => 
        prev.map(project => 
          project.id === active.id 
            ? { ...project, status: newStatus }
            : project
        )
      )
      
      toast({
        title: "Project moved",
        description: `${activeProject.title} moved to ${columns.find(c => c.id === newStatus)?.title}`
      })
    }
  }

  // Sprint metrics
  const sprintMetrics = {
    totalPoints: filteredProjects.reduce((sum, p) => sum + p.storyPoints, 0),
    completedPoints: filteredProjects.filter(p => p.status === 'live').reduce((sum, p) => sum + p.storyPoints, 0),
    inProgressPoints: filteredProjects.filter(p => p.status === 'in-progress' || p.status === 'testing').reduce((sum, p) => sum + p.storyPoints, 0),
    sprintProgress: 0
  }
  
  sprintMetrics.sprintProgress = sprintMetrics.totalPoints > 0 
    ? Math.round((sprintMetrics.completedPoints / sprintMetrics.totalPoints) * 100)
    : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Development Project Board</h1>
            <p className="text-muted-foreground">Technical project management for automation development teams</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Clock className="w-4 h-4" />
              Sprint Planning
            </Button>
            <Button variant="outline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Velocity Report
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => {
              // In a real app, this would show a modal with linked processes
              toast({
                title: "COE Process Links",
                description: "View linked Center of Excellence processes and their business context."
              })
            }}>
              <Link className="w-4 h-4" />
              Linked COE Processes
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary gap-2">
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="it">IT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Project Title</Label>
                    <Input placeholder="Enter project title" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Project description..." className="min-h-[100px]" />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      toast({ title: "Project created", description: "New project added to backlog" })
                      setShowCreateDialog(false)
                    }} className="bg-gradient-primary">
                      Create Project
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Sprint Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sprint Progress</p>
                  <p className="text-2xl font-bold">{sprintMetrics.sprintProgress}%</p>
                  <p className="text-xs text-muted-foreground">{sprintMetrics.completedPoints}/{sprintMetrics.totalPoints} points</p>
                </div>
                <TrendingDown className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{filteredProjects.filter(p => p.status === 'in-progress').length}</p>
                  <p className="text-xs text-success">+2 this week</p>
                </div>
                <Activity className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-success">{filteredProjects.filter(p => p.status === 'live').length}</p>
                  <p className="text-xs text-success">This sprint</p>
                </div>
                <Target className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-destructive">{filteredProjects.filter(p => p.priority === 'high').length}</p>
                  <p className="text-xs text-destructive">Needs attention</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="EU">EU</SelectItem>
                  <SelectItem value="Global">Global</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterSlaRisk} onValueChange={setFilterSlaRisk}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="SLA Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Development Features */}
        <Tabs defaultValue="board" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="board">Project Board</TabsTrigger>
            <TabsTrigger value="sprint">Sprint Planning</TabsTrigger>
            <TabsTrigger value="velocity">Velocity Tracking</TabsTrigger>
            <TabsTrigger value="integration">COE Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="space-y-6">
            {/* Kanban Board */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 overflow-x-auto pb-4">
            {columns.map(column => (
              <Column key={column.id} column={column} projects={filteredProjects} />
            ))}
              </div>
              
              <DragOverlay>
                {activeProject ? (
                  <ProjectCard project={activeProject} isDragging />
                ) : null}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          <TabsContent value="sprint" className="space-y-6">
            <DevSprintPlanner />
          </TabsContent>

          <TabsContent value="velocity" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Team Velocity Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Sprint Velocity</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current Sprint</span>
                        <span className="font-medium">47 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Previous Sprint</span>
                        <span className="font-medium">42 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average (6 sprints)</span>
                        <span className="font-medium">44 points</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Quality Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bug Rate</span>
                        <span className="font-medium text-success">2.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Code Coverage</span>
                        <span className="font-medium text-success">87%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Deploy Success</span>
                        <span className="font-medium text-success">96%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Burndown Forecast</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Completion</span>
                        <span className="font-medium text-success">On Track</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Sprint End</span>
                        <span className="font-medium">Jan 26, 2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Remaining</span>
                        <span className="font-medium">8 days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  COE Process Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card border-border p-4">
                      <div className="text-center space-y-2">
                        <Target className="w-8 h-8 text-primary mx-auto" />
                        <h3 className="font-semibold">Linked Processes</h3>
                        <p className="text-2xl font-bold">12</p>
                        <p className="text-xs text-muted-foreground">Business processes</p>
                      </div>
                    </Card>
                    
                    <Card className="bg-card border-border p-4">
                      <div className="text-center space-y-2">
                        <Clock className="w-8 h-8 text-warning mx-auto" />
                        <h3 className="font-semibold">Auto-Generated</h3>
                        <p className="text-2xl font-bold">8</p>
                        <p className="text-xs text-muted-foreground">From COE pipeline</p>
                      </div>
                    </Card>
                    
                    <Card className="bg-card border-border p-4">
                      <div className="text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
                        <h3 className="font-semibold">Deployed</h3>
                        <p className="text-2xl font-bold">5</p>
                        <p className="text-xs text-muted-foreground">Live in production</p>
                      </div>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Recent COE Handoffs</h3>
                    <div className="space-y-3">
                      {[
                        { process: "Invoice Processing Automation", status: "In Development", devProject: "PROJ-002" },
                        { process: "Employee Onboarding Bot", status: "Pending Development", devProject: null },
                        { process: "Customer Data Reconciliation", status: "Deployed", devProject: "PROJ-004" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                          <div>
                            <h4 className="font-medium">{item.process}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.devProject ? `Project: ${item.devProject}` : "Awaiting project creation"}
                            </p>
                          </div>
                          <Badge className={
                            item.status === "Deployed" ? "text-success bg-success/10" :
                            item.status === "In Development" ? "text-warning bg-warning/10" :
                            "text-muted-foreground bg-muted/10"
                          }>
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}