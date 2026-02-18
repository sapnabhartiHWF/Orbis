import { useState, useEffect } from "react";
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
  Rocket,
  ClipboardList,
  DraftingCompass,
  Code,
  TestTube,
  UserCheck,
  Heart,
  Handshake,
  Shield,
  Lock,
  AlertTriangle,
  Tag,
  Pencil,
  Save,
  X,
  ArrowRight,
  Brain,
  Link2,
  Loader2,
  XCircle,
  Activity,
  BarChart3,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ProcessStageForms } from "@/components/ProcessStageForms";
import { Process, ProcessStage } from "@/types/ProcessTypes";
import {
  getAllProcessesSummary,
  getProcessDetail,
  mapBackendStageToFrontend,
  downloadSampleData,
  downloadSopDoc,
  getAllStages,
  StageData,
  getBusinessCase,
  getTechnicalAssessment,
  downloadPDD,
  apiCall,
} from "@/services/processRegistrationApi";
import { AutomationRoadmap } from "@/components/AutomationRoadmap";
import { BusinessROICalculator } from "@/components/BusinessROICalculator";
import { ApprovalWorkflowBoard } from "@/components/ApprovalWorkflowBoard";
import { TeamAssignments } from "@/components/TeamAssignments";

const departments = [
  "Finance",
  "HR",
  "Operations",
  "IT",
  "Legal",
  "Marketing",
  "Sales",
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Registration":
      return <FileText className="w-4 h-4" />;
    case "Initial Triage":
      return <ClipboardList className="w-4 h-4" />;
    case "Detailed Analysis":
      return <BarChart3 className="w-4 h-4" />;
    case "Technical Assessment":
      return <TestTube className="w-4 h-4" />;
    case "Business Case":
      return <DraftingCompass className="w-4 h-4" />;
    case "Development":
      return <Code className="w-4 h-4" />;
    case "QA":
      return <Shield className="w-4 h-4" />;
    case "UAT":
      return <UserCheck className="w-4 h-4" />;
    case "Go Live":
      return <Rocket className="w-4 h-4" />;
    case "Hypercare":
      return <Heart className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
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

export default function CenterOfExcellence() {
  // NEW: Backend stage state
  const [allStages, setAllStages] = useState<StageData[]>([]);
  const [processStages, setProcessStages] = useState<string[]>([]);
  const [isLoadingStages, setIsLoadingStages] = useState(true);

  const [processes, setProcesses] = useState<Process[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [isNewProcessOpen, setIsNewProcessOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isProcessDetailsOpen, setIsProcessDetailsOpen] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState<string>("process-info");

  // Form states
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
  const [dataSamplesUploaded, setDataSamplesUploaded] = useState(false);
  const [sopDocumentUploaded, setSopDocumentUploaded] = useState(false);

  // Stage form states
  const [triageData, setTriageData] = useState({
    isRuleBased: undefined as boolean | undefined,
    isStable: undefined as boolean | undefined,
    areExceptionsManageable: undefined as boolean | undefined,
    complianceRisk: undefined as boolean | undefined,
    complianceRiskSummary: "",
  });

  // Hardcoded: Stages that show forms in Process Details dialog
const STAGES_WITH_FORMS = [
  "Initial Triage",
  "Detailed Analysis",
  "Technical Assessment",
  "Business Case",
  "Development",
  "QA",
  "UAT",
];

  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sitData, setSitData] = useState({
    testNotes: "",
    credentialRequirements: "",
  });

  const [toBeDesignData, setToBeDesignData] = useState({
    workflowDiagram: "",
    workflowDiagramFile: undefined as File | undefined,
    exceptionHandlingPlan: "",
    exceptionHandlingPlanFile: undefined as File | undefined,
    retryMechanismRequired: false,
    retryMechanismDetails: "",
    credentialRequirements: "",
    vmInfraNeeded: "",
    orchestratorQueuesRequired: false,
    loggingRequirements: "",
    sddDocument: "",
    sddApprovalStatus: "Pending" as "Approved" | "Pending",
  });

  useEffect(() => {
    const fetchStages = async () => {
      try {
        setIsLoadingStages(true);
        const response = await getAllStages();
        
        if (response?.success && Array.isArray(response.stages)) {
          setAllStages(response.stages);
          
          // Extract stage names in sequence order
          const stageNames = response.stages
            .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
            .map((stage: StageData) => stage.stageName);
          
          setProcessStages(stageNames);
          // That's it! No filtering needed!
        }
      } catch (error: any) {
        console.error("Error loading stages:", error);
      } finally {
        setIsLoadingStages(false);
      }
    };
  
    fetchStages();
  }, []);
  

  // Helper functions using backend data
  const getStatusColor = (status: string) => {
    const stageIndex = allStages.findIndex(s => s.stageName === status);
    if (stageIndex === -1) return "bg-muted text-muted-foreground";
    
    const totalStages = allStages.length;
    const lastStage = allStages[totalStages - 1]?.stageName;
    
    if (status === lastStage)
      return "bg-green-500 text-white border-green-600 font-semibold";
    if (stageIndex < 2) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (stageIndex < 5)
      return "bg-warning/20 text-warning-foreground border-warning/30";
    if (stageIndex < 7)
      return "bg-primary/20 text-primary-foreground border-primary/30";
    if (stageIndex < 9)
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-green-500/20 text-green-600 border-green-500/30 font-medium";
  };

  const getStageProgress = (status: string): number => {
    const stageIndex = allStages.findIndex(s => s.stageName === status);
    if (stageIndex === -1) return 0;
    return ((stageIndex + 1) / allStages.length) * 100;
  };

  const stageHasForms = (stageName: string): boolean => {
    return true;
  };

  const mapSummaryRowToProcess = (p: any): Process => {
    const numericId =
      p.ProcessId ?? p.process_id ?? p.Id ?? p.id ?? p.ProcessID;
    const id =
      numericId !== undefined && numericId !== null
        ? `P${String(numericId).padStart(3, "0")}`
        : String(p.ProcessCode ?? p.Code ?? "P000");

    const rawStage =
      p.CurrentStage ?? p.StageName ?? p.Status ?? "Registration";

    const priority = (p.Priority ?? p.priority ?? "Medium") as
      | "Low"
      | "Medium"
      | "High"
      | "Critical";

    const complexity = (p.Complexity ?? p.complexity ?? "Medium") as
      | "Low"
      | "Medium"
      | "High";

    const stageStatus = p.CurrentStageStatus ?? p.status ?? null;

    const rawSamplePath =
      p.SampledataPath ??
      p.sampledataPath ??
      p.SampleDataPath ??
      p.sampledata_path ??
      p.Sampledata ??
      null;
    const rawSopPath =
      p.SopDoc ??
      p.sopDoc ??
      p.SOPDoc ??
      p.sop_doc ??
      p.Sop_Doc ??
      null;

    const getFileName = (path?: string | null): string | undefined => {
      if (!path) return undefined;
      const normalized = String(path).replace(/\\\\/g, "/");
      const parts = normalized.split("/");
      const name = parts[parts.length - 1];
      return name || undefined;
    };

    const registrationDocuments =
      rawSamplePath || rawSopPath
        ? {
          dataSamples: getFileName(rawSamplePath),
          sopDocument: getFileName(rawSopPath),
        }
        : undefined;

    return {
      id,
      title: p.Title ?? p.title ?? "",
      description: p.Description ?? p.description ?? "",
      department: p.Department ?? p.department ?? "",
      priority,
      expectedROI: Number(p.ExpectedROI ?? p.expectedROI ?? 0),
      status: mapBackendStageToFrontend(rawStage),
      stageStatus,
      submittedBy:
        p.CreatedByName ??
        p.createdByName ??
        "Unknown",
      submittedDate:
        p.SubmittedDate ??
        p.submittedDate ??
        p.CreatedAt ??
        p.createdAt ??
        new Date().toISOString(),
      estimatedSavings: Number(p.EstimatedSavings ?? p.estimatedSavings ?? 0),
      complexity,
      dependencies: [],
      stakeholders: p.Stakeholder
        ? String(p.Stakeholder)
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
      tags: p.Tag
        ? String(p.Tag)
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
      registrationDocuments,
    };
  };

  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);
  const [isLoadingProcessDetail, setIsLoadingProcessDetail] = useState(false);
  const [businessCaseData, setBusinessCaseData] = useState<any>(null);
  const [hasBusinessCaseData, setHasBusinessCaseData] = useState(false);
  const [isLoadingBusinessCase, setIsLoadingBusinessCase] = useState(false);
  const [technicalAssessmentData, setTechnicalAssessmentData] = useState<any>(null);
  const [hasTechnicalAssessmentData, setHasTechnicalAssessmentData] = useState(false);
  const [isLoadingTechnicalAssessment, setIsLoadingTechnicalAssessment] = useState(false);
  const [isDownloadingPDD, setIsDownloadingPDD] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);
  const [isDownloadingSop, setIsDownloadingSop] = useState(false);

  const [isPreviewingPDD, setIsPreviewingPDD] = useState(false);
  const [pddPreviewHtml, setPddPreviewHtml] = useState<string | null>(null);
  const [pddPreviewUrl, setPddPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const fetchProcesses = async () => {
      try {
      setIsLoadingProcesses(true);
        const response = await getAllProcessesSummary();
        if (response?.success && Array.isArray(response.processes)) {
          const mapped: Process[] = response.processes.map(mapSummaryRowToProcess);
          setProcesses(mapped);
        } else if (!response?.success) {
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
          description:
            error?.message || "Something went wrong while fetching processes.",
          variant: "destructive",
        });
    } finally {
      setIsLoadingProcesses(false);
      }
    };

  useEffect(() => {
    if (!isLoadingStages) {
    fetchProcesses();
    }
  }, [isLoadingStages]);

  useEffect(() => {
    const handleProcessUpdate = async (event: any) => {
      await fetchProcesses();
      
      if (selectedProcess && isProcessDetailsOpen) {
        const updatedProcessId = event?.detail?.processId;
        const currentProcessId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
        
        if (updatedProcessId && updatedProcessId === currentProcessId) {
          try {
            setIsLoadingProcessDetail(true);
            const response = await getProcessDetail(currentProcessId);
            if (response?.success && response.process) {
              const mapped = mapSummaryRowToProcess(response.process);
              setSelectedProcess(mapped);
            }
          } catch (error: any) {
            console.error("Error refreshing process detail:", error);
          } finally {
            setIsLoadingProcessDetail(false);
          }
        }
      }
    };

    window.addEventListener('processUpdated', handleProcessUpdate);
    return () => {
      window.removeEventListener('processUpdated', handleProcessUpdate);
    };
  }, [selectedProcess, isProcessDetailsOpen]);

  const filteredProcesses = processes.filter((process) => {
    const matchesSearch =
      process.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === "All" || process.department === departmentFilter;
    const matchesPriority =
      priorityFilter === "All" || process.priority === priorityFilter;
    return matchesSearch && matchesDepartment && matchesPriority;
  });

  const handleProcessClick = async (process: Process) => {
    setSelectedProcess(process);
    setIsProcessDetailsOpen(true);
    setActiveDetailsTab("process-info");

    try {
      setIsLoadingProcessDetail(true);
      const numericId = parseInt(process.id.replace(/\D/g, ""), 10);
      if (!isNaN(numericId)) {
        // Fetch process detail
        const response = await getProcessDetail(numericId);
        if (response?.success && response.process) {
          const mapped = mapSummaryRowToProcess(response.process);
          setSelectedProcess(mapped);
        } else {
          console.warn("Failed to fetch process detail, using cached data");
        }

        // Fetch business case data
        setIsLoadingBusinessCase(true);
        try {
          const businessCaseResponse = await getBusinessCase(numericId);
          if (businessCaseResponse?.success) {
            if (businessCaseResponse.hasData && businessCaseResponse.businessCase) {
              const raw = businessCaseResponse.businessCase;

              // Helper to safely extract numeric fields regardless of case/underscore differences
              const getNumericField = (logicalName: string): number | undefined => {
                if (!raw || typeof raw !== "object") return undefined;
                const target = logicalName.toLowerCase();
                let value: any = undefined;

                for (const [key, v] of Object.entries(raw)) {
                  const normalizedKey = key.toLowerCase().replace(/_/g, "");
                  if (normalizedKey === target) {
                    value = v;
                    break;
                  }
                }

                if (value === null || value === undefined) return undefined;
                const num = Number(value);
                return isNaN(num) ? undefined : num;
              };

              const normalizedBusinessCase = {
                // keep raw for debugging/extension if needed
                raw,
                FteSavings: getNumericField("ftesavings"),
                CostSavings: getNumericField("costsavings"),
                ImplementationCost: getNumericField("implementationcost"),
                PaybackMonths: getNumericField("paybackmonths"),
                RoiPercent: getNumericField("roipercent"),
              };

              setBusinessCaseData(normalizedBusinessCase);
              setHasBusinessCaseData(true);
      } else {
              setBusinessCaseData(null);
              setHasBusinessCaseData(false);
            }
          }
        } catch (bcError: any) {
          console.error("Error loading business case:", bcError);
          setBusinessCaseData(null);
          setHasBusinessCaseData(false);
        } finally {
          setIsLoadingBusinessCase(false);
        }

        // Fetch technical assessment data
        setIsLoadingTechnicalAssessment(true);
        try {
          const techAssessmentResponse = await getTechnicalAssessment(numericId);
          if (techAssessmentResponse?.success) {
            if (techAssessmentResponse.hasData && techAssessmentResponse.technicalAssessment) {
              setTechnicalAssessmentData(techAssessmentResponse.technicalAssessment);
              setHasTechnicalAssessmentData(true);
            } else {
              setTechnicalAssessmentData(null);
              setHasTechnicalAssessmentData(false);
            }
          }
        } catch (taError: any) {
          console.error("Error loading technical assessment:", taError);
          setTechnicalAssessmentData(null);
          setHasTechnicalAssessmentData(false);
        } finally {
          setIsLoadingTechnicalAssessment(false);
        }
      }
    } catch (error: any) {
      console.error("Error loading process detail:", error);
      toast({
        title: "Failed to load process details",
        description: error?.message || "Using cached process data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProcessDetail(false);
    }
  };

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-500/20 text-green-600 border-green-500/30 font-medium";
      case "Pending":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30 font-medium";
      case "Rejected":
        return "bg-red-500/20 text-red-600 border-red-500/30 font-medium";
      case "In Progress":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30 font-medium";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStageStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-4 h-4" />;
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      case "In Progress":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoadingStages) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-lg">Loading stage configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 bg-background">
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

            <Dialog open={isNewProcessOpen} onOpenChange={setIsNewProcessOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Submit Process
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit New Process</DialogTitle>
                  <DialogDescription>
                    Provide process details to register it in the automation pipeline.
                  </DialogDescription>
                </DialogHeader>

                <ProcessStageForms
                  selectedProcess={null}
                  triageData={triageData}
                  setTriageData={setTriageData}
                  rejectionReason={rejectionReason}
                  setRejectionReason={setRejectionReason}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                  sitData={sitData}
                  setSitData={setSitData}
                  toBeDesignData={toBeDesignData}
                  setToBeDesignData={setToBeDesignData}
                  getPriorityColor={getPriorityColor}
                  formData={formData}
                  setFormData={setFormData}
                  currentStakeholder={currentStakeholder}
                  setCurrentStakeholder={setCurrentStakeholder}
                  currentTag={currentTag}
                  setCurrentTag={setCurrentTag}
                  dataSamplesUploaded={dataSamplesUploaded}
                  setDataSamplesUploaded={setDataSamplesUploaded}
                  sopDocumentUploaded={sopDocumentUploaded}
                  setSopDocumentUploaded={setSopDocumentUploaded}
                  departments={departments}
                  isNewProcessOpen={isNewProcessOpen}
                  setIsNewProcessOpen={setIsNewProcessOpen}
                />
              </DialogContent>
            </Dialog>
          </div>

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
                      {processes.filter(p => p.status !== processStages[processStages.length - 1]).length}
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
                      {processes.filter(p => p.status === processStages[processStages.length - 1]).length}
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
                      ${(processes.reduce((sum, p) => sum + p.expectedROI, 0) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Tabs defaultValue="processes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
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
          <TabsTrigger
            value="team-assignments"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Team Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-6">
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
                >
                  <Target className="w-4 h-4" />
                  ROI Calculator
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  Approval Board
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Business process automation pipeline through {processStages.length} stages from intake to completion
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
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search processes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

              {isLoadingProcesses ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
                    <Badge variant="outline" className="text-xs font-mono">
                      {process.id}
                    </Badge>
                    <Badge className={getPriorityColor(process.priority)}>
                      {process.priority}
                    </Badge>
                  </div>
                          <div className="flex flex-col items-end gap-2">
                  <Badge className={getStatusColor(process.status)}>
                    {getStatusIcon(process.status)}
                    <span className="ml-1">{process.status}</span>
                  </Badge>

                            {process.stageStatus && (
                              <Badge className={getStageStatusColor(process.stageStatus)}>
                                {getStageStatusIcon(process.stageStatus)}
                                <span className="ml-1">{process.stageStatus}</span>
                              </Badge>
                            )}
                          </div>
                </div>

                <CardTitle className="text-lg">{process.title}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {process.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Department</span>
                  <Badge variant="outline" className="text-xs">
                    <Building className="w-3 h-3 mr-1" />
                    {process.department}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected ROI</span>
                    <span className="font-medium text-success">
                      ${process.expectedROI.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pipeline Progress</span>
                    <span className="text-xs font-medium">
                      {Math.round(getStageProgress(process.status))}%
                    </span>
                  </div>
                  <Progress value={getStageProgress(process.status)} className="h-2" />
                </div>
              </CardContent>
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
                          Finance department shows 340% ROI potential for process automation
                        </p>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg">
                        <p className="text-sm font-medium">
                          Quick Win Identified
                        </p>
                        <p className="text-xs opacity-90">
                          Invoice processing automation can be deployed within 2 weeks
                        </p>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg">
                        <p className="text-sm font-medium">
                          Resource Optimization
                        </p>
                        <p className="text-xs opacity-90">
                          Current pipeline can save 2,400 hours annually across departments
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
                          {processes.filter(p => p.status === processStages[processStages.length - 1]).length}
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
          <ApprovalWorkflowBoard onProcessUpdated={fetchProcesses} />
        </TabsContent>

        <TabsContent value="team-assignments" className="space-y-6">
          <TeamAssignments />
        </TabsContent>
      </Tabs>

      <Dialog 
        open={isProcessDetailsOpen} 
        onOpenChange={(open) => {
          setIsProcessDetailsOpen(open);
          if (!open) {
            // Reset business case and technical assessment data when dialog closes
            setBusinessCaseData(null);
            setHasBusinessCaseData(false);
            setTechnicalAssessmentData(null);
            setHasTechnicalAssessmentData(false);
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {isLoadingProcessDetail ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Loading process details...</p>
            </div>
          ) : selectedProcess && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{selectedProcess.id}</Badge>
                    <Badge className={getPriorityColor(selectedProcess.priority)}>
                      {selectedProcess.priority}
                    </Badge>
                    <Badge className={getStatusColor(selectedProcess.status)}>
                      {getStatusIcon(selectedProcess.status)}
                      <span className="ml-1">{selectedProcess.status}</span>
                    </Badge>
                    {selectedProcess.stageStatus && (
                      <Badge className={getStageStatusColor(selectedProcess.stageStatus)}>
                        {getStageStatusIcon(selectedProcess.stageStatus)}
                        <span className="ml-1">{selectedProcess.stageStatus}</span>
                      </Badge>
                    )}
                  </div>
                </div>
                <DialogTitle className="text-2xl">{selectedProcess.title}</DialogTitle>
              </DialogHeader>

              <Tabs value={activeDetailsTab} onValueChange={setActiveDetailsTab}>
                <TabsList className={`grid w-full ${(() => {
                  let count = 1; // Process Info
                  if (hasTechnicalAssessmentData) count++;
                  if (hasBusinessCaseData) count++;
                  if (selectedProcess.status !== "Initial Triage" && 
                      !(selectedProcess.stageStatus === "Pending" || !selectedProcess.stageStatus)) count++;
                  return `grid-cols-${count}`;
                })()} bg-card border border-border`}>
                  <TabsTrigger
                    value="process-info"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Process Info
                  </TabsTrigger>
                  {/* Only show Technical tab if data exists */}
                  {hasTechnicalAssessmentData && (
                    <TabsTrigger
                      value="technical"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      Technical
                    </TabsTrigger>
                  )}
                  {/* Only show Business Case tab if data exists */}
                  {hasBusinessCaseData && (
                    <TabsTrigger
                      value="business-case"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Business Case
                    </TabsTrigger>
                  )}
                  {
                   !(selectedProcess.status === "Initial Triage" && 
                     (selectedProcess.stageStatus === "Pending" || !selectedProcess.stageStatus)) && (
                    <TabsTrigger
                      value="current-stage"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      {selectedProcess.status}
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="process-info" className="space-y-6 mt-6">
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
                            {new Date(selectedProcess.submittedDate).toLocaleDateString()}
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
                            {selectedProcess.tags && selectedProcess.tags.length > 0 ? (
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
                              <span className="text-xs text-muted-foreground">No tags</span>
                            )}
                      </div>
                        </div>
                        <div className="pt-3 border-t border-border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Stakeholders
                          </p>
                          {selectedProcess.stakeholders && selectedProcess.stakeholders.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {selectedProcess.stakeholders.map((stakeholder, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs px-2 py-1 border-purple-300 dark:border-purple-700"
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  {stakeholder}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No stakeholders added</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedProcess.registrationDocuments &&
                    (selectedProcess.registrationDocuments.dataSamples ||
                      selectedProcess.registrationDocuments.sopDocument) && (
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
                          {selectedProcess.registrationDocuments.dataSamples && (
                            <div className="group relative space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-300/30 dark:border-green-700/30 flex-shrink-0">
                                  <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                  <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                    SAMPLES
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Download Button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-semibold px-2.5 py-1"
                                    onClick={async () => {
                                      try {
                                        setIsDownloadingSample(true);
                                        const processIdFromId = selectedProcess?.id ? parseInt(String(selectedProcess.id).replace(/\D/g, ""), 10) : NaN;
                                        const processId = (selectedProcess as any)?.ProcessId ?? (!isNaN(processIdFromId) ? processIdFromId : undefined);
                                        if (processId === undefined || isNaN(processId)) {
                                          throw new Error("Unable to determine process id for download");
                                        }

                                        const originalName = selectedProcess?.registrationDocuments?.dataSamples ?? (selectedProcess as any)?.SampledataPath ?? undefined;

                                        const { blob, filename } = await downloadSampleData(processId, originalName);

                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = filename;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                      } catch (error) {
                                        console.error("Download failed:", error);
                                        toast({ title: "Download failed", description: (error as any)?.message || "Could not download file." });
                                      } finally {
                                        setIsDownloadingSample(false);
                                      }
                                    }}
                                    disabled={isDownloadingSample}
                                  >
                                    {isDownloadingSample ? (
                                      <>
                                        <Loader2 className="w-3 h-3 mr-1.0 animate-spin" />
                                        Downloading...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-3 h-3 mr-1.0" />
                                        Download
                                      </>
                                    )}
                                  </Button>

                                  {/* Upload Status Badge */}
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1.5" />
                                    Uploaded
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  DATA
                                </Label>
                                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border-2 border-green-200/50 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {selectedProcess.registrationDocuments.dataSamples}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedProcess.registrationDocuments.sopDocument && (
                            <div className="group relative space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-300/30 dark:border-green-700/30 flex-shrink-0">
                                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                  <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
                                    DOCUMENT
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Download Button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-semibold px-2.5 py-1"
                                    onClick={async () => {
                                      try {
                                        setIsDownloadingSop(true);
                                        // Resolve process id (some objects use ProcessId, others use id)
                                        const processIdFromId = selectedProcess?.id ? parseInt(String(selectedProcess.id).replace(/\D/g, ""), 10) : NaN;
                                        const processId = (selectedProcess as any)?.ProcessId ?? (!isNaN(processIdFromId) ? processIdFromId : undefined);
                                        if (processId === undefined || isNaN(processId)) {
                                          throw new Error("Unable to determine process id for download");
                                        }

                                        // Prefer the registrationDocuments.sopDocument value if available
                                        const originalName = selectedProcess?.registrationDocuments?.sopDocument ?? (selectedProcess as any)?.SopDoc ?? undefined;

                                        const { blob, filename } = await downloadSopDoc(processId, originalName);

                                        // Create URL
                                        const url = window.URL.createObjectURL(blob);

                                        // Create temporary link
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = filename;

                                        document.body.appendChild(a);
                                        a.click();

                                        // Cleanup
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                      } catch (error) {
                                        console.error("Download failed:", error);
                                        toast({ title: "Download failed", description: (error as any)?.message || "Could not download file." });
                                      } finally {
                                        setIsDownloadingSop(false);
                                      }
                                    }}
                                    disabled={isDownloadingSop}
                                  >
                                    {isDownloadingSop ? (
                                      <>
                                        <Loader2 className="w-3 h-3 mr-1.0 animate-spin" />
                                        Downloading...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-3 h-3 mr-1.0" />
                                        Download
                                      </>
                                    )}
                                  </Button>

                                  {/* Upload Status Badge */}
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-success/20 text-success border-success font-semibold px-2.5 py-1"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1.5" />
                                    Uploaded
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  SOP
                                </Label>
                                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border-2 border-green-200/50 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {selectedProcess.registrationDocuments.sopDocument}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

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
                                const stageIndex = processStages.indexOf(selectedProcess.status);
                                return stageIndex >= 0 ? `${stageIndex + 1} of ${processStages.length}` : `0 of ${processStages.length}`;
                              })()}
                            </p>
                        </div>
                        </div>

                        <div className="relative pt-8 pb-16">
                          <div className="flex justify-between items-start relative">
                            {processStages.map((stage, index) => {
                              const currentStageIndex = processStages.indexOf(selectedProcess.status);
                              const isCompleted = currentStageIndex >= 0 && index < currentStageIndex;
                              const isCurrent = index === currentStageIndex;

                              return (
                                <div key={index} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                                  {index < processStages.length - 1 && (
                                    <div
                                      className={`absolute top-5 left-1/2 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                      style={{
                                        width: 'calc(100% + 0px)',
                                        zIndex: 0
                                      }}
                                    />
                                  )}

                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 ${isCurrent
                                        ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                                        : isCompleted
                                          ? 'bg-green-500 text-white border-green-600'
                                          : 'bg-white dark:bg-gray-800 text-muted-foreground border-gray-300 dark:border-gray-600'
                                      }`}
                                  >
                                    {index + 1}
                                  </div>

                                  <div className="absolute top-12 text-center w-20">
                                    <p className={`text-[10px] leading-tight ${isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                      {stage.split(' ')[0]}
                                      {stage.split(' ').length > 1 && (
                                        <>
                                          <br />
                                          {stage.split(' ').slice(1).join(' ')}
                                        </>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {selectedProcess.status === "Initial Triage" && 
                         (selectedProcess.stageStatus === "Pending" || !selectedProcess.stageStatus) && (
                          <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-200 mb-1">
                                  Awaiting Approval
                                </p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                  This process is currently in Initial Triage and requires approval. Please visit the <strong>Approvals</strong> tab to review and approve this process.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {selectedProcess.status === "Initial Triage" && 
                         selectedProcess.stageStatus === "Approved" && (
                          <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm text-green-800 dark:text-green-200 mb-1">
                                  Stage Approved
                                </p>
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

                {/* Technical Assessment Tab - Only show if data exists */}
                {hasTechnicalAssessmentData && (
                  <TabsContent value="technical" className="space-y-6 mt-6">
                    {isLoadingTechnicalAssessment ? (
                      <div className="flex flex-col items-center justify-center p-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-muted-foreground">Loading technical assessment data...</p>
                      </div>
                    ) : technicalAssessmentData ? (
                      <Card className="bg-gradient-to-br from-cyan-50/30 dark:from-cyan-950/10 via-card to-card border-2 border-cyan-200/50 dark:border-cyan-800/30 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-cyan-50/50 dark:from-cyan-950/20 to-transparent border-b border-cyan-200/50 dark:border-cyan-800/30 pb-4">
                          <CardTitle className="text-xl font-bold flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-cyan-500/10">
                              <Rocket className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            Technical Requirement and Assessment
                          </CardTitle>
                          <CardDescription className="text-base mt-2">
                            Technical feasibility, infrastructure requirements, and Process Definition Document (PDD) information
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                          {/* Detailed Analysis / PDD Section - Moved to Top */}
                          {technicalAssessmentData.DA_pddPath && (
                            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-semibold text-muted-foreground uppercase">
                                    PDD Document
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    {/* Download Button */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isDownloadingPDD}
                                      className="gap-2"
                                      onClick={async () => {
                                        if (!selectedProcess) {
                                          toast({
                                            title: "Error",
                                            description: "No process selected",
                                            variant: "destructive",
                                          });
                                          return;
                                        }

                                        setIsDownloadingPDD(true);
                                        try {
                                          const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
                                          if (isNaN(numericId)) {
                                            throw new Error("Invalid process ID");
                                          }

                                          const fileName = technicalAssessmentData.DA_pddPath?.split(/[/\\]/).pop() || "pdd_document";

                                          // Fetch PDD file
                                          const response = await apiCall(`/api/download-process-pdd/${numericId}`, {
                                            method: "GET",
                                          });

                                          if (!response.ok) {
                                            let errorMsg = `Download failed: ${response.status}`;
                                            try {
                                              const err = await response.json().catch(() => null);
                                              if (err) {
                                                errorMsg = err.message || err.b || JSON.stringify(err) || errorMsg;
                                              }
                                            } catch (_e) {}
                                            throw new Error(errorMsg);
                                          }

                                          const blob = await response.blob();
                                          const cd = response.headers.get("Content-Disposition") || "";
                                          const inferredNameMatch = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                                          const inferredName = inferredNameMatch?.[1]?.replace(/['"]]/g, "") || fileName;

                                          // Create download link and trigger download
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement("a");
                                          a.href = url;
                                          a.download = inferredName;
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          URL.revokeObjectURL(url);

                                          toast({
                                            title: "Download Successful",
                                            description: "PDD document downloaded successfully",
                                          });
                                        } catch (error: any) {
                                          console.error("Error downloading PDD:", error);
                                          toast({
                                            title: "Download Failed",
                                            description:
                                              error?.message ||
                                              "Failed to download PDD document. Please try again.",
                                            variant: "destructive",
                                          });
                                        } finally {
                                          setIsDownloadingPDD(false);
                                        }
                                      }}
                                    >
                                      {isDownloadingPDD ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Downloading...
                                        </>
                                      ) : (
                                        <>
                                          <Download className="w-4 h-4" />
                                          Download
                                        </>
                                      )}
                                    </Button>

                                    {/* Preview Button */}
                                    <Button
                                      size="sm"
                                      className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                                      onClick={async () => {
                                        if (!selectedProcess) {
                                          toast({
                                            title: "Error",
                                            description: "No process selected",
                                            variant: "destructive",
                                          });
                                          return;
                                        }

                                        try {
                                          const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
                                          if (isNaN(numericId)) {
                                            throw new Error("Invalid process ID");
                                          }

                                          // Open preview dialog immediately
                                          setIsPreviewingPDD(true);
                                          setIsPreviewLoading(true);
                                          setPddPreviewHtml(null);

                                          if (pddPreviewUrl) {
                                            URL.revokeObjectURL(pddPreviewUrl);
                                            setPddPreviewUrl(null);
                                          }

                                          // Fetch PDD file
                                          const response = await apiCall(
                                            `/api/download-process-pdd/${numericId}`,
                                            { method: "GET" }
                                          );

                                          if (!response.ok) {
                                            const err = await response.json().catch(() => null);
                                            throw new Error(
                                              err?.message || `Download failed: ${response.status}`
                                            );
                                          }

                                          const blob = await response.blob();
                                          const cd = response.headers.get("Content-Disposition") || "";
                                          const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                                          const inferredName =
                                            match?.[1]?.replace(/['"]]/g, "") ||
                                            (technicalAssessmentData.DA_pddPath?.split(/[/\\]/).pop() ||
                                              "pdd_document");
                                          const lower = inferredName.toLowerCase();

                                          // PDF: show in iframe
                                          if (
                                            lower.endsWith(".pdf") ||
                                            response.headers.get("Content-Type")?.includes("pdf")
                                          ) {
                                            const url = URL.createObjectURL(blob);
                                            setPddPreviewUrl(url);
                                            setIsPreviewingPDD(true);
                                          }
                                          // Excel: try dynamic import
                                          else if (
                                            lower.endsWith(".xlsx") ||
                                            lower.endsWith(".xls") ||
                                            response.headers.get("Content-Type")?.includes("spreadsheet")
                                          ) {
                                            try {
                                              // Dynamic import with @vite-ignore to prevent static analysis
                                              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                              // @ts-ignore
                                              const XLSX = (await import(/* @vite-ignore */ "xlsx")) as any;
                                              const ab = await blob.arrayBuffer();
                                              const wb = XLSX.read(new Uint8Array(ab), { type: "array" });
                                              const first = wb.SheetNames && wb.SheetNames[0];

                                              if (first) {
                                                const html = XLSX.utils.sheet_to_html(wb.Sheets[first]);
                                                setPddPreviewHtml(html);
                                                setIsPreviewingPDD(true);
                                              } else {
                                                const url = URL.createObjectURL(blob);
                                                setPddPreviewUrl(url);
                                                setIsPreviewingPDD(true);
                                              }
                                            } catch (xlsxErr) {
                                              console.warn("xlsx dynamic import failed", xlsxErr);
                                              const url = URL.createObjectURL(blob);
                                              setPddPreviewUrl(url);
                                              setIsPreviewingPDD(true);
                                            }
                                          }
                                          // Other files: open blob URL
                                          else {
                                            const url = URL.createObjectURL(blob);
                                            setPddPreviewUrl(url);
                                            setIsPreviewingPDD(true);
                                          }
                                        } catch (err: any) {
                                          console.error("Preview failed:", err);
                                          toast({
                                            title: "Preview failed",
                                            description: err?.message || "Could not preview file.",
                                            variant: "destructive",
                                          });
                                        } finally {
                                          setIsPreviewLoading(false);
                                        }
                                      }}
                                    >
                                      Preview
                                    </Button>
                                  </div>
                                </div>

                                {/* Filename Display */}
                                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                  <p className="text-sm font-medium text-foreground">
                                    {technicalAssessmentData.DA_pddPath.split(/[/\\]/).pop() ||
                                      technicalAssessmentData.DA_pddPath}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Technical Assessment Fields */}
                          {(technicalAssessmentData.TA_id || technicalAssessmentData.TA_infrastructure_ready !== null || technicalAssessmentData.TA_infrastructure_ready !== undefined) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {technicalAssessmentData.TA_infrastructure_ready !== null && technicalAssessmentData.TA_infrastructure_ready !== undefined && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-muted-foreground uppercase">Infrastructure Ready</Label>
                                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                    <p className="text-lg font-bold text-foreground">
                                      {technicalAssessmentData.TA_infrastructure_ready ? "Yes" : "No"}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {technicalAssessmentData.TA_bot_hosting_type && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-muted-foreground uppercase">Bot Hosting Type</Label>
                                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                    <p className="text-lg font-bold text-foreground">{technicalAssessmentData.TA_bot_hosting_type}</p>
                                  </div>
                                </div>
                              )}
                              {technicalAssessmentData.TA_credential_vault_required !== null && technicalAssessmentData.TA_credential_vault_required !== undefined && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-muted-foreground uppercase">Credential Vault Required</Label>
                                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                    <p className="text-lg font-bold text-foreground">
                                      {technicalAssessmentData.TA_credential_vault_required ? "Yes" : "No"}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {technicalAssessmentData.TA_risk_level && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold text-muted-foreground uppercase">Risk Level</Label>
                                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                    <p className="text-lg font-bold text-foreground">{technicalAssessmentData.TA_risk_level}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {technicalAssessmentData.TA_external_system_dependencies && (
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-muted-foreground uppercase">External System Dependencies</Label>
                              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                <p className="text-sm text-foreground whitespace-pre-wrap">{technicalAssessmentData.TA_external_system_dependencies}</p>
                              </div>
                            </div>
                          )}
                          {technicalAssessmentData.TA_licensing_impact && (
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-muted-foreground uppercase">Licensing Impact</Label>
                              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                <p className="text-sm text-foreground">{technicalAssessmentData.TA_licensing_impact}</p>
                              </div>
                            </div>
                          )}
                          {technicalAssessmentData.TA_technical_comments && (
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-muted-foreground uppercase">Technical Comments</Label>
                              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                <p className="text-sm text-foreground whitespace-pre-wrap">{technicalAssessmentData.TA_technical_comments}</p>
                              </div>
                            </div>
                          )}
                         
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-card border-border">
                        <CardContent className="p-12 text-center">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No technical assessment data available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                )}

                {/* Business Case Tab - Only show if data exists */}
                {hasBusinessCaseData && (
                  <TabsContent value="business-case" className="space-y-6 mt-6">
                    {isLoadingBusinessCase ? (
                      <div className="flex flex-col items-center justify-center p-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-muted-foreground">Loading business case data...</p>
                      </div>
                    ) : businessCaseData ? (
                      <Card className="bg-gradient-to-br from-emerald-50/30 dark:from-emerald-950/10 via-card to-card border-2 border-emerald-200/50 dark:border-emerald-800/30 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-emerald-50/50 dark:from-emerald-950/20 to-transparent border-b border-emerald-200/50 dark:border-emerald-800/30 pb-4">
                          <CardTitle className="text-xl font-bold flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-emerald-500/10">
                              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            Business Case
                          </CardTitle>
                          <CardDescription className="text-base mt-2">
                            Financial analysis and ROI calculations
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {businessCaseData.FteSavings !== null && businessCaseData.FteSavings !== undefined && (
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-muted-foreground uppercase">FTE Savings</Label>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                  <p className="text-2xl font-bold text-foreground">{businessCaseData.FteSavings}</p>
                                </div>
                              </div>
                            )}
                            {businessCaseData.CostSavings !== null && businessCaseData.CostSavings !== undefined && (
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-muted-foreground uppercase">Cost Savings ($)</Label>
                                <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                                  <p className="text-2xl font-bold text-success">
                                    ${Number(businessCaseData.CostSavings).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                            {businessCaseData.ImplementationCost !== null && businessCaseData.ImplementationCost !== undefined && (
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-muted-foreground uppercase">Implementation Cost ($)</Label>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                  <p className="text-2xl font-bold text-foreground">
                                    ${Number(businessCaseData.ImplementationCost).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                            {businessCaseData.PaybackMonths !== null && businessCaseData.PaybackMonths !== undefined && (
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-muted-foreground uppercase">Payback Period (Months)</Label>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                  <p className="text-2xl font-bold text-foreground">{businessCaseData.PaybackMonths}</p>
                                </div>
                              </div>
                            )}
                            {businessCaseData.RoiPercent !== null && businessCaseData.RoiPercent !== undefined && (
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-muted-foreground uppercase">ROI (%)</Label>
                                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                                  <p className="text-2xl font-bold text-primary">{businessCaseData.RoiPercent}%</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Summary Card */}
                          {businessCaseData.CostSavings && businessCaseData.ImplementationCost && (
                            <Card className="bg-gradient-to-br from-emerald-50 dark:from-emerald-950/30 to-transparent border-2 border-emerald-200 dark:border-emerald-800">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                  Business Case Summary
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Annual Savings:</span>
                                  <span className="font-bold text-success">
                                    ${Number(businessCaseData.CostSavings).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Implementation Cost:</span>
                                  <span className="font-bold">
                                    ${Number(businessCaseData.ImplementationCost).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Net Benefit (Year 1):</span>
                                  <span className="font-bold text-primary">
                                    ${(Number(businessCaseData.CostSavings) - Number(businessCaseData.ImplementationCost)).toLocaleString()}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-card border-border">
                        <CardContent className="p-12 text-center">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No business case data available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                )}

                {stageHasForms(selectedProcess.status) && 
                 !(selectedProcess.status === "Initial Triage" && 
                   (selectedProcess.stageStatus === "Pending" || !selectedProcess.stageStatus)) && (
                  <TabsContent value="current-stage" className="mt-6">
                <ProcessStageForms
                  selectedProcess={selectedProcess}
                  triageData={triageData}
                  setTriageData={setTriageData}
                  rejectionReason={rejectionReason}
                  setRejectionReason={setRejectionReason}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                  sitData={sitData}
                  setSitData={setSitData}
                  toBeDesignData={toBeDesignData}
                  setToBeDesignData={setToBeDesignData}
                  getPriorityColor={getPriorityColor}
                  formData={formData}
                  setFormData={setFormData}
                  currentStakeholder={currentStakeholder}
                  setCurrentStakeholder={setCurrentStakeholder}
                  currentTag={currentTag}
                  setCurrentTag={setCurrentTag}
                  dataSamplesUploaded={dataSamplesUploaded}
                  setDataSamplesUploaded={setDataSamplesUploaded}
                  sopDocumentUploaded={sopDocumentUploaded}
                  setSopDocumentUploaded={setSopDocumentUploaded}
                  departments={departments}
                  isNewProcessOpen={isNewProcessOpen}
                  setIsNewProcessOpen={setIsNewProcessOpen}
                />
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* PDD Preview Dialog */}
      <Dialog open={isPreviewingPDD} onOpenChange={setIsPreviewingPDD}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>PDD Document Preview</DialogTitle>
            <DialogDescription>
              {technicalAssessmentData?.DA_pddPath?.split(/[/\\]/).pop() || "PDD Document"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading preview...</p>
              </div>
            ) : pddPreviewHtml ? (
              <div 
                className="overflow-auto"
                dangerouslySetInnerHTML={{ __html: pddPreviewHtml }}
              />
            ) : pddPreviewUrl ? (
              <iframe
                src={pddPreviewUrl}
                className="w-full h-full min-h-[600px] border rounded"
                title="PDD Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No preview available</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewingPDD(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}