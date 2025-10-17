import { useState } from "react"
import { Download, FileText, Calendar, Clock, Settings, Mail, Share, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: "executive" | "operational" | "technical"
  format: "pdf" | "excel" | "csv" | "powerpoint"
  sections: string[]
  frequency: "daily" | "weekly" | "monthly" | "quarterly"
  recipients: string[]
  lastGenerated: string
  size: string
  downloads: number
}

const reportTemplates: ReportTemplate[] = [
  {
    id: "exec-dashboard",
    name: "Executive Dashboard Summary",
    description: "High-level KPIs and ROI metrics for executive leadership",
    type: "executive",
    format: "pdf",
    sections: ["ROI Overview", "Cost Savings", "Performance Metrics", "Strategic Initiatives"],
    frequency: "weekly",
    recipients: ["ceo@company.com", "cfo@company.com"],
    lastGenerated: "2024-06-25T09:00:00",
    size: "2.4 MB",
    downloads: 47
  },
  {
    id: "process-analytics",
    name: "Process Performance Analytics",
    description: "Detailed process metrics, cycle times, and success rates",
    type: "operational", 
    format: "excel",
    sections: ["Process Metrics", "Cycle Time Analysis", "Error Rates", "Volume Trends"],
    frequency: "monthly",
    recipients: ["operations@company.com", "process-team@company.com"],
    lastGenerated: "2024-06-20T15:30:00",
    size: "8.7 MB",
    downloads: 123
  },
  {
    id: "team-performance",
    name: "Team Performance Report",
    description: "Individual and team productivity analytics with skill assessments",
    type: "operational",
    format: "pdf",
    sections: ["Team Metrics", "Individual Performance", "Skills Analysis", "Achievements"],
    frequency: "monthly",
    recipients: ["hr@company.com", "team-leads@company.com"],
    lastGenerated: "2024-06-18T11:45:00",
    size: "5.2 MB",
    downloads: 89
  },
  {
    id: "roi-financial",
    name: "ROI & Financial Impact",
    description: "Comprehensive financial analysis with projections vs actuals",
    type: "executive",
    format: "excel",
    sections: ["ROI Analysis", "Cost Breakdown", "Savings Summary", "Financial Projections"],
    frequency: "quarterly",
    recipients: ["finance@company.com", "cfo@company.com"],
    lastGenerated: "2024-06-01T14:00:00",
    size: "12.1 MB",
    downloads: 34
  },
  {
    id: "technical-metrics",
    name: "Technical Performance Metrics",
    description: "System performance, bot utilization, and technical KPIs",
    type: "technical",
    format: "csv",
    sections: ["Bot Utilization", "System Performance", "Error Logs", "Infrastructure Metrics"],
    frequency: "daily",
    recipients: ["tech-team@company.com", "devops@company.com"],
    lastGenerated: "2024-06-26T08:15:00",
    size: "1.8 MB",
    downloads: 256
  }
]

const scheduledReports = [
  {
    id: "sched-1",
    template: "Executive Dashboard Summary",
    frequency: "Weekly - Mondays 9:00 AM",
    recipients: 2,
    nextRun: "2024-07-01T09:00:00",
    status: "active"
  },
  {
    id: "sched-2", 
    template: "Process Performance Analytics",
    frequency: "Monthly - 1st day 3:00 PM",
    recipients: 4,
    nextRun: "2024-07-01T15:00:00",
    status: "active"
  },
  {
    id: "sched-3",
    template: "ROI & Financial Impact",
    frequency: "Quarterly - End of quarter",
    recipients: 3,
    nextRun: "2024-09-30T17:00:00",
    status: "paused"
  }
]

const exportHistory = [
  { date: "2024-06-26", report: "Executive Dashboard Summary", format: "PDF", user: "John Smith", size: "2.4 MB" },
  { date: "2024-06-26", report: "Technical Performance Metrics", format: "CSV", user: "Sarah Chen", size: "1.8 MB" },
  { date: "2024-06-25", report: "Team Performance Report", format: "PDF", user: "Michael Rodriguez", size: "5.2 MB" },
  { date: "2024-06-25", report: "Process Performance Analytics", format: "Excel", user: "Emma Thompson", size: "8.7 MB" },
  { date: "2024-06-24", report: "Executive Dashboard Summary", format: "PDF", user: "David Park", size: "2.4 MB" }
]

export function ExportCapabilities() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isCustomExportOpen, setIsCustomExportOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)

  const getTypeColor = (type: string) => {
    switch (type) {
      case "executive": return "bg-primary/20 text-primary border-primary/30"
      case "operational": return "bg-success/20 text-success border-success/30"
      case "technical": return "bg-warning/20 text-warning border-warning/30"
      default: return "bg-muted/20 text-muted-foreground border-border"
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf": return "📄"
      case "excel": return "📊"
      case "csv": return "📋"
      case "powerpoint": return "📈"
      default: return "📄"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "bg-success/20 text-success border-success/30"
      case "paused": return "bg-warning/20 text-warning border-warning/30"
      case "inactive": return "bg-muted/20 text-muted-foreground border-border"
      default: return "bg-muted/20 text-muted-foreground border-border"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export & Reporting</h2>
          <p className="text-muted-foreground">Generate, schedule, and manage analytics reports</p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={isCustomExportOpen} onOpenChange={setIsCustomExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Custom Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Custom Report</DialogTitle>
                <DialogDescription>
                  Configure a custom analytics report with your preferred metrics and format
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Name</Label>
                    <Input placeholder="My Custom Report" />
                  </div>
                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Report</SelectItem>
                        <SelectItem value="excel">Excel Workbook</SelectItem>
                        <SelectItem value="csv">CSV Data</SelectItem>
                        <SelectItem value="powerpoint">PowerPoint Presentation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Include Sections</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Executive Summary", "ROI Analysis", "Process Metrics", "Team Performance", "Department Insights", "Cost Savings", "Error Analysis", "Trends & Forecasts"].map((section) => (
                      <div key={section} className="flex items-center space-x-2">
                        <Checkbox id={section} />
                        <Label htmlFor={section} className="text-sm">{section}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" />
                    <Input type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Department Filter</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCustomExportOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-gradient-primary text-primary-foreground">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button className="bg-gradient-primary text-primary-foreground gap-2">
            <Download className="w-4 h-4" />
            Quick Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="bg-card border-border shadow-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-lg">{getFormatIcon(template.format)}</span>
                        {template.name}
                      </CardTitle>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    </div>
                    <Badge className={getTypeColor(template.type)}>
                      {template.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Report Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Format</p>
                      <p className="font-medium capitalize">{template.format.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="font-medium capitalize">{template.frequency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Generated</p>
                      <p className="font-medium">{new Date(template.lastGenerated).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Downloads</p>
                      <p className="font-medium">{template.downloads}</p>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Report Sections</p>
                    <div className="flex flex-wrap gap-1">
                      {template.sections.map((section, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recipients ({template.recipients.length})</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {template.recipients.slice(0, 2).join(", ")}
                        {template.recipients.length > 2 && ` +${template.recipients.length - 2} more`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button className="flex-1 gap-2">
                      <Download className="w-4 h-4" />
                      Generate Now
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Scheduled Reports</h3>
            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Calendar className="w-4 h-4" />
                  New Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Report</DialogTitle>
                  <DialogDescription>
                    Set up automated report generation and delivery
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Report Template</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <Input placeholder="Enter email addresses separated by commas" />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
                    Cancel
                  </Button>
                  <Button>
                    Create Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {scheduledReports.map((report) => (
              <Card key={report.id} className="bg-card border-border shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{report.template}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {report.frequency}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {report.recipients} recipients
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Next: {new Date(report.nextRun).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusBadge(report.status)}>
                        {report.status.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Switch checked={report.status === "active"} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>Recent report generations and downloads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportHistory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.report}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.format}</span>
                          <span>•</span>
                          <span>{item.size}</span>
                          <span>•</span>
                          <span>Generated by {item.user}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>Configure default export preferences and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Default Export Format</Label>
                    <p className="text-sm text-muted-foreground">Preferred format for quick exports</p>
                  </div>
                  <Select defaultValue="pdf">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications when scheduled reports are generated</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-archive Reports</Label>
                    <p className="text-sm text-muted-foreground">Automatically archive reports older than 90 days</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Branding</Label>
                    <p className="text-sm text-muted-foreground">Add company logo and branding to reports</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Default Recipients</Label>
                  <Input placeholder="Enter default email addresses for report distribution" />
                  <p className="text-xs text-muted-foreground">These recipients will be pre-selected when creating new scheduled reports</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Retention (Days)</Label>
                    <Input type="number" defaultValue="365" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max File Size (MB)</Label>
                    <Input type="number" defaultValue="50" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button className="gap-2">
                  <Settings className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}