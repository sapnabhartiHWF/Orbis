import { useState, useEffect } from "react"
import {
  ClipboardList,
  CheckCircle,
  Check,
  AlertTriangle,
  FileText,
  Upload,
  Building,
  Rocket,
  Brain,
  Save,
  X,
  TrendingUp,
  Loader2,
  Code2,
  FlaskConical,
  Users,
  ShieldCheck,
  HeartPulse,
  Plus,
  Tag,
  Clock,
  Handshake,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import {
  createInitialTriage,
  createProcessRegistration,
  uploadProcessRegistrationFile,
  approveStage,
  rejectStage,
  getStageIdByName,
  createDetailedAnalysis,
  createTechnicalAssessment,
  createBusinessCase,
  completeUATStage,
  createGoLiveStage,
  completeHypercareStage,
  getStageTracking,
  completeQAStage,
  submitHandoverStage,
  getHandoverStage,
  updateProcessRegistration,
  updateDetailedAnalysis,
  updateBusinessCase,
  updateHandoverStage,
} from "@/services/processRegistrationApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Process } from "@/types/ProcessTypes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiCall } from "@/services/api"

interface ProcessStageFormsProps {
  selectedProcess: Process | null
  triageData: {
    isRuleBased: boolean
    isStable: boolean
    areExceptionsManageable: boolean
    complianceRisk: boolean
    complianceRiskSummary: string
  }
  setTriageData: React.Dispatch<React.SetStateAction<any>>
  rejectionReason: string
  setRejectionReason: React.Dispatch<React.SetStateAction<string>>
  isSubmitting: boolean
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>
  sitData: {
    testNotes: string
    credentialRequirements: string
  }
  setSitData: React.Dispatch<React.SetStateAction<any>>

  getPriorityColor: (priority: string) => string
  formData: {
    title: string
    department: string
    description: string
    priority: "Low" | "Medium" | "High" | "Critical" | ""
    expectedROI: string
    stakeholders: string[]
    tags: string[]
  }
  setFormData: React.Dispatch<React.SetStateAction<any>>
  currentStakeholder: string
  setCurrentStakeholder: React.Dispatch<React.SetStateAction<string>>
  currentTag: string
  setCurrentTag: React.Dispatch<React.SetStateAction<string>>
  dataSamplesUploaded: boolean
  setDataSamplesUploaded: React.Dispatch<React.SetStateAction<boolean>>
  sopDocumentUploaded: boolean
  setSopDocumentUploaded: React.Dispatch<React.SetStateAction<boolean>>
  departments: string[]
  isNewProcessOpen: boolean
  setIsNewProcessOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsStageFormOpen?: React.Dispatch<React.SetStateAction<boolean>>
  /** If set, registration dialog is in RESUBMISSION mode for this process id */
  resubmissionProcessId?: number | null
}

// ────────────────────────────────────────────────
// HELPER: extract numeric process ID from "P054" → 54
// ────────────────────────────────────────────────
const getNumericProcessId = (selectedProcess: Process | null): number | null => {
  if (!selectedProcess) return null
  const id = parseInt(selectedProcess.id.replace(/\D/g, ""), 10)
  return isNaN(id) ? null : id
}

export function ProcessStageForms({
  selectedProcess,
  triageData,
  setTriageData,
  rejectionReason,
  setRejectionReason,
  isSubmitting,
  setIsSubmitting,
  sitData,
  setSitData,
  getPriorityColor,
  formData,
  setFormData,
  currentStakeholder,
  setCurrentStakeholder,
  currentTag,
  setCurrentTag,
  dataSamplesUploaded,
  setDataSamplesUploaded,
  sopDocumentUploaded,
  setSopDocumentUploaded,
  departments,
  isNewProcessOpen,
  setIsNewProcessOpen,
  setIsStageFormOpen,
  resubmissionProcessId,
}: ProcessStageFormsProps) {
  const { user } = useAuth();

  // ──────────────────────────────────────────────
  // ROLE-BASED ACCESS CONTROL HELPERS
  // ──────────────────────────────────────────────
  const getUserRoleId = (): number | null => {
    const roleIdFromUser = user?.RoleId || user?.roleId || user?.role?.RoleId || user?.role?.roleId;
    const roleIdFromStorage = localStorage.getItem("roleId");

    let roleIdFromLocalStorage = null;
    try {
      const userDataStr = localStorage.getItem("user");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        roleIdFromLocalStorage = userData?.RoleId || userData?.roleId || userData?.role?.RoleId || userData?.role?.roleId;
      }
    } catch (e) {
      // Ignore parse errors
    }

    const allRoleIds = [roleIdFromUser, roleIdFromStorage, roleIdFromLocalStorage].filter(Boolean);
    if (allRoleIds.length > 0) {
      const roleId = Number(allRoleIds[0]);
      return isNaN(roleId) ? null : roleId;
    }
    return null;
  };

  const isOwner = (): boolean => {
    const roleId = getUserRoleId();
    return roleId === 15; // Owner role
  };

  const isAutomationEngineer = (): boolean => {
    const roleId = getUserRoleId();
    return roleId === 3;
  };

  const isAutomationLead = (): boolean => {
    const roleId = getUserRoleId();
    return roleId === 14;
  };

  // Check if user can access a specific stage form (frontend RBAC)
  const canAccessStageForm = (stageName: string): boolean => {
    if (!selectedProcess) {
      // For new process registration, only Owner can access
      return isOwner();
    }

    // Owner-only stages
    if (stageName === "Registration" || stageName === "UAT") {
      return isOwner();
    }

    // RPA Lead-only stages (Business Case is ROLE_RPA_LEAD on backend)
    if (stageName === "Business Case") {
      return isAutomationLead();
    }

    // Automation Engineer stages
    if (
      stageName === "Technical Assessment" ||
      stageName === "Detailed Analysis" ||
      stageName === "Development" ||
      stageName === "QA" ||
      stageName === "Go Live" ||
      stageName === "Hypercare"
    ) {
      return isAutomationEngineer();
    }

    // Default: deny
    return false;
  };

  // Get user display name from user object
  const getUserDisplayName = (user: any): string => {
    return user.UserName || user.Name || user.name || `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Unknown User';
  };

  // State to track if current stage has pending approval
  const [hasPendingApproval, setHasPendingApproval] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [devStarted, setDevStarted] = useState(false)
  const [handoverDocMeta, setHandoverDocMeta] = useState<{ filePath: string; mimeType: string } | null>(null)
  const [isUploadingHandoverDoc, setIsUploadingHandoverDoc] = useState(false)

  // Check if current stage has pending approval in StageApprovalLog
  const checkPendingApproval = async () => {
    if (!selectedProcess) {
      setHasPendingApproval(false);
      return;
    }

    try {
      setIsCheckingApproval(true);
      const numericId = getNumericProcessId(selectedProcess);
      if (!numericId) { setHasPendingApproval(false); return; }

      const response = await getStageTracking(numericId);
      if (response?.success && Array.isArray(response.stages)) {
        const currentStage = response.stages.find(
          (stage: any) => stage.StageName === selectedProcess.status
        );
        if (
          currentStage &&
          currentStage.approval_status === "Pending" &&
          currentStage.status === "Pending" &&
          !isOwner()
        ) {
          setHasPendingApproval(true);
        } else {
          setHasPendingApproval(false);
        }
      } else {
        setHasPendingApproval(false);
      }
    } catch (error: any) {
      console.error("Error checking pending approval:", error);
      setHasPendingApproval(false);
    } finally {
      setIsCheckingApproval(false);
    }
  };

  useEffect(() => {
    checkPendingApproval();

    // Also listen for process updates to refresh approval status
    const handleProcessUpdate = () => {
      checkPendingApproval();
    };

    window.addEventListener('processUpdated', handleProcessUpdate);
    return () => {
      window.removeEventListener('processUpdated', handleProcessUpdate);
    };
  }, [selectedProcess]);

  // Approval message component
  const ApprovalMessageCard = ({ stageName }: { stageName: string }) => (
    <Card className="bg-gradient-to-br from-yellow-50/30 dark:from-yellow-950/10 via-card to-card border-2 border-yellow-200/50 dark:border-yellow-800/30 shadow-lg">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-950/30 flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Awaiting Approval
            </h3>
            <p className="text-muted-foreground">
              The {stageName} form has been submitted and is currently awaiting approval from the Bussiness Owner.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You will be notified once the approval decision has been made.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Access message component - shows when user doesn't have permission (positive, directional)
  const AccessDeniedCard = ({ stageName, requiredRole }: { stageName: string; requiredRole: string }) => (
    <Card className="bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-lg">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Next Stage Assignment
            </h3>
            <p className="text-muted-foreground mb-3">
              The <strong>{stageName}</strong> stage will be completed by a <strong>{requiredRole}</strong>.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-foreground font-medium mb-2">✨ What's Next?</p>
              <p className="text-sm text-muted-foreground">
                A {requiredRole} will handle this stage. Once they complete and submit the form, the process will automatically progress to the next stage in the pipeline.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Fetch users for stakeholders dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await apiCall("/api/users", { method: "GET" });
        const data = await response.json();
        if (data.success && data.data) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    // Only fetch when the form is open (for new process registration)
    if (!selectedProcess && isNewProcessOpen) {
      fetchUsers();
    }
  }, [isNewProcessOpen, selectedProcess]);

  // Fetch RPA engineers for developer assignment dropdown
  useEffect(() => {
    const fetchRpaEngineers = async () => {
      setIsLoadingRpaEngineers(true);
      try {
        const response = await apiCall("/api/rpa_users", { method: "GET" });
        const data = await response.json();
        if (data.success && data.data) {
          // Map the response to ensure we have UserId and UserName
          const engineers = data.data.map((user: any) => ({
            UserId: user.UserId || user.userId || user.id || user.Id,
            UserName: user.UserName || user.userName || user.name || user.Name || `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Unknown'
          })).filter((user: any) => user.UserId); // Filter out any invalid entries
          setRpaEngineers(engineers);
        }
      } catch (error) {
        console.error("Error fetching RPA engineers:", error);
        toast({
          title: "Error loading engineers",
          description: "Failed to load RPA engineers list. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingRpaEngineers(false);
      }
    };

    // Fetch when Development stage form is shown
    if (selectedProcess && selectedProcess.status === "Development") {
      fetchRpaEngineers();
    }
  }, [selectedProcess]);

  // ── File upload state ─────────────────────────
  const [sampleDataMeta, setSampleDataMeta] = useState<{ filePath: string; mimeType: string } | null>(null)
  const [sopDocMeta, setSopDocMeta] = useState<{ filePath: string; mimeType: string } | null>(null)
  const [isUploadingSampleData, setIsUploadingSampleData] = useState(false)
  const [isUploadingSopDoc, setIsUploadingSopDoc] = useState(false)
  const [pddMeta, setPddMeta] = useState<{ filePath: string; mimeType: string } | null>(null)
  const [isUploadingPDD, setIsUploadingPDD] = useState(false)

  // Users list for stakeholders dropdown
  const [users, setUsers] = useState<Array<{ UserId?: number; UserName?: string; Name?: string;[key: string]: any }>>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  // RPA Engineers list for developer assignment
  const [rpaEngineers, setRpaEngineers] = useState<Array<{ UserId: number; UserName: string }>>([])
  const [isLoadingRpaEngineers, setIsLoadingRpaEngineers] = useState(false)

  // ── Business Case state ───────────────────────
  const [businessCaseData, setBusinessCaseData] = useState({
    annualProcessCost: "",
    weeklyHoursSpent: "",
    peopleInvolved: "",
    implementationCost: "",
    efficiencyGainPercent: "80",
    errorReductionPercent: "90",
    fteSavings: null as number | null,
    costSavings: null as number | null,
    paybackMonths: null as number | null,
    roiPercent: null as number | null,
    fiveYearNetValue: null as number | null,
  })

  // ── Technical Assessment state ────────────────
  const [technicalAssessmentData, setTechnicalAssessmentData] = useState({
    infrastructureReady: false,
    botHostingType: "",
    credentialVaultRequired: false,
    externalSystemDependencies: "",
    licensingImpact: "",
    riskLevel: "",
    technicalComments: "",
    rpaTool: "",
    botType: "",
    targetEnvironment: "",
    orchestratorUrl: "",
  })

  // ── QA Stage state ────────────────────────────
  const [qaData, setQaData] = useState({
    qaStartDate: "",
    qaEndDate: "",
    totalTestCases: "",
    passedTestCases: "",
    failedTestCases: "",
    criticalDefects: "",
    qaStatus: "",
    qaComments: "",
  })

  // ── UAT Stage state ───────────────────────────
  const [uatData, setUatData] = useState({
    uatStartDate: "",
    uatEndDate: "",
    testResult: "" as "" | "Pass" | "Fail" | "Conditional Pass",
    defectsFound: "",
    uatComments: "",
  })

  // ── GoLive Stage state ────────────────────────
  const [goLiveData, setGoLiveData] = useState({
    deploymentDate: "",
    deploymentEnvironment: "",
    botVersion: "",
    deploymentNotes: "",
  })

  // ── Hypercare Stage state ─────────────────────
  const [hypercareData, setHypercareData] = useState({
    incidentsReported: "",
    incidentsResolved: "",
    botAvailabilityPercent: "",
    avgHandlingTime: "",
    slaBreachers: "",
    escalations: "",
    hypercareOutcome: "" as "" | "Stable" | "Needs Monitoring" | "Rolled Back",
    hypercareNotes: "",
  })

  const [handoverData, setHandoverData] = useState({
    bauContactName: "",
    bauTeamName: "",
    supportModel: "" as "" | "L1" | "L2" | "L3" | "Hybrid",
    slaAgreed: "",
    trainingCompleted: false,
    knownLimitations: "",
    escalationPath: "",
    handoverNotes: "",
  })

  // ────────────────────────────────────────────────
  // FILE UPLOAD HANDLERS
  // ────────────────────────────────────────────────

  const handleSampleDataFileChange = async (e: any) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    try {
      setIsUploadingSampleData(true)
      const response = await uploadProcessRegistrationFile(file, "sampledata")
      if (response?.success && response.filePath) {
        setSampleDataMeta({ filePath: response.filePath, mimeType: response.mimeType || file.type })
        setDataSamplesUploaded(true)
        toast({ title: "Sample data uploaded", description: `${file.name} uploaded successfully.` })
      } else {
        throw new Error(response?.message || "Failed to upload sample data")
      }
    } catch (error: any) {
      setDataSamplesUploaded(false)
      toast({ title: "Upload failed", description: error?.message, variant: "destructive" })
    } finally {
      setIsUploadingSampleData(false)
    }
  }

  const handleSopFileChange = async (e: any) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    try {
      setIsUploadingSopDoc(true)
      const response = await uploadProcessRegistrationFile(file, "sopdoc")
      if (response?.success && response.filePath) {
        setSopDocMeta({ filePath: response.filePath, mimeType: response.mimeType || file.type })
        setSopDocumentUploaded(true)
        toast({ title: "SOP document uploaded", description: `${file.name} uploaded successfully.` })
      } else {
        throw new Error(response?.message || "Failed to upload SOP document")
      }
    } catch (error: any) {
      setSopDocumentUploaded(false)
      toast({ title: "Upload failed", description: error?.message, variant: "destructive" })
    } finally {
      setIsUploadingSopDoc(false)
    }
  }

  const handlePDDFileChange = async (e: any) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    try {
      setIsUploadingPDD(true)
      const response = await uploadProcessRegistrationFile(file, "sampledata")
      if (response?.success && response.filePath) {
        setPddMeta({ filePath: response.filePath, mimeType: response.mimeType || file.type })
        toast({ title: "PDD Uploaded ✅", description: `${file.name} uploaded successfully.` })
      }
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error?.message, variant: "destructive" })
    } finally {
      setIsUploadingPDD(false)
    }
  }

  const handleHandoverDocChange = async (e: any) => {
    const file = e?.target?.files?.[0]; if (!file) return
    try {
      setIsUploadingHandoverDoc(true)
      const res = await uploadProcessRegistrationFile(file, "sampledata")
      if (res?.success && res.filePath) {
        setHandoverDocMeta({ filePath: res.filePath, mimeType: res.mimeType || file.type })
        toast({ title: "Runbook Uploaded ✅", description: `${file.name} uploaded successfully.` })
      } else throw new Error(res?.message || "Upload failed")
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error?.message, variant: "destructive" })
    } finally { setIsUploadingHandoverDoc(false) }
  }

  // ────────────────────────────────────────────────
  // SUBMIT HANDLERS
  // ────────────────────────────────────────────────

  const handleProcessRegistrationSubmit = async () => {
    if (!formData.title || !formData.department || !formData.description || !formData.priority) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }
    try {
      setIsSubmitting(true)
      const payload: any = { Title: formData.title, Department: formData.department }
      if (formData.description?.trim()) payload.Description = formData.description.trim()
      if (formData.priority?.trim()) payload.Priority = formData.priority.trim()
      if (formData.expectedROI?.trim()) {
        const roi = Number(formData.expectedROI)
        if (!isNaN(roi)) payload.ExpectedROI = roi
      }
      const allStakeholders = [...(formData.stakeholders || []), ...(currentStakeholder?.trim() ? [currentStakeholder.trim()] : [])]
      if (allStakeholders.length > 0) payload.Stakeholder = allStakeholders.filter(s => s.trim()).join(", ")
      const allTags = [...(formData.tags || []), ...(currentTag?.trim() ? [currentTag.trim()] : [])]
      if (allTags.length > 0) payload.Tag = allTags.filter(t => t.trim()).join(", ")
      if (sampleDataMeta?.filePath) payload.SampledataPath = sampleDataMeta.filePath
      if (sampleDataMeta?.mimeType) payload.MimeType = sampleDataMeta.mimeType
      if (sopDocMeta?.filePath) payload.SopDoc = sopDocMeta.filePath
      if (sopDocMeta?.mimeType) payload.SopMimetype = sopDocMeta.mimeType
      let response: any

      if (resubmissionProcessId) {
        const numericId = resubmissionProcessId

        // Step 1: Update process registration + reset Initial Triage to Pending
        const updateRes = await updateProcessRegistration(numericId, payload)
        if (!updateRes?.success) {
          throw new Error(updateRes?.message || "Failed to update process registration")
        }

        toast({
          title: "Process Updated ✅",
          description: updateRes.message || "Registration updated. Lead can now re-review.",
        })

        setIsNewProcessOpen(false)
        window.dispatchEvent(new CustomEvent('processUpdated', {
          detail: { processId: numericId }
        }))
      } else {
        // ── NEW REGISTRATION FLOW ──
        response = await createProcessRegistration(payload)
        if (response?.success) {
          toast({ title: "Process Registered ✅", description: "Process has been registered successfully." })
          setIsNewProcessOpen(false)
          // Dispatch event to refresh process list
          window.dispatchEvent(new CustomEvent('processUpdated', {
            detail: { processId: response.processId || response.ProcessId }
          }))
        } else {
          toast({ title: "Registration Failed", description: response?.message, variant: "destructive" })
        }
      }
    } catch (error: any) {
      toast({ title: "Registration Error", description: error?.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBusinessCaseSave = async () => {
    const numericId = getNumericProcessId(selectedProcess);
    if (!numericId) {
      toast({ title: "Invalid Process ID", variant: "destructive" });
      return;
    }

    const parseNum = (v: string) => {
      if (!v?.trim()) return undefined;
      const n = parseFloat(v);
      return isNaN(n) ? undefined : n;
    };

    // Basic validation — at least cost and implementation cost required
    if (!businessCaseData.annualProcessCost?.trim()) {
      toast({ title: "Validation Error", description: "Annual Process Cost is required.", variant: "destructive" });
      return;
    }
    if (!businessCaseData.implementationCost?.trim()) {
      toast({ title: "Validation Error", description: "Implementation Cost is required.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const isRejected = selectedProcess?.stageStatus === "Rejected";
      const payload = {
        ProcessId: numericId,
        AnnualProcessCost: parseNum(businessCaseData.annualProcessCost),
        WeeklyHoursSpent: parseNum(businessCaseData.weeklyHoursSpent),
        PeopleInvolved: businessCaseData.peopleInvolved?.trim() ? parseInt(businessCaseData.peopleInvolved) : undefined,
        ImplementationCost: parseNum(businessCaseData.implementationCost),
        EfficiencyGainPercent: parseNum(businessCaseData.efficiencyGainPercent),
        ErrorReductionPercent: parseNum(businessCaseData.errorReductionPercent),
      };
      const response = isRejected
        ? await updateBusinessCase(payload)
        : await createBusinessCase(payload);

      if (response?.success) {
        // Update state with calculated values returned from backend
        if (response.data) {
          setBusinessCaseData(prev => ({
            ...prev,
            fteSavings: response.data.FteSavings ?? null,
            costSavings: response.data.CostSavings ?? null,
            paybackMonths: response.data.PaybackMonths ?? null,
            roiPercent: response.data.RoiPercent ?? null,
            fiveYearNetValue: response.data.FiveYearNetValue ?? null,
          }));
        }
        toast({ title: isRejected ? "Business Case Resubmitted ✅" : "Business Case Saved ✅", description: response.message || "Awaiting approval." });
        setTimeout(async () => { await checkPendingApproval(); }, 500);
        window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId: numericId } }));
        setIsStageFormOpen?.(false);
      } else {
        throw new Error(response?.message);
      }
    } catch (error: any) {
      toast({ title: "Save Failed", description: error?.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTechnicalAssessmentSave = async () => {
    const numericId = getNumericProcessId(selectedProcess)
    if (!numericId) { toast({ title: "Invalid Process ID", variant: "destructive" }); return }
    try {
      setIsSubmitting(true)
      const response = await createTechnicalAssessment({
        ProcessId: numericId,
        InfrastructureReady: technicalAssessmentData.infrastructureReady,
        BotHostingType: technicalAssessmentData.botHostingType || null,
        CredentialVaultRequired: technicalAssessmentData.credentialVaultRequired,
        ExternalSystemDependencies: technicalAssessmentData.externalSystemDependencies?.trim() || null,
        LicensingImpact: technicalAssessmentData.licensingImpact?.trim() || null,
        RiskLevel: technicalAssessmentData.riskLevel || null,
        TechnicalComments: technicalAssessmentData.technicalComments?.trim() || null,
        RpaTool: technicalAssessmentData.rpaTool || null,
        BotType: technicalAssessmentData.botType || null,
        TargetEnvironment: technicalAssessmentData.targetEnvironment || null,
        OrchestratorUrl: technicalAssessmentData.orchestratorUrl?.trim() || null,
      })
      if (response?.success) {
        toast({ title: "Technical Assessment Saved ✅", description: response.message })

        setTimeout(async () => {
          await checkPendingApproval()
        }, 500)
        // Dispatch event to refresh process list and detail view
        window.dispatchEvent(new CustomEvent('processUpdated', {
          detail: { processId: numericId }
        }))
        setIsStageFormOpen?.(false)
      } else {
        throw new Error(response?.message)
      }
    } catch (error: any) {
      toast({ title: "Save Failed", description: error?.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDetailedAnalysisSave = async () => {
    const numericId = getNumericProcessId(selectedProcess)
    if (!numericId || !pddMeta?.filePath) {
      toast({ title: "Missing Information", description: "Please upload a PDD file before saving.", variant: "destructive" })
      return
    }
    try {
      setIsSubmitting(true)
      const isRejected = selectedProcess?.stageStatus === "Rejected"
      const response = isRejected
        ? await updateDetailedAnalysis({ ProcessId: numericId, PddPath: pddMeta.filePath, MimeType: pddMeta.mimeType })
        : await createDetailedAnalysis({ ProcessId: numericId, PddPath: pddMeta.filePath, MimeType: pddMeta.mimeType })
      if (response?.success) {
        toast({ title: isRejected ? "PDD Resubmitted ✅" : "PDD Saved ✅", description: response.message })

        setTimeout(async () => {
          await checkPendingApproval()
        }, 500)
        // Dispatch event to refresh process list and detail view
        window.dispatchEvent(new CustomEvent('processUpdated', {
          detail: { processId: numericId }
        }))
        setIsStageFormOpen?.(false)
      } else {
        throw new Error(response?.message)
      }
    } catch (error: any) {
      toast({ title: "Save Failed", description: error?.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQASave = async () => {
    const numericId = getNumericProcessId(selectedProcess)
    if (!numericId) { toast({ title: "Invalid Process ID", variant: "destructive" }); return }
    const parseNum = (v: string) => { if (!v?.trim()) return undefined; const n = parseInt(v); return isNaN(n) ? undefined : n }
    const total = parseNum(qaData.totalTestCases)
    const passed = parseNum(qaData.passedTestCases)
    const failed = parseNum(qaData.failedTestCases)
    if (total !== undefined && passed !== undefined && failed !== undefined) {
      if ((passed + failed) > total) {
        toast({ title: "Validation Error", description: "Passed + Failed cannot exceed Total test cases.", variant: "destructive" })
        return
      }
    }
    try {
      setIsSubmitting(true)
      const response = await completeQAStage({
        processId: numericId,
        totalTestCases: total,
        passedTestCases: passed,
        failedTestCases: failed,
        criticalDefects: parseNum(qaData.criticalDefects),
        qaStatus: qaData.qaStatus || undefined,
        qaComments: qaData.qaComments?.trim() || undefined,
      })
      if (response?.success) {
        toast({ title: "QA Stage Completed ✅", description: response.message })
        // Dispatch event to refresh process list and detail view
        window.dispatchEvent(new CustomEvent('processUpdated', {
          detail: { processId: numericId }
        }))
        setIsStageFormOpen?.(false)
      } else {
        throw new Error(response?.message)
      }
    } catch (error: any) {
      toast({ title: "Save Failed", description: error?.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUATSave = async () => {
    const numericId = getNumericProcessId(selectedProcess)
    if (!numericId) { toast({ title: "Invalid Process ID", variant: "destructive" }); return }
    try {
      setIsSubmitting(true)
      const response = await completeUATStage({
        processId: numericId,
        testResult: uatData.testResult || undefined,
        defectsFound: uatData.defectsFound ? parseInt(uatData.defectsFound) : undefined,
        uatComments: uatData.uatComments?.trim() || undefined,
      })
      if (response?.success) {
        toast({ title: "UAT Stage Saved ✅", description: response.message })
        // Wait a moment for backend to create approval record, then check
        setTimeout(async () => {
          await checkPendingApproval()
        }, 500)
        // Dispatch event to refresh process list and detail view
        window.dispatchEvent(new CustomEvent('processUpdated', {
          detail: { processId: numericId }
        }))
        setIsStageFormOpen?.(false)
      } else {
        throw new Error(response?.message)
      }
    } catch (error: any) {
      toast({ title: "Save Failed", description: error?.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoLiveSave = async () => {
    const numericId = getNumericProcessId(selectedProcess)
    if (!numericId) { toast({ title: "Invalid Process ID", variant: "destructive" }); return }
    try {
      setIsSubmitting(true)
      const response = await createGoLiveStage({
        processId: numericId,
        deploymentDate: goLiveData.deploymentDate || undefined,
        deploymentEnvironment: goLiveData.deploymentEnvironment || undefined,
        botVersion: goLiveData.botVersion?.trim() || undefined,
        deploymentNotes: goLiveData.deploymentNotes?.trim() || undefined,
      })
      if (response?.success) {
        toast({ title: "GoLive Stage Saved ✅", description: response.message })
        // Wait a moment for backend to create approval record, then check
        setTimeout(async () => {
          await checkPendingApproval()
        }, 500)
        // Dispatch event to refresh process list and detail view
        window.dispatchEvent(new CustomEvent('processUpdated', {
          detail: { processId: numericId }
        }))
        setIsStageFormOpen?.(false)
      } else {
        throw new Error(response?.message)
      }
    } catch (error: any) {
      toast({ title: "Save Failed", description: error?.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHypercareSave = async () => {
    const numericId = getNumericProcessId(selectedProcess)
    if (!numericId) { toast({ title: "Invalid Process ID", variant: "destructive" }); return }
    const parseNum = (v: string) => { if (!v?.trim()) return undefined; const n = parseInt(v); return isNaN(n) ? undefined : n }
    const parseDec = (v: string) => { if (!v?.trim()) return undefined; const n = parseFloat(v); return isNaN(n) ? undefined : n }
    try {
      setIsSubmitting(true)
      const response = await completeHypercareStage({
        processId: numericId,
        incidentsReported: parseNum(hypercareData.incidentsReported),
        incidentsResolved: parseNum(hypercareData.incidentsResolved),
        botAvailabilityPercent: parseDec(hypercareData.botAvailabilityPercent),
        avgHandlingTime: parseDec(hypercareData.avgHandlingTime),
        slaBreachers: parseNum(hypercareData.slaBreachers),
        escalations: parseNum(hypercareData.escalations),
        hypercareOutcome: hypercareData.hypercareOutcome || undefined,
        hypercareNotes: hypercareData.hypercareNotes?.trim() || undefined,
      })
      if (response?.success) {
        toast({
          title: "Hypercare Completed ✅",
          description: response.data?.hypercareOutcome
            ? `Outcome: ${response.data.hypercareOutcome}. Process moved to Handover to BAU.`
            : response.message,
        })
        window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId: numericId } }))
        setIsStageFormOpen?.(false)
      } else throw new Error(response?.message)
    } catch (error: any) { toast({ title: "Save Failed", description: error?.message, variant: "destructive" }) }
    finally { setIsSubmitting(false) }
  }

  const handleHandoverSave = async () => {
    const numericId = getNumericProcessId(selectedProcess)
    if (!numericId) { toast({ title: "Invalid Process ID", variant: "destructive" }); return }
    if (!handoverData.bauContactName?.trim()) {
      toast({ title: "Validation Error", description: "BAU Contact Name is required.", variant: "destructive" }); return
    }
    if (!handoverData.bauTeamName?.trim()) {
      toast({ title: "Validation Error", description: "BAU Team Name is required.", variant: "destructive" }); return
    }
    try {
      setIsSubmitting(true)
      const isRejected = selectedProcess?.stageStatus === "Rejected";
      const payload = {
        processId: numericId,
        bauContactName: handoverData.bauContactName.trim(),
        bauTeamName: handoverData.bauTeamName.trim(),
        supportModel: handoverData.supportModel || undefined,
        slaAgreed: handoverData.slaAgreed?.trim() || undefined,
        trainingCompleted: handoverData.trainingCompleted,
        knownLimitations: handoverData.knownLimitations?.trim() || undefined,
        escalationPath: handoverData.escalationPath?.trim() || undefined,
        handoverNotes: handoverData.handoverNotes?.trim() || undefined,
        botDocumentationPath: handoverDocMeta?.filePath || undefined,
        botDocMimeType: handoverDocMeta?.mimeType || undefined,
      };
      const response = isRejected
        ? await updateHandoverStage(payload)
        : await submitHandoverStage(payload);
      if (response?.success) {
        toast({
          title: isRejected ? "Handover Resubmitted ✅" : "Handover Submitted ✅",
          description: "Awaiting Automation Lead approval."
        });
        window.dispatchEvent(new CustomEvent("processUpdated", { detail: { processId: numericId } }))
        setIsStageFormOpen?.(false)
      } else throw new Error(response?.message)
    } catch (error: any) {
      toast({ title: "Save Failed", description: error?.message, variant: "destructive" })
    } finally { setIsSubmitting(false) }
  }

  // ────────────────────────────────────────────────
  // REUSABLE SAVE BUTTON
  // ────────────────────────────────────────────────
  const SaveButton = ({ onClick, label, color }: { onClick: () => void; label: string; color: string }) => (
    <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/20">
      <CardContent className="pt-6">
        <div className="flex justify-end">
          <Button size="lg" onClick={onClick} disabled={isSubmitting} className={color}>
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />{label}</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      {/* ═══════════════════════════════════════════════ */}
      {/* PROCESS REGISTRATION DIALOG                    */}
      {/* ═══════════════════════════════════════════════ */}
      {!selectedProcess && isOwner() && (
        <Dialog open={isNewProcessOpen} onOpenChange={setIsNewProcessOpen}>
          <DialogContent className="max-w-5xl bg-gradient-to-br from-card via-card to-muted/20 border-2 border-primary/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent -mx-6 px-6 pt-2">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border-2 border-primary/30 shadow-lg">
                  <Rocket className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    {resubmissionProcessId ? "Resubmit Process" : "Process Registration"}
                  </DialogTitle>
                  <DialogDescription className="text-base text-muted-foreground mt-1">
                    {resubmissionProcessId
                      ? "Update your existing process registration and send it again for Initial Triage."
                      : "Register your process in the RPA automation pipeline"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Basic Information */}
              <Card className="border-2 border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 via-card to-card shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50/50 dark:from-blue-950/20 to-transparent border-b border-blue-200/50 dark:border-blue-800/30 pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-300/30">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Basic Information
                  </CardTitle>
                  <CardDescription className="text-sm mt-2 ml-11">
                    Provide essential details about your process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                        Process Title <span className="text-destructive text-base">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="e.g., Invoice Processing Automation"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="h-11 border-2 focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-semibold flex items-center gap-2">
                        Department <span className="text-destructive text-base">*</span>
                      </Label>
                      <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                        <SelectTrigger className="h-11 border-2 focus:border-primary/50"><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent className="z-[70]">
                          {departments.map((dept) => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                      Process Description <span className="text-destructive text-base">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the current manual process, pain points, and expected outcomes..."
                      className="min-h-32 resize-none border-2 focus:border-primary/50 transition-colors"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-semibold flex items-center gap-2">
                        Priority <span className="text-destructive text-base">*</span>
                      </Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
                        <SelectTrigger className="h-11 border-2 focus:border-primary/50"><SelectValue placeholder="Select priority" /></SelectTrigger>
                        <SelectContent className="z-[70]">
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedROI" className="text-sm font-semibold flex items-center gap-2">
                        Expected ROI ($)
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </Label>
                      <Input
                        id="expectedROI"
                        type="number"
                        placeholder="250000"
                        value={formData.expectedROI}
                        onChange={(e) => setFormData({ ...formData, expectedROI: e.target.value })}
                        className="h-11 border-2 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stakeholders & Tags */}
              <Card className="border-2 border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 via-card to-card shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-50/50 dark:from-purple-950/20 to-transparent border-b border-purple-200/50 dark:border-purple-800/30 pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-300/30">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Stakeholders & Tags
                  </CardTitle>
                  <CardDescription className="text-sm mt-2 ml-11">
                    Add team members and categorize your process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Project Stakeholders
                    </Label>
                    {formData.stakeholders.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 to-transparent rounded-lg border-2 border-purple-200/50 dark:border-purple-800/30">
                        {formData.stakeholders.map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-950/50 transition-colors">
                            {s}
                            <button onClick={() => setFormData({ ...formData, stakeholders: formData.stakeholders.filter((_: any, idx: number) => idx !== i) })} className="ml-1 hover:text-destructive font-bold text-base leading-none">×</button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value && !formData.stakeholders.includes(value)) {
                            setFormData({ ...formData, stakeholders: [...formData.stakeholders, value] });
                          }
                        }}
                        disabled={isLoadingUsers}
                      >
                        <SelectTrigger className="h-11 flex-1 border-2 focus:border-primary/50 transition-colors">
                          <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select stakeholder"} />
                        </SelectTrigger>
                        <SelectContent className="z-[70]">
                          {users
                            .filter(user => {
                              const displayName = getUserDisplayName(user);
                              return !formData.stakeholders.includes(displayName);
                            })
                            .map((user) => {
                              const displayName = getUserDisplayName(user);
                              return (
                                <SelectItem key={user.UserId || user.id || displayName} value={displayName}>
                                  {displayName}
                                </SelectItem>
                              );
                            })}
                          {users.length === 0 && !isLoadingUsers && (
                            <SelectItem value="no-users" disabled>No users available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Process Tags
                    </Label>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 to-transparent rounded-lg border-2 border-purple-200/50 dark:border-purple-800/30">
                        {formData.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors">
                            {tag}
                            <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_: any, idx: number) => idx !== i) })} className="ml-1 hover:text-destructive font-bold text-base leading-none">×</button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag (e.g., Finance, OCR)"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && currentTag.trim()) { e.preventDefault(); setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] }); setCurrentTag("") } }}
                        className="h-11 flex-1 border-2 focus:border-primary/50 transition-colors"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { if (currentTag.trim()) { setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] }); setCurrentTag("") } }}
                        className="h-11 border-2 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supporting Documents */}
              <Card className="border-2 border-green-200/50 dark:border-green-800/30 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 via-card to-card shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-green-50/50 dark:from-green-950/20 to-transparent border-b border-green-200/50 dark:border-green-800/30 pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-300/30">
                      <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    Supporting Documents
                  </CardTitle>
                  <CardDescription className="text-sm mt-2 ml-11">
                    Upload sample data and process documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <Label htmlFor="dataSamples" className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      Upload Initial Data Samples
                    </Label>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50/30 dark:from-green-950/20 to-transparent rounded-lg border-2 border-green-200/50 dark:border-green-800/30">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('dataSamples')?.click()}
                        className="h-11 border-2 bg-white dark:bg-gray-900 text-foreground hover:text-foreground hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-400 dark:hover:border-green-600 transition-all duration-200 cursor-pointer"
                        disabled={isUploadingSampleData}
                        title=""
                      >
                        {isUploadingSampleData ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Files
                          </>
                        )}
                      </Button>
                      <span className="text-sm font-medium text-foreground flex-1">
                        {sampleDataMeta?.filePath ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {sampleDataMeta.filePath.split(/[/\\]/).pop()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No file chosen</span>
                        )}
                      </span>
                      <Input id="dataSamples" type="file" onChange={handleSampleDataFileChange} accept=".xlsx,.xls,.csv,.pdf,.doc,.docx" className="hidden" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="sopDocument" className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      Upload SOP Document
                    </Label>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50/30 dark:from-green-950/20 to-transparent rounded-lg border-2 border-green-200/50 dark:border-green-800/30">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('sopDocument')?.click()}
                        className="h-11 border-2 bg-white dark:bg-gray-900 text-foreground hover:text-foreground hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-400 dark:hover:border-green-600 transition-all duration-200 cursor-pointer"
                        disabled={isUploadingSopDoc}
                        title=""
                      >
                        {isUploadingSopDoc ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </>
                        )}
                      </Button>
                      <span className="text-sm font-medium text-foreground flex-1">
                        {sopDocMeta?.filePath ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {sopDocMeta.filePath.split(/[/\\]/).pop()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No file chosen</span>
                        )}
                      </span>
                      <Input id="sopDocument" type="file" onChange={handleSopFileChange} accept=".pdf,.doc,.docx" className="hidden" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="bg-gradient-to-r from-primary/5 to-transparent -mx-6 px-6 py-4 border-t border-border/50 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsNewProcessOpen(false)}
                className="h-11 px-6 border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessRegistrationSubmit}
                disabled={isSubmitting || isUploadingSampleData || isUploadingSopDoc}
                className="h-11 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {resubmissionProcessId ? "Submitting..." : "Registering..."}
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    {resubmissionProcessId ? "Save & Resubmit" : "Register Process"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* BUSINESS CASE                                  */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && (selectedProcess.status as any) === "Business Case" && canAccessStageForm("Business Case") && (
        <div className="space-y-6">
          {selectedProcess?.stageStatus === "Waiting for Approval" ? (
            <ApprovalMessageCard stageName="Business Case" />
          ) : (
            <>
              {/* ── ROI Calculator Card ── */}
              <Card className="bg-gradient-to-br from-emerald-50/30 dark:from-emerald-950/10 via-card to-card border-2 border-emerald-200/50 dark:border-emerald-800/30 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50/50 dark:from-emerald-950/20 to-transparent border-b border-emerald-200/50 dark:border-emerald-800/30 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10">
                      <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Business Case
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Enter process parameters — ROI will be calculated automatically
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">

                  {/* ── Process Parameters ── */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                      Process Parameters
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="annual-process-cost" className="font-semibold">
                        Annual Process Cost ($) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="annual-process-cost"
                        type="number"
                        placeholder="e.g., 50000"
                        value={businessCaseData.annualProcessCost}
                        onChange={(e) => setBusinessCaseData({ ...businessCaseData, annualProcessCost: e.target.value })}
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">Total cost of running this manual process per year</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="implementation-cost" className="font-semibold">
                        Automation Investment ($) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="implementation-cost"
                        type="number"
                        placeholder="e.g., 25000"
                        value={businessCaseData.implementationCost}
                        onChange={(e) => setBusinessCaseData({ ...businessCaseData, implementationCost: e.target.value })}
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">Cost to build and deploy the automation</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weekly-hours" className="font-semibold">Weekly Hours Spent</Label>
                      <Input
                        id="weekly-hours"
                        type="number"
                        placeholder="e.g., 40"
                        value={businessCaseData.weeklyHoursSpent}
                        onChange={(e) => setBusinessCaseData({ ...businessCaseData, weeklyHoursSpent: e.target.value })}
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">Hours humans spend on this process per week</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="people-involved" className="font-semibold">People Involved</Label>
                      <Input
                        id="people-involved"
                        type="number"
                        placeholder="e.g., 5"
                        value={businessCaseData.peopleInvolved}
                        onChange={(e) => setBusinessCaseData({ ...businessCaseData, peopleInvolved: e.target.value })}
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">Number of FTEs doing this work currently</p>
                    </div>
                  </div>

                  {/* ── Sliders ── */}
                  <div className="space-y-5">
                    {/* Efficiency Gain */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-semibold">Expected Efficiency Gain</Label>
                          <p className="text-xs text-muted-foreground">
                            Percentage of work that will be automated
                          </p>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">
                          {businessCaseData.efficiencyGainPercent}%
                        </span>
                      </div>
                      <Slider
                        value={[Number(businessCaseData.efficiencyGainPercent) || 0]}
                        onValueChange={([v]) =>
                          setBusinessCaseData({
                            ...businessCaseData,
                            efficiencyGainPercent: String(v),
                          })
                        }
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    {/* Error Reduction */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-semibold">Expected Error Reduction</Label>
                          <p className="text-xs text-muted-foreground">
                            Percentage reduction in process errors
                          </p>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">
                          {businessCaseData.errorReductionPercent}%
                        </span>
                      </div>
                      <Slider
                        value={[Number(businessCaseData.errorReductionPercent) || 0]}
                        onValueChange={([v]) =>
                          setBusinessCaseData({
                            ...businessCaseData,
                            errorReductionPercent: String(v),
                          })
                        }
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* ── Auto-Calculated Summary (shown after submit OR with live preview) ── */}
                  {(businessCaseData.costSavings !== null || businessCaseData.annualProcessCost) && (
                    <Card className="bg-gradient-to-br from-emerald-50 dark:from-emerald-950/30 to-transparent border-2 border-emerald-200 dark:border-emerald-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          {businessCaseData.costSavings !== null ? "ROI Analysis (Calculated)" : "Live Preview"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {businessCaseData.costSavings !== null ? (
                          // Show backend-calculated values after submit
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Annual Savings</p>
                                <p className="text-lg font-bold text-emerald-600">
                                  ${Number(businessCaseData.costSavings).toLocaleString()}
                                </p>
                              </div>
                              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Payback Period</p>
                                <p className="text-lg font-bold text-blue-600">
                                  {businessCaseData.paybackMonths} months
                                </p>
                              </div>
                              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
                                <p className="text-xs text-muted-foreground mb-1">ROI</p>
                                <p className="text-lg font-bold text-primary">
                                  {businessCaseData.roiPercent}%
                                </p>
                              </div>
                              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-center">
                                <p className="text-xs text-muted-foreground mb-1">5-Year Net Value</p>
                                <p className="text-lg font-bold text-purple-600">
                                  ${Number(businessCaseData.fiveYearNetValue).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {businessCaseData.fteSavings !== null && (
                              <div className="flex justify-between text-sm pt-2 border-t border-emerald-200 dark:border-emerald-800">
                                <span className="text-muted-foreground">FTE Hours Saved/Year:</span>
                                <span className="font-bold">{Number(businessCaseData.fteSavings).toLocaleString()} hrs</span>
                              </div>
                            )}
                          </>
                        ) : (
                          // Live frontend preview before submit
                          (() => {
                            const annualCost = parseFloat(businessCaseData.annualProcessCost) || 0;
                            const implCost = parseFloat(businessCaseData.implementationCost) || 0;
                            const efficiency = parseFloat(businessCaseData.efficiencyGainPercent) || 0;
                            const savings = annualCost * (efficiency / 100);
                            const netYear1 = savings - implCost;
                            return (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Annual Savings (est.):</span>
                                  <span className="font-bold text-emerald-600">${savings.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Implementation Cost:</span>
                                  <span className="font-bold">${implCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-emerald-200 dark:border-emerald-800 pt-2">
                                  <span className="text-muted-foreground">Net Benefit (Year 1):</span>
                                  <span className={`font-bold ${netYear1 >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                                    ${netYear1.toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground italic text-center pt-1">
                                  * Final calculations done by server after submit
                                </p>
                              </>
                            );
                          })()
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              <SaveButton
                onClick={handleBusinessCaseSave}
                label={selectedProcess?.stageStatus === "Rejected" ? "Resubmit Business Case" : "Submit Business Case"}
                color="bg-emerald-600 hover:bg-emerald-700 text-white"
              />
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TECHNICAL ASSESSMENT                           */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && (selectedProcess.status as any) === "Technical Assessment" && canAccessStageForm("Technical Assessment") && (
        <div className="space-y-6">
          {hasPendingApproval ? (
            <ApprovalMessageCard stageName="Technical Assessment" />
          ) : (
            <>
              <Card className="bg-gradient-to-br from-cyan-50/30 dark:from-cyan-950/10 via-card to-card border-2 border-cyan-200/50 dark:border-cyan-800/30 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-cyan-50/50 dark:from-cyan-950/20 to-transparent border-b border-cyan-200/50 dark:border-cyan-800/30 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-500/10">
                      <ShieldCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    Technical Assessment
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Evaluate technical feasibility and infrastructure requirements
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">

                  {/* ── RPA Tool ── */}
                  <div className="space-y-2">
                    <Label className="font-semibold">RPA Tool</Label>
                    <Select
                      value={technicalAssessmentData.rpaTool}
                      onValueChange={(v) => setTechnicalAssessmentData({ ...technicalAssessmentData, rpaTool: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select RPA tool" /></SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="UiPath">UiPath</SelectItem>
                        <SelectItem value="Automation Anywhere">Automation Anywhere</SelectItem>
                        <SelectItem value="Blue Prism">Blue Prism</SelectItem>
                        <SelectItem value="Power Automate">Power Automate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ── Bot Type ── */}
                  <div className="space-y-2">
                    <Label className="font-semibold">Bot Type</Label>
                    <Select
                      value={technicalAssessmentData.botType}
                      onValueChange={(v) => setTechnicalAssessmentData({ ...technicalAssessmentData, botType: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select bot type" /></SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="Attended">Attended</SelectItem>
                        <SelectItem value="Unattended">Unattended</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ── Bot Hosting Type ── */}
                  <div className="space-y-2">
                    <Label className="font-semibold">Bot Hosting Type</Label>
                    <Select
                      value={technicalAssessmentData.botHostingType}
                      onValueChange={(v) => setTechnicalAssessmentData({ ...technicalAssessmentData, botHostingType: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select hosting type" /></SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="On-Premise">On-Premise</SelectItem>
                        <SelectItem value="Cloud">Cloud (Azure/AWS)</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                        <SelectItem value="Virtual Desktop">Virtual Desktop (VDI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ── Target Environment ── */}
                  <div className="space-y-2">
                    <Label className="font-semibold">Target Environment</Label>
                    <Select
                      value={technicalAssessmentData.targetEnvironment}
                      onValueChange={(v) => setTechnicalAssessmentData({ ...technicalAssessmentData, targetEnvironment: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select target environment" /></SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="Windows 10">Windows 10</SelectItem>
                        <SelectItem value="Windows 11">Windows 11</SelectItem>
                        <SelectItem value="Windows Server 2016">Windows Server 2016</SelectItem>
                        <SelectItem value="Windows Server 2019">Windows Server 2019</SelectItem>
                        <SelectItem value="Windows Server 2022">Windows Server 2022</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ── Orchestrator URL ── */}
                  <div className="space-y-2">
                    <Label className="font-semibold">Orchestrator URL</Label>
                    <Input
                      placeholder="e.g., https://cloud.uipath.com/org"
                      value={technicalAssessmentData.orchestratorUrl}
                      onChange={(e) => setTechnicalAssessmentData({ ...technicalAssessmentData, orchestratorUrl: e.target.value })}
                    />
                  </div>

                  {/* ── Infrastructure Ready + Credential Vault ── */}
                  {[
                    { key: "infrastructureReady", label: "Infrastructure Ready?" },
                    { key: "credentialVaultRequired", label: "Credential Vault Required?" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${(technicalAssessmentData as any)[key]
                        ? "bg-green-50/50 dark:bg-green-950/20 border-green-300/50"
                        : "bg-card border-border hover:border-primary/50"
                        }`}
                      onClick={() =>
                        setTechnicalAssessmentData({
                          ...technicalAssessmentData,
                          [key]: !(technicalAssessmentData as any)[key],
                        })
                      }
                    >
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${(technicalAssessmentData as any)[key]
                          ? "bg-green-500 border-green-600"
                          : "bg-white dark:bg-gray-900 border-gray-400"
                          }`}
                      >
                        {(technicalAssessmentData as any)[key] && (
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        )}
                      </div>
                      <Label className="cursor-pointer flex-1 font-semibold">{label}</Label>
                    </div>
                  ))}

                  {/* ── External System Dependencies ── */}
                  <div className="space-y-2">
                    <Label className="font-semibold">External System Dependencies</Label>
                    <Textarea
                      placeholder="List all external systems, APIs, and dependencies..."
                      value={technicalAssessmentData.externalSystemDependencies}
                      onChange={(e) => setTechnicalAssessmentData({ ...technicalAssessmentData, externalSystemDependencies: e.target.value })}
                      className="min-h-24"
                    />
                  </div>

                  {/* ── Technical Risk Level ── */}
                  <div className="space-y-2">
                    <Label className="font-semibold">Technical Risk Level</Label>
                    <Select
                      value={technicalAssessmentData.riskLevel}
                      onValueChange={(v) => setTechnicalAssessmentData({ ...technicalAssessmentData, riskLevel: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select risk level" /></SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ── Technical Comments ── */}
                  <div className="space-y-2">
                    <Label className="font-semibold">Technical Comments</Label>
                    <Textarea
                      placeholder="Additional technical notes, concerns, or recommendations..."
                      value={technicalAssessmentData.technicalComments}
                      onChange={(e) => setTechnicalAssessmentData({ ...technicalAssessmentData, technicalComments: e.target.value })}
                      className="min-h-32"
                    />
                  </div>

                </CardContent>
              </Card>

              <SaveButton
                onClick={handleTechnicalAssessmentSave}
                label="Save Technical Assessment"
                color="bg-cyan-600 hover:bg-cyan-700 text-white"
              />
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* DETAILED ANALYSIS                              */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && (selectedProcess.status as any) === "Detailed Analysis" && canAccessStageForm("Detailed Analysis") && (
        <div className="space-y-6">
          {selectedProcess?.stageStatus === "Waiting for Approval" ? (
            <ApprovalMessageCard stageName="Detailed Analysis" />
          ) : (
            <>
              <Card className="bg-gradient-to-br from-amber-50/30 dark:from-amber-950/10 via-card to-card border-2 border-amber-200/50 dark:border-amber-800/30 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-50/50 dark:from-amber-950/20 to-transparent border-b border-amber-200/50 dark:border-amber-800/30 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-500/10">
                      <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    Detailed Analysis
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Upload Process Definition Document (PDD)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* PDD Upload */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">
                      Process Definition Document (PDD) <span className="text-destructive">*</span>
                    </Label>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('pdd-upload')?.click()}
                        disabled={isUploadingPDD}
                        className="h-12"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploadingPDD ? "Uploading..." : "Upload PDD"}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {pddMeta?.filePath
                          ? pddMeta.filePath.split(/[/\\]/).pop() || "No file chosen"
                          : "No file chosen"}
                      </span>
                      <Input
                        id="pdd-upload"
                        type="file"
                        onChange={handlePDDFileChange}
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                      />
                    </div>

                    {pddMeta?.filePath && (
                      <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-success" />
                          <div className="flex-1">
                            <p className="font-medium text-success">PDD Uploaded Successfully</p>
                            <p className="text-sm text-muted-foreground">
                              {pddMeta.filePath.split(/[/\\]/).pop()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>PDD should include:</strong>
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Detailed process steps and workflow</li>
                        <li>Business rules and decision logic</li>
                        <li>Input/output data specifications</li>
                        <li>Exception handling scenarios</li>
                        <li>System integration details</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/20">
                <CardContent className="pt-6">
                  <div className="flex justify-end gap-3">
                    <Button
                      size="lg"
                      onClick={handleDetailedAnalysisSave}
                      disabled={isSubmitting || !pddMeta?.filePath}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {selectedProcess?.stageStatus === "Rejected" ? "Resubmit PDD" : "Submit PDD"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}


      {/* ═══════════════════════════════════════════════ */}
      {/* QA STAGE                                       */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && selectedProcess.status === "QA" && canAccessStageForm("QA") && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50/30 dark:from-indigo-950/10 via-card to-card border-2 border-indigo-200/50 dark:border-indigo-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50/50 dark:from-indigo-950/20 to-transparent border-b border-indigo-200/50 dark:border-indigo-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10"><ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /></div>
                Quality Assurance (QA)
              </CardTitle>
              <CardDescription className="text-base mt-2">Complete QA testing and submit results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Total Test Cases <span className="text-destructive">*</span></Label>
                  <Input type="number" placeholder="e.g., 50" value={qaData.totalTestCases} onChange={(e) => setQaData({ ...qaData, totalTestCases: e.target.value })} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Passed Test Cases <span className="text-destructive">*</span></Label>
                  <Input type="number" placeholder="e.g., 45" value={qaData.passedTestCases} onChange={(e) => setQaData({ ...qaData, passedTestCases: e.target.value })} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Failed Test Cases <span className="text-destructive">*</span></Label>
                  <Input type="number" placeholder="e.g., 5" value={qaData.failedTestCases} onChange={(e) => setQaData({ ...qaData, failedTestCases: e.target.value })} className="h-10" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Critical Defects</Label>
                  <Input type="number" placeholder="e.g., 2" value={qaData.criticalDefects} onChange={(e) => setQaData({ ...qaData, criticalDefects: e.target.value })} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">QA Status</Label>
                  <Select value={qaData.qaStatus} onValueChange={(v) => setQaData({ ...qaData, qaStatus: v })}>
                    <SelectTrigger><SelectValue placeholder="Select QA status" /></SelectTrigger>
                    <SelectContent className="z-[70]">
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="Conditional Pass">Conditional Pass</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">QA Comments</Label>
                <Textarea placeholder="Test results summary, defect descriptions, recommendations..." value={qaData.qaComments} onChange={(e) => setQaData({ ...qaData, qaComments: e.target.value })} className="min-h-28" />
              </div>
            </CardContent>
          </Card>
          <SaveButton onClick={handleQASave} label="Complete QA → Move to UAT" color="bg-indigo-600 hover:bg-indigo-700 text-white" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* UAT STAGE                                      */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && (selectedProcess.status === "UAT" || selectedProcess.status === "User Acceptance Testing (HWF)") && canAccessStageForm("UAT") && (
        <div className="space-y-6">
          {hasPendingApproval ? (
            <ApprovalMessageCard stageName="UAT" />
          ) : (
            <>
              <Card className="bg-gradient-to-br from-pink-50/30 dark:from-pink-950/10 via-card to-card border-2 border-pink-200/50 dark:border-pink-800/30 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-pink-50/50 dark:from-pink-950/20 to-transparent border-b border-pink-200/50 dark:border-pink-800/30 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-pink-500/10"><Users className="w-6 h-6 text-pink-600 dark:text-pink-400" /></div>
                    User Acceptance Testing (UAT)
                  </CardTitle>
                  <CardDescription className="text-base mt-2">Business users validate automation functionality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Test Result</Label>
                      <Select value={uatData.testResult} onValueChange={(v) => setUatData({ ...uatData, testResult: v as any })}>
                        <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                        <SelectContent className="z-[70]">
                          <SelectItem value="Pass">Pass</SelectItem>
                          <SelectItem value="Fail">Fail</SelectItem>
                          <SelectItem value="Conditional Pass">Conditional Pass</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Defects Found</Label>
                      <Input type="number" placeholder="e.g., 3" value={uatData.defectsFound} onChange={(e) => setUatData({ ...uatData, defectsFound: e.target.value })} className="h-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">UAT Comments</Label>
                    <Textarea placeholder="User feedback, defect descriptions, sign-off notes..." value={uatData.uatComments} onChange={(e) => setUatData({ ...uatData, uatComments: e.target.value })} className="min-h-28" />
                  </div>
                </CardContent>
              </Card>
              <SaveButton onClick={handleUATSave} label="Complete UAT → Move to Go Live" color="bg-pink-700 hover:bg-pink-800 text-white" />
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* GO-LIVE STAGE                                  */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && (
        selectedProcess.status === "GoLive" ||
        selectedProcess.status === "Go Live" ||
        selectedProcess.status === "Go-Live" ||
        selectedProcess.status === "Go-Live & Deployment (HWF)" ||
        selectedProcess.status?.toLowerCase().includes("go live") ||
        selectedProcess.status?.toLowerCase().includes("golive")
      ) && canAccessStageForm("Go Live") && (
          <div className="space-y-6">
            {hasPendingApproval ? (
              <ApprovalMessageCard stageName="Go-Live" />
            ) : (
              <>
                <Card className="bg-gradient-to-br from-orange-50/30 dark:from-orange-950/10 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-orange-50/50 dark:from-orange-950/20 to-transparent border-b border-orange-200/50 dark:border-orange-800/30 pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-orange-500/10"><Rocket className="w-6 h-6 text-orange-600 dark:text-orange-400" /></div>
                      Go-Live & Deployment
                    </CardTitle>
                    <CardDescription className="text-base mt-2">Deploy automation to production environment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-semibold">Deployment Date</Label>
                        <Input type="date" value={goLiveData.deploymentDate} onChange={(e) => setGoLiveData({ ...goLiveData, deploymentDate: e.target.value })} className="h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold">Deployment Environment</Label>
                        <Select value={goLiveData.deploymentEnvironment} onValueChange={(v) => setGoLiveData({ ...goLiveData, deploymentEnvironment: v })}>
                          <SelectTrigger><SelectValue placeholder="Select environment" /></SelectTrigger>
                          <SelectContent className="z-[70]">
                            <SelectItem value="Production">Production</SelectItem>
                            <SelectItem value="Staging">Staging</SelectItem>
                            <SelectItem value="Pre-Production">Pre-Production</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Bot Version</Label>
                      <Input placeholder="e.g., v2.1.0" value={goLiveData.botVersion} onChange={(e) => setGoLiveData({ ...goLiveData, botVersion: e.target.value })} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Deployment Notes</Label>
                      <Textarea placeholder="Deployment steps, rollback plan, health check results..." value={goLiveData.deploymentNotes} onChange={(e) => setGoLiveData({ ...goLiveData, deploymentNotes: e.target.value })} className="min-h-28" />
                    </div>
                  </CardContent>
                </Card>
                <SaveButton onClick={handleGoLiveSave} label="Go Live" color="bg-orange-600 hover:bg-orange-700 text-white" />
              </>
            )}
          </div>
        )}

      {selectedProcess && (selectedProcess.status === "Hypercare" || selectedProcess.status === "Hypercare & Stabilization (HWF)") && canAccessStageForm("Hypercare") && (
        <div className="space-y-6">
          {hasPendingApproval ? (
            <ApprovalMessageCard stageName="Hypercare" />
          ) : (
            <>
              <Card className="bg-gradient-to-br from-teal-50/30 dark:from-teal-950/10 via-card to-card border-2 border-teal-200/50 dark:border-teal-800/30 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-teal-50/50 dark:from-teal-950/20 to-transparent border-b border-teal-200/50 dark:border-teal-800/30 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-teal-500/10"><HeartPulse className="w-6 h-6 text-teal-600 dark:text-teal-400" /></div>
                    Hypercare & Stabilization
                  </CardTitle>
                  <CardDescription className="text-base mt-2">Monitor and stabilize automation in production</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Incidents Reported</Label>
                      <Input type="number" placeholder="e.g., 5" value={hypercareData.incidentsReported}
                        onChange={(e) => setHypercareData({ ...hypercareData, incidentsReported: e.target.value })} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Incidents Resolved</Label>
                      <Input type="number" placeholder="e.g., 5" value={hypercareData.incidentsResolved}
                        onChange={(e) => setHypercareData({ ...hypercareData, incidentsResolved: e.target.value })} className="h-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Bot Availability (%)</Label>
                      <Input type="number" placeholder="e.g., 98.5" value={hypercareData.botAvailabilityPercent}
                        onChange={(e) => setHypercareData({ ...hypercareData, botAvailabilityPercent: e.target.value })} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Avg Handling Time (mins)</Label>
                      <Input type="number" placeholder="e.g., 2.5" value={hypercareData.avgHandlingTime}
                        onChange={(e) => setHypercareData({ ...hypercareData, avgHandlingTime: e.target.value })} className="h-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">SLA Breaches</Label>
                      <Input type="number" placeholder="e.g., 1" value={hypercareData.slaBreachers}
                        onChange={(e) => setHypercareData({ ...hypercareData, slaBreachers: e.target.value })} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Escalations</Label>
                      <Input type="number" placeholder="e.g., 0" value={hypercareData.escalations}
                        onChange={(e) => setHypercareData({ ...hypercareData, escalations: e.target.value })} className="h-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Hypercare Outcome</Label>
                    <Select value={hypercareData.hypercareOutcome}
                      onValueChange={(v) => setHypercareData({ ...hypercareData, hypercareOutcome: v as any })}>
                      <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="Stable">Stable</SelectItem>
                        <SelectItem value="Needs Monitoring">Needs Monitoring</SelectItem>
                        <SelectItem value="Rolled Back">Rolled Back</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Hypercare Notes</Label>
                    <Textarea placeholder="Incident summaries, resolutions, stability observations..."
                      value={hypercareData.hypercareNotes}
                      onChange={(e) => setHypercareData({ ...hypercareData, hypercareNotes: e.target.value })}
                      className="min-h-28" />
                  </div>
                </CardContent>
              </Card>
              <SaveButton onClick={handleHypercareSave} label="Complete Hypercare Stage" color="bg-teal-600 hover:bg-teal-700 text-white" />
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* HANDOVER TO BAU                                   */}
      {/* ══════════════════════════════════════════════════ */}
      {(selectedProcess?.status === "Handover" || selectedProcess?.status === "HandOver" || selectedProcess?.status === "Handover to BAU") && isAutomationEngineer() && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-teal-50/30 dark:from-teal-950/10 via-card to-card border-2 border-teal-200/50 dark:border-teal-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50/50 dark:from-teal-950/20 to-transparent border-b border-teal-200/50 dark:border-teal-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-300/30">
                  <Handshake className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                Handover to BAU
              </CardTitle>
              <CardDescription className="ml-11 mt-1">
                Document the handover details for the BAU support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">

              {/* BAU Contact & Team */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">
                    BAU Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. John Smith"
                    value={handoverData.bauContactName}
                    onChange={(e) => setHandoverData({ ...handoverData, bauContactName: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">
                    BAU Team Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Finance Operations Team"
                    value={handoverData.bauTeamName}
                    onChange={(e) => setHandoverData({ ...handoverData, bauTeamName: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Support Model & SLA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Support Model</Label>
                  <Select
                    value={handoverData.supportModel}
                    onValueChange={(v) => setHandoverData({ ...handoverData, supportModel: v as any })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select support level" /></SelectTrigger>
                    <SelectContent className="z-[70]">
                      <SelectItem value="L1">Basic Support</SelectItem>
                      <SelectItem value="L2">Intermediate Support</SelectItem>
                      <SelectItem value="L3">Advanced/Dev Support</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">SLA Agreed</Label>
                  <Input
                    placeholder="e.g. 4 hours response time"
                    value={handoverData.slaAgreed}
                    onChange={(e) => setHandoverData({ ...handoverData, slaAgreed: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Training Completed Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="font-semibold text-sm">Training Completed</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Has the BAU team been trained on operating this bot?
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${handoverData.trainingCompleted ? "text-green-600" : "text-muted-foreground"}`}>
                    {handoverData.trainingCompleted ? "Yes" : "No"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHandoverData({ ...handoverData, trainingCompleted: !handoverData.trainingCompleted })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${handoverData.trainingCompleted ? "bg-green-500" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${handoverData.trainingCompleted ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>

              {/* Runbook Upload */}
              <div className="space-y-2">
                <Label className="font-semibold">Runbook / Bot Documentation</Label>
                <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-teal-300/50 dark:border-teal-700/50 bg-teal-50/30 dark:bg-teal-950/10">
                  {handoverDocMeta ? (
                    <div className="flex items-center gap-2 flex-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400 truncate">
                        {handoverDocMeta.filePath.split(/[/\\]/).pop()}
                      </span>
                      <button
                        onClick={() => setHandoverDocMeta(null)}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Upload runbook or user guide</p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX supported</p>
                      </div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xlsx,.xls"
                          onChange={handleHandoverDocChange}
                        />
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-teal-300 text-teal-700 dark:text-teal-400 text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors">
                          {isUploadingHandoverDoc
                            ? <><Loader2 className="w-3 h-3 animate-spin" />Uploading...</>
                            : <><Upload className="w-3 h-3" />Choose File</>
                          }
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Known Limitations */}
              <div className="space-y-2">
                <Label className="font-semibold">Known Limitations</Label>
                <Textarea
                  placeholder="Document any known edge cases, limitations, or scenarios the bot cannot handle..."
                  value={handoverData.knownLimitations}
                  onChange={(e) => setHandoverData({ ...handoverData, knownLimitations: e.target.value })}
                  className="min-h-24"
                />
              </div>

              {/* Escalation Path */}
              <div className="space-y-2">
                <Label className="font-semibold">Escalation Path</Label>
                <Textarea
                  placeholder="Who to contact and when — e.g. L1: BAU Team → L2: RPA Engineer → L3: RPA Lead..."
                  value={handoverData.escalationPath}
                  onChange={(e) => setHandoverData({ ...handoverData, escalationPath: e.target.value })}
                  className="min-h-24"
                />
              </div>

              {/* Handover Notes */}
              <div className="space-y-2">
                <Label className="font-semibold">Handover Notes</Label>
                <Textarea
                  placeholder="General observations, special instructions, or anything the BAU team should know..."
                  value={handoverData.handoverNotes}
                  onChange={(e) => setHandoverData({ ...handoverData, handoverNotes: e.target.value })}
                  className="min-h-24"
                />
              </div>

            </CardContent>
          </Card>

          <SaveButton
            onClick={handleHandoverSave}
            label="Submit Handover"
            color="bg-teal-600 hover:bg-teal-700 text-white"
          />
        </div>
      )}
    </>
  )
}