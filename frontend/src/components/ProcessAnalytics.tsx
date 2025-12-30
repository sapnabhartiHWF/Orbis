import { useState } from "react"
import { TrendingUp, Clock, CheckCircle, AlertCircle, BarChart3, Activity, Filter, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts"

interface ProcessMetrics {
  processName: string
  submissions: number
  completionRate: number
  avgCycleTime: number
  errorRate: number
  trend: number
  department: string
  status: "healthy" | "warning" | "critical"
}

const processMetrics: ProcessMetrics[] = []
/* [
  {
    processName: "Invoice Processing",
    submissions: 2847,
    completionRate: 97.2,
    avgCycleTime: 2.3,
    errorRate: 1.2,
    trend: 15.4,
    department: "Finance",
    status: "healthy"
  },
  {
    processName: "Customer Onboarding",
    submissions: 1534,
    completionRate: 94.8,
    avgCycleTime: 8.7,
    errorRate: 2.1,
    trend: 8.9,
    department: "Sales",
    status: "healthy"
  },
  {
    processName: "Expense Report Processing",
    submissions: 3241,
    completionRate: 89.4,
    avgCycleTime: 4.2,
    errorRate: 4.8,
    trend: -12.3,
    department: "Finance",
    status: "warning"
  },
  {
    processName: "IT Ticket Resolution",
    submissions: 1876,
    completionRate: 85.7,
    avgCycleTime: 15.6,
    errorRate: 6.2,
    trend: -8.7,
    department: "IT",
    status: "critical"
  },
  {
    processName: "Employee Data Update",
    submissions: 987,
    completionRate: 98.5,
    avgCycleTime: 1.8,
    errorRate: 0.8,
    trend: 22.1,
    department: "HR",
    status: "healthy"
  }
] */

const submissionTrendData = [
  { date: "2024-01", total: 0, successful: 0, failed: 0, automated: 0 },
  /*{ date: "2024-02", total: 0, successful: 0, failed: 0, automated: 0 },
  { date: "2024-03", total: 0, successful: 0, failed: 0, automated: 0 },
  { date: "2024-04", total: 0, successful: 0, failed: 0, automated: 0 },
  { date: "2024-05", total: 0, successful: 0, failed: 0, automated: 0 },
  { date: "2024-06", total: 0, successful: 0, failed: 0, automated: 0 } */
]

const cycleTimeAnalysis = [
  { process: "Invoice Processing", manual: 0, automated: 0, improvement: 0 },
  { process: "Customer Onboarding", manual: 0, automated: 0, improvement: 0 },
  { process: "Expense Reports", manual: 0, automated: 0, improvement: 0 },
  { process: "IT Tickets", manual: 0, automated: 0, improvement: 0 },
  { process: "Data Updates", manual: 0, automated: 0, improvement: 0 }
]

const completionRateData = [
  { week: "Week 1", rate: 0, target: 0, volume: 0 },
  { week: "Week 2", rate: 0, target: 0, volume: 0 },
  { week: "Week 3", rate: 0, target: 0, volume: 0 },
  { week: "Week 4", rate: 0, target: 0, volume: 0 },
  // { week: "Week 5", rate: 0, target: 0, volume: 0 },
  // { week: "Week 6", rate: 0, target: 0, volume: 0 }
]

const exceptionAnalysis = [
  { category: "Data Validation Errors", count: 0, percentage: 0, trend: 0 },
  { category: "System Integration Issues", count: 0, percentage: 0, trend: 0 },
  { category: "Business Rule Violations", count: 0, percentage: 0, trend: 0 },
  { category: "Timeout Errors", count: 0, percentage: 0, trend: 0 },
  { category: "Authentication Failures", count: 0, percentage: 0, trend: 0 }
]

const chartConfig = {
  total: { label: "Total Submissions", color: "hsl(var(--primary))" },
  successful: { label: "Successful", color: "hsl(var(--success))" },
  failed: { label: "Failed", color: "hsl(var(--destructive))" },
  automated: { label: "Automated", color: "hsl(var(--warning))" },
  rate: { label: "Completion Rate", color: "hsl(var(--success))" },
  target: { label: "Target", color: "hsl(var(--muted-foreground))" }
}

export function ProcessAnalytics() {
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [timeRange, setTimeRange] = useState("6months")
  const [selectedProcess, setSelectedProcess] = useState("all")

  const filteredMetrics = processMetrics.filter(process => 
    selectedDepartment === "all" || process.department === selectedDepartment
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-success"
      case "warning": return "text-warning"
      case "critical": return "text-destructive"
      default: return "text-muted-foreground"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy": return "bg-success/20 text-success border-success/30"
      case "warning": return "bg-warning/20 text-warning border-warning/30"
      case "critical": return "bg-destructive/20 text-destructive border-destructive/30"
      default: return "bg-muted/20 text-muted-foreground border-border"
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-success" />
    return <TrendingUp className="w-4 h-4 text-destructive rotate-180" />
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Process Analytics</h2>
          <p className="text-muted-foreground">Submission trends, completion rates, and cycle time analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Total Submissions</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {submissionTrendData[submissionTrendData.length - 1].total.toLocaleString()}
                </p>
                <p className="text-xs text-primary-foreground/80">This month</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-success-foreground">
                  {((submissionTrendData[submissionTrendData.length - 1].successful / submissionTrendData[submissionTrendData.length - 1].total) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-success-foreground/80">+0% from last month</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">Avg Cycle Time</p>
                <p className="text-2xl font-bold text-warning-foreground">0 min</p>
                <p className="text-xs text-warning-foreground/80">0% improvement</p>
              </div>
              <Clock className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Automation Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {((submissionTrendData[submissionTrendData.length - 1].automated / submissionTrendData[submissionTrendData.length - 1].total) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-success">0% from last month</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="trends">Submission Trends</TabsTrigger>
          <TabsTrigger value="performance">Process Performance</TabsTrigger>
          <TabsTrigger value="cycle-times">Cycle Times</TabsTrigger>
          <TabsTrigger value="exceptions">Exception Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Submission Volume Trend</CardTitle>
                <CardDescription>Monthly submission patterns and automation progress</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={submissionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stackId="1"
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.8}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="automated" 
                        stackId="2"
                        stroke="hsl(var(--warning))" 
                        fill="hsl(var(--warning))"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Success vs Failure Rate</CardTitle>
                <CardDescription>Weekly completion rate tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={completionRateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[90, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={3}
                        dot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="space-y-4">
            {filteredMetrics.map((process, index) => (
              <Card key={index} className="bg-card border-border shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{process.processName}</h3>
                      <Badge className={getStatusBadge(process.status)}>
                        {process.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{process.department}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(process.trend)}
                      <span className={`text-sm font-medium ${process.trend > 0 ? 'text-success' : 'text-destructive'}`}>
                        {Math.abs(process.trend).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Monthly Submissions</p>
                      <p className="text-2xl font-bold">{process.submissions.toLocaleString()}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{process.completionRate.toFixed(1)}%</p>
                        <CheckCircle className={`w-5 h-5 ${getStatusColor(process.status)}`} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Avg Cycle Time</p>
                      <p className="text-2xl font-bold">{process.avgCycleTime.toFixed(1)} min</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Error Rate</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{process.errorRate.toFixed(1)}%</p>
                        {process.errorRate > 5 && <AlertCircle className="w-5 h-5 text-destructive" />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cycle-times" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Cycle Time Improvement Analysis</CardTitle>
              <CardDescription>Comparison between manual and automated process times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cycleTimeAnalysis.map((item, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{item.process}</h4>
                      <Badge className="bg-success/20 text-success-foreground">
                        {item.improvement.toFixed(1)}% faster
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Manual Process</p>
                        <p className="text-xl font-bold text-destructive">{item.manual} min</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Automated Process</p>
                        <p className="text-xl font-bold text-success">{item.automated} min</p>
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-success h-2 rounded-full" 
                        style={{ width: `${item.improvement}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Exception Analysis</CardTitle>
              <CardDescription>Breakdown of process failures and error patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exceptionAnalysis.map((exception, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{exception.category}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-2xl font-bold">{exception.count}</span>
                        <span className="text-sm text-muted-foreground">
                          ({exception.percentage.toFixed(1)}% of total)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(exception.trend)}
                      <span className={`text-sm font-medium ${exception.trend > 0 ? 'text-destructive' : 'text-success'}`}>
                        {Math.abs(exception.trend).toFixed(1)}%
                      </span>
                    </div>
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