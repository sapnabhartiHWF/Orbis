import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity,
  Bot,
  Clock,
  Target,
  MapPin,
  Users,
  Zap,
  AlertTriangle,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  LineChart,
  Maximize2,
  ClipboardList,
  Link,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { ProcessAnalytics } from "@/components/ProcessAnalytics";
import { ROIReports } from "@/components/ROIReports";
import { TeamPerformance } from "@/components/TeamPerformance";
import { DepartmentInsights } from "@/components/DepartmentInsights";
import { ExportCapabilities } from "@/components/ExportCapabilities";

import {
  InvoiceAnalysisByMonth,
  InvoiceByZozbot,
  SuccessVsException,
  SupplierWise,
  SupplierWiseConfidenceIndex,
  SupplierWiseException,
  ExcxeptionRatioByCountry,
  InvoiceByYear,
  TopSupplier,
} from "@/components/InvoiceAnalysisCharts";
import {
  InvoiceLineByZozbot,
  InvoiceLineByMonth,
  SupplierWiseInvoiceLine,
  InvoiceLineSupplierWiseException,
  InvoiceLineExceptionRatio,
  YearWiseInvoiceLine,
  InvoiceLineTopSupplier,
} from "@/components/InvoiceLineAnalysisChart";

// Mock data for analytics
const executiveMetrics = {
  totalProcesses: 0,
  automatedProcesses: 0,
  automationCoverage: 0,
  monthlyROI: 0,
  costSavings: 0,
  productivityGain: 0,
};

const topPerformingProcesses = 
[
  {
    name: "Invoice Processing",
    efficiency: 94,
    volume: 12547,
    savings: 45600,
    department: "Finance",
    trend: 8.2,
  },
  {
    name: "Customer Onboarding",
    efficiency: 91,
    volume: 8934,
    savings: 32400,
    department: "Sales",
    trend: 12.5,
  },
  {
    name: "Report Generation",
    efficiency: 87,
    volume: 6782,
    savings: 28900,
    department: "Operations",
    trend: -2.1,
  },
  {
    name: "Data Migration",
    efficiency: 85,
    volume: 4563,
    savings: 19800,
    department: "IT",
    trend: 5.7,
  },
  {
    name: "Email Automation",
    efficiency: 83,
    volume: 15632,
    savings: 15200,
    department: "Marketing",
    trend: 15.3,
  },
] 

const roiData = 
[
  { month: "Jul", roi: 1.8, savings: 380000, investment: 210000 },
  { month: "Aug", roi: 2.1, savings: 420000, investment: 200000 },
  { month: "Sep", roi: 2.3, savings: 460000, investment: 200000 },
  { month: "Oct", roi: 2.5, savings: 500000, investment: 200000 },
  { month: "Nov", roi: 2.2, savings: 440000, investment: 200000 },
  { month: "Dec", roi: 2.4, savings: 485000, investment: 202000 },
] 
const departmentCoverage = 
[
  {
    department: "Finance",
    total: 15,
    automated: 12,
    coverage: 80,
    processes: ["Invoice Processing", "Expense Reports", "Budget Planning"],
  },
  {
    department: "Operations",
    total: 12,
    automated: 9,
    coverage: 75,
    processes: ["Report Generation", "Data Backup", "System Monitoring"],
  },
  {
    department: "Sales",
    total: 8,
    automated: 6,
    coverage: 75,
    processes: [
      "Lead Qualification",
      "Customer Onboarding",
      "Quote Generation",
    ],
  },
  {
    department: "IT",
    total: 7,
    automated: 4,
    coverage: 57,
    processes: ["User Management", "Software Deployment", "Security Scans"],
  },
  {
    department: "Marketing",
    total: 5,
    automated: 3,
    coverage: 60,
    processes: ["Email Campaigns", "Social Media", "Analytics Reports"],
  },
] 

const botUtilizationData = 
[
  { time: "00:00", productive: 15, idle: 9, total: 24 },
  { time: "04:00", productive: 8, idle: 16, total: 24 },
  { time: "08:00", productive: 22, idle: 2, total: 24 },
  { time: "12:00", productive: 24, idle: 0, total: 24 },
  { time: "16:00", productive: 21, idle: 3, total: 24 },
  { time: "20:00", productive: 12, idle: 12, total: 24 },
] 
const processHeatmapData = 
[
  {
    process: "Invoice Processing",
    coverage: 95,
    exceptions: 12,
    volume: "High",
    risk: "Low",
  },
  {
    process: "Customer Onboarding",
    coverage: 88,
    exceptions: 8,
    volume: "High",
    risk: "Medium",
  },
  {
    process: "Report Generation",
    coverage: 92,
    exceptions: 23,
    volume: "Medium",
    risk: "High",
  },
  {
    process: "Data Migration",
    coverage: 78,
    exceptions: 15,
    volume: "Medium",
    risk: "Medium",
  },
  {
    process: "Email Automation",
    coverage: 85,
    exceptions: 5,
    volume: "High",
    risk: "Low",
  },
  {
    process: "Budget Planning",
    coverage: 72,
    exceptions: 18,
    volume: "Low",
    risk: "High",
  },
  {
    process: "User Management",
    coverage: 68,
    exceptions: 12,
    volume: "Medium",
    risk: "Medium",
  },
  {
    process: "Quote Generation",
    coverage: 90,
    exceptions: 7,
    volume: "Medium",
    risk: "Low",
  },
] 

const suppliers = [
  "DHL Aviation",
  "CP TRANSPORTATION SERVI.",
  "CNS",
  "AVN LOGISTICS (PTY) LTD",
  "AGS",
  "PV Bevrachting B.V.",
  "P Marijnissen Transport B.V.",
  "OOCL",
  "NVO Consolidation B.V",
  "MILLTRANS",
  "Maritime Cargo Processing plc",
  "MAERSK",
  "KSN LOGISTICS CC",
  "JG Hauliers (Pty) Ltd",
  "Hapag",
  "Fryers Transport",
  "Fastra",
  "Douane",
  "Port of Felixstowe",
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("6months");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedChart, setSelectedChart] = useState("invoices-by-zozbot");
  const [selectedInvoiceLine, setSelectedInvoiceLine] = useState("invoices-lines-by-zozbot");
  const [monthChartType, setMonthChartType] = useState<"default" | "bar" | "line" | "area" | "pie">("default");
  const [invoiceLineChartType, setInvoiceLineChartType] = useState<"default" | "bar" | "line" | "area" | "pie">("default");

  const [countryCode, setCountryCode] = useState("all");
  const [supplierName, setSupplierName] = useState("");


  const chartOptions = useMemo(() => [
    {
      value: "invoices-by-zozbot",
      label: "Invoices Processed by Zozbot",
      supportsChartType: false,
    },
    {
      value: "invoices-by-month",
      label: "Invoices Processed by ZozBot by Month",
      supportsChartType: true,
    },
    {
      value: "success-vs-exception",
      label: "Success VS Exception",
      supportsChartType: false,
    },
    {
      value: "supplier-wise",
      label: "Supplierwise Invoice Counts",
      supportsChartType: false,
    },
    {
      value: "supplier-confidence",
      label: "SupplierWise Confidence Index",
      supportsChartType: false,
    },
    {
      value: "supplier-exception",
      label: "Supplier wise Exceptions",
      supportsChartType: false,
    },
    {
      value: "exception-ratio",
      label: "Ratio of Exceptions by Invoice Total by Country",
      supportsChartType: true,
    },
    {
      value: "invoice-by-year",
      label: "Running InvoiceTotal by Year",
      supportsChartType: false,
    },
    {
      value: "top-suppliers",
      label: "Top 10 Suppliers by Invoices",
      supportsChartType: false,
    },
  ], []);

  const chartInvoiceLineOptions = useMemo(() => [
    {
      value: "invoices-lines-by-zozbot",
      label: "Invoices Lines Processed by Zozbot",
      supportsChartType: true,
    },
    {
      value: "invoices-LInes-by-month",
      label: "Invoices Lines Processed by ZozBot by Month",
      supportsChartType: true,
    },
    {
      value: "supplier-wise-invoice-lines",
      label: "Supplierwise InvoiceLine Count",
      supportsChartType: true,
    },
    {
      value: "supplier-exception-invoice-lines",
      label: "Invoices Lines SupplierWise Exceptions",
      supportsChartType: false,
    },
    {
      value: "invoice-line-exception-ratio",
      label: "Exception Ratio of Invoice Lines by Country",
      supportsChartType: true,
    },
    {
      value: "invoice-lines-by-year",
      label: "Invoice Lines by Year",
      supportsChartType: true,
    },
    {
      value: "top-suppliers-invoice-lines",
      label: "Invoice Lines by Top Suppliers",
      supportsChartType: false,
    },
  ], []);

  // Render chart component dynamically based on selection
  const renderChart = useMemo(() => {
    const option = chartOptions.find((opt) => opt.value === selectedChart);
    if (!option) return null;

    const chartType = option.supportsChartType ? monthChartType : "default";
    const effectiveCountryCode = countryCode === "all" ? "" : countryCode;
    const effectiveSupplierName = supplierName === "all" ? "" : supplierName;

    switch (selectedChart) {
      case "invoices-by-zozbot":
        return <InvoiceByZozbot countryCode={effectiveCountryCode} chartType={chartType} />;
      case "invoices-by-month":
        return <InvoiceAnalysisByMonth countryCode={effectiveCountryCode} chartType={chartType} />;
      case "success-vs-exception":
        return <SuccessVsException countryCode={effectiveCountryCode} />;
      case "supplier-wise":
        return <SupplierWise countryCode={effectiveCountryCode} supplierName={effectiveSupplierName} />;
      case "supplier-confidence":
        return <SupplierWiseConfidenceIndex countryCode={effectiveCountryCode} supplierName={effectiveSupplierName} />;
      case "supplier-exception":
        return <SupplierWiseException supplierName={effectiveSupplierName} />;
      case "exception-ratio":
        return <ExcxeptionRatioByCountry countryCode={effectiveCountryCode} chartType={chartType} />;
      case "invoice-by-year":
        return <InvoiceByYear countryCode={effectiveCountryCode} />;
      case "top-suppliers":
        return <TopSupplier supplierName={effectiveSupplierName} />;
      default:
        return null;
    }
  }, [selectedChart, countryCode, supplierName, monthChartType, chartOptions]);

  const renderInvoiceLineChart = useMemo(() => {
    const option = chartInvoiceLineOptions.find((opt) => opt.value === selectedInvoiceLine);
    if (!option) return null;

    // Some invoice line components don't support "bar" type, convert to "default" if needed
    const chartType = option.supportsChartType 
      ? (invoiceLineChartType === "bar" ? "default" : invoiceLineChartType as "default" | "line" | "area" | "pie")
      : "default";
    const effectiveCountryCode = countryCode === "all" ? "" : countryCode;
    const effectiveSupplierName = supplierName === "all" ? "" : supplierName;

    switch (selectedInvoiceLine) {
      case "invoices-lines-by-zozbot":
        return <InvoiceLineByZozbot countryCode={effectiveCountryCode} chartType={chartType} />;
      case "invoices-LInes-by-month":
        return <InvoiceLineByMonth countryCode={effectiveCountryCode} chartType={chartType} />;
      case "supplier-wise-invoice-lines":
        return <SupplierWiseInvoiceLine countryCode={effectiveCountryCode} supplierName={effectiveSupplierName} chartType={chartType} />;
      case "supplier-exception-invoice-lines":
        return <InvoiceLineSupplierWiseException supplierName={effectiveSupplierName} />;
      case "invoice-line-exception-ratio":
        return <InvoiceLineExceptionRatio countryCode={effectiveCountryCode} chartType={chartType} />;
      case "invoice-lines-by-year":
        return <YearWiseInvoiceLine countryCode={effectiveCountryCode} chartType={chartType} />;
      case "top-suppliers-invoice-lines":
        return <InvoiceLineTopSupplier supplierName={effectiveSupplierName} />;
      default:
        return null;
    }
  }, [selectedInvoiceLine, countryCode, supplierName, invoiceLineChartType, chartInvoiceLineOptions]);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return "text-success";
    if (efficiency >= 80) return "text-warning";
    return "text-destructive";
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-success";
    return "text-destructive";
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-success/20 text-success border-success/30";
      case "Medium":
        return "bg-warning/20 text-warning border-warning/30";
      case "High":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-muted/20 text-muted-foreground border-border";
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return "bg-success";
    if (coverage >= 70) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Analytics & Insights
            </h1>
            <p className="text-muted-foreground">
              Executive dashboard and performance analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button className="bg-gradient-primary gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Automation Coverage
                  </p>
                  <p className="text-2xl font-bold">
                    {executiveMetrics.automationCoverage}%
                  </p>
                  <p className="text-xs text-success">
                    {executiveMetrics.automatedProcesses} of{" "}
                    {executiveMetrics.totalProcesses} processes
                  </p>
                </div>
                <Target className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly ROI</p>
                  <p className="text-2xl font-bold text-success">
                    {executiveMetrics.monthlyROI}x
                  </p>
                  <p className="text-xs text-success">+0.2x from last month</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cost Savings</p>
                  <p className="text-2xl font-bold">
                    ${(executiveMetrics.costSavings / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-success">This month</p>
                </div>
                <DollarSign className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Productivity Gain
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {executiveMetrics.productivityGain}%
                  </p>
                  <p className="text-xs text-success">Compared to manual</p>
                </div>
                <Zap className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="executive" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="executive">Executive Dashboard</TabsTrigger>
            <TabsTrigger value="utilization">Bot Utilization</TabsTrigger>
            <TabsTrigger value="heatmap">Process Heatmap</TabsTrigger>
            <TabsTrigger value="departments">Department Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="executive" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ROI Trend */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    ROI Trend Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={roiData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="roi"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{
                          fill: "hsl(var(--primary))",
                          strokeWidth: 2,
                          r: 4,
                        }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Performing Processes */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Top Performing Processes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformingProcesses
                      .slice(0, 5)
                      .map((process, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm">
                                {process.name}
                              </h4>
                              <div
                                className={`text-xs ${getEfficiencyColor(
                                  process.efficiency
                                )}`}
                              >
                                {process.efficiency}% efficiency
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{process.department}</span>
                              <span>
                                {process.volume.toLocaleString()} transactions
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-success">
                                ${process.savings.toLocaleString()} saved
                              </span>
                              <div
                                className={`flex items-center gap-1 text-xs ${getTrendColor(
                                  process.trend
                                )}`}
                              >
                                {process.trend > 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingUp className="w-3 h-3 rotate-180" />
                                )}
                                {Math.abs(process.trend)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Savings Breakdown */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Cost Savings by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={departmentCoverage}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="automated"
                        nameKey="department"
                      >
                        {departmentCoverage.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {departmentCoverage.map((dept, index) => (
                      <div
                        key={dept.department}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="text-sm font-medium">
                            {dept.department}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {dept.automated}/{dept.total}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dept.coverage}% coverage
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utilization" className="space-y-6">
            <Card className="bg-gradient-card shadow-card border-border/50 hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Filter className="w-4 h-4 text-primary" />
                  </div>
                  Filter Options
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Country Code Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      Country Code
                    </label>
                    <Select onValueChange={setCountryCode} value={countryCode}>
                      <SelectTrigger className="w-full bg-background border-border hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="All Countries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        <SelectItem value="us">United States (US)</SelectItem>
                        <SelectItem value="uk">United Kingdom (UK)</SelectItem>
                        <SelectItem value="au">Australia (AU)</SelectItem>
                        <SelectItem value="sa">South Africa (SA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Supplier Name Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      Supplier Name
                    </label>
                    <Select
                      onValueChange={(value) => setSupplierName(value === "all" ? "" : value)}
                      value={supplierName || "all"}
                    >
                      <SelectTrigger className="w-full bg-background border-border hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Select Supplier" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {suppliers.map((supplier, index) => (
                          <SelectItem key={index} value={supplier}>
                            {supplier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Invoice Charts and More Information */}
            <Tabs defaultValue="invoice-analysis" className="w-full space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-auto overflow-x-auto bg-muted/50 p-1 rounded-lg">
                <TabsTrigger 
                  value="invoice-analysis"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Invoice Details Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="invoice-line-analysis"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  InvoiceLine Analysis Dashboard
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invoice-analysis" className="space-y-6">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl shadow-sm border border-primary/20">
                      <ClipboardList className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">
                        Invoice Analytics Dashboard
                      </h1>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Comprehensive invoice processing insights
                      </p>
                    </div>
                  </div>
                  {chartOptions.find((opt) => opt.value === selectedChart)?.supportsChartType && (
                    <Select
                      value={monthChartType}
                      onValueChange={(value) => setMonthChartType(value as any)}
                    >
                      <SelectTrigger className="w-[140px] bg-background border-border hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Chart Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Single Card with Dropdown and Chart */}
                <Card className="bg-gradient-card shadow-card border-border/50 hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold">
                          {
                            chartOptions.find(
                              (opt) => opt.value === selectedChart
                            )?.label
                          }
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {/* Chart selection */}
                        <Select
                          value={selectedChart}
                          onValueChange={setSelectedChart}
                        >
                          <SelectTrigger className="w-[280px] bg-background border-border hover:border-primary/50 transition-colors">
                            <SelectValue placeholder="Select Chart" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[400px]">
                            {chartOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="animate-in fade-in-50 duration-300">
                      {renderChart}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invoice-line-analysis" className="space-y-6">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl shadow-sm border border-primary/20">
                      <ClipboardList className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">
                        Invoice Line Analytics Dashboard
                      </h1>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Detailed invoice line item analysis
                      </p>
                    </div>
                  </div>
                  {chartInvoiceLineOptions.find((opt) => opt.value === selectedInvoiceLine)?.supportsChartType && (
                    <Select
                      value={invoiceLineChartType}
                      onValueChange={(value) => setInvoiceLineChartType(value as any)}
                    >
                      <SelectTrigger className="w-[140px] bg-background border-border hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Chart Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Card className="bg-gradient-card shadow-card border-border/50 hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold">
                          {
                            chartInvoiceLineOptions.find(
                              (opt) => opt.value === selectedInvoiceLine
                            )?.label
                          }
                        </span>
                      </CardTitle>
                      {/* Dropdown for Chart Selection */}
                      <Select
                        value={selectedInvoiceLine}
                        onValueChange={setSelectedInvoiceLine}
                      >
                        <SelectTrigger className="w-[280px] bg-background border-border hover:border-primary/50 transition-colors">
                          <SelectValue placeholder="Select Chart" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px]">
                          {chartInvoiceLineOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="animate-in fade-in-50 duration-300">
                      {renderInvoiceLineChart}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col grid grid-cols-2 gap-6">
              {/* Bot Utilization Chart */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Bot Utilization Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={botUtilizationData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="productive"
                        stackId="1"
                        stroke="hsl(var(--success))"
                        fill="hsl(var(--success))"
                        fillOpacity={0.8}
                      />
                      <Area
                        type="monotone"
                        dataKey="idle"
                        stackId="1"
                        stroke="hsl(var(--warning))"
                        fill="hsl(var(--warning))"
                        fillOpacity={0.8}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Utilization Summary */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Utilization Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">
                          0%
                        </div>
                        <div className="text-sm text-success">
                          Productive Time
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-warning">
                          0%
                        </div>
                        <div className="text-sm text-warning">Idle Time</div>
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-border my-4" />

                  <div className="space-y-3">
                    <h4 className="font-semibold">Bot Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Peak Utilization:
                        </span>
                        <span className="font-semibold">0:00 AM (0%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Low Utilization:
                        </span>
                        <span className="font-semibold">0:00 AM (0%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Average Daily:
                        </span>
                        <span className="font-semibold">0%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Optimization Potential:
                        </span>
                        <span className="font-semibold text-primary">0%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bot Farm Status */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Bot Farm Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      name: "Production Bots",
                      active: 0,
                      total: 0,
                      utilization: 0,
                    },
                    {
                      name: "Development Bots",
                      active: 0,
                      total: 0,
                      utilization: 0,
                    },
                    {
                      name: "Testing Bots",
                      active: 0,
                      total: 0,
                      utilization: 0,
                    },
                  ].map((farm, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border"
                    >
                      <h4 className="font-semibold mb-3">{farm.name}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Active Bots:
                          </span>
                          <span className="font-semibold">
                            {farm.active}/{farm.total}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Utilization:
                          </span>
                          <span className="font-semibold">
                            {farm.utilization}%
                          </span>
                        </div>
                        <Progress value={farm.utilization} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Process Coverage & Exception Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Coverage Heatmap */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Automation Coverage</h4>
                    <div className="space-y-2">
                      {processHeatmapData.map((process, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border border-border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {process.process}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {process.volume} Volume
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 mr-3">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${getCoverageColor(
                                    process.coverage
                                  )}`}
                                  style={{ width: `${process.coverage}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-semibold">
                              {process.coverage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exception Hotspots */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Exception Hotspots</h4>
                    <div className="space-y-2">
                      {processHeatmapData
                        .sort((a, b) => b.exceptions - a.exceptions)
                        .map((process, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg border border-border"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {process.process}
                              </span>
                              <Badge className={getRiskColor(process.risk)}>
                                {process.risk} Risk
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-warning" />
                                <span className="text-sm text-muted-foreground">
                                  {process.exceptions} exceptions
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                              >
                                Analyze
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Department-wise Automation Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Department Coverage Chart */}
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={departmentCoverage}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="department"
                        stroke="hsl(var(--muted-foreground))"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="total"
                        fill="hsl(var(--muted))"
                        name="Total Processes"
                      />
                      <Bar
                        dataKey="automated"
                        fill="hsl(var(--primary))"
                        name="Automated"
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Department Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Department Breakdown</h4>
                    {departmentCoverage.map((dept, index) => (
                      <div
                        key={dept.department}
                        className="p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold">{dept.department}</h5>
                          <Badge variant="outline">
                            {dept.coverage}% coverage
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Total Processes:
                            </span>
                            <span className="font-medium">{dept.total}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Automated:
                            </span>
                            <span className="font-medium text-success">
                              {dept.automated}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Manual:
                            </span>
                            <span className="font-medium text-warning">
                              {dept.total - dept.automated}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Key Processes:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {dept.processes.map((process, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                {process}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reporting & Analytics - Feature Tabs */}
        <section className="space-y-4 mt-10">
          <h2 className="text-2xl font-semibold text-foreground">
            Reporting & Analytics
          </h2>
          <Tabs defaultValue="executive-dash" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="executive-dash">
                Executive Dashboards
              </TabsTrigger>
              <TabsTrigger value="process-analytics">
                Process Analytics
              </TabsTrigger>
              <TabsTrigger value="roi-reports">ROI Reports</TabsTrigger>
              <TabsTrigger value="team-performance">
                Team Performance
              </TabsTrigger>
              <TabsTrigger value="department-insights">
                Department Insights
              </TabsTrigger>
              <TabsTrigger value="export-capabilities">
                Export Capabilities
              </TabsTrigger>
            </TabsList>

            <TabsContent value="executive-dash">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Open Issues
                        </p>
                        <p className="text-2xl font-bold text-destructive">
                          0
                        </p>
                        <p className="text-xs text-muted-foreground">
                          0 tickets + 0 exceptions
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Avg Resolution Time
                        </p>
                        <p className="text-2xl font-bold text-primary">0m</p>
                        <p className="text-xs text-success">
                          Combined tickets & exceptions
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Integration Rate
                        </p>
                        <p className="text-2xl font-bold text-success">0%</p>
                        <p className="text-xs text-success">
                          Exceptions auto-converted to tickets
                        </p>
                      </div>
                      <Link className="w-8 h-8 text-success" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Team Efficiency
                        </p>
                        <p className="text-2xl font-bold text-primary">0%</p>
                        <p className="text-xs text-success">
                          Unified workflow performance
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <ExecutiveDashboard />
            </TabsContent>

            <TabsContent value="process-analytics">
              <ProcessAnalytics />
            </TabsContent>

            <TabsContent value="roi-reports">
              <ROIReports />
            </TabsContent>

            <TabsContent value="team-performance">
              <TeamPerformance />
            </TabsContent>

            <TabsContent value="department-insights">
              <DepartmentInsights />
            </TabsContent>

            <TabsContent value="export-capabilities">
              <ExportCapabilities />
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
