import { useState } from "react"
import { Building, TrendingUp, Users, Target, BarChart3, PieChart, Activity, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, RadialBarChart, RadialBar, Treemap } from "recharts"

interface DepartmentData {
  id: string
  name: string
  totalProcesses: number
  automatedProcesses: number
  automationRate: number
  totalROI: number
  costSavings: number
  avgCycleTime: number
  errorReduction: number
  employeeCount: number
  processesPerEmployee: number
  maturityLevel: "Basic" | "Intermediate" | "Advanced" | "Expert"
  topProcesses: string[]
  challenges: string[]
  opportunities: string[]
  quarterlyGrowth: number
}

const departmentData: DepartmentData[] = [
  {
    id: "finance",
    name: "Finance",
    totalProcesses: 45,
    automatedProcesses: 38,
    automationRate: 84.4,
    totalROI: 2400000,
    costSavings: 680000,
    avgCycleTime: 2.3,
    errorReduction: 92.5,
    employeeCount: 125,
    processesPerEmployee: 0.36,
    maturityLevel: "Advanced",
    topProcesses: ["Invoice Processing", "Expense Reports", "Budget Planning", "Financial Reporting"],
    challenges: ["Legacy system integration", "Compliance requirements", "Data quality"],
    opportunities: ["AP/AR automation", "Predictive analytics", "Real-time reporting"],
    quarterlyGrowth: 18.7
  },
  {
    id: "operations",
    name: "Operations",
    totalProcesses: 52,
    automatedProcesses: 39,
    automationRate: 75.0,
    totalROI: 1800000,
    costSavings: 520000,
    avgCycleTime: 4.1,
    errorReduction: 87.3,
    employeeCount: 200,
    processesPerEmployee: 0.26,
    maturityLevel: "Intermediate",
    topProcesses: ["Supply Chain", "Inventory Management", "Quality Control", "Reporting"],
    challenges: ["Process standardization", "Vendor management", "Real-time visibility"],
    opportunities: ["IoT integration", "Predictive maintenance", "Supply chain optimization"],
    quarterlyGrowth: 12.4
  },
  {
    id: "hr",
    name: "Human Resources",
    totalProcesses: 28,
    automatedProcesses: 20,
    automationRate: 71.4,
    totalROI: 920000,
    costSavings: 320000,
    avgCycleTime: 6.8,
    errorReduction: 89.1,
    employeeCount: 45,
    processesPerEmployee: 0.62,
    maturityLevel: "Intermediate",
    topProcesses: ["Employee Onboarding", "Payroll Processing", "Performance Reviews", "Benefits Admin"],
    challenges: ["Employee experience", "Compliance tracking", "Data privacy"],
    opportunities: ["AI-powered recruitment", "Employee self-service", "Predictive analytics"],
    quarterlyGrowth: 22.1
  },
  {
    id: "it",
    name: "Information Technology",
    totalProcesses: 35,
    automatedProcesses: 32,
    automationRate: 91.4,
    totalROI: 1650000,
    costSavings: 420000,
    avgCycleTime: 1.9,
    errorReduction: 95.2,
    employeeCount: 85,
    processesPerEmployee: 0.41,
    maturityLevel: "Expert",
    topProcesses: ["Incident Management", "User Provisioning", "System Monitoring", "Backup & Recovery"],
    challenges: ["Legacy system modernization", "Security compliance", "Skill gaps"],
    opportunities: ["AI/ML automation", "Cloud migration", "DevOps enhancement"],
    quarterlyGrowth: 15.8
  },
  {
    id: "sales",
    name: "Sales & Marketing",
    totalProcesses: 22,
    automatedProcesses: 15,
    automationRate: 68.2,
    totalROI: 1200000,
    costSavings: 280000,
    avgCycleTime: 8.4,
    errorReduction: 78.6,
    employeeCount: 150,
    processesPerEmployee: 0.15,
    maturityLevel: "Basic",
    topProcesses: ["Lead Qualification", "Customer Onboarding", "Campaign Management", "Sales Reporting"],
    challenges: ["Lead quality", "Customer data management", "Attribution tracking"],
    opportunities: ["Marketing automation", "CRM integration", "Predictive lead scoring"],
    quarterlyGrowth: 8.9
  },
  {
    id: "legal",
    name: "Legal & Compliance",
    totalProcesses: 18,
    automatedProcesses: 10,
    automationRate: 55.6,
    totalROI: 580000,
    costSavings: 180000,
    avgCycleTime: 12.7,
    errorReduction: 82.4,
    employeeCount: 25,
    processesPerEmployee: 0.72,
    maturityLevel: "Basic",
    topProcesses: ["Contract Review", "Compliance Monitoring", "Document Management", "Risk Assessment"],
    challenges: ["Document processing", "Regulatory changes", "Risk management"],
    opportunities: ["AI contract analysis", "Automated compliance", "Risk prediction"],
    quarterlyGrowth: 5.3
  }
]

const crossDepartmentData = [
  { process: "Employee Data Updates", departments: ["HR", "IT", "Finance"], complexity: "Medium", roi: 180000 },
  { process: "Vendor Management", departments: ["Operations", "Finance", "Legal"], complexity: "High", roi: 320000 },
  { process: "Customer Onboarding", departments: ["Sales", "Operations", "Legal"], complexity: "High", roi: 450000 },
  { process: "Budget Planning", departments: ["Finance", "Operations", "HR"], complexity: "Medium", roi: 280000 },
  { process: "Compliance Reporting", departments: ["Legal", "Finance", "Operations"], complexity: "High", roi: 220000 }
]

const maturityLevelData = [
  { level: "Basic", count: 2, percentage: 33.3, color: "hsl(var(--destructive))" },
  { level: "Intermediate", count: 2, percentage: 33.3, color: "hsl(var(--warning))" },
  { level: "Advanced", count: 1, percentage: 16.7, color: "hsl(var(--success))" },
  { level: "Expert", count: 1, percentage: 16.7, color: "hsl(var(--primary))" }
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))', 'hsl(var(--muted))']

const chartConfig = {
  automationRate: { label: "Automation Rate", color: "hsl(var(--primary))" },
  roi: { label: "ROI", color: "hsl(var(--success))" },
  savings: { label: "Cost Savings", color: "hsl(var(--warning))" },
  processes: { label: "Processes", color: "hsl(var(--accent))" }
}

export function DepartmentInsights() {
  const [selectedMetric, setSelectedMetric] = useState("automationRate")
  const [selectedView, setSelectedView] = useState("overview")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  const filteredData = selectedDepartment === "all" 
    ? departmentData 
    : departmentData.filter(dept => dept.id === selectedDepartment)

  const totalROI = departmentData.reduce((sum, dept) => sum + dept.totalROI, 0)
  const totalSavings = departmentData.reduce((sum, dept) => sum + dept.costSavings, 0)
  const avgAutomationRate = departmentData.reduce((sum, dept) => sum + dept.automationRate, 0) / departmentData.length
  
  const getMaturityColor = (level: string) => {
    switch (level) {
      case "Expert": return "text-primary"
      case "Advanced": return "text-success"
      case "Intermediate": return "text-warning"
      case "Basic": return "text-destructive"
      default: return "text-muted-foreground"
    }
  }

  const getMaturityBadge = (level: string) => {
    switch (level) {
      case "Expert": return "bg-primary/20 text-primary border-primary/30"
      case "Advanced": return "bg-success/20 text-success border-success/30"
      case "Intermediate": return "bg-warning/20 text-warning border-warning/30"
      case "Basic": return "bg-destructive/20 text-destructive border-destructive/30"
      default: return "bg-muted/20 text-muted-foreground border-border"
    }
  }

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 85) return { label: "Excellent", color: "text-success" }
    if (rate >= 70) return { label: "Good", color: "text-warning" }
    if (rate >= 50) return { label: "Fair", color: "text-destructive" }
    return { label: "Needs Improvement", color: "text-destructive" }
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Department Insights</h2>
          <p className="text-muted-foreground">Cross-departmental automation coverage and performance analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentData.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Departments</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {departmentData.length}
                </p>
                <p className="text-xs text-primary-foreground/80">Active automation programs</p>
              </div>
              <Building className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Avg Automation</p>
                <p className="text-2xl font-bold text-success-foreground">
                  {avgAutomationRate.toFixed(1)}%
                </p>
                <p className="text-xs text-success-foreground/80">Cross-department average</p>
              </div>
              <Target className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">Total ROI</p>
                <p className="text-2xl font-bold text-warning-foreground">
                  ${(totalROI / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-warning-foreground/80">Enterprise-wide</p>
              </div>
              <TrendingUp className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Cost Savings</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(totalSavings / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground">Annual savings</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="overview">Department Overview</TabsTrigger>
          <TabsTrigger value="comparison">Performance Comparison</TabsTrigger>
          <TabsTrigger value="maturity">Maturity Analysis</TabsTrigger>
          <TabsTrigger value="cross-dept">Cross-Department</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredData.map((department) => {
              const performance = getPerformanceLevel(department.automationRate)
              return (
                <Card key={department.id} className="bg-card border-border shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      <Badge className={getMaturityBadge(department.maturityLevel)}>
                        {department.maturityLevel}
                      </Badge>
                    </div>
                    <CardDescription>
                      {department.employeeCount} employees • {department.totalProcesses} processes
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Automation Rate */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Automation Rate</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{department.automationRate.toFixed(1)}%</span>
                        <Badge className={`${performance.color.replace('text-', 'bg-')}/20 ${performance.color} border-current/30`}>
                          {performance.label}
                        </Badge>
                        </div>
                      </div>
                      <Progress value={department.automationRate} className="h-3" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{department.automatedProcesses} automated</span>
                        <span>{department.totalProcesses - department.automatedProcesses} manual</span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">ROI Generated</p>
                        <p className="font-bold text-success">${(department.totalROI / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost Savings</p>
                        <p className="font-bold text-primary">${(department.costSavings / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Cycle Time</p>
                        <p className="font-bold">{department.avgCycleTime.toFixed(1)} min</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Error Reduction</p>
                        <p className="font-bold">{department.errorReduction.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Top Processes */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Top Automated Processes</p>
                      <div className="flex flex-wrap gap-1">
                        {department.topProcesses.slice(0, 3).map((process, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {process}
                          </Badge>
                        ))}
                        {department.topProcesses.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{department.topProcesses.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Growth Indicator */}
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span>Quarterly Growth</span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <span className="font-medium text-success">+{department.quarterlyGrowth.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Automation Rate Comparison
                </CardTitle>
                <CardDescription>Department automation coverage analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="automationRate" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  ROI Performance by Department
                </CardTitle>
                <CardDescription>Return on investment comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="totalROI" fill="hsl(var(--success))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Department Rankings */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Department Performance Rankings</CardTitle>
              <CardDescription>Comparative analysis across key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentData
                  .sort((a, b) => b.automationRate - a.automationRate)
                  .map((dept, index) => (
                    <div key={dept.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{dept.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {dept.automatedProcesses}/{dept.totalProcesses} processes automated
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Automation Rate</p>
                          <p className="font-bold">{dept.automationRate.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">ROI</p>
                          <p className="font-bold text-success">${(dept.totalROI / 1000).toFixed(0)}K</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Maturity</p>
                          <Badge className={getMaturityBadge(dept.maturityLevel)}>
                            {dept.maturityLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maturity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Automation Maturity Distribution
                </CardTitle>
                <CardDescription>Current maturity levels across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={maturityLevelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="level"
                      >
                        {maturityLevelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Maturity Level Breakdown</CardTitle>
                <CardDescription>Department distribution by automation maturity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maturityLevelData.map((level, index) => (
                    <div key={level.level} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{level.level}</span>
                        <span className="text-sm text-muted-foreground">{level.count} departments</span>
                      </div>
                      <Progress value={level.percentage} className="h-3" />
                      <div className="text-xs text-muted-foreground">
                        {level.percentage.toFixed(1)}% of total departments
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Maturity Improvement Opportunities</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 2 departments ready for advancement to Intermediate</li>
                    <li>• Focus on process standardization and tool adoption</li>
                    <li>• Implement cross-department knowledge sharing</li>
                    <li>• Develop automation governance framework</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cross-dept" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Cross-Department Process Opportunities</CardTitle>
              <CardDescription>Processes that span multiple departments with automation potential</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crossDepartmentData.map((process, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{process.process}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          process.complexity === "High" ? "border-destructive/50 text-destructive" :
                          process.complexity === "Medium" ? "border-warning/50 text-warning" :
                          "border-success/50 text-success"
                        }>
                          {process.complexity} Complexity
                        </Badge>
                        <Badge className="bg-success/20 text-success border-success/30">
                          ${(process.roi / 1000).toFixed(0)}K ROI
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Involved Departments:</span>
                      <div className="flex gap-2">
                        {process.departments.map((dept, idx) => (
                          <Badge key={idx} variant="secondary">
                            {dept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2 text-primary">Collaboration Opportunities</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">High Impact Processes</p>
                    <p className="text-muted-foreground">3 processes with ROI {'>'}$300K</p>
                  </div>
                  <div>
                    <p className="font-medium">Department Synergies</p>
                    <p className="text-muted-foreground">Finance involved in 4/5 processes</p>
                  </div>
                  <div>
                    <p className="font-medium">Automation Potential</p>
                    <p className="text-muted-foreground">$1.45M total opportunity</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}