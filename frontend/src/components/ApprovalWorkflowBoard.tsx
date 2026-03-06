import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Building,
  TrendingUp,
  Loader2,
  User,
  Upload,
  Download,
  CheckCircle,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import {
  getPendingApprovals,
  createInitialTriage,
  updateInitialTriageStage,
  approveStage,
  rejectStage,
  rejectInitialTriage,
  getStageIdByName,
  getAllStages,
  StageData,
  getProcessCompleteDetail,
  downloadSampleData,
  downloadSopDoc,
  apiCall,
} from "@/services/processRegistrationApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// ─────────────────────────────────────────────
// Role IDs — must match DB Role table
// ─────────────────────────────────────────────
const ROLE_RPA_LEAD = 14  // Automation Lead
const ROLE_OWNER    = 15  // Owner

interface PendingApproval {
  process_id: number
  StageName: string
  SequenceOrder?: number
  approval_status: string
  approved_by?: number
  rejected_by?: number
  rejection_reason?: string
  RequestedAt?: string
  Title: string
  Description?: string
  Department: string
  Priority: string
  ExpectedROI: number
  ApprovedByName?: string
  RejectedByName?: string
  SubmittedByName?: string
  SampledataPath?: string
  SopDoc?: string
  DA_PddPath?: string
  DA_MimeType?: string
  BC_FteSavings?: number
  BC_CostSavings?: number
  BC_ImplementationCost?: number
  BC_PaybackMonths?: number
  BC_RoiPercent?: number
  GL_DeploymentDate?: string
  GL_DeploymentEnvironment?: string
  GL_BotVersion?: string
  GL_DeploymentNotes?: string
}

interface ApprovalWorkflowBoardProps {
  onProcessUpdated?: () => void
}

export function ApprovalWorkflowBoard({ onProcessUpdated }: ApprovalWorkflowBoardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const getRoleId = (): number | null => {
    const fromUser = user?.RoleId || user?.roleId || user?.role?.RoleId
    const fromStorage = localStorage.getItem("roleId")
    let fromLocalUser = null
    try {
      const u = localStorage.getItem("user")
      if (u) {
        const parsed = JSON.parse(u)
        fromLocalUser = parsed?.RoleId || parsed?.roleId || parsed?.role?.RoleId
      }
    } catch {}
    const all = [fromUser, fromStorage, fromLocalUser].filter(Boolean)
    return all.length > 0 ? Number(all[0]) : null
  }

  const userIsRPALead = getRoleId() === ROLE_RPA_LEAD
  const userIsOwner   = getRoleId() === ROLE_OWNER

  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [allStages, setAllStages] = useState<StageData[]>([])
  const [triageData, setTriageData] = useState({
    isRuleBased: undefined as boolean | undefined,
    isStable: undefined as boolean | undefined,
    areExceptionsManageable: undefined as boolean | undefined,
    complianceRisk: undefined as boolean | undefined,
    complianceRiskSummary: "",
    analysisDesignDuration: "",
    developmentDuration: "",
    testingDuration: "",
    deploymentDuration: "",
    trainingGoLiveDuration: "",
  })
  const [processDetail, setProcessDetail] = useState<any>(null)
  const [triageStageStatus, setTriageStageStatus] = useState<string | null>(null)
  const [pddPreviewUrl, setPddPreviewUrl] = useState<string | null>(null)
  const [isPddPreviewOpen, setIsPddPreviewOpen] = useState(false)
  const [isPddLoading, setIsPddLoading] = useState(false)
  const [isRegistrationDetailsOpen, setIsRegistrationDetailsOpen] = useState(false)
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false)
  const [isRedirectingToAssignment, setIsRedirectingToAssignment] = useState(false)

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await getAllStages()
        if (res?.success && Array.isArray(res.stages)) setAllStages(res.stages)
      } catch (e) { console.error(e) }
    }
    fetchStages()
  }, [])

  useEffect(() => {
    const fetch = async () => {
      if (!selectedApproval?.process_id) { 
        setProcessDetail(null)
        setTriageStageStatus(null)
        return 
      }
      try {
        const res = await getProcessCompleteDetail(selectedApproval.process_id)
        if (res?.success && res.process) setProcessDetail(res.process)
      } catch (e) { setProcessDetail(null) }

      // Fetch stage tracking to get Initial Triage status
      if (selectedApproval.StageName === "Initial Triage") {
        try {
          const { getStageTracking } = await import("@/services/processRegistrationApi")
          const trackingRes = await getStageTracking(selectedApproval.process_id)
          if (trackingRes?.success && Array.isArray(trackingRes.stages)) {
            const triageStage = trackingRes.stages.find((s: any) => s.StageName === "Initial Triage")
            setTriageStageStatus(triageStage?.status ?? null)
          }
        } catch (e) { setTriageStageStatus(null) }
      }
    }
    fetch()
  }, [selectedApproval])

  const getNextStageName = (currentStageName: string): string => {
    if (!allStages.length) return "Next Stage"
    const current = allStages.find(s => s.stageName.toLowerCase() === currentStageName.toLowerCase())
    if (!current || current.sequenceOrder === undefined) return "Next Stage"
    return allStages.find(s => s.sequenceOrder === current.sequenceOrder! + 1)?.stageName || "Next Stage"
  }

  useEffect(() => { fetchPendingApprovals() }, [])

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true)
      const res = await getPendingApprovals()
      if (res?.success && Array.isArray(res.approvals)) {
        setApprovals(res.approvals)
      } else {
        toast({
          title: "Failed to load approvals",
          description: res?.message || "Unable to fetch pending approvals.",
          variant: "destructive",
        })
      }
    } catch (e: any) {
      toast({
        title: "Failed to load approvals",
        description: e?.message || "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetState = () => {
    setSelectedApproval(null)
    setRejectionReason("")
    setTriageStageStatus(null)
    setTriageData({
      isRuleBased: undefined, isStable: undefined,
      areExceptionsManageable: undefined, complianceRisk: undefined,
      complianceRiskSummary: "", analysisDesignDuration: "",
      developmentDuration: "", testingDuration: "",
      deploymentDuration: "", trainingGoLiveDuration: "",
    })
  }

  // Derived registration details
  const registrationDepartment = processDetail?.Department ?? selectedApproval?.Department ?? "—"
  const registrationSubmittedBy = selectedApproval?.SubmittedByName ?? processDetail?.CreatedByName ?? "—"
  const rawSubmittedDate =
    processDetail?.SubmittedDate ??
    processDetail?.submittedDate ??
    processDetail?.CreatedAt ??
    processDetail?.createdAt ??
    selectedApproval?.RequestedAt
  const registrationSubmittedDate = rawSubmittedDate ? new Date(rawSubmittedDate).toLocaleDateString() : "—"
  const registrationExpectedRoi = selectedApproval?.ExpectedROI ?? processDetail?.ExpectedROI ?? null
  const rawTags = processDetail?.Tag ?? ""
  const registrationTags =
    typeof rawTags === "string" ? rawTags.split(",").map((t: string) => t.trim()).filter(Boolean) : []
  const rawStakeholders = processDetail?.Stakeholder ?? ""
  const registrationStakeholders =
    typeof rawStakeholders === "string" ? rawStakeholders.split(",").map((s: string) => s.trim()).filter(Boolean) : []
  const rawSamplePath = processDetail?.SampledataPath ?? selectedApproval?.SampledataPath
  const rawSopPath = processDetail?.SopDoc ?? selectedApproval?.SopDoc
  const sampleFileName = rawSamplePath && typeof rawSamplePath === "string" ? rawSamplePath.split(/[/\\]/).pop() : undefined
  const sopFileName = rawSopPath && typeof rawSopPath === "string" ? rawSopPath.split(/[/\\]/).pop() : undefined

  const handleRejectionSubmit = async () => {
    if (!selectedApproval || !rejectionReason.trim()) {
      toast({ title: "Rejection Reason Required", description: "Please provide a reason for rejecting.", variant: "destructive" })
      return
    }

    const processId = selectedApproval.process_id
    const isTriage = selectedApproval.StageName === "Initial Triage"

    try {
      setIsRejecting(true)
      setIsRejectionDialogOpen(false)

      if (isTriage) {
        // Use the specific rejectInitialTriage API for Initial Triage
        const rejectRes = await rejectInitialTriage(processId, rejectionReason.trim())
        if (!rejectRes.success) throw new Error(rejectRes.message || "Failed to reject Initial Triage")
      } else {
        // Use rejectStage for other stages
        const stageId = getStageIdByName(selectedApproval.StageName, allStages)
        const rejectRes = await rejectStage({
          ProcessId: processId,
          StageId: stageId,
          RejectionReason: rejectionReason.trim(),
        })
        if (!rejectRes.success) throw new Error(rejectRes.message || "Failed to reject stage")
      }
      
      toast({ 
        title: isTriage ? "Process Rejected" : "Stage Rejected", 
        description: isTriage 
          ? "Process has been rejected in Initial Triage." 
          : `${selectedApproval.StageName} has been rejected.` 
      })
      
      resetState()
      await fetchPendingApprovals()
      await new Promise(r => setTimeout(r, 500))
      if (onProcessUpdated) onProcessUpdated()
      window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId, status: "Rejected" } }))
    } catch (e: any) {
      toast({ title: "Rejection Failed", description: e?.message || "Something went wrong.", variant: "destructive" })
    } finally {
      setIsRejecting(false)
    }
  }

  const handleTriageApprovalSubmit = async (status: "Approved" | "Rejected") => {
    if (!selectedApproval) return
    const processId = selectedApproval.process_id

    if (status === "Rejected") {
      setIsRejectionDialogOpen(true)
      return
    }
    if (status === "Approved" && (triageData.isRuleBased === undefined || triageData.isStable === undefined)) {
      toast({ title: "Required Fields Missing", description: "Please complete all required assessment checkboxes before approving.", variant: "destructive" })
      return
    }

    try {
      setIsSubmitting(true)
      // Only UPDATE if status is "Rejected" (resubmission after rejection)
      // Otherwise CREATE (first time approval or status is "Pending"/"Waiting for Approval")
      const isResubmit = triageStageStatus === "Rejected"

      const triagePayload = {
        ProcessId: processId,
        IsRuleBased: !!triageData.isRuleBased,
        IsStable: !!triageData.isStable,
        AreExceptionsManageable: !!triageData.areExceptionsManageable,
        ComplianceRisk: !!triageData.complianceRisk,
        ComplianceRiskSummary: triageData.complianceRiskSummary?.trim() || undefined,
        AnalysisDesignDuration: triageData.analysisDesignDuration?.trim() || undefined,
        DevelopmentDuration: triageData.developmentDuration?.trim() || undefined,
        TestingDuration: triageData.testingDuration?.trim() || undefined,
        DeploymentDuration: triageData.deploymentDuration?.trim() || undefined,
        TrainingGoLiveDuration: triageData.trainingGoLiveDuration?.trim() || undefined,
      }

      const triageRes = isResubmit
        ? await updateInitialTriageStage(processId, triagePayload)
        : await createInitialTriage(triagePayload)

      if (!triageRes.success) throw new Error(triageRes.message || "Failed to save Initial Triage")

      const stageId = getStageIdByName("Initial Triage", allStages)

      const approveRes = await approveStage({ ProcessId: processId, StageId: stageId })
      if (!approveRes.success) throw new Error(approveRes.message || "Failed to approve stage")
      toast({
        title: "Process Approved! ✅",
        description: "Redirecting to Team Assignment so you can assign the team to this process...",
      })
      const savedProcessId   = String(processId)
      const savedProcessName = selectedApproval.Title
      const savedProcessDept = selectedApproval.Department
      resetState()
      await fetchPendingApprovals()
      await new Promise(r => setTimeout(r, 500))
      if (onProcessUpdated) onProcessUpdated()
      window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId, status } }))
      // Show a brief redirecting overlay while navigating to Team Assignment
      setIsRedirectingToAssignment(true)
      navigate("/center-of-excellence", {
        state: {
          activeTab: "team-assignments",
          processId: savedProcessId,
          processName: savedProcessName,
          processDepartment: savedProcessDept,
        },
      })
    } catch (e: any) {
      toast({ title: "Approval Failed", description: e?.message || "Something went wrong.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenericApprovalSubmit = async (status: "Approved" | "Rejected") => {
    if (!selectedApproval) return
    const processId = selectedApproval.process_id

    if (status === "Rejected") {
      setIsRejectionDialogOpen(true)
      return
    }

    try {
      setIsSubmitting(true)
      const stageId = getStageIdByName(selectedApproval.StageName, allStages)
      const res = await approveStage({ ProcessId: processId, StageId: stageId })
      if (!res.success) throw new Error(res.message || "Failed to approve stage")
      toast({
        title: "Stage Approved! ✅",
        description: res.message || `${selectedApproval.StageName} approved and moved to next stage.`,
      })
      resetState()
      await fetchPendingApprovals()
      await new Promise(r => setTimeout(r, 500))
      if (onProcessUpdated) onProcessUpdated()
      window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId, status } }))
    } catch (e: any) {
      toast({ title: "Approval Failed", description: e?.message || "Something went wrong.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":      return "bg-muted text-muted-foreground"
      case "Medium":   return "bg-warning/20 text-warning-foreground border-warning/30"
      case "High":     return "bg-destructive/20 text-destructive-foreground border-destructive/30"
      case "Critical": return "bg-gradient-danger text-white border-destructive shadow-glow"
      default:         return "bg-muted text-muted-foreground"
    }
  }

  const durationOptions = ["1 week","2 weeks","3 weeks","4 weeks","6 weeks","8 weeks","12 weeks"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold">Approval Workflow Board</h2>
            <p className="text-muted-foreground">
              {userIsOwner
                ? "Stages from your submitted processes awaiting your approval"
                : "Processes awaiting your approval decisions"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-spin" />
                <p className="text-muted-foreground">Loading pending approvals...</p>
              </CardContent>
            </Card>
          ) : approvals.length === 0 ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success opacity-50" />
                <p className="text-muted-foreground mb-2">No processes awaiting approval</p>
                <p className="text-sm text-muted-foreground">
                  {userIsOwner
                    ? "No stages from your submitted processes need approval right now."
                    : "All processes have been reviewed."}
                </p>
              </CardContent>
            </Card>
          ) : (
            approvals.map((approval) => (
              <Card
                key={`${approval.process_id}-${approval.StageName}`}
                className={`bg-gradient-card shadow-card cursor-pointer hover:shadow-elevated transition-all ${
                  selectedApproval?.process_id === approval.process_id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => {
                  setSelectedApproval(approval)
                  setRejectionReason("")
                  setTriageData({
                    isRuleBased: undefined, isStable: undefined,
                    areExceptionsManageable: undefined, complianceRisk: undefined,
                    complianceRiskSummary: "", analysisDesignDuration: "",
                    developmentDuration: "", testingDuration: "",
                    deploymentDuration: "", trainingGoLiveDuration: "",
                  })
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono">
                          P{String(approval.process_id).padStart(3, "0")}
                        </Badge>
                        <Badge className={getPriorityColor(approval.Priority)}>
                          {approval.Priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                          {approval.StageName}
                        </Badge>
                      </div>
                      <p className="font-semibold text-base">{approval.Title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {approval.SubmittedByName && `Submitted by ${approval.SubmittedByName}`}
                        {approval.RequestedAt && ` • ${new Date(approval.RequestedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Badge className="bg-warning/20 text-warning-foreground border-warning/30">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {approval.Description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{approval.Description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{approval.Department}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="font-semibold text-success">
                        ${(approval.ExpectedROI ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Approval Detail Panel */}
        <Card className="bg-gradient-card shadow-card sticky top-6">
          <CardHeader className="pb-3">
            {/* ── CHANGED: Title row now has "View Registration Details" on the right ── */}
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {selectedApproval ? "Approval Details" : "Select Process"}
              </CardTitle>
              {(processDetail || selectedApproval) && selectedApproval && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  onClick={() => setIsRegistrationDetailsOpen(true)}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Registration Details
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedApproval ? (
              <div className="space-y-4">
                {/* ── CHANGED: Description directly, no extra spacing block below ── */}
                {selectedApproval.Description && (
                  <p className="text-sm text-muted-foreground">{selectedApproval.Description}</p>
                )}

                <Separator />

                <div className="space-y-4">
                  <p className="text-sm font-semibold">Approval Details</p>

                  {/* ══ INITIAL TRIAGE — RPA Lead full triage form ══ */}
                  {selectedApproval.StageName === "Initial Triage" && userIsRPALead && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-primary/30 bg-primary/5">
                      <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-1" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">Initial Feasibility Check</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning">Current</Badge>
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Automation Lead review</p>

                        <div className="space-y-2.5 pt-2">
                          {([
                            { key: "isRuleBased",             label: "Rule-based process?",   required: true  },
                            { key: "isStable",                label: "Stable process?",        required: true  },
                            { key: "areExceptionsManageable", label: "Exceptions manageable?", required: false },
                            { key: "complianceRisk",          label: "Compliance risk?",       required: false },
                          ] as const).map(({ key, label, required }) => (
                            <div key={key} className="flex items-center justify-between gap-3">
                              <Label className="text-sm font-medium">
                                {label} {required && <span className="text-destructive">*</span>}
                              </Label>
                              <div className="flex gap-2">
                                <Button type="button" size="sm"
                                  variant={triageData[key] === true ? "default" : "outline"}
                                  onClick={() => setTriageData({ ...triageData, [key]: true })}
                                  className="h-7 px-3 text-xs">Yes</Button>
                                <Button type="button" size="sm"
                                  variant={triageData[key] === false ? "default" : "outline"}
                                  onClick={() => setTriageData({ ...triageData, [key]: false })}
                                  className="h-7 px-3 text-xs">No</Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {triageData.complianceRisk && (
                          <div className="space-y-2 p-3 rounded-lg bg-red-50/30 dark:bg-red-950/10 border border-red-200/50">
                            <Label className="text-sm font-semibold text-red-700 dark:text-red-300">Compliance Risk Summary</Label>
                            <Textarea placeholder="Describe the compliance risk..."
                              value={triageData.complianceRiskSummary}
                              onChange={(e) => setTriageData({ ...triageData, complianceRiskSummary: e.target.value })}
                              className="min-h-[60px] text-sm" />
                          </div>
                        )}

                        <div className="space-y-3 p-4 rounded-lg bg-blue-50/30 dark:bg-blue-950/10 border border-blue-200/50">
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Project Timeline Durations
                          </Label>
                          <p className="text-xs text-muted-foreground">Estimate the duration for each phase</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {([
                              { key: "analysisDesignDuration", label: "Analysis & Design" },
                              { key: "developmentDuration",    label: "Development"       },
                              { key: "testingDuration",        label: "Testing"           },
                              { key: "deploymentDuration",     label: "Deployment"        },
                            ] as const).map(({ key, label }) => (
                              <div key={key} className="space-y-1">
                                <Label className="text-xs font-medium">{label}</Label>
                                <Select value={triageData[key]} onValueChange={(v) => setTriageData({ ...triageData, [key]: v })}>
                                  <SelectTrigger className="w-full h-9 text-sm"><SelectValue placeholder="Select duration" /></SelectTrigger>
                                  <SelectContent>{durationOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                            ))}
                            <div className="space-y-1 md:col-span-2">
                              <Label className="text-xs font-medium">Training & Go-Live</Label>
                              <Select value={triageData.trainingGoLiveDuration}
                                onValueChange={(v) => setTriageData({ ...triageData, trainingGoLiveDuration: v })}>
                                <SelectTrigger className="w-full h-9 text-sm"><SelectValue placeholder="Select duration" /></SelectTrigger>
                                <SelectContent>{durationOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Review all assessments before making a decision</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline"
                              onClick={() => handleTriageApprovalSubmit("Rejected")}
                              disabled={isSubmitting || isRejecting}
                              className="border-destructive/30 text-destructive hover:bg-destructive/10">
                              {isRejecting
                                ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Rejecting...</>
                                : <><XCircle className="w-3 h-3 mr-1" />Reject Process</>}
                            </Button>
                            <Button size="sm"
                              onClick={() => handleTriageApprovalSubmit("Approved")}
                              disabled={isSubmitting || isRejecting}
                              className="bg-success hover:bg-success/90 text-white">
                              {isSubmitting
                                ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing...</>
                                : <><CheckCircle2 className="w-3 h-3 mr-1" />Approve & Move to {getNextStageName(selectedApproval.StageName)}</>}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ GENERIC STAGES ══ */}
                  {selectedApproval.StageName !== "Initial Triage" && (
                    <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
                      <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-1" />
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{selectedApproval.StageName}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning">Current</Badge>
                            <Badge variant="outline" className="text-xs">Your Approval Required</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Review the submitted data below before approving or rejecting this stage.
                        </p>

                        {/* ── DETAILED ANALYSIS — PDD Preview ── */}
                        {selectedApproval.StageName === "Detailed Analysis" && (
                          selectedApproval.DA_PddPath ? (
                            <div className="space-y-3 p-4 rounded-lg bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-800/30">
                              <p className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-200">
                                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                Process Definition Document (PDD)
                              </p>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-muted/40 border border-amber-200/50 dark:border-amber-800/20">
                                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                <p className="text-sm font-medium flex-1 truncate text-foreground">
                                  {selectedApproval.DA_PddPath.split(/[/\\]/).pop()}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                  onClick={async () => {
                                    try {
                                      setIsPddLoading(true)
                                      setIsPddPreviewOpen(true)
                                      const res = await apiCall(
                                        `/api/download-process-pdd/${selectedApproval.process_id}`,
                                        { method: "GET" }
                                      )
                                      if (!res.ok) throw new Error("Preview failed")
                                      const blob = await res.blob()
                                      if (pddPreviewUrl) URL.revokeObjectURL(pddPreviewUrl)
                                      const url = URL.createObjectURL(blob)
                                      setPddPreviewUrl(url)
                                    } catch (e: any) {
                                      setIsPddPreviewOpen(false)
                                      toast({ title: "Preview failed", description: e?.message, variant: "destructive" })
                                    } finally {
                                      setIsPddLoading(false)
                                    }
                                  }}
                                >
                                  <FileText className="w-3 h-3" />
                                  Preview PDD
                                </Button>
                              </div>
                              <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3" />
                                Review the PDD document carefully before approving.
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 rounded-lg bg-muted/40 border border-border text-center">
                              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                              <p className="text-sm text-muted-foreground">No PDD document uploaded yet</p>
                            </div>
                          )
                        )}

                        {/* ── BUSINESS CASE — Financial Summary ── */}
                        {selectedApproval.StageName === "Business Case" && (
                          selectedApproval.BC_CostSavings !== undefined || selectedApproval.BC_FteSavings !== undefined ? (
                            <div className="space-y-3 p-4 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200/60 dark:border-emerald-800/30">
                              <p className="text-sm font-semibold flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                Business Case Summary
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                {selectedApproval.BC_FteSavings !== undefined && (
                                  <div className="p-3 rounded-lg bg-white/60 dark:bg-muted/40 border border-emerald-200/50 dark:border-emerald-800/20">
                                    <p className="text-xs text-muted-foreground mb-1">FTE Savings</p>
                                    <p className="text-xl font-bold text-foreground">{selectedApproval.BC_FteSavings}</p>
                                  </div>
                                )}
                                {selectedApproval.BC_CostSavings !== undefined && (
                                  <div className="p-3 rounded-lg bg-emerald-100/60 dark:bg-emerald-950/30 border border-emerald-300/50 dark:border-emerald-700/30">
                                    <p className="text-xs text-muted-foreground mb-1">Cost Savings</p>
                                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">${Number(selectedApproval.BC_CostSavings).toLocaleString()}</p>
                                  </div>
                                )}
                                {selectedApproval.BC_ImplementationCost !== undefined && (
                                  <div className="p-3 rounded-lg bg-white/60 dark:bg-muted/40 border border-emerald-200/50 dark:border-emerald-800/20">
                                    <p className="text-xs text-muted-foreground mb-1">Implementation Cost</p>
                                    <p className="text-xl font-bold text-foreground">${Number(selectedApproval.BC_ImplementationCost).toLocaleString()}</p>
                                  </div>
                                )}
                                {selectedApproval.BC_PaybackMonths !== undefined && (
                                  <div className="p-3 rounded-lg bg-white/60 dark:bg-muted/40 border border-emerald-200/50 dark:border-emerald-800/20">
                                    <p className="text-xs text-muted-foreground mb-1">Payback Period</p>
                                    <p className="text-xl font-bold text-foreground">{selectedApproval.BC_PaybackMonths} month</p>
                                  </div>
                                )}
                                {selectedApproval.BC_RoiPercent !== undefined && (
                                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 col-span-2">
                                    <p className="text-xs text-muted-foreground mb-1">Return on Investment</p>
                                    <p className="text-2xl font-bold text-primary">{selectedApproval.BC_RoiPercent}%</p>
                                  </div>
                                )}
                              </div>
                              {selectedApproval.BC_CostSavings !== undefined && selectedApproval.BC_ImplementationCost !== undefined && (
                                <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-white/50 dark:bg-muted/30 border border-emerald-200/40">
                                  <span className="text-muted-foreground font-medium">Net Benefit (Year 1)</span>
                                  <span className="font-bold text-primary text-base">
                                    ${(Number(selectedApproval.BC_CostSavings) - Number(selectedApproval.BC_ImplementationCost)).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 rounded-lg bg-muted/40 border border-border text-center">
                              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                              <p className="text-sm text-muted-foreground">No business case data available</p>
                            </div>
                          )
                        )}

                        {/* ── GO LIVE — Deployment Details ── */}
                        {selectedApproval.StageName === "Go Live" && (
                          selectedApproval.GL_DeploymentDate ? (
                            <div className="space-y-3 p-4 rounded-lg bg-orange-50/40 dark:bg-orange-950/10 border border-orange-200/60 dark:border-orange-800/30">
                              <p className="text-sm font-semibold flex items-center gap-2 text-orange-800 dark:text-orange-200">
                                <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                Deployment Details
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-muted/40 border border-orange-200/50 dark:border-orange-800/20">
                                  <p className="text-xs text-muted-foreground mb-1">Deployment Date</p>
                                  <p className="text-sm font-bold">{new Date(selectedApproval.GL_DeploymentDate).toLocaleDateString()}</p>
                                </div>
                                {selectedApproval.GL_DeploymentEnvironment && (
                                  <div className="p-3 rounded-lg bg-white/60 dark:bg-muted/40 border border-orange-200/50 dark:border-orange-800/20">
                                    <p className="text-xs text-muted-foreground mb-1">Environment</p>
                                    <p className="text-sm font-bold">{selectedApproval.GL_DeploymentEnvironment}</p>
                                  </div>
                                )}
                                {selectedApproval.GL_BotVersion && (
                                  <div className="p-3 rounded-lg bg-white/60 dark:bg-muted/40 border border-orange-200/50 dark:border-orange-800/20 col-span-2">
                                    <p className="text-xs text-muted-foreground mb-1">Bot Version</p>
                                    <p className="text-sm font-bold">{selectedApproval.GL_BotVersion}</p>
                                  </div>
                                )}
                                {selectedApproval.GL_DeploymentNotes && (
                                  <div className="p-3 rounded-lg bg-white/60 dark:bg-muted/40 border border-orange-200/50 dark:border-orange-800/20 col-span-2">
                                    <p className="text-xs text-muted-foreground mb-1">Deployment Notes</p>
                                    <p className="text-sm">{selectedApproval.GL_DeploymentNotes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-lg bg-muted/40 border border-border text-center">
                              <p className="text-sm text-muted-foreground">No deployment details available</p>
                            </div>
                          )
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button size="lg" variant="outline"
                            onClick={() => handleGenericApprovalSubmit("Rejected")}
                            disabled={isSubmitting || isRejecting}
                            className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10">
                            {isRejecting
                              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rejecting...</>
                              : <><XCircle className="w-4 h-4 mr-2" />Reject Stage</>}
                          </Button>
                          <Button size="lg"
                            onClick={() => handleGenericApprovalSubmit("Approved")}
                            disabled={isSubmitting || isRejecting}
                            className="flex-1 bg-success hover:bg-success/90 text-white">
                            {isSubmitting
                              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Approving...</>
                              : <><CheckCircle2 className="w-4 h-4 mr-2" />Approve & Move Forward</>}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a process to view approval details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════
          ENHANCED Registration Details Dialog
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={isRegistrationDetailsOpen} onOpenChange={setIsRegistrationDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl border-0 shadow-2xl">

          {/* ── Dialog Header with gradient accent ── */}
          <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/15 border border-primary/20">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Registration Details</h2>
                {selectedApproval && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono font-medium text-primary/80">
                      P{String(selectedApproval.process_id).padStart(3, "0")}
                    </span>
                    <span className="text-muted-foreground/50">·</span>
                    {selectedApproval.Title}
                  </p>
                )}
              </div>
            </div>
            {/* Stage badge in header */}
            {selectedApproval && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                  {selectedApproval.StageName}
                </Badge>
              </div>
            )}
          </div>

          {selectedApproval && (
            <div className="p-6 space-y-5">

              {/* ── Top info grid: 3 columns ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Process Details */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      Process Details
                    </p>
                  </div>
                  <div className="px-4 py-3 space-y-3 text-sm">
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-0.5">Department</p>
                      <p className="font-semibold text-foreground">{registrationDepartment}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-0.5">Submitted By</p>
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary/60" />
                        {registrationSubmittedBy}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-0.5">Submitted Date</p>
                      <p className="font-semibold text-foreground">{registrationSubmittedDate}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Financial Info
                    </p>
                  </div>
                  <div className="px-4 py-4 flex flex-col items-center justify-center h-[calc(100%-44px)]">
                    <p className="text-[11px] text-muted-foreground mb-1">Expected ROI</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {registrationExpectedRoi !== null
                        ? `$${Number(registrationExpectedRoi).toLocaleString()}`
                        : "—"}
                    </p>
                    <div className="mt-2">
                      <Badge className={`text-xs ${getPriorityColor(selectedApproval?.Priority ?? "")}`}>
                        {selectedApproval?.Priority} Priority
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Tags & Stakeholders */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Tags & Stakeholders
                    </p>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Tags</p>
                      {registrationTags.length ? (
                        <div className="flex flex-wrap gap-1">
                          {registrationTags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] px-2 py-0.5 bg-primary/5 border-primary/20 text-primary/80">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No tags</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Stakeholders</p>
                      {registrationStakeholders.length ? (
                        <div className="flex flex-wrap gap-1">
                          {registrationStakeholders.map((s, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] px-2 py-0.5 flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              {s}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No stakeholders</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Registration Documents ── */}
              {(rawSamplePath || rawSopPath) && (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-5 py-3.5 bg-muted/40 border-b border-border">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-green-600" />
                      Registration Documents
                    </p>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {rawSamplePath && sampleFileName && (
                      <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                        <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-200/50 dark:border-green-800/30 shrink-0">
                          <Upload className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{sampleFileName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Sample Data</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/40 gap-1">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Uploaded
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 gap-1.5 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/20"
                            onClick={async () => {
                              if (!selectedApproval) return
                              await downloadSampleData(selectedApproval.process_id, sampleFileName)
                            }}
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}

                    {rawSopPath && sopFileName && (
                      <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                        <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-200/50 dark:border-blue-800/30 shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{sopFileName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">SOP Document</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/40 gap-1">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Uploaded
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 gap-1.5 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                            onClick={async () => {
                              if (!selectedApproval) return
                              await downloadSopDoc(selectedApproval.process_id, sopFileName)
                            }}
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDD Preview Dialog */}
      <Dialog open={isPddPreviewOpen} onOpenChange={(open) => {
        setIsPddPreviewOpen(open)
        if (!open && pddPreviewUrl) {
          URL.revokeObjectURL(pddPreviewUrl)
          setPddPreviewUrl(null)
        }
      }}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-amber-600" />
              {selectedApproval?.DA_PddPath?.split(/[/\\]/).pop() || "PDD Document"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-0">
            {isPddLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            ) : pddPreviewUrl ? (
              <iframe
                src={`${pddPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="w-full h-full"
                style={{ minHeight: "calc(95vh - 120px)" }}
                title="PDD Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <FileText className="w-16 h-16 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">Unable to load preview</p>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Review carefully before approving
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!pddPreviewUrl) return
                    const a = document.createElement("a")
                    a.href = pddPreviewUrl
                    a.download = selectedApproval?.DA_PddPath?.split(/[/\\]/).pop() || "pdd_document"
                    a.click()
                  }}
                >
                  Download
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsPddPreviewOpen(false)
                    if (pddPreviewUrl) {
                      URL.revokeObjectURL(pddPreviewUrl)
                      setPddPreviewUrl(null)
                    }
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          Rejection Reason Dialog
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Reject {selectedApproval?.StageName === "Initial Triage" ? "Process" : "Stage"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Rejection Reason *</Label>
              <Textarea 
                placeholder="Explain why this is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px] text-sm"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3" />
              <span>Please provide a clear reason for rejection.</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectionDialogOpen(false)
                setRejectionReason("")
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectionSubmit}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isRedirectingToAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="px-8 py-6 shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              Redirecting to Team Assignment so you can assign the team to this process...
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}