// processRegistrationApi.ts
import { apiCall, API_BASE_URL } from "./api";

export { apiCall };

export interface StageData {
  stageId: number;
  stageName: string;
  sequenceOrder: number;
  nextStageId: number | null;
  requiresApproval: boolean;
  isActive: boolean;
}

export const getAllStages = async (): Promise<{
  success: boolean;
  stages?: StageData[];
  message?: string;
}> => {
  try {
    const response = await apiCall("/api/stages", { method: "GET" });
    return response.json();
  } catch (error) {
    console.error("Error fetching stages:", error);
    throw error;
  }
};

export const mapBackendStageToFrontend = (
  backendStage: string | null | undefined
): string => {
  if (!backendStage) return "Registration";
  return backendStage.trim();
};

export const mapFrontendStageToBackend = (frontendStage: string): string => {
  return frontendStage;
};

export const getStageIdByName = (stageName: string, allStages?: StageData[]): number => {
  if (!allStages || !Array.isArray(allStages)) {
    console.warn(`getStageIdByName called without allStages array for stage: ${stageName}`);
    return 1;
  }
  const stage = allStages.find(s => s.stageName === stageName);
  return stage?.stageId || 1;
};

// ────────────────────────────────────────────────
// PAYLOAD TYPES
// ────────────────────────────────────────────────

interface RegistrationPayload {
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
  Department?: string;
}

// Resubmission payload — same fields as registration
export interface ResubmitPayload {
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
  Department?: string;
}

export interface InitialTriagePayload {
  ProcessId: number;
  IsRuleBased: boolean;
  IsStable: boolean;
  AreExceptionsManageable: boolean;
  ComplianceRisk: boolean;
  ComplianceRiskSummary?: string;
  SystemsInvolved?: string;
  Blockers?: string;
  EstimatedAutomationPercent?: number;
  AnalysisDesignDuration?: string;
  DevelopmentDuration?: string;
  TestingDuration?: string;
  DeploymentDuration?: string;
  TrainingGoLiveDuration?: string;
}

interface DetailedAnalysisPayload {
  ProcessId: number;
  PddPath?: string;
  MimeType?: string;
  PddFile?: File;
}

interface TechnicalAssessmentPayload {
  ProcessId: number;
  InfrastructureReady?: boolean;
  BotHostingType?: string | null;
  CredentialVaultRequired?: boolean;
  ExternalSystemDependencies?: string | null;
  LicensingImpact?: string | null;
  RiskLevel?: string | null;
  TechnicalComments?: string | null;
  RpaTool?: string | null;
  BotType?: string | null;
  TargetEnvironment?: string | null;
  OrchestratorUrl?: string | null;
}

interface BusinessCasePayload {
  ProcessId:              number;
  AnnualProcessCost?:     number;
  WeeklyHoursSpent?:      number;
  PeopleInvolved?:        number;
  ImplementationCost?:    number;
  EfficiencyGainPercent?: number;
  ErrorReductionPercent?: number;
}

interface BusinessCaseResponse {
  success:         boolean;
  message?:        string;
  data?: {
    BC_id:            number;
    FteSavings:       number;
    CostSavings:      number;
    PaybackMonths:    number;
    RoiPercent:       number;
    FiveYearNetValue: number;
  };
}

// ── Development ───────────────────────────────────────────────
export interface DevelopmentStartPayload {
  processId: number;
}

export interface DevelopmentCompletePayload {
  processId: number;
}

export interface DevelopmentActionResponse {
  success: boolean;
  message?: string;
  data?: {
    processId:     number;
    startedAt?:    string;
    completedAt?:  string;
    durationDays?: number;
  };
}

// ── QA ────────────────────────────────────────────────────────
export interface QAStartPayload {
  processId: number;
}

export interface QACompletePayload {
  processId: number;
  totalTestCases?: number;
  passedTestCases?: number;
  failedTestCases?: number;
  criticalDefects?: number;
  qaStatus?: string;
  qaComments?: string;
}

export interface QAActionResponse {
  success: boolean;
  message?: string;
  data?: {
    processId:     number;
    qaStartDate?:  string;
    qaEndDate?:    string;
    startedAt?:    string;
    durationDays?: number;
    passRate?:     number;
    qaStatus?:     string;
  };
}

// ── UAT ───────────────────────────────────────────────────────
export interface UATStartPayload {
  processId: number;
}

export interface UATCompletePayload {
  processId: number;
  testResult?: string;
  defectsFound?: number;
  uatComments?: string;
}

export interface UATActionResponse {
  success: boolean;
  message?: string;
  data?: {
    processId:     number;
    uatStartDate?: string;
    uatEndDate?:   string;
    startedAt?:    string;
    durationDays?: number;
    testResult?:   string;
  };
}

// ── Hypercare ─────────────────────────────────────────────────
export interface HypercareStartPayload {
  processId: number;
}

export interface HypercareCompletePayload {
  processId: number;
  incidentsReported?: number;
  incidentsResolved?: number;
  botAvailabilityPercent?: number;
  avgHandlingTime?: number;
  slaBreachers?: number;
  escalations?: number;
  hypercareOutcome?: string;
  hypercareNotes?: string;
}

export interface HypercareActionResponse {
  success: boolean;
  message?: string;
  data?: {
    processId:           number;
    hypercareStartDate?: string;
    hypercareEndDate?:   string;
    startedAt?:          string;
    durationDays?:       number;
    hypercareOutcome?:   string;
    botAvailability?:    number;
  };
}

// ── GoLive ────────────────────────────────────────────────────
export interface GoLiveStagePayload {
  processId: number;
  deploymentDate?: string;
  deploymentEnvironment?: string;
  botVersion?: string;
  deploymentNotes?: string;
}

// ── Hypercare Stage (legacy type kept for compatibility) ──────
export interface HypercareStagePayload {
  processId: number;
  hypercareStart?: string;
  hypercareEnd?: string;
  incidentsReported?: number;
  hypercareNotes?: string;
}

// ── Handover ──────────────────────────────────────────────────
export interface HandoverPayload {
  processId: number;
  bauContactName?: string;
  bauTeamName?: string;
  supportModel?: string;
  botDocumentationPath?: string;
  botDocMimeType?: string;
  knownLimitations?: string;
  escalationPath?: string;
  slaAgreed?: string;
  trainingCompleted?: boolean;
  handoverNotes?: string;
}

export interface HandoverResponse {
  success: boolean;
  message?: string;
  data?: { processId: number };
}

// ────────────────────────────────────────────────
// WRITE FUNCTIONS
// ────────────────────────────────────────────────

export const createProcessRegistration = async (data: RegistrationPayload) => {
  const res = await apiCall("/api/process-registration", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const createInitialTriage = async (data: InitialTriagePayload) => {
  const res = await apiCall("/api/initial-triage", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const createDetailedAnalysis = async (data: DetailedAnalysisPayload) => {
  if (data.PddFile) {
    const formData = new FormData();
    formData.append("ProcessId", data.ProcessId.toString());
    formData.append("PddFile", data.PddFile);
    const res = await apiCall("/api/detailed-analysis", {
      method: "POST",
      body: formData,
    });
    return res.json();
  }
  const res = await apiCall("/api/detailed-analysis", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const createTechnicalAssessment = async (data: TechnicalAssessmentPayload) => {
  const res = await apiCall("/api/technical-assessment", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const createBusinessCase = async (
  data: BusinessCasePayload
): Promise<BusinessCaseResponse> => {
  const res = await apiCall("/api/business-case", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
};

// ── Development ───────────────────────────────────────────────

export const startDevelopmentStage = async (
  data: DevelopmentStartPayload
): Promise<DevelopmentActionResponse> => {
  const res = await apiCall("/api/stage/development/start", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const completeDevelopmentStage = async (
  data: DevelopmentCompletePayload
): Promise<DevelopmentActionResponse> => {
  const res = await apiCall("/api/stage/development/complete", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
};

// ── QA ────────────────────────────────────────────────────────

export const startQAStage = async (payload: QAStartPayload): Promise<QAActionResponse> => {
  const res = await apiCall("/api/stage/qa/start", {
    method: "POST",
    body: JSON.stringify({ processId: payload.processId }),
  });
  if (!res.ok) {
    let errorMessage = "Failed to start QA stage";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

export const completeQAStage = async (payload: QACompletePayload): Promise<QAActionResponse> => {
  const res = await apiCall("/api/stage/qa/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errorMessage = "Failed to complete QA stage";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

// ── UAT ───────────────────────────────────────────────────────

export const startUATStage = async (payload: UATStartPayload): Promise<UATActionResponse> => {
  const res = await apiCall("/api/stage/uat/start", {
    method: "POST",
    body: JSON.stringify({ processId: payload.processId }),
  });
  if (!res.ok) {
    let errorMessage = "Failed to start UAT stage";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

export const completeUATStage = async (payload: UATCompletePayload): Promise<UATActionResponse> => {
  const res = await apiCall("/api/stage/uat/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errorMessage = "Failed to complete UAT stage";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

// ── GoLive ────────────────────────────────────────────────────

export const createGoLiveStage = async (data: GoLiveStagePayload) => {
  const res = await apiCall("/api/stage/golive", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
};

// ── Hypercare ─────────────────────────────────────────────────

export const startHypercareStage = async (
  payload: HypercareStartPayload
): Promise<HypercareActionResponse> => {
  const res = await apiCall("/api/stage/hypercare/start", {
    method: "POST",
    body: JSON.stringify({ processId: payload.processId }),
  });
  if (!res.ok) {
    let errorMessage = "Failed to start Hypercare stage";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

export const completeHypercareStage = async (
  payload: HypercareCompletePayload
): Promise<HypercareActionResponse> => {
  const res = await apiCall("/api/stage/hypercare/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errorMessage = "Failed to complete Hypercare stage";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

// ── Handover ──────────────────────────────────────────────────

export const submitHandoverStage = async (
  payload: HandoverPayload
): Promise<HandoverResponse> => {
  const res = await apiCall("/api/stage/handover", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errorMessage = "Failed to submit Handover stage";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

export const getHandoverStage = async (
  processId: number
): Promise<{ success: boolean; hasData: boolean; data: any }> => {
  const res = await apiCall(`/api/stage/handover/${processId}`, {
    method: "GET",
  });
  if (!res.ok) {
    let errorMessage = "Failed to get Handover stage";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

export const updateProcessRegistration = async (
  processId: number,
  payload: ResubmitPayload
): Promise<{ success: boolean; message: string }> => {
  const res = await apiCall(`/api/process-registration/resubmit`, {
    method: "POST",
    body: JSON.stringify({ ProcessId: processId, ...payload }),
  });
  let data: any;
  try { data = await res.json(); } catch { throw new Error(res.statusText || "Failed to update process registration"); }
  if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to update process registration");
  return data;
};

export const updateInitialTriageStage = async (
  processId: number,
  payload: any
): Promise<{ success: boolean; message: string }> => {
  const res = await apiCall(`/api/initial-triage/resubmit/${processId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  let data: any;
  try { data = await res.json(); } catch { throw new Error(res.statusText || "Failed to update initial triage"); }
  if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to update initial triage");
  return data;
};

// ────────────────────────────────────────────────
// REJECT
// ────────────────────────────────────────────────

export const rejectInitialTriage = async (
  processId: number,
  rejectionReason: string
): Promise<{ success: boolean; message: string }> => {
  const res = await apiCall(`/api/initial-triage/reject`, {
    method: "POST",
    body: JSON.stringify({ ProcessId: processId, RejectionReason: rejectionReason }),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(res.statusText || "Failed to reject Initial Triage");
  }

  if (!res.ok || !data?.success) {
    throw new Error(data?.message || "Failed to reject Initial Triage");
  }

  return data;
};

// ────────────────────────────────────────────────
// GET FUNCTIONS
// ────────────────────────────────────────────────

export const getDevelopmentStage = (processId: number) =>
  apiCall(`/api/stage/development/${processId}`).then((r) => r.json());

export const getQAStage = (processId: number) =>
  apiCall(`/api/stage/qa/${processId}`).then((r) => r.json());

export const getUATStage = (processId: number) =>
  apiCall(`/api/stage/uat/${processId}`).then((r) => r.json());

export const getGoLiveStage = (processId: number) =>
  apiCall(`/api/stage/golive/${processId}`).then((r) => r.json());

export const getHypercareStage = (processId: number) =>
  apiCall(`/api/stage/hypercare/${processId}`).then((r) => r.json());

export const completeStage = async (payload: { ProcessId: number; StageName: string }) => {
  const res = await apiCall("/api/stage-tracking/complete", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const getAllProcessesSummary = () =>
  apiCall("/api/get-all-processes").then((r) => r.json());

export const getRpaLeadProcesses = async (filters?: {
  createdBy?: number;
  department?: string;
  priority?: string;
  overallStatus?: string;
}): Promise<{
  success: boolean;
  count?: number;
  data?: any[];
  error?: string;
  message?: string;
}> => {
  try {
    const params = new URLSearchParams();
    if (filters?.createdBy)     params.append("createdBy",     String(filters.createdBy));
    if (filters?.department)    params.append("department",    filters.department);
    if (filters?.priority)      params.append("priority",      filters.priority);
    if (filters?.overallStatus) params.append("overallStatus", filters.overallStatus);
    const queryString = params.toString();
    const endpoint = `/api/rpa-lead/process${queryString ? `?${queryString}` : ""}`;
    const response = await apiCall(endpoint, { method: "GET" });
    return response.json();
  } catch (error) {
    console.error("Error fetching RPA Lead processes:", error);
    throw error;
  }
};

export const getRpaLeadProcess = async (processId: number): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}> => {
  try {
    const response = await apiCall(`/api/rpa-lead/process/${processId}`, { method: "GET" });
    return response.json();
  } catch (error) {
    console.error("Error fetching RPA Lead process:", error);
    throw error;
  }
};

export const getProcessDetail = (processId: number) =>
  apiCall(`/api/get-process-detail/${processId}`).then((r) => r.json());

export const getProcessCompleteDetail = (processId: number) =>
  apiCall(`/api/get-process-complete-detail/${processId}`).then((r) => r.json());

export const getStageTracking = (processId: number) =>
  apiCall(`/api/stage-tracking/${processId}`).then((r) => r.json());

export const getAutomationRoadmap = async (): Promise<{
  success: boolean;
  count?: number;
  data?: any[];
  error?: string;
}> => {
  try {
    const response = await apiCall("/api/automation-roadmap", { method: "GET" });
    return response.json();
  } catch (error) {
    console.error("Error fetching automation roadmap:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────
// APPROVAL & REJECTION
// ────────────────────────────────────────────────

export const approveStage = async (payload: {
  ProcessId: number;
  StageId: number;
}): Promise<{ success: boolean; message: string }> => {
  const res = await apiCall("/api/stage/approve", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const rejectStage = async (payload: {
  ProcessId: number;
  StageId: number;
  RejectionReason: string;
}): Promise<{ success: boolean; message: string }> => {
  const res = await apiCall("/api/stage/reject", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
};

// ────────────────────────────────────────────────
// FILE DOWNLOAD HELPERS
// ────────────────────────────────────────────────

const downloadFile = async (
  endpoint: string,
  processId: number,
  defaultName: string,
  originalFileName?: string
): Promise<{ blob: Blob; filename: string }> => {
  const response = await apiCall(`${endpoint}/${processId}`, { method: "GET" });
  if (!response.ok) {
    let errorMsg = "Download failed";
    try {
      const err = await response.json();
      errorMsg = err.message || errorMsg;
    } catch { }
    throw new Error(errorMsg);
  }
  const blob = await response.blob();
  let filename = defaultName;
  const contentDisposition = response.headers.get("Content-Disposition");
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match?.[1]) filename = match[1].replace(/['"]/g, "");
  }
  if (filename === defaultName && originalFileName) {
    const ext = originalFileName.split(".").pop()?.toLowerCase() || "pdf";
    filename = `${defaultName}.${ext}`;
  }
  return { blob, filename };
};

export const downloadSampleData = (processId: number, originalName?: string) =>
  downloadFile("/api/download-process-sampledata", processId, "sample_data", originalName);

export const downloadSopDoc = (processId: number, originalName?: string) =>
  downloadFile("/api/download-process-sopdoc", processId, "sop_document", originalName);

export const downloadPDD = async (
  processId: number,
  filePath?: string,
  fileName?: string
): Promise<void> => {
  try {
    const response = await apiCall(`/api/download-process-pdd/${processId}`, { method: "GET" });
    if (!response.ok) {
      let errorMsg = "Download failed";
      try {
        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          const err = await response.json();
          errorMsg = err.message || errorMsg;
        } else {
          errorMsg = `Download failed with status ${response.status}`;
        }
      } catch {
        errorMsg = response.statusText || "Download failed";
      }
      throw new Error(errorMsg);
    }
    const contentType = response.headers.get("Content-Type");
    if (contentType && contentType.includes("application/json")) {
      const err = await response.json();
      throw new Error(err.message || "Download failed");
    }
    const blob = await response.blob();
    if (blob.size === 0) throw new Error("Downloaded file is empty");
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    let downloadFileName = fileName || filePath?.split(/[/\\]/).pop() || "pdd_document";
    const contentDisposition = response.headers.get("Content-Disposition");
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match?.[1]) downloadFileName = match[1].replace(/['"]/g, "");
    }
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  } catch (error: any) {
    console.error("Error downloading PDD:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────
// FILE UPLOAD
// ────────────────────────────────────────────────

export const uploadProcessRegistrationFile = async (
  file: File,
  fileType: "sampledata" | "sopdoc"
): Promise<{
  success: boolean;
  filePath?: string;
  mimeType?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string | null;
  message?: string;
}> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileType", fileType);
  const res = await apiCall("/api/process-registration/upload-file", {
    method: "POST",
    body: formData,
  });
  return res.json();
};

// ────────────────────────────────────────────────
// APPROVALS
// ────────────────────────────────────────────────

export const getPendingApprovals = () =>
  apiCall("/api/get-pending-approvals").then((r) => r.json());

// ────────────────────────────────────────────────
// UPDATE FUNCTIONS
// ────────────────────────────────────────────────

export const updateDetailedAnalysis = async (data: DetailedAnalysisPayload) => {
  const res = await apiCall(`/api/detailed-analysis/${data.ProcessId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateBusinessCase = async (data: BusinessCasePayload): Promise<BusinessCaseResponse> => {
  const res = await apiCall(`/api/business-case/${data.ProcessId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateHandoverStage = async (data: any) => {
  const res = await apiCall(`/api/stage/handover/${data.processId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
};