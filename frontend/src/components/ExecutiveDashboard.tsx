import { useState } from "react"
import { TrendingUp, DollarSign, Target, Users, Clock, BarChart3, AlertCircle, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface ExecutiveMetric {
  title: string
  value: string | number
  change: number
  trend: "up" | "down" | "stable"
  description: string
  icon: any
  color: string
}

const executiveMetrics: ExecutiveMetric[] = [
  {
    title: "Total ROI",
    value: "4.2x",
    change: 15.3,
    trend: "up",
    description: "Return on automation investment",
    icon: TrendingUp,
    color: "text-success"
  },
  {
    title: "Cost Savings YTD",
    value: "$2.4M",
    change: 23.7,
    trend: "up", 
    description: "Year-to-date cost reduction",
    icon: DollarSign,
    color: "text-success"
  },
  {
    title: "Processes Automated",
    value: "147",
    change: 8.9,
    trend: "up",
    description: "Total automated processes",
    icon: Target,
    color: "text-primary"
  },
  {
    title: "Active Bots",
    value: "89",
    change: 12.1,
    trend: "up",
    description: "Currently deployed automation",
    icon: Zap,
    color: "text-primary"
  },
  {
    title: "Avg. Processing Time",
    value: "2.3 min",
    change: -34.5,
    trend: "down",
    description: "Average task completion time",
    icon: Clock,
    color: "text-success"
  },
  {
    title: "Error Rate",
    value: "0.8%",
    change: -45.2,
    trend: "down",
    description: "Automation error percentage",
    icon: AlertCircle,
    color: "text-success"
  }
]

const kpiTrendData = [
  { month: "Jan", roi: 3.2, savings: 180000, processes: 125, efficiency: 87 },
  { month: "Feb", roi: 3.5, savings: 210000, processes: 130, efficiency: 89 },
  { month: "Mar", roi: 3.8, savings: 240000, processes: 135, efficiency: 91 },
  { month: "Apr", roi: 4.0, savings: 265000, processes: 140, efficiency: 92 },
  { month: "May", roi: 4.1, savings: 285000, processes: 145, efficiency: 94 },
  { month: "Jun", roi: 4.2, savings: 300000, processes: 147, efficiency: 95 }
]

const departmentPerformance = [
  { department: "Finance", automationRate: 85, savings: 680000, processes: 34, efficiency: 94 },
  { department: "Operations", automationRate: 78, savings: 520000, processes: 28, efficiency: 91 },
  { department: "HR", automationRate: 72, savings: 420000, processes: 22, efficiency: 89 },
  { department: "IT", automationRate: 90, savings: 380000, processes: 32, efficiency: 96 },
  { department: "Sales", automationRate: 68, savings: 340000, processes: 18, efficiency: 87 },
  { department: "Legal", automationRate: 55, savings: 220000, processes: 13, efficiency: 83 }
]

const businessImpactData = [
  { category: "Time Savings", value: 8760, unit: "hours/month", impact: "high" },
  { category: "FTE Capacity Released", value: 5.2, unit: "FTEs", impact: "high" },
  { category: "Customer Satisfaction", value: 4.7, unit: "/5.0", impact: "medium" },
  { category: "Compliance Score", value: 98.5, unit: "%", impact: "high" },
  { category: "Data Accuracy", value: 99.2, unit: "%", impact: "high" },
  { category: "Response Time", value: 2.3, unit: "minutes", impact: "medium" }
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))', 'hsl(var(--muted))']

const chartConfig = {
  roi: { label: "ROI", color: "hsl(var(--primary))" },
  savings: { label: "Savings", color: "hsl(var(--success))" },
  processes: { label: "Processes", color: "hsl(var(--warning))" },
  efficiency: { label: "Efficiency", color: "hsl(var(--accent))" }
}

export function ExecutiveDashboard() {
  const [timeRange, setTimeRange] = useState("6months")
  const [selectedMetric, setSelectedMetric] = useState("roi")

  const getTrendIcon = (trend: "up" | "down" | "stable", change: number) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-success" />
    if (trend === "down") return <TrendingUp className="w-4 h-4 text-success rotate-180" />
    return <div className="w-4 h-4" />
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-success"
      case "medium": return "text-warning"
      case "low": return "text-muted-foreground"
      default: return "text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Executive Dashboard</h2>
          <p className="text-muted-foreground">High-level COE performance metrics and KPIs</p>
        </div>
        <div className="flex items-center gap-4">
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

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {executiveMetrics.map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <Card key={index} className="bg-gradient-card border-border shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(metric.trend, metric.change)}
                        <span className={`text-sm font-medium ${metric.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {Math.abs(metric.change).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <IconComponent className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* KPI Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              KPI Trend Analysis
            </CardTitle>
            <CardDescription>Monthly performance metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roi">ROI Trend</SelectItem>
                  <SelectItem value="savings">Cost Savings</SelectItem>
                  <SelectItem value="processes">Process Count</SelectItem>
                  <SelectItem value="efficiency">Efficiency Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke={chartConfig[selectedMetric as keyof typeof chartConfig]?.color || "hsl(var(--primary))"} 
                    strokeWidth={3}
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Department Performance
            </CardTitle>
            <CardDescription>Automation adoption and performance by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentPerformance.map((dept, index) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{dept.department}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {dept.processes} processes
                      </Badge>
                      <span className="text-sm font-medium text-success">
                        ${(dept.savings / 1000).toFixed(0)}K saved
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Automation Rate</span>
                      <span>{dept.automationRate}%</span>
                    </div>
                    <Progress value={dept.automationRate} className="h-2" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Efficiency: {dept.efficiency}%</span>
                    <span>{dept.processes} automated processes</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Impact Metrics */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Business Impact Overview
          </CardTitle>
          <CardDescription>Key business outcomes from automation initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessImpactData.map((item, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-primary">
                    {typeof item.value === 'number' ? item.value.toFixed(item.value % 1 !== 0 ? 1 : 0) : item.value}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-lg">{item.category}</p>
                  <p className="text-sm text-muted-foreground">{item.unit}</p>
                  <Badge className={`mt-1 ${getImpactColor(item.impact)}`} variant="outline">
                    {item.impact.toUpperCase()} IMPACT
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Initiatives Progress */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader>
          <CardTitle>Strategic Initiatives Progress</CardTitle>
          <CardDescription>Current status of key automation programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">Digital Transformation Program</h4>
                <p className="text-sm text-muted-foreground">End-to-end process digitization across all departments</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
              </div>
              <Badge className="bg-warning/20 text-warning-foreground">In Progress</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">AI/ML Integration Initiative</h4>
                <p className="text-sm text-muted-foreground">Implementing intelligent automation with machine learning</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </div>
              <Badge className="bg-primary/20 text-primary-foreground">Planning</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">Customer Experience Automation</h4>
                <p className="text-sm text-muted-foreground">Automated customer service and support processes</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </div>
              <Badge className="bg-success/20 text-success-foreground">Near Completion</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}