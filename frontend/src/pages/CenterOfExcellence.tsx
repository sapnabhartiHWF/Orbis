import { useState } from "react"
import { 
  Plus, 
  Search, 
  Upload, 
  FileText, 
  Clock, 
  Target, 
  TrendingUp, 
  Users, 
  Building, 
  CheckCircle,
  PlayCircle,
  Link2,
  ArrowRight,
  Brain,
  Rocket
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AutomationRoadmap } from "@/components/AutomationRoadmap"
import { BusinessROICalculator } from "@/components/BusinessROICalculator"
import { ApprovalWorkflowBoard } from "@/components/ApprovalWorkflowBoard"
import { toast } from "@/hooks/use-toast"

interface Process {
  id: string
  title: string
  description: string
  department: string
  priority: "Low" | "Medium" | "High" | "Critical"
  expectedROI: number
  status: "Submitted" | "Under Review" | "In Development" | "Deployed"
  submittedBy: string
  submittedDate: string
  estimatedSavings: number
  complexity: "Low" | "Medium" | "High"
  dependencies: string[]
  tags: string[]
}

const dummyProcesses: Process[] = [
  {
    id: "P001",
    title: "Invoice Processing Automation",
    description: "Automate the entire invoice processing workflow from receipt to payment approval, reducing manual intervention by 85%",
    department: "Finance",
    priority: "High",
    expectedROI: 340000,
    status: "In Development",
    submittedBy: "Sarah Chen",
    submittedDate: "2024-01-15",
    estimatedSavings: 450000,
    complexity: "Medium",
    dependencies: ["ERP Integration", "OCR System"],
    tags: ["Finance", "OCR", "Approval Workflow"]
  },
  {
    id: "P002", 
    title: "Employee Onboarding Bot",
    description: "Streamline new hire onboarding with automated document collection, system provisioning, and training scheduling",
    department: "HR",
    priority: "Medium",
    expectedROI: 180000,
    status: "Under Review",
    submittedBy: "Michael Rodriguez",
    submittedDate: "2024-01-20",
    estimatedSavings: 220000,
    complexity: "High",
    dependencies: ["HRIS Integration", "Identity Management"],
    tags: ["HR", "Onboarding", "Document Management"]
  },
  {
    id: "P003",
    title: "Customer Data Reconciliation",
    description: "Automated cross-system data validation and reconciliation for customer records across CRM, billing, and support systems",
    department: "Operations",
    priority: "Critical",
    expectedROI: 520000,
    status: "Deployed",
    submittedBy: "Emma Thompson", 
    submittedDate: "2023-12-10",
    estimatedSavings: 680000,
    complexity: "High",
    dependencies: ["CRM API", "Data Warehouse"],
    tags: ["Data Quality", "CRM", "Reconciliation"]
  },
  {
    id: "P004",
    title: "Expense Report Processing",
    description: "Automate expense report validation, approval routing, and reimbursement processing with intelligent receipt scanning",
    department: "Finance",
    priority: "Medium",
    expectedROI: 95000,
    status: "Submitted",
    submittedBy: "David Park",
    submittedDate: "2024-01-25",
    estimatedSavings: 125000,
    complexity: "Low",
    dependencies: ["Receipt OCR", "Approval System"],
    tags: ["Finance", "Expenses", "OCR", "Mobile"]
  },
  {
    id: "P005",
    title: "IT Ticket Auto-Assignment",
    description: "Intelligent routing and assignment of IT support tickets based on content analysis, priority, and technician availability",
    department: "IT",
    priority: "High", 
    expectedROI: 280000,
    status: "In Development",
    submittedBy: "Lisa Wang",
    submittedDate: "2024-01-08",
    estimatedSavings: 320000,
    complexity: "Medium",
    dependencies: ["NLP Engine", "Ticketing System"],
    tags: ["IT Support", "NLP", "Routing"]
  },
  {
    id: "P006",
    title: "Contract Renewal Management",
    description: "Proactive contract monitoring with automated renewal notifications, risk assessment, and vendor performance tracking",
    department: "Legal",
    priority: "Medium",
    expectedROI: 150000,
    status: "Under Review",
    submittedBy: "James Miller",
    submittedDate: "2024-01-18",
    estimatedSavings: 200000,
    complexity: "Medium",
    dependencies: ["Contract Database", "Calendar Integration"],
    tags: ["Legal", "Contracts", "Compliance"]
  }
]

const departments = ["All", "Finance", "HR", "Operations", "IT", "Legal", "Marketing", "Sales"]
const statusOptions = ["All", "Submitted", "Under Review", "In Development", "Deployed"]
const priorityOptions = ["All", "Low", "Medium", "High", "Critical"]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Submitted": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "Under Review": return "bg-warning/20 text-warning-foreground border-warning/30"
    case "In Development": return "bg-primary/20 text-primary-foreground border-primary/30"
    case "Deployed": return "bg-success/20 text-success-foreground border-success/30"
    default: return "bg-muted text-muted-foreground"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Low": return "bg-muted text-muted-foreground"
    case "Medium": return "bg-warning/20 text-warning-foreground border-warning/30"
    case "High": return "bg-destructive/20 text-destructive-foreground border-destructive/30"
    case "Critical": return "bg-gradient-danger text-white border-destructive shadow-glow"
    default: return "bg-muted text-muted-foreground"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Submitted": return <FileText className="w-4 h-4" />
    case "Under Review": return <Clock className="w-4 h-4" />
    case "In Development": return <PlayCircle className="w-4 h-4" />
    case "Deployed": return <CheckCircle className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

export default function CenterOfExcellence() {
  const [processes, setProcesses] = useState<Process[]>(dummyProcesses)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [isNewProcessOpen, setIsNewProcessOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("processes")
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [isProcessDetailsOpen, setIsProcessDetailsOpen] = useState(false)

  // Filter processes based on search and filters
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "All" || process.department === departmentFilter
    const matchesStatus = statusFilter === "All" || process.status === statusFilter
    const matchesPriority = priorityFilter === "All" || process.priority === priorityFilter
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesPriority
  })

  // Stats calculations
  const totalROI = processes.reduce((sum, p) => sum + p.expectedROI, 0)
  const totalSavings = processes.reduce((sum, p) => sum + p.estimatedSavings, 0)
  const deployedCount = processes.filter(p => p.status === "Deployed").length
  const inDevelopmentCount = processes.filter(p => p.status === "In Development").length

  const handleNewProcess = () => {
    toast({
      title: "Process Submitted Successfully! 🚀",
      description: "Your automation request has been submitted for review. You'll receive updates as it progresses through our pipeline.",
    })
    setIsNewProcessOpen(false)
  }

  const handleProcessClick = (process: Process) => {
    setSelectedProcess(process)
    setIsProcessDetailsOpen(true)
  }

  const getDetailedProcessData = (process: Process) => {
    // Extended dummy data for detailed view
    return {
      ...process,
      businessCase: "This automation initiative aims to eliminate manual data entry errors, reduce processing time from 2 hours to 15 minutes per invoice, and improve vendor relationships through faster payments.",
      currentProcess: [
        "Invoice received via email or paper",
        "Manual data entry into ERP system", 
        "3-level approval workflow",
        "Manual matching with purchase orders",
        "Payment processing and reconciliation"
      ],
      proposedSolution: [
        "OCR-based automated data extraction",
        "AI-powered validation and matching",
        "Automated routing based on business rules",
        "Digital approval workflow with mobile support",
        "Real-time integration with financial systems"
      ],
      technicalRequirements: [
        "OCR engine for invoice scanning",
        "API integration with SAP ERP",
        "Mobile app for approvals",
        "Data validation algorithms",
        "Audit trail and compliance logging"
      ],
      timeline: {
        "Analysis & Design": "2 weeks",
        "Development": "6 weeks", 
        "Testing": "2 weeks",
        "Deployment": "1 week",
        "Training & Go-Live": "1 week"
      },
      risks: [
        { risk: "ERP system compatibility", mitigation: "Conduct thorough integration testing", severity: "Medium" },
        { risk: "User adoption resistance", mitigation: "Comprehensive training program", severity: "Low" },
        { risk: "OCR accuracy for poor quality documents", mitigation: "Manual fallback process", severity: "Medium" }
      ],
      benefits: [
        "85% reduction in processing time",
        "Elimination of manual data entry errors",
        "Improved vendor payment cycles", 
        "Enhanced audit compliance",
        "Cost savings of $450K annually"
      ],
      stakeholders: [
        { name: "Sarah Chen", role: "Process Owner", department: "Finance" },
        { name: "Michael Torres", role: "IT Lead", department: "Technology" },
        { name: "Jennifer Liu", role: "Compliance Manager", department: "Legal" },
        { name: "David Park", role: "Business Analyst", department: "Operations" }
      ]
    }
  }

  return (
    <div className="flex-1 space-y-8 p-8 bg-background">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary rounded-2xl opacity-10 blur-3xl"></div>
        <div className="relative bg-gradient-card rounded-2xl p-8 border border-border shadow-elevated">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Rocket className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Center of Excellence
                </h1>
                <p className="text-muted-foreground text-lg">Automation Pipeline & Innovation Hub</p>
              </div>
            </div>
            
            <Dialog open={isNewProcessOpen} onOpenChange={setIsNewProcessOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Submit Process
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-3">
                    <Brain className="w-6 h-6 text-primary" />
                    Submit New Automation Process
                  </DialogTitle>
                  <DialogDescription>
                    Share your process improvement idea and let our team assess its automation potential.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Process Title</Label>
                      <Input id="title" placeholder="e.g., Invoice Processing Automation" className="bg-muted border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select>
                        <SelectTrigger className="bg-muted border-border">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {departments.slice(1).map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Process Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe the current manual process, pain points, and expected outcomes..."
                      className="min-h-24 bg-muted border-border"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority Level</Label>
                      <Select>
                        <SelectTrigger className="bg-muted border-border">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedROI">Expected ROI ($)</Label>
                      <Input id="expectedROI" type="number" placeholder="250000" className="bg-muted border-border" />
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewProcessOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleNewProcess} className="bg-gradient-primary text-primary-foreground">
                    Submit Process
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-success border-success/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-success-foreground/80 text-sm font-medium">Total ROI</p>
                    <p className="text-2xl font-bold text-success-foreground">
                      ${(totalROI / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-primary border-primary/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/80 text-sm font-medium">Est. Savings</p>
                    <p className="text-2xl font-bold text-primary-foreground">
                      ${(totalSavings / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-primary-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-warning border-warning/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-warning-foreground/80 text-sm font-medium">Deployed</p>
                    <p className="text-2xl font-bold text-warning-foreground">
                      {deployedCount}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-warning-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">In Pipeline</p>
                    <p className="text-2xl font-bold text-foreground">
                      {inDevelopmentCount + processes.filter(p => p.status === "Under Review").length}
                    </p>
                  </div>
                  <PlayCircle className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger value="processes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Process Pipeline
          </TabsTrigger>
          <TabsTrigger value="roi-calculator" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            ROI Calculator
          </TabsTrigger>
          <TabsTrigger value="approvals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-6">
          {/* Process Submission Pipeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Process Submission Pipeline</h2>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab('roi-calculator')}>
                  <Target className="w-4 h-4" />
                  ROI Calculator
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab('approvals')}>
                  <Users className="w-4 h-4" />
                  Approval Board
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Business process automation pipeline from idea submission to development handoff
            </p>
          </div>
          
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Process Overview
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Automation Roadmap
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Business Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Filters */}
              <Card className="bg-card border-border shadow-card">
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search processes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-muted border-border"
                        />
                      </div>
                      
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-40 bg-muted border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-muted border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {statusOptions.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-40 bg-muted border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {priorityOptions.map(priority => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="outline" className="border-border">
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Import
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Process Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProcesses.map((process) => (
                  <Card 
                    key={process.id} 
                    className="bg-gradient-card border-border shadow-card hover:shadow-elevated transition-all duration-300 group cursor-pointer"
                    onClick={() => handleProcessClick(process)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {process.id}
                          </Badge>
                          <Badge className={getPriorityColor(process.priority)}>
                            {process.priority}
                          </Badge>
                        </div>
                        <Badge className={getStatusColor(process.status)}>
                          {getStatusIcon(process.status)}
                          <span className="ml-1">{process.status}</span>
                        </Badge>
                      </div>
                      
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {process.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {process.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Department</span>
                        <Badge variant="outline" className="text-xs">
                          <Building className="w-3 h-3 mr-1" />
                          {process.department}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Expected ROI</span>
                          <span className="font-medium text-success">
                            ${(process.expectedROI / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Est. Savings</span>
                          <span className="font-medium text-primary">
                            ${(process.estimatedSavings / 1000).toFixed(0)}K
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Complexity</span>
                          <span className="text-xs">{process.complexity}</span>
                        </div>
                        <Progress 
                          value={process.complexity === "Low" ? 33 : process.complexity === "Medium" ? 66 : 100} 
                          className="h-2"
                        />
                      </div>

                      {process.dependencies.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Dependencies</span>
                          <div className="flex flex-wrap gap-1">
                            {process.dependencies.slice(0, 2).map(dep => (
                              <Badge key={dep} variant="secondary" className="text-xs">
                                <Link2 className="w-2 h-2 mr-1" />
                                {dep}
                              </Badge>
                            ))}
                            {process.dependencies.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{process.dependencies.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {process.submittedBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(process.submittedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="roadmap">
              <AutomationRoadmap />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-primary border-primary/30 shadow-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary-foreground">
                      <Brain className="w-5 h-5" />
                      AI Business Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-primary-foreground">
                    <div className="space-y-3">
                      <div className="p-3 bg-black/20 rounded-lg">
                        <p className="text-sm font-medium">High-Impact Opportunity</p>
                        <p className="text-xs opacity-90">Finance department shows 340% ROI potential for process automation</p>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg">
                        <p className="text-sm font-medium">Quick Win Identified</p>
                        <p className="text-xs opacity-90">Invoice processing automation can be deployed within 2 weeks</p>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg">
                        <p className="text-sm font-medium">Resource Optimization</p>
                        <p className="text-xs opacity-90">Current pipeline can save 2,400 hours annually across departments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-success" />
                      Success Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                        <span className="text-sm font-medium">Processes Automated</span>
                        <span className="text-lg font-bold text-success">12</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <span className="text-sm font-medium">Hours Saved/Month</span>
                        <span className="text-lg font-bold text-primary">1,200</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <span className="text-sm font-medium">Cost Reduction</span>
                        <span className="text-lg font-bold text-warning">$85K</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="roi-calculator" className="space-y-6">
          <BusinessROICalculator />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <ApprovalWorkflowBoard />
        </TabsContent>

      </Tabs>

      {/* Process Details Modal */}
      <Dialog open={isProcessDetailsOpen} onOpenChange={setIsProcessDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card border-border">
          {selectedProcess && (() => {
            const detailedProcess = getDetailedProcessData(selectedProcess)
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm font-mono">
                        {selectedProcess.id}
                      </Badge>
                      <Badge className={getPriorityColor(selectedProcess.priority)}>
                        {selectedProcess.priority}
                      </Badge>
                      <Badge className={getStatusColor(selectedProcess.status)}>
                        {getStatusIcon(selectedProcess.status)}
                        <span className="ml-1">{selectedProcess.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <DialogTitle className="text-2xl text-left">{selectedProcess.title}</DialogTitle>
                  <DialogDescription className="text-left">
                    {selectedProcess.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-muted">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="business-case">Business Case</TabsTrigger>
                      <TabsTrigger value="technical">Technical</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline & Risks</TabsTrigger>
                      <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-gradient-success border-success/30">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-success-foreground" />
                                <h3 className="font-semibold text-success-foreground">Financial Impact</h3>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-success-foreground/80">Expected ROI:</span>
                                  <span className="font-bold text-success-foreground">${(selectedProcess.expectedROI / 1000).toFixed(0)}K</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-success-foreground/80">Annual Savings:</span>
                                  <span className="font-bold text-success-foreground">${(selectedProcess.estimatedSavings / 1000).toFixed(0)}K</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-success-foreground/80">Payback Period:</span>
                                  <span className="font-bold text-success-foreground">8 months</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Building className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold">Process Details</h3>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Department:</span>
                                  <span className="font-medium">{selectedProcess.department}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Complexity:</span>
                                  <span className="font-medium">{selectedProcess.complexity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Submitted By:</span>
                                  <span className="font-medium">{selectedProcess.submittedBy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Submitted Date:</span>
                                  <span className="font-medium">{new Date(selectedProcess.submittedDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-primary" />
                            Dependencies & Tags
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">System Dependencies</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedProcess.dependencies.map(dep => (
                                <Badge key={dep} variant="outline" className="text-sm">
                                  <Link2 className="w-3 h-3 mr-1" />
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Process Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedProcess.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-sm">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="business-case" className="space-y-6 mt-6">
                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>Business Case</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-muted-foreground">{detailedProcess.businessCase}</p>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-card border-border">
                          <CardHeader>
                            <CardTitle className="text-lg">Current Process</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ol className="space-y-2">
                              {detailedProcess.currentProcess.map((step, index) => (
                                <li key={index} className="flex items-start gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-primary border-primary/30">
                          <CardHeader>
                            <CardTitle className="text-lg text-primary-foreground">Proposed Solution</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ol className="space-y-2">
                              {detailedProcess.proposedSolution.map((step, index) => (
                                <li key={index} className="flex items-start gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm text-primary-foreground">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>Expected Benefits</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {detailedProcess.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                                <span className="text-sm">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="technical" className="space-y-6 mt-6">
                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>Technical Requirements</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {detailedProcess.technicalRequirements.map((req, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                                <span className="text-sm">{req}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="timeline" className="space-y-6 mt-6">
                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>Project Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(detailedProcess.timeline).map(([phase, duration]) => (
                              <div key={phase} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <span className="font-medium">{phase}</span>
                                <Badge variant="outline">{duration}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>Risk Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {detailedProcess.risks.map((risk, index) => (
                              <div key={index} className="p-3 border border-border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{risk.risk}</span>
                                  <Badge className={risk.severity === "High" ? "bg-destructive/20 text-destructive-foreground" : 
                                    risk.severity === "Medium" ? "bg-warning/20 text-warning-foreground" : 
                                    "bg-success/20 text-success-foreground"}>
                                    {risk.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="stakeholders" className="space-y-6 mt-6">
                      <Card className="bg-card border-border">
                        <CardHeader>
                          <CardTitle>Project Stakeholders</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {detailedProcess.stakeholders.map((stakeholder, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium text-sm">
                                  {stakeholder.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="font-medium">{stakeholder.name}</p>
                                  <p className="text-sm text-muted-foreground">{stakeholder.role}</p>
                                  <p className="text-xs text-muted-foreground">{stakeholder.department}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsProcessDetailsOpen(false)}>
                    Close
                  </Button>
                  <Button className="bg-gradient-primary text-primary-foreground">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Move to Development
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}