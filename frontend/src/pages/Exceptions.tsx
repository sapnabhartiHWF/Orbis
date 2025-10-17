import { useState } from "react"
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Bot, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Eye,
  FileText,
  Settings,
  Zap,
  RefreshCw,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pause,
  ChevronRight,
  Calendar,
  User,
  Target,
  Lightbulb,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createTicketFromException } from "@/utils/ticketExceptionIntegration"

// Mock exception data
const mockExceptions = [
  {
    id: "EXC-001",
    timestamp: "2024-01-15 14:30:22",
    process: "Invoice Processing",
    botId: "BOT-INV-01",
    exceptionType: "Validation Error",
    rootCause: "Invalid vendor code format",
    status: "open",
    severity: "high",
    description: "Vendor code 'ABC@123' contains invalid special characters",
    impact: "Process halted, manual intervention required",
    frequency: 15,
    lastOccurrence: "2024-01-15 14:30:22",
    resolution: null,
    assignee: "Sarah Chen"
  },
  {
    id: "EXC-002", 
    timestamp: "2024-01-15 13:45:10",
    process: "Customer Onboarding",
    botId: "BOT-CRM-02",
    exceptionType: "Data Missing",
    rootCause: "Required field 'tax_id' not provided",
    status: "investigating",
    severity: "medium",
    description: "Customer record missing mandatory tax identification number",
    impact: "Onboarding delayed, customer notified",
    frequency: 8,
    lastOccurrence: "2024-01-15 13:45:10",
    resolution: "Pending customer response",
    assignee: "Mike Johnson"
  },
  {
    id: "EXC-003",
    timestamp: "2024-01-15 12:15:33",
    process: "Report Generation",
    botId: "BOT-RPT-03",
    exceptionType: "System Error",
    rootCause: "Database connection timeout",
    status: "resolved",
    severity: "low",
    description: "Connection to analytics database timed out after 30 seconds",
    impact: "Report generation delayed by 5 minutes",
    frequency: 23,
    lastOccurrence: "2024-01-15 12:15:33",
    resolution: "Database connection pool increased",
    assignee: "David Liu"
  },
  {
    id: "EXC-004",
    timestamp: "2024-01-15 11:20:45",
    process: "Email Automation",
    botId: "BOT-EMAIL-01",
    exceptionType: "Business Rule",
    rootCause: "Recipient email domain blocked",
    status: "open",
    severity: "medium",
    description: "Email domain 'temp-mail.org' is on blocked domain list",
    impact: "Email not sent, customer not notified",
    frequency: 5,
    lastOccurrence: "2024-01-15 11:20:45",
    resolution: null,
    assignee: "Anna Smith"
  }
]

// Pattern analysis data
const exceptionPatterns = [
  {
    pattern: "Validation Errors",
    count: 45,
    trend: 15,
    percentage: 35,
    topCause: "Invalid data format",
    suggestion: "Implement input sanitization rules"
  },
  {
    pattern: "System Timeouts", 
    count: 28,
    trend: -8,
    percentage: 22,
    topCause: "Database connection issues",
    suggestion: "Increase connection pool size"
  },
  {
    pattern: "Missing Data",
    count: 32,
    trend: 12,
    percentage: 25,
    topCause: "Incomplete source data",
    suggestion: "Add data completeness validation"
  },
  {
    pattern: "Business Rules",
    count: 23,
    trend: -3,
    percentage: 18,
    topCause: "Rule configuration mismatch",
    suggestion: "Review and update business rules"
  }
]

export default function Exceptions() {
  const [selectedException, setSelectedException] = useState(mockExceptions[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProcess, setFilterProcess] = useState("all")
  const { toast } = useToast()

  const filteredExceptions = mockExceptions.filter(exception => {
    const matchesSearch = exception.exceptionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exception.process.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exception.rootCause.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = filterSeverity === "all" || exception.severity === filterSeverity
    const matchesStatus = filterStatus === "all" || exception.status === filterStatus
    const matchesProcess = filterProcess === "all" || exception.process === filterProcess
    return matchesSearch && matchesSeverity && matchesStatus && matchesProcess
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20'
      case 'medium': return 'text-warning bg-warning/10 border-warning/20'
      case 'low': return 'text-success bg-success/10 border-success/20'
      default: return 'text-muted-foreground bg-muted/10 border-border'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-destructive bg-destructive/10 border-destructive/20'
      case 'investigating': return 'text-warning bg-warning/10 border-warning/20'
      case 'resolved': return 'text-success bg-success/10 border-success/20'
      case 'closed': return 'text-muted-foreground bg-muted/10 border-border'
      default: return 'text-muted-foreground bg-muted/10 border-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <XCircle className="w-4 h-4" />
      case 'investigating': return <Pause className="w-4 h-4" />
      case 'resolved': return <CheckCircle2 className="w-4 h-4" />
      case 'closed': return <CheckCircle2 className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const handleCreateTicket = () => {
    const ticketData = createTicketFromException(selectedException)
    toast({
      title: "Ticket Created",
      description: `Ticket created for exception ${selectedException.id}. Navigate to Tickets to view and manage.`
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Exception Management</h1>
            <p className="text-muted-foreground">AI-powered pattern analysis and error reduction</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
            <Button className="bg-gradient-primary gap-2">
              <Zap className="w-4 h-4" />
              Quick Actions
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exceptions</p>
                  <p className="text-2xl font-bold">128</p>
                  <p className="text-xs text-success">-12% from yesterday</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Issues</p>
                  <p className="text-2xl font-bold text-destructive">23</p>
                  <p className="text-xs text-destructive">+3 new today</p>
                </div>
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                  <p className="text-2xl font-bold text-success">87%</p>
                  <p className="text-xs text-success">+5% this week</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">MTTR</p>
                  <p className="text-2xl font-bold">2.4h</p>
                  <p className="text-xs text-success">-0.5h improvement</p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exception List */}
          <Card className="lg:col-span-2 bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Exception Log
              </CardTitle>
              
              {/* Filters */}
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exceptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exception</TableHead>
                      <TableHead>Process</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExceptions.map((exception) => (
                      <TableRow 
                        key={exception.id}
                        className={`cursor-pointer transition-colors ${
                          selectedException.id === exception.id 
                            ? 'bg-primary/5 border-l-4 border-l-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedException(exception)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{exception.exceptionType}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {exception.rootCause}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{exception.process}</div>
                            <div className="text-xs text-muted-foreground">{exception.botId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(exception.severity)}>
                            {exception.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${getStatusColor(exception.status)}`}>
                            {getStatusIcon(exception.status)}
                            <span className="text-sm capitalize">{exception.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(exception.timestamp).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Exception Details Panel */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Exception Details
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Exception ID</span>
                  <span className="font-mono text-sm">{selectedException.id}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Severity</span>
                  <Badge className={getSeverityColor(selectedException.severity)}>
                    {selectedException.severity}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className={`flex items-center gap-2 ${getStatusColor(selectedException.status)}`}>
                    {getStatusIcon(selectedException.status)}
                    <span className="text-sm capitalize">{selectedException.status}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assignee</span>
                  <span className="text-sm">{selectedException.assignee}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Frequency (30d)</span>
                  <span className="text-sm font-semibold">{selectedException.frequency}x</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedException.description}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Impact</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedException.impact}
                </p>
              </div>
              
              {selectedException.resolution && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Resolution</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedException.resolution}
                  </p>
                </div>
              )}
              
              <Separator />
              
              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Quick Actions</h4>
                <div className="space-y-2">
                  <Button size="sm" className="w-full justify-start gap-2" onClick={handleCreateTicket}>
                    <FileText className="w-4 h-4" />
                    Create Ticket
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                    <Settings className="w-4 h-4" />
                    Request Rule Change
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                    <Target className="w-4 h-4" />
                    Escalate to Governance
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                    <Lightbulb className="w-4 h-4" />
                    AI Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pattern Analysis */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Pattern Analysis & AI Insights
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="patterns" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="patterns">Exception Patterns</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="patterns">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {exceptionPatterns.map((pattern, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">{pattern.pattern}</h4>
                            <div className={`flex items-center gap-1 text-xs ${
                              pattern.trend > 0 ? 'text-destructive' : 'text-success'
                            }`}>
                              {pattern.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(pattern.trend)}%
                            </div>
                          </div>
                          
                          <div className="text-2xl font-bold">{pattern.count}</div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">of total</span>
                              <span>{pattern.percentage}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-gradient-primary h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${pattern.percentage}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            <strong>Top cause:</strong> {pattern.topCause}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="insights">
                <div className="space-y-4">
                  <Card className="border-warning/20 bg-warning/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="font-semibold text-warning">High-Frequency Pattern Detected</h4>
                          <p className="text-sm text-muted-foreground">
                            Validation errors have increased by 15% over the past week. The primary cause is invalid vendor code formats 
                            in the Invoice Processing workflow. This pattern affects 35% of all exceptions.
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm" className="bg-gradient-primary">
                              Create Action Plan
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="font-semibold text-primary">Improvement Opportunity</h4>
                          <p className="text-sm text-muted-foreground">
                            System timeout exceptions have decreased by 8% after recent infrastructure improvements. 
                            Consider applying similar optimizations to other processes showing timeout patterns.
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              View Success Metrics
                            </Button>
                            <Button size="sm" className="bg-gradient-primary">
                              Replicate Solution
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="recommendations">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exceptionPatterns.map((pattern, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{pattern.pattern}</h4>
                            <Badge variant="outline" className="text-xs">
                              {pattern.count} occurrences
                            </Badge>
                          </div>
                          
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                              <div>
                                <h5 className="text-sm font-medium">AI Suggestion</h5>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {pattern.suggestion}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              Review
                            </Button>
                            <Button size="sm" className="flex-1 bg-gradient-primary">
                              Implement
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}