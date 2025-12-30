// Import centralized API utility
import { apiCall as centralizedApiCall, API_BASE_URL } from "./api"

// Re-export the centralized apiCall for backward compatibility
// This ensures existing imports continue to work
export const apiCall = centralizedApiCall

// Stage name mapping functions
export const mapBackendStageToFrontend = (backendStage: string | null): string => {
  if (!backendStage) return "Process Registration"
  
  // Map all possible backend stage names to frontend stage names
  // Handle both exact matches and variations
  const stageMap: Record<string, string> = {
    // Process Registration - no variations
    "Process Registration": "Process Registration",
    // Initial Triage - no variations
    "Initial Triage": "Initial Triage",
    // System Integration - no variations
    "System Integration": "System Integration",
    // To-Be Design - handle variations
    "To-Be Design": "To-Be Design",
    "To-Be Design (HWF)": "To-Be Design",
    // Approval - no variations
    "Approval": "Approval",
    // Development - handle variations
    "Development": "Development",
    "Development (HWF)": "Development",
    // User Acceptance Testing - handle variations (map to full HWF name)
    "User Acceptance Testing": "User Acceptance Testing (HWF)",
    "UAT": "User Acceptance Testing (HWF)",
    // Go-Live & Deployment - handle variations (map to full HWF name)
    "Go-Live & Deployment": "Go-Live & Deployment (HWF)",
    "Go-Live": "Go-Live & Deployment (HWF)",
    // Hypercare & Stabilization - handle variations (map to full HWF name)
    "Hypercare & Stabilization": "Hypercare & Stabilization (HWF)",
    "Hypercare": "Hypercare & Stabilization (HWF)",
    // Handover to BAU Support - handle variations
    "Handover": "Handover to BAU Support",
    "BAU Support": "Handover to BAU Support"
  }
  
  // Check if backend stage is already in the correct format (identity check)
  // If it's already a valid frontend stage name, return it as-is
  const validFrontendStages: string[] = [
    "Process Registration",
    "Initial Triage",
    "System Integration",
    "To-Be Design",
    "Approval",
    "Development",
    "User Acceptance Testing (HWF)",
    "Go-Live & Deployment (HWF)",
    "Hypercare & Stabilization (HWF)",
    "Handover to BAU Support"
  ]
  
  if (validFrontendStages.includes(backendStage)) {
    return backendStage
  }
  
  // Try exact match first
  if (stageMap[backendStage]) {
    return stageMap[backendStage]
  }
  
  // Try case-insensitive match
  const backendStageLower = backendStage.toLowerCase().trim()
  for (const [key, value] of Object.entries(stageMap)) {
    if (key.toLowerCase().trim() === backendStageLower) {
      return value
    }
  }
  
  // If no match found, return the backend stage as-is (might be a new stage or exact match)
  console.warn(`Stage mapping not found for: "${backendStage}", returning as-is`)
  return backendStage
}

export const mapFrontendStageToBackend = (frontendStage: string): string => {
  // Map frontend stage names to backend stage names
  // Backend typically uses the same names, but handle variations
  const stageMap: Record<string, string> = {
    "Process Registration": "Process Registration",
    "Initial Triage": "Initial Triage",
    "System Integration": "System Integration",
    "To-Be Design": "To-Be Design",
    "Approval": "Approval",
    "Development": "Development",
    "User Acceptance Testing (HWF)": "User Acceptance Testing (HWF)",
    "Go-Live & Deployment (HWF)": "Go-Live & Deployment (HWF)",
    "Hypercare & Stabilization (HWF)": "Hypercare & Stabilization (HWF)",
    "Handover to BAU Support": "Handover to BAU Support"
  }
  
  return stageMap[frontendStage] || frontendStage
}

// Create Process Registration
export const createProcessRegistration = async (data: {
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
  Department?: string  // ✅ NEW PARAMETER
}): Promise<any> => {
  const response = await apiCall("/api/process-registration", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Create Initial Triage
export const createInitialTriage = async (data: {
  ProcessId: number
  IsRuleBased: boolean
  IsStable: boolean
  SystemsInvolved?: string
  Blockers?: string
  EstimatedAutomationPercent?: number
}): Promise<any> => {
  const response = await apiCall("/api/initial-triage", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Create System Integration
export const createSystemIntegration = async (data: {
  ProcessId: number
  Credentials?: string
  Notes?: string
}): Promise<any> => {
  const response = await apiCall("/api/system-integration", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Create To-Be Design
export const createToBeDesign = async (data: {
  ProcessId: number
  WorkflowFile: File
  ExceptionFile?: File
  Credentials?: string
  VirtualMachine?: string
  LoggingRequirements?: string
}): Promise<any> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const formData = new FormData();
  formData.append("ProcessId", data.ProcessId.toString());
  formData.append("WorkflowFile", data.WorkflowFile);

  if (data.ExceptionFile) {
    formData.append("ExceptionFile", data.ExceptionFile);
  }
  if (data.Credentials) {
    formData.append("Credentials", data.Credentials);
  }
  if (data.VirtualMachine) {
    formData.append("VirtualMachine", data.VirtualMachine);
  }
  if (data.LoggingRequirements) {
    formData.append("LoggingRequirements", data.LoggingRequirements);
  }

  const response = await fetch(`${API_BASE_URL}/api/to-be-design`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Create failed");
  }

  return response.json();
};


// Create Approval Stage
export const createApprovalStage = async (data: {
  ProcessId: number
  BusinessOwnerApproval?: boolean
  RPA_Approval?: boolean
  BO_ApprovalNote?: string
  RPA_ApprovalNote?: string
}): Promise<any> => {
  const response = await apiCall("/api/approval-stage", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Update Approval Stage
export const updateApprovalStage = async (processId: number, data: {
  A_id?: number
  BusinessOwnerApproval?: boolean
  RPA_Approval?: boolean
  BO_ApprovalNote?: string
  RPA_ApprovalNote?: string
  BO_approval_status?: string
  RPA_approval_status?: string
}): Promise<any> => {
  // CRITICAL: Remove undefined values from the data object before sending
  // This ensures that fields not being updated are completely omitted from the request
  const cleanedData: any = {};
  if (data.A_id !== undefined) cleanedData.A_id = data.A_id;
  if (data.BusinessOwnerApproval !== undefined) cleanedData.BusinessOwnerApproval = data.BusinessOwnerApproval;
  if (data.RPA_Approval !== undefined) cleanedData.RPA_Approval = data.RPA_Approval;
  if (data.BO_ApprovalNote !== undefined) cleanedData.BO_ApprovalNote = data.BO_ApprovalNote;
  if (data.RPA_ApprovalNote !== undefined) cleanedData.RPA_ApprovalNote = data.RPA_ApprovalNote;
  if (data.BO_approval_status !== undefined) cleanedData.BO_approval_status = data.BO_approval_status;
  if (data.RPA_approval_status !== undefined) cleanedData.RPA_approval_status = data.RPA_approval_status;
  
  console.log("🔒 updateApprovalStage API Call - Cleaned Data:", cleanedData);
  
  const response = await apiCall(`/api/approval-stage/${processId}`, {
    method: "PUT",
    body: JSON.stringify(cleanedData),
  })
  return response.json()
}

// Create Development Stage
export const createDevelopmentStage = async (data: {
  ProcessId: number
}): Promise<any> => {
  const response = await apiCall("/api/development-stage", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Create User Acceptance Testing (HWF) Stage
export const createUATStage = async (data: {
  ProcessId: number
}): Promise<any> => {
  const response = await apiCall("/api/uat-stage", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Create Go-Live & Deployment (HWF) Stage
export const createGoLiveStage = async (data: {
  ProcessId: number
}): Promise<any> => {
  const response = await apiCall("/api/go-live-stage", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Create Hypercare & Stabilization (HWF) Stage
export const createHypercareStage = async (data: {
  ProcessId: number
}): Promise<any> => {
  const response = await apiCall("/api/hypercare-stage", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Create Handover to BAU Support Stage
export const createHandoverStage = async (data: {
  ProcessId: number
}): Promise<any> => {
  const response = await apiCall("/api/handover-stage", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Update Stage Tracking Completed
export const updateStageTrackingCompleted = async (data: {
  ProcessId: number
  StageName: string
}): Promise<any> => {
  const response = await apiCall("/api/stage-tracking/complete", {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Get All Processes Summary (for card view)
export const getAllProcessesSummary = async (): Promise<any> => {
  const response = await apiCall("/api/get-all-process-stages-summary", {
    method: "GET",
  })
  return response.json()
}

// Get Process Detail (with all stages)
export const getProcessDetail = async (processId: number): Promise<any> => {
  const response = await apiCall(`/api/get-all-process-stages-detail/${processId}`, {
    method: "GET",
  })
  return response.json()
}

// Get Next Stage from Database (StageMaster)
export const getNextStage = async (processId: number): Promise<any> => {
  const response = await apiCall(`/api/get-next-stage/${processId}`, {
    method: "GET",
  })
  return response.json()
}

// Update Process Registration
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

// Update Initial Triage
export const updateInitialTriage = async (processId: number, data: {
  T_id?: number
  IsRuleBased?: boolean
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

// Update System Integration
export const updateSystemIntegration = async (processId: number, data: {
  sy_Id?: number
  Credentials?: string
  Notes?: string
}): Promise<any> => {
  const response = await apiCall(`/api/system-integration/${processId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Update To-Be Design
export const updateToBeDesign = async (
  processId: number,
  data: {
    D_id: number
    WorkflowFile?: File
    ExceptionFile?: File
    Credentials?: string
    VirtualMachine?: string
    LoggingRequirements?: string
  }
): Promise<any> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const formData = new FormData();
  formData.append("D_id", data.D_id.toString());

  if (data.WorkflowFile) {
    formData.append("WorkflowFile", data.WorkflowFile);
  }
  if (data.ExceptionFile) {
    formData.append("ExceptionFile", data.ExceptionFile);
  }
  if (data.Credentials) {
    formData.append("Credentials", data.Credentials);
  }
  if (data.VirtualMachine) {
    formData.append("VirtualMachine", data.VirtualMachine);
  }
  if (data.LoggingRequirements) {
    formData.append("LoggingRequirements", data.LoggingRequirements);
  }

  const response = await fetch(`${API_BASE_URL}/api/to-be-design/${processId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Update failed");
  }

  return response.json();
};

// Download SampleData file - Simple and direct approach like FileManager
export const downloadSampleData = async (processId: number, originalFileName?: string): Promise<{ blob: Blob; filename: string }> => {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`${API_BASE_URL}/api/download-process-sampledata/${processId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    credentials: "include",
  });
  
  if (!response.ok) {
    let errorMessage = "Download failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  // Get blob first
  const blob = await response.blob();
  
  // Extract filename from Content-Disposition header (preferred)
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = "sample_data";
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "");
    }
  }
  
  // If no filename from header, use original filename or extract extension from it
  if (filename === "sample_data" && originalFileName) {
    // Extract extension from original filename
    const ext = originalFileName.includes('.') 
      ? originalFileName.split('.').pop()?.toLowerCase() || 'xlsx'
      : 'xlsx';
    filename = `sample_data.${ext}`;
  } else if (filename === "sample_data") {
    // Last resort: try to detect from blob type or use default
    if (blob.type && blob.type.includes('spreadsheet')) {
      filename = "sample_data.xlsx";
    } else if (blob.type && blob.type.includes('excel')) {
      filename = "sample_data.xls";
    } else {
      filename = "sample_data.xlsx"; // Default for sample data
    }
  }
  
  return { blob, filename };
}

// Download SOP Document file - Simple and direct approach like FileManager
export const downloadSopDoc = async (processId: number, originalFileName?: string): Promise<{ blob: Blob; filename: string }> => {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`${API_BASE_URL}/api/download-process-sopdoc/${processId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    credentials: "include",
  });
  
  if (!response.ok) {
    let errorMessage = "Download failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  // Get blob first
  const blob = await response.blob();
  
  // Extract filename from Content-Disposition header (preferred)
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = "sop_document";
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "");
    }
  }
  
  // If no filename from header, use original filename or extract extension from it
  if (filename === "sop_document" && originalFileName) {
    // Extract extension from original filename
    const ext = originalFileName.includes('.') 
      ? originalFileName.split('.').pop()?.toLowerCase() || 'pdf'
      : 'pdf';
    filename = `sop_document.${ext}`;
  } else if (filename === "sop_document") {
    // Last resort: try to detect from blob type or use default
    if (blob.type && blob.type.includes('pdf')) {
      filename = "sop_document.pdf";
    } else if (blob.type && blob.type.includes('word')) {
      filename = "sop_document.docx";
    } else if (blob.type && blob.type.includes('spreadsheet')) {
      filename = "sop_document.xlsx";
    } else {
      filename = "sop_document.pdf"; // Default for SOP
    }
  }
  
  return { blob, filename };
}

// Download Workflow Diagram file - Simple and direct approach like FileManager
export const downloadWorkflowDiagram = async (processId: number, originalFileName?: string): Promise<{ blob: Blob; filename: string }> => {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`${API_BASE_URL}/api/download-tobe-workflow/${processId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    credentials: "include",
  });
  
  if (!response.ok) {
    let errorMessage = "Download failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  // Get blob first
  const blob = await response.blob();
  
  // Extract filename from Content-Disposition header (preferred)
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = "workflow_diagram";
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "");
    }
  }
  
  // If no filename from header, use original filename or extract extension from it
  if (filename === "workflow_diagram" && originalFileName) {
    // Extract extension from original filename
    const ext = originalFileName.includes('.') 
      ? originalFileName.split('.').pop()?.toLowerCase() || 'pdf'
      : 'pdf';
    filename = `workflow_diagram.${ext}`;
  } else if (filename === "workflow_diagram") {
    // Last resort: try to detect from blob type or use default
    if (blob.type && blob.type.includes('pdf')) {
      filename = "workflow_diagram.pdf";
    } else if (blob.type && blob.type.includes('spreadsheet')) {
      filename = "workflow_diagram.xlsx";
    } else if (blob.type && blob.type.includes('image')) {
      filename = "workflow_diagram.png";
    } else {
      filename = "workflow_diagram.pdf"; // Default
    }
  }
  
  return { blob, filename };
}

// Download Exception Handling Plan file - Simple and direct approach like FileManager
export const downloadExceptionHandlingPlan = async (processId: number, originalFileName?: string): Promise<{ blob: Blob; filename: string }> => {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`${API_BASE_URL}/api/download-tobe-exception/${processId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    credentials: "include",
  });
  
  if (!response.ok) {
    let errorMessage = "Download failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  // Get blob first
  const blob = await response.blob();
  
  // Extract filename from Content-Disposition header (preferred)
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = "exception_handling_plan";
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "");
    }
  }
  
  // If no filename from header, use original filename or extract extension from it
  if (filename === "exception_handling_plan" && originalFileName) {
    // Extract extension from original filename
    const ext = originalFileName.includes('.') 
      ? originalFileName.split('.').pop()?.toLowerCase() || 'pdf'
      : 'pdf';
    filename = `exception_handling_plan.${ext}`;
  } else if (filename === "exception_handling_plan") {
    // Last resort: try to detect from blob type or use default
    if (blob.type && blob.type.includes('pdf')) {
      filename = "exception_handling_plan.pdf";
    } else if (blob.type && blob.type.includes('spreadsheet')) {
      filename = "exception_handling_plan.xlsx";
    } else if (blob.type && blob.type.includes('word')) {
      filename = "exception_handling_plan.docx";
    } else {
      filename = "exception_handling_plan.pdf"; // Default
    }
  }
  
  return { blob, filename };
}

