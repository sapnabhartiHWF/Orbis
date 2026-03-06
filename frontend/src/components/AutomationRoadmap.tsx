import { useState, useEffect } from "react"
import { Calendar, Clock, Target, Users, TrendingUp, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2, CheckCircle2, Circle, Loader, Grid, List, UserCheck, XCircle, AlertCircle, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { getAutomationRoadmap } from "@/services/processRegistrationApi"

// ----------------------------------------------------------------
// Types — aligned with SP column names + approval details
// ----------------------------------------------------------------
interface Milestone {
  name: string
  date: string
  movedBy: string
  completed: boolean
  inProgress: boolean
  status?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
}

interface RoadmapItem {
  id: string
  title: string
  description: string
  quarter: string
  year: number
  status: "Not Started" | "In Progress" | "Completed"
  priority: "Low" | "Medium" | "High" | "Critical"
  department: string
  estimatedROI: number
  timeline: { start: string; end: string }
  progress: number
  submittedBy: string
  milestones: Milestone[]
}

interface BackendRoadmapItem {
  ProcessId?: number
  Title?: string
  Description?: string
  CurrentStage?: string
  Status?: string
  Priority?: string
  Department?: string
  EstimatedROI?: number
  Progress?: number
  TimelineStart?: string | null
  TimelineEnd?: string | null
  SubmittedBy?: string
  milestones?: Array<{
    StageName?: string
    SequenceOrder?: number
    movedAt?: string | null
    MovedByName?: string | null
    status?: string
    IsCompleted?: number
    approval_status?: string
    approved_by?: string
    approved_at?: string | null
    rejected_by?: string
    rejected_at?: string | null
    rejection_reason?: string
  }>
}

// ----------------------------------------------------------------
// Map backend → RoadmapItem
// ----------------------------------------------------------------
const mapBackendToRoadmapItem = (item: BackendRoadmapItem): RoadmapItem => {
  const startDate = item.TimelineStart ? new Date(item.TimelineStart) : new Date()
  const year      = startDate.getFullYear()
  const month     = startDate.getMonth() + 1
  const quarter   = month <= 3 ? "Q1" : month <= 6 ? "Q2" : month <= 9 ? "Q3" : "Q4"

  const sorted = [...(item.milestones || [])].sort(
    (a, b) => (a.SequenceOrder ?? 0) - (b.SequenceOrder ?? 0)
  )

  const currentStageName = (item.CurrentStage || "").toLowerCase()
  const currentStageIdx  = sorted.findIndex(
    m => (m.StageName || "").toLowerCase() === currentStageName
  )

  const milestones: Milestone[] = sorted.map((m, idx) => {
    const isCompleted  = currentStageIdx >= 0 ? idx < currentStageIdx : (!!m.IsCompleted || !!m.movedAt)
    const isInProgress = idx === currentStageIdx
    return {
      name:             m.StageName          || "Stage",
      date:             m.movedAt            || "",
      movedBy:          m.MovedByName        || "",
      completed:        isCompleted,
      inProgress:       isInProgress,
      status:           m.status             || "",
      approvedBy:       m.approved_by        || "",
      approvedAt:       m.approved_at        || "",
      rejectedBy:       m.rejected_by        || "",
      rejectedAt:       m.rejected_at        || "",
      rejectionReason:  m.rejection_reason   || "",
    }
  })

  return {
    id:           `R${String(item.ProcessId || 0).padStart(3, "0")}`,
    title:        item.Title        || "Untitled Process",
    description:  item.Description  || "",
    quarter,
    year,
    status:       (item.Status as any) || "Not Started",
    priority:     (item.Priority as any) || "Medium",
    department:   item.Department   || "Unknown",
    estimatedROI: item.EstimatedROI || 0,
    timeline: {
      start: item.TimelineStart || new Date().toISOString().split("T")[0],
      end:   item.TimelineEnd   || new Date().toISOString().split("T")[0],
    },
    progress:    item.Progress    || 0,
    submittedBy: item.SubmittedBy || "",
    milestones,
  }
}

// ----------------------------------------------------------------
// Style helpers
// ----------------------------------------------------------------
const getStatusColor = (status: string) => {
  switch (status) {
    case "Not Started": return "bg-muted text-muted-foreground"
    case "In Progress": return "bg-blue-500/20 text-blue-600 border-blue-500/30"
    case "Completed":   return "bg-success/20 text-success-foreground border-success/30"
    case "Approved":    return "bg-green-500/20 text-green-600 border-green-500/30"
    case "Rejected":    return "bg-red-500/20 text-red-600 border-red-500/30"
    case "Pending":     return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
    default:            return "bg-muted text-muted-foreground"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Low":      return "bg-muted text-muted-foreground"
    case "Medium":   return "bg-blue-500/20 text-blue-400"
    case "High":     return "bg-warning/20 text-warning-foreground"
    case "Critical": return "bg-destructive/20 text-destructive-foreground"
    default:         return "bg-muted text-muted-foreground"
  }
}

const formatROI = (value: number): string => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`
  if (value > 0)          return `$${value.toLocaleString()}`
  return "$0"
}

const formatDateTime = (dateStr: string | undefined): string => {
  if (!dateStr) return ""
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  } catch {
    return ""
  }
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function AutomationRoadmap() {
  const [selectedYear,    setSelectedYear]    = useState(new Date().getFullYear())
  const [selectedView,    setSelectedView]    = useState<"quarterly" | "annual">("quarterly")
  const [selectedQuarter, setSelectedQuarter] = useState(`Q${Math.ceil((new Date().getMonth() + 1) / 3)}`)
  const [roadmapData,     setRoadmapData]     = useState<RoadmapItem[]>([])
  const [expandedId,      setExpandedId]      = useState<string | null>(null)
  const [isLoading,       setIsLoading]       = useState(true)
  const [error,           setError]           = useState<string | null>(null)
  const [viewMode,        setViewMode]        = useState<"grid" | "list">("grid")
  const [selectedRoadmapItem, setSelectedRoadmapItem] = useState<RoadmapItem | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await getAutomationRoadmap()

        if (response.success && response.data) {
          const mapped: RoadmapItem[] = response.data.map(
            (item: BackendRoadmapItem) => mapBackendToRoadmapItem(item)
          )
          setRoadmapData(mapped)

          if (mapped.length > 0) {
            setSelectedYear(Math.min(...mapped.map(i => i.year)))
          }
        } else {
          const msg = response.error || "Failed to load automation roadmap"
          setError(msg)
          toast({ title: "Error", description: msg, variant: "destructive" })
        }
      } catch (err: any) {
        const msg = err?.message || "Failed to fetch automation roadmap"
        setError(msg)
        toast({ title: "Error", description: msg, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredData = roadmapData.filter(item =>
    selectedView === "annual"
      ? item.year === selectedYear
      : item.year === selectedYear && item.quarter === selectedQuarter
  )

  const totalROI        = filteredData.reduce((s, i) => s + i.estimatedROI, 0)
  const completedItems  = filteredData.filter(i => i.status === "Completed").length
  const inProgressItems = filteredData.filter(i => i.status === "In Progress").length
  const availableYears  = Array.from(new Set(roadmapData.map(i => i.year))).sort()
  const quarters        = ["Q1", "Q2", "Q3", "Q4"]

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const navigateQuarter = (dir: -1 | 1) => {
    const idx = quarters.indexOf(selectedQuarter) + dir
    if (idx >= 0 && idx < 4) setSelectedQuarter(quarters[idx])
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading automation roadmap...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-2">Failed to load automation roadmap</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Calendar className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Automation Roadmap</h2>
            <p className="text-muted-foreground">Strategic planning and timeline view</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Toggle Buttons */}
          <div className="inline-flex items-center rounded-lg border border-border bg-card p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              type="button"
              aria-label="Grid view"
              className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all min-w-[40px] h-9 ${
                viewMode === "grid"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              type="button"
              aria-label="List view"
              className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all min-w-[40px] h-9 ${
                viewMode === "list"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Select value={selectedView} onValueChange={(v: "quarterly" | "annual") => setSelectedView(v)}>
            <SelectTrigger className="w-40 bg-card border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="quarterly">Quarterly View</SelectItem>
              <SelectItem value="annual">Annual View</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-28 bg-card border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(availableYears.length > 0 ? availableYears : [2024, 2025, 2026]).map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedView === "quarterly" && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"
                onClick={() => navigateQuarter(-1)}
                disabled={selectedQuarter === "Q1"}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger className="w-20 bg-card border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {quarters.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm"
                onClick={() => navigateQuarter(1)}
                disabled={selectedQuarter === "Q4"}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Total ROI</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {formatROI(totalROI)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-success-foreground">{completedItems}</p>
              </div>
              <Target className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-warning-foreground">{inProgressItems}</p>
              </div>
              <Clock className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{filteredData.length}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roadmap Items */}
      {filteredData.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No roadmap items found</p>
            <p className="text-sm text-muted-foreground">
              {selectedView === "annual"
                ? `No items found for ${selectedYear}`
                : `No items found for ${selectedQuarter} ${selectedYear}`}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((item) => (
            <Card key={item.id} className="bg-card border-border shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col">
              {/* ── Clickable Header ── */}
              <div
                className="cursor-pointer select-none flex-1 flex flex-col"
                onClick={() => {
                  setSelectedRoadmapItem(item)
                  setIsDetailsDialogOpen(true)
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-1 rounded-md flex-shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  <CardTitle className="text-base mb-1 line-clamp-2">{item.title}</CardTitle>
                  {item.description && (
                    <CardDescription className="line-clamp-2 text-xs">{item.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col space-y-3">
                  {/* ROI and Department */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="font-semibold text-success">{formatROI(item.estimatedROI)}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{item.department}</Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-1.5" />
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">
                      {new Date(item.timeline.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                      {new Date(item.timeline.end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span className="flex-shrink-0 ml-2">
                      {Math.ceil(
                        (new Date(item.timeline.end).getTime() - new Date(item.timeline.start).getTime()) /
                        (1000 * 60 * 60 * 24)
                      )}d
                    </span>
                  </div>

                  {/* Milestones — compact dots row */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {item.milestones.slice(0, 5).map((ms, idx) => (
                      <div key={idx} className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${
                          ms.completed
                            ? "bg-success"
                            : ms.inProgress
                              ? "bg-blue-500 ring-2 ring-blue-500/30"
                              : "bg-muted"
                        }`} title={ms.name} />
                      </div>
                    ))}
                    {item.milestones.length > 5 && (
                      <span className="text-xs text-muted-foreground">+{item.milestones.length - 5}</span>
                    )}
                  </div>

                  {/* Submitted by */}
                  {item.submittedBy && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                      <Users className="w-3 h-3" />
                      <span className="truncate">{item.submittedBy}</span>
                    </div>
                  )}
                </CardContent>
              </div>

            </Card>
          ))}
        </div>

        {selectedRoadmapItem && (
          <Dialog
            open={isDetailsDialogOpen}
            onOpenChange={(open) => {
              setIsDetailsDialogOpen(open)
              if (!open) {
                setSelectedRoadmapItem(null)
              }
            }}
          >
            <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto bg-card">
              <DialogHeader>
                <DialogTitle>{selectedRoadmapItem.title}</DialogTitle>
                {selectedRoadmapItem.description && (
                  <DialogDescription>{selectedRoadmapItem.description}</DialogDescription>
                )}
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Summary row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Process ID</p>
                    <p className="font-medium">{selectedRoadmapItem.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Department</p>
                    <p className="font-medium">{selectedRoadmapItem.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Estimated ROI</p>
                    <p className="font-medium text-success">
                      {formatROI(selectedRoadmapItem.estimatedROI)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Stages Done</p>
                    <p className="font-medium">
                      {selectedRoadmapItem.milestones.filter(m => m.completed).length} / {selectedRoadmapItem.milestones.length}
                    </p>
                  </div>
                </div>

                {/* Detailed stage timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Detailed Stage Timeline
                  </h4>

                  <div className="relative pl-6">
                    <div className="absolute left-[11px] top-3 bottom-1 w-px bg-border" />
                    <div className="space-y-4">
                      {selectedRoadmapItem.milestones.map((ms, idx) => (
                        <div key={idx} className="relative">
                          {/* Stage icon */}
                          <div
                            className={`absolute -left-6 flex items-center justify-center w-6 h-6 rounded-full border-2 z-10 ${
                              ms.completed
                                ? "bg-success border-success"
                                : ms.inProgress
                                  ? "bg-blue-500 border-blue-500"
                                  : "bg-background border-border"
                            }`}
                          >
                            {ms.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            ) : ms.inProgress ? (
                              <Loader className="w-3.5 h-3.5 text-white animate-spin" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>

                          {/* Stage card */}
                          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className={`text-base font-semibold ${
                                  ms.completed
                                    ? "text-success"
                                    : ms.inProgress
                                      ? "text-blue-600"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {ms.name}
                              </span>
                              {ms.status && (
                                <Badge className={getStatusColor(ms.status)}>{ms.status}</Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              {/* Submitted info */}
                              {ms.date && ms.movedBy && (
                                <div className="flex items-start gap-2 p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-md border border-blue-200/50 dark:border-blue-800/60">
                                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-foreground">Submitted</p>
                                    <p className="text-muted-foreground mt-1">{formatDateTime(ms.date)}</p>
                                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                      <Users className="w-3 h-3" />
                                      {ms.movedBy}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Approved info */}
                              {ms.approvedBy && ms.approvedAt && (
                                <div className="flex items-start gap-2 p-3 bg-green-50/60 dark:bg-green-950/20 rounded-md border border-green-200/60 dark:border-green-800/60">
                                  <UserCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-green-700 dark:text-green-400">
                                      Approved
                                    </p>
                                    <p className="text-green-600 dark:text-green-500 mt-1">
                                      {formatDateTime(ms.approvedAt)}
                                    </p>
                                    <p className="text-green-600 dark:text-green-500 flex items-center gap-1 mt-1">
                                      <Users className="w-3 h-3" />
                                      {ms.approvedBy}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Rejected info */}
                              {ms.rejectedBy && ms.rejectedAt && (
                                <div className="col-span-2 flex items-start gap-2 p-3 bg-red-50/60 dark:bg-red-950/20 rounded-md border border-red-200/60 dark:border-red-800/60">
                                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-red-700 dark:text-red-400">
                                      Rejected
                                    </p>
                                    <p className="text-red-600 dark:text-red-500 mt-1">
                                      {formatDateTime(ms.rejectedAt)}
                                    </p>
                                    <p className="text-red-600 dark:text-red-500 flex items-center gap-1 mt-1">
                                      <Users className="w-3 h-3" />
                                      {ms.rejectedBy}
                                    </p>
                                    {ms.rejectionReason && (
                                      <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                                        <p className="text-red-700 dark:text-red-400 flex items-start gap-1">
                                          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                          <span>{ms.rejectionReason}</span>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Pending info */}
                              {!ms.date && !ms.completed && !ms.inProgress && (
                                <div className="col-span-2 p-3 bg-muted/60 rounded-md border border-border">
                                  <p className="text-muted-foreground italic flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    Awaiting submission
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        </>
      ) : (
        // List view with enhanced details (similar structure but wider layout)
        <div className="space-y-4">
          {filteredData.map((item) => (
            <Card key={item.id} className="bg-card border-border shadow-card hover:shadow-elevated transition-all duration-300">
              <div
                className="cursor-pointer select-none"
                onClick={() => toggleExpand(item.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          ROI: {formatROI(item.estimatedROI)}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.department}</p>
                      </div>
                      <div className={`${expandedId === item.id ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600'} p-1 rounded-md`}>
                        {expandedId === item.id
                          ? <ChevronUp className="w-5 h-5" />
                          : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {new Date(item.timeline.start).toLocaleDateString()} –{" "}
                        {new Date(item.timeline.end).toLocaleDateString()}
                      </span>
                      <span>
                        {Math.ceil(
                          (new Date(item.timeline.end).getTime() - new Date(item.timeline.start).getTime()) /
                          (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </span>
                    </div>

                    <div className="flex items-center justify-between w-full gap-2 overflow-x-auto pb-1">
                      {item.milestones.map((ms, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs whitespace-nowrap flex-1 min-w-0 justify-center">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            ms.completed
                              ? "bg-success"
                              : ms.inProgress
                                ? "bg-blue-500 ring-2 ring-blue-500/30"
                                : "bg-muted"
                          }`} />
                          <span className={`truncate ${
                            ms.completed
                              ? "text-success"
                              : ms.inProgress
                                ? "text-blue-600 font-medium"
                                : "text-muted-foreground"
                          }`}>
                            {ms.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {item.submittedBy && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t border-border">
                        <Users className="w-3.5 h-3.5" />
                        <span>Submitted by {item.submittedBy}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* List view expanded panel - same enhanced structure as grid */}
              {expandedId === item.id && (
                <div className="border-t border-border bg-muted/30 px-6 py-4 rounded-b-xl max-h-[600px] overflow-y-auto">
                  <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Detailed Stage Timeline
                  </h4>

                  {/* Enhanced vertical stage timeline */}
                  <div className="relative pl-6">
                    <div className="absolute left-[11px] top-3 bottom-1 w-px bg-border" />

                    <div className="space-y-4">
                      {item.milestones.map((ms, idx) => (
                        <div key={idx} className="relative">
                          {/* Stage icon */}
                          <div className={`absolute -left-6 flex items-center justify-center w-6 h-6 rounded-full border-2 z-10 ${
                            ms.completed
                              ? "bg-success border-success"
                              : ms.inProgress
                                ? "bg-blue-500 border-blue-500"
                                : "bg-background border-border"
                          }`}>
                            {ms.completed
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              : ms.inProgress
                                ? <Loader className="w-3.5 h-3.5 text-white animate-spin" />
                                : <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                          </div>

                          {/* Stage info card */}
                          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                            {/* Stage name and status */}
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-base font-semibold ${
                                ms.completed
                                  ? "text-success"
                                  : ms.inProgress
                                    ? "text-blue-600"
                                    : "text-muted-foreground"
                              }`}>
                                {ms.name}
                              </span>
                              {ms.status && (
                                <Badge className={getStatusColor(ms.status)}>
                                  {ms.status}
                                </Badge>
                              )}
                            </div>

                            {/* Grid layout for all stage details */}
                            <div className="grid grid-cols-2 gap-4">
                              {/* Created/Submitted info */}
                              {ms.date && ms.movedBy && (
                                <div className="flex items-start gap-2 p-3 bg-blue-50/30 dark:bg-blue-950/20 rounded-md border border-blue-200/50 dark:border-blue-800/50">
                                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-foreground">Submitted</p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(ms.date)}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <Users className="w-3 h-3" />
                                      {ms.movedBy}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Approved info */}
                              {ms.approvedBy && ms.approvedAt && (
                                <div className="flex items-start gap-2 p-3 bg-green-50/50 dark:bg-green-950/20 rounded-md border border-green-200/50 dark:border-green-800/50">
                                  <UserCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">Approved</p>
                                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">{formatDateTime(ms.approvedAt)}</p>
                                    <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1 mt-1">
                                      <Users className="w-3 h-3" />
                                      {ms.approvedBy}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Rejected info */}
                              {ms.rejectedBy && ms.rejectedAt && (
                                <div className="col-span-2 flex items-start gap-2 p-3 bg-red-50/50 dark:bg-red-950/20 rounded-md border border-red-200/50 dark:border-red-800/50">
                                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">Rejected</p>
                                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">{formatDateTime(ms.rejectedAt)}</p>
                                    <p className="text-xs text-red-600 dark:text-red-500 flex items-center gap-1 mt-1">
                                      <Users className="w-3 h-3" />
                                      {ms.rejectedBy}
                                    </p>
                                    {ms.rejectionReason && (
                                      <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                                        <p className="text-xs text-red-700 dark:text-red-400 font-medium flex items-start gap-1">
                                          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                          <span>Reason: {ms.rejectionReason}</span>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Pending/Not started info */}
                              {!ms.date && !ms.completed && !ms.inProgress && (
                                <div className="col-span-2 p-3 bg-muted/50 rounded-md border border-border">
                                  <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Awaiting submission
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary footer */}
                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Process ID</p>
                      <p className="font-medium">{item.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Department</p>
                      <p className="font-medium">{item.department}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Estimated ROI</p>
                      <p className="font-medium text-success">{formatROI(item.estimatedROI)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Stages Done</p>
                      <p className="font-medium">
                        {item.milestones.filter(m => m.completed).length} / {item.milestones.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}