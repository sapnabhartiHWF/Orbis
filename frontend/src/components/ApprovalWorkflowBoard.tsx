import { useState } from "react"
import { CheckCircle2, XCircle, Clock, User, AlertTriangle, MessageSquare, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ApprovalStage {
  id: string
  name: string
  approver: string
  approverRole: string
  status: "pending" | "approved" | "rejected" | "not-reached"
  comments?: string
  date?: string
  required: boolean
}

interface ProcessApproval {
  processId: string
  processTitle: string
  submittedBy: string
  submittedDate: string
  currentStage: number
  overallStatus: "pending" | "approved" | "rejected"
  stages: ApprovalStage[]
  businessJustification: string
  estimatedROI: number
}

const mockApprovals: ProcessApproval[] = [
  {
    processId: "P001",
    processTitle: "Invoice Processing Automation",
    submittedBy: "Sarah Chen",
    submittedDate: "2024-01-15",
    currentStage: 2,
    overallStatus: "pending",
    businessJustification: "Reduce manual processing time by 85% and improve accuracy",
    estimatedROI: 340000,
    stages: [
      {
        id: "dept-head",
        name: "Department Head Approval",
        approver: "Michael Rodriguez",
        approverRole: "Finance Director",
        status: "approved",
        comments: "Strong business case with clear ROI. Approved for next stage.",
        date: "2024-01-16",
        required: true
      },
      {
        id: "it-architecture",
        name: "IT Architecture Review",
        approver: "David Liu",
        approverRole: "Solution Architect", 
        status: "pending",
        required: true
      },
      {
        id: "security-review",
        name: "Security Assessment",
        approver: "Lisa Wang",
        approverRole: "Security Lead",
        status: "not-reached",
        required: true
      },
      {
        id: "coe-approval",
        name: "COE Final Approval",
        approver: "Emma Thompson",
        approverRole: "COE Director",
        status: "not-reached",
        required: true
      }
    ]
  },
  {
    processId: "P002",
    processTitle: "Employee Onboarding Bot",
    submittedBy: "Anna Smith",
    submittedDate: "2024-01-20",
    currentStage: 0,
    overallStatus: "pending",
    businessJustification: "Streamline HR processes and improve new hire experience",
    estimatedROI: 180000,
    stages: [
      {
        id: "dept-head",
        name: "Department Head Approval",
        approver: "Tom Brown",
        approverRole: "HR Director",
        status: "pending",
        required: true
      },
      {
        id: "it-architecture",
        name: "IT Architecture Review",
        approver: "David Liu",
        approverRole: "Solution Architect",
        status: "not-reached",
        required: true
      },
      {
        id: "security-review",
        name: "Security Assessment",
        approver: "Lisa Wang",
        approverRole: "Security Lead",
        status: "not-reached",
        required: false
      },
      {
        id: "coe-approval",
        name: "COE Final Approval",
        approver: "Emma Thompson",
        approverRole: "COE Director",
        status: "not-reached",
        required: true
      }
    ]
  }
]

export function ApprovalWorkflowBoard() {
  const [selectedApproval, setSelectedApproval] = useState<ProcessApproval | null>(null)
  const [comment, setComment] = useState("")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="w-4 h-4 text-success" />
      case "rejected": return <XCircle className="w-4 h-4 text-destructive" />
      case "pending": return <Clock className="w-4 h-4 text-warning" />
      default: return <User className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-success bg-success/10 border-success/20"
      case "rejected": return "text-destructive bg-destructive/10 border-destructive/20"
      case "pending": return "text-warning bg-warning/10 border-warning/20"
      default: return "text-muted-foreground bg-muted/10 border-border"
    }
  }

  const calculateProgress = (approval: ProcessApproval) => {
    const completedStages = approval.stages.filter(s => s.status === "approved").length
    return (completedStages / approval.stages.length) * 100
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">Approval Workflow Board</h2>
          <p className="text-muted-foreground">Track process approvals through governance stages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval List */}
        <div className="space-y-4">
          {mockApprovals.map((approval) => (
            <Card 
              key={approval.processId} 
              className="bg-gradient-card shadow-card cursor-pointer hover:shadow-elevated transition-all"
              onClick={() => setSelectedApproval(approval)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{approval.processTitle}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Submitted by {approval.submittedBy} • {approval.submittedDate}
                    </p>
                  </div>
                  <Badge className={getStatusColor(approval.overallStatus)}>
                    {approval.overallStatus}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(calculateProgress(approval))}%</span>
                  </div>
                  <Progress value={calculateProgress(approval)} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expected ROI</span>
                  <span className="font-semibold text-success">
                    ${approval.estimatedROI.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Stage:</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(approval.stages[approval.currentStage]?.status || "not-reached")}
                    <span className="text-sm">
                      {approval.stages[approval.currentStage]?.name || "Completed"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Approval Details */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedApproval ? "Approval Details" : "Select Process"}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {selectedApproval ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{selectedApproval.processTitle}</h3>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Business Justification:</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedApproval.businessJustification}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">Approval Stages</h4>
                    {selectedApproval.stages.map((stage, index) => (
                      <div key={stage.id} className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="flex-shrink-0">
                            {getStatusIcon(stage.status)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">{stage.name}</h5>
                              {stage.required && (
                                <Badge variant="outline" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {stage.approver} • {stage.approverRole}
                            </p>
                            {stage.date && (
                              <p className="text-xs text-muted-foreground">{stage.date}</p>
                            )}
                          </div>
                        </div>

                        {stage.comments && (
                          <div className="ml-6 p-2 bg-muted rounded text-sm">
                            <MessageSquare className="w-4 h-4 inline mr-2" />
                            {stage.comments}
                          </div>
                        )}

                        {stage.status === "pending" && (
                          <div className="ml-6 space-y-2">
                            <Textarea
                              placeholder="Add approval comments..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              className="min-h-[60px]"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-success hover:bg-success/90">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive">
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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
    </div>
  )
}