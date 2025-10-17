import { useState } from "react"
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  BarChart3,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Percent
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { dummyROICalculations, calculateROIMetrics } from "@/utils/roiCalculations"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart, PieChart, Pie, Cell } from "recharts"

interface ROIProjection {
  processId: string
  processName: string
  department: string
  projectedROI: number
  actualROI: number
  projectedSavings: number
  actualSavings: number
  projectedPayback: number
  actualPayback: number
  variance: number
  status: 'on-track' | 'ahead' | 'behind'
  lastUpdated: string
}

const dummyProjections: ROIProjection[] = [
  {
    processId: 'roi1',
    processName: 'Invoice Processing Automation',
    department: 'Finance',
    projectedROI: 185,
    actualROI: 198,
    projectedSavings: 280000,
    actualSavings: 295000,
    projectedPayback: 14.2,
    actualPayback: 13.8,
    variance: 7.0,
    status: 'ahead',
    lastUpdated: '2024-01-30'
  },
  {
    processId: 'roi2',
    processName: 'Employee Onboarding System',
    department: 'HR',
    projectedROI: 156,
    actualROI: 142,
    projectedSavings: 165000,
    actualSavings: 148000,
    projectedPayback: 18.5,
    actualPayback: 20.2,
    variance: -8.9,
    status: 'behind',
    lastUpdated: '2024-01-28'
  },
  {
    processId: 'roi3',
    processName: 'Customer Data Reconciliation',
    department: 'Operations',
    projectedROI: 225,
    actualROI: 221,
    projectedSavings: 450000,
    actualSavings: 445000,
    projectedPayback: 12.8,
    actualPayback: 13.1,
    variance: -1.8,
    status: 'on-track',
    lastUpdated: '2024-01-29'
  },
  {
    processId: 'roi4',
    processName: 'IT Ticket Classification',
    department: 'IT',
    projectedROI: 198,
    actualROI: 215,
    projectedSavings: 180000,
    actualSavings: 195000,
    projectedPayback: 16.2,
    actualPayback: 14.9,
    variance: 8.6,
    status: 'ahead',
    lastUpdated: '2024-01-31'
  },
  {
    processId: 'roi5',
    processName: 'Purchase Order Processing',
    department: 'Procurement',
    projectedROI: 167,
    actualROI: 159,
    projectedSavings: 125000,
    actualSavings: 118000,
    projectedPayback: 19.8,
    actualPayback: 21.3,
    variance: -4.8,
    status: 'behind',
    lastUpdated: '2024-01-27'
  }
]

// Time series data for ROI tracking
const monthlyROIData = [
  { month: 'Jan', projected: 150, actual: 145 },
  { month: 'Feb', projected: 162, actual: 168 },
  { month: 'Mar', projected: 175, actual: 182 },
  { month: 'Apr', projected: 188, actual: 190 },
  { month: 'May', projected: 200, actual: 205 },
  { month: 'Jun', projected: 210, actual: 198 }
]

const cumulativeSavingsData = [
  { month: 'Jan', projected: 50000, actual: 48000 },
  { month: 'Feb', projected: 125000, actual: 135000 },
  { month: 'Mar', projected: 210000, actual: 225000 },
  { month: 'Apr', projected: 305000, actual: 320000 },
  { month: 'May', projected: 410000, actual: 425000 },
  { month: 'Jun', projected: 525000, actual: 535000 }
]

const departmentROIData = [
  { department: 'Finance', roi: 192, savings: 350000 },
  { department: 'HR', roi: 148, savings: 180000 },
  { department: 'Operations', roi: 221, savings: 485000 },
  { department: 'IT', roi: 207, savings: 220000 },
  { department: 'Procurement', roi: 163, savings: 140000 }
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))']

export function ROIProjections() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("6months")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  const filteredProjections = selectedDepartment === "all" 
    ? dummyProjections 
    : dummyProjections.filter(p => p.department === selectedDepartment)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'bg-success/20 text-success-foreground border-success/30'
      case 'behind': return 'bg-destructive/20 text-destructive-foreground border-destructive/30'
      case 'on-track': return 'bg-primary/20 text-primary-foreground border-primary/30'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getVarianceIcon = (variance: number) => {
    return variance > 0 ? (
      <ArrowUp className="w-3 h-3 text-success" />
    ) : (
      <ArrowDown className="w-3 h-3 text-destructive" />
    )
  }

  // Calculate summary metrics
  const totalProjectedROI = dummyProjections.reduce((sum, p) => sum + p.projectedROI, 0) / dummyProjections.length
  const totalActualROI = dummyProjections.reduce((sum, p) => sum + p.actualROI, 0) / dummyProjections.length
  const totalProjectedSavings = dummyProjections.reduce((sum, p) => sum + p.projectedSavings, 0)
  const totalActualSavings = dummyProjections.reduce((sum, p) => sum + p.actualSavings, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">ROI Projections & Tracking</h3>
          <p className="text-muted-foreground">Compare projected vs actual ROI performance</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Procurement">Procurement</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="2years">2 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Average ROI</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {totalActualROI.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getVarianceIcon(totalActualROI - totalProjectedROI)}
                  <span className={`text-xs ${totalActualROI > totalProjectedROI ? 'text-green-200' : 'text-red-200'}`}>
                    vs {totalProjectedROI.toFixed(1)}% projected
                  </span>
                </div>
              </div>
              <Percent className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Total Savings</p>
                <p className="text-2xl font-bold text-success-foreground">
                  {formatCurrency(totalActualSavings)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getVarianceIcon(totalActualSavings - totalProjectedSavings)}
                  <span className={`text-xs ${totalActualSavings > totalProjectedSavings ? 'text-green-200' : 'text-red-200'}`}>
                    vs {formatCurrency(totalProjectedSavings)}
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">Projects Ahead</p>
                <p className="text-2xl font-bold text-warning-foreground">
                  {dummyProjections.filter(p => p.status === 'ahead').length}
                </p>
                <p className="text-xs text-warning-foreground/80 mt-1">
                  of {dummyProjections.length} total
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Avg Payback</p>
                <p className="text-2xl font-bold text-foreground">
                  {(dummyProjections.reduce((sum, p) => sum + p.actualPayback, 0) / dummyProjections.length).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">months</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            ROI Trends
          </TabsTrigger>
          <TabsTrigger value="savings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Savings Tracking
          </TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Department Analysis
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Project Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                ROI Performance Trends
              </CardTitle>
              <CardDescription>
                Projected vs actual ROI performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyROIData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="projected" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                      name="Projected ROI %"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="actual" 
                      stackId="2"
                      stroke="hsl(var(--success))" 
                      fill="hsl(var(--success))" 
                      fillOpacity={0.6}
                      name="Actual ROI %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-success" />
                Cumulative Savings Tracking
              </CardTitle>
              <CardDescription>
                Projected vs actual cost savings accumulation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cumulativeSavingsData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projected" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Projected Savings"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={3}
                      name="Actual Savings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  ROI by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentROIData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="roi" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  Savings Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentROIData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ department, percent }: any) => `${department} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="savings"
                      >
                        {departmentROIData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Savings']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Project Performance Details</CardTitle>
              <CardDescription>
                Detailed breakdown of individual project performance vs projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProjections.map((projection) => (
                  <div key={projection.processId} className="p-4 border border-border rounded-lg bg-gradient-card">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{projection.processName}</h4>
                        <p className="text-sm text-muted-foreground">{projection.department}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(projection.status)}>
                          {projection.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getVarianceIcon(projection.variance)}
                          <span className={`text-sm font-medium ${projection.variance > 0 ? 'text-success' : 'text-destructive'}`}>
                            {Math.abs(projection.variance).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">ROI Performance</span>
                          <span className="font-medium">{projection.actualROI.toFixed(1)}% vs {projection.projectedROI.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={(projection.actualROI / projection.projectedROI) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Savings Performance</span>
                          <span className="font-medium">
                            {formatCurrency(projection.actualSavings)} vs {formatCurrency(projection.projectedSavings)}
                          </span>
                        </div>
                        <Progress 
                          value={(projection.actualSavings / projection.projectedSavings) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Payback Period</span>
                          <span className="font-medium">
                            {projection.actualPayback.toFixed(1)} vs {projection.projectedPayback.toFixed(1)} months
                          </span>
                        </div>
                        <Progress 
                          value={Math.min((projection.projectedPayback / projection.actualPayback) * 100, 100)} 
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                      <span>Last updated: {new Date(projection.lastUpdated).toLocaleDateString()}</span>
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