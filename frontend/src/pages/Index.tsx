import { useState } from "react"
import { Activity, Bot, AlertTriangle, Clock, TrendingUp, Zap, Users, Server } from "lucide-react"
import { DashboardMetricCard } from "@/components/DashboardMetricCard"
import { StatusIndicator } from "@/components/StatusIndicator"
import { AlertBanner } from "@/components/AlertBanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const Index = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'warning' as const,
      title: 'SLA Warning',
      message: 'Invoice Processing is approaching SLA breach in 45 minutes'
    },
    {
      id: 2,
      type: 'info' as const,
      title: 'Maintenance Window',
      message: 'Scheduled maintenance for Bot Farm 2 will begin at 2:00 AM EST'
    }
  ])

  const dismissAlert = (id: number) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  // Mock data for the dashboard
  const botMetrics = {
    total: 24,
    active: 18,
    idle: 4,
    error: 2
  }

  const recentProcesses = [
    { name: "Invoice Processing", status: "active", runtime: "2h 15m", sla: "85%" },
    { name: "Customer Onboarding", status: "idle", runtime: "0m", sla: "92%" },
    { name: "Report Generation", status: "active", runtime: "45m", sla: "78%" },
    { name: "Data Migration", status: "error", runtime: "1h 30m", sla: "45%" },
    { name: "Email Automation", status: "active", runtime: "3h 20m", sla: "95%" }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Operations Dashboard</h1>
            <p className="text-muted-foreground">Real-time monitoring and control center</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
            <Button size="sm" className="bg-gradient-primary">
              <Zap className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertBanner
                key={alert.id}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onDismiss={() => dismissAlert(alert.id)}
                action={{
                  label: "View Details",
                  onClick: () => console.log("View details clicked")
                }}
              />
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardMetricCard
            title="Active Bots"
            value={botMetrics.active}
            subtitle={`of ${botMetrics.total} total bots`}
            icon={<Bot />}
            variant="success"
            trend={{ value: 12, label: "from yesterday" }}
          />
          
          <DashboardMetricCard
            title="SLA Compliance"
            value="87.5%"
            subtitle="Average across all processes"
            icon={<TrendingUp />}
            variant="warning"
            trend={{ value: -3.2, label: "this week" }}
          />
          
          <DashboardMetricCard
            title="Exceptions"
            value="23"
            subtitle="Last 24 hours"
            icon={<AlertTriangle />}
            variant="danger"
            trend={{ value: 15, label: "increase" }}
          />
          
          <DashboardMetricCard
            title="Avg Process Time"
            value="4.2m"
            subtitle="Across all automation"
            icon={<Clock />}
            trend={{ value: -8.5, label: "improvement" }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bot Status Overview */}
          <Card className="lg:col-span-2 bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Bot Farm Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-success">{botMetrics.active}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="text-center p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-warning">{botMetrics.idle}</div>
                  <div className="text-sm text-muted-foreground">Idle</div>
                </div>
                <div className="text-center p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-destructive">{botMetrics.error}</div>
                  <div className="text-sm text-muted-foreground">Error</div>
                </div>
                <div className="text-center p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-foreground">{botMetrics.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Recent Process Activity</h4>
                {recentProcesses.map((process, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <StatusIndicator status={process.status as any}>
                        <span className="font-medium text-foreground">{process.name}</span>
                      </StatusIndicator>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Runtime: {process.runtime}</span>
                      <Badge 
                        variant={parseInt(process.sla) > 80 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        SLA: {process.sla}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Bot Orchestrator</span>
                  <Badge className="bg-success text-success-foreground">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Queue Manager</span>
                  <Badge className="bg-success text-success-foreground">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Analytics Engine</span>
                  <Badge className="bg-warning text-warning-foreground">Degraded</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Notification Service</span>
                  <Badge className="bg-success text-success-foreground">Healthy</Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3">Resource Utilization</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">CPU</span>
                      <span className="text-foreground">67%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-primary h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Memory</span>
                      <span className="text-foreground">45%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-success h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Storage</span>
                      <span className="text-foreground">23%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-success h-2 rounded-full" style={{ width: '23%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
