import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Upload,
  FileText,
  Clock,
  Target,
  TrendingUp,
  Users,
  Building,
  CheckCircle,
  Check,
  PlayCircle,
  Link2,
  ArrowRight,
  Brain,
  Rocket,
  ClipboardList,
  CheckSquare,
  Map,
  DraftingCompass,
  Code,
  TestTube,
  UserCheck,
  Heart,
  Handshake,
  Shield,
  Lock,
  AlertTriangle,
  RotateCw,
  Info,
  Tag,
  Download,
  Pencil,
  Save,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AutomationRoadmap } from "@/components/AutomationRoadmap";
import { BusinessROICalculator } from "@/components/BusinessROICalculator";
import { ApprovalWorkflowBoard } from "@/components/ApprovalWorkflowBoard";
import { ProcessStageForms } from "@/components/ProcessStageForms";
import { toast } from "@/hooks/use-toast";
import {
  createProcessRegistration,
  createInitialTriage,
  createSystemIntegration,
  createToBeDesign,
  createApprovalStage,
  createDevelopmentStage,
  createUATStage,
  createGoLiveStage,
  createHypercareStage,
  createHandoverStage,
  updateStageTrackingCompleted,
  mapFrontendStageToBackend,
  getAllProcessesSummary,
  mapBackendStageToFrontend,
  getProcessDetail,
  getNextStage,
  updateProcessRegistration,
  updateInitialTriage,
  updateSystemIntegration,
  updateToBeDesign,
  updateApprovalStage,
  downloadSampleData,
  downloadSopDoc,
  downloadWorkflowDiagram,
  downloadExceptionHandlingPlan,
} from "@/services/processRegistrationApi";
import { API_BASE_URL } from "@/services/api";

/**
 * ✅ GOLDEN RULE: Map approval status STRICTLY from BIT flags only
 * DO NOT use fallback status strings (BO_approval_status, RPA_approval_status)
 * DO NOT use ApprovalNeedsReview for button completion
 * 
 * @param approvalBit - The BIT value from database (1/true = Approved, 0/false = Rejected, null/undefined = Pending)
 * @returns "Approved" | "Rejected" | "Pending"
 */
const mapApprovalStatus = (
  approvalBit: any
): "Approved" | "Rejected" | "Pending" => {
  if (approvalBit === 1 || approvalBit === true || approvalBit === "1") {
    return "Approved";
  }
  if (approvalBit === 0 || approvalBit === false || approvalBit === "0") {
    return "Rejected";
  }
  return "Pending";
};

type ProcessStage =
  | "Process Registration"
  | "Initial Triage"
  | "System Integration"
  | "To-Be Design"
  | "Approval"
  | "Development"
  | "User Acceptance Testing (HWF)"
  | "Go-Live & Deployment (HWF)"
  | "Hypercare & Stabilization (HWF)"
  | "Handover to BAU Support";

interface Process {
  id: string;
  title: string;
  description: string;
  department: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  expectedROI: number;
  status: ProcessStage;
  submittedBy: string;
  submittedDate: string;
  estimatedSavings: number;
  complexity: "Low" | "Medium" | "High";
  dependencies: string[];
  tags: string[];
  stakeholders: string[];
  registrationDocuments?: {
    dataSamples?: string; // File name/path
    sopDocument?: string; // File name/path
  };
  triageData?: {
    isRuleBased: boolean;
    isStable: boolean;
    volumes: string;
    systemsInvolved: string[];
    applicationsCount: number;
    blockers: string[];
    estimatedAutomationPercent: number;
    initialROI: string;
    feasibilityStatus: "Feasible" | "Not Feasible" | "Review Required";
    triageNotes: string;
  };
  approvalData?: {
    businessOwnerApproval: "Approved" | "Rejected" | "Pending";
    rpaCoEApproval: "Approved" | "Rejected" | "Pending";
    comments?: {
      businessOwner: string;
      rpaCoE: string;
    };
    approvalNeedsReview?: boolean;
  };
  securityAssessment?: {
    securityReviewCompleted: boolean;
    dataPrivacyCompliant: boolean;
    systemAccessApproved: boolean;
    networkSecurityVerified: boolean;
    complianceRequirementsMet: boolean;
    riskAssessmentCompleted: boolean;
  };
  risks?: Array<{
    id: string;
    riskName: string;
    mitigation: string;
    riskLevel: "Low" | "Medium" | "High";
  }>;
  timelineDates?: {
    discoveryStartDate: string;
    developmentStartDate: string;
    testingStartDate: string;
    uatStartDate: string;
    goLiveDate: string;
    stabilizationDate: string;
  };
  toBeDesignData?: {
    workflowDiagram: string; // File path/name (for display)
    workflowDiagramFile?: File; // File object (for upload)
    exceptionHandlingPlan: string; // File path/name (for display)
    exceptionHandlingPlanFile?: File; // File object (for upload)
    retryMechanismRequired: boolean;
    retryMechanismDetails: string;
    credentialRequirements: string;
    vmInfraNeeded: string;
    orchestratorQueuesRequired: boolean;
    loggingRequirements: string;
    sddDocument: string; // File path/name
    sddApprovalStatus: "Approved" | "Pending";
  };
  developmentData?: {
    developmentStartDate: string;
    devVmAccessProvided: boolean;
    applicationsAccessCompleted: boolean;
    workflowDevelopmentStatus: number; // 0-100%
    configFileProvided: boolean;
    exceptionHandlingImplemented: boolean;
    loggingImplemented: boolean;
    unitTestingCompleted: boolean;
    codeReviewStatus: "Approved" | "Pending";
    gitRepoOrBotPackage: string; // File path or URL
    developerNotes: string;
  };
  sitData?: {
    testNotes: string;
    credentialRequirements: string;
  };
}

const processStages: ProcessStage[] = [
  "Process Registration",
  "Initial Triage",
  "System Integration",
  "To-Be Design",
  "Approval",
  "Development",
  "User Acceptance Testing (HWF)",
  "Go-Live & Deployment (HWF)",
  "Hypercare & Stabilization (HWF)",
  "Handover to BAU Support",
];

// Helper function to validate and normalize stage names
const validateAndNormalizeStage = (
  stage: string | null | undefined
): ProcessStage => {
  if (!stage) return "Process Registration";

  const mappedStage = mapBackendStageToFrontend(stage);

  // Check if mapped stage exists in processStages array
  if (processStages.indexOf(mappedStage as ProcessStage) !== -1) {
    return mappedStage as ProcessStage;
  }

  // Try to find a partial match
  const partialMatch = processStages.find(
    (s) =>
      s.toLowerCase().includes(mappedStage.toLowerCase()) ||
      mappedStage.toLowerCase().includes(s.toLowerCase())
  );

  if (partialMatch) {
    return partialMatch;
  }

  return "Process Registration";
};

const dummyProcesses: Process[] = [];

const departments = [
  "All",
  "Finance",
  "HR",
  "Operations",
  "IT",
  "Legal",
  "Marketing",
  "Sales",
];
const statusOptions = ["All", ...processStages];
const priorityOptions = ["All", "Low", "Medium", "High", "Critical"];

const getStatusColor = (status: ProcessStage) => {
  const stageIndex = processStages.indexOf(status);
  if (stageIndex === -1) return "bg-muted text-muted-foreground";

  // Special case for final stage - make it more prominent
  if (status === "Handover to BAU Support") {
    return "bg-green-500 text-white border-green-600 font-semibold";
  }

  // Early stages (1-3): Blue tones
  if (stageIndex < 3) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  // Planning stages (4-5): Yellow/Warning tones
  if (stageIndex < 5)
    return "bg-warning/20 text-warning-foreground border-warning/30";
  // Development stages (6-7): Primary tones
  if (stageIndex < 7)
    return "bg-primary/20 text-primary-foreground border-primary/30";
  // Testing stages (8): Orange tones
  if (stageIndex < 8)
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  // Deployment stages (9): Green/Success tones
  return "bg-green-500/20 text-green-600 border-green-500/30 font-medium";
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Low":
      return "bg-muted text-muted-foreground";
    case "Medium":
      return "bg-warning/20 text-warning-foreground border-warning/30";
    case "High":
      return "bg-destructive/20 text-destructive-foreground border-destructive/30";
    case "Critical":
      return "bg-gradient-danger text-white border-destructive shadow-glow";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusIcon = (status: ProcessStage) => {
  switch (status) {
    case "Process Registration":
      return <Brain className="w-4 h-4" />;
    case "Initial Triage":
      return <ClipboardList className="w-4 h-4" />;
    case "Approval":
      return <CheckSquare className="w-4 h-4" />;
    case "To-Be Design":
      return <DraftingCompass className="w-4 h-4" />;
    case "Development":
      return <Code className="w-4 h-4" />;
    case "System Integration":
      return <TestTube className="w-4 h-4" />;
    case "User Acceptance Testing (HWF)":
      return <UserCheck className="w-4 h-4" />;
    case "Go-Live & Deployment (HWF)":
      return <Rocket className="w-4 h-4" />;
    case "Hypercare & Stabilization (HWF)":
      return <Heart className="w-4 h-4" />;
    case "Handover to BAU Support":
      return <Handshake className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getStageProgress = (status: ProcessStage): number => {
  if (!status) return 0;
  const stageIndex = processStages.indexOf(status);
  if (stageIndex === -1) {
    return 0;
  }
  return ((stageIndex + 1) / processStages.length) * 100;
};

// Helper functions to extract values with multiple fallback options (handles PascalCase, snake_case, etc.)
const getValue = <T,>(obj: any, ...keys: string[]): T | undefined => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) {
      return obj[key] as T;
    }
  }
  return undefined;
};

const getValueWithDefault = <T,>(
  obj: any,
  defaultValue: T,
  ...keys: string[]
): T => {
  return getValue<T>(obj, ...keys) ?? defaultValue;
};

const parseStringArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
  }
  return [];
};

// Helper function to parse date strings from database (handles timezone correctly)
// Database GETDATE() returns server local time, but we format as UTC in backend
const parseDateString = (dateStr: string | null | undefined): string => {
  if (!dateStr) {
    return "";
  }

  try {
    const str = String(dateStr).trim();
    if (!str || str === "null" || str === "undefined" || str === "") {
      return "";
    }

    if (
      str.includes("Z") ||
      str.includes("+") ||
      (str.includes("-") && str.length > 10)
    ) {
      const date = new Date(str);
      if (isNaN(date.getTime())) {
        return "";
      }
      return date.toISOString();
    }

    let date: Date | null = null;

    try {
      date = new Date(str + "Z");
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (e) {
      // Continue to next format
    }

    try {
      date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (e) {
      // Continue to next format
    }

    const sqlFormat = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}(?:\.\d+)?)$/;
    const match = str.match(sqlFormat);
    if (match) {
      try {
        date = new Date(match[1] + "T" + match[2] + "Z");
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (e) {
        // Continue
      }
    }

    return "";
  } catch (e) {
    return "";
  }
};

// Helper function to format date for display (uses UTC to match database)
const formatDateForDisplay = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid date";
    // Display in UTC timezone to match database GETDATE() values
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch (e) {
    return "Invalid date";
  }
};

// Helper function to check if a stage has been completed
const isStageCompleted = (
  currentStatus: ProcessStage,
  stageToCheck: ProcessStage
): boolean => {
  const currentIndex = processStages.indexOf(currentStatus);
  const checkIndex = processStages.indexOf(stageToCheck);

  // If either stage is not found, return false
  if (currentIndex === -1 || checkIndex === -1) return false;

  // Stage is completed if current status is after the stage to check
  return currentIndex > checkIndex;
};

// Helper function to format stage name for pipeline display
const getStageDisplayName = (stage: ProcessStage): string => {
  if (stage === "Development") {
    return "Development (HWF)";
  }
  return stage;
};

// Helper function to abbreviate stage name for display (shows first 2 words)
const getAbbreviatedStageName = (stage: ProcessStage): string => {
  const fullName = getStageDisplayName(stage);
  const words = fullName.split(" ");
  // Show first 2 words, or full name if 2 words or less
  if (words.length <= 2) {
    return fullName;
  }
  return words.slice(0, 2).join(" ");
};

// Helper function to get stage message
const getStageMessage = (
  stage: ProcessStage
): { title: string; description: string; icon: any } => {
  switch (stage) {
    case "Development":
      return {
        title: "Process is now in the Development phase.",
        description: "The bot is currently being developed and configured",
        icon: Code,
      };
    case "User Acceptance Testing (HWF)":
      return {
        title: "Process is now in the User Acceptance Testing phase.",
        description: "The bot is currently undergoing user acceptance testing",
        icon: UserCheck,
      };
    case "Go-Live & Deployment (HWF)":
      return {
        title: "Process is now in the Go-Live & Deployment phase.",
        description: "The bot is being deployed and prepared for go-live",
        icon: Rocket,
      };
    case "Hypercare & Stabilization (HWF)":
      return {
        title: "Process is now in the Hypercare & Stabilization phase.",
        description:
          "The bot is in hypercare period with intensive monitoring and support",
        icon: Heart,
      };
    case "Handover to BAU Support":
      return {
        title: "Process is now in the Handover to BAU Support phase.",
        description:
          "The bot is being handed over to Business As Usual support",
        icon: Handshake,
      };
    default:
      return {
        title: `Process is now in the ${stage} phase.`,
        description: `The process is currently in ${stage}`,
        icon: FileText,
      };
  }
};

export default function CenterOfExcellence() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(true);
  const [nextStage, setNextStage] = useState<string | null>(null);
  const [isLoadingProcessDetail, setIsLoadingProcessDetail] = useState(false);
  const [isMovingToNextStage, setIsMovingToNextStage] = useState(false);
  // Track which file type is currently downloading
  const [downloadingFileType, setDownloadingFileType] = useState<string | null>(null);
  // Track if tab was set by handleProcessClick to prevent useEffect from overriding
  const tabSetByHandleClick = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [isNewProcessOpen, setIsNewProcessOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("processes");
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isProcessDetailsOpen, setIsProcessDetailsOpen] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState<string>("overview");
  const [activeOverviewTab, setActiveOverviewTab] =
    useState<string>("basic-info");
  const [newProcessId, setNewProcessId] = useState<string>("");
  const [dataSamplesUploaded, setDataSamplesUploaded] = useState(false);
  const [sopDocumentUploaded, setSopDocumentUploaded] = useState(false);
  const [dataSamplesFileName, setDataSamplesFileName] = useState<string>("");
  const [sopDocumentFileName, setSopDocumentFileName] = useState<string>("");
  const [isSubmittingProcess, setIsSubmittingProcess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    description: "",
    priority: "" as "Low" | "Medium" | "High" | "Critical" | "",
    expectedROI: "",
    stakeholders: [] as string[],
    tags: [] as string[],
  });
  const [currentStakeholder, setCurrentStakeholder] = useState("");
  const [currentTag, setCurrentTag] = useState("");
  const [triageData, setTriageData] = useState<{
    isRuleBased: boolean | undefined;
    isStable: boolean | undefined;
    volumes: string;
    volumesCaptured: boolean;
    systemsInvolved: string[];
    systemsIdentified: boolean;
    applicationsCount: number;
    blockers: string[];
    blockersIdentified: boolean;
    estimatedAutomationPercent: number;
    initialROI: string;
    roiEstimated: boolean;
    feasibilityStatus:
      | "Feasible"
      | "Not Feasible"
      | "Review Required"
      | undefined;
    feasibilityApproved: boolean;
    triageNotes: string;
  }>({
    isRuleBased: undefined,
    isStable: undefined,
    volumes: "",
    volumesCaptured: false,
    systemsInvolved: [],
    systemsIdentified: false,
    applicationsCount: 0,
    blockers: [],
    blockersIdentified: false,
    estimatedAutomationPercent: 0,
    initialROI: "",
    roiEstimated: false,
    feasibilityStatus: undefined,
    feasibilityApproved: false,
    triageNotes: "",
  });
  const [approvalData, setApprovalData] = useState<{
    businessOwnerApproval: "Approved" | "Rejected" | "Pending" | undefined;
    rpaCoEApproval: "Approved" | "Rejected" | "Pending" | undefined;
  }>({
    businessOwnerApproval: undefined,
    rpaCoEApproval: undefined,
  });
  const [openApprovalDialog, setOpenApprovalDialog] = useState<string | null>(
    null
  );
  const [approvalComments, setApprovalComments] = useState({
    businessOwner: "",
    rpaCoE: "",
  });
  const [
    isSubmittingBusinessOwnerApproval,
    setIsSubmittingBusinessOwnerApproval,
  ] = useState(false);
  const [isSubmittingRpaCoEApproval, setIsSubmittingRpaCoEApproval] =
    useState(false);
  const [itInfoSecAssessment, setItInfoSecAssessment] = useState({
    securityReviewCompleted: false,
    dataPrivacyCompliant: false,
    systemAccessApproved: false,
    networkSecurityVerified: false,
    complianceRequirementsMet: false,
    riskAssessmentCompleted: false,
  });
  const [risks, setRisks] = useState<
    Array<{
      id: string;
      riskName: string;
      mitigation: string;
      riskLevel: "Low" | "Medium" | "High";
    }>
  >([]);
  const [timelineDates, setTimelineDates] = useState({
    discoveryStartDate: "",
    developmentStartDate: "",
    testingStartDate: "",
    uatStartDate: "",
    goLiveDate: "",
    stabilizationDate: "",
  });
  const [toBeDesignData, setToBeDesignData] = useState<{
    workflowDiagram: string;
    workflowDiagramFile?: File; // File object (for upload)
    exceptionHandlingPlan: string;
    exceptionHandlingPlanFile?: File; // File object (for upload)
    retryMechanismRequired: boolean;
    retryMechanismDetails: string;
    credentialRequirements: string;
    vmInfraNeeded: string;
    orchestratorQueuesRequired: boolean;
    loggingRequirements: string;
    sddDocument: string;
    sddApprovalStatus: "Approved" | "Pending" | undefined;
  }>({
    workflowDiagram: "",
    exceptionHandlingPlan: "",
    retryMechanismRequired: false,
    retryMechanismDetails: "",
    credentialRequirements: "",
    vmInfraNeeded: "",
    orchestratorQueuesRequired: false,
    loggingRequirements: "",
    sddDocument: "",
    sddApprovalStatus: undefined,
  });
  const [developmentData, setDevelopmentData] = useState<{
    developmentStartDate: string;
    devVmAccessProvided: boolean;
    applicationsAccessCompleted: boolean;
    workflowDevelopmentStatus: number;
    configFileProvided: boolean;
    exceptionHandlingImplemented: boolean;
    loggingImplemented: boolean;
    unitTestingCompleted: boolean;
    codeReviewStatus: "Approved" | "Pending" | undefined;
    gitRepoOrBotPackage: string;
    developerNotes: string;
  }>({
    developmentStartDate: "",
    devVmAccessProvided: false,
    applicationsAccessCompleted: false,
    workflowDevelopmentStatus: 0,
    configFileProvided: false,
    exceptionHandlingImplemented: false,
    loggingImplemented: false,
    unitTestingCompleted: false,
    codeReviewStatus: undefined,
    gitRepoOrBotPackage: "",
    developerNotes: "",
  });
  const [sitData, setSitData] = useState({
    testNotes: "",
    credentialRequirements: "",
  });

  // Edit states for overview tabs
  const [isEditingProcessRegistration, setIsEditingProcessRegistration] =
    useState(false);
  const [isEditingInitialTriage, setIsEditingInitialTriage] = useState(false);
  const [isEditingSystemIntegration, setIsEditingSystemIntegration] =
    useState(false);
  const [isEditingToBeDesign, setIsEditingToBeDesign] = useState(false);

  // Edit form data states
  const [editProcessRegistrationData, setEditProcessRegistrationData] =
    useState({
      Title: "",
      Description: "",
      Priority: "" as "Low" | "Medium" | "High" | "Critical" | "",
      ExpectedROI: "",
      Stakeholder: "",
      Tag: "",
      Department: "",
      SampledataPath: "",
      SopDoc: "",
    });

  const [editInitialTriageData, setEditInitialTriageData] = useState({
    IsRuleBased: undefined as boolean | undefined,
    IsStable: undefined as boolean | undefined,
    SystemsInvolved: "",
    Blockers: "",
    EstimatedAutomationPercent: "",
  });

  const [editSystemIntegrationData, setEditSystemIntegrationData] = useState({
    Credentials: "",
    Notes: "",
  });

  const [editToBeDesignData, setEditToBeDesignData] = useState<{
    D_id?: number;
    WorkflowFile?: string; // Filename only (for display)
    WorkflowFilePath?: string; // Full path (for reference)
    ExceptionFile?: string; // Filename only (for display)
    ExceptionFilePath?: string; // Full path (for reference)
    Credentials?: string;
    VirtualMachine?: string;
    LoggingInfo?: string;
    LoggingRequirements?: string;
  }>({
    WorkflowFile: "",
    WorkflowFilePath: "",
    ExceptionFile: "",
    ExceptionFilePath: "",
    Credentials: "",
    VirtualMachine: "",
    LoggingInfo: "",
  });

  // Store File objects separately for upload
  const [editWorkflowFileObject, setEditWorkflowFileObject] = useState<File | null>(null);
  const [editExceptionFileObject, setEditExceptionFileObject] = useState<File | null>(null);

  // Filter processes based on search and filters
  const filteredProcesses = processes.filter((process) => {
    const matchesSearch =
      process.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === "All" || process.department === departmentFilter;
    const matchesStatus =
      statusFilter === "All" || process.status === statusFilter;
    const matchesPriority =
      priorityFilter === "All" || process.priority === priorityFilter;

    return (
      matchesSearch && matchesDepartment && matchesStatus && matchesPriority
    );
  });

  // Stats calculations
  const totalROI = processes.reduce((sum, p) => sum + p.expectedROI, 0);
  const totalSavings = processes.reduce(
    (sum, p) => sum + p.estimatedSavings,
    0
  );
  const deployedCount = processes.filter(
    (p) =>
      p.status === "Go-Live & Deployment (HWF)" ||
      p.status === "Hypercare & Stabilization (HWF)" ||
      p.status === "Handover to BAU Support"
  ).length;
  const inDevelopmentCount = processes.filter(
    (p) =>
      p.status === "Development" ||
      p.status === "System Integration" ||
      p.status === "User Acceptance Testing (HWF)"
  ).length;

  const generateProcessId = () => {
    const nextId = `P${String(processes.length + 1).padStart(3, "0")}`;
    setNewProcessId(nextId);
    return nextId;
  };

  const handleWorkflowDiagramUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      try {
        // Upload file to server
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch(`${API_BASE_URL}/api/process-registration/upload-file`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Upload failed" }));
          throw new Error(errorData.message || "File upload failed");
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Store BOTH the file path AND the File object
          setToBeDesignData(prev => ({
            ...prev,
            workflowDiagram: result.filePath, // Store the server path
            workflowDiagramFile: file // Store the File object for later use
          }));
          
          toast({
            title: "Workflow Diagram Uploaded",
            description: "File uploaded successfully.",
          });
        } else {
          throw new Error(result.message || "Upload failed");
        }
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleExceptionHandlingUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      try {
        // Upload file to server
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch(`${API_BASE_URL}/api/process-registration/upload-file`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Upload failed" }));
          throw new Error(errorData.message || "File upload failed");
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Store BOTH the file path AND the File object
          setToBeDesignData(prev => ({
            ...prev,
            exceptionHandlingPlan: result.filePath, // Store the server path
            exceptionHandlingPlanFile: file // Store the File object for later use
          }));
          
          toast({
            title: "Exception Handling Plan Uploaded",
            description: "File uploaded successfully.",
          });
        } else {
          throw new Error(result.message || "Upload failed");
        }
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNewProcess = async () => {
    if (isSubmittingProcess) return; // Prevent multiple submissions

    try {
      setIsSubmittingProcess(true);

      // Validate required fields
      if (
        !formData.title ||
        !formData.department ||
        !formData.description ||
        !formData.priority
      ) {
        setIsSubmittingProcess(false);
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Helper function to get MIME type from file name
      const getMimeType = (fileName: string): string => {
        const ext = fileName.split(".").pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
          pdf: "application/pdf",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xls: "application/vnd.ms-excel",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          csv: "text/csv",
        };
        return mimeTypes[ext || ""] || "application/octet-stream";
      };

      // Prepare API data
      const apiData: {
        Title: string;
        Description?: string;
        Priority?: string;
        ExpectedROI?: number;
        Stakeholder?: string;
        Tag?: string;
        SampledataPath?: string;
        MimeType?: string;
        SopDoc?: string;
        SopMimetype?: string;
        Department?: string; // ✅ NEW PARAMETER
      } = {
        Title: formData.title,
        Description: formData.description || undefined,
        Priority: formData.priority || undefined,
        ExpectedROI: formData.expectedROI
          ? parseInt(formData.expectedROI)
          : undefined,
        Stakeholder:
          formData.stakeholders.length > 0
            ? formData.stakeholders.join(", ")
            : undefined,
        Tag: formData.tags.length > 0 ? formData.tags.join(", ") : undefined,
        Department: formData.department || undefined, // ✅ NEW PARAMETER
      };

      // Add file paths and MIME types if files were uploaded
      if (dataSamplesFileName && dataSamplesFileName.trim() !== '') {
        apiData.SampledataPath = dataSamplesFileName.trim();
        apiData.MimeType = getMimeType(dataSamplesFileName);
      }

      if (sopDocumentFileName && sopDocumentFileName.trim() !== '') {
        apiData.SopDoc = sopDocumentFileName.trim();
        apiData.SopMimetype = getMimeType(sopDocumentFileName);
      }

      // Call API - check if edit mode
      let response;
      if (isEditMode && editingProcessId) {
        // Update mode
        const processId = parseInt(editingProcessId.replace("P", ""));
        response = await updateProcessRegistration(processId, apiData);
      } else {
        // Insert mode
        response = await createProcessRegistration(apiData);
      }

      if (response.success) {
        if (isEditMode && editingProcessId) {
          // Update mode - refresh process details
          const processId = parseInt(editingProcessId.replace("P", ""));
          toast({
            title: "Success",
            description:
              response.message || "Process registration updated successfully",
          });

          // Refresh process details
          const detailResponse = await getProcessDetail(processId);
          if (detailResponse.success && detailResponse.process) {
            const backendProcess = detailResponse.process;
            const frontendStage = mapBackendStageToFrontend(
              detailResponse.currentStage || backendProcess.CurrentStage || null
            );
            // Update selected process with new data
            const updatedProcess: Process = {
              ...selectedProcess!,
              title:
                response.process?.Title ||
                backendProcess.Title ||
                selectedProcess!.title,
              description:
                response.process?.Description ||
                backendProcess.Description ||
                selectedProcess!.description,
              priority: (response.process?.Priority ||
                backendProcess.Priority ||
                selectedProcess!.priority) as
                | "Low"
                | "Medium"
                | "High"
                | "Critical",
              expectedROI:
                response.process?.ExpectedROI ??
                backendProcess.ExpectedROI ??
                selectedProcess!.expectedROI,
              department:
                response.process?.Department ||
                backendProcess.Department ||
                selectedProcess!.department,
              stakeholders: backendProcess.Stakeholder
                ? typeof backendProcess.Stakeholder === "string"
                  ? [backendProcess.Stakeholder]
                  : Array.isArray(backendProcess.Stakeholder)
                  ? backendProcess.Stakeholder
                  : []
                : selectedProcess!.stakeholders,
              tags: backendProcess.Tag
                ? [backendProcess.Tag]
                : selectedProcess!.tags,
            };
            setSelectedProcess(updatedProcess);
            // Also update in processes list
            setProcesses((prevProcesses) =>
              prevProcesses.map((p) =>
                p.id === editingProcessId ? updatedProcess : p
              )
            );
          }

          // Reset edit mode
          setIsEditMode(false);
          setEditingProcessId(null);
        } else if (response.process) {
          // Insert mode
          const backendProcess = response.process;

          // Map backend response to get process ID for notification
          const processId = `P${String(
            backendProcess.P_id || backendProcess.p_id
          ).padStart(3, "0")}`;

          // Refresh the processes list from API FIRST (before showing notification)
          try {
            const refreshResponse = await getAllProcessesSummary();
            if (refreshResponse.success && refreshResponse.processes) {
              const mappedProcesses: Process[] = refreshResponse.processes.map(
                (p: any) => {
                  const frontendStage = validateAndNormalizeStage(
                    p.CurrentStage
                  );
                  const processId = `P${String(p.ProcessId).padStart(3, "0")}`;
                  return {
                    id: processId,
                    title: p.Title || "",
                    description: p.Description || "",
                    department: p.Department || p.Tag || "", // ✅ Use Department field, fallback to Tag for backward compatibility
                    priority: (p.Priority || "Medium") as
                      | "Low"
                      | "Medium"
                      | "High"
                      | "Critical", // Priority is required
                    expectedROI: p.ExpectedROI ?? 0,
                    status: frontendStage as ProcessStage,
                    submittedBy: p.CreatedByName || "",
                    submittedDate: (() => {
                      // Check multiple possible field name variations
                      const dateValue =
                        p.CreatedAt ||
                        p.createdAt ||
                        p.Created_At ||
                        p.created_at ||
                        p.CreatedDate ||
                        p.createdDate;
                      return parseDateString(dateValue);
                    })(),
                    estimatedSavings: p.EstimatedSavings ?? 0, // Use from DB if available
                    complexity: (p.Complexity || "Medium") as
                      | "Low"
                      | "Medium"
                      | "High", // Use from DB if available
                    dependencies: p.Dependencies
                      ? typeof p.Dependencies === "string"
                        ? p.Dependencies.split(",")
                            .map((d) => d.trim())
                            .filter((d) => d)
                        : p.Dependencies
                      : [],
                    tags: p.Tag ? [p.Tag] : [],
                    stakeholders: p.Stakeholder
                      ? typeof p.Stakeholder === "string"
                        ? [p.Stakeholder]
                        : Array.isArray(p.Stakeholder)
                        ? p.Stakeholder
                        : []
                      : [],
                  };
                }
              );
              setProcesses(mappedProcesses);

              // Show success notification ONLY after refresh completes successfully
              toast({
                title: "Process Registration Complete! ✅",
                description: `Process ${processId} has been registered`,
              });
            } else {
              // If refresh fails, still show success but with a note
              toast({
                title: "Process Registration Complete! ✅",
                description: `Process ${processId} has been registered. Refreshing process list...`,
              });
            }
          } catch (error) {
            // Show success notification even if refresh fails (process was saved)
            toast({
              title: "Process Registration Complete! ✅",
              description: `Process ${processId} has been registered`,
            });
          }
        }

        // Reset form
        setIsNewProcessOpen(false);
        setIsEditMode(false);
        setEditingProcessId(null);
        setDataSamplesUploaded(false);
        setSopDocumentUploaded(false);
        setDataSamplesFileName("");
        setSopDocumentFileName("");
        setNewProcessId("");
        setCurrentStakeholder("");
        setCurrentTag("");
        setFormData({
          title: "",
          department: "",
          description: "",
          priority: "",
          expectedROI: "",
          stakeholders: [],
          tags: [],
        });
        // Reset all stage-related state (only for new process creation)
        setTriageData({
          isRuleBased: undefined,
          isStable: undefined,
          volumes: "",
          volumesCaptured: false,
          systemsInvolved: [],
          systemsIdentified: false,
          applicationsCount: 0,
          blockers: [],
          blockersIdentified: false,
          estimatedAutomationPercent: 0,
          initialROI: "",
          roiEstimated: false,
          feasibilityStatus: undefined,
          feasibilityApproved: false,
          triageNotes: "",
        });
        setSitData({
          testNotes: "",
          credentialRequirements: "",
        });
        setToBeDesignData({
          workflowDiagram: "",
          workflowDiagramFile: undefined,
          exceptionHandlingPlan: "",
          exceptionHandlingPlanFile: undefined,
          retryMechanismRequired: false,
          retryMechanismDetails: "",
          credentialRequirements: "",
          vmInfraNeeded: "",
          orchestratorQueuesRequired: false,
          loggingRequirements: "",
          sddDocument: "",
          sddApprovalStatus: undefined,
        });
        setApprovalData({
          businessOwnerApproval: undefined,
          rpaCoEApproval: undefined,
        });
        setApprovalComments({
          businessOwner: "",
          rpaCoE: "",
        });
        setDevelopmentData({
          developmentStartDate: "",
          devVmAccessProvided: false,
          applicationsAccessCompleted: false,
          workflowDevelopmentStatus: 0,
          configFileProvided: false,
          exceptionHandlingImplemented: false,
          loggingImplemented: false,
          unitTestingCompleted: false,
          codeReviewStatus: undefined,
          gitRepoOrBotPackage: "",
          developerNotes: "",
        });
        setItInfoSecAssessment({
          securityReviewCompleted: false,
          dataPrivacyCompliant: false,
          systemAccessApproved: false,
          networkSecurityVerified: false,
          complianceRequirementsMet: false,
          riskAssessmentCompleted: false,
        });
        setRisks([]);
        setTimelineDates({
          discoveryStartDate: "",
          developmentStartDate: "",
          testingStartDate: "",
          uatStartDate: "",
          goLiveDate: "",
          stabilizationDate: "",
        });
      } else {
        throw new Error(response.message || "Failed to register process");
      }
    } catch (error: any) {
      
      // Check if it's a connection error
      const errorMessage = error.message || "";
      const isConnectionError = 
        errorMessage.includes("Cannot connect to backend") ||
        errorMessage.includes("ERR_CONNECTION_REFUSED") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError");
      
      toast({
        title: isConnectionError ? "Backend Server Not Running" : "Registration Failed",
        description: isConnectionError
          ? "Cannot connect to the backend server. Please ensure the backend server is running on https://basic-vivyan-vivek1902-64809d2b.koyeb.app/"
          : (error.message || "An error occurred while registering the process. Please try again."),
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsSubmittingProcess(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const fileName = file.name;
      
      try {
        // Upload file to server
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch(`${API_BASE_URL}/api/process-registration/upload-file`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Upload failed" }));
          throw new Error(errorData.message || "File upload failed");
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Store the file path returned from server (not just filename)
          setDataSamplesUploaded(true);
          setDataSamplesFileName(result.filePath); // Store the full relative path
          toast({
            title: "Data Samples Uploaded",
            description: "File uploaded successfully.",
          });
        } else {
          throw new Error(result.message || "Upload failed");
        }
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSOPUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const fileName = file.name;
      
      try {
        // Upload file to server
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch(`${API_BASE_URL}/api/process-registration/upload-file`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Upload failed" }));
          throw new Error(errorData.message || "File upload failed");
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Store the file path returned from server (not just filename)
          setSopDocumentUploaded(true);
          setSopDocumentFileName(result.filePath); // Store the full relative path
          toast({
            title: "SOP Document Uploaded",
            description: "File uploaded successfully.",
          });
        } else {
          throw new Error(result.message || "Upload failed");
        }
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Update handler functions for overview tabs
  const handleUpdateProcessRegistration = async () => {
    if (!selectedProcess) return;

    try {
      const processId = parseInt(selectedProcess.id.replace("P", ""));
      const response = await updateProcessRegistration(processId, {
        Title: editProcessRegistrationData.Title,
        Description: editProcessRegistrationData.Description || undefined,
        Priority: editProcessRegistrationData.Priority || undefined,
        ExpectedROI: editProcessRegistrationData.ExpectedROI
          ? parseFloat(editProcessRegistrationData.ExpectedROI)
          : undefined,
        Stakeholder: editProcessRegistrationData.Stakeholder || undefined,
        Tag: editProcessRegistrationData.Tag || undefined,
        Department: editProcessRegistrationData.Department || undefined,
      });

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message || "Process registration updated successfully",
        });
        setIsEditingProcessRegistration(false);
        // Refresh process details
        const detailResponse = await getProcessDetail(processId);
        if (detailResponse.success && detailResponse.process) {
          const backendProcess = detailResponse.process;
          const stages = detailResponse.stages || {};
          const approval = stages.approval;
          const frontendStage = mapBackendStageToFrontend(
            detailResponse.currentStage || backendProcess.CurrentStage || null
          );
          
          // Update approval data with approvalNeedsReview flag
          // CRITICAL: Since we just updated Process Registration, always set approvalNeedsReview = true
          // ✅ FIXED: Use mapApprovalStatus helper - ONLY check BIT flags, NO fallback to status strings
          const updatedApprovalData = approval
            ? {
                businessOwnerApproval: mapApprovalStatus(approval.BusinessOwnerApproval),
                rpaCoEApproval: mapApprovalStatus(approval.RPA_Approval),
                comments: {
                  businessOwner:
                    approval.BO_ApprovalNote ??
                    approval.bo_approval_note ??
                    approval.BO_Approval_Note ??
                    approval.BusinessOwnerApprovalNote ??
                    approval.business_owner_approval_note ??
                    "",
                  rpaCoE:
                    approval.RPA_ApprovalNote ??
                    approval.rpa_approval_note ??
                    approval.RPA_Approval_Note ??
                    approval.RPAApprovalNote ??
                    "",
                },
                // Read from backend, but default to true if not set (since we just updated Process Registration)
                approvalNeedsReview:
                  approval.ApprovalNeedsReview === 1 ||
                  approval.ApprovalNeedsReview === true ||
                  approval.approvalNeedsReview === 1 ||
                  approval.approvalNeedsReview === true ||
                  approval.approval_needs_review === 1 ||
                  true, // Default to true when updating Process Registration
              }
            : {
                // If approval is null but we just updated Process Registration, set approvalNeedsReview = true
                // This handles the case where ApprovalStage was just created but not yet returned by the SP
                businessOwnerApproval: (selectedProcess.approvalData?.businessOwnerApproval || "Pending") as "Approved" | "Rejected" | "Pending",
                rpaCoEApproval: (selectedProcess.approvalData?.rpaCoEApproval || "Pending") as "Approved" | "Rejected" | "Pending",
                comments: {
                  businessOwner: selectedProcess.approvalData?.comments?.businessOwner || "",
                  rpaCoE: selectedProcess.approvalData?.comments?.rpaCoE || "",
                },
                approvalNeedsReview: true, // Since we just updated Process Registration, approval needs review
              };
          
          
          // Update selected process with new data
          const updatedProcess: Process = {
            ...selectedProcess,
            title:
              response.process?.Title ||
              backendProcess.Title ||
              selectedProcess.title,
            description:
              response.process?.Description ||
              backendProcess.Description ||
              selectedProcess.description,
            priority: (response.process?.Priority ||
              backendProcess.Priority ||
              selectedProcess.priority) as
              | "Low"
              | "Medium"
              | "High"
              | "Critical",
            expectedROI:
              response.process?.ExpectedROI ??
              backendProcess.ExpectedROI ??
              selectedProcess.expectedROI,
            department:
              response.process?.Department ||
              backendProcess.Department ||
              selectedProcess.department,
            stakeholders: backendProcess.Stakeholder
              ? typeof backendProcess.Stakeholder === "string"
                ? [backendProcess.Stakeholder]
                : Array.isArray(backendProcess.Stakeholder)
                ? backendProcess.Stakeholder
                : []
              : selectedProcess.stakeholders,
            tags: backendProcess.Tag
              ? [backendProcess.Tag]
              : selectedProcess.tags,
            approvalData: updatedApprovalData,
          };
          
          setSelectedProcess(updatedProcess);
          // Also update in processes list
          setProcesses((prevProcesses) => {
            if (!prevProcesses || !Array.isArray(prevProcesses)) {
              return [updatedProcess];
            }
            return prevProcesses.map((p) =>
              p.id === selectedProcess.id ? updatedProcess : p
            );
          });
        }
      } else {
        throw new Error(
          response.message || "Failed to update process registration"
        );
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description:
          error.message ||
          "An error occurred while updating the process registration.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateInitialTriage = async () => {
    if (!selectedProcess) return;

    try {
      const processId = parseInt(selectedProcess.id.replace("P", ""));
      
      // Convert SystemsInvolved and Blockers to strings if they're arrays
      const systemsInvolvedStr = Array.isArray(editInitialTriageData.SystemsInvolved)
        ? editInitialTriageData.SystemsInvolved.join(", ")
        : (editInitialTriageData.SystemsInvolved || undefined);
      
      const blockersStr = Array.isArray(editInitialTriageData.Blockers)
        ? editInitialTriageData.Blockers.join(", ")
        : (editInitialTriageData.Blockers || undefined);
      
      const response = await updateInitialTriage(processId, {
        IsRuleBased: editInitialTriageData.IsRuleBased,
        IsStable: editInitialTriageData.IsStable,
        SystemsInvolved: systemsInvolvedStr,
        Blockers: blockersStr,
        EstimatedAutomationPercent:
          editInitialTriageData.EstimatedAutomationPercent
            ? parseFloat(editInitialTriageData.EstimatedAutomationPercent)
            : undefined,
      });

      if (response && response.success) {
        toast({
          title: "Success",
          description:
            response.message || "Initial triage updated successfully",
        });
        setIsEditingInitialTriage(false);
        // Refresh process details
        try {
          const detailResponse = await getProcessDetail(processId);
          if (detailResponse && detailResponse.success && detailResponse.process) {
            const stages = detailResponse.stages || {};
            const triage = stages.initialTriage || (response.triage || null);
            const approval = stages.approval;
            
          // Update selected process with new data
          const updatedTriageData = triage && typeof triage === 'object'
            ? {
                isRuleBased:
                  triage.IsRuleBased === 1 ||
                  triage.IsRuleBased === true ||
                  triage.is_rule_based === 1 ||
                  triage.is_rule_based === true,
                isStable:
                  triage.IsStable === 1 ||
                  triage.IsStable === true ||
                  triage.is_stable === 1 ||
                  triage.is_stable === true,
                volumes: triage.Volumes || triage.volumes || "",
                systemsInvolved:
                  (triage.SystemsInvolved || triage.systems_involved)
                    ? (() => {
                        const systems = triage.SystemsInvolved || triage.systems_involved;
                        if (typeof systems === "string" && systems.trim()) {
                          return systems.split(",").map((s) => s.trim()).filter(s => s);
                        }
                        if (Array.isArray(systems)) {
                          return systems.filter(s => s);
                        }
                        return [];
                      })()
                    : [],
                applicationsCount:
                  triage.ApplicationsCount || triage.applications_count || 0,
                blockers:
                  (triage.Blockers || triage.blockers)
                    ? (() => {
                        const blockers = triage.Blockers || triage.blockers;
                        if (typeof blockers === "string" && blockers.trim()) {
                          return blockers.split(",").map((b) => b.trim()).filter(b => b);
                        }
                        if (Array.isArray(blockers)) {
                          return blockers.filter(b => b);
                        }
                        return [];
                      })()
                    : [],
                estimatedAutomationPercent:
                  triage.EstimatedAutomationPercent ||
                  triage.estimated_automation_percent ||
                  0,
                initialROI:
                  triage.InitialROI || triage.initial_roi?.toString() || "",
                feasibilityStatus: (triage.FeasibilityStatus ||
                  triage.feasibility_status) as
                  | "Feasible"
                  | "Not Feasible"
                  | "Review Required"
                  | undefined,
                triageNotes: triage.TriageNotes || triage.triage_notes || "",
              }
            : selectedProcess.triageData;

          // Update approval data with approvalNeedsReview flag
          // ✅ FIXED: Use mapApprovalStatus helper - ONLY check BIT flags, NO fallback to status strings
          const updatedApprovalData = approval
            ? {
                businessOwnerApproval: mapApprovalStatus(approval.BusinessOwnerApproval),
                rpaCoEApproval: mapApprovalStatus(approval.RPA_Approval),
                comments: {
                  businessOwner:
                    approval.BO_ApprovalNote ??
                    approval.bo_approval_note ??
                    approval.BO_Approval_Note ??
                    approval.BusinessOwnerApprovalNote ??
                    approval.business_owner_approval_note ??
                    "",
                  rpaCoE:
                    approval.RPA_ApprovalNote ??
                    approval.rpa_approval_note ??
                    approval.RPA_Approval_Note ??
                    approval.RPAApprovalNote ??
                    "",
                },
                approvalNeedsReview:
                  approval.ApprovalNeedsReview === 1 ||
                  approval.ApprovalNeedsReview === true ||
                  approval.approvalNeedsReview === 1 ||
                  approval.approval_needs_review === 1 ||
                  false,
              }
            : selectedProcess.approvalData;
          

          const updatedProcess = {
            ...selectedProcess,
            triageData: updatedTriageData,
            approvalData: updatedApprovalData,
          };
          setSelectedProcess(updatedProcess);
          // Also update in processes list
          setProcesses((prevProcesses) => {
            if (!prevProcesses || !Array.isArray(prevProcesses)) {
              return [updatedProcess];
            }
            return prevProcesses.map((p) =>
              p.id === selectedProcess.id ? updatedProcess : p
            );
          });
          } else {
          }
        } catch (refreshError) {
          // Don't throw - the update might have succeeded even if refresh failed
        }
      } else {
        const errorMessage = response?.message || response?.error || "Failed to update initial triage";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description:
          error.message ||
          "An error occurred while updating the initial triage.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSystemIntegration = async () => {
    if (!selectedProcess) return;

    try {
      const processId = parseInt(selectedProcess.id.replace("P", ""));
      const response = await updateSystemIntegration(processId, {
        Credentials: editSystemIntegrationData.Credentials || undefined,
        Notes: editSystemIntegrationData.Notes || undefined,
      });

      if (response && response.success) {
        toast({
          title: "Success",
          description:
            response.message || "System integration updated successfully",
        });
        setIsEditingSystemIntegration(false);
        // Refresh process details
        try {
          const detailResponse = await getProcessDetail(processId);
          if (detailResponse && detailResponse.success && detailResponse.process) {
            const stages = detailResponse.stages || {};
            const integration = stages.systemIntegration || (response.integration || null);
            const approval = stages.approval;
            
            // Update selected process with new data
            const updatedSitData = integration && typeof integration === 'object'
              ? {
                  testNotes:
                    integration.Notes ||
                    integration.notes ||
                    integration.TestNotes ||
                    integration.test_notes ||
                    "",
                  credentialRequirements:
                    integration.Credentials || integration.credentials || "",
                }
              : selectedProcess.sitData;

            // Update approval data with approvalNeedsReview flag
            const updatedApprovalData = approval
              ? {
                  // ✅ FIXED: Use mapApprovalStatus helper - ONLY check BIT flags, NO fallback to status strings
                  businessOwnerApproval: mapApprovalStatus(approval.BusinessOwnerApproval),
                  rpaCoEApproval: mapApprovalStatus(approval.RPA_Approval),
                  comments: {
                    businessOwner:
                      approval.BO_ApprovalNote ??
                      approval.bo_approval_note ??
                      approval.BO_Approval_Note ??
                      approval.BusinessOwnerApprovalNote ??
                      approval.business_owner_approval_note ??
                      "",
                    rpaCoE:
                      approval.RPA_ApprovalNote ??
                      approval.rpa_approval_note ??
                      approval.RPA_Approval_Note ??
                      approval.RPAApprovalNote ??
                      "",
                  },
                  approvalNeedsReview:
                    approval.ApprovalNeedsReview === 1 ||
                    approval.ApprovalNeedsReview === true ||
                    approval.approvalNeedsReview === 1 ||
                    approval.approval_needs_review === 1 ||
                    false,
                }
              : selectedProcess.approvalData;

            const updatedProcess = {
              ...selectedProcess,
              sitData: updatedSitData,
              approvalData: updatedApprovalData,
            };
            setSelectedProcess(updatedProcess);
            // Also update in processes list
            setProcesses((prevProcesses) => {
              if (!prevProcesses || !Array.isArray(prevProcesses)) {
                return [updatedProcess];
              }
              return prevProcesses.map((p) =>
                p.id === selectedProcess.id ? updatedProcess : p
              );
            });
          } else {
          }
        } catch (refreshError) {
          // Don't throw - the update might have succeeded even if refresh failed
        }
      } else {
        const errorMessage = response?.message || response?.error || "Failed to update system integration";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description:
          error.message ||
          "An error occurred while updating the system integration.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateToBeDesign = async () => {
    if (!selectedProcess) return;

    try {
      // D_id is required for update
      if (!editToBeDesignData.D_id) {
        toast({
          title: "Validation Error",
          description: "Design ID is required for update.",
          variant: "destructive",
        });
        return;
      }

      const processId = parseInt(selectedProcess.id.replace("P", ""));
      const response = await updateToBeDesign(processId, {
        D_id: editToBeDesignData.D_id, // Required
        WorkflowFile: editWorkflowFileObject || undefined, // File object (if new file selected)
        ExceptionFile: editExceptionFileObject || undefined, // File object (if new file selected)
        Credentials: editToBeDesignData.Credentials || undefined,
        VirtualMachine: editToBeDesignData.VirtualMachine || undefined,
        LoggingRequirements: editToBeDesignData.LoggingRequirements || editToBeDesignData.LoggingInfo || undefined,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "To-Be Design updated successfully",
        });
        setIsEditingToBeDesign(false);
        // Refresh process details
        const detailResponse = await getProcessDetail(processId);
        if (detailResponse.success && detailResponse.process) {
          const stages = detailResponse.stages || {};
          const design = stages.toBeDesign || response.design;
          const approval = stages.approval;
          
          // Update selected process with new data
          const updatedDesignData = design
            ? {
                workflowDiagram:
                  design.WorkflowFile ||
                  design.WorkflowFilePath ||
                  design.WorkflowDiagram ||
                  "",
                exceptionHandlingPlan:
                  design.ExceptionFile || design.ExceptionFilePath || "",
                retryMechanismRequired: design.RetryMechanismRequired ?? false,
                retryMechanismDetails: design.RetryMechanismDetails || "",
                credentialRequirements:
                  design.Credentials || design.credentials || "",
                vmInfraNeeded:
                  design.VirtualMachine || design.Virtual_Machine || "",
                orchestratorQueuesRequired:
                  design.OrchestratorQueuesRequired ?? false,
                loggingRequirements:
                  design.LoggingInfo ||
                  design.LoggingRequirements ||
                  design.Logging_Info ||
                  "",
                sddDocument: design.SDDDocument || design.SDD_Document || "",
                sddApprovalStatus: (design.SDDApprovalStatus ||
                  design.SDD_Approval_Status) as
                  | "Approved"
                  | "Pending"
                  | undefined,
              }
            : selectedProcess.toBeDesignData;

          // Update approval data with approvalNeedsReview flag
          // ✅ FIXED: Use mapApprovalStatus helper - ONLY check BIT flags, NO fallback to status strings
          const updatedApprovalData = approval
            ? {
                businessOwnerApproval: mapApprovalStatus(approval.BusinessOwnerApproval),
                rpaCoEApproval: mapApprovalStatus(approval.RPA_Approval),
                comments: {
                  businessOwner:
                    approval.BO_ApprovalNote ??
                    approval.bo_approval_note ??
                    approval.BO_Approval_Note ??
                    approval.BusinessOwnerApprovalNote ??
                    approval.business_owner_approval_note ??
                    "",
                  rpaCoE:
                    approval.RPA_ApprovalNote ??
                    approval.rpa_approval_note ??
                    approval.RPA_Approval_Note ??
                    approval.RPAApprovalNote ??
                    "",
                },
                approvalNeedsReview:
                  approval.ApprovalNeedsReview === 1 ||
                  approval.ApprovalNeedsReview === true ||
                  approval.approvalNeedsReview === 1 ||
                  approval.approval_needs_review === 1 ||
                  false,
              }
            : selectedProcess.approvalData;

          const updatedProcess = {
            ...selectedProcess,
            toBeDesignData: updatedDesignData,
            approvalData: updatedApprovalData,
          };
          setSelectedProcess(updatedProcess);
          // Also update in processes list
          setProcesses((prevProcesses) =>
            prevProcesses.map((p) =>
              p.id === selectedProcess.id ? updatedProcess : p
            )
          );
        }
      } else {
        throw new Error(response.message || "Failed to update to-be design");
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description:
          error.message || "An error occurred while updating the to-be design.",
        variant: "destructive",
      });
    }
  };

  // Fetch all processes summary on component mount
  useEffect(() => {
    const fetchProcesses = async () => {
      // Check if token exists before making API call
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoadingProcesses(false);
        toast({
          title: "Authentication Required",
          description: "Please log in to view processes",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsLoadingProcesses(true);
        const response = await getAllProcessesSummary();

        if (response.success && response.processes) {
          // Map backend response to frontend Process type
          const mappedProcesses: Process[] = response.processes.map(
            (p: any) => {
              // Map stage name from backend to frontend
              const frontendStage = mapBackendStageToFrontend(
                p.CurrentStage || null
              );

              // Generate process ID from ProcessId
              const processId = `P${String(p.ProcessId).padStart(3, "0")}`;

              // Map the process data - ONLY use database values, no static defaults
              return {
                id: processId,
                title: p.Title || "",
                description: p.Description || "",
                department: p.Department || p.Tag || "", // ✅ Use Department field, fallback to Tag for backward compatibility
                priority: (p.Priority || "Medium") as
                  | "Low"
                  | "Medium"
                  | "High"
                  | "Critical", // Priority is required
                expectedROI: p.ExpectedROI ?? 0,
                status: frontendStage as ProcessStage,
                submittedBy: p.CreatedByName || "",
                submittedDate: parseDateString(p.CreatedAt),
                estimatedSavings: p.EstimatedSavings ?? 0, // Use from DB if available
                complexity: (p.Complexity || "Medium") as
                  | "Low"
                  | "Medium"
                  | "High", // Use from DB if available
                dependencies: p.Dependencies
                  ? typeof p.Dependencies === "string"
                    ? p.Dependencies.split(",")
                        .map((d) => d.trim())
                        .filter((d) => d)
                    : p.Dependencies
                  : [],
                tags: p.Tag ? [p.Tag] : [],
                stakeholders: p.Stakeholder
                  ? typeof p.Stakeholder === "string"
                    ? [p.Stakeholder]
                    : Array.isArray(p.Stakeholder)
                    ? p.Stakeholder
                    : []
                  : [],
              };
            }
          );

          setProcesses(mappedProcesses);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to load processes",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load processes",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProcesses(false);
      }
    };

    fetchProcesses();
  }, []);

  // Generate Process ID when dialog opens and reset all form data
  useEffect(() => {
    if (isNewProcessOpen && !newProcessId) {
      const nextId = `P${String(processes.length + 1).padStart(3, "0")}`;
      setNewProcessId(nextId);
    }
    // Reset form and all stage data when dialog opens or closes (only if not in edit mode)
    if (isNewProcessOpen && !isEditMode) {
      // Reset form data when opening (only for new process, not edit)
      setFormData({
        title: "",
        department: "",
        description: "",
        priority: "",
        expectedROI: "",
        stakeholders: [],
        tags: [],
      });
      setDataSamplesUploaded(false);
      setSopDocumentUploaded(false);
      setDataSamplesFileName("");
      setSopDocumentFileName("");
      setCurrentStakeholder("");
      setCurrentTag("");
      // Reset all stage-related state (only for new process creation)
      setTriageData({
        isRuleBased: undefined,
        isStable: undefined,
        volumes: "",
        volumesCaptured: false,
        systemsInvolved: [],
        systemsIdentified: false,
        applicationsCount: 0,
        blockers: [],
        blockersIdentified: false,
        estimatedAutomationPercent: 0,
        initialROI: "",
        roiEstimated: false,
        feasibilityStatus: undefined,
        feasibilityApproved: false,
        triageNotes: "",
      });
      setSitData({
        testNotes: "",
        credentialRequirements: "",
      });
      setToBeDesignData({
        workflowDiagram: "",
        workflowDiagramFile: undefined,
        exceptionHandlingPlan: "",
        exceptionHandlingPlanFile: undefined,
        retryMechanismRequired: false,
        retryMechanismDetails: "",
        credentialRequirements: "",
        vmInfraNeeded: "",
        orchestratorQueuesRequired: false,
        loggingRequirements: "",
        sddDocument: "",
        sddApprovalStatus: undefined,
      });
      setApprovalData({
        businessOwnerApproval: undefined,
        rpaCoEApproval: undefined,
      });
      setApprovalComments({
        businessOwner: "",
        rpaCoE: "",
      });
      setDevelopmentData({
        developmentStartDate: "",
        devVmAccessProvided: false,
        applicationsAccessCompleted: false,
        workflowDevelopmentStatus: 0,
        configFileProvided: false,
        exceptionHandlingImplemented: false,
        loggingImplemented: false,
        unitTestingCompleted: false,
        codeReviewStatus: undefined,
        gitRepoOrBotPackage: "",
        developerNotes: "",
      });
      setItInfoSecAssessment({
        securityReviewCompleted: false,
        dataPrivacyCompliant: false,
        systemAccessApproved: false,
        networkSecurityVerified: false,
        complianceRequirementsMet: false,
        riskAssessmentCompleted: false,
      });
      setRisks([]);
      setTimelineDates({
        discoveryStartDate: "",
        developmentStartDate: "",
        testingStartDate: "",
        uatStartDate: "",
        goLiveDate: "",
        stabilizationDate: "",
      });
    }
  }, [isNewProcessOpen, newProcessId, processes.length, isEditMode]);

  const handleDownloadFile = async (
    fileName: string, 
    fileType?: "sampledata" | "sopdoc" | "workflow" | "exception"
  ) => {
    if (!selectedProcess) {
      toast({
        title: "Error",
        description: "No process selected",
        variant: "destructive",
      });
      return;
    }

    if (!fileType) {
      toast({
        title: "Error",
        description: "File type not specified",
        variant: "destructive",
      });
      return;
    }

    // Set loading state
    setDownloadingFileType(fileType);

    try {
      // Extract numeric process ID from format "P001" -> 1
      const numericProcessId = parseInt(selectedProcess.id.replace("P", ""));
      
      if (isNaN(numericProcessId)) {
        toast({
          title: "Error",
          description: "Invalid process ID",
          variant: "destructive",
        });
        setDownloadingFileType(null);
        return;
      }

      // Show loading toast
      let fileDescription: string;
      if (fileType === "sampledata") {
        fileDescription = "Data Samples";
      } else if (fileType === "sopdoc") {
        fileDescription = "SOP Document";
      } else if (fileType === "workflow") {
        fileDescription = "Workflow Diagram";
      } else {
        fileDescription = "Exception Handling Plan";
      }

      toast({
        title: "Downloading...",
        description: `Preparing ${fileDescription} for download...`,
      });

      // Download the file based on type - pass original filename to extract correct extension
      let downloadResult: { blob: Blob; filename: string };

      if (fileType === "sampledata") {
        downloadResult = await downloadSampleData(numericProcessId, fileName);
      } else if (fileType === "sopdoc") {
        downloadResult = await downloadSopDoc(numericProcessId, fileName);
      } else if (fileType === "workflow") {
        downloadResult = await downloadWorkflowDiagram(numericProcessId, fileName);
      } else {
        downloadResult = await downloadExceptionHandlingPlan(numericProcessId, fileName);
      }

      // Use the filename from the response headers, fallback to fileName parameter if needed
      const actualFilename = downloadResult.filename || fileName;

      // Verify blob has content
      if (downloadResult.blob.size === 0) {
        toast({
          title: "Download Failed",
          description: "Downloaded file is empty. Please check if the file exists on the server.",
          variant: "destructive",
        });
        console.error("Downloaded blob is empty. Blob size:", downloadResult.blob.size);
        setDownloadingFileType(null);
        return;
      }

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(downloadResult.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = actualFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `${fileDescription} downloaded successfully.`,
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download file. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Clear loading state
      setDownloadingFileType(null);
    }
  };

  // Save triage data to process whenever it changes - update instantly for all stages
  // This ensures the overview section shows updated data immediately, regardless of current stage
  useEffect(() => {
    if (selectedProcess && selectedProcess.status === "Initial Triage") {
      // Update processes list
      setProcesses((prevProcesses) =>
        prevProcesses.map((p) =>
          p.id === selectedProcess.id
            ? {
                ...p,
                triageData: {
                  isRuleBased: triageData.isRuleBased,
                  isStable: triageData.isStable,
                  volumes: triageData.volumes,
                  systemsInvolved: triageData.systemsInvolved,
                  applicationsCount: triageData.applicationsCount,
                  blockers: triageData.blockers,
                  estimatedAutomationPercent:
                    triageData.estimatedAutomationPercent,
                  initialROI: triageData.initialROI,
                  feasibilityStatus: triageData.feasibilityStatus,
                  triageNotes: triageData.triageNotes,
                },
              }
            : p
        )
      );
      // Update selectedProcess to reflect changes instantly - this updates the overview section immediately
      // Only update if we have meaningful data (at least one field filled)
      const hasTriageData =
        triageData.isRuleBased !== undefined ||
        triageData.isStable !== undefined ||
        triageData.volumes?.trim() ||
        triageData.systemsInvolved?.length > 0 ||
        triageData.blockers?.length > 0 ||
        triageData.estimatedAutomationPercent > 0 ||
        triageData.initialROI?.trim() ||
        triageData.triageNotes?.trim();

      if (hasTriageData) {
        setSelectedProcess((prev) =>
          prev
            ? {
                ...prev,
                triageData: {
                  isRuleBased: triageData.isRuleBased,
                  isStable: triageData.isStable,
                  volumes: triageData.volumes,
                  systemsInvolved: triageData.systemsInvolved,
                  applicationsCount: triageData.applicationsCount,
                  blockers: triageData.blockers,
                  estimatedAutomationPercent:
                    triageData.estimatedAutomationPercent,
                  initialROI: triageData.initialROI,
                  feasibilityStatus: triageData.feasibilityStatus,
                  triageNotes: triageData.triageNotes,
                },
              }
            : null
        );
      }
    }
  }, [triageData, selectedProcess?.id, selectedProcess?.status]);

  // Save TO-BE design data to process whenever it changes
  useEffect(() => {
    if (selectedProcess && selectedProcess.status === "To-Be Design") {
      setProcesses((prevProcesses) =>
        prevProcesses.map((p) =>
          p.id === selectedProcess.id
            ? {
                ...p,
                toBeDesignData: {
                  workflowDiagram: toBeDesignData.workflowDiagram,
                  exceptionHandlingPlan: toBeDesignData.exceptionHandlingPlan,
                  retryMechanismRequired: toBeDesignData.retryMechanismRequired,
                  retryMechanismDetails: toBeDesignData.retryMechanismDetails,
                  credentialRequirements: toBeDesignData.credentialRequirements,
                  vmInfraNeeded: toBeDesignData.vmInfraNeeded,
                  orchestratorQueuesRequired:
                    toBeDesignData.orchestratorQueuesRequired,
                  loggingRequirements: toBeDesignData.loggingRequirements,
                  sddDocument: toBeDesignData.sddDocument,
                  sddApprovalStatus: toBeDesignData.sddApprovalStatus,
                },
              }
            : p
        )
      );
      // Update selectedProcess to reflect changes
      setSelectedProcess((prev) =>
        prev
          ? {
              ...prev,
              toBeDesignData: {
                workflowDiagram: toBeDesignData.workflowDiagram,
                exceptionHandlingPlan: toBeDesignData.exceptionHandlingPlan,
                retryMechanismRequired: toBeDesignData.retryMechanismRequired,
                retryMechanismDetails: toBeDesignData.retryMechanismDetails,
                credentialRequirements: toBeDesignData.credentialRequirements,
                vmInfraNeeded: toBeDesignData.vmInfraNeeded,
                orchestratorQueuesRequired:
                  toBeDesignData.orchestratorQueuesRequired,
                loggingRequirements: toBeDesignData.loggingRequirements,
                sddDocument: toBeDesignData.sddDocument,
                sddApprovalStatus: toBeDesignData.sddApprovalStatus,
              },
            }
          : null
      );
    }
  }, [toBeDesignData, selectedProcess?.id]);

  // Save approval data to process whenever it changes
  useEffect(() => {
    if (selectedProcess && selectedProcess.status === "Approval") {
      setProcesses((prevProcesses) =>
        prevProcesses.map((p) =>
          p.id === selectedProcess.id
            ? {
                ...p,
                approvalData: {
                  businessOwnerApproval: approvalData.businessOwnerApproval,
                  rpaCoEApproval: approvalData.rpaCoEApproval,
                  comments: approvalComments,
                },
              }
            : p
        )
      );
      // Update selectedProcess to reflect changes
      setSelectedProcess((prev) =>
        prev
          ? {
              ...prev,
              approvalData: {
                businessOwnerApproval: approvalData.businessOwnerApproval,
                rpaCoEApproval: approvalData.rpaCoEApproval,
                comments: approvalComments,
              },
            }
          : null
      );
    }
  }, [approvalData, approvalComments, selectedProcess?.id]);

  // Ensure active tab is set correctly when process details dialog opens or status changes
  // This acts as a backup to ensure the correct tab is shown
  // The main tab setting happens in handleProcessClick after data is loaded, which takes priority
  useEffect(() => {
    if (
      selectedProcess &&
      isProcessDetailsOpen &&
      !tabSetByHandleClick.current
    ) {
      // Only set tab if handleProcessClick hasn't set it yet
      // Show the current stage form tab as default (not overview)
      if (selectedProcess.status === "Initial Triage") {
        setActiveDetailsTab("triage");
      } else if (selectedProcess.status === "System Integration") {
        setActiveDetailsTab("sit");
      } else if (selectedProcess.status === "Approval") {
        setActiveDetailsTab("approvals");
      } else if (selectedProcess.status === "To-Be Design") {
        setActiveDetailsTab("to-be-design");
      } else {
        // For other stages - show overview
        setActiveDetailsTab("overview");
        // For Development and all stages after Development, show Development tab as default
        const developmentIndex = processStages.indexOf("Development");
        const currentStageIndex = processStages.indexOf(selectedProcess.status);
        if (currentStageIndex >= developmentIndex) {
          // Development stage or later (UAT, Go-Live, Hypercare, Handover)
          setActiveOverviewTab("development");
        } else {
          // Process Registration or earlier stages
          setActiveOverviewTab("basic-info");
        }
      }
    }
    // Reset the flag after a short delay to allow handleProcessClick to set it
    if (tabSetByHandleClick.current) {
      const timeoutId = setTimeout(() => {
        tabSetByHandleClick.current = false;
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedProcess?.status, isProcessDetailsOpen]);

  // Save development data to process whenever it changes
  useEffect(() => {
    if (selectedProcess && selectedProcess.status === "Development") {
      setProcesses((prevProcesses) =>
        prevProcesses.map((p) =>
          p.id === selectedProcess.id
            ? {
                ...p,
                developmentData: {
                  developmentStartDate: developmentData.developmentStartDate,
                  devVmAccessProvided: developmentData.devVmAccessProvided,
                  applicationsAccessCompleted:
                    developmentData.applicationsAccessCompleted,
                  workflowDevelopmentStatus:
                    developmentData.workflowDevelopmentStatus,
                  configFileProvided: developmentData.configFileProvided,
                  exceptionHandlingImplemented:
                    developmentData.exceptionHandlingImplemented,
                  loggingImplemented: developmentData.loggingImplemented,
                  unitTestingCompleted: developmentData.unitTestingCompleted,
                  codeReviewStatus: developmentData.codeReviewStatus,
                  gitRepoOrBotPackage: developmentData.gitRepoOrBotPackage,
                  developerNotes: developmentData.developerNotes,
                },
              }
            : p
        )
      );
      // Update selectedProcess to reflect changes
      setSelectedProcess((prev) =>
        prev
          ? {
              ...prev,
              developmentData: {
                developmentStartDate: developmentData.developmentStartDate,
                devVmAccessProvided: developmentData.devVmAccessProvided,
                applicationsAccessCompleted:
                  developmentData.applicationsAccessCompleted,
                workflowDevelopmentStatus:
                  developmentData.workflowDevelopmentStatus,
                configFileProvided: developmentData.configFileProvided,
                exceptionHandlingImplemented:
                  developmentData.exceptionHandlingImplemented,
                loggingImplemented: developmentData.loggingImplemented,
                unitTestingCompleted: developmentData.unitTestingCompleted,
                codeReviewStatus: developmentData.codeReviewStatus,
                gitRepoOrBotPackage: developmentData.gitRepoOrBotPackage,
                developerNotes: developmentData.developerNotes,
              },
            }
          : null
      );
    }
  }, [developmentData, selectedProcess?.id]);

  // Save SIT data to process when it changes and sync with selectedProcess
  useEffect(() => {
    if (selectedProcess) {
      // Update selectedProcess.sitData so the overview section shows the data
      setSelectedProcess((prev) =>
        prev
          ? {
              ...prev,
              sitData: {
                testNotes: sitData.testNotes,
                credentialRequirements: sitData.credentialRequirements,
              },
            }
          : null
      );

      // Also save to processes array if in System Integration stage
      if (selectedProcess.status === "System Integration") {
        saveDataToProcess({
          sitData: {
            testNotes: sitData.testNotes,
            credentialRequirements: sitData.credentialRequirements,
          },
        });
      }
    }
  }, [sitData, selectedProcess?.id]);

  // Refresh process data when approval dialog opens to ensure ALL stage data is loaded from database
  useEffect(() => {
    // Only refresh when dialog is actually opened (not when it's closed)
    if (
      openApprovalDialog &&
      (openApprovalDialog === "business-owner" ||
        openApprovalDialog === "rpa-coe" ||
        openApprovalDialog === "business-owner-update" ||
        openApprovalDialog === "rpa-coe-update") &&
      selectedProcess
    ) {
      // CRITICAL: Ensure System Integration data is available IMMEDIATELY from existing selectedProcess
      // This prevents delay - data will be updated with fresh DB data when fetch completes
      // Set synchronously before async operation to ensure instant display
      setSelectedProcess((prev) => {
        if (!prev) return null;

        if (!prev.sitData) {
          return {
            ...prev,
            sitData: {
              testNotes: "",
              credentialRequirements: "",
            },
          };
        }

        return prev;
      });

      const refreshData = async () => {
        try {
          const numericProcessId = parseInt(
            selectedProcess.id.replace("P", "")
          );
          const refreshResponse = await getProcessDetail(numericProcessId);

          if (refreshResponse.success && refreshResponse.process) {
            const stages = refreshResponse.stages || {};

            setSelectedProcess((prev) => {
              if (!prev) return null;

              return {
                ...prev,
                // Update triage data - using EXACT column names from santova.InsertInitialTriage SP
                // SP returns: is_rule_based, is_stable, systems_involved, blockers, estimated_automation_percent
                triageData: stages.initialTriage
                  ? {
                      isRuleBased: stages.initialTriage.is_rule_based ?? false,
                      isStable: stages.initialTriage.is_stable ?? false,
                      volumes: stages.initialTriage.volumes ?? "",
                      systemsInvolved: parseStringArray(
                        stages.initialTriage.systems_involved
                      ),
                      applicationsCount:
                        stages.initialTriage.applications_count ?? 0,
                      blockers: parseStringArray(stages.initialTriage.blockers),
                      estimatedAutomationPercent:
                        stages.initialTriage.estimated_automation_percent ?? 0,
                      initialROI:
                        stages.initialTriage.initial_roi?.toString() || "",
                      feasibilityStatus: (stages.initialTriage
                        .feasibility_status ?? "Review Required") as
                        | "Feasible"
                        | "Not Feasible"
                        | "Review Required"
                        | undefined,
                      triageNotes:
                        stages.initialTriage.triage_notes ??
                        stages.initialTriage.notes ??
                        "",
                    }
                  : prev.triageData,
                // CRITICAL: Update SIT data - using EXACT column names from santova.InsertSystemIntegration SP
                // SP returns: credentials, notes
                sitData: (() => {
                  if (stages.systemIntegration) {
                    return {
                      testNotes:
                        stages.systemIntegration.notes ??
                        prev.sitData?.testNotes ??
                        "",
                      credentialRequirements:
                        stages.systemIntegration.credentials ??
                        prev.sitData?.credentialRequirements ??
                        "",
                    };
                  }
                  return (
                    prev.sitData || {
                      testNotes: "",
                      credentialRequirements: "",
                    }
                  );
                })(),
                // Update To-Be Design data - using EXACT column names from santova.InsertToBeDesign SP
                // SP returns: WorkflowFile, ExceptionFile, Credentials, VirtualMachine
                toBeDesignData: stages.toBeDesign
                  ? {
                      workflowDiagram: stages.toBeDesign.WorkflowFile ?? "",
                      workflowDiagramFile: undefined, // File objects only set when user uploads
                      exceptionHandlingPlan:
                        stages.toBeDesign.ExceptionFile ?? "",
                      exceptionHandlingPlanFile: undefined, // File objects only set when user uploads
                      retryMechanismRequired:
                        stages.toBeDesign.RetryMechanismRequired ?? false,
                      retryMechanismDetails:
                        stages.toBeDesign.RetryMechanismDetails ?? "",
                      credentialRequirements:
                        stages.toBeDesign.Credentials ?? "",
                      vmInfraNeeded: stages.toBeDesign.VirtualMachine ?? "",
                      orchestratorQueuesRequired:
                        stages.toBeDesign.OrchestratorQueuesRequired ?? false,
                      loggingRequirements:
                        stages.toBeDesign.LoggingRequirements ?? "",
                      sddDocument: stages.toBeDesign.SDDDocument ?? "",
                      sddApprovalStatus: (stages.toBeDesign.SDDApprovalStatus ??
                        "Pending") as "Approved" | "Pending",
                    }
                  : prev.toBeDesignData,
                // CRITICAL: Update approval data from database - handle BIT type (1/0)
                // Database BIT: 1 = Approved, 0 = Pending (default)
                // This ensures approval status persists after reopening dialog or relogin
                approvalData: stages.approval
                  ? {
                      // ✅ FIXED: Use mapApprovalStatus helper - ONLY check BIT flags
                      businessOwnerApproval: mapApprovalStatus(stages.approval.BusinessOwnerApproval),
                      rpaCoEApproval: mapApprovalStatus(stages.approval.RPA_Approval),
                      comments: {
                        businessOwner:
                          stages.approval.BO_ApprovalNote ??
                          stages.approval.bo_approval_note ??
                          stages.approval.BusinessOwnerApprovalNote ??
                          stages.approval.business_owner_approval_note ??
                          "",
                        rpaCoE:
                          stages.approval.RPA_ApprovalNote ??
                          stages.approval.rpa_approval_note ??
                          stages.approval.RPAApprovalNote ??
                          stages.approval.rpa_approval_note ??
                          "",
                      },
                      approvalNeedsReview:
                        stages.approval.ApprovalNeedsReview === 1 ||
                        stages.approval.ApprovalNeedsReview === true ||
                        stages.approval.approvalNeedsReview === 1 ||
                        stages.approval.approval_needs_review === 1 ||
                        false,
                    }
                  : prev.approvalData,
              };
            });

            // CRITICAL: Also update approvalData state to sync with selectedProcess
            // This ensures the UI immediately reflects the database state
            // Map BIT values: 1/true = Approved, 0/false/NULL = Pending
            // pymssql may return BIT as boolean (True/False) or integer (1/0)
            if (stages.approval) {
              const boValue =
                stages.approval.BusinessOwnerApproval ??
                stages.approval.businessOwnerApproval ??
                stages.approval.business_owner_approval;
              const rpaValue =
                stages.approval.RPA_Approval ??
                stages.approval.rpa_approval ??
                stages.approval.RPAApproval;


              const newApprovalData = {
                businessOwnerApproval:
                  boValue === 1 ||
                  boValue === true ||
                  boValue === "1" ||
                  String(boValue) === "1"
                    ? ("Approved" as const)
                    : ("Pending" as const),
                rpaCoEApproval:
                  rpaValue === 1 ||
                  rpaValue === true ||
                  rpaValue === "1" ||
                  String(rpaValue) === "1"
                    ? ("Approved" as const)
                    : ("Pending" as const),
              };
              setApprovalData(newApprovalData);
            }
          }
        } catch (error) {
          // Show error toast to user
          toast({
            title: "Error Loading Data",
            description: "Failed to load process details. Please try again.",
            variant: "destructive",
          });
        }
      };

      // Call refresh immediately when dialog opens - no delay
      refreshData();
    }
  }, [openApprovalDialog, selectedProcess?.id]); // Refresh when dialog opens or selectedProcess changes

  // Helper function to save data to process
  const saveDataToProcess = (data: Partial<Process>) => {
    if (selectedProcess) {
      setProcesses((prevProcesses) =>
        prevProcesses.map((p) =>
          p.id === selectedProcess.id ? { ...p, ...data } : p
        )
      );
      setSelectedProcess((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  const handleProcessClick = async (process: Process) => {
    // Extract process ID number from string (e.g., "P001" -> 1)
    const processIdNumber = parseInt(process.id.replace("P", ""));

    setIsProcessDetailsOpen(true);
    setIsLoadingProcessDetail(true);

    // Set initial next stage from processStages array as fallback (will be updated from DB if available)
    const currentIndex = processStages.indexOf(process.status);
    if (currentIndex >= 0 && currentIndex < processStages.length - 1) {
      const fallbackNextStage = processStages[currentIndex + 1];
      // Only use fallback if it's different from current stage
      if (fallbackNextStage !== process.status) {
        setNextStage(fallbackNextStage);
      } else {
        setNextStage(null);
      }
    } else {
      setNextStage(null);
    }

    try {
      // Fetch detailed process data from API
      const response = await getProcessDetail(processIdNumber);

      // Fetch next stage from database (StageMaster) - use exact name from DB, no mapping
      let nextStageFromDb: string | null = null;
      try {
        const nextStageResponse = await getNextStage(processIdNumber);
        if (nextStageResponse.success && nextStageResponse.nextStage) {
          nextStageFromDb = nextStageResponse.nextStage;

          if (nextStageFromDb === nextStageResponse.currentStage) {
            // Don't set it, keep the fallback
          } else {
            setNextStage(nextStageFromDb);
          }
        } else if (nextStageResponse.success && !nextStageResponse.nextStage) {
          setNextStage(null);
        }
      } catch (error) {
        // Keep the fallback value if API fails
      }

      if (response.success && response.process) {
        const backendProcess = response.process;
        const stages = response.stages || {};

        // Use currentStage from API response (which comes from StageTracking - incomplete stage)
        // This is the actual incomplete stage, not what's in ProcessRegistration table
        const backendStageName =
          response.currentStage ||
          backendProcess.CurrentStage ||
          stages.currentStage;
        const currentIncompleteStage =
          validateAndNormalizeStage(backendStageName);


        // Map backend response to frontend Process type - ONLY use database values, no static defaults
        const detailedProcess: Process = {
          id: `P${String(
            backendProcess.P_id || backendProcess.ProcessId || processIdNumber
          ).padStart(3, "0")}`,
          title: backendProcess.Title || "",
          description: backendProcess.Description || "",
          department: backendProcess.Department || backendProcess.Tag || "", // ✅ Use Department field, fallback to Tag for backward compatibility
          priority: (backendProcess.Priority || "Medium") as
            | "Low"
            | "Medium"
            | "High"
            | "Critical", // Priority is required field
          expectedROI: backendProcess.ExpectedROI ?? 0,
          status: currentIncompleteStage as ProcessStage,
          submittedBy: backendProcess.CreatedByName || "",
          submittedDate: (() => {
            // Check multiple possible field name variations
            const dateValue =
              backendProcess.CreatedAt ||
              backendProcess.createdAt ||
              backendProcess.Created_At ||
              backendProcess.created_at ||
              backendProcess.CreatedDate ||
              backendProcess.createdDate;
            return parseDateString(dateValue);
          })(),
          estimatedSavings: backendProcess.EstimatedSavings ?? 0, // Use from DB if available, otherwise 0
          complexity: (backendProcess.Complexity || "Medium") as
            | "Low"
            | "Medium"
            | "High", // Use from DB if available
          dependencies: backendProcess.Dependencies
            ? typeof backendProcess.Dependencies === "string"
              ? backendProcess.Dependencies.split(",")
                  .map((d) => d.trim())
                  .filter((d) => d)
              : backendProcess.Dependencies
            : [],
          tags: backendProcess.Tag ? [backendProcess.Tag] : [],
          stakeholders: backendProcess.Stakeholder
            ? typeof backendProcess.Stakeholder === "string"
              ? [backendProcess.Stakeholder]
              : Array.isArray(backendProcess.Stakeholder)
              ? backendProcess.Stakeholder
              : []
            : [],
          registrationDocuments: {
            // Extract just the filename from the path for display
            dataSamples: backendProcess.SampledataPath 
              ? backendProcess.SampledataPath.split('/').pop() || backendProcess.SampledataPath
              : undefined,
            sopDocument: backendProcess.SopDoc 
              ? backendProcess.SopDoc.split('/').pop() || backendProcess.SopDoc
              : undefined,
          },
          // Map triage data if available - only use database values
          // Handle both PascalCase and snake_case column names from database
          triageData: stages.initialTriage
            ? (() => {
                const triage = stages.initialTriage;
                const systemsInvolved =
                  triage.SystemsInvolved || triage.systems_involved || "";
                const blockers = triage.Blockers || triage.blockers || "";
                const volumes = triage.Volumes || triage.volumes || "";
                const estimatedAutomationPercent =
                  triage.EstimatedAutomationPercent ??
                  triage.estimated_automation_percent ??
                  0;
                const initialROI = triage.InitialROI ?? triage.initial_roi;

                return {
                  isRuleBased:
                    triage.IsRuleBased ?? triage.is_rule_based ?? false,
                  isStable: triage.IsStable ?? triage.is_stable ?? false,
                  volumes: volumes,
                  systemsInvolved: systemsInvolved
                    ? typeof systemsInvolved === "string"
                      ? systemsInvolved
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s)
                      : Array.isArray(systemsInvolved)
                      ? systemsInvolved
                      : []
                    : [],
                  applicationsCount:
                    triage.ApplicationsCount ?? triage.applications_count ?? 0,
                  blockers: blockers
                    ? typeof blockers === "string"
                      ? blockers
                          .split(",")
                          .map((b) => b.trim())
                          .filter((b) => b)
                      : Array.isArray(blockers)
                      ? blockers
                      : []
                    : [],
                  estimatedAutomationPercent: estimatedAutomationPercent,
                  initialROI: initialROI?.toString() || "",
                  feasibilityStatus: (triage.FeasibilityStatus ||
                    triage.feasibility_status) as
                    | "Feasible"
                    | "Not Feasible"
                    | "Review Required"
                    | undefined,
                  triageNotes: triage.TriageNotes || triage.triage_notes || "",
                };
              })()
            : undefined,
          // Map SIT data if available - only use database values
          // Handle both PascalCase and snake_case column names from database
          sitData: stages.systemIntegration
            ? {
                testNotes:
                  stages.systemIntegration.Notes ||
                  stages.systemIntegration.notes ||
                  stages.systemIntegration.TestNotes ||
                  stages.systemIntegration.test_notes ||
                  "",
                credentialRequirements:
                  stages.systemIntegration.Credentials ||
                  stages.systemIntegration.credentials ||
                  "",
              }
            : undefined,
          // Map TO-BE Design data if available - only use database values
          toBeDesignData: stages.toBeDesign
            ? {
                workflowDiagram: stages.toBeDesign.WorkflowFile || "",
                exceptionHandlingPlan: stages.toBeDesign.ExceptionFile || "",
                retryMechanismRequired:
                  stages.toBeDesign.RetryMechanismRequired ?? false,
                retryMechanismDetails:
                  stages.toBeDesign.RetryMechanismDetails || "",
                credentialRequirements: stages.toBeDesign.Credentials || "",
                vmInfraNeeded: stages.toBeDesign.VirtualMachine || "",
                orchestratorQueuesRequired:
                  stages.toBeDesign.OrchestratorQueuesRequired ?? false,
                loggingRequirements:
                  stages.toBeDesign.LoggingRequirements || "",
                sddDocument: stages.toBeDesign.SDDDocument || "",
                sddApprovalStatus: stages.toBeDesign.SDDApprovalStatus as
                  | "Approved"
                  | "Pending"
                  | undefined,
              }
            : undefined,
          // Map approval data if available - handle BIT type (1/0) from database
          // Database BIT: 1 = Approved, 0 = Pending (default), NULL = Pending
          approvalData: stages.approval
            ? (() => {
                // Debug: Log raw database values to diagnose mapping issues
                const rawBO = stages.approval.BusinessOwnerApproval;
                const rawRPA = stages.approval.RPA_Approval;

                // Check all possible field name variations
                const boValue =
                  rawBO ??
                  stages.approval.businessOwnerApproval ??
                  stages.approval.business_owner_approval ??
                  stages.approval.BusinessOwnerApproval;

                const rpaValue =
                  rawRPA ??
                  stages.approval.rpa_approval ??
                  stages.approval.RPAApproval ??
                  stages.approval.RPA_Approval;

                // Map BIT values: 1/true = Approved, 0/false/NULL = Pending
                // pymssql may return BIT as boolean (True/False) or integer (1/0)
                const businessOwnerApproval =
                  boValue === 1 ||
                  boValue === true ||
                  boValue === "1" ||
                  String(boValue) === "1"
                    ? ("Approved" as const)
                    : ("Pending" as const);

                const rpaCoEApproval =
                  rpaValue === 1 ||
                  rpaValue === true ||
                  rpaValue === "1" ||
                  String(rpaValue) === "1"
                    ? ("Approved" as const)
                    : ("Pending" as const);


                return {
                  businessOwnerApproval,
                  rpaCoEApproval,
                  comments: {
                    businessOwner:
                      stages.approval.BO_ApprovalNote ??
                      stages.approval.bo_approval_note ??
                      stages.approval.BusinessOwnerApprovalNote ??
                      stages.approval.business_owner_approval_note ??
                      "",
                    rpaCoE:
                      stages.approval.RPA_ApprovalNote ??
                      stages.approval.rpa_approval_note ??
                      stages.approval.RPAApprovalNote ??
                      stages.approval.rpa_approval_note ??
                      "",
                  },
                  approvalNeedsReview:
                    stages.approval.ApprovalNeedsReview === 1 ||
                    stages.approval.ApprovalNeedsReview === true ||
                    stages.approval.approvalNeedsReview === 1 ||
                    stages.approval.approval_needs_review === 1 ||
                    false,
                };
              })()
            : undefined,
          // Map development data if available - only use database values
          developmentData: stages.development
            ? {
                developmentStartDate: stages.development.DevelopmentStartDate
                  ? new Date(
                      stages.development.DevelopmentStartDate
                    ).toISOString()
                  : "",
                devVmAccessProvided:
                  stages.development.DevVmAccessProvided ?? false,
                applicationsAccessCompleted:
                  stages.development.ApplicationsAccessCompleted ?? false,
                workflowDevelopmentStatus:
                  stages.development.WorkflowDevelopmentStatus ?? 0,
                configFileProvided:
                  stages.development.ConfigFileProvided ?? false,
                exceptionHandlingImplemented:
                  stages.development.ExceptionHandlingImplemented ?? false,
                loggingImplemented:
                  stages.development.LoggingImplemented ?? false,
                unitTestingCompleted:
                  stages.development.UnitTestingCompleted ?? false,
                codeReviewStatus: stages.development.CodeReviewStatus as
                  | "Approved"
                  | "Pending"
                  | undefined,
                gitRepoOrBotPackage:
                  stages.development.GitRepoOrBotPackage || "",
                developerNotes: stages.development.DeveloperNotes || "",
              }
            : undefined,
        };

        setSelectedProcess(detailedProcess);

        // CRITICAL: Sync approvalData state with selectedProcess.approvalData from database
        // This ensures the UI shows correct approval status immediately
        // Database BIT: 1 = Approved, 0 = Pending (default)

        if (detailedProcess.approvalData) {
          // Use approval data from database - DO NOT override with undefined
          const dbApprovalData = {
            businessOwnerApproval:
              detailedProcess.approvalData.businessOwnerApproval,
            rpaCoEApproval: detailedProcess.approvalData.rpaCoEApproval,
          };
          setApprovalData(dbApprovalData);
          setApprovalComments(
            detailedProcess.approvalData.comments || {
              businessOwner: "",
              rpaCoE: "",
            }
          );
        } else {
          setApprovalData({
            businessOwnerApproval: "Pending",
            rpaCoEApproval: "Pending",
          });
          setApprovalComments({
            businessOwner: "",
            rpaCoE: "",
          });
        }

        // Set active tab based on current stage from database
        // Show the current stage form tab as default (not overview)
        const currentStatusFromDb = detailedProcess.status;
        tabSetByHandleClick.current = true; // Mark that we're setting the tab from handleProcessClick

        // Set the current stage form tab as default
        if (currentStatusFromDb === "Initial Triage") {
          setActiveDetailsTab("triage");
        } else if (currentStatusFromDb === "System Integration") {
          setActiveDetailsTab("sit");
        } else if (currentStatusFromDb === "Approval") {
          setActiveDetailsTab("approvals");
        } else if (currentStatusFromDb === "To-Be Design") {
          setActiveDetailsTab("to-be-design");
        } else {
          // For other stages - show overview
          setActiveDetailsTab("overview");
          // For Development and all stages after Development, show Development tab as default
          const developmentIndex = processStages.indexOf("Development");
          const currentStageIndex = processStages.indexOf(currentStatusFromDb);
          if (currentStageIndex >= developmentIndex) {
            // Development stage or later (UAT, Go-Live, Hypercare, Handover)
            setActiveOverviewTab("development");
          } else {
            // Process Registration or earlier stages
            setActiveOverviewTab("basic-info");
          }
        }

        // Initialize stage-specific state - DO NOT pre-populate forms, only update selectedProcess for display
        // Forms should always start empty for data entry
        // Only update selectedProcess with database data for overview display
        if (stages.initialTriage) {
          // Handle both PascalCase and snake_case column names from database
          const triage = stages.initialTriage;
          const systemsInvolved =
            triage.SystemsInvolved || triage.systems_involved || "";
          const blockers = triage.Blockers || triage.blockers || "";
          const volumes = triage.Volumes || triage.volumes || "";
          const estimatedAutomationPercent =
            triage.EstimatedAutomationPercent ??
            triage.estimated_automation_percent ??
            0;
          const initialROI = triage.InitialROI ?? triage.initial_roi;
          const isRuleBased =
            triage.IsRuleBased ?? triage.is_rule_based ?? false;
          const isStable = triage.IsStable ?? triage.is_stable ?? false;

          // Update selectedProcess.triageData so the overview section shows the data from database
          setSelectedProcess((prev) => ({
            ...prev,
            triageData: {
              isRuleBased: isRuleBased,
              isStable: isStable,
              volumes: volumes,
              systemsInvolved: systemsInvolved
                ? typeof systemsInvolved === "string"
                  ? systemsInvolved
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s)
                  : Array.isArray(systemsInvolved)
                  ? systemsInvolved
                  : []
                : [],
              applicationsCount:
                triage.ApplicationsCount ?? triage.applications_count ?? 0,
              blockers: blockers
                ? typeof blockers === "string"
                  ? blockers
                      .split(",")
                      .map((b) => b.trim())
                      .filter((b) => b)
                  : Array.isArray(blockers)
                  ? blockers
                  : []
                : [],
              estimatedAutomationPercent: estimatedAutomationPercent,
              initialROI: initialROI?.toString() || "",
              feasibilityStatus: (triage.FeasibilityStatus ||
                triage.feasibility_status) as
                | "Feasible"
                | "Not Feasible"
                | "Review Required"
                | undefined,
              triageNotes: triage.TriageNotes || triage.triage_notes || "",
            },
          }));
        }

        // Always reset form to empty state - forms should not be pre-filled
        if (currentStatusFromDb === "Initial Triage") {
          setTriageData({
            isRuleBased: undefined,
            isStable: undefined,
            volumes: "",
            volumesCaptured: false,
            systemsInvolved: [],
            systemsIdentified: false,
            applicationsCount: 0,
            blockers: [],
            blockersIdentified: false,
            estimatedAutomationPercent: 0,
            initialROI: "",
            roiEstimated: false,
            feasibilityStatus: undefined,
            feasibilityApproved: false,
            triageNotes: "",
          });
        }

        // CRITICAL: Always set System Integration data immediately - use database data if available
        // This ensures sitData is always available instantly, preventing delays in approval dialog
        const integration = stages.systemIntegration || {};
        const sitTestNotes =
          integration.Notes ||
          integration.notes ||
          integration.TestNotes ||
          integration.test_notes ||
          integration.TestNote ||
          integration.test_note ||
          integration.Note ||
          integration.note ||
          "";
        const sitCredentials =
          integration.Credentials ||
          integration.credentials ||
          integration.CredentialRequirements ||
          integration.credential_requirements ||
          integration.Credential ||
          integration.credential ||
          "";

        setSelectedProcess((prev) => ({
          ...prev,
          sitData: {
            testNotes: sitTestNotes || prev?.sitData?.testNotes || "",
            credentialRequirements:
              sitCredentials || prev?.sitData?.credentialRequirements || "",
          },
        }));

        // Always reset form to empty state - forms should not be pre-filled
        if (currentStatusFromDb === "System Integration") {
          setSitData({
            testNotes: "",
            credentialRequirements: "",
          });
        }

        if (stages.toBeDesign) {
          // Update selectedProcess.toBeDesignData so the overview section shows the data from database
          setSelectedProcess((prev) => ({
            ...prev,
            toBeDesignData: {
              workflowDiagram: stages.toBeDesign.WorkflowFile || "",
              workflowDiagramFile: undefined, // File objects only set when user uploads
              exceptionHandlingPlan: stages.toBeDesign.ExceptionFile || "",
              exceptionHandlingPlanFile: undefined, // File objects only set when user uploads
              retryMechanismRequired:
                stages.toBeDesign.RetryMechanismRequired ?? false,
              retryMechanismDetails:
                stages.toBeDesign.RetryMechanismDetails || "",
              credentialRequirements: stages.toBeDesign.Credentials || "",
              vmInfraNeeded: stages.toBeDesign.VirtualMachine || "",
              orchestratorQueuesRequired:
                stages.toBeDesign.OrchestratorQueuesRequired ?? false,
              loggingRequirements: stages.toBeDesign.LoggingInfo || stages.toBeDesign.LoggingRequirements || "",
              sddDocument: stages.toBeDesign.SDDDocument || "",
              sddApprovalStatus: stages.toBeDesign.SDDApprovalStatus as
                | "Approved"
                | "Pending"
                | undefined,
            },
          }));
        }

        // Always reset form to empty state - forms should not be pre-filled
        if (currentStatusFromDb === "To-Be Design") {
          setToBeDesignData({
            workflowDiagram: "",
            workflowDiagramFile: undefined,
            exceptionHandlingPlan: "",
            exceptionHandlingPlanFile: undefined,
            retryMechanismRequired: false,
            retryMechanismDetails: "",
            credentialRequirements: "",
            vmInfraNeeded: "",
            orchestratorQueuesRequired: false,
            loggingRequirements: "",
            sddDocument: "",
            sddApprovalStatus: undefined,
          });
        }

        if (stages.approval) {
          // Update selectedProcess.approvalData so the overview section shows the data from database
          // Handle BIT type: 1 = Approved, 0 = Pending (default)
          const approvalDataFromDb = {
            // ✅ FIXED: Use mapApprovalStatus helper - ONLY check BIT flags
            businessOwnerApproval: mapApprovalStatus(stages.approval.BusinessOwnerApproval),
            rpaCoEApproval: mapApprovalStatus(stages.approval.RPA_Approval),
            comments: {
              businessOwner:
                stages.approval.BO_ApprovalNote ??
                stages.approval.bo_approval_note ??
                stages.approval.BusinessOwnerApprovalNote ??
                stages.approval.business_owner_approval_note ??
                "",
              rpaCoE:
                stages.approval.RPA_ApprovalNote ??
                stages.approval.rpa_approval_note ??
                stages.approval.RPAApprovalNote ??
                stages.approval.rpa_approval_note ??
                "",
            },
          };
          setSelectedProcess((prev) => ({
            ...prev,
            approvalData: approvalDataFromDb,
          }));
          // Also sync approvalData state
          setApprovalData({
            businessOwnerApproval: approvalDataFromDb.businessOwnerApproval,
            rpaCoEApproval: approvalDataFromDb.rpaCoEApproval,
          });
          setApprovalComments(approvalDataFromDb.comments);
        }

        // DO NOT reset approval data here - it was already loaded from database above
        // Approval status should always come from database, not be reset to undefined
        // Only reset form inputs if there's no approval data in database
        if (
          currentStatusFromDb === "Approval" &&
          !detailedProcess.approvalData
        ) {
          // Only reset if no approval data exists in database
          setApprovalData({
            businessOwnerApproval: "Pending",
            rpaCoEApproval: "Pending",
          });
          setApprovalComments({
            businessOwner: "",
            rpaCoE: "",
          });
        }

        if (stages.development) {
          // Update selectedProcess.developmentData so the overview section shows the data from database
          setSelectedProcess((prev) => ({
            ...prev,
            developmentData: {
              developmentStartDate: stages.development.DevelopmentStartDate
                ? new Date(
                    stages.development.DevelopmentStartDate
                  ).toISOString()
                : "",
              devVmAccessProvided:
                stages.development.DevVmAccessProvided ?? false,
              applicationsAccessCompleted:
                stages.development.ApplicationsAccessCompleted ?? false,
              workflowDevelopmentStatus:
                stages.development.WorkflowDevelopmentStatus ?? 0,
              configFileProvided:
                stages.development.ConfigFileProvided ?? false,
              exceptionHandlingImplemented:
                stages.development.ExceptionHandlingImplemented ?? false,
              loggingImplemented:
                stages.development.LoggingImplemented ?? false,
              unitTestingCompleted:
                stages.development.UnitTestingCompleted ?? false,
              codeReviewStatus: stages.development.CodeReviewStatus as
                | "Approved"
                | "Pending"
                | undefined,
              gitRepoOrBotPackage: stages.development.GitRepoOrBotPackage || "",
              developerNotes: stages.development.DeveloperNotes || "",
            },
          }));
        }

        // Always reset form to empty state - forms should not be pre-filled
        if (currentStatusFromDb === "Development") {
          setDevelopmentData({
            developmentStartDate: "",
            devVmAccessProvided: false,
            applicationsAccessCompleted: false,
            workflowDevelopmentStatus: 0,
            configFileProvided: false,
            exceptionHandlingImplemented: false,
            loggingImplemented: false,
            unitTestingCompleted: false,
            codeReviewStatus: undefined,
            gitRepoOrBotPackage: "",
            developerNotes: "",
          });
        }
      } else {
        // Fallback to process from list if API fails
        setSelectedProcess(process);
        setNextStage(null);
        toast({
          title: "Warning",
          description:
            "Could not load full process details. Showing summary data.",
          variant: "default",
        });
      }
    } catch (error: any) {
      // Fallback to process from list if API fails
      setSelectedProcess(process);
      setNextStage(null);
      toast({
        title: "Error",
        description: error.message || "Failed to load process details",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProcessDetail(false);
    }
  };

  // Extract numeric process ID from string like "P001" -> 1
  const extractProcessId = (processId: string): number => {
    const match = processId.match(/P(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const moveToNextStage = async (processId: string) => {
    // Prevent multiple clicks while moving
    if (isMovingToNextStage) {
      return;
    }

    setIsMovingToNextStage(true);

    // Variable to store message from stored procedure
    let stageMessage: string | null = null;

    try {
      // Use selectedProcess if available, otherwise fall back to processes array
      const process =
        selectedProcess && selectedProcess.id === processId
          ? selectedProcess
          : processes.find((p) => p.id === processId);

      if (!process) {
        toast({
          title: "Error",
          description: "Process not found",
          variant: "destructive",
        });
        setIsMovingToNextStage(false);
        return;
      }

      const currentIndex = processStages.indexOf(process.status);
      if (currentIndex >= processStages.length - 1) {
        toast({
          title: "Already at Final Stage",
          description: "Process is already at the final stage.",
        });
        setIsMovingToNextStage(false);
        return;
      }

      const numericProcessId = extractProcessId(processId);
      if (!numericProcessId) {
        throw new Error("Invalid process ID");
      }

      // Save stage data to backend before moving
      // Only save triage data when moving FROM "Initial Triage" to next stage (not when moving TO Initial Triage)
      if (process.status === "Initial Triage" && triageData) {
        // Validate required fields when moving from Initial Triage to next stage
        if (
          triageData.isRuleBased === undefined ||
          triageData.isStable === undefined
        ) {
          toast({
            title: "Validation Error",
            description:
              "Please complete the required assessments (Rule-based and Stable process) before moving to the next stage.",
            variant: "destructive",
          });
          setIsMovingToNextStage(false);
          return;
        }

        // Save triage data to backend
        const triageApiData = {
          ProcessId: numericProcessId,
          IsRuleBased: triageData.isRuleBased,
          IsStable: triageData.isStable,
          SystemsInvolved:
            triageData.systemsInvolved.length > 0
              ? triageData.systemsInvolved.join(", ")
              : undefined,
          Blockers:
            triageData.blockers.length > 0
              ? triageData.blockers.join(", ")
              : undefined,
          EstimatedAutomationPercent:
            triageData.estimatedAutomationPercent || undefined,
        };

        try {
          await createInitialTriage(triageApiData);
        } catch (error) {
          throw error;
        }
      } else if (process.status === "System Integration" && sitData) {
        // Save System Integration data to backend
        const sitApiData = {
          ProcessId: numericProcessId,
          Credentials: sitData.credentialRequirements?.trim() || undefined,
          Notes: sitData.testNotes?.trim() || undefined,
        };

        try {
          await createSystemIntegration(sitApiData);
        } catch (error) {
          throw error;
        }
      } else if (process.status === "To-Be Design" && toBeDesignData) {
        // Save TO-BE Design data to backend
        // Files must be sent as File objects, not paths
        // WorkflowFile is required
        if (!toBeDesignData.workflowDiagramFile) {
          toast({
            title: "Validation Error",
            description: "Workflow Diagram file is required. Please select a file.",
            variant: "destructive",
          });
          throw new Error("Workflow Diagram file is required");
        }

        const toBeDesignApiData = {
          ProcessId: numericProcessId,
          WorkflowFile: toBeDesignData.workflowDiagramFile, // Required - File object
          ExceptionFile: toBeDesignData.exceptionHandlingPlanFile || undefined,
          Credentials:
            toBeDesignData.credentialRequirements?.trim() || undefined,
          VirtualMachine: toBeDesignData.vmInfraNeeded?.trim() || undefined,
          LoggingRequirements: toBeDesignData.loggingRequirements?.trim() || undefined,
        };

        try {
          await createToBeDesign(toBeDesignApiData);
        } catch (error) {
          throw error;
        }
      } else if (process.status === "Approval") {
        // Approval stage: Check if both approvals are completed before allowing movement
        const boApproved =
          selectedProcess?.approvalData?.businessOwnerApproval === "Approved";
        const rpaApproved =
          selectedProcess?.approvalData?.rpaCoEApproval === "Approved";
        const bothApproved = boApproved && rpaApproved;

        if (!bothApproved) {
          toast({
            title: "Approvals Required",
            description:
              "Both Business Owner and RPA CoE approvals must be completed before moving to the next stage.",
            variant: "destructive",
          });
          setIsMovingToNextStage(false);
          return;
        }

        // Both approvals are completed - proceed with stage movement
        // The stored procedure has already recorded both approvals, now we move to next stage
        // Get next stage from database to determine if we need to create Development stage
        let nextStageName: string | null = null;
        try {
          const nextStageResponse = await getNextStage(numericProcessId);
          if (nextStageResponse.success && nextStageResponse.nextStage) {
            nextStageName = mapBackendStageToFrontend(
              nextStageResponse.nextStage
            );
          }
        } catch (error) {
          // Fallback to array if database call fails
          const currentIndex = processStages.indexOf(process.status);
          nextStageName = processStages[currentIndex + 1] || null;
        }

        // If next stage is not available from DB, use array fallback
        if (!nextStageName) {
          const currentIndex = processStages.indexOf(process.status);
          nextStageName = processStages[currentIndex + 1] || null;
        }

        // Check if next stage is Development and create Development stage entry
        if (nextStageName === "Development") {
          // Create Development stage entry when moving to Development
          try {
            const response = await createDevelopmentStage({
              ProcessId: numericProcessId,
            });
            if (response.success && response.message) {
              stageMessage = response.message;
            }
          } catch (error) {
            throw error;
          }
        } else if (nextStageName === "User Acceptance Testing (HWF)") {
          // Create UAT stage entry when moving to UAT
          try {
            const response = await createUATStage({
              ProcessId: numericProcessId,
            });
            if (response.success && response.message) {
              stageMessage = response.message;
            }
          } catch (error) {
            throw error;
          }
        } else if (nextStageName === "Go-Live & Deployment (HWF)") {
          // Create Go-Live stage entry when moving to Go-Live
          try {
            const response = await createGoLiveStage({
              ProcessId: numericProcessId,
            });
            if (response.success && response.message) {
              stageMessage = response.message;
            }
          } catch (error) {
            throw error;
          }
        } else if (nextStageName === "Hypercare & Stabilization (HWF)") {
          // Create Hypercare stage entry when moving to Hypercare
          try {
            const response = await createHypercareStage({
              ProcessId: numericProcessId,
            });
            if (response.success && response.message) {
              stageMessage = response.message;
            }
          } catch (error) {
            throw error;
          }
        } else if (nextStageName === "Handover to BAU Support") {
          // Create Handover stage entry when moving to Handover
          try {
            const response = await createHandoverStage({
              ProcessId: numericProcessId,
            });
            if (response.success && response.message) {
              stageMessage = response.message;
            }
          } catch (error) {
            throw error;
          }
        }
      } else if (process.status === "Development") {
        // Save Development stage tracking to backend (when already in Development stage)
        try {
          const response = await createDevelopmentStage({
            ProcessId: numericProcessId,
          });
          if (response.success && response.message) {
            stageMessage = response.message;
          }
        } catch (error) {
          throw error;
        }
      } else if (process.status === "User Acceptance Testing (HWF)") {
        // Save UAT stage tracking to backend (when already in UAT stage)
        try {
          const response = await createUATStage({
            ProcessId: numericProcessId,
          });
          if (response.success && response.message) {
            stageMessage = response.message;
          }
        } catch (error) {
          throw error;
        }
      } else if (process.status === "Go-Live & Deployment (HWF)") {
        // Save Go-Live stage tracking to backend (when already in Go-Live stage)
        try {
          const response = await createGoLiveStage({
            ProcessId: numericProcessId,
          });
          if (response.success && response.message) {
            stageMessage = response.message;
          }
        } catch (error) {
          throw error;
        }
      } else if (process.status === "Hypercare & Stabilization (HWF)") {
        // Save Hypercare stage tracking to backend (when already in Hypercare stage)
        try {
          const response = await createHypercareStage({
            ProcessId: numericProcessId,
          });
          if (response.success && response.message) {
            stageMessage = response.message;
          }
        } catch (error) {
          throw error;
        }
      } else if (process.status === "Handover to BAU Support") {
        // Save Handover stage tracking to backend (when already in Handover stage)
        try {
          const response = await createHandoverStage({
            ProcessId: numericProcessId,
          });
          if (response.success && response.message) {
            stageMessage = response.message;
          }
        } catch (error) {
          throw error;
        }
      }

      // Update stage tracking to mark current stage as completed
      const backendStageName = mapFrontendStageToBackend(process.status);
      try {
        await updateStageTrackingCompleted({
          ProcessId: numericProcessId,
          StageName: backendStageName,
        });
      } catch (error) {
        throw error;
      }

      // Refresh process detail from database to show updated stage data (includes updated status)
      let refreshedProcess: any = null;
      let refreshedStages: any = null;
      try {
        const refreshResponse = await getProcessDetail(numericProcessId);
        if (refreshResponse.success) {
          refreshedProcess = refreshResponse.process;
          refreshedStages = refreshResponse.stages || {};
        }
      } catch (error) {
      }

      // Get the next stage from the database or calculate from processStages array
      const nextStage = processStages[currentIndex + 1];

      setProcesses((prevProcesses) =>
        prevProcesses.map((p) => {
          if (p.id === processId) {
            // Preserve triage data when moving from triage stage
            if (p.status === "Initial Triage" && triageData) {
              return {
                ...p,
                status: nextStage,
                triageData: {
                  isRuleBased: triageData.isRuleBased,
                  isStable: triageData.isStable,
                  volumes: triageData.volumes,
                  systemsInvolved: triageData.systemsInvolved,
                  applicationsCount: triageData.applicationsCount,
                  blockers: triageData.blockers,
                  estimatedAutomationPercent:
                    triageData.estimatedAutomationPercent,
                  initialROI: triageData.initialROI,
                  feasibilityStatus: triageData.feasibilityStatus,
                  triageNotes: triageData.triageNotes,
                },
              };
            }
            // Preserve approval data when moving from approval stage
            if (p.status === "Approval" && approvalData) {
              return {
                ...p,
                status: nextStage,
                approvalData: {
                  businessOwnerApproval: approvalData.businessOwnerApproval,
                  rpaCoEApproval: approvalData.rpaCoEApproval,
                  comments: approvalComments,
                },
              };
            }
            // Preserve TO-BE design data when moving from TO-BE design stage
            if (p.status === "To-Be Design" && toBeDesignData) {
              return {
                ...p,
                status: nextStage,
                toBeDesignData: {
                  workflowDiagram: toBeDesignData.workflowDiagram,
                  exceptionHandlingPlan: toBeDesignData.exceptionHandlingPlan,
                  retryMechanismRequired: toBeDesignData.retryMechanismRequired,
                  retryMechanismDetails: toBeDesignData.retryMechanismDetails,
                  credentialRequirements: toBeDesignData.credentialRequirements,
                  vmInfraNeeded: toBeDesignData.vmInfraNeeded,
                  orchestratorQueuesRequired:
                    toBeDesignData.orchestratorQueuesRequired,
                  loggingRequirements: toBeDesignData.loggingRequirements,
                  sddDocument: toBeDesignData.sddDocument,
                  sddApprovalStatus: toBeDesignData.sddApprovalStatus,
                },
              };
            }
            // Preserve development data when moving from development stage
            if (p.status === "Development" && developmentData) {
              return {
                ...p,
                status: nextStage,
                developmentData: {
                  developmentStartDate: developmentData.developmentStartDate,
                  devVmAccessProvided: developmentData.devVmAccessProvided,
                  applicationsAccessCompleted:
                    developmentData.applicationsAccessCompleted,
                  workflowDevelopmentStatus:
                    developmentData.workflowDevelopmentStatus,
                  configFileProvided: developmentData.configFileProvided,
                  exceptionHandlingImplemented:
                    developmentData.exceptionHandlingImplemented,
                  loggingImplemented: developmentData.loggingImplemented,
                  unitTestingCompleted: developmentData.unitTestingCompleted,
                  codeReviewStatus: developmentData.codeReviewStatus,
                  gitRepoOrBotPackage: developmentData.gitRepoOrBotPackage,
                  developerNotes: developmentData.developerNotes,
                },
              };
            }
            // Preserve SIT data when moving from SIT stage
            if (p.status === "System Integration" && sitData) {
              return {
                ...p,
                status: nextStage,
                sitData: {
                  testNotes: sitData.testNotes,
                  credentialRequirements: sitData.credentialRequirements,
                },
              };
            }
            return { ...p, status: nextStage };
          }
          return p;
        })
      );

      toast({
        title: "Stage Updated! ✅",
        description: `Process ${processId} has been moved to "${nextStage}"`,
      });

      if (selectedProcess && selectedProcess.id === processId) {
        // Use the status from the refreshed process data if available, otherwise calculate from processStages
        const newStatus = refreshedProcess?.CurrentStage
          ? (mapBackendStageToFrontend(
              refreshedProcess.CurrentStage
            ) as ProcessStage)
          : (processStages[
              processStages.indexOf(selectedProcess.status) + 1
            ] as ProcessStage);

        // Update selected process with refreshed stage data from database if available
        // This ensures all saved data is displayed from the database
        if (refreshedProcess || refreshedStages) {
          const refreshedTriage = refreshedStages.initialTriage;
          const updatedProcess: Process = {
            ...selectedProcess,
            status: newStatus,
            // Update all stage data from database - this ensures saved data is displayed
            triageData: refreshedTriage
              ? (() => {
                  const systemsInvolved =
                    refreshedTriage.SystemsInvolved ||
                    refreshedTriage.systems_involved ||
                    "";
                  const blockers =
                    refreshedTriage.Blockers || refreshedTriage.blockers || "";
                  const volumes =
                    refreshedTriage.Volumes || refreshedTriage.volumes || "";
                  const estimatedAutomationPercent =
                    refreshedTriage.EstimatedAutomationPercent ??
                    refreshedTriage.estimated_automation_percent ??
                    0;
                  const initialROI =
                    refreshedTriage.InitialROI ?? refreshedTriage.initial_roi;

                  return {
                    isRuleBased:
                      refreshedTriage.IsRuleBased ??
                      refreshedTriage.is_rule_based ??
                      false,
                    isStable:
                      refreshedTriage.IsStable ??
                      refreshedTriage.is_stable ??
                      false,
                    volumes,
                    systemsInvolved: systemsInvolved
                      ? typeof systemsInvolved === "string"
                        ? systemsInvolved
                            .split(",")
                            .map((s: string) => s.trim())
                            .filter((s: string) => s)
                        : Array.isArray(systemsInvolved)
                        ? systemsInvolved
                        : []
                      : [],
                    applicationsCount:
                      refreshedTriage.ApplicationsCount ??
                      refreshedTriage.applications_count ??
                      0,
                    blockers: blockers
                      ? typeof blockers === "string"
                        ? blockers
                            .split(",")
                            .map((b: string) => b.trim())
                            .filter((b: string) => b)
                        : Array.isArray(blockers)
                        ? blockers
                        : []
                      : [],
                    estimatedAutomationPercent,
                    initialROI: initialROI?.toString() || "",
                    feasibilityStatus: (refreshedTriage.FeasibilityStatus ||
                      refreshedTriage.feasibility_status) as
                      | "Feasible"
                      | "Not Feasible"
                      | "Review Required"
                      | undefined,
                    triageNotes:
                      refreshedTriage.TriageNotes ||
                      refreshedTriage.triage_notes ||
                      "",
                  };
                })()
              : selectedProcess.triageData,
            sitData: refreshedStages.systemIntegration
              ? {
                  testNotes:
                    refreshedStages.systemIntegration.Notes ||
                    refreshedStages.systemIntegration.notes ||
                    refreshedStages.systemIntegration.TestNotes ||
                    refreshedStages.systemIntegration.test_notes ||
                    "",
                  credentialRequirements:
                    refreshedStages.systemIntegration.Credentials ||
                    refreshedStages.systemIntegration.credentials ||
                    "",
                }
              : selectedProcess.sitData,
            toBeDesignData: refreshedStages.toBeDesign
              ? {
                  workflowDiagram:
                    refreshedStages.toBeDesign.WorkflowFile || "",
                  exceptionHandlingPlan:
                    refreshedStages.toBeDesign.ExceptionFile || "",
                  retryMechanismRequired:
                    refreshedStages.toBeDesign.RetryMechanismRequired ?? false,
                  retryMechanismDetails:
                    refreshedStages.toBeDesign.RetryMechanismDetails || "",
                  credentialRequirements:
                    refreshedStages.toBeDesign.Credentials || "",
                  vmInfraNeeded:
                    refreshedStages.toBeDesign.VirtualMachine || "",
                  orchestratorQueuesRequired:
                    refreshedStages.toBeDesign.OrchestratorQueuesRequired ??
                    false,
                  loggingRequirements:
                    refreshedStages.toBeDesign.LoggingInfo || refreshedStages.toBeDesign.LoggingRequirements || "",
                  sddDocument: refreshedStages.toBeDesign.SDDDocument || "",
                  sddApprovalStatus: (refreshedStages.toBeDesign
                    .SDDApprovalStatus || "Pending") as "Approved" | "Pending",
                }
              : selectedProcess.toBeDesignData,
            approvalData: refreshedStages.approval
              ? {
                  // ✅ FIXED: Use mapApprovalStatus helper - ONLY check BIT flags
                  businessOwnerApproval: mapApprovalStatus(refreshedStages.approval.BusinessOwnerApproval),
                  rpaCoEApproval: mapApprovalStatus(refreshedStages.approval.RPA_Approval),
                  comments: {
                    businessOwner:
                      refreshedStages.approval.BO_ApprovalNote ??
                      refreshedStages.approval.bo_approval_note ??
                      refreshedStages.approval.BusinessOwnerApprovalNote ??
                      refreshedStages.approval.business_owner_approval_note ??
                      "",
                    rpaCoE:
                      refreshedStages.approval.RPA_ApprovalNote ??
                      refreshedStages.approval.rpa_approval_note ??
                      refreshedStages.approval.RPAApprovalNote ??
                      refreshedStages.approval.rpa_approval_note ??
                      "",
                  },
                }
              : selectedProcess.approvalData,
          };
          setSelectedProcess(updatedProcess);

          // Update state variables with refreshed data from database
          if (refreshedStages.initialTriage) {
            setTriageData({
              isRuleBased: refreshedStages.initialTriage.IsRuleBased ?? false,
              isStable: refreshedStages.initialTriage.IsStable ?? false,
              volumes: refreshedStages.initialTriage.Volumes || "",
              volumesCaptured: !!refreshedStages.initialTriage.Volumes,
              systemsInvolved: refreshedStages.initialTriage.SystemsInvolved
                ? typeof refreshedStages.initialTriage.SystemsInvolved ===
                  "string"
                  ? refreshedStages.initialTriage.SystemsInvolved.split(",")
                      .map((s) => s.trim())
                      .filter((s) => s)
                  : Array.isArray(refreshedStages.initialTriage.SystemsInvolved)
                  ? refreshedStages.initialTriage.SystemsInvolved
                  : []
                : [],
              systemsIdentified:
                !!refreshedStages.initialTriage.SystemsInvolved,
              applicationsCount:
                refreshedStages.initialTriage.ApplicationsCount ?? 0,
              blockers: refreshedStages.initialTriage.Blockers
                ? typeof refreshedStages.initialTriage.Blockers === "string"
                  ? refreshedStages.initialTriage.Blockers.split(",")
                      .map((b) => b.trim())
                      .filter((b) => b)
                  : Array.isArray(refreshedStages.initialTriage.Blockers)
                  ? refreshedStages.initialTriage.Blockers
                  : []
                : [],
              blockersIdentified: !!refreshedStages.initialTriage.Blockers,
              estimatedAutomationPercent:
                refreshedStages.initialTriage.EstimatedAutomationPercent ?? 0,
              initialROI:
                refreshedStages.initialTriage.InitialROI?.toString() || "",
              roiEstimated: !!refreshedStages.initialTriage.InitialROI,
              feasibilityStatus: refreshedStages.initialTriage
                .FeasibilityStatus as
                | "Feasible"
                | "Not Feasible"
                | "Review Required"
                | undefined,
              feasibilityApproved:
                refreshedStages.initialTriage.FeasibilityStatus === "Feasible",
              triageNotes: refreshedStages.initialTriage.TriageNotes || "",
            });
          }
          if (refreshedStages.systemIntegration) {
            // Handle both PascalCase and snake_case column names from database
            const integration = refreshedStages.systemIntegration;
            setSitData({
              testNotes:
                integration.Notes ||
                integration.notes ||
                integration.TestNotes ||
                integration.test_notes ||
                "",
              credentialRequirements:
                integration.Credentials || integration.credentials || "",
            });
          }
          if (refreshedStages.toBeDesign) {
            setToBeDesignData({
              workflowDiagram: refreshedStages.toBeDesign.WorkflowFile || "",
              workflowDiagramFile: undefined, // File objects only set when user uploads
              exceptionHandlingPlan:
                refreshedStages.toBeDesign.ExceptionFile || "",
              exceptionHandlingPlanFile: undefined, // File objects only set when user uploads
              retryMechanismRequired:
                refreshedStages.toBeDesign.RetryMechanismRequired ?? false,
              retryMechanismDetails:
                refreshedStages.toBeDesign.RetryMechanismDetails || "",
              credentialRequirements:
                refreshedStages.toBeDesign.Credentials || "",
              vmInfraNeeded: refreshedStages.toBeDesign.VirtualMachine || "",
              orchestratorQueuesRequired:
                refreshedStages.toBeDesign.OrchestratorQueuesRequired ?? false,
              loggingRequirements:
                refreshedStages.toBeDesign.LoggingInfo || refreshedStages.toBeDesign.LoggingRequirements || "",
              sddDocument: refreshedStages.toBeDesign.SDDDocument || "",
              sddApprovalStatus: (refreshedStages.toBeDesign
                .SDDApprovalStatus || "Pending") as "Approved" | "Pending",
            });
          }
          if (refreshedStages.approval) {
            // Database BIT: 1 = Approved, 0 = Pending (default)
            // ✅ FIXED: Use mapApprovalStatus helper - ONLY check BIT flags
            setApprovalData({
              businessOwnerApproval: mapApprovalStatus(refreshedStages.approval.BusinessOwnerApproval),
              rpaCoEApproval: mapApprovalStatus(refreshedStages.approval.RPA_Approval),
            });
            setApprovalComments({
              businessOwner:
                refreshedStages.approval.BO_ApprovalNote ??
                refreshedStages.approval.bo_approval_note ??
                refreshedStages.approval.BusinessOwnerApprovalNote ??
                refreshedStages.approval.business_owner_approval_note ??
                "",
              rpaCoE:
                refreshedStages.approval.RPA_ApprovalNote ??
                refreshedStages.approval.rpa_approval_note ??
                refreshedStages.approval.RPAApprovalNote ??
                refreshedStages.approval.rpa_approval_note ??
                "",
            });
          }
        } else {
          // Fallback: update status only if refresh failed
          setSelectedProcess({ ...selectedProcess, status: newStatus });
        }

        // Refresh next stage from database after moving - use exact name from DB
        // This should be done after selectedProcess is updated with new status
        // Make this non-blocking so loading state resets immediately
        getNextStage(numericProcessId)
          .then((nextStageResponse) => {
            if (nextStageResponse.success && nextStageResponse.nextStage) {
              // Verify next stage is different from current stage
              const currentStageFromDb = nextStageResponse.currentStage;
              const nextStageFromDb = nextStageResponse.nextStage;
              if (nextStageFromDb !== currentStageFromDb) {
                // Use exact stage name from database, no mapping
                setNextStage(nextStageFromDb);
              } else {
                // Use fallback from processStages array
                const newCurrentIndex = processStages.indexOf(newStatus);
                if (
                  newCurrentIndex >= 0 &&
                  newCurrentIndex < processStages.length - 1
                ) {
                  setNextStage(processStages[newCurrentIndex + 1]);
                } else {
                  setNextStage(null);
                }
              }
            } else {
              setNextStage(null); // No next stage (process completed)
            }
          })
          .catch((error) => {
            // Use fallback on error
            const newCurrentIndex = processStages.indexOf(newStatus);
            if (
              newCurrentIndex >= 0 &&
              newCurrentIndex < processStages.length - 1
            ) {
              setNextStage(processStages[newCurrentIndex + 1]);
            } else {
              setNextStage(null);
            }
          });

        // Show success message from stored procedure if available
        if (stageMessage) {
          toast({
            title: "Stage Updated",
            description: stageMessage,
            variant: "default",
          });
        } else {
          toast({
            title: "Stage Updated",
            description: `Process moved to ${newStatus} stage successfully.`,
            variant: "default",
          });
        }

        // Update active tab based on new stage - show the current stage form tab as default
        if (newStatus === "Initial Triage") {
          setActiveDetailsTab("triage");
        } else if (newStatus === "System Integration") {
          setActiveDetailsTab("sit");
        } else if (newStatus === "Approval") {
          setActiveDetailsTab("approvals");
        } else if (newStatus === "To-Be Design") {
          setActiveDetailsTab("to-be-design");
        } else {
          // For other stages - show overview
          setActiveDetailsTab("overview");
          // For Development and all stages after Development, show Development tab as default
          const developmentIndex = processStages.indexOf("Development");
          const newStageIndex = processStages.indexOf(newStatus);
          if (newStageIndex >= developmentIndex) {
            // Development stage or later (UAT, Go-Live, Hypercare, Handover)
            setActiveOverviewTab("development");
          } else {
            // Process Registration or earlier stages
            setActiveOverviewTab("basic-info");
          }
        }

        // Clear all form data when moving to next stage - forms should start empty
        setTriageData({
          isRuleBased: undefined,
          isStable: undefined,
          volumes: "",
          volumesCaptured: false,
          systemsInvolved: [],
          systemsIdentified: false,
          applicationsCount: 0,
          blockers: [],
          blockersIdentified: false,
          estimatedAutomationPercent: 0,
          initialROI: "",
          roiEstimated: false,
          feasibilityStatus: undefined,
          feasibilityApproved: false,
          triageNotes: "",
        });
        setSitData({
          testNotes: "",
          credentialRequirements: "",
        });
        setToBeDesignData({
          workflowDiagram: "",
          workflowDiagramFile: undefined,
          exceptionHandlingPlan: "",
          exceptionHandlingPlanFile: undefined,
          retryMechanismRequired: false,
          retryMechanismDetails: "",
          credentialRequirements: "",
          vmInfraNeeded: "",
          orchestratorQueuesRequired: false,
          loggingRequirements: "",
          sddDocument: "",
          sddApprovalStatus: undefined,
        });
        setApprovalData({
          businessOwnerApproval: undefined,
          rpaCoEApproval: undefined,
        });
        setApprovalComments({
          businessOwner: "",
          rpaCoE: "",
        });
        setDevelopmentData({
          developmentStartDate: "",
          devVmAccessProvided: false,
          applicationsAccessCompleted: false,
          workflowDevelopmentStatus: 0,
          configFileProvided: false,
          exceptionHandlingImplemented: false,
          loggingImplemented: false,
          unitTestingCompleted: false,
          codeReviewStatus: undefined,
          gitRepoOrBotPackage: "",
          developerNotes: "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Stage Update Failed",
        description:
          error.message ||
          "An error occurred while moving to the next stage. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Always reset loading state when operation completes (success or error)
      setIsMovingToNextStage(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 bg-background">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary rounded-2xl opacity-10 blur-3xl"></div>
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
                <p className="text-muted-foreground text-lg">
                  Automation Pipeline & Innovation Hub
                </p>
              </div>
            </div>

            <Dialog
              open={isNewProcessOpen}
              onOpenChange={(open) => {
                setIsNewProcessOpen(open);
                if (!open) {
                  setIsEditMode(false);
                  setEditingProcessId(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Submit Process
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-gradient-to-br from-card via-card to-muted/20 border-2 border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                      <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      {isEditMode
                        ? "Edit Process Registration"
                        : "Process Registration"}
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-base text-muted-foreground">
                    {isEditMode
                      ? "Update the process registration details"
                      : "Complete all required fields to register your process in the RPA pipeline"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                  {/* Basic Information Section */}
                  <Card className="bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="title"
                            className="text-sm font-semibold flex items-center gap-1"
                          >
                            Process Title{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="title"
                            placeholder="e.g., Invoice Processing Automation"
                            className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-sm"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="department"
                            className="text-sm font-semibold flex items-center gap-1"
                          >
                            Department{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={formData.department}
                            onValueChange={(value) =>
                              setFormData({ ...formData, department: value })
                            }
                          >
                            <SelectTrigger className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-sm">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {departments.slice(1).map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="description"
                          className="text-sm font-semibold flex items-center gap-1"
                        >
                          Process Description{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the current manual process, pain points, and expected outcomes..."
                          className="min-h-28 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-sm resize-none"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="priority"
                            className="text-sm font-semibold flex items-center gap-1"
                          >
                            Priority / Criticality Level{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={formData.priority}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                priority: value as
                                  | "Low"
                                  | "Medium"
                                  | "High"
                                  | "Critical",
                              })
                            }
                          >
                            <SelectTrigger className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-sm">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="expectedROI"
                            className="text-sm font-semibold flex items-center gap-2"
                          >
                            Expected ROI ($)
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          </Label>
                          <Input
                            id="expectedROI"
                            type="number"
                            placeholder="250000"
                            className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/30 shadow-sm"
                            value={formData.expectedROI}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expectedROI: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stakeholders & Tags Section */}
                  <Card className="bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Stakeholders & Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          Project Stakeholders
                        </Label>
                        {formData.stakeholders.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30">
                            {formData.stakeholders.map((stakeholder, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                              >
                                <Users className="w-3.5 h-3.5" />
                                {stakeholder}
                                <button
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      stakeholders:
                                        formData.stakeholders.filter(
                                          (_, i) => i !== index
                                        ),
                                    })
                                  }
                                  className="ml-1.5 hover:text-destructive transition-colors"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 relative">
                          <Input
                            placeholder="Add stakeholder name (e.g., John Doe)"
                            value={currentStakeholder}
                            onChange={(e) =>
                              setCurrentStakeholder(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                currentStakeholder.trim()
                              ) {
                                e.preventDefault();
                                setFormData({
                                  ...formData,
                                  stakeholders: [
                                    ...formData.stakeholders,
                                    currentStakeholder.trim(),
                                  ],
                                });
                                setCurrentStakeholder("");
                              }
                            }}
                            className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 shadow-sm pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-100/50 dark:hover:bg-purple-900/30"
                            onClick={() => {
                              if (currentStakeholder.trim()) {
                                setFormData({
                                  ...formData,
                                  stakeholders: [
                                    ...formData.stakeholders,
                                    currentStakeholder.trim(),
                                  ],
                                });
                                setCurrentStakeholder("");
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Type stakeholder name and press Enter or click Add
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          Process Tags
                        </Label>
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30">
                            {formData.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="gap-1.5 px-3 py-1.5 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                              >
                                {tag}
                                <button
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      tags: formData.tags.filter(
                                        (_, i) => i !== index
                                      ),
                                    })
                                  }
                                  className="ml-1.5 hover:text-destructive transition-colors"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 relative">
                          <Input
                            placeholder="Add tag (e.g., Finance, OCR, Automation)"
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && currentTag.trim()) {
                                e.preventDefault();
                                setFormData({
                                  ...formData,
                                  tags: [...formData.tags, currentTag.trim()],
                                });
                                setCurrentTag("");
                              }
                            }}
                            className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 shadow-sm pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-100/50 dark:hover:bg-purple-900/30"
                            onClick={() => {
                              if (currentTag.trim()) {
                                setFormData({
                                  ...formData,
                                  tags: [...formData.tags, currentTag.trim()],
                                });
                                setCurrentTag("");
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Press Enter to add tags for categorizing this process
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* File Uploads Section */}
                  <Card className="bg-gradient-to-br from-green-50/30 dark:from-green-950/10 via-card to-card border-2 border-green-200/50 dark:border-green-800/30 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Supporting Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="dataSamples"
                          className="text-sm font-semibold flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                          Upload Initial Data Samples
                        </Label>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 relative">
                            <Input
                              id="dataSamples"
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 shadow-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                              accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
                            />
                          </div>
                          {dataSamplesUploaded && (
                            <Badge
                              variant="secondary"
                              className="gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Uploaded
                            </Badge>
                          )}
                        </div>
                        {dataSamplesFileName && (
                          <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="truncate">
                                {dataSamplesFileName}
                              </span>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Upload sample data files (Excel, CSV, PDF, Word) to
                          help assess automation feasibility
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <Label
                          htmlFor="sopDocument"
                          className="text-sm font-semibold flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                          Upload SOP Document
                        </Label>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 relative">
                            <Input
                              id="sopDocument"
                              type="file"
                              onChange={handleSOPUpload}
                              className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 shadow-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                              accept=".pdf,.doc,.docx"
                            />
                          </div>
                          {sopDocumentUploaded && (
                            <Badge
                              variant="secondary"
                              className="gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Uploaded
                            </Badge>
                          )}
                        </div>
                        {sopDocumentFileName && (
                          <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="truncate">
                                {sopDocumentFileName}
                              </span>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Upload Standard Operating Procedure (SOP) document
                          (PDF, Word) to help understand the process workflow
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <DialogFooter className="pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsNewProcessOpen(false);
                      setIsEditMode(false);
                      setEditingProcessId(null);
                      setDataSamplesUploaded(false);
                      setSopDocumentUploaded(false);
                      setDataSamplesFileName("");
                      setSopDocumentFileName("");
                      setNewProcessId("");
                    }}
                    className="border-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!isEditMode && !newProcessId) {
                        generateProcessId();
                      }
                      await handleNewProcess();
                    }}
                    className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 px-6"
                    disabled={
                      !formData.title ||
                      !formData.department ||
                      !formData.description ||
                      !formData.priority ||
                      isSubmittingProcess
                    }
                  >
                    {isSubmittingProcess ? (
                      <>
                        <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                        {isEditMode ? "Updating..." : "Registering..."}
                      </>
                    ) : (
                      <>
                        {isEditMode ? (
                          <Save className="w-4 h-4 mr-2" />
                        ) : (
                          <Rocket className="w-4 h-4 mr-2" />
                        )}
                        {isEditMode ? "Update Process" : "Register Process"}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-success border-success/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-success-foreground/80 text-sm font-medium">
                      Total ROI
                    </p>
                    <p className="text-2xl font-bold text-success-foreground">
                      ${(totalROI / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-primary border-primary/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/80 text-sm font-medium">
                      Est. Savings
                    </p>
                    <p className="text-2xl font-bold text-primary-foreground">
                      ${(totalSavings / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-primary-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-warning border-warning/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-warning-foreground/80 text-sm font-medium">
                      Deployed
                    </p>
                    <p className="text-2xl font-bold text-warning-foreground">
                      {deployedCount}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-warning-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      In Pipeline
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {
                        processes.filter(
                          (p) =>
                            p.status !== "Go-Live & Deployment (HWF)" &&
                            p.status !== "Hypercare & Stabilization (HWF)" &&
                            p.status !== "Handover to BAU Support"
                        ).length
                      }
                    </p>
                  </div>
                  <PlayCircle className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger
            value="processes"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Process Pipeline
          </TabsTrigger>
          <TabsTrigger
            value="roi-calculator"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            ROI Calculator
          </TabsTrigger>
          <TabsTrigger
            value="approvals"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-6">
          {/* Process Submission Pipeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                Process Submission Pipeline
              </h2>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setActiveTab("roi-calculator")}
                >
                  <Target className="w-4 h-4" />
                  ROI Calculator
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setActiveTab("approvals")}
                >
                  <Users className="w-4 h-4" />
                  Approval Board
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Business process automation pipeline through 11 stages from intake
              to BAU support handoff
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Process Overview
              </TabsTrigger>
              <TabsTrigger
                value="roadmap"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Automation Roadmap
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Business Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Filters */}
              <Card className="bg-card border-border shadow-card">
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search processes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-muted border-border"
                        />
                      </div>

                      <Select
                        value={departmentFilter}
                        onValueChange={setDepartmentFilter}
                      >
                        <SelectTrigger className="w-40 bg-muted border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="w-48 bg-muted border-border">
                          <SelectValue placeholder="Filter by stage" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50 max-h-[300px]">
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={priorityFilter}
                        onValueChange={setPriorityFilter}
                      >
                        <SelectTrigger className="w-40 bg-muted border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="outline" className="border-border">
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Import
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Process Grid */}
              {isLoadingProcesses ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">
                      Loading processes...
                    </p>
                  </div>
                </div>
              ) : filteredProcesses.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">No processes found</p>
                    <p className="text-sm text-muted-foreground">
                      Create a new process to get started
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProcesses.map((process) => (
                    <Card
                      key={process.id}
                      className="bg-gradient-card border-border shadow-card hover:shadow-elevated transition-all duration-300 group cursor-pointer"
                      onClick={() => handleProcessClick(process)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {process.id}
                            </Badge>
                            <Badge
                              className={getPriorityColor(process.priority)}
                            >
                              {process.priority}
                            </Badge>
                          </div>
                          <Badge className={getStatusColor(process.status)}>
                            {getStatusIcon(process.status)}
                            <span className="ml-1">{process.status}</span>
                          </Badge>
                        </div>

                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {process.title}
                        </CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
                          {process.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Department
                          </span>
                          <Badge variant="outline" className="text-xs">
                            <Building className="w-3 h-3 mr-1" />
                            {process.department}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Expected ROI
                            </span>
                            <span className="font-medium text-success">
                              {process.expectedROI > 0
                                ? `$${process.expectedROI.toLocaleString()}`
                                : "$0"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Pipeline Progress
                            </span>
                            <span className="text-xs font-medium">
                              {Math.round(getStageProgress(process.status))}%
                            </span>
                          </div>
                          <Progress
                            value={getStageProgress(process.status)}
                            className="h-2"
                          />
                        </div>

                        {process.dependencies.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm text-muted-foreground">
                              Dependencies
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {process.dependencies.slice(0, 2).map((dep) => (
                                <Badge
                                  key={dep}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  <Link2 className="w-2 h-2 mr-1" />
                                  {dep}
                                </Badge>
                              ))}
                              {process.dependencies.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{process.dependencies.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {process.submittedBy}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateForDisplay(process.submittedDate)}
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="roadmap">
              <AutomationRoadmap />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-primary border-primary/30 shadow-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary-foreground">
                      <Brain className="w-5 h-5" />
                      AI Business Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-primary-foreground">
                    <div className="space-y-3">
                      <div className="p-3 bg-black/20 rounded-lg">
                        <p className="text-sm font-medium">
                          High-Impact Opportunity
                        </p>
                        <p className="text-xs opacity-90">
                          Finance department shows 340% ROI potential for
                          process automation
                        </p>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg">
                        <p className="text-sm font-medium">
                          Quick Win Identified
                        </p>
                        <p className="text-xs opacity-90">
                          Invoice processing automation can be deployed within 2
                          weeks
                        </p>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg">
                        <p className="text-sm font-medium">
                          Resource Optimization
                        </p>
                        <p className="text-xs opacity-90">
                          Current pipeline can save 2,400 hours annually across
                          departments
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-success" />
                      Success Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                        <span className="text-sm font-medium">
                          Processes Automated
                        </span>
                        <span className="text-lg font-bold text-success">
                          0
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <span className="text-sm font-medium">
                          Hours Saved/Month
                        </span>
                        <span className="text-lg font-bold text-primary">
                          0
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <span className="text-sm font-medium">
                          Cost Reduction
                        </span>
                        <span className="text-lg font-bold text-warning">
                          $0K
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="roi-calculator" className="space-y-6">
          <BusinessROICalculator />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <ApprovalWorkflowBoard />
        </TabsContent>
      </Tabs>

      {/* Process Details Modal */}
      <Dialog
        open={isProcessDetailsOpen}
        onOpenChange={setIsProcessDetailsOpen}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card border-border">
          {isLoadingProcessDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">
                  Loading process details...
                </p>
              </div>
            </div>
          ) : (
            selectedProcess && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm font-mono">
                        {selectedProcess.id}
                      </Badge>
                      <Badge
                        className={getPriorityColor(selectedProcess.priority)}
                      >
                        {selectedProcess.priority}
                      </Badge>
                      <Badge className={getStatusColor(selectedProcess.status)}>
                        {getStatusIcon(selectedProcess.status)}
                        <span className="ml-1">{selectedProcess.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <DialogTitle className="text-2xl text-left">
                    {selectedProcess.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pb-4">
                  <Tabs
                    value={activeDetailsTab}
                    onValueChange={setActiveDetailsTab}
                    className="w-full"
                  >
                    <TabsList
                      className={`grid w-full bg-muted ${
                        selectedProcess.status === "Process Registration"
                          ? "grid-cols-1"
                          : selectedProcess.status === "Initial Triage"
                          ? "grid-cols-2"
                          : selectedProcess.status === "System Integration"
                          ? "grid-cols-2"
                          : (() => {
                              const showApprovalsTab = 
                                selectedProcess.status === "Approval" ||
                                selectedProcess.approvalData?.approvalNeedsReview ||
                                (selectedProcess.approvalData && 
                                 !(selectedProcess.approvalData.businessOwnerApproval === "Approved" && 
                                   selectedProcess.approvalData.rpaCoEApproval === "Approved"));
                              return showApprovalsTab;
                            })()
                          ? "grid-cols-2"
                          : selectedProcess.status === "To-Be Design"
                          ? "grid-cols-2"
                          : "grid-cols-1"
                      }`}
                    >
                      <TabsTrigger
                        value="overview"
                        className="text-base text-foreground data-[state=active]:text-blue-500 font-medium"
                      >
                        Overview
                      </TabsTrigger>
                      {selectedProcess.status === "Initial Triage" && (
                        <TabsTrigger
                          value="triage"
                          className="text-base text-foreground data-[state=active]:text-blue-500 font-medium"
                        >
                          Initial Triage
                        </TabsTrigger>
                      )}
                      {selectedProcess.status === "System Integration" && (
                        <TabsTrigger
                          value="sit"
                          className="text-base text-foreground data-[state=active]:text-blue-500 font-medium"
                        >
                          System Integration
                        </TabsTrigger>
                      )}
                      {(() => {
                        // Show approvals tab if:
                        // 1. Status is "Approval" OR
                        // 2. approvalNeedsReview is true OR
                        // 3. approvalData exists and not both approvals are completed
                        const showApprovalsTab = 
                          selectedProcess.status === "Approval" ||
                          selectedProcess.approvalData?.approvalNeedsReview ||
                          (selectedProcess.approvalData && 
                           !(selectedProcess.approvalData.businessOwnerApproval === "Approved" && 
                             selectedProcess.approvalData.rpaCoEApproval === "Approved"));
                        return showApprovalsTab ? (
                          <TabsTrigger
                            value="approvals"
                            className="text-base text-foreground data-[state=active]:text-blue-500 font-medium"
                          >
                            Approvals
                          </TabsTrigger>
                        ) : null;
                      })()}
                      {selectedProcess.status === "To-Be Design" && (
                        <TabsTrigger
                          value="to-be-design"
                          className="text-base text-foreground data-[state=active]:text-blue-500 font-medium"
                        >
                          TO-BE Design
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <ProcessStageForms
                      selectedProcess={selectedProcess}
                      triageData={triageData}
                      setTriageData={setTriageData}
                      sitData={sitData}
                      setSitData={setSitData}
                      toBeDesignData={toBeDesignData}
                      setToBeDesignData={setToBeDesignData}
                      approvalData={approvalData}
                      setOpenApprovalDialog={setOpenApprovalDialog}
                      getPriorityColor={getPriorityColor}
                      onSaveApprovals={() => selectedProcess && moveToNextStage(selectedProcess.id)}
                      isSavingApprovals={isMovingToNextStage}
                    />

                    {/* TO-BE Design section removed - now in ProcessStageForms component */}
                    {false && selectedProcess.status === "To-Be Design" && (
                      <TabsContent
                        value="to-be-design"
                        className="space-y-6 mt-6"
                      >
                        {/* Header with Progress */}
                        <Card className="bg-gradient-to-br from-orange-50/30 dark:from-orange-950/10 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-orange-50/50 dark:from-orange-950/20 to-transparent border-b border-orange-200/50 dark:border-orange-800/30 pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center border border-orange-300/30 dark:border-orange-700/30">
                                  <DraftingCompass className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    To-Be Design
                                  </CardTitle>
                                  <CardDescription className="text-base mt-2">
                                    Complete all design requirements to finalize
                                    the solution blueprint and move to
                                    development
                                  </CardDescription>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>

                        {/* Document Uploads Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Workflow Diagram */}
                          <Card
                            className={`border-2 transition-all shadow-md hover:shadow-lg ${
                              toBeDesignData.workflowDiagram !== ""
                                ? "border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20"
                                : "border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 to-muted/20 hover:border-blue-400/50 dark:hover:border-blue-600/50"
                            }`}
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                                      toBeDesignData.workflowDiagram !== ""
                                        ? "bg-green-500/10 border-green-300/50 dark:border-green-700/50"
                                        : "bg-blue-500/10 border-blue-300/50 dark:border-blue-700/50"
                                    }`}
                                  >
                                    <Map
                                      className={`w-6 h-6 ${
                                        toBeDesignData.workflowDiagram !== ""
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-blue-600 dark:text-blue-400"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg font-bold">
                                      Workflow Diagram{" "}
                                      <span className="text-destructive">
                                        *
                                      </span>
                                    </CardTitle>
                                    <CardDescription className="text-sm mt-1">
                                      TO-BE Flow
                                    </CardDescription>
                                  </div>
                                </div>
                                {toBeDesignData.workflowDiagram !== "" && (
                                  <Badge className="bg-success text-success-foreground border-success shadow-sm">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Uploaded
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                                  toBeDesignData.workflowDiagram !== ""
                                    ? "bg-green-50/50 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/50"
                                    : "bg-muted/30 border-border hover:bg-muted/50 hover:border-blue-400/50 dark:hover:border-blue-600/50"
                                }`}
                                onClick={() =>
                                  document
                                    .getElementById("workflow-diagram")
                                    ?.click()
                                }
                              >
                                <div
                                  className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                                    toBeDesignData.workflowDiagram !== ""
                                      ? "bg-green-100/50 dark:bg-green-900/20"
                                      : "bg-blue-100/50 dark:bg-blue-900/20"
                                  }`}
                                >
                                  <Upload
                                    className={`w-8 h-8 ${
                                      toBeDesignData.workflowDiagram !== ""
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-blue-600 dark:text-blue-400"
                                    }`}
                                  />
                                </div>
                                <div className="text-base font-semibold text-foreground mb-1">
                                  {toBeDesignData.workflowDiagram
                                    ? toBeDesignData.workflowDiagram.split('/').pop() || toBeDesignData.workflowDiagram
                                    : "Click to upload or drag & drop"}
                                </div>
                                <Input
                                  id="workflow-diagram"
                                  type="file"
                                  onChange={(e) => {
                                    if (
                                      e.target.files &&
                                      e.target.files.length > 0
                                    ) {
                                      const file = e.target.files[0];
                                      
                                      // Store File object directly - will be sent when createToBeDesign is called
                                      setToBeDesignData((prev) => ({
                                        ...prev,
                                        workflowDiagram: file.name, // Store filename for display
                                        workflowDiagramFile: file, // Store File object for create/update
                                      }));
                                      
                                      toast({
                                        title: "File Selected",
                                        description: "Workflow Diagram file selected. It will be uploaded when you proceed to the next stage.",
                                      });
                                    }
                                  }}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.vsd,.vsdx"
                                />
                                {toBeDesignData.workflowDiagram && (
                                  <div className="mt-4 p-3 bg-card rounded-lg border-2 border-green-300/50 dark:border-green-700/50 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                                      <span className="truncate">
                                        {toBeDesignData.workflowDiagram
                                          ? toBeDesignData.workflowDiagram.split('/').pop() || toBeDesignData.workflowDiagram
                                          : ""}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-3">
                                  PDF, DOC, image, or Visio
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Exception Handling Plan */}
                          <Card
                            className={`border-2 transition-all shadow-md hover:shadow-lg ${
                              toBeDesignData.exceptionHandlingPlan !== ""
                                ? "border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20"
                                : "border-yellow-200/50 dark:border-yellow-800/30 bg-gradient-to-br from-yellow-50/30 dark:from-yellow-950/10 to-muted/20 hover:border-yellow-400/50 dark:hover:border-yellow-600/50"
                            }`}
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                                      toBeDesignData.exceptionHandlingPlan !==
                                      ""
                                        ? "bg-green-500/10 border-green-300/50 dark:border-green-700/50"
                                        : "bg-yellow-500/10 border-yellow-300/50 dark:border-yellow-700/50"
                                    }`}
                                  >
                                    <AlertTriangle
                                      className={`w-6 h-6 ${
                                        toBeDesignData.exceptionHandlingPlan !==
                                        ""
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-yellow-600 dark:text-yellow-400"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg font-bold">
                                      Exception Handling Plan{" "}
                                      <span className="text-destructive">
                                        *
                                      </span>
                                    </CardTitle>
                                    <CardDescription className="text-sm mt-1">
                                      Document
                                    </CardDescription>
                                  </div>
                                </div>
                                {toBeDesignData.exceptionHandlingPlan !==
                                  "" && (
                                  <Badge className="bg-success text-success-foreground border-success shadow-sm">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Uploaded
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                                  toBeDesignData.exceptionHandlingPlan !== ""
                                    ? "bg-green-50/50 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/50"
                                    : "bg-muted/30 border-border hover:bg-muted/50 hover:border-yellow-400/50 dark:hover:border-yellow-600/50"
                                }`}
                                onClick={() =>
                                  document
                                    .getElementById("exception-handling-plan")
                                    ?.click()
                                }
                              >
                                <div
                                  className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                                    toBeDesignData.exceptionHandlingPlan !== ""
                                      ? "bg-green-100/50 dark:bg-green-900/20"
                                      : "bg-yellow-100/50 dark:bg-yellow-900/20"
                                  }`}
                                >
                                  <Upload
                                    className={`w-8 h-8 ${
                                      toBeDesignData.exceptionHandlingPlan !==
                                      ""
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-yellow-600 dark:text-yellow-400"
                                    }`}
                                  />
                                </div>
                                <div className="text-base font-semibold text-foreground mb-1">
                                  {toBeDesignData.exceptionHandlingPlan
                                    ? toBeDesignData.exceptionHandlingPlan.split('/').pop() || toBeDesignData.exceptionHandlingPlan
                                    : "Click to upload or drag & drop"}
                                </div>
                                <Input
                                  id="exception-handling-plan"
                                  type="file"
                                  onChange={(e) => {
                                    if (
                                      e.target.files &&
                                      e.target.files.length > 0
                                    ) {
                                      const file = e.target.files[0];
                                      
                                      // Store File object directly - will be sent when createToBeDesign is called
                                      setToBeDesignData((prev) => ({
                                        ...prev,
                                        exceptionHandlingPlan: file.name, // Store filename for display
                                        exceptionHandlingPlanFile: file, // Store File object for create/update
                                      }));
                                      
                                      toast({
                                        title: "File Selected",
                                        description: "Exception Handling Plan file selected. It will be uploaded when you proceed to the next stage.",
                                      });
                                    }
                                  }}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx"
                                />
                                {toBeDesignData.exceptionHandlingPlan && (
                                  <div className="mt-4 p-3 bg-card rounded-lg border-2 border-green-300/50 dark:border-green-700/50 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                                      <span className="truncate">
                                        {toBeDesignData.exceptionHandlingPlan
                                          ? toBeDesignData.exceptionHandlingPlan.split('/').pop() || toBeDesignData.exceptionHandlingPlan
                                          : ""}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-3">
                                  PDF, DOC, or DOCX
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Requirements Section */}
                        <div className="space-y-6">
                          {/* Credential Requirements */}
                          <Card
                            className={`border-2 transition-all shadow-md hover:shadow-lg ${
                              toBeDesignData.credentialRequirements.trim() !==
                              ""
                                ? "border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20"
                                : "border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 to-muted/20 hover:border-purple-400/50 dark:hover:border-purple-600/50"
                            }`}
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                                      toBeDesignData.credentialRequirements.trim() !==
                                      ""
                                        ? "bg-green-500/10 border-green-300/50 dark:border-green-700/50"
                                        : "bg-purple-500/10 border-purple-300/50 dark:border-purple-700/50"
                                    }`}
                                  >
                                    <Lock
                                      className={`w-6 h-6 ${
                                        toBeDesignData.credentialRequirements.trim() !==
                                        ""
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-purple-600 dark:text-purple-400"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg font-bold">
                                      Credential Requirements{" "}
                                      <span className="text-destructive">
                                        *
                                      </span>
                                    </CardTitle>
                                    <CardDescription className="text-sm mt-1">
                                      Specify bot account, AD login, service
                                      accounts, and all authentication methods
                                      needed
                                    </CardDescription>
                                  </div>
                                </div>
                                {toBeDesignData.credentialRequirements.trim() !==
                                  "" && (
                                  <Badge className="bg-success text-success-foreground border-success shadow-sm">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Textarea
                                id="credential-requirements"
                                placeholder="Example:&#10;- Bot Account: RPA_BOT_ACCOUNT&#10;- AD Login: domain\service_account&#10;- Service Accounts: SAP_SERVICE, CRM_SERVICE&#10;- Authentication: OAuth 2.0, API Keys"
                                value={toBeDesignData.credentialRequirements}
                                onChange={(e) =>
                                  setToBeDesignData((prev) => ({
                                    ...prev,
                                    credentialRequirements: e.target.value,
                                  }))
                                }
                                className="min-h-40 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 text-sm leading-relaxed font-mono shadow-sm"
                              />
                            </CardContent>
                          </Card>

                          {/* VM/Infrastructure Needed */}
                          <Card
                            className={`border-2 transition-all shadow-md hover:shadow-lg ${
                              toBeDesignData.vmInfraNeeded.trim() !== ""
                                ? "border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20"
                                : "border-green-200/50 dark:border-green-800/30 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20 hover:border-green-400/50 dark:hover:border-green-600/50"
                            }`}
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                                      toBeDesignData.vmInfraNeeded.trim() !== ""
                                        ? "bg-green-500/10 border-green-300/50 dark:border-green-700/50"
                                        : "bg-green-500/10 border-green-300/50 dark:border-green-700/50"
                                    }`}
                                  >
                                    <Building
                                      className={`w-6 h-6 ${
                                        toBeDesignData.vmInfraNeeded.trim() !==
                                        ""
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-green-600 dark:text-green-400"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg font-bold">
                                      VM/Infrastructure Needed{" "}
                                      <span className="text-destructive">
                                        *
                                      </span>
                                    </CardTitle>
                                    <CardDescription className="text-sm mt-1">
                                      Document CPU, RAM, VM count, storage,
                                      network requirements, and infrastructure
                                      dependencies
                                    </CardDescription>
                                  </div>
                                </div>
                                {toBeDesignData.vmInfraNeeded.trim() !== "" && (
                                  <Badge className="bg-success text-success-foreground border-success shadow-sm">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Textarea
                                id="vm-infra-needed"
                                placeholder="Example:&#10;- CPU: 4 vCPU&#10;- RAM: 8 GB&#10;- VM Count: 2 (Primary + Backup)&#10;- Storage: 100 GB SSD&#10;- Network: VPN access required&#10;- Dependencies: Database server, File share"
                                value={toBeDesignData.vmInfraNeeded}
                                onChange={(e) =>
                                  setToBeDesignData((prev) => ({
                                    ...prev,
                                    vmInfraNeeded: e.target.value,
                                  }))
                                }
                                className="min-h-40 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/30 dark:focus:ring-green-400/30 text-sm leading-relaxed shadow-sm"
                              />
                            </CardContent>
                          </Card>

                          {/* Logging Requirements */}
                          <Card
                            className={`border-2 transition-all shadow-md hover:shadow-lg ${
                              toBeDesignData.loggingRequirements.trim() !== ""
                                ? "border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20"
                                : "border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50/30 dark:from-indigo-950/10 to-muted/20 hover:border-indigo-400/50 dark:hover:border-indigo-600/50"
                            }`}
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                                      toBeDesignData.loggingRequirements.trim() !==
                                      ""
                                        ? "bg-green-500/10 border-green-300/50 dark:border-green-700/50"
                                        : "bg-indigo-500/10 border-indigo-300/50 dark:border-indigo-700/50"
                                    }`}
                                  >
                                    <TrendingUp
                                      className={`w-6 h-6 ${
                                        toBeDesignData.loggingRequirements.trim() !==
                                        ""
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-indigo-600 dark:text-indigo-400"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg font-bold">
                                      Logging Requirements{" "}
                                      <span className="text-destructive">
                                        *
                                      </span>
                                    </CardTitle>
                                    <CardDescription className="text-sm mt-1">
                                      Define logging levels (Info/Warn/Error),
                                      monitoring tools, alert mechanisms, and
                                      performance metrics
                                    </CardDescription>
                                  </div>
                                </div>
                                {toBeDesignData.loggingRequirements.trim() !==
                                  "" && (
                                  <Badge className="bg-success text-success-foreground border-success shadow-sm">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Textarea
                                id="logging-requirements"
                                placeholder="Example:&#10;- Logging Levels: Info, Warning, Error&#10;- Monitoring: Application Insights, Splunk&#10;- Alerts: Email notifications for errors, SMS for critical failures&#10;- Performance Metrics: Execution time, success rate, error rate"
                                value={toBeDesignData.loggingRequirements}
                                onChange={(e) =>
                                  setToBeDesignData((prev) => ({
                                    ...prev,
                                    loggingRequirements: e.target.value,
                                  }))
                                }
                                className="min-h-40 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/30 text-sm leading-relaxed shadow-sm"
                              />
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    )}

                    <TabsContent value="overview" className="space-y-4 mt-6">
                      {/* Nested Tabs for Overview */}
                      <Tabs
                        value={activeOverviewTab}
                        onValueChange={setActiveOverviewTab}
                        className="w-full"
                      >
                        <TabsList
                          className="grid w-full bg-gradient-to-r from-muted/80 via-muted to-muted/80 border-2 border-border/50 rounded-lg p-1.5 mb-6 shadow-sm"
                          style={{
                            gridTemplateColumns: `repeat(${
                              1 + // basic-info (always shown)
                              (isStageCompleted(
                                selectedProcess.status,
                                "Initial Triage"
                              )
                                ? 1
                                : 0) + // Triage tab
                              (isStageCompleted(
                                selectedProcess.status,
                                "System Integration"
                              )
                                ? 1
                                : 0) + // System Integration tab
                              (isStageCompleted(
                                selectedProcess.status,
                                "To-Be Design"
                              )
                                ? 1
                                : 0) + // TO-BE Design tab
                              ((isStageCompleted(
                                selectedProcess.status,
                                "Approval"
                              ) || selectedProcess.approvalData?.approvalNeedsReview)
                                ? 1
                                : 0) + // Approval tab
                              (isStageCompleted(
                                selectedProcess.status,
                                "Development"
                              ) || selectedProcess.status === "Development"
                                ? 1
                                : 0) + // Development tab
                              (selectedProcess.securityAssessment ? 1 : 0) +
                              (selectedProcess.risks &&
                              selectedProcess.risks.length > 0
                                ? 1
                                : 0)
                            }, minmax(0, 1fr))`,
                          }}
                        >
                          <TabsTrigger
                            value="basic-info"
                            className="text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 py-2.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Basic Info
                          </TabsTrigger>
                          {isStageCompleted(
                            selectedProcess.status,
                            "Initial Triage"
                          ) && (
                            <TabsTrigger
                              value="triage"
                              className="text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 py-2.5"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                              Triage
                            </TabsTrigger>
                          )}
                          {isStageCompleted(
                            selectedProcess.status,
                            "System Integration"
                          ) && (
                            <TabsTrigger
                              value="sit"
                              className="text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 py-2.5"
                            >
                              <TestTube className="w-3.5 h-3.5" />
                              System Integration
                            </TabsTrigger>
                          )}
                          {isStageCompleted(
                            selectedProcess.status,
                            "To-Be Design"
                          ) && (
                            <TabsTrigger
                              value="to-be-design"
                              className="text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 py-2.5"
                            >
                              <DraftingCompass className="w-3.5 h-3.5" />
                              TO-BE Design
                            </TabsTrigger>
                          )}
                          {(isStageCompleted(
                            selectedProcess.status,
                            "Approval"
                          ) || selectedProcess.approvalData?.approvalNeedsReview) && (
                            <TabsTrigger
                              value="approvals"
                              className="text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 py-2.5"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              Approvals
                            </TabsTrigger>
                          )}
                          {(isStageCompleted(
                            selectedProcess.status,
                            "Development"
                          ) ||
                            selectedProcess.status === "Development") && (
                            <TabsTrigger
                              value="development"
                              className="text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 py-2.5"
                            >
                              <Code className="w-3.5 h-3.5" />
                              Development
                            </TabsTrigger>
                          )}
                          {selectedProcess.securityAssessment && (
                            <TabsTrigger
                              value="security"
                              className="text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 py-2.5"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              Security
                            </TabsTrigger>
                          )}
                          {selectedProcess.risks &&
                            selectedProcess.risks.length > 0 && (
                              <TabsTrigger
                                value="risks"
                                className="text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 py-2.5"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Risks
                              </TabsTrigger>
                            )}
                        </TabsList>

                        {/* Basic Info Tab */}
                        <TabsContent value="basic-info" className="space-y-5">
                          {/* Edit Button */}
                          <div className="flex justify-end mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Set edit mode and populate form
                                setIsEditMode(true);
                                setEditingProcessId(selectedProcess.id);
                                setFormData({
                                  title: selectedProcess.title,
                                  department: selectedProcess.department,
                                  description: selectedProcess.description,
                                  priority: selectedProcess.priority,
                                  expectedROI:
                                    selectedProcess.expectedROI.toString(),
                                  stakeholders: selectedProcess.stakeholders,
                                  tags: selectedProcess.tags,
                                });
                                setDataSamplesFileName(
                                  selectedProcess.registrationDocuments
                                    ?.dataSamples || ""
                                );
                                setSopDocumentFileName(
                                  selectedProcess.registrationDocuments
                                    ?.sopDocument || ""
                                );
                                setDataSamplesUploaded(
                                  !!selectedProcess.registrationDocuments
                                    ?.dataSamples
                                );
                                setSopDocumentUploaded(
                                  !!selectedProcess.registrationDocuments
                                    ?.sopDocument
                                );
                                setIsNewProcessOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Button>
                          </div>

                          {/* Process Description */}
                          <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-2 border-primary/20 shadow-md">
                            <CardContent className="p-5">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                    Description
                                  </p>
                                  <p className="text-base text-foreground leading-relaxed">
                                    {selectedProcess.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Top Row - Basic Info */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <Card className="bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-md hover:shadow-lg transition-shadow">
                              <CardHeader className="bg-gradient-to-r from-blue-50/50 dark:from-blue-950/20 to-transparent border-b border-blue-200/50 dark:border-blue-800/30 pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                  <div className="p-1.5 rounded-lg bg-blue-500/10">
                                    <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  Process Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3 pt-4">
                                <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Department:
                                  </span>
                                  <span className="font-bold text-foreground">
                                    {selectedProcess.department}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Submitted By:
                                  </span>
                                  <span className="font-bold text-foreground">
                                    {selectedProcess.submittedBy}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Submitted Date:
                                  </span>
                                  <span className="font-bold text-foreground">
                                    {new Date(
                                      selectedProcess.submittedDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-50/50 dark:from-green-950/20 via-card to-card border-2 border-green-200/50 dark:border-green-800/30 shadow-md hover:shadow-lg transition-shadow">
                              <CardHeader className="bg-gradient-to-r from-green-50/50 dark:from-green-950/20 to-transparent border-b border-green-200/50 dark:border-green-800/30 pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                  <div className="p-1.5 rounded-lg bg-green-500/10">
                                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  Financial Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-green-50/50 dark:from-green-950/20 to-muted/30 border border-green-200/50 dark:border-green-800/30">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Expected ROI:
                                  </span>
                                  <span className="text-lg font-bold text-success flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    {selectedProcess.expectedROI > 0
                                      ? `$${selectedProcess.expectedROI.toLocaleString()}`
                                      : "$0"}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30 shadow-md hover:shadow-lg transition-shadow">
                              <CardHeader className="bg-gradient-to-r from-purple-50/50 dark:from-purple-950/20 to-transparent border-b border-purple-200/50 dark:border-purple-800/30 pb-3">
                                <CardTitle className="text-sm font-bold">
                                  Process Tags & Stakeholders
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4 space-y-4">
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                    Tags
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selectedProcess.tags &&
                                    selectedProcess.tags.length > 0 ? (
                                      selectedProcess.tags.map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="secondary"
                                          className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                                        >
                                          {tag}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        No tags
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="pt-3 border-t border-border">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                    Stakeholders
                                  </p>
                                  {selectedProcess.stakeholders &&
                                  selectedProcess.stakeholders.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {selectedProcess.stakeholders.map(
                                        (stakeholder, index) => (
                                          <Badge
                                            key={index}
                                            variant="outline"
                                            className="text-xs px-2 py-1 border-purple-300 dark:border-purple-700"
                                          >
                                            <Users className="w-3 h-3 mr-1" />
                                            {stakeholder}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      No stakeholders added
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Registration Documents Section */}
                          {selectedProcess.registrationDocuments &&
                            (selectedProcess.registrationDocuments
                              .dataSamples ||
                              selectedProcess.registrationDocuments
                                .sopDocument) && (
                              <Card className="bg-gradient-to-br from-green-50/50 dark:from-green-950/20 via-card to-card border-2 border-green-200/50 dark:border-green-800/30 shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-green-50/50 dark:from-green-950/20 to-transparent border-b border-green-200/50 dark:border-green-800/30 pb-3">
                                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-green-500/10">
                                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    Registration Documents
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                  {selectedProcess.registrationDocuments
                                    .dataSamples && (
                                    <div className="group relative">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-300/30 dark:border-green-700/30">
                                          <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                          <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                            Data Samples
                                          </Label>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1.5" />
                                          Uploaded
                                        </Badge>
                                      </div>
                                      <div className="p-4 rounded-lg bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border-2 border-green-200/50 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium text-foreground flex-1">
                                          {
                                            selectedProcess
                                              .registrationDocuments.dataSamples
                                          }
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleDownloadFile(
                                              selectedProcess.registrationDocuments!
                                                .dataSamples!,
                                              "sampledata"
                                            )
                                          }
                                          disabled={downloadingFileType === "sampledata"}
                                          className="flex items-center gap-2"
                                        >
                                          {downloadingFileType === "sampledata" ? (
                                            <>
                                              <RotateCw className="w-4 h-4 animate-spin" />
                                              Downloading...
                                            </>
                                          ) : (
                                            <>
                                              <Download className="w-4 h-4" />
                                              Download
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {selectedProcess.registrationDocuments
                                    .sopDocument && (
                                    <div className="group relative">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-300/30 dark:border-green-700/30">
                                          <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                          <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                            SOP Document
                                          </Label>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1.5" />
                                          Uploaded
                                        </Badge>
                                      </div>
                                      <div className="p-4 rounded-lg bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border-2 border-green-200/50 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium text-foreground flex-1">
                                          {
                                            selectedProcess
                                              .registrationDocuments.sopDocument
                                          }
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleDownloadFile(
                                              selectedProcess.registrationDocuments!
                                                .sopDocument!,
                                              "sopdoc"
                                            )
                                          }
                                          disabled={downloadingFileType === "sopdoc"}
                                          className="flex items-center gap-2"
                                        >
                                          {downloadingFileType === "sopdoc" ? (
                                            <>
                                              <RotateCw className="w-4 h-4 animate-spin" />
                                              Downloading...
                                            </>
                                          ) : (
                                            <>
                                              <Download className="w-4 h-4" />
                                              Download
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                        </TabsContent>

                        {/* Triage Tab */}
                        {/* Show Triage tab if stage is completed OR if we're currently in Initial Triage stage with data */}
                        {(isStageCompleted(
                          selectedProcess.status,
                          "Initial Triage"
                        ) ||
                          (selectedProcess.status === "Initial Triage" &&
                            (selectedProcess.triageData ||
                              triageData.isRuleBased !== undefined ||
                              triageData.isStable !== undefined))) && (
                          <TabsContent value="triage" className="space-y-4">
                            {/* Edit Button */}
                            <div className="flex justify-end mb-4">
                              <Dialog
                                open={isEditingInitialTriage}
                                onOpenChange={setIsEditingInitialTriage}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const triageData =
                                        selectedProcess.triageData;
                                      setEditInitialTriageData({
                                        IsRuleBased: triageData?.isRuleBased,
                                        IsStable: triageData?.isStable,
                                        SystemsInvolved:
                                          triageData?.systemsInvolved?.join(
                                            ", "
                                          ) || "",
                                        Blockers:
                                          triageData?.blockers?.join(", ") ||
                                          "",
                                        EstimatedAutomationPercent:
                                          triageData?.estimatedAutomationPercent?.toString() ||
                                          "",
                                      });
                                    }}
                                    className="gap-2"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl bg-gradient-to-br from-card via-card to-muted/20 border-2 border-border max-h-[90vh] overflow-y-auto">
                                  <DialogHeader className="pb-4 border-b border-border/50">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30">
                                        <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                        Edit Initial Triage
                                      </DialogTitle>
                                    </div>
                                    <DialogDescription className="text-base text-muted-foreground">
                                      Update the initial triage assessment
                                      details
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-6 py-6">
                                    <Card className="bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-lg">
                                      <CardHeader className="bg-gradient-to-r from-blue-50/50 dark:from-blue-950/20 to-transparent border-b border-blue-200/50 dark:border-blue-800/30 pb-4">
                                        <CardTitle className="text-xl font-bold flex items-center gap-3">
                                          <div className="p-2.5 rounded-lg bg-blue-500/10">
                                            <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                          </div>
                                          Initial Triage
                                        </CardTitle>
                                        <CardDescription className="text-base mt-2">
                                          Complete all assessments to determine
                                          RPA feasibility and move to the next
                                          stage
                                        </CardDescription>
                                      </CardHeader>
                                      <CardContent className="space-y-6 pt-6">
                                        {/* Process Assessment */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                                              editInitialTriageData.IsRuleBased
                                                ? "bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border-green-300/50 dark:border-green-700/50 shadow-md"
                                                : "bg-gradient-to-br from-card to-muted/30 border-border hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:shadow-sm"
                                            }`}
                                            onClick={() =>
                                              setEditInitialTriageData({
                                                ...editInitialTriageData,
                                                IsRuleBased:
                                                  !editInitialTriageData.IsRuleBased,
                                              })
                                            }
                                          >
                                            <div
                                              className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                                editInitialTriageData.IsRuleBased
                                                  ? "bg-green-500 border-green-600"
                                                  : "bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600"
                                              }`}
                                            >
                                              {editInitialTriageData.IsRuleBased && (
                                                <Check className="w-4 h-4 text-white stroke-[3]" />
                                              )}
                                            </div>
                                            <Label
                                              htmlFor="edit-rule-based"
                                              className="cursor-pointer flex-1 text-base font-semibold"
                                            >
                                              Rule-based process?
                                            </Label>
                                            <Checkbox
                                              id="edit-rule-based"
                                              checked={
                                                editInitialTriageData.IsRuleBased ===
                                                true
                                              }
                                              onCheckedChange={(checked) =>
                                                setEditInitialTriageData({
                                                  ...editInitialTriageData,
                                                  IsRuleBased: checked === true,
                                                })
                                              }
                                              className="sr-only"
                                            />
                                          </div>
                                          <div
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                                              editInitialTriageData.IsStable
                                                ? "bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border-green-300/50 dark:border-green-700/50 shadow-md"
                                                : "bg-gradient-to-br from-card to-muted/30 border-border hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:shadow-sm"
                                            }`}
                                            onClick={() =>
                                              setEditInitialTriageData({
                                                ...editInitialTriageData,
                                                IsStable:
                                                  !editInitialTriageData.IsStable,
                                              })
                                            }
                                          >
                                            <div
                                              className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                                editInitialTriageData.IsStable
                                                  ? "bg-green-500 border-green-600"
                                                  : "bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600"
                                              }`}
                                            >
                                              {editInitialTriageData.IsStable && (
                                                <Check className="w-4 h-4 text-white stroke-[3]" />
                                              )}
                                            </div>
                                            <Label
                                              htmlFor="edit-stable"
                                              className="cursor-pointer flex-1 text-base font-semibold"
                                            >
                                              Stable process?
                                            </Label>
                                            <Checkbox
                                              id="edit-stable"
                                              checked={
                                                editInitialTriageData.IsStable ===
                                                true
                                              }
                                              onCheckedChange={(checked) =>
                                                setEditInitialTriageData({
                                                  ...editInitialTriageData,
                                                  IsStable: checked === true,
                                                })
                                              }
                                              className="sr-only"
                                            />
                                          </div>
                                        </div>

                                        {/* Triage Form Fields */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 to-muted/20 border border-purple-200/50 dark:border-purple-800/30">
                                            <div className="flex items-center gap-2">
                                              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                              <Label
                                                htmlFor="edit-automation-percent"
                                                className="text-base font-bold"
                                              >
                                                Estimated Automation %
                                              </Label>
                                            </div>
                                            <div className="relative">
                                              <Input
                                                id="edit-automation-percent"
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="0-100"
                                                value={
                                                  editInitialTriageData.EstimatedAutomationPercent
                                                }
                                                onChange={(e) =>
                                                  setEditInitialTriageData({
                                                    ...editInitialTriageData,
                                                    EstimatedAutomationPercent:
                                                      e.target.value,
                                                  })
                                                }
                                                className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-lg font-semibold h-12 pl-4 pr-12 text-foreground placeholder:text-muted-foreground/70 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 shadow-sm"
                                              />
                                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground font-semibold">
                                                %
                                              </span>
                                            </div>
                                            <Progress
                                              value={
                                                parseInt(
                                                  editInitialTriageData.EstimatedAutomationPercent
                                                ) || 0
                                              }
                                              className="h-2"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                              Percentage of process that can be
                                              automated (0-100%)
                                            </p>
                                          </div>

                                          <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 to-muted/20 border border-blue-200/50 dark:border-blue-800/30">
                                            <div className="flex items-center gap-2">
                                              <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                              <Label className="text-base font-bold">
                                                Systems Involved
                                              </Label>
                                            </div>
                                            <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 rounded-md bg-blue-50/20 dark:bg-blue-950/10">
                                              {editInitialTriageData.SystemsInvolved ? (
                                                editInitialTriageData.SystemsInvolved.split(
                                                  ","
                                                )
                                                  .filter((s) => s.trim())
                                                  .map((system, index) => (
                                                    <Badge
                                                      key={index}
                                                      variant="secondary"
                                                      className="gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 text-sm font-medium"
                                                    >
                                                      <Link2 className="w-3 h-3" />
                                                      {system.trim()}
                                                      <button
                                                        onClick={() => {
                                                          const systems =
                                                            editInitialTriageData.SystemsInvolved.split(
                                                              ","
                                                            )
                                                              .filter(
                                                                (_, i) =>
                                                                  i !== index
                                                              )
                                                              .join(", ");
                                                          setEditInitialTriageData(
                                                            {
                                                              ...editInitialTriageData,
                                                              SystemsInvolved:
                                                                systems,
                                                            }
                                                          );
                                                        }}
                                                        className="ml-1 hover:text-destructive transition-colors"
                                                      >
                                                        ×
                                                      </button>
                                                    </Badge>
                                                  ))
                                              ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                  No systems added yet. Type and
                                                  press Enter to add.
                                                </span>
                                              )}
                                            </div>
                                            <div className="relative">
                                              <Input
                                                id="edit-systems-input"
                                                placeholder="Add system (e.g., SAP ERP, CRM)"
                                                onKeyDown={(e) => {
                                                  if (
                                                    e.key === "Enter" &&
                                                    e.currentTarget.value.trim()
                                                  ) {
                                                    const currentSystems =
                                                      editInitialTriageData.SystemsInvolved ||
                                                      "";
                                                    setEditInitialTriageData({
                                                      ...editInitialTriageData,
                                                      SystemsInvolved:
                                                        currentSystems
                                                          ? `${currentSystems}, ${e.currentTarget.value.trim()}`
                                                          : e.currentTarget.value.trim(),
                                                    });
                                                    e.currentTarget.value = "";
                                                  }
                                                }}
                                                className="w-full pr-12 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 shadow-sm"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const input =
                                                    document.getElementById(
                                                      "edit-systems-input"
                                                    ) as HTMLInputElement;
                                                  if (
                                                    input &&
                                                    input.value.trim()
                                                  ) {
                                                    const currentSystems =
                                                      editInitialTriageData.SystemsInvolved ||
                                                      "";
                                                    setEditInitialTriageData({
                                                      ...editInitialTriageData,
                                                      SystemsInvolved:
                                                        currentSystems
                                                          ? `${currentSystems}, ${input.value.trim()}`
                                                          : input.value.trim(),
                                                    });
                                                    input.value = "";
                                                    input.focus();
                                                  }
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 transition-colors"
                                              >
                                                Add
                                              </button>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-red-50/30 dark:from-red-950/10 to-muted/20 border border-red-200/50 dark:border-red-800/30">
                                          <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            <Label className="text-base font-bold">
                                              Blockers / Risks Identified
                                            </Label>
                                          </div>
                                          <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 rounded-md bg-red-50/20 dark:bg-red-950/10">
                                            {editInitialTriageData.Blockers ? (
                                              editInitialTriageData.Blockers.split(
                                                ","
                                              )
                                                .filter((b) => b.trim())
                                                .map((blocker, index) => (
                                                  <Badge
                                                    key={index}
                                                    variant="outline"
                                                    className="gap-1.5 px-3 py-1.5 border-destructive/50 bg-destructive/5 text-destructive text-sm font-medium"
                                                  >
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {blocker.trim()}
                                                    <button
                                                      onClick={() => {
                                                        const blockers =
                                                          editInitialTriageData.Blockers.split(
                                                            ","
                                                          )
                                                            .filter(
                                                              (_, i) =>
                                                                i !== index
                                                            )
                                                            .join(", ");
                                                        setEditInitialTriageData(
                                                          {
                                                            ...editInitialTriageData,
                                                            Blockers: blockers,
                                                          }
                                                        );
                                                      }}
                                                      className="ml-1 hover:text-destructive transition-colors"
                                                    >
                                                      ×
                                                    </button>
                                                  </Badge>
                                                ))
                                            ) : (
                                              <span className="text-xs text-muted-foreground italic">
                                                No blockers added yet. Type and
                                                press Enter or click Add.
                                              </span>
                                            )}
                                          </div>
                                          <div className="relative">
                                            <Input
                                              id="edit-blockers-input"
                                              placeholder="Add blocker or risk (e.g., Legacy system, Security concerns)"
                                              onKeyDown={(e) => {
                                                if (
                                                  e.key === "Enter" &&
                                                  e.currentTarget.value.trim()
                                                ) {
                                                  const currentBlockers =
                                                    editInitialTriageData.Blockers ||
                                                    "";
                                                  setEditInitialTriageData({
                                                    ...editInitialTriageData,
                                                    Blockers: currentBlockers
                                                      ? `${currentBlockers}, ${e.currentTarget.value.trim()}`
                                                      : e.currentTarget.value.trim(),
                                                  });
                                                  e.currentTarget.value = "";
                                                }
                                              }}
                                              className="w-full pr-12 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-red-500 dark:focus:border-red-400 focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/30 shadow-sm"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const input =
                                                  document.getElementById(
                                                    "edit-blockers-input"
                                                  ) as HTMLInputElement;
                                                if (
                                                  input &&
                                                  input.value.trim()
                                                ) {
                                                  const currentBlockers =
                                                    editInitialTriageData.Blockers ||
                                                    "";
                                                  setEditInitialTriageData({
                                                    ...editInitialTriageData,
                                                    Blockers: currentBlockers
                                                      ? `${currentBlockers}, ${input.value.trim()}`
                                                      : input.value.trim(),
                                                  });
                                                  input.value = "";
                                                  input.focus();
                                                }
                                              }}
                                              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 transition-colors"
                                            >
                                              Add
                                            </button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  <DialogFooter className="pt-4 border-t border-border/50">
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        setIsEditingInitialTriage(false)
                                      }
                                      className="px-6"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleUpdateInitialTriage}
                                      className="px-6 bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300"
                                    >
                                      <Save className="w-4 h-4 mr-2" />
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            {(() => {
                              // Use selectedProcess.triageData if available (from DB), otherwise use local triageData state
                              const displayTriageData =
                                selectedProcess.triageData ||
                                (selectedProcess.status === "Initial Triage"
                                  ? {
                                      isRuleBased: triageData.isRuleBased,
                                      isStable: triageData.isStable,
                                      volumes: triageData.volumes,
                                      systemsInvolved:
                                        triageData.systemsInvolved || [],
                                      applicationsCount:
                                        triageData.applicationsCount,
                                      blockers: triageData.blockers || [],
                                      estimatedAutomationPercent:
                                        triageData.estimatedAutomationPercent,
                                      initialROI: triageData.initialROI,
                                      feasibilityStatus:
                                        triageData.feasibilityStatus,
                                      triageNotes: triageData.triageNotes,
                                    }
                                  : null);

                              if (!displayTriageData) {
                                return (
                                  <Card className="bg-card border-border">
                                    <CardContent className="p-8 text-center">
                                      <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                      <p className="text-sm text-muted-foreground">
                                        No triage data available
                                      </p>
                                    </CardContent>
                                  </Card>
                                );
                              }

                              return (
                                <Card className="bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-lg">
                                  <CardHeader className="bg-gradient-to-r from-blue-50/50 dark:from-blue-950/20 to-transparent border-b border-blue-200/50 dark:border-blue-800/30 pb-4">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                      <div className="p-2 rounded-lg bg-blue-500/10">
                                        <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      Triage & Feasibility Assessment
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 to-muted/30 border border-blue-200/50 dark:border-blue-800/30 shadow-sm">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                          <CheckSquare className="w-4 h-4" />
                                          Feasibility Criteria
                                        </p>
                                        <div className="space-y-2.5">
                                          <div className="flex items-center gap-2.5 p-2 rounded-md bg-card">
                                            {displayTriageData.isRuleBased ? (
                                              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                                            ) : (
                                              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                            )}
                                            <span className="text-sm font-medium">
                                              Rule-based
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2.5 p-2 rounded-md bg-card">
                                            {displayTriageData.isStable ? (
                                              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                                            ) : (
                                              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                            )}
                                            <span className="text-sm font-medium">
                                              Stable
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="p-4 rounded-lg bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border border-green-200/50 dark:border-green-800/30 shadow-sm">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                                          Process Volumes
                                        </p>
                                        <p className="text-base font-semibold">
                                          {displayTriageData.volumes ||
                                            "Not specified"}
                                        </p>
                                      </div>
                                      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 to-muted/30 border border-blue-200/50 dark:border-blue-800/30 shadow-sm">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                                          <Link2 className="w-4 h-4" />
                                          Systems
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {displayTriageData.systemsInvolved &&
                                          displayTriageData.systemsInvolved
                                            .length > 0 ? (
                                            displayTriageData.systemsInvolved
                                              .map((system, index) => (
                                                <Badge
                                                  key={index}
                                                  variant="secondary"
                                                  className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                >
                                                  <Link2 className="w-3 h-3 mr-1" />
                                                  {system}
                                                </Badge>
                                              ))
                                          ) : (
                                            <span className="text-xs text-muted-foreground">
                                              No systems
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50/50 dark:from-orange-950/20 to-muted/30 border border-orange-200/50 dark:border-orange-800/30 shadow-sm">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                                          <AlertTriangle className="w-4 h-4" />
                                          Blockers
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {displayTriageData.blockers &&
                                          displayTriageData.blockers.length >
                                            0 ? (
                                            displayTriageData.blockers
                                              .map((blocker, index) => (
                                                <Badge
                                                  key={index}
                                                  variant="outline"
                                                  className="text-xs px-2 py-0.5 border-destructive/50 bg-destructive/5 text-destructive"
                                                >
                                                  {blocker}
                                                </Badge>
                                              ))
                                          ) : (
                                            <span className="text-xs text-muted-foreground">
                                              No blockers
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })()}
                          </TabsContent>
                        )}

                        {/* SIT Tab */}
                        {isStageCompleted(
                          selectedProcess.status,
                          "System Integration"
                        ) && (
                          <TabsContent value="sit" className="space-y-4">
                            {/* Edit Button */}
                            <div className="flex justify-end mb-4">
                              <Dialog
                                open={isEditingSystemIntegration}
                                onOpenChange={setIsEditingSystemIntegration}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditSystemIntegrationData({
                                        Credentials:
                                          selectedProcess.sitData
                                            ?.credentialRequirements || "",
                                        Notes:
                                          selectedProcess.sitData?.testNotes ||
                                          "",
                                      });
                                    }}
                                    className="gap-2"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl bg-gradient-to-br from-card via-card to-muted/20 border-2 border-border max-h-[90vh] overflow-y-auto">
                                  <DialogHeader className="pb-4 border-b border-border/50">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30">
                                        <TestTube className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                      </div>
                                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                        Edit System Integration
                                      </DialogTitle>
                                    </div>
                                    <DialogDescription className="text-base text-muted-foreground">
                                      Update the system integration details
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-6 py-6">
                                    <Card className="bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30 shadow-lg">
                                      <CardHeader className="bg-gradient-to-r from-purple-50/50 dark:from-purple-950/20 to-transparent border-b border-purple-200/50 dark:border-purple-800/30 pb-4">
                                        <CardTitle className="text-xl font-bold flex items-center gap-3">
                                          <div className="p-2.5 rounded-lg bg-purple-500/10">
                                            <TestTube className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                          </div>
                                          System Integration
                                        </CardTitle>
                                        <CardDescription className="text-base mt-2">
                                          Document test execution results,
                                          integration testing outcomes, and any
                                          issues identified during SIT
                                        </CardDescription>
                                      </CardHeader>
                                      <CardContent className="space-y-6 pt-6">
                                        {/* Credential Requirements */}
                                        <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-indigo-50/30 dark:from-indigo-950/10 to-muted/20 border border-indigo-200/50 dark:border-indigo-800/30">
                                          <div className="flex items-center gap-2">
                                            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <Label
                                              htmlFor="edit-credentials"
                                              className="text-base font-bold"
                                            >
                                              Credential Requirements{" "}
                                              <span className="text-destructive">
                                                *
                                              </span>
                                            </Label>
                                            {editSystemIntegrationData.Credentials.trim() !==
                                              "" && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs bg-success/20 text-success border-success"
                                              >
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Completed
                                              </Badge>
                                            )}
                                          </div>
                                          <Textarea
                                            id="edit-credentials"
                                            placeholder="Example:&#10;- Bot Account: RPA_BOT_ACCOUNT&#10;- AD Login: domain\service_account&#10;- Service Accounts: SAP_SERVICE, CRM_SERVICE&#10;- Authentication: OAuth 2.0, API Keys"
                                            value={
                                              editSystemIntegrationData.Credentials
                                            }
                                            onChange={(e) =>
                                              setEditSystemIntegrationData({
                                                ...editSystemIntegrationData,
                                                Credentials: e.target.value,
                                              })
                                            }
                                            className="min-h-40 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/30 text-sm leading-relaxed font-mono shadow-sm"
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            Specify bot account, AD login,
                                            service accounts, and all
                                            authentication methods needed
                                          </p>
                                        </div>

                                        {/* Test Notes */}
                                        <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-teal-50/30 dark:from-teal-950/10 to-muted/20 border border-teal-200/50 dark:border-teal-800/30">
                                          <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                            <Label
                                              htmlFor="edit-notes"
                                              className="text-base font-bold"
                                            >
                                              Test Notes
                                            </Label>
                                          </div>
                                          <Textarea
                                            id="edit-notes"
                                            placeholder="Add any additional notes, observations, or comments about the testing process..."
                                            value={
                                              editSystemIntegrationData.Notes
                                            }
                                            onChange={(e) =>
                                              setEditSystemIntegrationData({
                                                ...editSystemIntegrationData,
                                                Notes: e.target.value,
                                              })
                                            }
                                            className="min-h-32 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-400/30 text-sm leading-relaxed shadow-sm"
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            Optional: Add any additional
                                            comments or observations from the
                                            SIT process
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  <DialogFooter className="pt-4 border-t border-border/50">
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        setIsEditingSystemIntegration(false)
                                      }
                                      className="px-6"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleUpdateSystemIntegration}
                                      className="px-6 bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300"
                                    >
                                      <Save className="w-4 h-4 mr-2" />
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            {selectedProcess.sitData ? (
                              <Card className="bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-purple-50/50 dark:from-purple-950/20 to-transparent border-b border-purple-200/50 dark:border-purple-800/30 pb-4">
                                  <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-purple-500/10">
                                      <TestTube className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    System Integration
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-5">
                                  {selectedProcess.sitData
                                    .credentialRequirements &&
                                    selectedProcess.sitData.credentialRequirements.trim() !==
                                      "" && (
                                      <div className="group relative">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-300/30 dark:border-purple-700/30">
                                            <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                          </div>
                                          <div className="flex-1">
                                            <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                              Credential Requirements
                                            </Label>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1.5" />
                                            Completed
                                          </Badge>
                                        </div>
                                        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 to-muted/30 border-2 border-purple-200/50 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-shadow">
                                          <p className="text-sm whitespace-pre-wrap leading-relaxed font-mono">
                                            {
                                              selectedProcess.sitData
                                                .credentialRequirements
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  {selectedProcess.sitData.testNotes &&
                                    selectedProcess.sitData.testNotes.trim() !==
                                      "" && (
                                      <div className="group relative">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-300/30 dark:border-indigo-700/30">
                                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                          </div>
                                          <div className="flex-1">
                                            <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                              Test Notes
                                            </Label>
                                          </div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50/50 dark:from-indigo-950/20 to-muted/30 border-2 border-indigo-200/50 dark:border-indigo-800/30 shadow-sm hover:shadow-md transition-shadow">
                                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                            {selectedProcess.sitData.testNotes}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  {!selectedProcess.sitData?.credentialRequirements?.trim() &&
                                    !selectedProcess.sitData?.testNotes?.trim() && (
                                      <div className="text-center py-12 text-muted-foreground">
                                        <div className="p-4 rounded-full bg-purple-100/50 dark:bg-purple-900/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                          <TestTube className="w-8 h-8 opacity-50" />
                                        </div>
                                        <p className="text-sm font-medium">
                                          No SIT data has been entered yet.
                                        </p>
                                      </div>
                                    )}
                                </CardContent>
                              </Card>
                            ) : (
                              <Card className="bg-card border-border">
                                <CardContent className="p-8 text-center">
                                  <TestTube className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                  <p className="text-sm text-muted-foreground">
                                    No SIT data available
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                          </TabsContent>
                        )}

                        {/* TO-BE Design Tab */}
                        {isStageCompleted(
                          selectedProcess.status,
                          "To-Be Design"
                        ) && (
                          <TabsContent
                            value="to-be-design"
                            className="space-y-4"
                          >
                            {/* Edit Button */}
                            <div className="flex justify-end mb-4">
                              <Dialog
                                open={isEditingToBeDesign}
                                onOpenChange={setIsEditingToBeDesign}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const designData =
                                        selectedProcess.toBeDesignData;
                                      // Extract filename from path for WorkflowFile/ExceptionFile
                                      const workflowPath = designData?.workflowDiagram || "";
                                      const exceptionPath = designData?.exceptionHandlingPlan || "";
                                      
                                      setEditToBeDesignData({
                                        WorkflowFile: workflowPath ? workflowPath.split('/').pop() || workflowPath : "", // Just filename
                                        WorkflowFilePath: workflowPath, // Full path
                                        ExceptionFile: exceptionPath ? exceptionPath.split('/').pop() || exceptionPath : "", // Just filename
                                        ExceptionFilePath: exceptionPath, // Full path
                                        Credentials:
                                          designData?.credentialRequirements ||
                                          "",
                                        VirtualMachine:
                                          designData?.vmInfraNeeded || "",
                                        LoggingInfo:
                                          designData?.loggingRequirements || "",
                                      });
                                      
                                      // Reset file objects when opening edit dialog
                                      setEditWorkflowFileObject(null);
                                      setEditExceptionFileObject(null);
                                    }}
                                    className="gap-2"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl bg-gradient-to-br from-card via-card to-muted/20 border-2 border-border max-h-[90vh] overflow-y-auto">
                                  <DialogHeader className="pb-4 border-b border-border/50">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/30">
                                        <DraftingCompass className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                      </div>
                                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                        Edit To-Be Design
                                      </DialogTitle>
                                    </div>
                                    <DialogDescription className="text-base text-muted-foreground">
                                      Update the to-be design details
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-6 py-6">
                                    <Card className="bg-gradient-to-br from-orange-50/30 dark:from-orange-950/10 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30 shadow-md">
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                          <DraftingCompass className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                          Design Details
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        {/* Workflow Diagram Upload */}
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                            <Label
                                              htmlFor="edit-workflow-diagram"
                                              className="text-sm font-semibold flex items-center gap-2"
                                            >
                                              <Map className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                              Workflow Diagram{" "}
                                              <span className="text-destructive">
                                                *
                                              </span>
                                            </Label>
                                            {editToBeDesignData.WorkflowFile && (
                                              <Badge
                                                variant="secondary"
                                                className="gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                                              >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Uploaded
                                              </Badge>
                                            )}
                                          </div>
                                          <div
                                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                                              editToBeDesignData.WorkflowFile
                                                ? "bg-green-50/50 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/50"
                                                : "bg-muted/30 border-border hover:bg-muted/50 hover:border-orange-400/50 dark:hover:border-orange-600/50"
                                            }`}
                                            onClick={() =>
                                              document
                                                .getElementById(
                                                  "edit-workflow-diagram"
                                                )
                                                ?.click()
                                            }
                                          >
                                            <div
                                              className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                                                editToBeDesignData.WorkflowFile
                                                  ? "bg-green-100/50 dark:bg-green-900/20"
                                                  : "bg-orange-100/50 dark:bg-orange-900/20"
                                              }`}
                                            >
                                              <Upload
                                                className={`w-6 h-6 ${
                                                  editToBeDesignData.WorkflowFile
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-orange-600 dark:text-orange-400"
                                                }`}
                                              />
                                            </div>
                                            <div className="text-sm font-semibold text-foreground mb-1">
                                              {editToBeDesignData.WorkflowFile
                                                ? editToBeDesignData.WorkflowFile.split('/').pop() || editToBeDesignData.WorkflowFile
                                                : "Click to upload or drag & drop"}
                                            </div>
                                            <Input
                                              id="edit-workflow-diagram"
                                              type="file"
                                              onChange={(e) => {
                                                if (
                                                  e.target.files &&
                                                  e.target.files.length > 0
                                                ) {
                                                  const file = e.target.files[0];
                                                  
                                                  // Store File object directly - will be sent when updateToBeDesign is called
                                                  setEditToBeDesignData({
                                                    ...editToBeDesignData,
                                                    WorkflowFile: file.name, // Just filename for display
                                                    WorkflowFilePath: editToBeDesignData.WorkflowFilePath || "", // Keep existing path if available
                                                  });
                                                  setEditWorkflowFileObject(file); // Store File object for update
                                                  
                                                  toast({
                                                    title: "File Selected",
                                                    description: "Workflow Diagram file selected. It will be uploaded when you save changes.",
                                                  });
                                                }
                                              }}
                                              className="hidden"
                                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.vsd,.vsdx"
                                            />
                                            {editToBeDesignData.WorkflowFile && (
                                              <div className="mt-4 p-3 bg-card rounded-lg border-2 border-green-300/50 dark:border-green-700/50 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2 text-sm font-medium">
                                                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    <span className="truncate">
                                                      {
                                                        editToBeDesignData.WorkflowFile
                                                      }
                                                    </span>
                                                  </div>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      // Handle download
                                                      toast({
                                                        title: "Download",
                                                        description:
                                                          "File download functionality",
                                                      });
                                                    }}
                                                    className="gap-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                                  >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-3">
                                              PDF, DOC, image, or Visio
                                            </p>
                                          </div>
                                        </div>

                                        {/* Exception Handling Plan Upload */}
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                            <Label
                                              htmlFor="edit-exception-handling-plan"
                                              className="text-sm font-semibold flex items-center gap-2"
                                            >
                                              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                              Exception Handling Plan{" "}
                                              <span className="text-destructive">
                                                *
                                              </span>
                                            </Label>
                                            {editToBeDesignData.ExceptionFile && (
                                              <Badge
                                                variant="secondary"
                                                className="gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                                              >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Uploaded
                                              </Badge>
                                            )}
                                          </div>
                                          <div
                                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                                              editToBeDesignData.ExceptionFile
                                                ? "bg-green-50/50 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/50"
                                                : "bg-muted/30 border-border hover:bg-muted/50 hover:border-orange-400/50 dark:hover:border-orange-600/50"
                                            }`}
                                            onClick={() =>
                                              document
                                                .getElementById(
                                                  "edit-exception-handling-plan"
                                                )
                                                ?.click()
                                            }
                                          >
                                            <div
                                              className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                                                editToBeDesignData.ExceptionFile
                                                  ? "bg-green-100/50 dark:bg-green-900/20"
                                                  : "bg-orange-100/50 dark:bg-orange-900/20"
                                              }`}
                                            >
                                              <Upload
                                                className={`w-6 h-6 ${
                                                  editToBeDesignData.ExceptionFile
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-orange-600 dark:text-orange-400"
                                                }`}
                                              />
                                            </div>
                                            <div className="text-sm font-semibold text-foreground mb-1">
                                              {editToBeDesignData.ExceptionFile
                                                ? editToBeDesignData.ExceptionFile.split('/').pop() || editToBeDesignData.ExceptionFile
                                                : "Click to upload or drag & drop"}
                                            </div>
                                            <Input
                                              id="edit-exception-handling-plan"
                                              type="file"
                                              onChange={(e) => {
                                                if (
                                                  e.target.files &&
                                                  e.target.files.length > 0
                                                ) {
                                                  const file = e.target.files[0];
                                                  
                                                  // Store File object directly - will be sent when updateToBeDesign is called
                                                  setEditToBeDesignData({
                                                    ...editToBeDesignData,
                                                    ExceptionFile: file.name, // Just filename for display
                                                    ExceptionFilePath: editToBeDesignData.ExceptionFilePath || "", // Keep existing path if available
                                                  });
                                                  setEditExceptionFileObject(file); // Store File object for update
                                                  
                                                  toast({
                                                    title: "File Selected",
                                                    description: "Exception Handling Plan file selected. It will be uploaded when you save changes.",
                                                  });
                                                }
                                              }}
                                              className="hidden"
                                              accept=".pdf,.doc,.docx"
                                            />
                                            {editToBeDesignData.ExceptionFile && (
                                              <div className="mt-4 p-3 bg-card rounded-lg border-2 border-green-300/50 dark:border-green-700/50 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2 text-sm font-medium">
                                                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    <span className="truncate">
                                                      {
                                                        editToBeDesignData.ExceptionFile
                                                      }
                                                    </span>
                                                  </div>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      // Handle download
                                                      toast({
                                                        title: "Download",
                                                        description:
                                                          "File download functionality",
                                                      });
                                                    }}
                                                    className="gap-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                                  >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-3">
                                              PDF, DOC, or DOCX
                                            </p>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor="edit-credentials-design"
                                            className="text-sm font-semibold flex items-center gap-2"
                                          >
                                            <Lock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                            Credentials
                                          </Label>
                                          <Textarea
                                            id="edit-credentials-design"
                                            value={
                                              editToBeDesignData.Credentials
                                            }
                                            onChange={(e) =>
                                              setEditToBeDesignData({
                                                ...editToBeDesignData,
                                                Credentials: e.target.value,
                                              })
                                            }
                                            placeholder="Enter credential requirements..."
                                            className="min-h-[100px] bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 shadow-sm resize-none"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor="edit-vm"
                                            className="text-sm font-semibold flex items-center gap-2"
                                          >
                                            <Building className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                            Virtual Machine
                                          </Label>
                                          <Input
                                            id="edit-vm"
                                            value={
                                              editToBeDesignData.VirtualMachine
                                            }
                                            onChange={(e) =>
                                              setEditToBeDesignData({
                                                ...editToBeDesignData,
                                                VirtualMachine: e.target.value,
                                              })
                                            }
                                            placeholder="Enter virtual machine details"
                                            className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 shadow-sm"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor="edit-logging"
                                            className="text-sm font-semibold flex items-center gap-2"
                                          >
                                            <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                            Logging Info
                                          </Label>
                                          <Textarea
                                            id="edit-logging"
                                            value={
                                              editToBeDesignData.LoggingInfo
                                            }
                                            onChange={(e) =>
                                              setEditToBeDesignData({
                                                ...editToBeDesignData,
                                                LoggingInfo: e.target.value,
                                              })
                                            }
                                            placeholder="Enter logging requirements..."
                                            className="min-h-[100px] bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 shadow-sm resize-none"
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  <DialogFooter className="pt-4 border-t border-border/50">
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        setIsEditingToBeDesign(false)
                                      }
                                      className="px-6"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleUpdateToBeDesign}
                                      className="px-6 bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300"
                                    >
                                      <Save className="w-4 h-4 mr-2" />
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            {selectedProcess.toBeDesignData ? (
                              <Card className="bg-gradient-to-br from-orange-50/30 dark:from-orange-950/10 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-orange-50/50 dark:from-orange-950/20 to-transparent border-b border-orange-200/50 dark:border-orange-800/30 pb-4">
                                  <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-orange-500/10">
                                      <DraftingCompass className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    To-Be Design
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-6">
                                  {selectedProcess.toBeDesignData
                                    .workflowDiagram &&
                                    selectedProcess.toBeDesignData.workflowDiagram.trim() !==
                                      "" && (
                                      <div className="group relative">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-300/30 dark:border-blue-700/30">
                                            <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                          </div>
                                          <div className="flex-1">
                                            <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                              Workflow Diagram
                                            </Label>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1.5" />
                                            Uploaded
                                          </Badge>
                                        </div>
                                        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 to-muted/30 border-2 border-blue-200/50 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-3">
                                          <p className="text-sm font-medium text-foreground flex-1">
                                            {
                                              selectedProcess.toBeDesignData.workflowDiagram
                                                ? selectedProcess.toBeDesignData.workflowDiagram.split('/').pop() || selectedProcess.toBeDesignData.workflowDiagram
                                                : ""
                                            }
                                          </p>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleDownloadFile(
                                                selectedProcess.toBeDesignData
                                                  .workflowDiagram,
                                                "workflow"
                                              )
                                            }
                                            disabled={downloadingFileType === "workflow"}
                                            className="flex items-center gap-2"
                                          >
                                            {downloadingFileType === "workflow" ? (
                                              <>
                                                <RotateCw className="w-4 h-4 animate-spin" />
                                                Downloading...
                                              </>
                                            ) : (
                                              <>
                                                <Download className="w-4 h-4" />
                                                Download
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                  {selectedProcess.toBeDesignData
                                    .exceptionHandlingPlan &&
                                    selectedProcess.toBeDesignData.exceptionHandlingPlan.trim() !==
                                      "" && (
                                      <div className="group relative">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-300/30 dark:border-yellow-700/30">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                          </div>
                                          <div className="flex-1">
                                            <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                              Exception Handling Plan
                                            </Label>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1.5" />
                                            Uploaded
                                          </Badge>
                                        </div>
                                        <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50/50 dark:from-yellow-950/20 to-muted/30 border-2 border-yellow-200/50 dark:border-yellow-800/30 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-3">
                                          <p className="text-sm font-medium text-foreground flex-1">
                                            {
                                              selectedProcess.toBeDesignData.exceptionHandlingPlan
                                                ? selectedProcess.toBeDesignData.exceptionHandlingPlan.split('/').pop() || selectedProcess.toBeDesignData.exceptionHandlingPlan
                                                : ""
                                            }
                                          </p>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleDownloadFile(
                                                selectedProcess.toBeDesignData
                                                  .exceptionHandlingPlan,
                                                "exception"
                                              )
                                            }
                                            disabled={downloadingFileType === "exception"}
                                            className="flex items-center gap-2"
                                          >
                                            {downloadingFileType === "exception" ? (
                                              <>
                                                <RotateCw className="w-4 h-4 animate-spin" />
                                                Downloading...
                                              </>
                                            ) : (
                                              <>
                                                <Download className="w-4 h-4" />
                                                Download
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                  {selectedProcess.toBeDesignData
                                    .credentialRequirements &&
                                    selectedProcess.toBeDesignData.credentialRequirements.trim() !==
                                      "" && (
                                      <div className="group relative">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-300/30 dark:border-purple-700/30">
                                            <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                          </div>
                                          <div className="flex-1">
                                            <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                              Credential Requirements
                                            </Label>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1.5" />
                                            Completed
                                          </Badge>
                                        </div>
                                        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 to-muted/30 border-2 border-purple-200/50 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-shadow">
                                          <p className="text-sm whitespace-pre-wrap leading-relaxed font-mono">
                                            {
                                              selectedProcess.toBeDesignData
                                                .credentialRequirements
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                  {selectedProcess.toBeDesignData
                                    .vmInfraNeeded &&
                                    selectedProcess.toBeDesignData.vmInfraNeeded.trim() !==
                                      "" && (
                                      <div className="group relative">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-300/30 dark:border-green-700/30">
                                            <Building className="w-5 h-5 text-green-600 dark:text-green-400" />
                                          </div>
                                          <div className="flex-1">
                                            <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                              VM/Infrastructure Requirements
                                            </Label>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1.5" />
                                            Completed
                                          </Badge>
                                        </div>
                                        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border-2 border-green-200/50 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow">
                                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                            {
                                              selectedProcess.toBeDesignData
                                                .vmInfraNeeded
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                  {selectedProcess.toBeDesignData
                                    .loggingRequirements &&
                                    selectedProcess.toBeDesignData.loggingRequirements.trim() !==
                                      "" && (
                                      <div className="group relative">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-300/30 dark:border-indigo-700/30">
                                            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                          </div>
                                          <div className="flex-1">
                                            <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                              Logging Requirements
                                            </Label>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1.5" />
                                            Completed
                                          </Badge>
                                        </div>
                                        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50/50 dark:from-indigo-950/20 to-muted/30 border-2 border-indigo-200/50 dark:border-indigo-800/30 shadow-sm hover:shadow-md transition-shadow">
                                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                            {
                                              selectedProcess.toBeDesignData
                                                .loggingRequirements
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                  {selectedProcess.toBeDesignData.sddDocument &&
                                    selectedProcess.toBeDesignData.sddDocument.trim() !==
                                      "" && (
                                      <div className="group relative">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-teal-500/10 to-teal-600/10 border border-teal-300/30 dark:border-teal-700/30">
                                            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                          </div>
                                          <div className="flex-1">
                                            <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                              SDD Document
                                            </Label>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1.5" />
                                            Uploaded
                                          </Badge>
                                        </div>
                                        <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50/50 dark:from-teal-950/20 to-muted/30 border-2 border-teal-200/50 dark:border-teal-800/30 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-3">
                                          <p className="text-sm font-medium text-foreground flex-1">
                                            {
                                              selectedProcess.toBeDesignData
                                                .sddDocument
                                            }
                                          </p>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              // SDD document download - for now, show a message
                                              // TODO: Create API endpoint for SDD document download
                                              toast({
                                                title: "Info",
                                                description: "SDD Document download API is not yet implemented.",
                                                variant: "default",
                                              });
                                            }}
                                            className="flex items-center gap-2"
                                          >
                                            <Download className="w-4 h-4" />
                                            Download
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                  {selectedProcess.toBeDesignData
                                    .sddApprovalStatus === "Approved" && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        <Label className="text-sm font-semibold">
                                          SDD Approval Status
                                        </Label>
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-success/20 text-success border-success"
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Approved
                                        </Badge>
                                      </div>
                                    </div>
                                  )}

                                  {(!selectedProcess.toBeDesignData
                                    .workflowDiagram ||
                                    selectedProcess.toBeDesignData.workflowDiagram.trim() ===
                                      "") &&
                                    (!selectedProcess.toBeDesignData
                                      .exceptionHandlingPlan ||
                                      selectedProcess.toBeDesignData.exceptionHandlingPlan.trim() ===
                                        "") &&
                                    (!selectedProcess.toBeDesignData
                                      .credentialRequirements ||
                                      selectedProcess.toBeDesignData.credentialRequirements.trim() ===
                                        "") &&
                                    (!selectedProcess.toBeDesignData
                                      .vmInfraNeeded ||
                                      selectedProcess.toBeDesignData.vmInfraNeeded.trim() ===
                                        "") &&
                                    (!selectedProcess.toBeDesignData
                                      .loggingRequirements ||
                                      selectedProcess.toBeDesignData.loggingRequirements.trim() ===
                                        "") &&
                                    (!selectedProcess.toBeDesignData
                                      .sddDocument ||
                                      selectedProcess.toBeDesignData.sddDocument.trim() ===
                                        "") && (
                                      <div className="text-center py-8 text-muted-foreground">
                                        <DraftingCompass className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">
                                          No TO-BE design data has been entered
                                          yet.
                                        </p>
                                        <p className="text-xs mt-1">
                                          Switch to the "TO-BE Design" tab to
                                          add design details.
                                        </p>
                                      </div>
                                    )}
                                </CardContent>
                              </Card>
                            ) : (
                              <Card className="bg-card border-border">
                                <CardContent className="p-8 text-center">
                                  <DraftingCompass className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                  <p className="text-sm text-muted-foreground">
                                    No TO-BE design data available
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                          </TabsContent>
                        )}

                        {/* Approvals Tab */}
                        {(isStageCompleted(
                          selectedProcess.status,
                          "Approval"
                        ) || selectedProcess.approvalData?.approvalNeedsReview) && (
                          <TabsContent value="approvals" className="space-y-4">
                            {selectedProcess.approvalData ? (
                              <>
                                {/* Notification Banner for Review Required */}
                                {selectedProcess.approvalData.approvalNeedsReview && (
                                  <Card className="bg-gradient-to-r from-orange-50/50 dark:from-orange-950/20 to-muted/30 border-2 border-orange-200/50 dark:border-orange-800/30 shadow-md">
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <p className="text-sm font-semibold text-foreground mb-1">
                                            Review Required ⚠️
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Data has been updated in previous stages. Please review the updated data and approve again.
                                          </p>
                                        </div>
                                        <Button
                                          variant="default"
                                          size="sm"
                                          onClick={() => {
                                            // Switch to approvals tab to show the approval buttons
                                            setActiveDetailsTab("approvals");
                                          }}
                                          className="bg-primary text-primary-foreground gap-2"
                                        >
                                          <Pencil className="w-4 h-4" />
                                          Review & Approve Again
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                                <Card className="bg-card border-border">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-primary" />
                                    Approval Status
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                      <Users className="w-5 h-5 text-primary flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm mb-1.5">
                                          Business Owner
                                        </p>
                                        <Badge
                                          variant={
                                            selectedProcess.approvalData
                                              .businessOwnerApproval ===
                                            "Approved"
                                              ? "default"
                                              : "outline"
                                          }
                                          className={`text-xs ${
                                            selectedProcess.approvalData
                                              .businessOwnerApproval ===
                                            "Approved"
                                              ? "bg-success text-success-foreground"
                                              : ""
                                          }`}
                                        >
                                          {selectedProcess.approvalData
                                            .businessOwnerApproval ===
                                          "Approved"
                                            ? "Approved"
                                            : "Pending"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                      <Target className="w-5 h-5 text-primary flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm mb-1.5">
                                          RPA CoE
                                        </p>
                                        <Badge
                                          variant={
                                            selectedProcess.approvalData
                                              .rpaCoEApproval === "Approved"
                                              ? "default"
                                              : "outline"
                                          }
                                          className={`text-xs ${
                                            selectedProcess.approvalData
                                              .rpaCoEApproval === "Approved"
                                              ? "bg-success text-success-foreground"
                                              : ""
                                          }`}
                                        >
                                          {selectedProcess.approvalData
                                            .rpaCoEApproval === "Approved"
                                            ? "Approved"
                                            : "Pending"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  {selectedProcess.approvalData.comments && (
                                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                                      {selectedProcess.approvalData.comments
                                        .businessOwner && (
                                        <div className="p-4 rounded-lg border border-border shadow-sm">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <p className="text-sm font-semibold text-foreground">
                                              Business Owner Comments:
                                            </p>
                                          </div>
                                          <p className="text-sm text-foreground leading-relaxed pl-6">
                                            {
                                              selectedProcess.approvalData
                                                .comments.businessOwner
                                            }
                                          </p>
                                        </div>
                                      )}
                                      {selectedProcess.approvalData.comments
                                        .rpaCoE && (
                                        <div className="p-4 rounded-lg border border-border shadow-sm">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            <p className="text-sm font-semibold text-foreground">
                                              RPA CoE Comments:
                                            </p>
                                          </div>
                                          <p className="text-sm text-foreground leading-relaxed pl-6">
                                            {
                                              selectedProcess.approvalData
                                                .comments.rpaCoE
                                            }
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                              </>
                            ) : null}
                          </TabsContent>
                        )}

                        {/* Development Tab */}
                        {(isStageCompleted(
                          selectedProcess.status,
                          "Development"
                        ) ||
                          selectedProcess.status === "Development") && (
                          <TabsContent
                            value="development"
                            className="space-y-4"
                          >
                            {/* Status Cards - Only for these 5 stages: Development, UAT, Go-Live, Hypercare, Handover */}
                            <div className="space-y-4">
                              {(() => {
                                const currentStage = selectedProcess.status;
                                const currentIndex =
                                  processStages.indexOf(currentStage);
                                const cards: JSX.Element[] = [];

                                // Only these 5 stages should show status cards
                                const trackableStages: ProcessStage[] = [
                                  "Development",
                                  "User Acceptance Testing (HWF)",
                                  "Go-Live & Deployment (HWF)",
                                  "Hypercare & Stabilization (HWF)",
                                  "Handover to BAU Support",
                                ];

                                // Only show cards if current stage is one of the 5 trackable stages or beyond
                                const developmentIndex =
                                  processStages.indexOf("Development");
                                if (currentIndex < developmentIndex) {
                                  // Process is in an earlier stage (Process Registration, Initial Triage, etc.)
                                  // Don't show any cards
                                  return null;
                                }

                                // Show completed stages (only from the 5 trackable stages)
                                trackableStages.forEach((stage) => {
                                  if (isStageCompleted(currentStage, stage)) {
                                    const stageInfo = getStageMessage(stage);
                                    const StageIcon = stageInfo.icon;

                                    // Determine color based on stage
                                    let cardClass =
                                      "bg-gradient-to-br from-green-50/30 dark:from-green-950/10 via-card to-card border-2 border-green-200/50 dark:border-green-800/30";
                                    let iconBgClass =
                                      "bg-green-500/10 border-green-300/50 dark:border-green-700/50";
                                    let iconColorClass =
                                      "text-green-600 dark:text-green-400";

                                    if (stage === "Development") {
                                      cardClass =
                                        "bg-gradient-to-br from-green-50/30 dark:from-green-950/10 via-card to-card border-2 border-green-200/50 dark:border-green-800/30";
                                    } else if (
                                      stage === "User Acceptance Testing (HWF)"
                                    ) {
                                      cardClass =
                                        "bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30";
                                      iconBgClass =
                                        "bg-blue-500/10 border-blue-300/50 dark:border-blue-700/50";
                                      iconColorClass =
                                        "text-blue-600 dark:text-blue-400";
                                    } else if (
                                      stage === "Go-Live & Deployment (HWF)"
                                    ) {
                                      cardClass =
                                        "bg-gradient-to-br from-orange-50/30 dark:from-orange-950/10 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30";
                                      iconBgClass =
                                        "bg-orange-500/10 border-orange-300/50 dark:border-orange-700/50";
                                      iconColorClass =
                                        "text-orange-600 dark:text-orange-400";
                                    } else if (
                                      stage ===
                                      "Hypercare & Stabilization (HWF)"
                                    ) {
                                      cardClass =
                                        "bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30";
                                      iconBgClass =
                                        "bg-purple-500/10 border-purple-300/50 dark:border-purple-700/50";
                                      iconColorClass =
                                        "text-purple-600 dark:text-purple-400";
                                    }

                                    cards.push(
                                      <Card
                                        key={`completed-${stage}`}
                                        className={`${cardClass} shadow-lg`}
                                      >
                                        <CardContent className="p-6">
                                          <div className="flex items-start gap-4">
                                            <div
                                              className={`p-3 rounded-xl ${iconBgClass} border-2 flex-shrink-0`}
                                            >
                                              <CheckCircle
                                                className={`w-6 h-6 ${iconColorClass}`}
                                              />
                                            </div>
                                            <div className="flex-1">
                                              <h3 className="text-lg font-bold text-foreground mb-1">
                                                {stage === "Development"
                                                  ? "Development phase completed."
                                                  : stage ===
                                                    "User Acceptance Testing (HWF)"
                                                  ? "User Acceptance Testing phase completed."
                                                  : stage ===
                                                    "Go-Live & Deployment (HWF)"
                                                  ? "Go-Live & Deployment phase completed."
                                                  : "Hypercare & Stabilization phase completed."}
                                              </h3>
                                              <p className="text-sm text-muted-foreground">
                                                {stage === "Development"
                                                  ? "The bot development has been completed."
                                                  : stage ===
                                                    "User Acceptance Testing (HWF)"
                                                  ? "The bot has completed user acceptance testing."
                                                  : stage ===
                                                    "Go-Live & Deployment (HWF)"
                                                  ? "The bot has been successfully deployed and gone live."
                                                  : "The bot has completed the hypercare period."}
                                              </p>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  }
                                });

                                // Show current active stage (only if it's one of the 5 trackable stages)
                                if (trackableStages.includes(currentStage)) {
                                  const currentStageInfo =
                                    getStageMessage(currentStage);
                                  const CurrentStatusIcon =
                                    currentStageInfo.icon;
                                  const isFinalStage =
                                    currentStage === "Handover to BAU Support";

                                  // Determine card styling for current stage
                                  let currentCardClass =
                                    "bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30";
                                  let currentIconBgClass =
                                    "bg-blue-500/10 border-blue-300/50 dark:border-blue-700/50";
                                  let currentIconColorClass =
                                    "text-blue-600 dark:text-blue-400";

                                  if (currentStage === "Development") {
                                    currentCardClass =
                                      "bg-gradient-to-br from-green-50/30 dark:from-green-950/10 via-card to-card border-2 border-green-200/50 dark:border-green-800/30";
                                    currentIconBgClass =
                                      "bg-green-500/10 border-green-300/50 dark:border-green-700/50";
                                    currentIconColorClass =
                                      "text-green-600 dark:text-green-400";
                                  } else if (
                                    currentStage ===
                                    "User Acceptance Testing (HWF)"
                                  ) {
                                    currentCardClass =
                                      "bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30";
                                    currentIconBgClass =
                                      "bg-blue-500/10 border-blue-300/50 dark:border-blue-700/50";
                                    currentIconColorClass =
                                      "text-blue-600 dark:text-blue-400";
                                  } else if (
                                    currentStage ===
                                    "Go-Live & Deployment (HWF)"
                                  ) {
                                    currentCardClass =
                                      "bg-gradient-to-br from-orange-50/30 dark:from-orange-950/10 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30";
                                    currentIconBgClass =
                                      "bg-orange-500/10 border-orange-300/50 dark:border-orange-700/50";
                                    currentIconColorClass =
                                      "text-orange-600 dark:text-orange-400";
                                  } else if (
                                    currentStage ===
                                    "Hypercare & Stabilization (HWF)"
                                  ) {
                                    currentCardClass =
                                      "bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30";
                                    currentIconBgClass =
                                      "bg-purple-500/10 border-purple-300/50 dark:border-purple-700/50";
                                    currentIconColorClass =
                                      "text-purple-600 dark:text-purple-400";
                                  } else if (
                                    currentStage === "Handover to BAU Support"
                                  ) {
                                    currentCardClass =
                                      "bg-gradient-to-br from-indigo-50/30 dark:from-indigo-950/10 via-card to-card border-2 border-indigo-200/50 dark:border-indigo-800/30";
                                    currentIconBgClass =
                                      "bg-indigo-500/10 border-indigo-300/50 dark:border-indigo-700/50";
                                    currentIconColorClass =
                                      "text-indigo-600 dark:text-indigo-400";
                                  }

                                  cards.push(
                                    <Card
                                      key={`current-${currentStage}`}
                                      className={`${currentCardClass} shadow-lg`}
                                    >
                                      <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                          <div
                                            className={`p-3 rounded-xl ${currentIconBgClass} border-2 flex-shrink-0`}
                                          >
                                            {isFinalStage ? (
                                              <CheckCircle
                                                className={`w-6 h-6 ${currentIconColorClass}`}
                                              />
                                            ) : (
                                              <CurrentStatusIcon
                                                className={`w-6 h-6 ${currentIconColorClass}`}
                                              />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <h3 className="text-lg font-bold text-foreground mb-1">
                                              {isFinalStage
                                                ? `${currentStage} completed.`
                                                : currentStageInfo.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                              {isFinalStage
                                                ? "The process has been successfully completed and handed over to BAU support."
                                                : currentStageInfo.description}
                                            </p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                }

                                return cards.length > 0 ? <>{cards}</> : null;
                              })()}
                            </div>
                          </TabsContent>
                        )}

                        {/* Risks Tab */}
                        <TabsContent value="risks" className="space-y-4">
                          {selectedProcess.risks &&
                          selectedProcess.risks.length > 0 ? (
                            <Card className="bg-card border-border">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-primary" />
                                  Identified Risks
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {selectedProcess.risks.map((risk) => (
                                    <div
                                      key={risk.id}
                                      className="p-2 rounded-lg bg-muted border border-border"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-xs mb-0.5 truncate">
                                            {risk.riskName}
                                          </p>
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {risk.mitigation}
                                          </p>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={`text-xs flex-shrink-0 ${
                                            risk.riskLevel === "High"
                                              ? "bg-destructive/20 text-destructive border-destructive"
                                              : risk.riskLevel === "Medium"
                                              ? "bg-warning/20 text-warning border-warning"
                                              : "bg-success/20 text-success border-success"
                                          }`}
                                        >
                                          {risk.riskLevel}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <Card className="bg-card border-border">
                              <CardContent className="p-8 text-center">
                                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-sm text-muted-foreground">
                                  No risks identified
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {selectedProcess.securityAssessment ? (
                              <Card className="bg-gradient-to-br from-red-50/30 dark:from-red-950/10 via-card to-card border-2 border-red-200/50 dark:border-red-800/30 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-red-50/50 dark:from-red-950/20 to-transparent border-b border-red-200/50 dark:border-red-800/30 pb-4">
                                  <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-red-500/10">
                                      <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    Security Assessment
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                  <div className="grid grid-cols-1 gap-3">
                                    {Object.entries(
                                      selectedProcess.securityAssessment
                                    ).map(([key, value]) => (
                                      <div
                                        key={key}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${
                                          value
                                            ? "bg-success/10 border border-success/30"
                                            : "bg-muted/50 border border-border"
                                        }`}
                                      >
                                        {value ? (
                                          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                        )}
                                        <span className="text-sm font-medium truncate">
                                          {key
                                            .replace(/([A-Z])/g, " $1")
                                            .replace(/^./, (str) =>
                                              str.toUpperCase()
                                            )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ) : (
                              <Card className="bg-gradient-to-br from-red-50/30 dark:from-red-950/10 via-card to-card border-2 border-red-200/50 dark:border-red-800/30 shadow-lg">
                                <CardContent className="p-12 text-center">
                                  <div className="p-4 rounded-full bg-red-100/50 dark:bg-red-900/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <Shield className="w-8 h-8 opacity-50" />
                                  </div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    No security assessment available
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                            {selectedProcess.timelineDates ? (
                              <Card className="bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-blue-50/50 dark:from-blue-950/20 to-transparent border-b border-blue-200/50 dark:border-blue-800/30 pb-4">
                                  <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    Project Timeline
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {selectedProcess.timelineDates
                                      .discoveryStartDate && (
                                      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 to-muted/30 border border-blue-200/50 dark:border-blue-800/30 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                                            <Map className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                          </div>
                                          <p className="text-sm font-bold">
                                            Discovery
                                          </p>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">
                                          {formatDateForDisplay(
                                            selectedProcess.timelineDates
                                              .discoveryStartDate
                                          )}
                                        </p>
                                      </div>
                                    )}
                                    {selectedProcess.timelineDates
                                      .developmentStartDate && (
                                      <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-50/50 dark:from-indigo-950/20 to-muted/30 border border-indigo-200/50 dark:border-indigo-800/30 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="p-1.5 rounded-lg bg-indigo-500/10">
                                            <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                          </div>
                                          <p className="text-sm font-bold">
                                            Development
                                          </p>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">
                                          {formatDateForDisplay(
                                            selectedProcess.timelineDates
                                              .developmentStartDate
                                          )}
                                        </p>
                                      </div>
                                    )}
                                    {selectedProcess.timelineDates
                                      .testingStartDate && (
                                      <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 to-muted/30 border border-purple-200/50 dark:border-purple-800/30 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="p-1.5 rounded-lg bg-purple-500/10">
                                            <TestTube className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                          </div>
                                          <p className="text-sm font-bold">
                                            Testing
                                          </p>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">
                                          {formatDateForDisplay(
                                            selectedProcess.timelineDates
                                              .testingStartDate
                                          )}
                                        </p>
                                      </div>
                                    )}
                                    {selectedProcess.timelineDates
                                      .uatStartDate && (
                                      <div className="p-3 rounded-lg bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border border-green-200/50 dark:border-green-800/30 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="p-1.5 rounded-lg bg-green-500/10">
                                            <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                                          </div>
                                          <p className="text-sm font-bold">
                                            UAT
                                          </p>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">
                                          {formatDateForDisplay(
                                            selectedProcess.timelineDates
                                              .uatStartDate
                                          )}
                                        </p>
                                      </div>
                                    )}
                                    {selectedProcess.timelineDates
                                      .goLiveDate && (
                                      <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50/50 dark:from-orange-950/20 to-muted/30 border border-orange-200/50 dark:border-orange-800/30 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="p-1.5 rounded-lg bg-orange-500/10">
                                            <Rocket className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                          </div>
                                          <p className="text-sm font-bold">
                                            Go-Live
                                          </p>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">
                                          {formatDateForDisplay(
                                            selectedProcess.timelineDates
                                              .goLiveDate
                                          )}
                                        </p>
                                      </div>
                                    )}
                                    {selectedProcess.timelineDates
                                      .stabilizationDate && (
                                      <div className="p-3 rounded-lg bg-gradient-to-br from-pink-50/50 dark:from-pink-950/20 to-muted/30 border border-pink-200/50 dark:border-pink-800/30 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="p-1.5 rounded-lg bg-pink-500/10">
                                            <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                                          </div>
                                          <p className="text-sm font-bold">
                                            Stabilization
                                          </p>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">
                                          {formatDateForDisplay(
                                            selectedProcess.timelineDates
                                              .stabilizationDate
                                          )}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ) : (
                              <Card className="bg-card border-border">
                                <CardContent className="p-8 text-center">
                                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                  <p className="text-sm text-muted-foreground">
                                    No timeline data available
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Pipeline Section - Always shown below all tabs */}
                      <div className="mt-6 pt-6 border-t border-border">
                        <Card className="bg-card border-border">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Rocket className="w-4 h-4 text-primary" />
                              Current Pipeline Stage
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Stage Progress
                                </span>
                                <span className="font-medium">
                                  {Math.round(
                                    getStageProgress(selectedProcess.status)
                                  )}
                                  %
                                </span>
                              </div>
                              <Progress
                                value={getStageProgress(selectedProcess.status)}
                                className="h-2"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2.5 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground mb-0.5">
                                  Current Stage
                                </p>
                                <p className="font-semibold text-sm">
                                  {selectedProcess.status}
                                </p>
                              </div>
                              <div className="p-2.5 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground mb-0.5">
                                  Stage Number
                                </p>
                                <p className="font-semibold text-sm">
                                  {(() => {
                                    const stageIndex = processStages.indexOf(
                                      selectedProcess.status
                                    );
                                    if (stageIndex === -1) {
                                      return `Unknown of ${processStages.length}`;
                                    }
                                    return `${stageIndex + 1} of ${
                                      processStages.length
                                    }`;
                                  })()}
                                </p>
                              </div>
                            </div>
                            <div className="py-4">
                              <div className="flex items-center justify-between w-full">
                                {processStages.map((stage, index) => {
                                  const currentIndex = processStages.indexOf(
                                    selectedProcess.status
                                  );
                                  const isCompleted = index < currentIndex;
                                  const isCurrent = index === currentIndex;
                                  const isPending = index > currentIndex;
                                  return (
                                    <div
                                      key={stage}
                                      className="flex items-center flex-1"
                                    >
                                      <div className="flex flex-col items-center gap-1.5 flex-1">
                                        <div
                                          className={`relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                            isCompleted
                                              ? "bg-success text-success-foreground border-success"
                                              : isCurrent
                                              ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                              : "bg-muted text-muted-foreground border-border"
                                          }`}
                                        >
                                          {isCompleted ? (
                                            <CheckCircle className="w-5 h-5" />
                                          ) : (
                                            <span>{index + 1}</span>
                                          )}
                                        </div>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <p
                                              className={`text-[10px] text-center leading-tight px-0.5 cursor-help ${
                                                isCurrent
                                                  ? "font-semibold text-primary"
                                                  : "text-muted-foreground"
                                              }`}
                                            >
                                              {getAbbreviatedStageName(stage)}
                                            </p>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="top"
                                            className="max-w-xs"
                                          >
                                            <p className="text-xs">
                                              {getStageDisplayName(stage)}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                      {index < processStages.length - 1 && (
                                        <div
                                          className={`flex-1 h-0.5 mx-1 ${
                                            isCompleted
                                              ? "bg-success"
                                              : "bg-border"
                                          }`}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsProcessDetailsOpen(false)}
                  >
                    Close
                  </Button>
                  {(() => {
                    // Get next stage from database if available, otherwise use fallback from processStages array
                    let displayNextStage = nextStage;

                    if (!displayNextStage && selectedProcess) {
                      // Fallback: calculate next stage from processStages array
                      const currentIndex = processStages.indexOf(
                        selectedProcess.status
                      );
                      if (
                        currentIndex >= 0 &&
                        currentIndex < processStages.length - 1
                      ) {
                        displayNextStage = processStages[currentIndex + 1];
                      }
                    }

                    // Safety check: never show the same name as the current stage on the button.
                    // If backend accidentally returns the current stage as "next", force a fallback
                    // to the next entry in processStages or hide the button if none exists.
                    if (displayNextStage === selectedProcess.status) {
                      const currentIndex = processStages.indexOf(
                        selectedProcess.status
                      );
                      if (
                        currentIndex >= 0 &&
                        currentIndex < processStages.length - 1
                      ) {
                        displayNextStage = processStages[currentIndex + 1];
                      } else {
                        displayNextStage = null;
                      }
                    }

                    // For Approval stage, show button only when both approvals are completed
                    // BUT hide it if it's a re-approval scenario (Save button will be shown instead)
                    if (selectedProcess.status === "Approval") {
                      // Check if both approvals are completed
                      const boApproved =
                        selectedProcess.approvalData?.businessOwnerApproval ===
                        "Approved";
                      const rpaApproved =
                        selectedProcess.approvalData?.rpaCoEApproval ===
                        "Approved";
                      const bothApproved = boApproved && rpaApproved;
                      
                      // Check if it's a re-approval scenario (Save button will handle it)
                      const isReApproval = Boolean(selectedProcess.approvalData?.approvalNeedsReview);

                      if (bothApproved && !isReApproval) {
                        // Both approvals completed AND it's NOT a re-approval - show clickable button to move to next stage
                        // (If it's a re-approval, the Save button in ProcessStageForms will handle it)
                        return (
                          <Button
                            className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold"
                            disabled={isMovingToNextStage}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              moveToNextStage(selectedProcess.id);
                            }}
                            type="button"
                          >
                            {isMovingToNextStage ? (
                              <>
                                <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                                Moving to {displayNextStage || "Next Stage"}...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Move to {displayNextStage || "Next Stage"}
                              </>
                            )}
                          </Button>
                        );
                      } else {
                        // Build waiting message
                        const waitingFor: string[] = [];
                        if (!boApproved) waitingFor.push("Business Owner");
                        if (!rpaApproved) waitingFor.push("RPA CoE");
                        const waitingMessage =
                          waitingFor.length > 0
                            ? `Waiting for ${waitingFor.join(
                                " and "
                              )} Approval${waitingFor.length > 1 ? "s" : ""}`
                            : "Waiting for Approval";

                        return (
                          <Button
                            className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold"
                            disabled
                          >
                            <Info className="w-4 h-4 mr-2" />
                            {waitingMessage}
                          </Button>
                        );
                      }
                    }

                    // Show button if we have a next stage and process is not completed
                    if (
                      displayNextStage &&
                      selectedProcess.status !== "Handover to BAU Support"
                    ) {
                      return (
                        <Button
                          className="bg-gradient-primary text-primary-foreground"
                          onClick={() => {
                            moveToNextStage(selectedProcess.id);
                          }}
                          disabled={isMovingToNextStage}
                        >
                          {isMovingToNextStage ? (
                            <>
                              <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                              Moving to {displayNextStage}...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Move to {displayNextStage}
                            </>
                          )}
                        </Button>
                      );
                    } else if (
                      selectedProcess.status === "Handover to BAU Support"
                    ) {
                      return (
                        <Button
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 font-semibold shadow-md"
                          disabled
                        >
                          <Handshake className="w-4 h-4 mr-2" />
                          Process Completed
                        </Button>
                      );
                    }
                    return null;
                  })()}
                </DialogFooter>
              </>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Individual Approval Dialogs */}
      {selectedProcess && (() => {
        // Show approval dialogs if:
        // 1. Status is "Approval" OR
        // 2. approvalNeedsReview is true OR
        // 3. approvalData exists and not both approvals are completed
        return selectedProcess.status === "Approval" ||
               selectedProcess.approvalData?.approvalNeedsReview ||
               (selectedProcess.approvalData && 
                !(selectedProcess.approvalData.businessOwnerApproval === "Approved" && 
                  selectedProcess.approvalData.rpaCoEApproval === "Approved"));
      })() && (
        <>
          {/* Business Owner Approval Dialog - INSERT (First Time) */}
          <Dialog
            open={openApprovalDialog === "business-owner"}
            onOpenChange={(open) => !open && setOpenApprovalDialog(null)}
          >
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Users className="w-7 h-7 text-primary" />
                  Business Owner Approval
                </DialogTitle>
                <DialogDescription className="text-base">
                  Review the process details and provide your approval as the
                  Business Owner
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                {/* Basic Process Information */}
                <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-2 border-primary/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold mb-2 flex items-center gap-2">
                          <FileText className="w-6 h-6 text-primary" />
                          {selectedProcess.title}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                          {selectedProcess.description}
                        </CardDescription>
                      </div>
                      <Badge
                        className={getPriorityColor(selectedProcess.priority)}
                      >
                        {selectedProcess.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Department
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" />
                          {selectedProcess.department}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Expected ROI
                        </p>
                        <p className="text-base font-bold text-success flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          {selectedProcess.expectedROI > 0
                            ? `$${selectedProcess.expectedROI.toLocaleString()}`
                            : "$0"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Submitted By
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          {selectedProcess.submittedBy}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Submitted Date
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          {new Date(
                            selectedProcess.submittedDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Triage Data */}
                <Card className="bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-md">
                  <CardHeader className="bg-blue-50/50 dark:bg-blue-950/30 rounded-t-lg border-b border-blue-200/50 dark:border-blue-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Initial Triage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.triageData &&
                    (selectedProcess.triageData.isRuleBased !== undefined ||
                      selectedProcess.triageData.isStable !== undefined ||
                      (selectedProcess.triageData.estimatedAutomationPercent !==
                        undefined &&
                        selectedProcess.triageData.estimatedAutomationPercent >=
                          0) ||
                      (selectedProcess.triageData.systemsInvolved &&
                        selectedProcess.triageData.systemsInvolved.length >
                          0) ||
                      (selectedProcess.triageData.blockers &&
                        selectedProcess.triageData.blockers.length > 0) ||
                      (selectedProcess.triageData.triageNotes &&
                        selectedProcess.triageData.triageNotes.trim()) ||
                      (selectedProcess.triageData.initialROI &&
                        selectedProcess.triageData.initialROI.trim()) ||
                      (selectedProcess.triageData.volumes &&
                        selectedProcess.triageData.volumes.trim())) ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" />
                              Feasibility Criteria
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                {selectedProcess.triageData.isRuleBased ? (
                                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">
                                  Rule-based Process
                                </span>
                              </div>
                              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                {selectedProcess.triageData.isStable ? (
                                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">
                                  Stable Process
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                              Process Volumes
                            </p>
                            <p className="text-base font-semibold">
                              {selectedProcess.triageData.volumes ||
                                "Not specified"}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                              Estimated Automation %
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">
                                  {selectedProcess.triageData
                                    .estimatedAutomationPercent || 0}
                                  %
                                </span>
                              </div>
                              <Progress
                                value={
                                  selectedProcess.triageData
                                    .estimatedAutomationPercent || 0
                                }
                                className="flex-1 h-2"
                              />
                            </div>
                          </div>
                        </div>
                        {selectedProcess.triageData.systemsInvolved &&
                          selectedProcess.triageData.systemsInvolved.length >
                            0 && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-primary" />
                                Systems Involved
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedProcess.triageData.systemsInvolved.map(
                                  (system, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                    >
                                      <Link2 className="w-3 h-3 mr-1.5" />
                                      {system}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        {selectedProcess.triageData.blockers &&
                          selectedProcess.triageData.blockers.length > 0 && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                Blockers
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedProcess.triageData.blockers.map(
                                  (blocker, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-sm px-3 py-1.5 border-destructive/50 bg-destructive/5 text-destructive"
                                    >
                                      {blocker}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        {selectedProcess.triageData.triageNotes &&
                          selectedProcess.triageData.triageNotes.trim() !==
                            "" && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3">
                                Triage Notes
                              </p>
                              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.triageData.triageNotes}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* System Integration (SIT) Data */}
                <Card className="bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30 shadow-md">
                  <CardHeader className="bg-purple-50/50 dark:bg-purple-950/30 rounded-t-lg border-b border-purple-200/50 dark:border-purple-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <TestTube className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      System Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.sitData &&
                    (selectedProcess.sitData.credentialRequirements?.trim() ||
                      selectedProcess.sitData.testNotes?.trim()) ? (
                      <>
                        {selectedProcess.sitData.credentialRequirements &&
                          selectedProcess.sitData.credentialRequirements.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                  <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Credential Requirements
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed font-mono">
                                  {
                                    selectedProcess.sitData
                                      .credentialRequirements
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.sitData.testNotes &&
                          selectedProcess.sitData.testNotes.trim() !== "" && (
                            <div className="space-y-3">
                              <p className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Test Notes
                              </p>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.sitData.testNotes}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* TO-BE Design Data */}
                <Card className="bg-gradient-to-br from-orange-50/50 dark:from-orange-950/20 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30 shadow-md">
                  <CardHeader className="bg-orange-50/50 dark:bg-orange-950/30 rounded-t-lg border-b border-orange-200/50 dark:border-orange-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <DraftingCompass className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      To-Be Design
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.toBeDesignData &&
                    (selectedProcess.toBeDesignData.workflowDiagram?.trim() ||
                      selectedProcess.toBeDesignData.exceptionHandlingPlan?.trim() ||
                      selectedProcess.toBeDesignData.credentialRequirements?.trim() ||
                      selectedProcess.toBeDesignData.vmInfraNeeded?.trim() ||
                      selectedProcess.toBeDesignData.loggingRequirements?.trim() ||
                      selectedProcess.toBeDesignData.sddDocument?.trim() ||
                      selectedProcess.toBeDesignData.retryMechanismRequired ||
                      selectedProcess.toBeDesignData
                        .orchestratorQueuesRequired) ? (
                      <>
                        {selectedProcess.toBeDesignData.workflowDiagram &&
                          selectedProcess.toBeDesignData.workflowDiagram.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <Map className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Workflow Diagram
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm font-semibold">
                                  {
                                    selectedProcess.toBeDesignData
                                      .workflowDiagram
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData.exceptionHandlingPlan &&
                          selectedProcess.toBeDesignData.exceptionHandlingPlan.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Exception Handling Plan
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm">
                                  {
                                    selectedProcess.toBeDesignData
                                      .exceptionHandlingPlan
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData
                          .retryMechanismRequired && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-orange-500/10">
                                <RotateCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <Label className="text-sm font-bold uppercase tracking-wide">
                                Retry Mechanism Required
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-xs bg-success/20 text-success border-success"
                              >
                                Yes
                              </Badge>
                            </div>
                            {selectedProcess.toBeDesignData
                              .retryMechanismDetails &&
                              selectedProcess.toBeDesignData.retryMechanismDetails.trim() !==
                                "" && (
                                <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {
                                      selectedProcess.toBeDesignData
                                        .retryMechanismDetails
                                    }
                                  </p>
                                </div>
                              )}
                          </div>
                        )}
                        {selectedProcess.toBeDesignData.vmInfraNeeded &&
                          selectedProcess.toBeDesignData.vmInfraNeeded.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <Building className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  VM/Infrastructure Requirements
                                </Label>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.toBeDesignData.vmInfraNeeded}
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData
                          .orchestratorQueuesRequired && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-bold uppercase tracking-wide">
                                Orchestrator Queues Required
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-xs bg-success/20 text-success border-success"
                              >
                                Yes
                              </Badge>
                            </div>
                          </div>
                        )}
                        {selectedProcess.toBeDesignData.loggingRequirements &&
                          selectedProcess.toBeDesignData.loggingRequirements.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Logging Requirements
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {
                                    selectedProcess.toBeDesignData
                                      .loggingRequirements
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData.sddDocument &&
                          selectedProcess.toBeDesignData.sddDocument.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  SDD Document
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  {
                                    selectedProcess.toBeDesignData
                                      .sddApprovalStatus
                                  }
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm font-semibold">
                                  {selectedProcess.toBeDesignData.sddDocument}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comments Section */}
                <Card className="bg-muted/30 border-2 border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Comments (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      id="business-owner-comment"
                      placeholder="Add any comments or notes about your approval..."
                      value={approvalComments.businessOwner}
                      onChange={(e) =>
                        setApprovalComments({
                          ...approvalComments,
                          businessOwner: e.target.value,
                        })
                      }
                      className="bg-background border-2 border-border min-h-32 text-sm leading-relaxed"
                    />
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenApprovalDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-primary text-primary-foreground"
                  disabled={isSubmittingBusinessOwnerApproval}
                  onClick={async () => {
                    if (!selectedProcess) return;

                    const numericProcessId = extractProcessId(
                      selectedProcess.id
                    );
                    if (!numericProcessId) {
                      toast({
                        title: "Error",
                        description: "Invalid process ID",
                        variant: "destructive",
                      });
                      return;
                    }

                    setIsSubmittingBusinessOwnerApproval(true);

                    try {
                      // INSERT: Always use INSERT for first-time approval
                      const approvalApiData = {
                        ProcessId: numericProcessId,
                        BusinessOwnerApproval: true, // Approve
                        RPA_Approval: undefined, // Don't set RPA approval
                        BO_ApprovalNote:
                          approvalComments.businessOwner?.trim() || undefined,
                        RPA_ApprovalNote: undefined, // Don't set RPA note
                      };

                      const response = await createApprovalStage(approvalApiData);

                      if (response.success) {
                        // Update local state
                        const newApprovalData = {
                          ...approvalData,
                          businessOwnerApproval: "Approved" as
                            | "Approved"
                            | "Rejected"
                            | "Pending",
                        };
                        setApprovalData(newApprovalData);
                        setApprovalComments({
                          ...approvalComments,
                          businessOwner: approvalComments.businessOwner,
                        });

                        // Refresh process data to get updated status
                        const refreshResponse = await getProcessDetail(
                          numericProcessId
                        );
                        if (
                          refreshResponse.success &&
                          refreshResponse.process
                        ) {
                          const backendProcess = refreshResponse.process;
                          const stages = refreshResponse.stages || {};
                          const currentIncompleteStage =
                            refreshResponse.currentStage
                              ? mapBackendStageToFrontend(
                                  refreshResponse.currentStage
                                )
                              : mapBackendStageToFrontend(
                                  backendProcess.CurrentStage || null
                                );

                          // Update selectedProcess with refreshed data
                          setSelectedProcess((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  status:
                                    currentIncompleteStage as ProcessStage,
                                  approvalData: stages.approval
                                    ? {
                                        businessOwnerApproval:
                                          stages.approval
                                            .BusinessOwnerApproval === 1 ||
                                          stages.approval
                                            .BusinessOwnerApproval === true ||
                                          stages.approval
                                            .businessOwnerApproval === 1 ||
                                          stages.approval
                                            .business_owner_approval === 1
                                            ? ("Approved" as const)
                                            : ("Pending" as const),
                                        rpaCoEApproval:
                                          stages.approval.RPA_Approval === 1 ||
                                          stages.approval.RPA_Approval ===
                                            true ||
                                          stages.approval.rpa_approval === 1 ||
                                          stages.approval.RPAApproval === 1
                                            ? ("Approved" as const)
                                            : ("Pending" as const),
                                        comments: {
                                          businessOwner:
                                            stages.approval.BO_ApprovalNote ??
                                            stages.approval.bo_approval_note ??
                                            stages.approval
                                              .BusinessOwnerApprovalNote ??
                                            stages.approval
                                              .business_owner_approval_note ??
                                            "",
                                          rpaCoE:
                                            stages.approval.RPA_ApprovalNote ??
                                            stages.approval.rpa_approval_note ??
                                            stages.approval.RPAApprovalNote ??
                                            stages.approval.rpa_approval_note ??
                                            "",
                                        },
                                        approvalNeedsReview:
                                          stages.approval.ApprovalNeedsReview === 1 ||
                                          stages.approval.ApprovalNeedsReview === true ||
                                          stages.approval.approvalNeedsReview === 1 ||
                                          stages.approval.approval_needs_review === 1 ||
                                          false,
                                      }
                                    : prev.approvalData,
                                }
                              : null
                          );

                          // Update approval state from refreshed data
                          // Database BIT: 1 = Approved, 0 = Pending (default)
                          if (stages.approval) {
                            setApprovalData({
                              // ✅ FIXED: Use mapApprovalStatus helper - ONLY check BIT flags
                              businessOwnerApproval: mapApprovalStatus(stages.approval.BusinessOwnerApproval),
                              rpaCoEApproval: mapApprovalStatus(stages.approval.RPA_Approval),
                            });
                            setApprovalComments({
                              businessOwner:
                                stages.approval.BO_ApprovalNote ??
                                stages.approval.bo_approval_note ??
                                stages.approval.BusinessOwnerApprovalNote ??
                                stages.approval.business_owner_approval_note ??
                                "",
                              rpaCoE:
                                stages.approval.RPA_ApprovalNote ??
                                stages.approval.rpa_approval_note ??
                                stages.approval.RPAApprovalNote ??
                                stages.approval.rpa_approval_note ??
                                "",
                            });
                          }
                        }

                        setOpenApprovalDialog(null);

                        // Show notification if message is returned from backend (ApprovalNeedsReview)
                        if (response.message) {
                          toast({
                            title: "Review Required ⚠️",
                            description: response.message,
                            variant: "default",
                          });
                        }

                        // Show appropriate message based on whether both approvals are done
                        if (response.bothApprovalsCompleted) {
                          toast({
                            title: "Both Approvals Completed! ✅",
                            description:
                              "Business Owner and RPA CoE approvals are complete. Click 'Move to Next Stage' button to proceed.",
                          });
                        } else if (!response.message) {
                          // Only show success message if there's no review notification
                          toast({
                            title: "Approval Submitted ✅",
                            description:
                              "Business Owner approval has been recorded. Waiting for RPA CoE approval.",
                          });
                        }
                      } else {
                        throw new Error(
                          response.message || "Failed to submit approval"
                        );
                      }
                    } catch (error: any) {
                      toast({
                        title: "Approval Failed",
                        description:
                          error.message ||
                          "Failed to submit approval. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSubmittingBusinessOwnerApproval(false);
                    }
                  }}
                >
                  {isSubmittingBusinessOwnerApproval ? (
                    <>
                      <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* RPA CoE Approval Dialog */}
          <Dialog
            open={openApprovalDialog === "rpa-coe"}
            onOpenChange={(open) => !open && setOpenApprovalDialog(null)}
          >
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Target className="w-7 h-7 text-primary" />
                  RPA Center of Excellence Approval
                </DialogTitle>
                <DialogDescription className="text-base">
                  Review the process from RPA CoE perspective and provide your
                  approval
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                {/* Basic Process Information */}
                <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-2 border-primary/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold mb-2 flex items-center gap-2">
                          <FileText className="w-6 h-6 text-primary" />
                          {selectedProcess.title}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                          {selectedProcess.description}
                        </CardDescription>
                      </div>
                      <Badge
                        className={getPriorityColor(selectedProcess.priority)}
                      >
                        {selectedProcess.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Department
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" />
                          {selectedProcess.department}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Expected ROI
                        </p>
                        <p className="text-base font-bold text-success flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          {selectedProcess.expectedROI > 0
                            ? `$${selectedProcess.expectedROI.toLocaleString()}`
                            : "$0"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Submitted By
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          {selectedProcess.submittedBy}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Submitted Date
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          {new Date(
                            selectedProcess.submittedDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Triage Data */}
                <Card className="bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-md">
                  <CardHeader className="bg-blue-50/50 dark:bg-blue-950/30 rounded-t-lg border-b border-blue-200/50 dark:border-blue-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Initial Triage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.triageData &&
                    (selectedProcess.triageData.isRuleBased !== undefined ||
                      selectedProcess.triageData.isStable !== undefined ||
                      (selectedProcess.triageData.estimatedAutomationPercent !==
                        undefined &&
                        selectedProcess.triageData.estimatedAutomationPercent >=
                          0) ||
                      (selectedProcess.triageData.systemsInvolved &&
                        selectedProcess.triageData.systemsInvolved.length >
                          0) ||
                      (selectedProcess.triageData.blockers &&
                        selectedProcess.triageData.blockers.length > 0) ||
                      (selectedProcess.triageData.triageNotes &&
                        selectedProcess.triageData.triageNotes.trim()) ||
                      (selectedProcess.triageData.initialROI &&
                        selectedProcess.triageData.initialROI.trim()) ||
                      (selectedProcess.triageData.volumes &&
                        selectedProcess.triageData.volumes.trim())) ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" />
                              Feasibility Criteria
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                {selectedProcess.triageData.isRuleBased ? (
                                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">
                                  Rule-based Process
                                </span>
                              </div>
                              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                {selectedProcess.triageData.isStable ? (
                                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">
                                  Stable Process
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                              Process Volumes
                            </p>
                            <p className="text-base font-semibold">
                              {selectedProcess.triageData.volumes ||
                                "Not specified"}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                              Estimated Automation %
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">
                                  {selectedProcess.triageData
                                    .estimatedAutomationPercent || 0}
                                  %
                                </span>
                              </div>
                              <Progress
                                value={
                                  selectedProcess.triageData
                                    .estimatedAutomationPercent || 0
                                }
                                className="flex-1 h-2"
                              />
                            </div>
                          </div>
                        </div>
                        {selectedProcess.triageData.systemsInvolved &&
                          selectedProcess.triageData.systemsInvolved.length >
                            0 && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-primary" />
                                Systems Involved
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedProcess.triageData.systemsInvolved.map(
                                  (system, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                    >
                                      <Link2 className="w-3 h-3 mr-1.5" />
                                      {system}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        {selectedProcess.triageData.blockers &&
                          selectedProcess.triageData.blockers.length > 0 && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                Blockers
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedProcess.triageData.blockers.map(
                                  (blocker, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-sm px-3 py-1.5 border-destructive/50 bg-destructive/5 text-destructive"
                                    >
                                      {blocker}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        {selectedProcess.triageData.triageNotes &&
                          selectedProcess.triageData.triageNotes.trim() !==
                            "" && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3">
                                Triage Notes
                              </p>
                              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.triageData.triageNotes}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* System Integration (SIT) Data */}
                <Card className="bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30 shadow-md">
                  <CardHeader className="bg-purple-50/50 dark:bg-purple-950/30 rounded-t-lg border-b border-purple-200/50 dark:border-purple-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <TestTube className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      System Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.sitData &&
                    (selectedProcess.sitData.credentialRequirements?.trim() ||
                      selectedProcess.sitData.testNotes?.trim()) ? (
                      <>
                        {selectedProcess.sitData.credentialRequirements &&
                          selectedProcess.sitData.credentialRequirements.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                  <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Credential Requirements
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed font-mono">
                                  {
                                    selectedProcess.sitData
                                      .credentialRequirements
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.sitData.testNotes &&
                          selectedProcess.sitData.testNotes.trim() !== "" && (
                            <div className="space-y-3">
                              <p className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Test Notes
                              </p>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.sitData.testNotes}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* TO-BE Design Data */}
                <Card className="bg-gradient-to-br from-orange-50/50 dark:from-orange-950/20 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30 shadow-md">
                  <CardHeader className="bg-orange-50/50 dark:bg-orange-950/30 rounded-t-lg border-b border-orange-200/50 dark:border-orange-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <DraftingCompass className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      To-Be Design
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.toBeDesignData &&
                    (selectedProcess.toBeDesignData.workflowDiagram?.trim() ||
                      selectedProcess.toBeDesignData.exceptionHandlingPlan?.trim() ||
                      selectedProcess.toBeDesignData.credentialRequirements?.trim() ||
                      selectedProcess.toBeDesignData.vmInfraNeeded?.trim() ||
                      selectedProcess.toBeDesignData.loggingRequirements?.trim() ||
                      selectedProcess.toBeDesignData.sddDocument?.trim() ||
                      selectedProcess.toBeDesignData.retryMechanismRequired ||
                      selectedProcess.toBeDesignData
                        .orchestratorQueuesRequired) ? (
                      <>
                        {selectedProcess.toBeDesignData.workflowDiagram &&
                          selectedProcess.toBeDesignData.workflowDiagram.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <Map className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Workflow Diagram
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm font-semibold">
                                  {
                                    selectedProcess.toBeDesignData
                                      .workflowDiagram
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData.exceptionHandlingPlan &&
                          selectedProcess.toBeDesignData.exceptionHandlingPlan.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Exception Handling Plan
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm">
                                  {
                                    selectedProcess.toBeDesignData
                                      .exceptionHandlingPlan
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData
                          .retryMechanismRequired && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-orange-500/10">
                                <RotateCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <Label className="text-sm font-bold uppercase tracking-wide">
                                Retry Mechanism Required
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-xs bg-success/20 text-success border-success"
                              >
                                Yes
                              </Badge>
                            </div>
                            {selectedProcess.toBeDesignData
                              .retryMechanismDetails &&
                              selectedProcess.toBeDesignData.retryMechanismDetails.trim() !==
                                "" && (
                                <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {
                                      selectedProcess.toBeDesignData
                                        .retryMechanismDetails
                                    }
                                  </p>
                                </div>
                              )}
                          </div>
                        )}
                        {selectedProcess.toBeDesignData.vmInfraNeeded &&
                          selectedProcess.toBeDesignData.vmInfraNeeded.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <Building className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  VM/Infrastructure Requirements
                                </Label>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.toBeDesignData.vmInfraNeeded}
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData
                          .orchestratorQueuesRequired && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-bold uppercase tracking-wide">
                                Orchestrator Queues Required
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-xs bg-success/20 text-success border-success"
                              >
                                Yes
                              </Badge>
                            </div>
                          </div>
                        )}
                        {selectedProcess.toBeDesignData.loggingRequirements &&
                          selectedProcess.toBeDesignData.loggingRequirements.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Logging Requirements
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {
                                    selectedProcess.toBeDesignData
                                      .loggingRequirements
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData.sddDocument &&
                          selectedProcess.toBeDesignData.sddDocument.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  SDD Document
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  {
                                    selectedProcess.toBeDesignData
                                      .sddApprovalStatus
                                  }
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm font-semibold">
                                  {selectedProcess.toBeDesignData.sddDocument}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comments Section */}
                <Card className="bg-muted/30 border-2 border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Comments (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      id="rpa-coe-comment"
                      placeholder="Add any comments or notes about your approval..."
                      value={approvalComments.rpaCoE}
                      onChange={(e) =>
                        setApprovalComments({
                          ...approvalComments,
                          rpaCoE: e.target.value,
                        })
                      }
                      className="bg-background border-2 border-border min-h-32 text-sm leading-relaxed"
                    />
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenApprovalDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-primary text-primary-foreground"
                  disabled={isSubmittingRpaCoEApproval}
                  onClick={async () => {
                    if (!selectedProcess) return;

                    const numericProcessId = extractProcessId(
                      selectedProcess.id
                    );
                    if (!numericProcessId) {
                      toast({
                        title: "Error",
                        description: "Invalid process ID",
                        variant: "destructive",
                      });
                      return;
                    }

                    setIsSubmittingRpaCoEApproval(true);

                    try {
                      // INSERT: Always use INSERT for first-time approval
                      const approvalApiData = {
                        ProcessId: numericProcessId,
                        BusinessOwnerApproval: undefined, // Don't set Business Owner approval
                        RPA_Approval: true, // Approve
                        BO_ApprovalNote: undefined, // Don't set BO note
                        RPA_ApprovalNote:
                          approvalComments.rpaCoE?.trim() || undefined,
                      };

                      const response = await createApprovalStage(approvalApiData);

                      if (response.success) {
                        // Update local state
                        const newApprovalData = {
                          ...approvalData,
                          rpaCoEApproval: "Approved" as
                            | "Approved"
                            | "Rejected"
                            | "Pending",
                        };
                        setApprovalData(newApprovalData);
                        setApprovalComments({
                          ...approvalComments,
                          rpaCoE: approvalComments.rpaCoE,
                        });

                        // Refresh process data to get updated status
                        const refreshResponse = await getProcessDetail(
                          numericProcessId
                        );
                        if (
                          refreshResponse.success &&
                          refreshResponse.process
                        ) {
                          const backendProcess = refreshResponse.process;
                          const stages = refreshResponse.stages || {};
                          const currentIncompleteStage =
                            refreshResponse.currentStage
                              ? mapBackendStageToFrontend(
                                  refreshResponse.currentStage
                                )
                              : mapBackendStageToFrontend(
                                  backendProcess.CurrentStage || null
                                );

                          // Update selectedProcess with refreshed data
                          setSelectedProcess((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  status:
                                    currentIncompleteStage as ProcessStage,
                                  approvalData: stages.approval
                                    ? {
                                        businessOwnerApproval:
                                          stages.approval
                                            .BusinessOwnerApproval === 1 ||
                                          stages.approval
                                            .BusinessOwnerApproval === true ||
                                          stages.approval
                                            .businessOwnerApproval === 1 ||
                                          stages.approval
                                            .business_owner_approval === 1
                                            ? ("Approved" as const)
                                            : ("Pending" as const),
                                        rpaCoEApproval:
                                          stages.approval.RPA_Approval === 1 ||
                                          stages.approval.RPA_Approval ===
                                            true ||
                                          stages.approval.rpa_approval === 1 ||
                                          stages.approval.RPAApproval === 1
                                            ? ("Approved" as const)
                                            : ("Pending" as const),
                                        comments: {
                                          businessOwner:
                                            stages.approval.BO_ApprovalNote ??
                                            stages.approval.bo_approval_note ??
                                            stages.approval
                                              .BusinessOwnerApprovalNote ??
                                            stages.approval
                                              .business_owner_approval_note ??
                                            "",
                                          rpaCoE:
                                            stages.approval.RPA_ApprovalNote ??
                                            stages.approval.rpa_approval_note ??
                                            stages.approval.RPAApprovalNote ??
                                            stages.approval.rpa_approval_note ??
                                            "",
                                        },
                                        approvalNeedsReview:
                                          stages.approval.ApprovalNeedsReview === 1 ||
                                          stages.approval.ApprovalNeedsReview === true ||
                                          stages.approval.approvalNeedsReview === 1 ||
                                          stages.approval.approval_needs_review === 1 ||
                                          false,
                                      }
                                    : prev.approvalData,
                                }
                              : null
                          );

                          // Update approval state from refreshed data
                          // Database BIT: 1 = Approved, 0 = Pending (default)
                          if (stages.approval) {
                            setApprovalData({
                              // ✅ FIXED: Use mapApprovalStatus helper - ONLY check BIT flags
                              businessOwnerApproval: mapApprovalStatus(stages.approval.BusinessOwnerApproval),
                              rpaCoEApproval: mapApprovalStatus(stages.approval.RPA_Approval),
                            });
                            setApprovalComments({
                              businessOwner:
                                stages.approval.BO_ApprovalNote ??
                                stages.approval.bo_approval_note ??
                                stages.approval.BusinessOwnerApprovalNote ??
                                stages.approval.business_owner_approval_note ??
                                "",
                              rpaCoE:
                                stages.approval.RPA_ApprovalNote ??
                                stages.approval.rpa_approval_note ??
                                stages.approval.RPAApprovalNote ??
                                stages.approval.rpa_approval_note ??
                                "",
                            });
                          }
                        }

                        setOpenApprovalDialog(null);

                        // Show notification if message is returned from backend (ApprovalNeedsReview)
                        if (response.message) {
                          toast({
                            title: "Review Required ⚠️",
                            description: response.message,
                            variant: "default",
                          });
                        }

                        // Show appropriate message based on whether both approvals are done
                        if (response.bothApprovalsCompleted) {
                          toast({
                            title: "Both Approvals Completed! ✅",
                            description:
                              "Business Owner and RPA CoE approvals are complete. Click 'Move to Next Stage' button to proceed.",
                          });
                        } else if (!response.message) {
                          // Only show success message if there's no review notification
                          toast({
                            title: "Approval Submitted ✅",
                            description:
                              "RPA CoE approval has been recorded. Waiting for Business Owner approval.",
                          });
                        }
                      } else {
                        throw new Error(
                          response.message || "Failed to submit approval"
                        );
                      }
                    } catch (error: any) {
                      toast({
                        title: "Approval Failed",
                        description:
                          error.message ||
                          "Failed to submit approval. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSubmittingRpaCoEApproval(false);
                    }
                  }}
                >
                  {isSubmittingRpaCoEApproval ? (
                    <>
                      <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Business Owner Re-Approval Dialog - UPDATE (Full Featured) */}
          <Dialog
            open={openApprovalDialog === "business-owner-update"}
            onOpenChange={(open) => !open && setOpenApprovalDialog(null)}
          >
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Users className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                  Business Owner Re-Approval
                </DialogTitle>
                <DialogDescription className="text-base">
                  <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span className="font-semibold text-orange-900 dark:text-orange-100">
                      Process data has been updated. Please review all updated information and provide your re-approval.
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                {/* Basic Process Information */}
                <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-2 border-primary/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold mb-2 flex items-center gap-2">
                          <FileText className="w-6 h-6 text-primary" />
                          {selectedProcess.title}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                          {selectedProcess.description}
                        </CardDescription>
                      </div>
                      <Badge
                        className={getPriorityColor(selectedProcess.priority)}
                      >
                        {selectedProcess.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Department
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" />
                          {selectedProcess.department}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Expected ROI
                        </p>
                        <p className="text-base font-bold text-success flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          {selectedProcess.expectedROI > 0
                            ? `$${selectedProcess.expectedROI.toLocaleString()}`
                            : "$0"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Submitted By
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          {selectedProcess.submittedBy}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Submitted Date
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          {new Date(
                            selectedProcess.submittedDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Triage Data */}
                <Card className="bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-md">
                  <CardHeader className="bg-blue-50/50 dark:bg-blue-950/30 rounded-t-lg border-b border-blue-200/50 dark:border-blue-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Initial Triage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.triageData &&
                    (selectedProcess.triageData.isRuleBased !== undefined ||
                      selectedProcess.triageData.isStable !== undefined ||
                      (selectedProcess.triageData.estimatedAutomationPercent !==
                        undefined &&
                        selectedProcess.triageData.estimatedAutomationPercent >=
                          0) ||
                      (selectedProcess.triageData.systemsInvolved &&
                        selectedProcess.triageData.systemsInvolved.length >
                          0) ||
                      (selectedProcess.triageData.blockers &&
                        selectedProcess.triageData.blockers.length > 0) ||
                      (selectedProcess.triageData.triageNotes &&
                        selectedProcess.triageData.triageNotes.trim()) ||
                      (selectedProcess.triageData.initialROI &&
                        selectedProcess.triageData.initialROI.trim()) ||
                      (selectedProcess.triageData.volumes &&
                        selectedProcess.triageData.volumes.trim())) ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" />
                              Feasibility Criteria
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                {selectedProcess.triageData.isRuleBased ? (
                                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">
                                  Rule-based Process
                                </span>
                              </div>
                              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                {selectedProcess.triageData.isStable ? (
                                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">
                                  Stable Process
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                              Process Volumes
                            </p>
                            <p className="text-base font-semibold">
                              {selectedProcess.triageData.volumes ||
                                "Not specified"}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                              Estimated Automation %
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">
                                  {selectedProcess.triageData
                                    .estimatedAutomationPercent || 0}
                                  %
                                </span>
                              </div>
                              <Progress
                                value={
                                  selectedProcess.triageData
                                    .estimatedAutomationPercent || 0
                                }
                                className="flex-1 h-2"
                              />
                            </div>
                          </div>
                        </div>
                        {selectedProcess.triageData.systemsInvolved &&
                          selectedProcess.triageData.systemsInvolved.length >
                            0 && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-primary" />
                                Systems Involved
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedProcess.triageData.systemsInvolved.map(
                                  (system, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                    >
                                      <Link2 className="w-3 h-3 mr-1.5" />
                                      {system}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        {selectedProcess.triageData.blockers &&
                          selectedProcess.triageData.blockers.length > 0 && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                Blockers
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedProcess.triageData.blockers.map(
                                  (blocker, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-sm px-3 py-1.5 border-destructive/50 bg-destructive/5 text-destructive"
                                    >
                                      {blocker}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        {selectedProcess.triageData.triageNotes &&
                          selectedProcess.triageData.triageNotes.trim() !==
                            "" && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3">
                                Triage Notes
                              </p>
                              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.triageData.triageNotes}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* System Integration (SIT) Data */}
                <Card className="bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30 shadow-md">
                  <CardHeader className="bg-purple-50/50 dark:bg-purple-950/30 rounded-t-lg border-b border-purple-200/50 dark:border-purple-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <TestTube className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      System Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.sitData &&
                    (selectedProcess.sitData.credentialRequirements?.trim() ||
                      selectedProcess.sitData.testNotes?.trim()) ? (
                      <>
                        {selectedProcess.sitData.credentialRequirements &&
                          selectedProcess.sitData.credentialRequirements.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                  <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Credential Requirements
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed font-mono">
                                  {
                                    selectedProcess.sitData
                                      .credentialRequirements
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.sitData.testNotes &&
                          selectedProcess.sitData.testNotes.trim() !== "" && (
                            <div className="space-y-3">
                              <p className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Test Notes
                              </p>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.sitData.testNotes}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* TO-BE Design Data */}
                <Card className="bg-gradient-to-br from-orange-50/50 dark:from-orange-950/20 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30 shadow-md">
                  <CardHeader className="bg-orange-50/50 dark:bg-orange-950/30 rounded-t-lg border-b border-orange-200/50 dark:border-orange-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <DraftingCompass className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      To-Be Design
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.toBeDesignData &&
                    (selectedProcess.toBeDesignData.workflowDiagram?.trim() ||
                      selectedProcess.toBeDesignData.exceptionHandlingPlan?.trim() ||
                      selectedProcess.toBeDesignData.credentialRequirements?.trim() ||
                      selectedProcess.toBeDesignData.vmInfraNeeded?.trim() ||
                      selectedProcess.toBeDesignData.loggingRequirements?.trim() ||
                      selectedProcess.toBeDesignData.sddDocument?.trim() ||
                      selectedProcess.toBeDesignData.retryMechanismRequired ||
                      selectedProcess.toBeDesignData
                        .orchestratorQueuesRequired) ? (
                      <>
                        {selectedProcess.toBeDesignData.workflowDiagram &&
                          selectedProcess.toBeDesignData.workflowDiagram.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <Map className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Workflow Diagram
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm font-semibold">
                                  {
                                    selectedProcess.toBeDesignData
                                      .workflowDiagram
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData.exceptionHandlingPlan &&
                          selectedProcess.toBeDesignData.exceptionHandlingPlan.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Exception Handling Plan
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm">
                                  {
                                    selectedProcess.toBeDesignData
                                      .exceptionHandlingPlan
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData
                          .retryMechanismRequired && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-orange-500/10">
                                <RotateCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <Label className="text-sm font-bold uppercase tracking-wide">
                                Retry Mechanism Required
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-xs bg-success/20 text-success border-success"
                              >
                                Yes
                              </Badge>
                            </div>
                            {selectedProcess.toBeDesignData
                              .retryMechanismDetails &&
                              selectedProcess.toBeDesignData.retryMechanismDetails.trim() !==
                                "" && (
                                <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {
                                      selectedProcess.toBeDesignData
                                        .retryMechanismDetails
                                    }
                                  </p>
                                </div>
                              )}
                          </div>
                        )}
                        {selectedProcess.toBeDesignData.vmInfraNeeded &&
                          selectedProcess.toBeDesignData.vmInfraNeeded.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <Building className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  VM/Infrastructure Requirements
                                </Label>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.toBeDesignData.vmInfraNeeded}
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData
                          .orchestratorQueuesRequired && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-bold uppercase tracking-wide">
                                Orchestrator Queues Required
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-xs bg-success/20 text-success border-success"
                              >
                                Yes
                              </Badge>
                            </div>
                          </div>
                        )}
                        {selectedProcess.toBeDesignData.loggingRequirements &&
                          selectedProcess.toBeDesignData.loggingRequirements.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Logging Requirements
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {
                                    selectedProcess.toBeDesignData
                                      .loggingRequirements
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData.sddDocument &&
                          selectedProcess.toBeDesignData.sddDocument.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  SDD Document
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  {
                                    selectedProcess.toBeDesignData
                                      .sddApprovalStatus
                                  }
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm font-semibold">
                                  {selectedProcess.toBeDesignData.sddDocument}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comments Section */}
                <Card className="bg-muted/30 border-2 border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Re-Approval Comments (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      id="business-owner-reapproval-comment"
                      placeholder="Add any comments or notes about your re-approval..."
                      value={approvalComments.businessOwner}
                      onChange={(e) =>
                        setApprovalComments({
                          ...approvalComments,
                          businessOwner: e.target.value,
                        })
                      }
                      className="bg-background border-2 border-border min-h-32 text-sm leading-relaxed"
                    />
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenApprovalDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const numericProcessId = parseInt(
                      selectedProcess.id.replace("P", "")
                    );
                    if (!numericProcessId) {
                      toast({
                        title: "Error",
                        description: "Invalid process ID",
                        variant: "destructive",
                      });
                      return;
                    }

                    setIsSubmittingBusinessOwnerApproval(true);

                    try {
                      // UPDATE: Always use UPDATE for re-approval
                      // CRITICAL: Only include BusinessOwnerApproval, explicitly omit RPA_Approval
                      const approvalApiData: any = {
                        BusinessOwnerApproval: true, // Approve
                        // DO NOT include RPA_Approval - it should be undefined/omitted
                      };
                      
                      // Only include BO_ApprovalNote if it has a value
                      if (approvalComments.businessOwner?.trim()) {
                        approvalApiData.BO_ApprovalNote = approvalComments.businessOwner.trim();
                      }
                      

                      const response = await updateApprovalStage(
                        numericProcessId,
                        approvalApiData
                      );

                      if (response.success) {
                        // Refresh process data
                        const refreshResponse = await getProcessDetail(
                          numericProcessId
                        );
                        if (
                          refreshResponse.success &&
                          refreshResponse.process
                        ) {
                          // ✅ FIXED: Don't refresh from database - only update the specific approval that was submitted
                          // Preserve the other approval from existing state
                          const updatedApprovalData = {
                            // Update Business Owner approval to "Approved" (we just approved it)
                            businessOwnerApproval: "Approved" as const,
                            // Preserve RPA CoE approval from existing state (don't change it)
                            rpaCoEApproval: (selectedProcess.approvalData?.rpaCoEApproval || "Pending") as "Approved" | "Rejected" | "Pending",
                            // Preserve comments from existing state
                            comments: {
                              businessOwner: approvalComments.businessOwner?.trim() || selectedProcess.approvalData?.comments?.businessOwner || "",
                              rpaCoE: selectedProcess.approvalData?.comments?.rpaCoE || "",
                            },
                            // Preserve approvalNeedsReview flag from existing state
                            approvalNeedsReview: selectedProcess.approvalData?.approvalNeedsReview || false,
                          };
                          
                          setApprovalData({
                            businessOwnerApproval: updatedApprovalData.businessOwnerApproval,
                            rpaCoEApproval: updatedApprovalData.rpaCoEApproval,
                          });
                          setApprovalComments(updatedApprovalData.comments);
                          
                          // Update selectedProcess - preserve status unless both approvals are complete
                          const bothCompleted = updatedApprovalData.businessOwnerApproval === "Approved" && updatedApprovalData.rpaCoEApproval === "Approved";
                          const backendProcess = refreshResponse.process;
                          const currentIncompleteStage = refreshResponse.currentStage
                            ? mapBackendStageToFrontend(refreshResponse.currentStage)
                            : mapBackendStageToFrontend(backendProcess.CurrentStage || null);
                          
                          setSelectedProcess((prev) => ({
                            ...prev,
                            status: bothCompleted ? (currentIncompleteStage as ProcessStage) : (prev?.status || "Approval"),
                            approvalData: updatedApprovalData,
                          }));
                        }

                        setOpenApprovalDialog(null);
                        toast({
                          title: "Re-Approval Submitted ✅",
                          description:
                            "Business Owner approval has been updated successfully.",
                        });
                      } else {
                        throw new Error(
                          response.message || "Failed to update approval"
                        );
                      }
                    } catch (error: any) {
                      toast({
                        title: "Update Failed",
                        description:
                          error.message ||
                          "Failed to update approval. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSubmittingBusinessOwnerApproval(false);
                    }
                  }}
                >
                  {isSubmittingBusinessOwnerApproval ? (
                    <>
                      <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                      Re-Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Re-Approve
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* RPA CoE Re-Approval Dialog - UPDATE (Full Featured) */}
          <Dialog
            open={openApprovalDialog === "rpa-coe-update"}
            onOpenChange={(open) => !open && setOpenApprovalDialog(null)}
          >
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Target className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                  RPA CoE Re-Approval
                </DialogTitle>
                <DialogDescription className="text-base">
                  <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span className="font-semibold text-orange-900 dark:text-orange-100">
                      Process data has been updated. Please review all updated information and provide your re-approval.
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                {/* Basic Process Information */}
                <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-2 border-primary/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold mb-2 flex items-center gap-2">
                          <FileText className="w-6 h-6 text-primary" />
                          {selectedProcess.title}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                          {selectedProcess.description}
                        </CardDescription>
                      </div>
                      <Badge
                        className={getPriorityColor(selectedProcess.priority)}
                      >
                        {selectedProcess.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Department
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" />
                          {selectedProcess.department}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Expected ROI
                        </p>
                        <p className="text-base font-bold text-success flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          {selectedProcess.expectedROI > 0
                            ? `$${selectedProcess.expectedROI.toLocaleString()}`
                            : "$0"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Submitted By
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          {selectedProcess.submittedBy}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Submitted Date
                        </p>
                        <p className="text-base font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          {new Date(
                            selectedProcess.submittedDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Triage Data */}
                <Card className="bg-gradient-to-br from-blue-50/50 dark:from-blue-950/20 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-md">
                  <CardHeader className="bg-blue-50/50 dark:bg-blue-950/30 rounded-t-lg border-b border-blue-200/50 dark:border-blue-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Initial Triage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.triageData &&
                    (selectedProcess.triageData.isRuleBased !== undefined ||
                      selectedProcess.triageData.isStable !== undefined ||
                      (selectedProcess.triageData.estimatedAutomationPercent !==
                        undefined &&
                        selectedProcess.triageData.estimatedAutomationPercent >=
                          0) ||
                      (selectedProcess.triageData.systemsInvolved &&
                        selectedProcess.triageData.systemsInvolved.length >
                          0) ||
                      (selectedProcess.triageData.blockers &&
                        selectedProcess.triageData.blockers.length > 0) ||
                      (selectedProcess.triageData.triageNotes &&
                        selectedProcess.triageData.triageNotes.trim()) ||
                      (selectedProcess.triageData.initialROI &&
                        selectedProcess.triageData.initialROI.trim()) ||
                      (selectedProcess.triageData.volumes &&
                        selectedProcess.triageData.volumes.trim())) ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" />
                              Feasibility Criteria
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                {selectedProcess.triageData.isRuleBased ? (
                                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">
                                  Rule-based Process
                                </span>
                              </div>
                              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                {selectedProcess.triageData.isStable ? (
                                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">
                                  Stable Process
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                              Process Volumes
                            </p>
                            <p className="text-base font-semibold">
                              {selectedProcess.triageData.volumes ||
                                "Not specified"}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                              Estimated Automation %
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">
                                  {selectedProcess.triageData
                                    .estimatedAutomationPercent || 0}
                                  %
                                </span>
                              </div>
                              <Progress
                                value={
                                  selectedProcess.triageData
                                    .estimatedAutomationPercent || 0
                                }
                                className="flex-1 h-2"
                              />
                            </div>
                          </div>
                        </div>
                        {selectedProcess.triageData.systemsInvolved &&
                          selectedProcess.triageData.systemsInvolved.length >
                            0 && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-primary" />
                                Systems Involved
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedProcess.triageData.systemsInvolved.map(
                                  (system, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                    >
                                      <Link2 className="w-3 h-3 mr-1.5" />
                                      {system}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        {selectedProcess.triageData.blockers &&
                          selectedProcess.triageData.blockers.length > 0 && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                Blockers
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedProcess.triageData.blockers.map(
                                  (blocker, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-sm px-3 py-1.5 border-destructive/50 bg-destructive/5 text-destructive"
                                    >
                                      {blocker}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        {selectedProcess.triageData.triageNotes &&
                          selectedProcess.triageData.triageNotes.trim() !==
                            "" && (
                            <div className="pt-4 border-t-2 border-border">
                              <p className="text-sm font-bold text-foreground mb-3">
                                Triage Notes
                              </p>
                              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.triageData.triageNotes}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* System Integration (SIT) Data */}
                <Card className="bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30 shadow-md">
                  <CardHeader className="bg-purple-50/50 dark:bg-purple-950/30 rounded-t-lg border-b border-purple-200/50 dark:border-purple-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <TestTube className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      System Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.sitData &&
                    (selectedProcess.sitData.credentialRequirements?.trim() ||
                      selectedProcess.sitData.testNotes?.trim()) ? (
                      <>
                        {selectedProcess.sitData.credentialRequirements &&
                          selectedProcess.sitData.credentialRequirements.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                  <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Credential Requirements
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed font-mono">
                                  {
                                    selectedProcess.sitData
                                      .credentialRequirements
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.sitData.testNotes &&
                          selectedProcess.sitData.testNotes.trim() !== "" && (
                            <div className="space-y-3">
                              <p className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Test Notes
                              </p>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.sitData.testNotes}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* TO-BE Design Data */}
                <Card className="bg-gradient-to-br from-orange-50/50 dark:from-orange-950/20 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30 shadow-md">
                  <CardHeader className="bg-orange-50/50 dark:bg-orange-950/30 rounded-t-lg border-b border-orange-200/50 dark:border-orange-800/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <DraftingCompass className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      To-Be Design
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {selectedProcess.toBeDesignData &&
                    (selectedProcess.toBeDesignData.workflowDiagram?.trim() ||
                      selectedProcess.toBeDesignData.exceptionHandlingPlan?.trim() ||
                      selectedProcess.toBeDesignData.credentialRequirements?.trim() ||
                      selectedProcess.toBeDesignData.vmInfraNeeded?.trim() ||
                      selectedProcess.toBeDesignData.loggingRequirements?.trim() ||
                      selectedProcess.toBeDesignData.sddDocument?.trim() ||
                      selectedProcess.toBeDesignData.retryMechanismRequired ||
                      selectedProcess.toBeDesignData
                        .orchestratorQueuesRequired) ? (
                      <>
                        {selectedProcess.toBeDesignData.workflowDiagram &&
                          selectedProcess.toBeDesignData.workflowDiagram.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <Map className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Workflow Diagram
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm font-semibold">
                                  {
                                    selectedProcess.toBeDesignData
                                      .workflowDiagram
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData.exceptionHandlingPlan &&
                          selectedProcess.toBeDesignData.exceptionHandlingPlan.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Exception Handling Plan
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm">
                                  {
                                    selectedProcess.toBeDesignData
                                      .exceptionHandlingPlan
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData
                          .retryMechanismRequired && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-orange-500/10">
                                <RotateCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <Label className="text-sm font-bold uppercase tracking-wide">
                                Retry Mechanism Required
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-xs bg-success/20 text-success border-success"
                              >
                                Yes
                              </Badge>
                            </div>
                            {selectedProcess.toBeDesignData
                              .retryMechanismDetails &&
                              selectedProcess.toBeDesignData.retryMechanismDetails.trim() !==
                                "" && (
                                <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {
                                      selectedProcess.toBeDesignData
                                        .retryMechanismDetails
                                    }
                                  </p>
                                </div>
                              )}
                          </div>
                        )}
                        {selectedProcess.toBeDesignData.vmInfraNeeded &&
                          selectedProcess.toBeDesignData.vmInfraNeeded.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <Building className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  VM/Infrastructure Requirements
                                </Label>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedProcess.toBeDesignData.vmInfraNeeded}
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData
                          .orchestratorQueuesRequired && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-bold uppercase tracking-wide">
                                Orchestrator Queues Required
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-xs bg-success/20 text-success border-success"
                              >
                                Yes
                              </Badge>
                            </div>
                          </div>
                        )}
                        {selectedProcess.toBeDesignData.loggingRequirements &&
                          selectedProcess.toBeDesignData.loggingRequirements.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  Logging Requirements
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {
                                    selectedProcess.toBeDesignData
                                      .loggingRequirements
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                        {selectedProcess.toBeDesignData.sddDocument &&
                          selectedProcess.toBeDesignData.sddDocument.trim() !==
                            "" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                  <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <Label className="text-sm font-bold uppercase tracking-wide">
                                  SDD Document
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-success/20 text-success border-success"
                                >
                                  {
                                    selectedProcess.toBeDesignData
                                      .sddApprovalStatus
                                  }
                                </Badge>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/50 border-2 border-border shadow-sm">
                                <p className="text-sm font-semibold">
                                  {selectedProcess.toBeDesignData.sddDocument}
                                </p>
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">
                          No detail found for this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comments Section */}
                <Card className="bg-muted/30 border-2 border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Re-Approval Comments (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      id="rpa-coe-reapproval-comment"
                      placeholder="Add any comments or notes about your re-approval..."
                      value={approvalComments.rpaCoE}
                      onChange={(e) =>
                        setApprovalComments({
                          ...approvalComments,
                          rpaCoE: e.target.value,
                        })
                      }
                      className="bg-background border-2 border-border min-h-32 text-sm leading-relaxed"
                    />
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenApprovalDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const numericProcessId = parseInt(
                      selectedProcess.id.replace("P", "")
                    );
                    if (!numericProcessId) {
                      toast({
                        title: "Error",
                        description: "Invalid process ID",
                        variant: "destructive",
                      });
                      return;
                    }

                    setIsSubmittingRpaCoEApproval(true);

                    try {
                      // UPDATE: Always use UPDATE for re-approval
                      // CRITICAL: Only include RPA_Approval, explicitly omit BusinessOwnerApproval
                      const approvalApiData: any = {
                        RPA_Approval: true, // Approve
                        // DO NOT include BusinessOwnerApproval - it should be undefined/omitted
                      };
                      
                      // Only include RPA_ApprovalNote if it has a value
                      if (approvalComments.rpaCoE?.trim()) {
                        approvalApiData.RPA_ApprovalNote = approvalComments.rpaCoE.trim();
                      }
                      

                      const response = await updateApprovalStage(
                        numericProcessId,
                        approvalApiData
                      );

                      if (response.success) {
                        // Refresh process data
                        const refreshResponse = await getProcessDetail(
                          numericProcessId
                        );
                        if (
                          refreshResponse.success &&
                          refreshResponse.process
                        ) {
                          // ✅ FIXED: Don't refresh from database - only update the specific approval that was submitted
                          // Preserve the other approval from existing state
                          const updatedApprovalData = {
                            // Preserve Business Owner approval from existing state (don't change it)
                            businessOwnerApproval: (selectedProcess.approvalData?.businessOwnerApproval || "Pending") as "Approved" | "Rejected" | "Pending",
                            // Update RPA CoE approval to "Approved" (we just approved it)
                            rpaCoEApproval: "Approved" as const,
                            // Preserve comments from existing state
                            comments: {
                              businessOwner: selectedProcess.approvalData?.comments?.businessOwner || "",
                              rpaCoE: approvalComments.rpaCoE?.trim() || selectedProcess.approvalData?.comments?.rpaCoE || "",
                            },
                            // Preserve approvalNeedsReview flag from existing state
                            approvalNeedsReview: selectedProcess.approvalData?.approvalNeedsReview || false,
                          };
                          
                          setApprovalData({
                            businessOwnerApproval: updatedApprovalData.businessOwnerApproval,
                            rpaCoEApproval: updatedApprovalData.rpaCoEApproval,
                          });
                          setApprovalComments(updatedApprovalData.comments);
                          
                          // Update selectedProcess - preserve status unless both approvals are complete
                          const bothCompleted = updatedApprovalData.businessOwnerApproval === "Approved" && updatedApprovalData.rpaCoEApproval === "Approved";
                          const backendProcess = refreshResponse.process;
                          const currentIncompleteStage = refreshResponse.currentStage
                            ? mapBackendStageToFrontend(refreshResponse.currentStage)
                            : mapBackendStageToFrontend(backendProcess.CurrentStage || null);
                          
                          setSelectedProcess((prev) => ({
                            ...prev,
                            status: bothCompleted ? (currentIncompleteStage as ProcessStage) : (prev?.status || "Approval"),
                            approvalData: updatedApprovalData,
                          }));
                        }

                        setOpenApprovalDialog(null);
                        toast({
                          title: "Re-Approval Submitted ✅",
                          description:
                            "RPA CoE approval has been updated successfully.",
                        });
                      } else {
                        throw new Error(
                          response.message || "Failed to update approval"
                        );
                      }
                    } catch (error: any) {
                      toast({
                        title: "Update Failed",
                        description:
                          error.message ||
                          "Failed to update approval. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSubmittingRpaCoEApproval(false);
                    }
                  }}
                >
                  {isSubmittingRpaCoEApproval ? (
                    <>
                      <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                      Re-Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Re-Approve
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
