import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, Clock, User, AlertTriangle, MessageSquare, FileText, Building, TrendingUp, Eye, Tag, Users as UsersIcon, ClipboardList, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import {
  getPendingApprovals,
  createInitialTriage,
  approveStage,
  rejectStage,
  getStageIdByName,
  getAllStages,
  StageData,
} from "@/services/processRegistrationApi"

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
}

interface ApprovalWorkflowBoardProps {
  onProcessUpdated?: () => void
}

export function ApprovalWorkflowBoard({ onProcessUpdated }: ApprovalWorkflowBoardProps) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [approvalComment, setApprovalComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [allStages, setAllStages] = useState<StageData[]>([])
  const [triageData, setTriageData] = useState({
    isRuleBased: undefined as boolean | undefined,
    isStable: undefined as boolean | undefined,
    areExceptionsManageable: undefined as boolean | undefined,
    complianceRisk: undefined as boolean | undefined,
    complianceRiskSummary: "",
  })

  // Load stages from backend
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const stagesResponse = await getAllStages()
        if (stagesResponse?.success && Array.isArray(stagesResponse.stages)) {
          setAllStages(stagesResponse.stages)
        }
      } catch (error) {
        console.error("Error loading stages:", error)
      }
    }

    fetchStages()
  }, [])

  // Get next stage name based on current stage
  const getNextStageName = (currentStageName: string): string => {
    if (!allStages || allStages.length === 0) {
      return "Next Stage"
    }

    // Find current stage (case-insensitive match)
    const currentStage = allStages.find(
      (stage) => stage.stageName.toLowerCase() === currentStageName.toLowerCase()
    )

    if (!currentStage || currentStage.sequenceOrder === undefined) {
      return "Next Stage"
    }

    // Find next stage by sequence order
    const nextStage = allStages.find(
      (stage) => stage.sequenceOrder === (currentStage.sequenceOrder! + 1)
    )

    return nextStage?.stageName || "Next Stage"
  }

  // Load pending approvals from backend
  useEffect(() => {
    fetchPendingApprovals()
  }, [])

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true)
      const response = await getPendingApprovals()

      if (response?.success && Array.isArray(response.approvals)) {
        setApprovals(response.approvals)
      } else {
        toast({
          title: "Failed to load approvals",
          description: response?.message || "Unable to fetch pending approvals.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error loading approvals:", error)
      toast({
        title: "Failed to load approvals",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovalSubmit = async (status: "Approved" | "Rejected") => {
    if (!selectedApproval) return

    const processId = selectedApproval.process_id

    if (!processId || isNaN(processId)) {
      toast({
        title: "Invalid Process ID",
        description: "Unable to process approval request.",
        variant: "destructive",
      })
      return
    }

    if (status === "Rejected" && !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this process.",
        variant: "destructive",
      })
      return
    }

    // Validate required triage checkboxes for Initial Triage approval
    if (status === "Approved" && selectedApproval.StageName === "Initial Triage") {
      if (triageData.isRuleBased === undefined || triageData.isStable === undefined) {
        toast({
          title: "Required Fields Missing",
          description: "Please complete all required assessment checkboxes (Rule-based process and Stable process) before approving.",
          variant: "destructive",
        })
        return
      }
    }

    try {
      setIsSubmitting(true)

      if (selectedApproval.StageName === "Initial Triage") {
        // Save triage data first
        const triagePayload = {
          ProcessId: processId,
          IsRuleBased: !!triageData.isRuleBased,
          IsStable: !!triageData.isStable,
          AreExceptionsManageable: !!triageData.areExceptionsManageable,
          ComplianceRisk: !!triageData.complianceRisk,
          ComplianceRiskSummary: triageData.complianceRiskSummary?.trim() || undefined,
        };

        const triageResponse = await createInitialTriage(triagePayload);

        if (!triageResponse.success) {
          throw new Error(triageResponse.message || "Failed to save Initial Triage");
        }

        // Now approve or reject the stage
        const stageId = getStageIdByName("Initial Triage", allStages);

        if (status === "Approved") {
          const approveResponse = await approveStage({
            ProcessId: processId,
            StageId: stageId,
          });

          if (!approveResponse.success) {
            throw new Error(approveResponse.message || "Failed to approve stage");
          }
        } else {
          const rejectResponse = await rejectStage({
            ProcessId: processId,
            StageId: stageId,
            RejectionReason: rejectionReason.trim(),
          });

          if (!rejectResponse.success) {
            throw new Error(rejectResponse.message || "Failed to reject stage");
          }
        }

        toast({
          title: status === "Approved" ? "Process Approved! ✅" : "Process Rejected",
          description:
            status === "Approved"
              ? "Process approved and moved to next stage."
              : "Process has been rejected in Initial Triage.",
        });

        // Reset state
        setSelectedApproval(null);
        setComment("");
        setRejectionReason("");
        setApprovalComment("");
        setTriageData({
          isRuleBased: undefined,
          isStable: undefined,
          areExceptionsManageable: undefined,
          complianceRisk: undefined,
          complianceRiskSummary: "",
        });

        // Refresh the approvals list
        await fetchPendingApprovals();

        // Wait a bit for backend to process the update
        await new Promise(resolve => setTimeout(resolve, 500));

        // Trigger process list refresh in parent component
        if (onProcessUpdated) {
          onProcessUpdated();
        }

        // Also dispatch a custom event for any other listeners
        window.dispatchEvent(new CustomEvent('processUpdated', {
          detail: { processId, status }
        }));
      }
    } catch (error: any) {
      console.error("Error processing approval:", error);
      toast({
        title: "Approval Failed",
        description: error?.message || "Something went wrong while processing the approval.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenericApprovalSubmit = async (status: "Approved" | "Rejected") => {
    if (!selectedApproval) return

    const processId = selectedApproval.process_id

    if (!processId || isNaN(processId)) {
      toast({
        title: "Invalid Process ID",
        description: "Unable to process approval request.",
        variant: "destructive",
      })
      return
    }

    if (status === "Rejected" && !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this stage.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Get StageId from stage name
      const stageId = getStageIdByName(selectedApproval.StageName, allStages)

      let response
      if (status === "Approved") {
        response = await approveStage({
          ProcessId: processId,
          StageId: stageId,
        })
      } else {
        response = await rejectStage({
          ProcessId: processId,
          StageId: stageId,
          RejectionReason: rejectionReason.trim(),
        })
      }

      if (!response.success) {
        throw new Error(response.message || `Failed to ${status.toLowerCase()} stage`)
      }

      toast({
        title: status === "Approved" ? "Stage Approved! ✅" : "Stage Rejected",
        description: response.message || (
          status === "Approved"
            ? `${selectedApproval.StageName} approved and moved to next stage.`
            : `${selectedApproval.StageName} has been rejected.`
        ),
      })

      // Reset state
      setSelectedApproval(null)
      setComment("")
      setRejectionReason("")
      setApprovalComment("")

      // Refresh the approvals list
      await fetchPendingApprovals()

      // Wait a bit for backend to process the update
      await new Promise(resolve => setTimeout(resolve, 500))

      // Trigger process list refresh in parent component
      if (onProcessUpdated) {
        onProcessUpdated()
      }

      // Also dispatch a custom event for any other listeners
      window.dispatchEvent(new CustomEvent('processUpdated', {
        detail: { processId, status }
      }))
    } catch (error: any) {
      console.error("Error processing approval:", error)
      toast({
        title: "Approval Failed",
        description: error?.message || "Something went wrong while processing the approval.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-muted text-muted-foreground"
      case "Medium":
        return "bg-warning/20 text-warning-foreground border-warning/30"
      case "High":
        return "bg-destructive/20 text-destructive-foreground border-destructive/30"
      case "Critical":
        return "bg-gradient-danger text-white border-destructive shadow-glow"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold">Approval Workflow Board</h2>
            <p className="text-muted-foreground">
              Processes awaiting approval/rejection decisions
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {approvals.length} Pending
        </Badge>
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
                <p className="text-sm text-muted-foreground">All processes have been reviewed</p>
              </CardContent>
            </Card>
          ) : (
            approvals.map((approval) => (
              <Card
                key={`${approval.process_id}-${approval.StageName}`}
                className={`bg-gradient-card shadow-card cursor-pointer hover:shadow-elevated transition-all ${selectedApproval?.process_id === approval.process_id ? 'ring-2 ring-primary' : ''
                  }`}
                onClick={() => setSelectedApproval(approval)}
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
                      <CardTitle className="text-lg">{approval.Title}</CardTitle>
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {approval.Description}
                    </p>
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

        {/* Approval Details */}
        <Card className="bg-gradient-card shadow-card sticky top-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {selectedApproval ? "Approval Details" : "Select Process"}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {selectedApproval ? (
              <div className="space-y-6">
                {/* Business Justification */}
                {selectedApproval.Description && (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {selectedApproval.Description}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Approval Stage Details */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold">Approval Details</p>

                  {selectedApproval.StageName === "Initial Triage" ? (
                    <div className="space-y-4">
                      {/* Initial Triage - Current Stage */}
                      <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-primary/30 bg-primary/5">
                        <div className="flex-shrink-0 mt-1">
                          <Clock className="w-5 h-5 text-warning" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Initial Feasibility Check</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning">
                                Current
                              </Badge>
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            RPA Lead • Automation Lead
                          </p>

                          {/* Assessment Checkboxes */}
                          <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${triageData.isRuleBased
                                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/50'
                                    : 'bg-card border-border hover:border-primary/50'
                                  }`}
                                onClick={() => setTriageData({ ...triageData, isRuleBased: !triageData.isRuleBased })}
                              >
                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${triageData.isRuleBased
                                    ? 'bg-green-500 border-green-600'
                                    : 'bg-white dark:bg-gray-900 border-gray-400'
                                  }`}>
                                  {triageData.isRuleBased && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                </div>
                                <Label className="cursor-pointer text-sm font-medium">
                                  Rule-based process? <span className="text-destructive">*</span>
                                </Label>
                              </div>

                              <div
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${triageData.isStable
                                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/50'
                                    : 'bg-card border-border hover:border-primary/50'
                                  }`}
                                onClick={() => setTriageData({ ...triageData, isStable: !triageData.isStable })}
                              >
                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${triageData.isStable
                                    ? 'bg-green-500 border-green-600'
                                    : 'bg-white dark:bg-gray-900 border-gray-400'
                                  }`}>
                                  {triageData.isStable && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                </div>
                                <Label className="cursor-pointer text-sm font-medium">
                                  Stable process? <span className="text-destructive">*</span>
                                </Label>
                              </div>

                              <div
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${triageData.areExceptionsManageable
                                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/50'
                                    : 'bg-card border-border hover:border-primary/50'
                                  }`}
                                onClick={() => setTriageData({ ...triageData, areExceptionsManageable: !triageData.areExceptionsManageable })}
                              >
                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${triageData.areExceptionsManageable
                                    ? 'bg-green-500 border-green-600'
                                    : 'bg-white dark:bg-gray-900 border-gray-400'
                                  }`}>
                                  {triageData.areExceptionsManageable && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                </div>
                                <Label className="cursor-pointer text-sm font-medium">
                                  Exceptions manageable?
                                </Label>
                              </div>

                              <div
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${triageData.complianceRisk
                                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300/50 dark:border-red-700/50'
                                    : 'bg-card border-border hover:border-primary/50'
                                  }`}
                                onClick={() => setTriageData({ ...triageData, complianceRisk: !triageData.complianceRisk })}
                              >
                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${triageData.complianceRisk
                                    ? 'bg-red-500 border-red-600'
                                    : 'bg-white dark:bg-gray-900 border-gray-400'
                                  }`}>
                                  {triageData.complianceRisk && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                </div>
                                <Label className="cursor-pointer text-sm font-medium">
                                  Compliance risk?
                                </Label>
                              </div>
                            </div>

                            {/* Compliance Risk Summary */}
                            {triageData.complianceRisk && (
                              <div className="space-y-2 p-3 rounded-lg bg-red-50/30 dark:bg-red-950/10 border border-red-200/50 dark:border-red-800/30">
                                <Label className="text-sm font-semibold text-red-700 dark:text-red-300">
                                  Compliance Risk Summary
                                </Label>
                                <Textarea
                                  placeholder="Describe the compliance risk..."
                                  value={triageData.complianceRiskSummary}
                                  onChange={(e) => setTriageData({ ...triageData, complianceRiskSummary: e.target.value })}
                                  className="min-h-[60px] text-sm"
                                />
                              </div>
                            )}

                            {/* Rejection Reason */}
                            <div className="space-y-2 p-3 rounded-lg bg-red-50/30 dark:bg-red-950/10 border border-red-200/50 dark:border-red-800/30">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                <Label className="text-sm font-semibold">Rejection Reason (Optional)</Label>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                If you plan to reject this process, please provide a reason
                              </p>
                              <Textarea
                                placeholder="Explain why this process is being rejected..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="min-h-[60px] text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Review all assessments before making a decision</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprovalSubmit("Rejected")}
                                disabled={isSubmitting || !rejectionReason.trim()}
                                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject Process
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprovalSubmit("Approved")}
                                disabled={isSubmitting}
                                className="bg-success hover:bg-success/90 text-white"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Approve & Move to {selectedApproval ? getNextStageName(selectedApproval.StageName) : "Next Stage"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Other Stages - Show only approval/rejection buttons (no form) */
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
                        <div className="flex-shrink-0 mt-1">
                          <Clock className="w-5 h-5 text-warning" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{selectedApproval.StageName}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning">
                                Current
                              </Badge>
                              <Badge variant="outline" className="text-xs">Approval Required</Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This stage requires approval to proceed to the next stage.
                          </p>

                          {/* Rejection Reason */}
                          <div className="space-y-2 p-3 rounded-lg bg-red-50/30 dark:bg-red-950/10 border border-red-200/50 dark:border-red-800/30">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                              <Label className="text-sm font-semibold">Rejection Reason (Required if rejecting)</Label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              If you plan to reject this process, please provide a reason
                            </p>
                            <Textarea
                              placeholder="Explain why this process is being rejected..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                          </div>

                          {/* Approval/Rejection Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="lg"
                              variant="outline"
                              onClick={() => handleGenericApprovalSubmit("Rejected")}
                              disabled={isSubmitting || !rejectionReason.trim()}
                              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject Process
                            </Button>
                            <Button
                              size="lg"
                              onClick={() => handleGenericApprovalSubmit("Approved")}
                              disabled={isSubmitting}
                              className="flex-1 bg-success hover:bg-success/90 text-white"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Approve & Move Forward
                                </>
                              )}
                            </Button>
                          </div>
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
    </div>
  )
}