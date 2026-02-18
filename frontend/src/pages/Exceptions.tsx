import { useState, useEffect } from "react"
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
import { useNavigate } from "react-router-dom"

// API Response Interface
interface ApiException {
  CreatedTime: string
  Message: string
  Serverity: string
  Status: string
  Subject: string
  Ticket_number: string
  assgin_name: string
  bot_name: string
}

interface ApiResponse {
  data: ApiException[]
  status: string
}

// Component Exception Interface
interface Exception {
  id: string
  timestamp: string
  process: string
  botId: string
  exceptionType: string
  rootCause: string
  status: string
  severity: string
  description: string
  // impact: string
  // frequency: number
  lastOccurrence: string
  resolution: string | null
  assignee: string
}

// Import centralized API utility
import { apiGet, parseJsonResponse } from "@/services/api"

// API function to fetch exceptions
const fetchExceptions = async (): Promise<Exception[]> => {
  try {
    const response = await apiGet("/api/get-exception")
    const apiData: ApiResponse = await parseJsonResponse<ApiResponse>(response)
    
    if (apiData.status !== "success" || !Array.isArray(apiData.data)) {
      throw new Error("Invalid API response format")
    }
    
    // Map API data to component format
    return apiData.data.map((item, index) => {
      // Convert date format from "11/13/2025" (MM/DD/YYYY) to proper date string
      let timestamp = new Date().toISOString()
      let lastOccurrence = new Date().toISOString()
      
      if (item.CreatedTime) {
        try {
          const dateParts = item.CreatedTime.split("/")
          if (dateParts.length === 3) {
            // MM/DD/YYYY format
            const month = dateParts[0].padStart(2, "0")
            const day = dateParts[1].padStart(2, "0")
            const year = dateParts[2]
            const dateObj = new Date(`${year}-${month}-${day}`)
            if (!isNaN(dateObj.getTime())) {
              timestamp = dateObj.toISOString()
              lastOccurrence = dateObj.toISOString()
            }
          } else {
            // Try to parse as-is
            const dateObj = new Date(item.CreatedTime)
            if (!isNaN(dateObj.getTime())) {
              timestamp = dateObj.toISOString()
              lastOccurrence = dateObj.toISOString()
            }
          }
        } catch (e) {
          console.warn("Failed to parse date:", item.CreatedTime)
        }
      }
      
      // Normalize severity and status to lowercase
      const severity = item.Serverity?.toLowerCase() || "medium"
      const status = item.Status?.toLowerCase() || "open"
      
      return {
        id: item.Ticket_number || `EXC-${String(index + 1).padStart(3, "0")}`,
        timestamp: timestamp,
        process: item.bot_name || "Unknown Process",
        botId: item.bot_name ? `BOT-${item.bot_name.toUpperCase().replace(/\s+/g, "-")}` : `BOT-${index + 1}`,
        exceptionType: item.Subject || "Exception",
        rootCause: item.Message || "No description provided",
        status: status,
        severity: severity,
        description: item.Message || "No description provided",
        // impact: "Process affected, requires attention",
        // frequency: 1, // Default frequency, can be calculated if API provides more data
        lastOccurrence: lastOccurrence,
        resolution: status === "resolved" || status === "closed" ? "Resolved" : null,
        assignee: item.assgin_name || "Unassigned"
      }
    })
  } catch (error) {
    console.error("Error fetching exceptions:", error)
    throw error
  }
}


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
  const navigate = useNavigate()
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [selectedException, setSelectedException] = useState<Exception | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProcess, setFilterProcess] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch exceptions on component mount
  useEffect(() => {
    const loadExceptions = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchExceptions()
        setExceptions(data)
        if (data.length > 0) {
          setSelectedException(data[0])
        }
      } catch (err) {
        console.error("Failed to load exceptions:", err)
        setError("Failed to load exceptions. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load exceptions from API",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadExceptions()
  }, [toast])

  // Refresh exceptions
  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchExceptions()
      setExceptions(data)
      if (data.length > 0 && (!selectedException || !data.find(e => e.id === selectedException.id))) {
        setSelectedException(data[0])
      }
      toast({
        title: "Refreshed",
        description: "Exception data has been refreshed"
      })
    } catch (err) {
      console.error("Failed to refresh exceptions:", err)
      setError("Failed to refresh exceptions. Please try again.")
      toast({
        title: "Error",
        description: "Failed to refresh exceptions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredExceptions = exceptions.filter(exception => {
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
    navigate("/tickets")
  }

  const handleRequestRuleChange = () => {
    navigate("/rules")
  }

  const handleCreateAnalytics = () => {
    navigate("/analytics")
  }

  // Calculate statistics from exceptions data
  const calculateStats = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    // Total exceptions
    const totalExceptions = exceptions.length

    // Exceptions created today
    const todayExceptions = exceptions.filter(e => {
      const exceptionDate = new Date(e.timestamp)
      return exceptionDate >= today
    }).length

    // Exceptions created yesterday
    const yesterdayExceptions = exceptions.filter(e => {
      const exceptionDate = new Date(e.timestamp)
      return exceptionDate >= yesterday && exceptionDate < today
    }).length

    // Total exceptions trend
    const totalTrend = yesterdayExceptions > 0 
      ? Math.round(((todayExceptions - yesterdayExceptions) / yesterdayExceptions) * 100)
      : todayExceptions > 0 ? 100 : 0

    // Open issues
    const openIssues = exceptions.filter(e => e.status === 'open').length

    // New open issues today
    const newOpenToday = exceptions.filter(e => {
      const exceptionDate = new Date(e.timestamp)
      return e.status === 'open' && exceptionDate >= today
    }).length

    // Resolution rate
    const resolvedCount = exceptions.filter(e => 
      e.status === 'resolved' || e.status === 'closed'
    ).length
    const resolutionRate = totalExceptions > 0 
      ? Math.round((resolvedCount / totalExceptions) * 100)
      : 0

    // Previous week resolution rate (for trend)
    const lastWeekExceptions = exceptions.filter(e => {
      const exceptionDate = new Date(e.timestamp)
      return exceptionDate >= lastWeek && exceptionDate < today
    })
    const lastWeekResolvedCount = lastWeekExceptions.filter(e => 
      e.status === 'resolved' || e.status === 'closed'
    ).length
    const lastWeekResolutionRate = lastWeekExceptions.length > 0
      ? Math.round((lastWeekResolvedCount / lastWeekExceptions.length) * 100)
      : 0
    const resolutionTrend = resolutionRate - lastWeekResolutionRate

    // MTTR (Mean Time To Recovery) - average time from creation to resolution
    // Since we don't have resolution timestamps, we calculate average age of resolved exceptions
    const resolvedExceptionsList = exceptions.filter(e => {
      const isResolved = e.status === 'resolved' || e.status === 'closed'
      return isResolved && e.timestamp
    })

    let mttrHours = 0
    if (resolvedExceptionsList.length > 0) {
      const totalRecoveryTime = resolvedExceptionsList.reduce((sum, e) => {
        const created = new Date(e.timestamp)
        const now = new Date()
        const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
        return sum + diffHours
      }, 0)
      mttrHours = totalRecoveryTime / resolvedExceptionsList.length
    }

    // Previous week MTTR for trend (average age of resolved exceptions from last week)
    const lastWeekResolvedList = lastWeekExceptions.filter(e => {
      const isResolved = e.status === 'resolved' || e.status === 'closed'
      return isResolved && e.timestamp
    })
    let lastWeekMttrHours = 0
    if (lastWeekResolvedList.length > 0) {
      const totalRecoveryTime = lastWeekResolvedList.reduce((sum, e) => {
        const created = new Date(e.timestamp)
        const now = new Date()
        const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
        return sum + diffHours
      }, 0)
      lastWeekMttrHours = totalRecoveryTime / lastWeekResolvedList.length
    }
    const mttrTrend = mttrHours - lastWeekMttrHours

    return {
      totalExceptions,
      totalTrend,
      openIssues,
      newOpenToday,
      resolutionRate,
      resolutionTrend,
      mttrHours,
      mttrTrend
    }
  }

  const stats = calculateStats()

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
            <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleCreateAnalytics}>
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
            {/* <Button className="bg-gradient-primary gap-2">
              <Zap className="w-4 h-4" />
              Quick Actions
            </Button> */}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exceptions</p>
                  <p className="text-2xl font-bold">{stats.totalExceptions}</p>
                  <p className={`text-xs ${stats.totalTrend < 0 ? 'text-success' : stats.totalTrend > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {stats.totalTrend !== 0 && (stats.totalTrend > 0 ? '+' : '')}
                    {stats.totalTrend}% from yesterday
                  </p>
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
                  <p className="text-2xl font-bold text-destructive">{stats.openIssues}</p>
                  <p className={`text-xs ${stats.newOpenToday > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {stats.newOpenToday > 0 ? '+' : ''}{stats.newOpenToday} new today
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          {/* <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                  <p className="text-2xl font-bold text-success">{stats.resolutionRate}%</p>
                  <p className={`text-xs ${stats.resolutionTrend > 0 ? 'text-success' : stats.resolutionTrend < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {stats.resolutionTrend !== 0 && (stats.resolutionTrend > 0 ? '+' : '')}
                    {stats.resolutionTrend}% this week
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card> */}
          
          {/* <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">MTTR</p>
                  <p className="text-2xl font-bold">
                    {stats.mttrHours > 0 
                      ? `${stats.mttrHours.toFixed(1)}h` 
                      : 'N/A'}
                  </p>
                  <p className={`text-xs ${stats.mttrTrend < 0 ? 'text-success' : stats.mttrTrend > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {stats.mttrTrend !== 0 && (
                      <>
                        {stats.mttrTrend < 0 ? '' : '+'}
                        {Math.abs(stats.mttrTrend).toFixed(1)}h {stats.mttrTrend < 0 ? 'improvement' : 'increase'}
                      </>
                    )}
                    {stats.mttrTrend === 0 && stats.mttrHours > 0 && 'No change'}
                    {stats.mttrHours === 0 && 'No resolved exceptions'}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card> */}
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
                {loading ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <div className="text-center space-y-2">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground">Loading exceptions...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <div className="text-center space-y-2">
                      <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
                      <p className="text-sm text-destructive">{error}</p>
                      <Button size="sm" variant="outline" onClick={handleRefresh}>
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : filteredExceptions.length === 0 ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <div className="text-center space-y-2">
                      <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No exceptions found</p>
                    </div>
                  </div>
                ) : (
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
                            selectedException?.id === exception.id 
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
                )}
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
              {!selectedException ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Select an exception to view details</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ticket ID</span>
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
                    
                    {/* <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Frequency (30d)</span>
                      <span className="text-sm font-semibold">{selectedException.frequency}x</span>
                    </div> */}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedException.description}
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={handleRequestRuleChange}
                      >
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
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pattern Analysis */}
        {/* <Card className="bg-gradient-card shadow-card">
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
        </Card> */}
      </div>
    </div>
  )
}