import { useState, useEffect } from "react";
import {
  GitBranch,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  MessageSquare,
  AlertCircle,
  Target,
  File,
  Zap,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  type ApprovalWorkflow,
  ApprovalStage,
  calculateWorkflowProgress,
  canUserApprove,
  getNextApprovers,
  mockTeamMembers,
  FileUpload,
  getFileTypeIcon,
} from "@/utils/collaborationUtils";

interface ApprovalWorkflowProps {
  processId?: string;
}

const dummyWorkflows: ApprovalWorkflow[] = [
  {
    id: "wf1",
    processId: "P001",
    name: "Invoice Processing Approval",
    description:
      "Multi-stage approval workflow for invoice processing automation requirements",
    initiatedBy: "Sarah Chen",
    initiatedAt: "2024-01-20T09:00:00Z",
    currentStage: 1,
    status: "in-progress",
    stages: [
      {
        id: "st1",
        name: "Technical Review",
        description: "Review technical feasibility and architecture",
        approvers: ["Emma Thompson", "David Park"],
        requiredApprovals: 2,
        currentApprovals: ["Emma Thompson", "David Park"],
        status: "approved",
        completedAt: "2024-01-22T14:30:00Z",
      },
      {
        id: "st2",
        name: "Business Approval",
        description: "Business stakeholder approval for implementation",
        approvers: ["Michael Rodriguez", "Lisa Wang"],
        requiredApprovals: 1,
        currentApprovals: ["Michael Rodriguez"],
        status: "approved",
        completedAt: "2024-01-23T10:15:00Z",
      },
      {
        id: "st3",
        name: "Executive Sign-off",
        description: "Final executive approval for budget and go-live",
        approvers: ["John Smith", "Jane Doe"],
        requiredApprovals: 1,
        currentApprovals: [],
        status: "pending",
        dueDate: "2024-02-05T17:00:00Z",
      },
    ],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-success/20 text-success-foreground border-success/30";
    case "rejected":
      return "bg-destructive/20 text-destructive-foreground border-destructive/30";
    case "pending":
      return "bg-warning/20 text-warning-foreground border-warning/30";
    case "in-progress":
      return "bg-primary/20 text-primary-foreground border-primary/30";
    case "cancelled":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="w-4 h-4" />;
    case "rejected":
      return <XCircle className="w-4 h-4" />;
    case "pending":
      return <Clock className="w-4 h-4" />;
    case "in-progress":
      return <Play className="w-4 h-4" />;
    case "cancelled":
      return <Pause className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const dataUrl = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app//api/uploaded-details";

export function ApprovalWorkflow({ processId }: ApprovalWorkflowProps) {
  const [workflows, setWorkflows] =
    useState<ApprovalWorkflow[]>(dummyWorkflows);
  const [isNewWorkflowOpen, setIsNewWorkflowOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    stages: [] as Partial<ApprovalStage>[],
  });
  const currentUser = "John Smith"; // This would come from auth context
  const [files, setFiles] = useState<FileUpload[]>([]);

  const filteredWorkflows = processId
    ? workflows.filter((wf) => wf.processId === processId)
    : workflows;

  // Fetch uploaded files
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(dataUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch files");

        const data = await res.json();
        if (data.success) {
          const normalizedFiles = data.files.map((f: any) => {
            // Determine trigger status from API response
            const triggerStatus = f.triggerStatus || (f.isTriggered || f.IsTriggered ? "Triggered" : "Not Triggered");
            const isTriggered = triggerStatus === "Triggered" || f.isTriggered || f.IsTriggered || false;
            
            return {
              id: f.id || Number(f.FileID),
              name: f.name || f.FileName,
              type: f.type || f.FileType,
              format: f.format || f.FileFormat,
              size: f.size || f.FileSize,
              uploadedBy: f.uploadedBy || f.UploadedByName,
              uploadedAt: f.uploadedAt || f.UploadedDate,
              version: f.version || f.Version || 1,
              processId: f.processId || f.ProcessID,
              processName: f.processName || f.ProcessName,
              description: f.description || f.Description,
              tags: f.tags || f.Tags || [],
              status: f.status || "ready",
              isTriggered: isTriggered,
              triggerStatus: triggerStatus,
              triggeredAt: isTriggered ? (f.triggeredAt || f.TriggeredAt || f.TriggeredDate || f.uploadedAt || null) : null,
              notTriggeredReason: !isTriggered ? (f.notTriggeredReason || f.NotTriggeredReason || f.Reason || null) : null,
              approvedAt: f.approvedAt || f.ApprovedAt || f.ApprovedDate || null,
            };
          });
          setFiles(normalizedFiles);
        } else {
          setFiles([]);
        }
      } catch (err: any) {
        console.error(err);
        setFiles([]);
      }
    };

    fetchFiles();
  }, []);

  // Filter files by processId if provided
  const filteredFiles = files.filter((file) => {
    if (!processId) return true;
    return file.processId?.toString() === processId;
  });

  const handleCreateWorkflow = () => {
    const workflow: ApprovalWorkflow = {
      id: `wf${Date.now()}`,
      processId: processId || "P000",
      name: newWorkflow.name,
      description: newWorkflow.description,
      initiatedBy: currentUser,
      initiatedAt: new Date().toISOString(),
      currentStage: 0,
      status: "draft",
      stages: newWorkflow.stages.map((stage, index) => ({
        id: `st${Date.now()}_${index}`,
        name: stage.name || "",
        description: stage.description || "",
        approvers: stage.approvers || [],
        requiredApprovals: stage.requiredApprovals || 1,
        currentApprovals: [],
        status: "pending",
      })) as ApprovalStage[],
    };

    setWorkflows((prev) => [...prev, workflow]);
    setIsNewWorkflowOpen(false);
    setNewWorkflow({ name: "", description: "", stages: [] });

    toast({
      title: "Workflow created! 🎯",
      description:
        "Your approval workflow has been set up and is ready to start.",
    });
  };

  const handleApprove = (workflowId: string, stageId: string) => {
    setWorkflows((prev) =>
      prev.map((wf) => {
        if (wf.id === workflowId) {
          const updatedStages = wf.stages.map((stage) => {
            if (stage.id === stageId) {
              const updatedApprovals = [...stage.currentApprovals, currentUser];
              const status: ApprovalStage["status"] =
                updatedApprovals.length >= stage.requiredApprovals
                  ? "approved"
                  : "pending";

              return {
                ...stage,
                currentApprovals: updatedApprovals,
                status,
                completedAt:
                  status === "approved" ? new Date().toISOString() : undefined,
              };
            }
            return stage;
          });

          // Check if we should move to next stage or complete workflow
          const currentStage = updatedStages[wf.currentStage];
          let newCurrentStage = wf.currentStage;
          let newStatus = wf.status;

          if (
            currentStage.status === "approved" &&
            wf.currentStage < updatedStages.length - 1
          ) {
            newCurrentStage = wf.currentStage + 1;
          } else if (
            currentStage.status === "approved" &&
            wf.currentStage === updatedStages.length - 1
          ) {
            newStatus = "approved";
          }

          return {
            ...wf,
            stages: updatedStages,
            currentStage: newCurrentStage,
            status: newStatus,
            completedAt:
              newStatus === "approved" ? new Date().toISOString() : undefined,
          };
        }
        return wf;
      })
    );

    toast({
      title: "Approval submitted! ✅",
      description: "Your approval has been recorded and the workflow updated.",
    });
  };

  const handleReject = (
    workflowId: string,
    stageId: string,
    reason: string
  ) => {
    setWorkflows((prev) =>
      prev.map((wf) => {
        if (wf.id === workflowId) {
          const updatedStages = wf.stages.map((stage) => {
            if (stage.id === stageId) {
              return {
                ...stage,
                status: "rejected" as ApprovalStage["status"],
                completedAt: new Date().toISOString(),
                comments: reason,
              };
            }
            return stage;
          });

          return {
            ...wf,
            stages: updatedStages,
            status: "rejected" as ApprovalWorkflow["status"],
            completedAt: new Date().toISOString(),
            finalDecision: reason,
          };
        }
        return wf;
      })
    );

    toast({
      title: "Workflow rejected",
      description:
        "The workflow has been rejected and stakeholders will be notified.",
    });
  };

  const addNewStage = () => {
    setNewWorkflow((prev) => ({
      ...prev,
      stages: [
        ...prev.stages,
        {
          name: "",
          description: "",
          approvers: [],
          requiredApprovals: 1,
        },
      ],
    }));
  };

  const updateStage = (index: number, field: string, value: any) => {
    setNewWorkflow((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) =>
        i === index ? { ...stage, [field]: value } : stage
      ),
    }));
  };

  const removeStage = (index: number) => {
    setNewWorkflow((prev) => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Approval Workflows</h3>
          <p className="text-muted-foreground">
            Manage multi-stage approval processes
          </p>
        </div>
      </div>

      {/* Workflows List */}
      {filteredWorkflows.length === 0 ? (
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-12 text-center">
            <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No workflows found</h4>
            <p className="text-muted-foreground mb-4">
              Create your first approval workflow to get started
            </p>
            <Button onClick={() => setIsNewWorkflowOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredWorkflows.map((workflow) => (
            <Card
              key={workflow.id}
              className="bg-gradient-card border-border shadow-card"
            >

              <CardContent className="space-y-6">
                {/* Workflow Actions */}
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Initiated by {workflow.initiatedBy} on{" "}
                    {new Date(workflow.initiatedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Uploaded Files Section */}
                {filteredFiles.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      {/* Section Header */}
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <File className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold">
                          Uploaded Files
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {filteredFiles.length}
                        </Badge>
                      </div>

                      {/* Files List */}
                      <div className="space-y-3">
                        {filteredFiles.map((file) => {
                          // Determine trigger status
                          const isTriggered = (file as any).isTriggered || false;
                          const triggeredAt = (file as any).triggeredAt || (file as any).approvedAt;
                          const notTriggeredReason = (file as any).notTriggeredReason;

                          return (
                            <div
                              key={file.id}
                              className="group relative bg-gradient-to-r from-muted/30 to-muted/20 rounded-lg border border-border hover:border-primary/30 transition-all p-4 shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-4">
                                {/* Left: File Info */}
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                                    <div className="w-6 h-6 flex items-center justify-center text-primary">
                                      {getFileTypeIcon(file.format)}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-sm text-foreground truncate">
                                        {file.name}
                                      </h4>
                                      {file.status === "ready" && (
                                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                                      )}
                                    </div>
                                    {file.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {file.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      {file.uploadedBy && (
                                        <div className="flex items-center gap-1.5">
                                          <User className="w-3.5 h-3.5" />
                                          <span>Uploaded by {file.uploadedBy}</span>
                                        </div>
                                      )}
                                      {file.uploadedAt && (
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>
                                            {new Date(file.uploadedAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Trigger Status Information */}
                                    <div className="pt-2">
                                      {isTriggered ? (
                                        <div className="flex items-start gap-2 p-2 rounded-md bg-success/10 border border-success/20">
                                          <Zap className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-success mb-0.5">
                                              Process Triggered
                                            </div>
                                            {triggeredAt && (
                                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                  Triggered on{" "}
                                                  {new Date(triggeredAt).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                  })}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-start gap-2 p-2 rounded-md bg-warning/10 border border-warning/20">
                                          <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-warning mb-0.5">
                                              Not Triggered
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {notTriggeredReason ? (
                                                <span>Reason: {notTriggeredReason}</span>
                                              ) : (
                                                <span>Process has not been triggered yet</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Trigger Status Badge */}
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <Badge
                                    className={`text-xs font-medium px-3 py-1 ${
                                      isTriggered
                                        ? "bg-success/20 text-success border-success/30 hover:bg-success/30"
                                        : "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30"
                                    }`}
                                  >
                                    {isTriggered ? (
                                      <>
                                        <Zap className="w-3 h-3 mr-1" />
                                        Triggered
                                      </>
                                    ) : (
                                      "Not Triggered"
                                    )}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
