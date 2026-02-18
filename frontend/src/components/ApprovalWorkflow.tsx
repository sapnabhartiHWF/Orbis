import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, Clock, User, AlertTriangle, MessageSquare, FileText, Building, TrendingUp, Eye, Tag, Users as UsersIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { getAllProcessesSummary, createInitialTriage, getProcessDetail } from "@/services/processRegistrationApi"
import { Process } from "@/types/ProcessTypes"

export function ApprovalWorkflowBoard() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [detailedProcess, setDetailedProcess] = useState<any>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Stages that require approval decisions
  const APPROVAL_STAGES = [
    "Initial Triage",
    "Approval",
    // Add other stages that require approval here
  ]

  // Load processes from backend
  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        setIsLoading(true)
        const response = await getAllProcessesSummary()
        
        if (response?.success && Array.isArray(response.processes)) {
          // Filter processes in stages that require approval
          const approvalProcesses = response.processes
            .filter((p: any) => {
              const stage = p.CurrentStage ?? p.StageName ?? p.Status ?? ""
              return APPROVAL_STAGES.includes(stage)
            })
            .map((p: any) => {
              const numericId = p.ProcessId ?? p.process_id ?? p.Id ?? p.id ?? p.ProcessID
              const id = numericId !== undefined && numericId !== null
                ? `P${String(numericId).padStart(3, "0")}`
                : String(p.ProcessCode ?? p.Code ?? "P000")

              return {
                id,
                title: p.Title ?? p.title ?? "",
                description: p.Description ?? p.description ?? "",
                department: p.Department ?? p.department ?? "",
                priority: (p.Priority ?? p.priority ?? "Medium") as "Low" | "Medium" | "High" | "Critical",
                expectedROI: Number(p.ExpectedROI ?? p.expectedROI ?? 0),
                status: (p.CurrentStage ?? p.StageName ?? p.Status ?? "Initial Triage") as any,
                submittedBy: p.CreatedByName ?? p.createdByName ?? "Unknown",
                submittedDate: p.SubmittedDate ?? p.submittedDate ?? p.CreatedAt ?? p.createdAt ?? new Date().toISOString(),
                estimatedSavings: Number(p.EstimatedSavings ?? p.estimatedSavings ?? 0),
                complexity: (p.Complexity ?? p.complexity ?? "Medium") as "Low" | "Medium" | "High",
                dependencies: [],
                stakeholders: p.Stakeholder
                  ? String(p.Stakeholder).split(",").map((s: string) => s.trim()).filter(Boolean)
                  : [],
                tags: p.Tag
                  ? String(p.Tag).split(",").map((t: string) => t.trim()).filter(Boolean)
                  : [],
              }
            })
          
          setProcesses(approvalProcesses)
        }
      } catch (error: any) {
        console.error("Error loading processes:", error)
        toast({
          title: "Failed to load processes",
          description: error?.message || "Unable to fetch process list.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProcesses()
  }, [])

  // Load detailed process information
  const handleViewDetails = async () => {
    if (!selectedProcess) return

    try {
      const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10)
      if (!isNaN(numericId)) {
        const response = await getProcessDetail(numericId)
        if (response?.success && response.process) {
          setDetailedProcess(response.process)
          setIsDetailsDialogOpen(true)
        } else {
          toast({
            title: "Failed to load details",
            description: "Unable to fetch process details.",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      console.error("Error loading process details:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to load process details.",
        variant: "destructive",
      })
    }
  }

  const handleApprovalSubmit = async (status: "Approved" | "Rejected") => {
    if (!selectedProcess) return

    const numericProcessId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10)

    if (!numericProcessId || isNaN(numericProcessId)) {
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

    try {
      setIsSubmitting(true)

      const payload = {
        ProcessId: numericProcessId,
        IsRuleBased: true, // Default values for approval workflow
        IsStable: true,
        AreExceptionsManageable: true,
        ComplianceRisk: false,
        ComplianceRiskSummary: undefined,
        SystemsInvolved: undefined,
        Blockers: undefined,
        EstimatedAutomationPercent: undefined,
        ApprovalStatus: status,
        RejectionReason: status === "Rejected" ? rejectionReason.trim() : undefined,
      } as const

      const response = await createInitialTriage(payload)

      if (response.success) {
        toast({
          title: status === "Approved" ? "Process Approved! ✅" : "Process Rejected",
          description:
            status === "Approved"
              ? "Process approved and moved to System Integration stage."
              : "Process has been rejected in Initial Triage.",
        })

        // Refresh the list
        setSelectedProcess(null)
        setComment("")
        setRejectionReason("")
        window.location.reload()
      } else {
        throw new Error(response.message || "Failed to process approval")
      }
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
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">Approval Workflow Board</h2>
          <p className="text-muted-foreground">Processes awaiting Initial Triage approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-spin" />
                <p className="text-muted-foreground">Loading processes...</p>
              </CardContent>
            </Card>
          ) : processes.length === 0 ? (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success opacity-50" />
                <p className="text-muted-foreground mb-2">No processes awaiting approval</p>
                <p className="text-sm text-muted-foreground">All processes in Initial Triage have been reviewed</p>
              </CardContent>
            </Card>
          ) : (
            processes.map((process) => (
              <Card 
                key={process.id} 
                className={`bg-gradient-card shadow-card cursor-pointer hover:shadow-elevated transition-all ${
                  selectedProcess?.id === process.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedProcess(process)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {process.id}
                        </Badge>
                        <Badge className={getPriorityColor(process.priority)}>
                          {process.priority}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{process.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Submitted by {process.submittedBy} • {new Date(process.submittedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-warning/20 text-warning-foreground border-warning/30">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {process.description}
                  </p>

                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{process.department}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="font-semibold text-success">
                        ${process.expectedROI.toLocaleString()}
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
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedProcess ? "Approval Details" : "Select Process"}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {selectedProcess ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{selectedProcess.title}</h3>
                    <Badge variant="outline">{selectedProcess.id}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Business Justification:</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedProcess.description}
                    </p>
                  </div>

                  <Separator />

                  {/* Process Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Department</p>
                      <p className="font-medium">{selectedProcess.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Priority</p>
                      <Badge className={getPriorityColor(selectedProcess.priority)}>
                        {selectedProcess.priority}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Expected ROI</p>
                      <p className="font-semibold text-success">
                        ${selectedProcess.expectedROI.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Submitted By</p>
                      <p className="font-medium">{selectedProcess.submittedBy}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* View Full Details Button */}
                  <Button
                    variant="outline"
                    onClick={handleViewDetails}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Process Details
                  </Button>

                  <Separator />

                  {/* Approval Comments */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Approval Comments</p>
                    <Textarea
                      placeholder="Add your comments for this approval decision..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Rejection Reason */}
                  <div className="space-y-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <p className="text-sm font-semibold">Rejection Reason (Required if rejecting)</p>
                    </div>
                    <Textarea
                      placeholder="Explain why this process is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="min-h-[60px] bg-white dark:bg-gray-900"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleApprovalSubmit("Rejected")}
                      disabled={isSubmitting}
                      className="flex-1 border-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Process
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => handleApprovalSubmit("Approved")}
                      disabled={isSubmitting}
                      className="flex-1 bg-success hover:bg-success/90 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve Process
                    </Button>
                  </div>
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

      {/* Process Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedProcess?.title}</DialogTitle>
            <DialogDescription>
              Complete process information and details
            </DialogDescription>
          </DialogHeader>

          {detailedProcess && selectedProcess && (
            <div className="space-y-6 mt-4">
              {/* Process ID and Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm font-mono">
                  {selectedProcess.id}
                </Badge>
                <Badge className={getPriorityColor(selectedProcess.priority)}>
                  {selectedProcess.priority}
                </Badge>
                <Badge className="bg-warning/20 text-warning-foreground border-warning/30">
                  {selectedProcess.status}
                </Badge>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{selectedProcess.description}</p>
                </CardContent>
              </Card>

              {/* Process Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Process Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{selectedProcess.department}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Submitted By:</span>
                      <span className="font-medium">{selectedProcess.submittedBy}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Submitted Date:</span>
                      <span className="font-medium">
                        {new Date(selectedProcess.submittedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Complexity:</span>
                      <Badge variant="outline">{selectedProcess.complexity}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      Financial Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-success/10 border border-success/20">
                      <span className="text-sm font-medium">Expected ROI:</span>
                      <span className="text-lg font-bold text-success">
                        ${selectedProcess.expectedROI.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tags and Stakeholders */}
              {(selectedProcess.tags.length > 0 || selectedProcess.stakeholders.length > 0) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Tags & Stakeholders
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedProcess.tags.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Tags
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProcess.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProcess.stakeholders.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <UsersIcon className="w-3 h-3" />
                          Stakeholders
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProcess.stakeholders.map((stakeholder, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {stakeholder}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}