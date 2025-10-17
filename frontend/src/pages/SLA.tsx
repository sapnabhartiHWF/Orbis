import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DashboardMetricCard } from "@/components/DashboardMetricCard";
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Bell,
  Search,
  Filter,
  Download,
  Calendar,
  BarChart3,
  Target,
  Users,
  Globe,
  Settings
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock data for SLA tracking
const slaDefinitions = [
  {
    id: "sla-001",
    processName: "Invoice Processing",
    department: "Finance",
    region: "EMEA",
    cycleTime: { target: 4, unit: "hours" },
    resolutionTime: { target: 2, unit: "hours" },
    throughput: { target: 95, unit: "%" },
    priority: "Critical",
    status: "Active",
    compliance: 92,
    breaches: 3,
    owner: "Finance Team"
  },
  {
    id: "sla-002", 
    processName: "Customer Onboarding",
    department: "Sales",
    region: "Americas",
    cycleTime: { target: 24, unit: "hours" },
    resolutionTime: { target: 4, unit: "hours" },
    throughput: { target: 98, unit: "%" },
    priority: "High",
    status: "Active",
    compliance: 97,
    breaches: 1,
    owner: "Sales Operations"
  },
  {
    id: "sla-003",
    processName: "IT Ticket Resolution",
    department: "IT",
    region: "APAC",
    cycleTime: { target: 8, unit: "hours" },
    resolutionTime: { target: 1, unit: "hours" },
    throughput: { target: 90, unit: "%" },
    priority: "Medium",
    status: "Active",
    compliance: 88,
    breaches: 8,
    owner: "IT Support"
  }
];

const kpiTrends = [
  { month: "Jan", cycleTime: 4.2, resolutionTime: 2.1, throughput: 94 },
  { month: "Feb", cycleTime: 3.8, resolutionTime: 1.9, throughput: 96 },
  { month: "Mar", cycleTime: 4.5, resolutionTime: 2.3, throughput: 92 },
  { month: "Apr", cycleTime: 3.9, resolutionTime: 2.0, throughput: 95 },
  { month: "May", cycleTime: 3.6, resolutionTime: 1.8, throughput: 97 },
  { month: "Jun", cycleTime: 4.1, resolutionTime: 2.2, throughput: 93 }
];

const complianceByDepartment = [
  { department: "Finance", compliance: 92, processes: 15 },
  { department: "Sales", compliance: 97, processes: 8 },
  { department: "IT", compliance: 88, processes: 22 },
  { department: "HR", compliance: 94, processes: 12 },
  { department: "Operations", compliance: 91, processes: 18 }
];

const complianceByRegion = [
  { region: "Americas", compliance: 95, color: "#22c55e" },
  { region: "EMEA", compliance: 92, color: "#3b82f6" },
  { region: "APAC", compliance: 89, color: "#f59e0b" }
];

const recentAlerts = [
  {
    id: "alert-001",
    processName: "Invoice Processing",
    type: "SLA Breach",
    severity: "Critical",
    time: "5 min ago",
    message: "Cycle time exceeded 4 hours"
  },
  {
    id: "alert-002",
    processName: "IT Ticket Resolution",
    type: "Approaching Breach",
    severity: "Warning", 
    time: "12 min ago",
    message: "Resolution time at 85% of SLA target"
  },
  {
    id: "alert-003",
    processName: "Customer Onboarding",
    type: "Performance Alert",
    severity: "Info",
    time: "1 hour ago",
    message: "Throughput below target for 2 consecutive hours"
  }
];

const chartConfig = {
  cycleTime: {
    label: "Cycle Time",
    color: "hsl(var(--chart-1))",
  },
  resolutionTime: {
    label: "Resolution Time", 
    color: "hsl(var(--chart-2))",
  },
  throughput: {
    label: "Throughput",
    color: "hsl(var(--chart-3))",
  },
};

export default function SLA() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [timeRange, setTimeRange] = useState("30d");

  const filteredSLAs = slaDefinitions.filter(sla => {
    return (
      sla.processName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedDepartment === "all" || sla.department === selectedDepartment) &&
      (selectedRegion === "all" || sla.region === selectedRegion) &&
      (selectedPriority === "all" || sla.priority === selectedPriority)
    );
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "text-destructive";
      case "Warning": return "text-warning";
      case "Info": return "text-info";
      default: return "text-muted-foreground";
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return "text-success";
    if (compliance >= 90) return "text-warning";
    return "text-destructive";
  };

  const getComplianceVariant = (compliance: number) => {
    if (compliance >= 95) return "default";
    if (compliance >= 90) return "secondary";
    return "destructive";
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SLA & KPI Governance</h1>
          <p className="text-muted-foreground">
            Monitor SLA compliance, track KPIs, and manage process performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure SLAs
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetricCard
          title="Overall SLA Compliance"
          value="92.4%"
          subtitle="Target: 95%"
          trend={{ value: -2.1, label: "vs last month" }}
          icon={<Target className="h-4 w-4" />}
          variant="default"
        />
        <DashboardMetricCard
          title="Active SLA Breaches"
          value="12"
          subtitle="Requiring attention"
          trend={{ value: 3, label: "new today" }}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="danger"
        />
        <DashboardMetricCard
          title="Avg Cycle Time"
          value="4.1h"
          subtitle="Target: 4.0h"
          trend={{ value: 0.2, label: "vs target" }}
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
        />
        <DashboardMetricCard
          title="Processes Monitored"
          value="75"
          subtitle="Across all departments"
          trend={{ value: 5, label: "added this month" }}
          icon={<BarChart3 className="h-4 w-4" />}
          variant="default"
        />
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">SLA Dashboard</TabsTrigger>
          <TabsTrigger value="kpis">KPI Tracking</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                SLA Definitions & Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search processes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
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
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="Americas">Americas</SelectItem>
                    <SelectItem value="EMEA">EMEA</SelectItem>
                    <SelectItem value="APAC">APAC</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredSLAs.map((sla) => (
                  <Card key={sla.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{sla.processName}</h3>
                          <Badge variant={getComplianceVariant(sla.compliance)}>
                            {sla.department}
                          </Badge>
                          <Badge variant="outline">{sla.region}</Badge>
                          <Badge variant={sla.priority === "Critical" ? "destructive" : "secondary"}>
                            {sla.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Owner: {sla.owner}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className={`text-lg font-bold ${getComplianceColor(sla.compliance)}`}>
                          {sla.compliance}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {sla.breaches} breaches
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Cycle Time Target</div>
                        <div className="font-semibold">{sla.cycleTime.target} {sla.cycleTime.unit}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Resolution Target</div>
                        <div className="font-semibold">{sla.resolutionTime.target} {sla.resolutionTime.unit}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Throughput Target</div>
                        <div className="font-semibold">{sla.throughput.target}{sla.throughput.unit}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">SLA Compliance</span>
                        <span className="text-sm font-medium">{sla.compliance}%</span>
                      </div>
                      <Progress value={sla.compliance} className="h-2" />
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">KPI Performance Trends</h2>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* KPI Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Process Cycle Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="cycleTime"
                        stroke="var(--color-cycleTime)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-cycleTime)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exception Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="resolutionTime"
                        stroke="var(--color-resolutionTime)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-resolutionTime)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Throughput Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="throughput" fill="var(--color-throughput)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>KPI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>Average Cycle Time</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">4.1 hours</div>
                      <div className="text-sm text-muted-foreground">Target: 4.0h</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span>Resolution Time</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">2.0 hours</div>
                      <div className="text-sm text-muted-foreground">Target: 2.0h</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <span>Throughput Rate</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">95.2%</div>
                      <div className="text-sm text-muted-foreground">Target: 95%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Compliance by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceByDepartment.map((dept) => (
                    <div key={dept.department} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{dept.department}</span>
                        <div className="text-right">
                          <span className={`font-semibold ${getComplianceColor(dept.compliance)}`}>
                            {dept.compliance}%
                          </span>
                          <div className="text-sm text-muted-foreground">
                            {dept.processes} processes
                          </div>
                        </div>
                      </div>
                      <Progress value={dept.compliance} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Regional Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Compliance by Geography
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={complianceByRegion}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="compliance"
                        label={({ region, compliance }) => `${region}: ${compliance}%`}
                      >
                        {complianceByRegion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Historical Compliance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Historical SLA Compliance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpiTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[80, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="throughput"
                      stroke="var(--color-throughput)"
                      strokeWidth={3}
                      dot={{ fill: "var(--color-throughput)", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Alert Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Real-time SLA Breach Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {alert.severity === "Critical" ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : alert.severity === "Warning" ? (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-info" />
                      )}
                      <div>
                        <div className="font-medium">{alert.processName}</div>
                        <div className="text-sm text-muted-foreground">{alert.message}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={alert.severity === "Critical" ? "destructive" : "secondary"}>
                        {alert.type}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">{alert.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alert Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Critical Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">3</div>
                <div className="text-sm text-muted-foreground">Requiring immediate attention</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Warning Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">7</div>
                <div className="text-sm text-muted-foreground">Approaching SLA thresholds</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Info Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-info">12</div>
                <div className="text-sm text-muted-foreground">Performance notifications</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}