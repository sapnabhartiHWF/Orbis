// processRegistrationApi.ts
import { apiCall, API_BASE_URL } from "./api";

export { apiCall };

// ────────────────────────────────────────────────
// STAGE TYPES AND API
// ────────────────────────────────────────────────

export interface StageData {
  stageId: number;
  stageName: string;
  sequenceOrder: number;
  nextStageId: number | null;
  requiresApproval: boolean;
  isActive: boolean;
}

/**
 * Fetch all stages from StageMaster table
 */
export const getAllStages = async (): Promise<{
  success: boolean;
  stages?: StageData[];
  message?: string;
}> => {
  try {
    const response = await apiCall("/api/stages", {
      method: "GET",
    });
    return response.json();
  } catch (error) {
    console.error("Error fetching stages:", error);
    throw error;
  }
};

/**
 * Map backend stage name to frontend display
 */
export const mapBackendStageToFrontend = (
  backendStage: string | null | undefined
): string => {
  if (!backendStage) return "Registration";
  return backendStage.trim();
};

/**
 * Map frontend stage to backend (identity mapping)
 */
export const mapFrontendStageToBackend = (frontendStage: string): string => {
  return frontendStage;
};

/**
 * Get StageId by stage name
 */
export const getStageIdByName = (stageName: string, allStages?: StageData[]): number => {
  if (!allStages || !Array.isArray(allStages)) {
    console.warn(`getStageIdByName called without allStages array for stage: ${stageName}`);
    return 1; // Default fallback
  }
  const stage = allStages.find(s => s.stageName === stageName);
  return stage?.stageId || 1;
};

// ────────────────────────────────────────────────
// STAGE-SPECIFIC PAYLOAD TYPES (Based on Database Tables)
// ────────────────────────────────────────────────

// 1. Registration (ProcessRegistration table)
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

// 2. Initial Triage (InitialTriageStage table)
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
}

// 3. Detailed Analysis (DetailedAnalysisStage table)
interface DetailedAnalysisPayload {
  ProcessId: number;
  PddPath?: string;
  MimeType?: string;
  PddFile?: File;
}

// 4. Technical Assessment (TechnicalAssessmentStage table)
interface TechnicalAssessmentPayload {
  ProcessId: number;
  InfrastructureReady?: boolean;
  BotHostingType?: string;
  CredentialVaultRequired?: boolean;
  ExternalSystemDependencies?: string;
  LicensingImpact?: string;
  RiskLevel?: string;
  TechnicalComments?: string;
}

// 5. Business Case (BusinessCaseStage table)
interface BusinessCasePayload {
  ProcessId: number;
  FteSavings?: number;
  CostSavings?: number;
  ImplementationCost?: number;
  PaybackMonths?: number;
  RoiPercent?: number;
}

// ────────────────────────────────────────────────
// CREATE / START STAGE FUNCTIONS
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

export const createBusinessCase = async (data: BusinessCasePayload) => {
  const res = await apiCall("/api/business-case", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const completeStage = async (payload: { ProcessId: number; StageName: string }) => {
  const res = await apiCall("/api/stage-tracking/complete", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const getAllProcessesSummary = () =>
  apiCall("/api/get-all-processes").then((r) => r.json());

export const getProcessDetail = (processId: number) =>
  apiCall(`/api/get-process-detail/${processId}`).then((r) => r.json());

export const getBusinessCase = (processId: number) =>
  apiCall(`/api/get-business-case/${processId}`).then((r) => r.json());

export const getTechnicalAssessment = (processId: number) =>
  apiCall(`/api/get-technical-assessment/${processId}`).then((r) => r.json());

export const getAutomationRoadmap = async (): Promise<{
  success: boolean;
  count?: number;
  data?: any[];
  error?: string;
}> => {
  try {
    const response = await apiCall("/api/automation-roadmap", {
      method: "GET",
    });
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
  const response = await apiCall(`${endpoint}/${processId}`, {
    method: "GET",
  });

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

export const downloadWorkflowDiagram = (processId: number, originalName?: string) =>
  downloadFile("/api/download-tobe-workflow", processId, "workflow_diagram", originalName);

export const downloadExceptionHandlingPlan = (processId: number, originalName?: string) =>
  downloadFile("/api/download-tobe-exception", processId, "exception_handling_plan", originalName);

export const downloadPDD = async (processId: number, filePath?: string, fileName?: string): Promise<void> => {
  try {
    const response = await apiCall(`/api/download-process-pdd/${processId}`, {
      method: "GET",
    });

    if (!response.ok) {
      let errorMsg = "Download failed";
      try {
        // Try to parse error response as JSON
        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          const err = await response.json();
          errorMsg = err.message || errorMsg;
        } else {
          errorMsg = `Download failed with status ${response.status}`;
        }
      } catch {
        // If parsing fails, use status text or default message
        errorMsg = response.statusText || "Download failed";
      }
      throw new Error(errorMsg);
    }

    // Check if response is actually a file (blob) or an error
    const contentType = response.headers.get("Content-Type");
    if (contentType && contentType.includes("application/json")) {
      // Response is JSON (error), not a file
      const err = await response.json();
      throw new Error(err.message || "Download failed");
    }

    const blob = await response.blob();
    
    // Check if blob is actually an error JSON (sometimes errors come as blobs)
    if (blob.size === 0) {
      throw new Error("Downloaded file is empty");
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Get filename from Content-Disposition header or use provided/default
    let downloadFileName = fileName || filePath?.split(/[/\\]/).pop() || "pdd_document";
    const contentDisposition = response.headers.get("Content-Disposition");
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match?.[1]) {
        downloadFileName = match[1].replace(/['"]/g, "");
      }
    }
    
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
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

export const updateProcessRegistration = async (processId: number, data: {
  Title: string
  Description?: string
  Priority?: string
  ExpectedROI?: number
  Stakeholder?: string
  Tag?: string
  SampledataPath?: string
  MimeType?: string
  SopDoc?: string
  SopMimetype?: string
  Department?: string
}): Promise<any> => {
  const response = await apiCall(`/api/process-registration/${processId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

export const updateInitialTriage = async (processId: number, data: {
  T_id?: number
  IsRuleBased?: boolean
  AreExceptionsManageable: boolean
  IsStable?: boolean
  SystemsInvolved?: string
  Blockers?: string
  EstimatedAutomationPercent?: number
}): Promise<any> => {
  const response = await apiCall(`/api/initial-triage/${processId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}