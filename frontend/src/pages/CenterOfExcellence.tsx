import { useState, useEffect } from "react";
import {
  Plus, Search, Upload, FileText, Clock, Target, TrendingUp, Users,
  Building, CheckCircle, Rocket, ClipboardList, DraftingCompass, Code,
  TestTube, UserCheck, Heart, Shield, AlertTriangle, Pencil, ArrowRight,
  Brain, Loader2, XCircle, BarChart3, Download, PlayCircle, CheckSquare, Handshake,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ProcessStageForms } from "@/components/ProcessStageForms";
import { Process } from "@/types/ProcessTypes";
import {
  getAllProcessesSummary,
  mapBackendStageToFrontend,
  downloadSampleData,
  downloadSopDoc,
  getAllStages,
  StageData,
  getProcessCompleteDetail,
  apiCall,
  getStageTracking,
  startDevelopmentStage,
  completeDevelopmentStage,
  startQAStage,
  getQAStage,
  startUATStage,
  startHypercareStage,
} from "@/services/processRegistrationApi";
import { AutomationRoadmap } from "@/components/AutomationRoadmap";
import { BusinessROICalculator } from "@/components/BusinessROICalculator";
import { ApprovalWorkflowBoard } from "@/components/ApprovalWorkflowBoard";
import { TeamAssignments } from "@/components/TeamAssignments";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Finance", "HR", "Operations", "IT", "Legal", "Marketing", "Sales",
];

// Stages that go through StageApprovalLog and require someone to approve
// in the Approvals tab before the next stage becomes available.
const APPROVAL_BASED_STAGES = ["Initial Triage", "Detailed Analysis", "Business Case", "HandOver"] as const;

// Stages that use a Start → Complete button flow (no approval log)
const CLICK_ACTION_STAGES = ["Development", "QA"] as const;

// Role IDs
const ROLE_ID = {
  OWNER: 15,
  AUTOMATION_LEAD: 14,
  AUTOMATION_ENGINEER: 3,
} as const;

interface COENavigationState {
  activeTab: "team-assignments";
  processId: string;
  processName: string;
  processDepartment: string;
}

// ─────────────────────────────────────────────────────────────
// PURE HELPERS (no hooks, safe to call anywhere)
// ─────────────────────────────────────────────────────────────
const getStatusIcon = (status: string) => {
  const icons: Record<string, React.ReactNode> = {
    "Registration": <FileText className="w-4 h-4" />,
    "Initial Triage": <ClipboardList className="w-4 h-4" />,
    "Detailed Analysis": <BarChart3 className="w-4 h-4" />,
    "Technical Assessment": <TestTube className="w-4 h-4" />,
    "Business Case": <DraftingCompass className="w-4 h-4" />,
    "Development": <Code className="w-4 h-4" />,
    "QA": <Shield className="w-4 h-4" />,
    "UAT": <UserCheck className="w-4 h-4" />,
    "Go Live": <Rocket className="w-4 h-4" />,
    "Hypercare": <Heart className="w-4 h-4" />,
  };
  return icons[status] ?? <FileText className="w-4 h-4" />;
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    "Low": "bg-muted text-muted-foreground",
    "Medium": "bg-warning/20 text-warning-foreground border-warning/30",
    "High": "bg-destructive/20 text-destructive-foreground border-destructive/30",
    "Critical": "bg-gradient-danger text-white border-destructive shadow-glow",
  };
  return colors[priority] ?? "bg-muted text-muted-foreground";
};

const getStageStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    "Approved": "bg-green-500/20 text-green-600 border-green-500/30 font-medium",
    "Completed": "bg-green-500/20 text-green-600 border-green-500/30 font-medium",
    "Pending": "bg-yellow-500/20 text-yellow-600 border-yellow-500/30 font-medium",
    "Waiting for Approval": "bg-orange-500/20 text-orange-600 border-orange-500/30 font-medium",
    "Rejected": "bg-red-500/20 text-red-600 border-red-500/30 font-medium",
    "In Progress": "bg-blue-500/20 text-blue-600 border-blue-500/30 font-medium",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
};

const getStageStatusIcon = (status: string) => {
  switch (status) {
    case "Approved": return <CheckCircle className="w-4 h-4" />;
    case "Completed": return <CheckCircle className="w-4 h-4" />;
    case "Pending": return <Clock className="w-4 h-4" />;
    case "Waiting for Approval": return <AlertTriangle className="w-4 h-4" />;
    case "Rejected": return <XCircle className="w-4 h-4" />;
    case "In Progress": return <Loader2 className="w-4 h-4 animate-spin" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const getFileName = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  const parts = String(path).replace(/\\\\/g, "/").split("/");
  return parts[parts.length - 1] || undefined;
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function CenterOfExcellence() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ── Stage master data ─────────────────────────────────────
  const [allStages, setAllStages] = useState<StageData[]>([]);
  const [processStages, setProcessStages] = useState<string[]>([]);
  const [isLoadingStages, setIsLoadingStages] = useState(true);

  // ── Process list ──────────────────────────────────────────
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // ── Selected process detail ───────────────────────────────
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isProcessDetailsOpen, setIsProcessDetailsOpen] = useState(false);
  const [isLoadingProcessDetail, setIsLoadingProcessDetail] = useState(false);
  const [activeProcessInfoSubTab, setActiveProcessInfoSubTab] = useState("overview");

  // ── Stage tracking (used for approval-based button logic) ─
  const [stageTrackingData, setStageTrackingData] = useState<any[]>([]);

  // ── Business case & technical assessment ─────────────────
  const [businessCaseData, setBusinessCaseData] = useState<any>(null);
  const [hasBusinessCaseData, setHasBusinessCaseData] = useState(false);
  const [isLoadingBusinessCase, setIsLoadingBusinessCase] = useState(false);
  const [technicalAssessmentData, setTechnicalAssessmentData] = useState<any>(null);
  const [hasTechnicalAssessmentData, setHasTechnicalAssessmentData] = useState(false);
  const [isLoadingTechnicalAssessment, setIsLoadingTechnicalAssessment] = useState(false);

  // ── Stage form dialog ─────────────────────────────────────
  const [isStageFormOpen, setIsStageFormOpen] = useState(false);
  // Resubmission registration dialog shares same component but uses a process id
  const [resubmissionProcessId, setResubmissionProcessId] = useState<number | null>(null);

  // ── Development stage state ───────────────────────────────
  const [devStartedExternal, setDevStartedExternal] = useState(false);
  const [isDevActionLoading, setIsDevActionLoading] = useState(false);

  // ── QA stage state ────────────────────────────────────────
  const [qaStartedExternal, setQaStartedExternal] = useState(false);
  const [isQaActionLoading, setIsQaActionLoading] = useState(false);

  // ── UAT stage state ────────────────────────────────────────
  const [uatStartedExternal, setUatStartedExternal] = useState(false);
  const [isUatActionLoading, setIsUatActionLoading] = useState(false);

  const [hypercareStartedExternal, setHypercareStartedExternal] = useState(false);
  const [isHypercareActionLoading, setIsHypercareActionLoading] = useState(false);

  // ── Initial Triage resubmit state ──────────────────────────
  const [isResubmittingInitialTriage, setIsResubmittingInitialTriage] = useState(false);

  // ── Download states ───────────────────────────────────────
  const [isDownloadingPDD, setIsDownloadingPDD] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);
  const [isDownloadingSop, setIsDownloadingSop] = useState(false);

  // ── Navigation / tabs ─────────────────────────────────────
  const navState = (location.state ?? null) as COENavigationState | null;
  const [activeTab, setActiveTab] = useState<string>(navState?.activeTab ?? "processes");
  const [processContext, setProcessContext] = useState<{
    processId?: string; processName?: string; processDepartment?: string;
  }>({
    processId: navState?.processId ? `P${String(navState.processId).padStart(3, "0")}` : undefined,
    processName: navState?.processName,
    processDepartment: navState?.processDepartment,
  });

  // ── Form state (new process + stage forms) ────────────────
  const [formData, setFormData] = useState({
    title: "", department: "", description: "",
    priority: "" as "Low" | "Medium" | "High" | "Critical" | "",
    expectedROI: "", stakeholders: [] as string[], tags: [] as string[],
  });
  const [currentStakeholder, setCurrentStakeholder] = useState("");
  const [currentTag, setCurrentTag] = useState("");
  const [dataSamplesUploaded, setDataSamplesUploaded] = useState(false);
  const [sopDocumentUploaded, setSopDocumentUploaded] = useState(false);
  const [triageData, setTriageData] = useState({
    isRuleBased: undefined as boolean | undefined,
    isStable: undefined as boolean | undefined,
    areExceptionsManageable: undefined as boolean | undefined,
    complianceRisk: undefined as boolean | undefined,
    complianceRiskSummary: "",
  });
  const [sitData, setSitData] = useState({ testNotes: "", credentialRequirements: "" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewProcessOpen, setIsNewProcessOpen] = useState(false);

  // ─────────────────────────────────────────────────────────
  // ROLE HELPERS
  // ─────────────────────────────────────────────────────────
  const getUserRoleId = (): number | null => {
    // Try context first, then localStorage fallbacks
    const fromContext =
      user?.RoleId ?? user?.roleId ?? user?.role?.RoleId ?? user?.role?.roleId;
    if (fromContext) return Number(fromContext);

    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        const id = parsed?.RoleId ?? parsed?.roleId ?? parsed?.role?.RoleId ?? parsed?.role?.roleId;
        if (id) return Number(id);
      }
      const direct = localStorage.getItem("roleId");
      if (direct) return Number(direct);
    } catch { /* ignore */ }

    return null;
  };

  const roleId = getUserRoleId();
  const isOwner = () => roleId === ROLE_ID.OWNER;
  const isAutomationLead = () => roleId === ROLE_ID.AUTOMATION_LEAD;
  const isAutomationEngineer = () => roleId === ROLE_ID.AUTOMATION_ENGINEER;

  /** Returns true if the current user may interact with a given stage's form/button */
  const canAccessStage = (stageName: string): boolean => {
    switch (stageName) {
      case "Registration":
      case "UAT":
        return isOwner();
      case "Business Case":
        return isAutomationLead();
      default:
        return isAutomationEngineer();
    }
  };

  // ─────────────────────────────────────────────────────────
  // DATA MAPPING
  // ─────────────────────────────────────────────────────────
  const mapSummaryRowToProcess = (p: any): Process => {
    const numericId = p.ProcessId ?? p.process_id ?? p.Id ?? p.id ?? p.ProcessID;
    const id = numericId != null
      ? `P${String(numericId).padStart(3, "0")}`
      : String(p.ProcessCode ?? p.Code ?? "P000");

    const rawSamplePath = p.SampledataPath ?? p.sampledataPath ?? p.SampleDataPath ?? p.sampledata_path ?? p.Sampledata ?? null;
    const rawSopPath = p.SopDoc ?? p.sopDoc ?? p.SOPDoc ?? p.sop_doc ?? p.Sop_Doc ?? null;

    return {
      id,
      title: p.Title ?? p.title ?? "",
      description: p.Description ?? p.description ?? "",
      department: p.Department ?? p.department ?? "",
      priority: (p.Priority ?? p.priority ?? "Medium") as "Low" | "Medium" | "High" | "Critical",
      expectedROI: Number(p.ExpectedROI ?? p.expectedROI ?? 0),
      status: mapBackendStageToFrontend(p.CurrentStage ?? p.StageName ?? p.Status ?? "Registration"),
      stageStatus: p.CurrentStageStatus ?? p.status ?? null,
      submittedBy: p.CreatedByName ?? p.createdByName ?? "Unknown",
      submittedDate: p.SubmittedDate ?? p.submittedDate ?? p.CreatedAt ?? p.createdAt ?? new Date().toISOString(),
      estimatedSavings: Number(p.EstimatedSavings ?? p.estimatedSavings ?? 0),
      complexity: (p.Complexity ?? p.complexity ?? "Medium") as "Low" | "Medium" | "High",
      dependencies: [],
      stakeholders: p.Stakeholder ? String(p.Stakeholder).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      tags: p.Tag ? String(p.Tag).split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      registrationDocuments: (rawSamplePath || rawSopPath)
        ? { dataSamples: getFileName(rawSamplePath), sopDocument: getFileName(rawSopPath) }
        : undefined,
    };
  };

  const extractNumericField = (raw: any, logicalName: string): number | undefined => {
    if (!raw || typeof raw !== "object") return undefined;
    const target = logicalName.toLowerCase();
    for (const [key, v] of Object.entries(raw)) {
      if (key.toLowerCase().replace(/_/g, "") === target) {
        const num = Number(v);
        return isNaN(num) ? undefined : num;
      }
    }
    return undefined;
  };

  // ─────────────────────────────────────────────────────────
  // STAGE PROGRESS / COLOR HELPERS
  // ─────────────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    const idx = allStages.findIndex((s) => s.stageName === status);
    if (idx === -1) return "bg-muted text-muted-foreground";
    const lastStage = allStages[allStages.length - 1]?.stageName;
    if (status === lastStage) return "bg-green-500 text-white border-green-600 font-semibold";
    if (idx < 2) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (idx < 5) return "bg-warning/20 text-warning-foreground border-warning/30";
    if (idx < 7) return "bg-primary/20 text-primary-foreground border-primary/30";
    if (idx < 9) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-green-500/20 text-green-600 border-green-500/30 font-medium";
  };

  const getStageProgress = (status: string): number => {
    const idx = allStages.findIndex((s) => s.stageName === status);
    if (idx === -1) return 0;
    return ((idx + 1) / allStages.length) * 100;
  };

  // ─────────────────────────────────────────────────────────
  // TAB VISIBILITY HELPERS (based on stage progression)
  // ─────────────────────────────────────────────────────────
  const shouldShowTechnicalAssessmentTab = (process: Process | null): boolean => {
    if (!process) return false;
    const technicalAssessmentIdx = processStages.indexOf("Technical Assessment");
    const currentIdx = processStages.indexOf(process.status);
    return technicalAssessmentIdx >= 0 && currentIdx >= technicalAssessmentIdx;
  };

  const shouldShowBusinessCaseTab = (process: Process | null): boolean => {
    if (!process) return false;
    if (!isAutomationLead()) return false;
    const businessCaseIdx = processStages.indexOf("Business Case");
    const currentIdx = processStages.indexOf(process.status);
    return businessCaseIdx >= 0 && currentIdx >= businessCaseIdx;
  };

  // ─────────────────────────────────────────────────────────
  // STAGE TRACKING REFRESH (shared helper)
  // ─────────────────────────────────────────────────────────
  const refreshStageTracking = async (numericId: number) => {
    try {
      const trackingRes = await getStageTracking(numericId);
      if (trackingRes?.success && Array.isArray(trackingRes.stages)) {
        setStageTrackingData(trackingRes.stages);

        const devStage = trackingRes.stages.find((s: any) => s.StageName === "Development");
        setDevStartedExternal(
          devStage ? devStage.status === "In Progress" : false
          // Pending = not started yet, In Progress = started, Completed = done
        );

        // Sync QA started state - check both stage tracking status and QA stage data
        const qaStage = trackingRes.stages.find((s: any) => s.StageName === "QA");
        const qaStatusFromTracking = qaStage?.status === "In Progress";

        const uatStage = trackingRes.stages.find((s: any) => s.StageName === "UAT");
        setUatStartedExternal(uatStage ? uatStage.status === "In Progress" : false);

        const hcStage = trackingRes.stages.find((s: any) => s.StageName === "Hypercare");
        setHypercareStartedExternal(hcStage ? hcStage.status === "In Progress" : false);
        // Also check QA stage data for qa_start_date
        try {
          const qaStageData = await getQAStage(numericId);
          const hasQaStartDate = qaStageData?.success && qaStageData?.hasData && qaStageData?.data?.qa_start_date;
          setQaStartedExternal(qaStatusFromTracking || !!hasQaStartDate);
        } catch {
          // Fallback to stage tracking status if QA stage fetch fails
          setQaStartedExternal(qaStatusFromTracking);
        }
      }
    } catch { /* non-fatal */ }
  };

  // Helper to get current stage tracking record (for rejection reason, etc.)
  const currentStageTracking = selectedProcess
    ? stageTrackingData.find((s: any) => s.StageName === selectedProcess.status)
    : null;

  const currentRejectionReason =
    (currentStageTracking as any)?.rejection_reason ||
    (currentStageTracking as any)?.RejectionReason ||
    "";

  // ─────────────────────────────────────────────────────────
  // PROCESS DETAIL REFRESH (shared helper)
  // Only loads basic process data, not stage-specific data
  // ─────────────────────────────────────────────────────────
  const refreshProcessDetail = async (numericId: number) => {
    try {
      setIsLoadingProcessDetail(true);

      const [detailRes, _] = await Promise.all([
        getProcessCompleteDetail(numericId),
        refreshStageTracking(numericId),
      ]);

      if (detailRes?.success) {
        if (detailRes.process) {
          setSelectedProcess(mapSummaryRowToProcess(detailRes.process));
        }
        // Don't load business case or technical assessment here
        // They will be loaded lazily when user clicks on those tabs
      }
    } catch (error: any) {
      console.error("Error refreshing process detail:", error);
    } finally {
      setIsLoadingProcessDetail(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // LOAD TECHNICAL ASSESSMENT DATA (lazy load)
  // ─────────────────────────────────────────────────────────
  const loadTechnicalAssessmentData = async (numericId: number) => {
    if (hasTechnicalAssessmentData && technicalAssessmentData) {
      return; // Already loaded
    }

    try {
      setIsLoadingTechnicalAssessment(true);
      const detailRes = await getProcessCompleteDetail(numericId);

      if (detailRes?.success) {
        if (detailRes.technicalAssessment?.hasData && detailRes.technicalAssessment.data) {
          setTechnicalAssessmentData(detailRes.technicalAssessment.data);
          setHasTechnicalAssessmentData(true);
        } else {
          setTechnicalAssessmentData(null);
          setHasTechnicalAssessmentData(false);
        }
      }
    } catch (error: any) {
      console.error("Error loading technical assessment:", error);
    } finally {
      setIsLoadingTechnicalAssessment(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // LOAD BUSINESS CASE DATA (lazy load)
  // ─────────────────────────────────────────────────────────
  const loadBusinessCaseData = async (numericId: number) => {
    if (hasBusinessCaseData && businessCaseData) {
      return; // Already loaded
    }

    try {
      setIsLoadingBusinessCase(true);
      const detailRes = await getProcessCompleteDetail(numericId);

      if (detailRes?.success) {
        if (detailRes.businessCase?.hasData && detailRes.businessCase.data) {
          const raw = detailRes.businessCase.data;
          setBusinessCaseData({
            raw,
            FteSavings: extractNumericField(raw, "ftesavings"),
            CostSavings: extractNumericField(raw, "costsavings"),
            ImplementationCost: extractNumericField(raw, "implementationcost"),
            PaybackMonths: extractNumericField(raw, "paybackmonths"),
            RoiPercent: extractNumericField(raw, "roipercent"),
          });
          setHasBusinessCaseData(true);
        } else {
          setBusinessCaseData(null);
          setHasBusinessCaseData(false);
        }
      }
    } catch (error: any) {
      console.error("Error loading business case:", error);
    } finally {
      setIsLoadingBusinessCase(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // FETCH ALL PROCESSES
  // ─────────────────────────────────────────────────────────
  const fetchProcesses = async () => {
    try {
      setIsLoadingProcesses(true);
      const response = await getAllProcessesSummary();
      if (response?.success && Array.isArray(response.processes)) {
        setProcesses(response.processes.map(mapSummaryRowToProcess));
      } else {
        toast({
          title: "Failed to load processes",
          description: response?.message || "Unable to fetch process list.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error loading processes:", error);
      toast({
        title: "Failed to load processes",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProcesses(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // INITIAL LOAD
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoadingStages(true);
        const [stagesRes] = await Promise.all([getAllStages(), fetchProcesses()]);
        if (stagesRes?.success && Array.isArray(stagesRes.stages)) {
          setAllStages(stagesRes.stages);
          setProcessStages(
            stagesRes.stages
              .sort((a: StageData, b: StageData) => a.sequenceOrder - b.sequenceOrder)
              .map((s: StageData) => s.stageName)
          );
        }
      } catch (error: any) {
        console.error("Error during initial load:", error);
      } finally {
        setIsLoadingStages(false);
      }
    };
    init();
  }, []);

  // ─────────────────────────────────────────────────────────
  // NAVIGATION STATE SYNC
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const incoming = (location.state ?? null) as COENavigationState | null;
    if (!incoming) return;
    if (incoming.activeTab) setActiveTab(incoming.activeTab);
    if (incoming.processId) {
      setProcessContext({
        processId: `P${String(incoming.processId).padStart(3, "0")}`,
        processName: incoming.processName,
        processDepartment: incoming.processDepartment,
      });
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state]);

  // ─────────────────────────────────────────────────────────
  // GLOBAL processUpdated EVENT LISTENER
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleProcessUpdate = async (event: any) => {
      // Always refresh the process list
      try {
        const response = await getAllProcessesSummary();
        if (response?.success && Array.isArray(response.processes)) {
          setProcesses(response.processes.map(mapSummaryRowToProcess));
        }
      } catch (error: any) {
        console.error("Error refreshing process list:", error);
      }

      // Refresh detail panel if it's open and relevant
      if (selectedProcess && isProcessDetailsOpen) {
        const currentProcessId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
        const updatedProcessId = event?.detail?.processId;
        if (!updatedProcessId || updatedProcessId === currentProcessId) {
          await refreshProcessDetail(currentProcessId);
        }
      }
    };

    window.addEventListener("processUpdated", handleProcessUpdate);
    return () => window.removeEventListener("processUpdated", handleProcessUpdate);
  }, [selectedProcess, isProcessDetailsOpen]);

  // Auto-close stage form if user loses access to the current stage
  useEffect(() => {
    if (isStageFormOpen && selectedProcess && !canAccessStage(selectedProcess.status)) {
      setIsStageFormOpen(false);
    }
  }, [isStageFormOpen, selectedProcess?.status]);

  useEffect(() => {
    const checkHypercareStarted = async () => {
      if (!selectedProcess || selectedProcess.status !== "Hypercare") {
        setHypercareStartedExternal(false);
        return;
      }
      try {
        const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
        if (isNaN(numericId)) return;
        const trackingRes = await getStageTracking(numericId);
        if (trackingRes?.success && Array.isArray(trackingRes.stages)) {
          const hcStage = trackingRes.stages.find((s: any) => s.StageName === "Hypercare");
        }
      } catch {
        setHypercareStartedExternal(false);
      }
    };
    checkHypercareStarted();
  }, [selectedProcess]);

  // ─────────────────────────────────────────────────────────
  // LAZY LOAD TAB DATA WHEN USER CLICKS ON TABS
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedProcess || !isProcessDetailsOpen) return;

    const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
    if (isNaN(numericId)) return;

    // Load Technical Assessment data when user clicks on that tab
    if (activeProcessInfoSubTab === "technical" && shouldShowTechnicalAssessmentTab(selectedProcess)) {
      loadTechnicalAssessmentData(numericId);
    }

    // Load Business Case data when user clicks on that tab
    if (activeProcessInfoSubTab === "business-case" && shouldShowBusinessCaseTab(selectedProcess)) {
      loadBusinessCaseData(numericId);
    }
  }, [activeProcessInfoSubTab, selectedProcess, isProcessDetailsOpen]);

  // ─────────────────────────────────────────────────────────
  // PROCESS CLICK HANDLER
  // ─────────────────────────────────────────────────────────
  const handleProcessClick = async (process: Process) => {
    setSelectedProcess(process);
    setIsProcessDetailsOpen(true);
    setActiveProcessInfoSubTab("overview");

    const numericId = parseInt(process.id.replace(/\D/g, ""), 10);
    if (!isNaN(numericId)) {
      await refreshProcessDetail(numericId);
    }
  };

  // ─────────────────────────────────────────────────────────
  // DIALOG CLOSE — RESET ALL DETAIL STATE
  // ─────────────────────────────────────────────────────────
  const handleDetailDialogClose = () => {
    setIsProcessDetailsOpen(false);
    setSelectedProcess(null);
    setStageTrackingData([]);
    setBusinessCaseData(null);
    setHasBusinessCaseData(false);
    setTechnicalAssessmentData(null);
    setHasTechnicalAssessmentData(false);
    setDevStartedExternal(false);
    setQaStartedExternal(false);
    setUatStartedExternal(false);
    setHypercareStartedExternal(false);
  };

  // ─────────────────────────────────────────────────────────
  // DEVELOPMENT ACTION
  // ─────────────────────────────────────────────────────────
  const handleDevelopmentAction = async () => {
    if (!selectedProcess) return;
    const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
    if (isNaN(numericId)) return;

    try {
      setIsDevActionLoading(true);
      const isStarting = !devStartedExternal;
      const response = isStarting
        ? await startDevelopmentStage({ processId: numericId })
        : await completeDevelopmentStage({ processId: numericId });

      if (!response?.success) throw new Error(response?.message || "Action failed.");

      setDevStartedExternal(isStarting);
      toast({
        title: isStarting ? "Development Started ✅" : "Development Completed ✅",
        description: response.message,
      });
      window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId: numericId } }));
    } catch (error: any) {
      toast({ title: "Action Failed", description: error?.message, variant: "destructive" });
    } finally {
      setIsDevActionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // QA ACTION
  // ─────────────────────────────────────────────────────────
  const handleQAAction = async () => {
    if (!selectedProcess) return;
    const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
    if (isNaN(numericId)) return;

    if (qaStartedExternal) {
      // QA already started → open the complete QA form
      setIsStageFormOpen(true);
      return;
    }

    try {
      setIsQaActionLoading(true);
      const res = await startQAStage({ processId: numericId });
      if (!res?.success) throw new Error(res?.message || "Failed to start QA.");

      setQaStartedExternal(true);
      toast({ title: "QA Started ✅", description: res.message });

      // Refresh stage tracking to sync state
      await refreshStageTracking(numericId);

      window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId: numericId } }));
    } catch (error: any) {
      toast({ title: "Action Failed", description: error?.message, variant: "destructive" });
    } finally {
      setIsQaActionLoading(false);
    }
  };

  const handleUATAction = async () => {
    if (!selectedProcess) return;
    const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
    if (isNaN(numericId)) return;

    if (uatStartedExternal) {
      setIsStageFormOpen(true); // UAT started → open complete form
      return;
    }

    try {
      setIsUatActionLoading(true);
      const res = await startUATStage({ processId: numericId });
      if (!res?.success) throw new Error(res?.message || "Failed to start UAT.");

      setUatStartedExternal(true);
      setIsUatActionLoading(false); // Clear loading state immediately after success
      toast({ title: "UAT Started ✅", description: res.message });
      // Refresh in background without blocking UI
      refreshStageTracking(numericId).catch(console.error);
      window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId: numericId } }));
    } catch (error: any) {
      setIsUatActionLoading(false);
      toast({ title: "Action Failed", description: error?.message, variant: "destructive" });
    }
  };

  const handleHypercareAction = async (process: Process) => {
    const numericId = parseInt(process.id.replace(/\D/g, ""), 10);
    if (isNaN(numericId)) return;

    setIsHypercareActionLoading(true);
    try {
      const res = await startHypercareStage({ processId: numericId });
      if (res?.success) {
        setHypercareStartedExternal(true);
        toast({
          title: "Hypercare Started ✅",
          description: `Started at ${new Date().toLocaleString()}`,
        });
        window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId: numericId } }));
      } else {
        throw new Error(res?.message || "Failed to start Hypercare.");
      }
    } catch (error: any) {
      toast({ title: "Action Failed", description: error?.message, variant: "destructive" });
    } finally {
      setIsHypercareActionLoading(false);
    }
  };

  const handleResubmitInitialTriage = async () => {
    if (!selectedProcess) return;
    const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
    if (isNaN(numericId)) return;

    // Open registration dialog in RESUBMISSION mode, pre-filled with existing data
    setIsResubmittingInitialTriage(true);
    setResubmissionProcessId(numericId);

    setFormData({
      title: selectedProcess.title || "",
      department: selectedProcess.department || "",
      description: selectedProcess.description || "",
      priority: (selectedProcess.priority as any) || "",
      expectedROI:
        selectedProcess.expectedROI && !isNaN(selectedProcess.expectedROI)
          ? String(selectedProcess.expectedROI)
          : "",
      stakeholders: selectedProcess.stakeholders || [],
      tags: selectedProcess.tags || [],
    });

    setIsNewProcessOpen(true);
    setIsResubmittingInitialTriage(false);
  };

  // ─────────────────────────────────────────────────────────
  // FOOTER BUTTON CONFIG
  // Central place that decides what button to show in the
  // process detail dialog footer.
  // ─────────────────────────────────────────────────────────
  const getStageActionButton = (
    process: Process | null
  ): { show: boolean; label: string; icon: React.ReactNode; color: string } => {
    const hidden = { show: false, label: "", icon: null, color: "" };
    if (!process) return hidden;

    const stage = process.status;

    // Role gate — user must have access to this stage
    if (!canAccessStage(stage)) return hidden;

    // Completed stages never show a button
    if (process.stageStatus === "Completed") return hidden;

    if ((APPROVAL_BASED_STAGES as readonly string[]).includes(stage)) {
      if (process.stageStatus === "Waiting for Approval") return hidden;
      if (process.stageStatus === "Approved") return hidden;
      if (process.stageStatus === "Rejected") return hidden;
    }

    // ── Per-stage button config ──────────────────────────────
    switch (stage) {
      case "Initial Triage":
        return { show: true, label: "Submit Initial Triage", icon: <ClipboardList className="w-4 h-4 mr-2" />, color: "bg-blue-600 hover:bg-blue-700 text-white" };

      case "Detailed Analysis":
        return { show: true, label: "Upload PDD", icon: <FileText className="w-4 h-4 mr-2" />, color: "bg-amber-600 hover:bg-amber-700 text-white" };

      case "Technical Assessment":
        return { show: true, label: "Save Technical Assessment", icon: <TestTube className="w-4 h-4 mr-2" />, color: "bg-cyan-600 hover:bg-cyan-700 text-white" };

      case "Business Case":
        return { show: true, label: "Submit Business Case", icon: <TrendingUp className="w-4 h-4 mr-2" />, color: "bg-emerald-600 hover:bg-emerald-700 text-white" };

      case "Development":
        return {
          show: true,
          label: devStartedExternal ? "Complete Development → Move to QA" : "Start Development",
          icon: devStartedExternal ? <ArrowRight className="w-4 h-4 mr-2" /> : <Code className="w-4 h-4 mr-2" />,
          color: devStartedExternal ? "bg-violet-700 hover:bg-violet-800 text-white" : "bg-violet-600 hover:bg-violet-700 text-white",
        };

      case "QA":
        return qaStartedExternal
          ? { show: true, label: "Complete QA → Move to UAT", icon: <CheckSquare className="w-4 h-4 mr-2" />, color: "bg-indigo-700 hover:bg-indigo-800 text-white" }
          : { show: true, label: "Start QA", icon: <PlayCircle className="w-4 h-4 mr-2" />, color: "bg-indigo-600 hover:bg-indigo-700 text-white" };

      case "UAT":
        return uatStartedExternal
          ? { show: true, label: "Complete UAT → Move to Go Live", icon: <CheckSquare className="w-4 h-4 mr-2" />, color: "bg-pink-700 hover:bg-pink-800 text-white" }
          : { show: true, label: "Start UAT", icon: <PlayCircle className="w-4 h-4 mr-2" />, color: "bg-pink-600 hover:bg-pink-700 text-white" };

      case "Go Live":
      case "GoLive":
      case "Go-Live":
        return { show: true, label: "Go-Live", icon: <Rocket className="w-4 h-4 mr-2" />, color: "bg-orange-600 hover:bg-orange-700 text-white" };

      case "Hypercare":
        return hypercareStartedExternal
          ? {
            show: true, label: "Complete Hypercare → Handover to BAU",
            icon: <CheckSquare className="w-4 h-4 mr-2" />, color: "bg-teal-700 hover:bg-teal-800 text-white"
          }
          : {
            show: true, label: "Start Hypercare",
            icon: <PlayCircle className="w-4 h-4 mr-2" />, color: "bg-teal-600 hover:bg-teal-700 text-white"
          };

      case "HandOver":
        return { show: true, label: "Handover to BAU", icon: <Handshake className="w-4 h-4 mr-2" />, color: "bg-purple-600 hover:bg-purple-700 text-white" };

      default:
        return hidden;
    }
  };

  // ─────────────────────────────────────────────────────────
  // FOOTER BUTTON CLICK DISPATCHER
  // ─────────────────────────────────────────────────────────
  const handleStageActionClick = () => {
    if (!selectedProcess) return;
    const stage = selectedProcess.status;

    if (stage === "Development") {
      handleDevelopmentAction();
    } else if (stage === "QA") {
      handleQAAction();
    } else if (stage === "UAT") {
      handleUATAction();
    } else if (stage === "Hypercare" && !hypercareStartedExternal) {
      handleHypercareAction(selectedProcess);
    } else {
      setIsStageFormOpen(true);
    }
  };

  // ─────────────────────────────────────────────────────────
  // FILTERED PROCESSES
  // ─────────────────────────────────────────────────────────
  const filteredProcesses = processes.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return (
      matchesSearch &&
      (departmentFilter === "All" || p.department === departmentFilter) &&
      (priorityFilter === "All" || p.priority === priorityFilter)
    );
  });

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex-1 space-y-8 p-8 bg-background">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary rounded-2xl opacity-10 blur-3xl" />
        <div className="relative bg-gradient-card rounded-2xl p-8 border border-border shadow-elevated">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Rocket className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Center of Excellence
                </h1>
                <p className="text-muted-foreground text-lg">Automation Pipeline & Innovation Hub</p>
              </div>
            </div>

            {isOwner() && (
              <Dialog
                open={isNewProcessOpen}
                onOpenChange={(open) => {
                  setIsNewProcessOpen(open);
                  if (!open) {
                    // Reset resubmission state so next open is treated as "new process"
                    setResubmissionProcessId(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg">
                    <Plus className="w-5 h-5 mr-2" />Submit Process
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {resubmissionProcessId ? "Resubmit Process" : "Submit New Process"}
                    </DialogTitle>
                    <DialogDescription>
                      {resubmissionProcessId
                        ? "Update your existing process registration and send it again for Initial Triage."
                        : "Provide process details to register it in the automation pipeline."}
                    </DialogDescription>
                  </DialogHeader>
                  <ProcessStageForms
                    selectedProcess={null}
                    triageData={triageData} setTriageData={setTriageData}
                    rejectionReason={rejectionReason} setRejectionReason={setRejectionReason}
                    isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting}
                    sitData={sitData} setSitData={setSitData}
                    getPriorityColor={getPriorityColor}
                    formData={formData} setFormData={setFormData}
                    currentStakeholder={currentStakeholder} setCurrentStakeholder={setCurrentStakeholder}
                    currentTag={currentTag} setCurrentTag={setCurrentTag}
                    dataSamplesUploaded={dataSamplesUploaded} setDataSamplesUploaded={setDataSamplesUploaded}
                    sopDocumentUploaded={sopDocumentUploaded} setSopDocumentUploaded={setSopDocumentUploaded}
                    departments={DEPARTMENTS}
                    isNewProcessOpen={isNewProcessOpen} setIsNewProcessOpen={setIsNewProcessOpen}
                    resubmissionProcessId={resubmissionProcessId}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-success border-success/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-success-foreground/80 text-sm font-medium">Total Processes</p>
                    <p className="text-2xl font-bold text-success-foreground">{processes.length}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success-foreground/80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-primary border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/80 text-sm font-medium">In Pipeline</p>
                    <p className="text-2xl font-bold text-primary-foreground">
                      {processes.filter((p) => p.status !== processStages[processStages.length - 1]).length}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-primary-foreground/80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-warning border-warning/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-warning-foreground/80 text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-warning-foreground">
                      {processes.filter((p) => p.status === processStages[processStages.length - 1]).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-warning-foreground/80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total ROI</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${(processes.reduce((sum, p) => sum + p.expectedROI, 0) / 1_000_000).toFixed(1)}M
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Main Tabs ────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList
          className={`grid w-full grid-cols-${2 + (isAutomationLead() || isOwner() ? 1 : 0) + 1} bg-card border border-border`}
        >
          <TabsTrigger value="processes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Process Pipeline
          </TabsTrigger>
          <TabsTrigger value="roi-calculator" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            ROI Calculator
          </TabsTrigger>
          {(isAutomationLead() || isOwner()) && (
            <TabsTrigger value="approvals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Approvals
            </TabsTrigger>
          )}
          <TabsTrigger value="team-assignments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Team Assignments
          </TabsTrigger>
        </TabsList>

        {/* ── Processes Tab ───────────────────────────────────── */}
        <TabsContent value="processes" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Process Submission Pipeline</h2>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab("roi-calculator")}>
                  <Target className="w-4 h-4" />ROI Calculator
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab("approvals")}>
                  <Users className="w-4 h-4" />Approval Board
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Business process automation pipeline through {processStages.length} stages from intake to completion
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Process Overview</TabsTrigger>
              <TabsTrigger value="roadmap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Automation Roadmap</TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Business Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Filters */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input placeholder="Search processes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Departments</SelectItem>
                          {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["All", "Low", "Medium", "High", "Critical"].map((p) => (
                            <SelectItem key={p} value={p}>{p === "All" ? "All Priorities" : p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Process cards */}
              {isLoadingProcesses ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-muted-foreground">Loading processes...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredProcesses.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-2">No processes found</p>
                    <p className="text-sm text-muted-foreground">Create a new process to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProcesses.map((process) => (
                    <Card
                      key={process.id}
                      className="bg-gradient-card border-border shadow-card hover:shadow-elevated transition-all cursor-pointer"
                      onClick={() => handleProcessClick(process)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono">{process.id}</Badge>
                            <Badge className={getPriorityColor(process.priority)}>{process.priority}</Badge>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(process.status)}>
                              {getStatusIcon(process.status)}<span className="ml-1">{process.status}</span>
                            </Badge>
                            {process.stageStatus && (
                              <Badge className={getStageStatusColor(process.stageStatus)}>
                                {getStageStatusIcon(process.stageStatus)}<span className="ml-1">{process.stageStatus}</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-lg">{process.title}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{process.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Department</span>
                          <Badge variant="outline" className="text-xs">
                            <Building className="w-3 h-3 mr-1" />{process.department}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Expected ROI</span>
                          <span className="font-medium text-success">${process.expectedROI.toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Pipeline Progress</span>
                            <span className="text-xs font-medium">{Math.round(getStageProgress(process.status))}%</span>
                          </div>
                          <Progress value={getStageProgress(process.status)} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="roadmap"><AutomationRoadmap /></TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-primary border-primary/30 shadow-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary-foreground">
                      <Brain className="w-5 h-5" />AI Business Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-primary-foreground">
                    {[
                      { title: "High-Impact Opportunity", desc: "Finance department shows 340% ROI potential for process automation" },
                      { title: "Quick Win Identified", desc: "Invoice processing automation can be deployed within 2 weeks" },
                      { title: "Resource Optimization", desc: "Current pipeline can save 2,400 hours annually across departments" },
                    ].map((item) => (
                      <div key={item.title} className="p-3 bg-black/20 rounded-lg">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs opacity-90">{item.desc}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-success" />Success Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "Processes Automated", value: processes.filter((p) => p.status === processStages[processStages.length - 1]).length, color: "success" },
                      { label: "Hours Saved/Month", value: 0, color: "primary" },
                      { label: "Cost Reduction", value: "$0K", color: "warning" },
                    ].map((item) => (
                      <div key={item.label} className={`flex justify-between items-center p-3 bg-${item.color}/10 rounded-lg border border-${item.color}/20`}>
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className={`text-lg font-bold text-${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="roi-calculator" className="space-y-6">
          <BusinessROICalculator />
        </TabsContent>

        {(isAutomationLead() || isOwner()) && (
          <TabsContent value="approvals" className="space-y-6">
            <ApprovalWorkflowBoard onProcessUpdated={fetchProcesses} />
          </TabsContent>
        )}

        <TabsContent value="team-assignments" className="space-y-6">
          <TeamAssignments
            processId={processContext.processId}
            processName={processContext.processName}
            processDepartment={processContext.processDepartment}
          />
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════
          PROCESS DETAIL DIALOG
      ═══════════════════════════════════════════════════════ */}
      <Dialog open={isProcessDetailsOpen} onOpenChange={(open) => { if (!open) handleDetailDialogClose(); }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {isLoadingProcessDetail ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Loading process details...</p>
            </div>
          ) : selectedProcess && (() => {
            const btn = getStageActionButton(selectedProcess);
            const isActionLoading = isDevActionLoading || isQaActionLoading || isUatActionLoading || isHypercareActionLoading;

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline">{selectedProcess.id}</Badge>
                    <Badge className={getPriorityColor(selectedProcess.priority)}>{selectedProcess.priority}</Badge>
                    <Badge className={getStatusColor(selectedProcess.status)}>
                      {getStatusIcon(selectedProcess.status)}<span className="ml-1">{selectedProcess.status}</span>
                    </Badge>
                    {selectedProcess.stageStatus && (
                      <Badge className={getStageStatusColor(selectedProcess.stageStatus)}>
                        {getStageStatusIcon(selectedProcess.stageStatus)}<span className="ml-1">{selectedProcess.stageStatus}</span>
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-2xl">{selectedProcess.title}</DialogTitle>
                  <DialogDescription>View and manage process details, business case, and technical assessment</DialogDescription>
                </DialogHeader>

                <Tabs value={activeProcessInfoSubTab} onValueChange={setActiveProcessInfoSubTab} className="space-y-4">
                  <TabsList className={`grid w-full grid-cols-${1 + (shouldShowTechnicalAssessmentTab(selectedProcess) ? 1 : 0) + (shouldShowBusinessCaseTab(selectedProcess) ? 1 : 0)} bg-muted/50 border border-border`}>
                    <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FileText className="w-4 h-4 mr-2" />Overview
                    </TabsTrigger>
                    {shouldShowTechnicalAssessmentTab(selectedProcess) && (
                      <TabsTrigger value="technical" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Rocket className="w-4 h-4 mr-2" />Technical Assessment
                      </TabsTrigger>
                    )}
                    {shouldShowBusinessCaseTab(selectedProcess) && (
                      <TabsTrigger value="business-case" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <TrendingUp className="w-4 h-4 mr-2" />Business Case
                      </TabsTrigger>
                    )}
                  </TabsList>


                  {/* Overview */}
                  <TabsContent value="overview" className="space-y-6 mt-4">
                    <Card className="border-2 border-blue-200/50 dark:border-blue-800/30">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-2">DESCRIPTION</h3>
                            <p className="text-sm text-foreground">{selectedProcess.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Process Details */}
                      <Card className="bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-blue-50/50 dark:from-blue-950/20 to-transparent border-b border-blue-200/50 dark:border-blue-800/30 pb-3">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-500/10"><Building className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                            Process Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                          {[
                            { label: "Department", value: selectedProcess.department },
                            { label: "Submitted By", value: selectedProcess.submittedBy },
                            { label: "Submitted Date", value: new Date(selectedProcess.submittedDate).toLocaleDateString() },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}:</span>
                              <span className="font-bold text-foreground">{value}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Financial */}
                      <Card className="bg-gradient-to-br from-green-50/50 dark:from-green-950/20 via-card to-card border-2 border-green-200/50 dark:border-green-800/30 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-green-50/50 dark:from-green-950/20 to-transparent border-b border-green-200/50 dark:border-green-800/30 pb-3">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-green-500/10"><TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" /></div>
                            Financial Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-green-50/50 dark:from-green-950/20 to-muted/30 border border-green-200/50 dark:border-green-800/30">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expected ROI:</span>
                            <span className="text-lg font-bold text-success flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {selectedProcess.expectedROI > 0 ? `$${selectedProcess.expectedROI.toLocaleString()}` : "$0"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tags & Stakeholders */}
                      <Card className="bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-purple-50/50 dark:from-purple-950/20 to-transparent border-b border-purple-200/50 dark:border-purple-800/30 pb-3">
                          <CardTitle className="text-sm font-bold">Process Tags & Stakeholders</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedProcess.tags?.length > 0
                                ? selectedProcess.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">{tag}</Badge>
                                ))
                                : <span className="text-xs text-muted-foreground">No tags</span>}
                            </div>
                          </div>
                          <div className="pt-3 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Stakeholders</p>
                            {selectedProcess.stakeholders?.length > 0
                              ? <div className="flex flex-wrap gap-1.5">
                                {selectedProcess.stakeholders.map((s, i) => (
                                  <Badge key={i} variant="outline" className="text-xs px-2 py-1 border-purple-300 dark:border-purple-700">
                                    <Users className="w-3 h-3 mr-1" />{s}
                                  </Badge>
                                ))}
                              </div>
                              : <span className="text-xs text-muted-foreground">No stakeholders added</span>}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Registration Documents */}
                    {selectedProcess.registrationDocuments &&
                      (selectedProcess.registrationDocuments.dataSamples || selectedProcess.registrationDocuments.sopDocument) && (
                        <Card className="bg-gradient-to-br from-green-50/50 dark:from-green-950/20 via-card to-card border-2 border-green-200/50 dark:border-green-800/30 shadow-md">
                          <CardHeader className="bg-gradient-to-r from-green-50/50 dark:from-green-950/20 to-transparent border-b border-green-200/50 dark:border-green-800/30 pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-green-500/10"><FileText className="w-4 h-4 text-green-600 dark:text-green-400" /></div>
                              Registration Documents
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-4">
                            {[
                              { file: selectedProcess.registrationDocuments.dataSamples, icon: <Upload className="w-4 h-4 text-green-600" />, isLoading: isDownloadingSample, setLoading: setIsDownloadingSample, downloader: downloadSampleData },
                              { file: selectedProcess.registrationDocuments.sopDocument, icon: <FileText className="w-4 h-4 text-green-600" />, isLoading: isDownloadingSop, setLoading: setIsDownloadingSop, downloader: downloadSopDoc },
                            ].filter(d => d.file).map(({ file, icon, isLoading, setLoading, downloader }) => (
                              <div key={file} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="flex items-center gap-2">
                                  {icon}
                                  <span className="text-sm font-medium truncate max-w-xs">{file}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" disabled={isLoading}
                                    onClick={async () => {
                                      try {
                                        setLoading(true);
                                        const pid = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
                                        const { blob, filename } = await downloader(pid, file);
                                        const url = window.URL.createObjectURL(blob);
                                        const a = Object.assign(document.createElement("a"), { href: url, download: filename });
                                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                      } catch (err: any) {
                                        toast({ title: "Download failed", description: err?.message, variant: "destructive" });
                                      } finally { setLoading(false); }
                                    }}>
                                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                                    Download
                                  </Button>
                                  <Badge variant="outline" className="text-xs bg-success/20 text-success border-success font-semibold">
                                    <CheckCircle className="w-3 h-3 mr-1" />Uploaded
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                    {selectedProcess.status === "Initial Triage" &&
                      selectedProcess.stageStatus === "Rejected" &&
                      isOwner() && (
                        <Card className="border-2 border-red-200/50 dark:border-red-800/30 bg-gradient-to-br from-red-50/30 dark:from-red-950/10 via-card to-card">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                              <div className="flex-1 flex flex-col">
                                <p className="font-semibold text-sm text-red-800 dark:text-red-200 mb-1">
                                  Process Rejected
                                </p>
                                {currentRejectionReason && (
                                  <div className="text-xs text-muted-foreground bg-background/60 border border-red-200/50 dark:border-red-800/30 rounded-md p-3 mb-2">
                                    <span className="font-semibold text-foreground">Rejection Reason: </span>
                                    <span className="whitespace-pre-line">{currentRejectionReason}</span>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mb-3">
                                  This process was rejected at Feasibility Check. Please update the required details and click Resubmit to send it for approval again.
                                </p>
                                <Button
                                  size="sm"
                                  onClick={handleResubmitInitialTriage}
                                  disabled={isResubmittingInitialTriage}
                                  className="self-end mt-2 bg-red-600 hover:bg-red-700 text-white"
                                >
                                  {isResubmittingInitialTriage ? (
                                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Resubmitting...</>
                                  ) : (
                                    <><ArrowRight className="w-3 h-3 mr-1" />Resubmit Process</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                    {/* ── Rejection Banner: Detailed Analysis ── */}
                    {selectedProcess.status === "Detailed Analysis" &&
                      selectedProcess.stageStatus === "Rejected" &&
                      isAutomationEngineer() && (
                        <Card className="border-2 border-red-200/50 dark:border-red-800/30 bg-gradient-to-br from-red-50/30 dark:from-red-950/10 via-card to-card">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-red-800 dark:text-red-200 mb-1">
                                  Detailed Analysis Rejected
                                </p>
                                {currentRejectionReason && (
                                  <div className="text-xs text-muted-foreground bg-background/60 border border-red-200/50 dark:border-red-800/30 rounded-md p-3 mb-2">
                                    <span className="font-semibold text-foreground">Rejection Reason: </span>
                                    <span className="whitespace-pre-line">{currentRejectionReason}</span>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mb-3">
                                  Please upload a revised PDD and resubmit for approval.
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => setIsStageFormOpen(true)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Upload className="w-3 h-3 mr-1" />
                                  Upload Revised PDD & Resubmit
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                    {/* ── Rejection Banner: Business Case ── */}
                    {selectedProcess.status === "Business Case" &&
                      selectedProcess.stageStatus === "Rejected" &&
                      isAutomationLead() && (
                        <Card className="border-2 border-red-200/50 dark:border-red-800/30 bg-gradient-to-br from-red-50/30 dark:from-red-950/10 via-card to-card">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-red-800 dark:text-red-200 mb-1">
                                  Business Case Rejected
                                </p>
                                {currentRejectionReason && (
                                  <div className="text-xs text-muted-foreground bg-background/60 border border-red-200/50 dark:border-red-800/30 rounded-md p-3 mb-2">
                                    <span className="font-semibold text-foreground">Rejection Reason: </span>
                                    <span className="whitespace-pre-line">{currentRejectionReason}</span>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mb-3">
                                  Please update the Business Case figures and resubmit for approval.
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => setIsStageFormOpen(true)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Update Business Case & Resubmit
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                    {selectedProcess.status === "HandOver" &&
                      selectedProcess.stageStatus === "Rejected" &&
                      isAutomationEngineer() && (
                        <Card className="border-2 border-red-200/50 dark:border-red-800/30 bg-gradient-to-br from-red-50/30 dark:from-red-950/10 via-card to-card">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-red-800 dark:text-red-200 mb-1">
                                  Handover Rejected
                                </p>
                                {currentRejectionReason && (
                                  <div className="text-xs text-muted-foreground bg-background/60 border border-red-200/50 dark:border-red-800/30 rounded-md p-3 mb-2">
                                    <span className="font-semibold text-foreground">Rejection Reason: </span>
                                    <span className="whitespace-pre-line">{currentRejectionReason}</span>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mb-3">
                                  Please update the Handover details and resubmit for approval.
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => setIsStageFormOpen(true)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Handshake className="w-3 h-3 mr-1" />
                                  Update Handover & Resubmit
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                    {/* Pipeline Stage Progress */}
                    <Card className="border-2 border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 to-card">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="font-semibold">Current Pipeline Stage</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Stage Progress</span>
                            <span className="font-semibold">{Math.round(getStageProgress(selectedProcess.status))}%</span>
                          </div>
                          <Progress value={getStageProgress(selectedProcess.status)} className="h-2" />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Current Stage:</p>
                              <p className="font-semibold">{selectedProcess.status}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Stage Number:</p>
                              <p className="font-semibold">
                                {(() => {
                                  const idx = processStages.indexOf(selectedProcess.status);
                                  return idx >= 0 ? `${idx + 1} of ${processStages.length}` : `0 of ${processStages.length}`;
                                })()}
                              </p>
                            </div>
                          </div>

                          {/* Stage dots */}
                          <div className="relative pt-8 pb-16">
                            <div className="flex justify-between items-start relative">
                              {processStages.map((stage, index) => {
                                const currentIdx = processStages.indexOf(selectedProcess.status);
                                const isCompleted = currentIdx >= 0 && index < currentIdx;
                                const isCurrent = index === currentIdx;
                                return (
                                  <div key={index} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                                    {index < processStages.length - 1 && (
                                      <div className={`absolute top-5 left-1/2 h-0.5 ${isCompleted ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} style={{ width: "100%", zIndex: 0 }} />
                                    )}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 ${isCurrent ? "bg-blue-500 text-white border-blue-600 shadow-lg"
                                      : isCompleted ? "bg-green-500 text-white border-green-600"
                                        : "bg-white dark:bg-gray-800 text-muted-foreground border-gray-300 dark:border-gray-600"
                                      }`}>
                                      {index + 1}
                                    </div>
                                    <div className="absolute top-12 text-center w-20">
                                      <p className={`text-[10px] leading-tight ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                        {stage.split(" ")[0]}
                                        {stage.split(" ").length > 1 && <><br />{stage.split(" ").slice(1).join(" ")}</>}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Initial Triage notices */}
                          {selectedProcess.status === "Initial Triage" && selectedProcess.stageStatus === "Pending" && (
                            <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-200 mb-1">Awaiting Approval</p>
                                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                    This process requires approval. Visit the <strong>Approvals</strong> tab to review.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {selectedProcess.status === "Initial Triage" && selectedProcess.stageStatus === "Approved" && (
                            <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                              <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-sm text-green-800 dark:text-green-200 mb-1">Stage Approved</p>
                                  <p className="text-xs text-green-700 dark:text-green-300">
                                    Initial Triage has been approved. The process will move to the next stage shortly.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </CardContent>
                    </Card>

                  </TabsContent>

                  {/* Technical Assessment */}
                  {shouldShowTechnicalAssessmentTab(selectedProcess) && (
                    <TabsContent value="technical" className="space-y-6 mt-4">
                      {isLoadingTechnicalAssessment ? (
                        <div className="flex flex-col items-center justify-center p-12">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                          <p className="text-muted-foreground">Loading technical assessment data...</p>
                        </div>
                      ) : hasTechnicalAssessmentData && technicalAssessmentData ? (
                        <Card className="bg-gradient-to-br from-cyan-50/30 dark:from-cyan-950/10 via-card to-card border-2 border-cyan-200/50 dark:border-cyan-800/30 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-cyan-50/50 dark:from-cyan-950/20 to-transparent border-b border-cyan-200/50 dark:border-cyan-800/30 pb-4">
                            <CardTitle className="text-xl font-bold flex items-center gap-3">
                              <div className="p-2.5 rounded-lg bg-cyan-500/10"><Rocket className="w-6 h-6 text-cyan-600 dark:text-cyan-400" /></div>
                              Technical Requirement and Assessment
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6 pt-6">
                            {technicalAssessmentData.DA_pddPath && (
                              <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm font-semibold text-muted-foreground uppercase">PDD Document</Label>
                                  <Button variant="outline" size="sm" disabled={isDownloadingPDD} className="gap-2"
                                    onClick={async () => {
                                      setIsDownloadingPDD(true);
                                      try {
                                        const pid = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
                                        const res = await apiCall(`/api/download-process-pdd/${pid}`, { method: "GET" });
                                        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
                                        const blob = await res.blob();
                                        const cd = res.headers.get("Content-Disposition") || "";
                                        const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                                        const fileName = match?.[1]?.replace(/['"]/g, "") || technicalAssessmentData.DA_pddPath?.split(/[/\\]/).pop() || "pdd_document";
                                        const url = URL.createObjectURL(blob);
                                        const a = Object.assign(document.createElement("a"), { href: url, download: fileName });
                                        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                                        toast({ title: "Download Successful" });
                                      } catch (err: any) {
                                        toast({ title: "Download Failed", description: err?.message, variant: "destructive" });
                                      } finally { setIsDownloadingPDD(false); }
                                    }}>
                                    {isDownloadingPDD ? <><Loader2 className="w-4 h-4 animate-spin" />Downloading...</> : <><Download className="w-4 h-4" />Download</>}
                                  </Button>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                  <p className="text-sm font-medium">{technicalAssessmentData.DA_pddPath.split(/[/\\]/).pop() || technicalAssessmentData.DA_pddPath}</p>
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {[
                                { label: "Infrastructure Ready", value: technicalAssessmentData.TA_infrastructure_ready != null ? (technicalAssessmentData.TA_infrastructure_ready ? "Yes" : "No") : null },
                                { label: "Bot Hosting Type", value: technicalAssessmentData.TA_bot_hosting_type },
                                { label: "Credential Vault Required", value: technicalAssessmentData.TA_credential_vault_required != null ? (technicalAssessmentData.TA_credential_vault_required ? "Yes" : "No") : null },
                                { label: "Risk Level", value: technicalAssessmentData.TA_risk_level },
                              ].filter(item => item.value).map(({ label, value }) => (
                                <div key={label} className="space-y-2">
                                  <Label className="text-sm font-semibold text-muted-foreground uppercase">{label}</Label>
                                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                    <p className="text-lg font-bold text-foreground">{value}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {technicalAssessmentData.TA_technical_comments && (
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-muted-foreground uppercase">Technical Comments</Label>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                  <p className="text-sm whitespace-pre-wrap">{technicalAssessmentData.TA_technical_comments}</p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="bg-card border-border">
                          <CardContent className="p-12 text-center">
                            <Rocket className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No technical assessment data available yet</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  )}

                  {/* Business Case — Automation Lead only */}
                  {shouldShowBusinessCaseTab(selectedProcess) && (
                    <TabsContent value="business-case" className="space-y-6 mt-4">
                      {isLoadingBusinessCase ? (
                        <div className="flex flex-col items-center justify-center p-12">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                          <p className="text-muted-foreground">Loading business case data...</p>
                        </div>
                      ) : hasBusinessCaseData && businessCaseData ? (
                        <Card className="bg-gradient-to-br from-emerald-50/30 dark:from-emerald-950/10 via-card to-card border-2 border-emerald-200/50 dark:border-emerald-800/30 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-emerald-50/50 dark:from-emerald-950/20 to-transparent border-b border-emerald-200/50 dark:border-emerald-800/30 pb-4">
                            <CardTitle className="text-xl font-bold flex items-center gap-3">
                              <div className="p-2.5 rounded-lg bg-emerald-500/10"><TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div>
                              Business Case
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {[
                                { label: "FTE Savings", value: businessCaseData.FteSavings, format: (v: number) => String(v) },
                                { label: "Cost Savings ($)", value: businessCaseData.CostSavings, format: (v: number) => `$${Number(v).toLocaleString()}`, className: "bg-success/10 border-success/30 text-success" },
                                { label: "Implementation Cost ($)", value: businessCaseData.ImplementationCost, format: (v: number) => `$${Number(v).toLocaleString()}` },
                                { label: "Payback Period (Months)", value: businessCaseData.PaybackMonths, format: (v: number) => String(v) },
                                { label: "ROI (%)", value: businessCaseData.RoiPercent, format: (v: number) => `${v}%`, className: "bg-primary/10 border-primary/30 text-primary" },
                              ].filter(item => item.value != null).map(({ label, value, format, className }) => (
                                <div key={label} className="space-y-2">
                                  <Label className="text-sm font-semibold text-muted-foreground uppercase">{label}</Label>
                                  <div className={`p-3 rounded-lg bg-muted/50 border border-border ${className ?? ""}`}>
                                    <p className="text-2xl font-bold">{format(value)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="bg-card border-border">
                          <CardContent className="p-12 text-center">
                            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No business case data available yet</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  )}
                </Tabs>

                {/* ── Sticky Footer Action Button ────────────────── */}
                {btn.show && (
                  <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t-2 border-border px-6 py-4 mt-6 -mx-6 -mb-6 flex items-center justify-between gap-4 z-10 rounded-b-lg">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className={`p-1.5 rounded-md ${selectedProcess.status === "Development" && devStartedExternal ? "bg-yellow-100 dark:bg-yellow-950/30" : "bg-muted"}`}>
                        {getStatusIcon(selectedProcess.status)}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{selectedProcess.status}</span>
                        {selectedProcess.status === "Development" && (
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${devStartedExternal ? "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400" : "bg-muted text-muted-foreground"}`}>
                            {devStartedExternal ? "In Progress" : "Not Started"}
                          </span>
                        )}
                        {selectedProcess.status === "QA" && (
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${qaStartedExternal ? "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400" : "bg-muted text-muted-foreground"}`}>
                            {qaStartedExternal ? "In Progress" : "Not Started"}
                          </span>
                        )}
                        {selectedProcess.status === "Hypercare" && (
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${hypercareStartedExternal ? "bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400" : "bg-muted text-muted-foreground"}`}>
                            {hypercareStartedExternal ? "In Progress" : "Not Started"}
                          </span>
                        )}
                        {selectedProcess.stageStatus && !["Development", "QA", "UAT"].includes(selectedProcess.status) && (
                          <Badge className={`ml-2 ${getStageStatusColor(selectedProcess.stageStatus)}`}>
                            {selectedProcess.stageStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleStageActionClick}
                      disabled={isActionLoading}
                      className={`shadow-lg gap-1 ${btn.color}`}
                    >
                      {isActionLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
                        : <>{btn.icon}{btn.label}</>
                      }
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          STAGE FORM DIALOG
      ═══════════════════════════════════════════════════════ */}
      <Dialog
        open={isStageFormOpen}
        onOpenChange={(open) => {
          setIsStageFormOpen(open);
          if (!open && selectedProcess) {
            const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
            if (!isNaN(numericId)) {
              window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId: numericId } }));
            }
          }
        }}
      >
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto" style={{ zIndex: 60 }}>
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline">{selectedProcess?.id}</Badge>
              {selectedProcess && (
                <>
                  <Badge className={getPriorityColor(selectedProcess.priority)}>{selectedProcess.priority}</Badge>
                  <Badge className={getStatusColor(selectedProcess.status)}>
                    {getStatusIcon(selectedProcess.status)}<span className="ml-1">{selectedProcess.status}</span>
                  </Badge>
                </>
              )}
            </div>
            <DialogTitle className="text-xl mt-2">{selectedProcess?.title}</DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">{selectedProcess?.status}</span> Stage Form — complete and submit to progress the pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {selectedProcess && (
              <ProcessStageForms
                selectedProcess={selectedProcess}
                triageData={triageData} setTriageData={setTriageData}
                rejectionReason={rejectionReason} setRejectionReason={setRejectionReason}
                isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting}
                sitData={sitData} setSitData={setSitData}
                getPriorityColor={getPriorityColor}
                formData={formData} setFormData={setFormData}
                currentStakeholder={currentStakeholder} setCurrentStakeholder={setCurrentStakeholder}
                currentTag={currentTag} setCurrentTag={setCurrentTag}
                dataSamplesUploaded={dataSamplesUploaded} setDataSamplesUploaded={setDataSamplesUploaded}
                sopDocumentUploaded={sopDocumentUploaded} setSopDocumentUploaded={setSopDocumentUploaded}
                departments={DEPARTMENTS}
                isNewProcessOpen={isNewProcessOpen} setIsNewProcessOpen={setIsNewProcessOpen}
                setIsStageFormOpen={setIsStageFormOpen}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}