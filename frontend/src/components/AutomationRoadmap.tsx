import { useState } from "react"
import { Calendar, Clock, Target, Users, TrendingUp, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface RoadmapItem {
  id: string
  title: string
  description: string
  quarter: string
  year: number
  status: "Not Started" | "Planning" | "In Progress" | "Completed" | "On Hold"
  priority: "Low" | "Medium" | "High" | "Critical"
  department: string
  estimatedROI: number
  timeline: { start: string; end: string }
  progress: number
  dependencies: string[]
  resources: string[]
  milestones: { name: string; date: string; completed: boolean }[]
}

const roadmapData: RoadmapItem[] = [
  {
    id: "R001",
    title: "Invoice Processing Automation",
    description: "End-to-end invoice automation with OCR and approval workflows",
    quarter: "Q1",
    year: 2024,
    status: "In Progress",
    priority: "High",
    department: "Finance",
    estimatedROI: 340000,
    timeline: { start: "2024-01-15", end: "2024-03-30" },
    progress: 65,
    dependencies: ["ERP Integration", "OCR System"],
    resources: ["Sarah Chen", "Dev Team Alpha"],
    milestones: [
      { name: "Requirements Analysis", date: "2024-01-30", completed: true },
      { name: "System Design", date: "2024-02-15", completed: true },
      { name: "Development Phase", date: "2024-03-15", completed: false },
      { name: "Testing & Deployment", date: "2024-03-30", completed: false }
    ]
  },
  {
    id: "R002",
    title: "HR Onboarding Automation",
    description: "Streamlined employee onboarding with document management",
    quarter: "Q2",
    year: 2024,
    status: "Planning",
    priority: "Medium",
    department: "HR",
    estimatedROI: 180000,
    timeline: { start: "2024-04-01", end: "2024-06-30" },
    progress: 25,
    dependencies: ["HRIS Integration"],
    resources: ["Michael Rodriguez", "Dev Team Beta"],
    milestones: [
      { name: "Stakeholder Alignment", date: "2024-04-15", completed: false },
      { name: "Process Mapping", date: "2024-05-01", completed: false },
      { name: "System Development", date: "2024-06-15", completed: false },
      { name: "Go-Live", date: "2024-06-30", completed: false }
    ]
  },
  {
    id: "R003",
    title: "Customer Service AI Chatbot",
    description: "Intelligent chatbot for first-level customer support",
    quarter: "Q3",
    year: 2024,
    status: "Not Started",
    priority: "High",
    department: "Customer Service",
    estimatedROI: 450000,
    timeline: { start: "2024-07-01", end: "2024-09-30" },
    progress: 0,
    dependencies: ["NLP Platform", "Knowledge Base"],
    resources: ["AI Team", "Customer Service Team"],
    milestones: [
      { name: "AI Model Selection", date: "2024-07-15", completed: false },
      { name: "Training Data Preparation", date: "2024-08-15", completed: false },
      { name: "Integration Testing", date: "2024-09-15", completed: false },
      { name: "Production Deployment", date: "2024-09-30", completed: false }
    ]
  },
  {
    id: "R004",
    title: "Supply Chain Optimization",
    description: "Predictive analytics for inventory management and supplier optimization",
    quarter: "Q4",
    year: 2024,
    status: "Not Started",
    priority: "Critical",
    department: "Operations",
    estimatedROI: 620000,
    timeline: { start: "2024-10-01", end: "2024-12-31" },
    progress: 0,
    dependencies: ["Data Warehouse", "Analytics Platform"],
    resources: ["Operations Team", "Data Science Team"],
    milestones: [
      { name: "Data Integration", date: "2024-10-31", completed: false },
      { name: "Model Development", date: "2024-11-30", completed: false },
      { name: "Pilot Testing", date: "2024-12-15", completed: false },
      { name: "Full Rollout", date: "2024-12-31", completed: false }
    ]
  },
  {
    id: "R005",
    title: "Financial Reporting Automation",
    description: "Automated monthly and quarterly financial reporting",
    quarter: "Q1",
    year: 2025,
    status: "Not Started",
    priority: "Medium",
    department: "Finance",
    estimatedROI: 280000,
    timeline: { start: "2025-01-01", end: "2025-03-31" },
    progress: 0,
    dependencies: ["ERP System", "Business Intelligence Tools"],
    resources: ["Finance Team", "BI Team"],
    milestones: [
      { name: "Report Templates Design", date: "2025-01-31", completed: false },
      { name: "Automation Scripts", date: "2025-02-28", completed: false },
      { name: "Testing & Validation", date: "2025-03-15", completed: false },
      { name: "Production Release", date: "2025-03-31", completed: false }
    ]
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Not Started": return "bg-muted text-muted-foreground"
    case "Planning": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "In Progress": return "bg-primary/20 text-primary-foreground border-primary/30"
    case "Completed": return "bg-success/20 text-success-foreground border-success/30"
    case "On Hold": return "bg-warning/20 text-warning-foreground border-warning/30"
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

export function AutomationRoadmap() {
  const [selectedYear, setSelectedYear] = useState(2024)
  const [selectedView, setSelectedView] = useState<"quarterly" | "annual">("quarterly")
  const [selectedQuarter, setSelectedQuarter] = useState("Q1")

  const filteredData = roadmapData.filter(item => 
    selectedView === "annual" ? item.year === selectedYear : 
    item.year === selectedYear && item.quarter === selectedQuarter
  )

  const totalROI = filteredData.reduce((sum, item) => sum + item.estimatedROI, 0)
  const completedItems = filteredData.filter(item => item.status === "Completed").length
  const inProgressItems = filteredData.filter(item => item.status === "In Progress").length

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Calendar className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Automation Roadmap</h2>
            <p className="text-muted-foreground">Strategic planning and timeline view</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedView} onValueChange={(value: "quarterly" | "annual") => setSelectedView(value)}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quarterly">Quarterly View</SelectItem>
              <SelectItem value="annual">Annual View</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-28 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>

          {selectedView === "quarterly" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const quarters = ["Q1", "Q2", "Q3", "Q4"]
                  const currentIndex = quarters.indexOf(selectedQuarter)
                  if (currentIndex > 0) setSelectedQuarter(quarters[currentIndex - 1])
                }}
                disabled={selectedQuarter === "Q1"}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger className="w-20 bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const quarters = ["Q1", "Q2", "Q3", "Q4"]
                  const currentIndex = quarters.indexOf(selectedQuarter)
                  if (currentIndex < 3) setSelectedQuarter(quarters[currentIndex + 1])
                }}
                disabled={selectedQuarter === "Q4"}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Total ROI</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  ${(totalROI / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-success-foreground">{completedItems}</p>
              </div>
              <Target className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-warning-foreground">{inProgressItems}</p>
              </div>
              <Clock className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{filteredData.length}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roadmap Items */}
      <div className="space-y-4">
        {filteredData.map((item) => (
          <Card key={item.id} className="bg-card border-border shadow-card hover:shadow-elevated transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">ROI: ${(item.estimatedROI / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-muted-foreground">{item.department}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{new Date(item.timeline.start).toLocaleDateString()} - {new Date(item.timeline.end).toLocaleDateString()}</span>
                  <span>{Math.ceil((new Date(item.timeline.end).getTime() - new Date(item.timeline.start).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                </div>

                {/* Milestones */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  {item.milestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${milestone.completed ? 'bg-success' : 'bg-muted'}`} />
                      <span className={milestone.completed ? 'text-success' : 'text-muted-foreground'}>
                        {milestone.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Resources & Dependencies */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {item.resources.join(", ")}
                    </span>
                  </div>
                  
                  {item.dependencies.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Dependencies:</span>
                      {item.dependencies.map((dep, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}