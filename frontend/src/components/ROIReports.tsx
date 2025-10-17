import { useState } from "react"
import { TrendingUp, DollarSign, Calculator, Target, AlertTriangle, Calendar, BarChart3, PieChart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, Area } from "recharts"

interface ROIProject {
  id: string
  name: string
  department: string
  investmentActual: number
  investmentProjected: number
  savingsActual: number
  savingsProjected: number
  roiActual: number
  roiProjected: number
  status: "completed" | "ongoing" | "planned"
  completionDate: string
  paybackPeriod: number
  variance: number
}

const roiProjects: ROIProject[] = [
  {
    id: "ROI-001",
    name: "Invoice Processing Automation",
    department: "Finance",
    investmentActual: 150000,
    investmentProjected: 180000,
    savingsActual: 680000,
    savingsProjected: 620000,
    roiActual: 4.53,
    roiProjected: 3.44,
    status: "completed",
    completionDate: "2024-03-15",
    paybackPeriod: 3.2,
    variance: 31.7
  },
  {
    id: "ROI-002", 
    name: "Customer Onboarding Automation",
    department: "Sales",
    investmentActual: 220000,
    investmentProjected: 200000,
    savingsActual: 450000,
    savingsProjected: 480000,
    roiActual: 2.05,
    roiProjected: 2.40,
    status: "completed",
    completionDate: "2024-02-28",
    paybackPeriod: 5.9,
    variance: -14.6
  },
  {
    id: "ROI-003",
    name: "HR Data Management System",
    department: "HR",
    investmentActual: 180000,
    investmentProjected: 160000,
    savingsActual: 320000,
    savingsProjected: 380000,
    roiActual: 1.78,
    roiProjected: 2.38,
    status: "ongoing",
    completionDate: "2024-07-30",
    paybackPeriod: 6.8,
    variance: -25.2
  },
  {
    id: "ROI-004",
    name: "IT Service Desk Automation",
    department: "IT",
    investmentActual: 95000,
    investmentProjected: 120000,
    savingsActual: 420000,
    savingsProjected: 360000,
    roiActual: 4.42,
    roiProjected: 3.00,
    status: "completed",
    completionDate: "2024-01-15",
    paybackPeriod: 2.7,
    variance: 47.3
  },
  {
    id: "ROI-005",
    name: "Supply Chain Optimization",
    department: "Operations",
    investmentActual: 0,
    investmentProjected: 280000,
    savingsActual: 0,
    savingsProjected: 540000,
    roiActual: 0,
    roiProjected: 1.93,
    status: "planned",
    completionDate: "2024-12-31",
    paybackPeriod: 6.2,
    variance: 0
  }
]

const monthlyROIData = [
  { month: "Jan", actualROI: 2800000, projectedROI: 2400000, cumulativeActual: 2800000, cumulativeProjected: 2400000 },
  { month: "Feb", actualROI: 3200000, projectedROI: 2800000, cumulativeActual: 6000000, cumulativeProjected: 5200000 },
  { month: "Mar", actualROI: 3800000, projectedROI: 3400000, cumulativeActual: 9800000, cumulativeProjected: 8600000 },
  { month: "Apr", actualROI: 4100000, projectedROI: 3800000, cumulativeActual: 13900000, cumulativeProjected: 12400000 },
  { month: "May", actualROI: 4500000, projectedROI: 4200000, cumulativeActual: 18400000, cumulativeProjected: 16600000 },
  { month: "Jun", actualROI: 4800000, projectedROI: 4600000, cumulativeActual: 23200000, cumulativeProjected: 21200000 }
]

const costSavingsBreakdown = [
  { category: "Labor Cost Reduction", actual: 8900000, projected: 8200000, percentage: 42.3 },
  { category: "Process Efficiency", actual: 5600000, projected: 6100000, percentage: 26.6 },
  { category: "Error Reduction", actual: 3800000, projected: 3400000, percentage: 18.1 },
  { category: "Time Savings", actual: 2100000, projected: 1900000, percentage: 10.0 },
  { category: "Compliance & Risk", actual: 620000, projected: 580000, percentage: 2.9 }
]

const departmentROIComparison = [
  { 
    department: "Finance", 
    investment: 350000, 
    actualSavings: 1100000, 
    projectedSavings: 1000000,
    roi: 3.14,
    projects: 3,
    variance: 10.0
  },
  {
    department: "Sales",
    investment: 220000,
    actualSavings: 450000,
    projectedSavings: 480000,
    roi: 2.05,
    projects: 1,
    variance: -6.3
  },
  {
    department: "IT",
    investment: 95000,
    actualSavings: 420000,
    projectedSavings: 360000,
    roi: 4.42,
    projects: 1,
    variance: 16.7
  },
  {
    department: "HR",
    investment: 180000,
    actualSavings: 320000,
    projectedSavings: 380000,
    roi: 1.78,
    projects: 1,
    variance: -15.8
  }
]

const chartConfig = {
  actualROI: { label: "Actual ROI", color: "hsl(var(--success))" },
  projectedROI: { label: "Projected ROI", color: "hsl(var(--primary))" },
  cumulativeActual: { label: "Cumulative Actual", color: "hsl(var(--success))" },
  cumulativeProjected: { label: "Cumulative Projected", color: "hsl(var(--primary))" },
  actual: { label: "Actual Savings", color: "hsl(var(--success))" },
  projected: { label: "Projected Savings", color: "hsl(var(--warning))" }
}

export function ROIReports() {
  const [timeRange, setTimeRange] = useState("ytd")
  const [selectedView, setSelectedView] = useState("overview")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  const completedProjects = roiProjects.filter(p => p.status === "completed")
  
  const totalInvestmentActual = completedProjects.reduce((sum, p) => sum + p.investmentActual, 0)
  const totalSavingsActual = completedProjects.reduce((sum, p) => sum + p.savingsActual, 0)
  const totalInvestmentProjected = completedProjects.reduce((sum, p) => sum + p.investmentProjected, 0)
  const totalSavingsProjected = completedProjects.reduce((sum, p) => sum + p.savingsProjected, 0)
  
  const overallROIActual = totalSavingsActual / totalInvestmentActual
  const overallROIProjected = totalSavingsProjected / totalInvestmentProjected
  const overallVariance = ((overallROIActual - overallROIProjected) / overallROIProjected) * 100

  const getVarianceColor = (variance: number) => {
    if (variance > 10) return "text-success"
    if (variance > 0) return "text-warning"
    return "text-destructive"
  }

  const getVarianceBadge = (variance: number) => {
    if (variance > 10) return "bg-success/20 text-success border-success/30"
    if (variance > 0) return "bg-warning/20 text-warning border-warning/30"
    return "bg-destructive/20 text-destructive border-destructive/30"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/20 text-success border-success/30"
      case "ongoing": return "bg-warning/20 text-warning border-warning/30"
      case "planned": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default: return "bg-muted/20 text-muted-foreground border-border"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ROI Reports</h2>
          <p className="text-muted-foreground">Actual vs projected returns and cost savings analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="qtd">Quarter to Date</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="1year">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Actual ROI</p>
                <p className="text-2xl font-bold text-success-foreground">
                  {overallROIActual.toFixed(2)}x
                </p>
                <p className="text-xs text-success-foreground/80">
                  vs {overallROIProjected.toFixed(2)}x projected
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
                <p className="text-primary-foreground/80 text-sm font-medium">Total Savings</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  ${(totalSavingsActual / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-primary-foreground/80">
                  ${(totalInvestmentActual / 1000000).toFixed(1)}M invested
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${getVarianceBadge(overallVariance)} shadow-glow`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${getVarianceColor(overallVariance)}`}>Performance</p>
                <p className={`text-2xl font-bold ${getVarianceColor(overallVariance)}`}>
                  {overallVariance > 0 ? '+' : ''}{overallVariance.toFixed(1)}%
                </p>
                <p className={`text-xs ${getVarianceColor(overallVariance)}`}>
                  vs projection
                </p>
              </div>
              <Target className={`w-8 h-8 ${getVarianceColor(overallVariance)}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Avg Payback</p>
                <p className="text-2xl font-bold text-foreground">
                  {(completedProjects.reduce((sum, p) => sum + p.paybackPeriod, 0) / completedProjects.length).toFixed(1)} mo
                </p>
                <p className="text-xs text-muted-foreground">
                  {completedProjects.length} projects
                </p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="overview">ROI Overview</TabsTrigger>
          <TabsTrigger value="projects">Project Analysis</TabsTrigger>
          <TabsTrigger value="savings">Cost Savings</TabsTrigger>
          <TabsTrigger value="departments">Department ROI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  ROI Trend: Actual vs Projected
                </CardTitle>
                <CardDescription>Monthly ROI performance comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyROIData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="actualROI" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={3}
                        dot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projectedROI" 
                        stroke="hsl(var(--primary))" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Cumulative Savings
                </CardTitle>
                <CardDescription>Year-to-date cumulative savings growth</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyROIData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cumulativeActual" fill="hsl(var(--success))" fillOpacity={0.8} />
                      <Line 
                        type="monotone" 
                        dataKey="cumulativeProjected" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* ROI Performance Summary */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>ROI Performance Summary</CardTitle>
              <CardDescription>Key performance indicators vs targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Investment Accuracy</p>
                    <div className="flex items-center gap-2">
                      <Progress value={78} className="flex-1 h-3" />
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Projects within ±20% of budget
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Savings Achievement</p>
                    <div className="flex items-center gap-2">
                      <Progress value={112} className="flex-1 h-3" />
                      <span className="text-sm font-medium text-success">112%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exceeded projected savings
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ROI Target Achievement</p>
                    <div className="flex items-center gap-2">
                      <Progress value={118} className="flex-1 h-3" />
                      <span className="text-sm font-medium text-success">118%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Above target ROI performance
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payback Speed</p>
                    <div className="flex items-center gap-2">
                      <Progress value={89} className="flex-1 h-3" />
                      <span className="text-sm font-medium">89%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Faster than projected payback
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-success/10 rounded-lg border border-success/30">
                    <h4 className="font-semibold text-success">Portfolio Health</h4>
                    <p className="text-2xl font-bold text-success mt-1">Excellent</p>
                    <p className="text-sm text-success/80 mt-1">
                      Strong ROI performance across all initiatives
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="space-y-4">
            {roiProjects.map((project, index) => (
              <Card key={index} className="bg-card border-border shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <Badge className={getStatusBadge(project.status)}>
                        {project.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{project.department}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getVarianceBadge(project.variance)}>
                        {project.variance > 0 ? '+' : ''}{project.variance.toFixed(1)}% variance
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Investment</p>
                      <p className="text-lg font-bold">
                        ${(project.investmentActual / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-muted-foreground">
                        vs ${(project.investmentProjected / 1000).toFixed(0)}K projected
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Savings</p>
                      <p className="text-lg font-bold text-success">
                        ${(project.savingsActual / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-muted-foreground">
                        vs ${(project.savingsProjected / 1000).toFixed(0)}K projected
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Actual ROI</p>
                      <p className="text-lg font-bold text-primary">
                        {project.roiActual.toFixed(2)}x
                      </p>
                      <p className="text-xs text-muted-foreground">
                        vs {project.roiProjected.toFixed(2)}x projected
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Payback Period</p>
                      <p className="text-lg font-bold">{project.paybackPeriod.toFixed(1)} mo</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-lg font-bold">{project.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.status === "completed" ? "Completed" : "Target"}: {new Date(project.completionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="savings" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Cost Savings Breakdown
              </CardTitle>
              <CardDescription>Analysis of savings by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costSavingsBreakdown.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          ${(category.actual / 1000000).toFixed(1)}M actual
                        </span>
                        <Badge variant="outline" className={
                          category.actual > category.projected ? 'border-success/50 text-success' : 
                          'border-warning/50 text-warning'
                        }>
                          {((category.actual / category.projected - 1) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={category.percentage} className="h-3" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{category.percentage.toFixed(1)}% of total</span>
                        <span>Projected: ${(category.projected / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departmentROIComparison.map((dept, index) => (
              <Card key={index} className="bg-card border-border shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {dept.department}
                    <Badge className={getVarianceBadge(dept.variance)}>
                      {dept.variance > 0 ? '+' : ''}{dept.variance.toFixed(1)}%
                    </Badge>
                  </CardTitle>
                  <CardDescription>{dept.projects} automation project{dept.projects !== 1 ? 's' : ''}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Investment</p>
                      <p className="text-xl font-bold">${(dept.investment / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ROI</p>
                      <p className="text-xl font-bold text-success">{dept.roi.toFixed(2)}x</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Savings Performance</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Actual: ${(dept.actualSavings / 1000).toFixed(0)}K</span>
                        <span>Target: ${(dept.projectedSavings / 1000).toFixed(0)}K</span>
                      </div>
                      <Progress 
                        value={(dept.actualSavings / dept.projectedSavings) * 100} 
                        className="h-3" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}