import { useState, useEffect } from "react"
import { Activity, Bot, AlertTriangle, Clock, TrendingUp, Zap, Users, Server, Plane, CheckCircle2 } from "lucide-react"
import { DashboardMetricCard } from "@/components/DashboardMetricCard"
import { StatusIndicator } from "@/components/StatusIndicator"
import { AlertBanner } from "@/components/AlertBanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiGet, parseJsonResponse } from "@/services/api"

const Index = () => {
  const isICATUrl = typeof window !== 'undefined' && (() => {
    const href = window.location.href.toLowerCase()
    const hostname = window.location.hostname.toLowerCase()
    const origin = window.location.origin.toLowerCase()

    // Check for ICAT production URL
    if (href.includes('orbis-icat.alphalogix.tech') || origin.includes('orbis-icat.alphalogix.tech') || href.includes('icat')) {
      return true
    }

    // For localhost/127.0.0.1, default to ICAT (matching backend default)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname.includes('local')) {
      return true
    }

    // For santova production URL, return false
    if (href.includes('orbis-santova.alphalogix.tech') || origin.includes('orbis-santova.alphalogix.tech') || href.includes('santova')) {
      return false
    }

    // Default to ICAT for any other case (matching backend default)
    return true
  })()

  const [alerts, setAlerts] = useState([]
    /* [
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
  ] */
  )

  const dismissAlert = (id: number) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  // State for API data
  const [operationsData, setOperationsData] = useState({
    totalBot: 0,
    totalActiveBot: 0,
    totalSuccess: 0,
    totalException: 0,
    productionReadyBot: 0
  })

  // Fetch operations summary data
  useEffect(() => {
    const fetchOperationsData = async () => {
      try {
        const response = await apiGet("/api/operations/summary")
        const data = await parseJsonResponse(response)

        if (data.success && data.data) {
          setOperationsData({
            totalBot: data.data["Total Bot"] || data.data["totalBot"] || 0,
            totalActiveBot: data.data["Total ActiveBot"] || data.data["totalActiveBot"] || 0,
            totalSuccess: data.data["Total Success"] || data.data["totalSuccess"] || 0,
            totalException: data.data["Total Exception"] || data.data["totalException"] || 0,
            productionReadyBot: data.data["Production Ready Bot"] || data.data["productionReadyBot"] || 0
          })
        } else {
          console.warn("⚠️ Operations API response missing data:", data)
        }
      } catch (error) {
        console.error("❌ Error fetching operations data:", error)
      }
    }

    fetchOperationsData()
  }, [])


  // State for all airline details (fetched once, stored for filtering)
  const [allAirlineDetails, setAllAirlineDetails] = useState<Array<{
    name: string;
    status: "active" | "idle" | "error";
    runtime: string;
    sla: string;
    flightStatus: string;
    bot?: string;
    botId?: number;
  }>>([])

  // State for bot filter
  const [selectedBot, setSelectedBot] = useState<string>("all")

  // State for bot names from API
  const [botNames, setBotNames] = useState<Array<{ Bot_Id: number; Name: string }>>([])

  // State for Morgan Stanley details
  const [morganStanleyData, setMorganStanleyData] = useState<Array<any>>([])

  // Filter airline details based on selected bot (frontend filtering)
  const recentProcesses = selectedBot === "all"
    ? allAirlineDetails
    : allAirlineDetails.filter(p => {
      const botObj = botNames.find(b => b.Name === selectedBot)
      return botObj && p.botId === botObj.Bot_Id
    })

  // Determine which data to show based on selected bot
  // Default: Show Morgan Stanley (BotId 1)
  // When bot selected: Show data for that bot's ID
  const selectedBotObj = selectedBot === "all" 
    ? null 
    : botNames.find(b => b.Name === selectedBot)
  
  const selectedBotId = selectedBotObj?.Bot_Id

  // Determine what to display:
  // - Default (all): Morgan Stanley
  // - BotId 1: Morgan Stanley
  // - BotId 2: BWI/Flight Details
  // - Other: Empty
  const showMorganStanley = selectedBot === "all" || selectedBotId === 1
  const showBwiDetails = selectedBotId === 2

  // Get the data to display
  const displayData = showMorganStanley 
    ? morganStanleyData 
    : showBwiDetails 
      ? recentProcesses 
      : []

  const botMetrics = {
    total: operationsData.totalBot || 0,
    active: operationsData.totalActiveBot || 0,
    idle: Math.max(0, (operationsData.totalBot || 0) - (operationsData.totalActiveBot || 0) - (operationsData.totalException || 0)),
    error: operationsData.totalException || 0
  }

  // Fetch airline details for recent process activity (fetch once on mount)
  useEffect(() => {
    const fetchAirlineDetails = async () => {
      try {
        const response = await apiGet("/api/operations/airline-details")
        const data = await parseJsonResponse(response)

        if (data.success && data.data && Array.isArray(data.data)) {
          // Map airline details to process format
          const mappedProcesses = data.data.map((airline: any) => {
            const flightStatus = airline["Flight Status"] || ""
            let status: "active" | "idle" | "error" = "idle"

            if (["Done", "Active", "InProgress"].includes(flightStatus)) status = "active"
            else if (["Exception", "Error", "Failed"].includes(flightStatus)) status = "error"

            return {
              name: airline["Flight Number"] || "Unknown Flight",
              status,
              runtime: "—",
              sla: airline["Airline Status"] || "—",
              flightStatus: flightStatus || "—",
              botId: airline["BotId"]
            }
          })


          // Store all airline details for frontend filtering
          setAllAirlineDetails(mappedProcesses)
        } else {
          console.warn("⚠️ Airline details API response missing or invalid data:", data)
          setAllAirlineDetails([])
        }
      } catch (error) {
        console.error("❌ Error fetching airline details:", error)
        setAllAirlineDetails([])
      }
    }

    fetchAirlineDetails()
  }, []) // Fetch once on mount - filtering happens in frontend

  // Fetch bot names from API
  useEffect(() => {
    const fetchBotNames = async () => {
      try {
        const response = await apiGet("/api/bots")
        const data = await parseJsonResponse(response)
        if (data.success && data.data && Array.isArray(data.data)) {
          setBotNames(data.data)
        }
      } catch (error) {
        console.error("Error fetching bot names:", error)
        setBotNames([])
      }
    }

    fetchBotNames()
  }, [])



  // Fetch Morgan Stanley details
  useEffect(() => {
    const fetchMorganStanleyData = async () => {
      try {
        const response = await apiGet("/api/operations/morgan-stanley")
        const data = await parseJsonResponse(response)

        if (data.success && data.data && Array.isArray(data.data)) {
          setMorganStanleyData(data.data)
        } else {
          console.warn("⚠️ Morgan Stanley API response missing or invalid data:", data)
          setMorganStanleyData([])
        }
      } catch (error) {
        console.error("❌ Error fetching Morgan Stanley data:", error)
        setMorganStanleyData([])
      }
    }

    fetchMorganStanleyData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Operations Dashboard</h1>
            <p className="text-muted-foreground">Real-time monitoring and control center</p>
          </div>
          {/* <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
            <Button size="sm" className="bg-gradient-primary">
              <Zap className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
          </div> */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <DashboardMetricCard
            title="Active Bots - (BWI)"
            value={`${operationsData.totalActiveBot}`}
            subtitle={`of ${operationsData.totalBot} total bots`}
            icon={<Bot />}
            variant="success"
            trend={{ value: 12, label: "from yesterday" }}
          />

          <DashboardMetricCard
            title="Total Bots"
            value={operationsData.totalBot}
            subtitle={`${operationsData.totalBot} total bots`}
            icon={<Bot />}
            variant="success"
            trend={{ value: 10, label: "from yesterday" }}
          />

          <DashboardMetricCard
            title="Success"
            value={operationsData.totalSuccess.toString()}
            subtitle="Last 24 hours"
            icon={<TrendingUp />}
            variant="success"
            trend={{ value: 5, label: "increase" }}
          />
          <DashboardMetricCard
            title="Exceptions"
            value={operationsData.totalException.toString()}
            subtitle="Last 24 hours"
            icon={<AlertTriangle />}
            variant="danger"
            trend={{ value: 0, label: "increase" }}
          />

          <DashboardMetricCard
            title="Production Ready Bot - (Morgan Stanley,  CRAF)"
            value={operationsData.productionReadyBot.toString()}
            subtitle={`of ${operationsData.totalBot} bots ready for production`}
            icon={<CheckCircle2 />}
            variant="warning"
            trend={{ value: 0, label: "this week" }}
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Plane className="w-4 h-4 text-primary" />
                      Recent Process Activity
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Latest processing status and updates
                    </p>
                  </div>
                  {/* Bot Filter Dropdown - On the same line as header, aligned to the right */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                      Filter by Bot:
                    </label>
                    <Select value={selectedBot} onValueChange={setSelectedBot}>
                      <SelectTrigger className="w-[200px] bg-background border-border hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Select Bot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Bots</SelectItem>
                        {botNames.map((bot) => (
                          <SelectItem key={bot.Bot_Id} value={bot.Name}>
                            {bot.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Unified Process Details Container */}
                <div className="space-y-2">
                  {/* Show appropriate header based on what's displayed */}
                  {showMorganStanley && (
                    <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b-2 border-primary/30">
                      {selectedBot === "all" ? "Morgan Stanley Details" : selectedBotObj?.Name || "Process Details"}
                    </h3>
                  )}
                  {showBwiDetails && (
                    <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b-2 border-primary/30">
                      {selectedBotObj?.Name || "BWI Details"}
                    </h3>
                  )}

                  {displayData.length > 0 ? (
                    <>
                      {/* Header Row - Dynamic based on data type */}
                      {showMorganStanley ? (
                        <div className="grid grid-cols-5 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                          <div className="flex items-center gap-2">
                            <span>Task Number</span>
                          </div>
                          <div className="flex items-center">
                            <span>Status</span>
                          </div>
                          <div className="flex items-center">
                            <span>State</span>
                          </div>
                          <div className="flex items-center">
                            <span>Assigned To</span>
                          </div>
                          <div className="flex items-center justify-end">
                            <span>Request Item</span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                          <div className="flex items-center gap-2">
                            <span>Flight Number</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span>Flight Status</span>
                          </div>
                          <div className="flex items-center justify-end">
                            <span>Airline Status</span>
                          </div>
                        </div>
                      )}

                      {/* Process List with Scrollbar */}
                      <div className="max-h-[500px] overflow-y-auto overflow-x-hidden space-y-2 pr-2 custom-scrollbar">
                        {showMorganStanley ? (
                          // Morgan Stanley table rows
                          displayData.map((item: any, index: number) => {
                            const taskNumber = item["TaskNumber"] || item["Task Number"] || item["task_number"] || "—"
                            const status = item["Status"] || item["status"] || "—"
                            const state = item["State"] || item["state"] || "—"
                            const assignedTo = item["AssignedTo"] || item["Assigned To"] || item["assigned_to"] || "—"
                            const requestItem = item["RequestedItem"] || item["Requested Item"] || item["requested_item"] || "—"

                            let statusType: "active" | "idle" | "error" = "idle"
                            if (status === "Done" || status === "Active" || status === "active" || status === "InProgress") {
                              statusType = "active"
                            } else if (status === "Exception" || status === "Error" || status === "error" || status === "Failed") {
                              statusType = "error"
                            } else if (status === "Pending Work Window" || state === "Pending Work Window") {
                              statusType = "idle"
                            }

                            return (
                              <div
                                key={index}
                                className="grid grid-cols-5 gap-4 items-center p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors bg-card"
                              >
                                <div className="flex items-center gap-3">
                                  <StatusIndicator status={statusType}>
                                    <span className="font-medium text-foreground text-sm">{taskNumber}</span>
                                  </StatusIndicator>
                                </div>
                                <div className="flex items-center">
                                  {status === "—" ? (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  ) : (
                                    <Badge
                                      variant={statusType === "active" ? "default" : statusType === "error" ? "destructive" : "secondary"}
                                      className="text-xs font-medium"
                                    >
                                      {status}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  {state === "—" ? (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-medium"
                                    >
                                      {state}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <span className={`text-sm ${assignedTo === "—" ? "text-muted-foreground" : "text-foreground"}`}>
                                    {assignedTo}
                                  </span>
                                </div>
                                <div className="flex items-center justify-end">
                                  <span className={`text-sm ${requestItem === "—" ? "text-muted-foreground" : "text-foreground"}`}>
                                    {requestItem}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          // BWI/Flight Details table rows
                          displayData.map((process: any, index: number) => (
                            <div
                              key={index}
                              className="grid grid-cols-3 gap-4 items-center p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors bg-card"
                            >
                              <div className="flex items-center gap-3">
                                <StatusIndicator status={process.status as any}>
                                  <span className="font-medium text-foreground text-sm">{process.name}</span>
                                </StatusIndicator>
                              </div>
                              <div className="flex items-center justify-center">
                                {process.flightStatus === "—" ? (
                                  <span className="text-sm text-muted-foreground">—</span>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-medium"
                                  >
                                    {process.flightStatus}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-end">
                                {process.sla === "—" ? (
                                  <span className="text-sm text-muted-foreground">—</span>
                                ) : (
                                  <Badge
                                    variant={process.status === "active" ? "default" : process.status === "error" ? "destructive" : "secondary"}
                                    className="text-xs font-medium"
                                  >
                                    {process.sla}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                      <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">
                        {selectedBot === "all" 
                          ? "No Morgan Stanley data available" 
                          : `No data available for ${selectedBotObj?.Name || "selected bot"}`}
                      </p>
                      <p className="text-xs mt-1">Data will appear here when available</p>
                    </div>
                  )}
                </div>
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
                  <Badge className="bg-success text-success-foreground">Idle</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Queue Manager</span>
                  <Badge className="bg-success text-success-foreground">Idle</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Analytics Engine</span>
                  <Badge className="bg-warning text-warning-foreground">Idle</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Notification Service</span>
                  <Badge className="bg-success text-success-foreground">Idle</Badge>
                </div>
              </div>

              {/* <div className="pt-4 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3">Resource Utilization</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">CPU</span>
                      <span className="text-foreground">0%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Memory</span>
                      <span className="text-foreground">0%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-success h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Storage</span>
                      <span className="text-foreground">0%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-success h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
