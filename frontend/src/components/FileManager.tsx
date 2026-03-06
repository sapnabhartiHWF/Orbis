import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload,
  File,
  Video,
  Image,
  FileText,
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
  Tag,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader,
  Search,
  Grid,
  List,
  Copy,
  Play,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  FileUpload,
  formatFileSize,
  getFileTypeIcon,
  getTimeAgo,
} from "@/utils/collaborationUtils";
import { createProcessOnboarding, getProcessOnboardingList } from "@/services/processOnboardingApi";
import { AirlineDetailsTable } from "./AirlineDetailsTable";

interface FileManagerProps {
  processId?: string;
  onFileCountsChange?: (counts: Record<string, number>) => void;
}

const fileTypes = ["all", "document", "video", "flowchart", "image"];
const staticTags = ["demo", "current-state", "training"];
const url = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/processes";
const deleteUrl = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/delete-uploaded-file";
const insertProcessUrl = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/insert_process";
const notifyAutomationLeadUrl = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/notify-automation-lead";

// Helper function to build the files API URL with bot_id from selected onboarding folder
const getFilesUrl = (botId: string | number | null | undefined): string => {
  if (!botId) {
    throw new Error("botId is required to fetch files");
  }
  return `https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/process/${botId}/file-management`;
};

// Helper function to build the upload API URL with bot_id
const getUploadUrl = (botId: string | number | null | undefined): string => {
  if (!botId) {
    throw new Error("botId is required to upload files");
  }
  return `https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/process/${botId}/file-management`;
};

// Helper function to build the trigger API URL with bot_id
const getTriggerUrl = (botId: string | number | null | undefined, fileId: string | number): string => {
  if (!botId) {
    throw new Error("botId is required to trigger files");
  }
  return `https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/process/${botId}/trigger-file/${fileId}`;
};

// Helper function to get proper file type icon component (no colors, just icon)
const getFileIcon = (format: string, className: string = "w-6 h-6") => {
  const formatLower = format?.toLowerCase() || '';

  if (['pdf'].includes(formatLower)) {
    return <FileText className={className} />;
  }
  if (['doc', 'docx'].includes(formatLower)) {
    return <FileText className={className} />;
  }
  if (['xls', 'xlsx', 'csv'].includes(formatLower)) {
    return <FileText className={className} />;
  }
  if (['ppt', 'pptx'].includes(formatLower)) {
    return <FileText className={className} />;
  }
  if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv', 'webm'].includes(formatLower)) {
    return <Video className={className} />;
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(formatLower)) {
    return <Image className={className} />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(formatLower)) {
    return <File className={className} />;
  }

  return <File className={className} />;
};

export function FileManager({ processId, onFileCountsChange }: FileManagerProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadFileType, setUploadFileType] = useState<string>("");
  const [uploadDescription, setUploadDescription] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [uploadProcessId, setUploadProcessId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isAddingNewProcess, setIsAddingNewProcess] = useState(false);
  const [newProcessName, setNewProcessName] = useState("");
  const [isCreatingProcess, setIsCreatingProcess] = useState(false);
  const newProcessInputRef = useRef<HTMLInputElement | null>(null);
  const [onboardingProcesses, setOnboardingProcesses] = useState<any[]>([]);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [subject, setSubject] = useState("");
  // Fixed process templates - user must select one before uploading
  // Each template includes tasteful gradient classes for a subtle, professional look
  const processTemplates = [
    {
      id: "ap",
      name: "Account Payable",
      bgClass: "bg-gradient-to-r from-indigo-50 to-indigo-100",
      iconBgClass: "bg-indigo-100 text-indigo-700",
      titleClass: "text-indigo-800",
    },
    {
      id: "cc",
      name: "Credit Card",
      bgClass: "bg-gradient-to-r from-emerald-50 to-emerald-100",
      iconBgClass: "bg-emerald-100 text-emerald-700",
      titleClass: "text-emerald-800",
    },
    {
      id: "rp",
      name: "Received Payable",
      bgClass: "bg-gradient-to-r from-amber-50 to-amber-100",
      iconBgClass: "bg-amber-100 text-amber-700",
      titleClass: "text-amber-800",
    },
    {
      id: "dc",
      name: "Debit Card",
      bgClass: "bg-gradient-to-r from-rose-50 to-rose-100",
      iconBgClass: "bg-rose-100 text-rose-700",
      titleClass: "text-rose-800",
    },
  ];
  const [selectedProcessIdLocal, setSelectedProcessIdLocal] = useState<
    string | null
  >(null);
  const [selectedProcessNameLocal, setSelectedProcessNameLocal] = useState<
    string | null
  >(null);
  const location = useLocation();
  const { user } = useAuth();

  // Drag and drop state
  const [draggedFileId, setDraggedFileId] = useState<string | number | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [downloadingFileIds, setDownloadingFileIds] = useState<Set<string | number>>(new Set());

  // Process Onboarding Wizard State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    processName: "",
    ownedBy: "",
    department: "",
    description: "",
    tags: "",
  });
  const onboardingSteps = ["Basic Info", "Additional Info", "Review & Submit"];

  // Auto-select folder from URL after onboarding processes are loaded
  useEffect(() => {
    // Wait for onboarding processes to load before setting folder from URL
    if (isLoadingOnboarding) return;

    try {
      const params = new URLSearchParams(location.search);
      const onboardingIdFromUrl = params.get("onboardingId");

      // If onboardingId is in URL (from notification redirect), auto-select that folder
      if (onboardingIdFromUrl && !selectedProcessIdLocal) {
        // Verify the onboardingId exists in the loaded processes
        const exists = onboardingProcesses.some(
          (p) => (p.botId ? p.botId.toString() : p.id) === onboardingIdFromUrl
        );
        if (exists) {
          setSelectedProcessIdLocal(onboardingIdFromUrl);
          // Set loading state immediately when folder is selected from URL
          setIsLoading(true);
        }
      }
    } catch (e) {
      console.warn("Failed to parse onboardingId from URL", e);
    }
  }, [onboardingProcesses, isLoadingOnboarding, location.search, selectedProcessIdLocal]);

  // Fetch processes for upload popup
  useEffect(() => {

    const storedCompanyIds = JSON.parse(
      localStorage.getItem("companyIds") || "[]"
    );
    const storedCompanyNames = JSON.parse(
      localStorage.getItem("companyNames") || "[]"
    );

    if (storedCompanyIds.length === 0 || storedCompanyNames.length === 0)
      return;

    // Transform arrays into objects for dropdown
    const companyProcesses = storedCompanyIds.map((id, index) => ({
      CompanyId: id,
      Name: storedCompanyNames[index] || `Company ${id}`,
    }));

    setProcesses(companyProcesses);
  }, []);

  // Fetch file count for a specific onboarding process
  const fetchFileCount = useCallback(async (onboardingId: string, token: string, processes: any[]): Promise<number> => {
    try {
      // Find the onboarding process to get botId
      const onboardingProcess = processes.find(
        (p) => (p.botId ? p.botId.toString() : p.id) === onboardingId
      );

      if (!onboardingProcess) {
        return 0;
      }

      // Get botId from the onboarding process
      const botId = onboardingProcess.botId || onboardingProcess.id;
      if (!botId) {
        return 0;
      }

      // Special case for Bot ID 2 (Bwi / Airline Details)
      // For this folder, we show the count of flight records from airline-details API
      if (botId === "2" || botId === 2) {
        const res = await fetch(`https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/operations/airline-details?bot_id=2`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!res.ok) return 0;
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data.length;
        }
        return 0;
      }

      const queryParams = new URLSearchParams({
        fileType: 'all',
      });

      // Use botId in the URL path
      const res = await fetch(`${getFilesUrl(botId)}?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) return 0;

      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        return data.files.length;
      }
      return 0;
    } catch (err) {
      console.error(`Error fetching file count for onboarding ${onboardingId}:`, err);
      return 0;
    }
  }, []);

  // Fetch process onboarding entries from backend to render dynamic tiles
  const fetchOnboarding = useCallback(async () => {
    try {
      setIsLoadingOnboarding(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoadingOnboarding(false);
        return;
      }
      const data = await getProcessOnboardingList(token);
      if (data && Array.isArray(data.processes)) {
        setOnboardingProcesses(data.processes);

        // Fetch file counts for all onboarding processes in parallel
        // Pass processes array directly to avoid dependency loop
        const counts: Record<string, number> = {};
        const countPromises = data.processes.map(async (p: any) => {
          const id = p.botId ? p.botId.toString() : p.id;
          const count = await fetchFileCount(id, token, data.processes);
          counts[id] = count;
        });

        await Promise.all(countPromises);
        setFileCounts(counts);
      } else {
        setOnboardingProcesses([]);
        setFileCounts({});
      }
    } catch (err) {
      console.error("Error fetching onboarding processes:", err);
      setOnboardingProcesses([]);
      setFileCounts({});
    } finally {
      setIsLoadingOnboarding(false);
    }
  }, [fetchFileCount]);

  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  const notifyAutomationLead = async (fileId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ No token available to notify automation lead");
        return;
      }

      console.log(`🔔 Sending notification to Automation Lead for FileID: ${fileId}`);

      const response = await fetch(notifyAutomationLeadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ FileID: fileId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ Notification sent successfully for FileID: ${fileId}`);
      } else {
        console.warn(`⚠️ Failed to notify Automation Lead for FileID: ${fileId}`, data.message);
      }
    } catch (err) {
      console.error(`❌ Error notifying automation lead for FileID ${fileId}:`, err);
    }
  };

  // Normalize file data helper
  const normalizeFile = (f: any): FileUpload => ({
    id: f.id || Number(f.FileID),
    name: f.name || f.FileName,
    type: f.type || f.FileType,
    format: f.format || f.FileFormat,
    size: f.size || f.FileSize,
    uploadedBy: f.CreatedByName || f.CreatedBy || f.UploadedByName || f.uploadedBy || "Unknown",
    uploadedAt: (() => {
      // Check multiple possible field name variations (case-insensitive search)
      const allKeys = Object.keys(f);
      const dateKeys = allKeys.filter((k) => {
        const lower = k.toLowerCase();
        return (
          lower.includes("date") ||
          lower.includes("created") ||
          lower.includes("uploaded") ||
          lower.includes("time") ||
          lower.includes("at")
        );
      });

      // Try exact matches first
      let dateValue =
        f.uploadedAt ||
        f.UploadedAt ||
        f.uploaded_at ||
        f.Uploaded_At ||
        f.UploadedDate ||
        f.uploadedDate ||
        f.Uploaded_Date ||
        f.uploaded_date ||
        f.CreatedAt ||
        f.createdAt ||
        f.Created_At ||
        f.created_at ||
        f.UploadedTime ||
        f.uploadedTime ||
        f.CreatedTime ||
        f.createdTime;

      // If not found, try case-insensitive search
      if (!dateValue && dateKeys.length > 0) {
        for (const key of dateKeys) {
          const value = f[key];
          if (value !== null && value !== undefined && value !== "") {
            dateValue = value;
            console.log(
              `✅ FileManager - Found date field via case-insensitive search: ${key} = ${value}`
            );
            break;
          }
        }
      }

      if (!dateValue) {
        console.warn(
          "⚠️ FileManager - No date field found for file:",
          f.id || f.FileID,
          "File object:",
          f,
          "All keys:",
          allKeys,
          "Date-related keys:",
          dateKeys
        );
      } else {
        console.log(
          "✅ FileManager - Date found:",
          dateValue,
          "Type:",
          typeof dateValue,
          "for file:",
          f.id || f.FileID
        );
      }
      return dateValue || null;
    })(),
    version: f.version || f.Version || 1,
    processId: f.processId || f.ProcessID,
    processName: f.processName || f.ProcessName,
    description: f.description || f.Description,
    tags: f.tags || f.Tags || [],
    // For status: prioritize workflow status, but if Status exists and BotId is 1, 
    // it might be from MorganStanley - we'll handle that separately
    status: f.status || f.workflowStatus || (f.BotId !== 1 ? (f.Status || "ready") : "ready"),
    isTriggered: (() => {
      // Check triggerStatus from stored procedure (string: 'Triggered' or 'Not Triggered')
      if (f.triggerStatus === "Triggered") {
        return true;
      }
      // Check TriggerFlag from stored procedure (bit: 0 or 1)
      if (f.TriggerFlag !== undefined && f.TriggerFlag !== null) {
        return Boolean(f.TriggerFlag === 1 || f.TriggerFlag === true || f.TriggerFlag === "1");
      }
      // Check Trigger field (alternative name)
      if (f.Trigger !== undefined && f.Trigger !== null) {
        return Boolean(f.Trigger === 1 || f.Trigger === true || f.Trigger === "1");
      }
      // Fallback to other possible field names
      if (f.isTriggered !== undefined) {
        return Boolean(f.isTriggered);
      }
      if (f.IsTriggered !== undefined) {
        return Boolean(f.IsTriggered);
      }
      return false;
    })(),
    triggerStatus:
      f.triggerStatus || // From stored procedure: 'Triggered' or 'Not Triggered'
      (f.TriggerFlag === 1 || f.Trigger === 1 || f.isTriggered || f.IsTriggered ? "Triggered" : "Not Triggered"),
    // Morgan Stanley specific fields (from MorganStanley table)
    // The stored procedure returns ms.Status and ms.HouseBill from LEFT JOIN
    // These will be NULL for non-Morgan Stanley files (BotId != 1)
    // Check if BotId is 1 (Morgan Stanley) and Status/HouseBill exist
    morganStanleyStatus: (f.BotId === 1 || f.BotId === "1") && f.Status && f.Status !== null && f.Status !== ''
      ? String(f.Status)
      : (f.morganStanleyStatus || f.MorganStanleyStatus || null),
    houseBill: f.HouseBill && f.HouseBill !== null && f.HouseBill !== ''
      ? String(f.HouseBill)
      : (f.houseBill || f.House_Bill || null),
  });

  useEffect(() => {
    const fetchFiles = async () => {
      // Don't fetch files if no process is selected
      if (!selectedProcessIdLocal) {
        setFiles([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const token = localStorage.getItem("token");

        // Find the onboarding process to get botId
        const onboardingProcess = onboardingProcesses.find(
          (p) => (p.botId ? p.botId.toString() : p.id) === selectedProcessIdLocal
        );

        // Get botId from the selected onboarding process
        let botId: string | number | null = null;

        if (onboardingProcess) {
          // For onboarding processes, use botId from the process
          botId = onboardingProcess.botId || onboardingProcess.id;
        } else {
          // For company processes, use selectedProcessIdLocal as botId
          botId = selectedProcessIdLocal;
        }

        if (!botId) {
          setFiles([]);
          setIsLoading(false);
          return;
        }

        // Build query parameters
        const queryParams = new URLSearchParams({
          fileType: typeFilter,
        });

        // Fetch files using botId in the URL path
        const res = await fetch(
          `${getFilesUrl(botId)}?${queryParams.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("Failed to fetch files");

        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          const normalizedFiles = data.files.map((f: any) => normalizeFile(f));
          setFiles(normalizedFiles);

          // Update file count for the selected onboarding process
          if (onboardingProcess) {
            setFileCounts(prev => ({
              ...prev,
              [selectedProcessIdLocal]: normalizedFiles.length
            }));
          }
        } else {
          setFiles([]);
        }
      } catch (err: any) {
        console.error(err);
        setFiles([]);
        toast({ title: "Error fetching files", description: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [typeFilter, selectedProcessIdLocal, onboardingProcesses]);

  useEffect(() => {
    if (onFileCountsChange) {
      onFileCountsChange(fileCounts);
    }
  }, [fileCounts, onFileCountsChange]);

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesType = typeFilter === "all" || file.type === typeFilter;

    // If an onboarding folder (card) is selected, the backend already filtered
    // by onboardingId, so we don't filter again by processId here.
    const selectedOnboarding = onboardingProcesses.find(
      (p) => (p.botId ? p.botId.toString() : p.id) === selectedProcessIdLocal
    );

    let matchesProcess: boolean;
    if (selectedOnboarding) {
      // Show all files returned for this onboarding card
      matchesProcess = true;
    } else if (selectedProcessIdLocal) {
      // Regular company process selection – match by processId or processName
      matchesProcess =
        file.processId?.toString() === selectedProcessIdLocal ||
        (selectedProcessNameLocal &&
          file.processName === selectedProcessNameLocal);
    } else {
      // No local selection – fall back to optional processId prop
      matchesProcess = !processId || file.processId?.toString() === processId;
    }

    return matchesSearch && matchesType && matchesProcess;
  });

  // Legacy folder-structure logic removed; onboarding cards now represent folders.

  const handleAddNewProcess = async () => {
    if (!newProcessName.trim()) {
      toast({
        title: "Invalid process name",
        description: "Please enter a process name.",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a process.",
      });
      return;
    }

    setIsCreatingProcess(true);

    try {
      const response = await fetch(insertProcessUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Name: newProcessName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create process");
      }

      // Get the real CompanyId from the API response
      const companyId = data.CompanyId;
      const processName = newProcessName.trim();

      // Update processes list with the real ID
      const newProcess = {
        CompanyId: companyId,
        Name: processName,
      };

      setProcesses((prev) => [...prev, newProcess]);

      // Update localStorage
      const storedCompanyIds = JSON.parse(
        localStorage.getItem("companyIds") || "[]"
      );
      const storedCompanyNames = JSON.parse(
        localStorage.getItem("companyNames") || "[]"
      );

      storedCompanyIds.push(companyId);
      storedCompanyNames.push(processName);

      localStorage.setItem("companyIds", JSON.stringify(storedCompanyIds));
      localStorage.setItem("companyNames", JSON.stringify(storedCompanyNames));

      // Set as selected
      setUploadProcessId(companyId.toString());

      // Reset input state
      setIsAddingNewProcess(false);
      setNewProcessName("");

      toast({
        title: "Process created successfully",
        description: `"${processName}" has been created and is ready for file uploads.`,
      });
    } catch (error: any) {
      console.error("Error creating process:", error);
      toast({
        title: "Failed to create process",
        description:
          error.message || "An error occurred while creating the process.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProcess(false);
    }
  };

  const handleFileUpload = useCallback(
    async () => {
      if (!selectedFiles.length || !uploadFileType || !uploadProcessId) {
        toast({
          title: "Missing information",
          description: "Please select files, type, and process.",
        });
        return;
      }

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) {
        toast({
          title: "Authentication required",
          description: "Please log in to upload files.",
        });
        window.location.href = "/login";
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Find the onboarding process to get botId for the upload URL
      const selectedOnboarding = onboardingProcesses.find(
        (p) => (p.botId ? p.botId.toString() : p.id) === selectedProcessIdLocal
      );

      // Get botId from the selected onboarding process
      const botId = selectedOnboarding
        ? (selectedOnboarding.botId || selectedOnboarding.id)
        : selectedProcessIdLocal;

      if (!botId) {
        toast({
          title: "Missing process",
          description: "Please select a process before uploading files.",
        });
        setIsUploading(false);
        return;
      }

      // Build upload URL with bot_id in the path
      const uploadUrl = getUploadUrl(botId);

      const totalFiles = selectedFiles.length;
      const completedResults: Array<{ success: boolean; data?: any; error?: string; index: number }> = [];

      // Upload all files in parallel for better performance
      const uploadPromises = selectedFiles.map(async (file, index) => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          // Backend expects FileType and Description in form data
          formData.append("FileType", uploadFileType);
          if (uploadDescription) {
            formData.append("Description", uploadDescription);
          }

          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || "Upload failed");
          }

          // Update progress as each file completes
          completedResults.push({ success: true, data, index });
          const progress = Math.round((completedResults.length / totalFiles) * 100);
          setUploadProgress(progress);

          return { success: true, data, index };
        } catch (err: any) {
          console.error("Upload error:", err);
          // Still count failed uploads for progress
          completedResults.push({ success: false, error: err.message || "Network error", index });
          const progress = Math.round((completedResults.length / totalFiles) * 100);
          setUploadProgress(progress);
          return { success: false, error: err.message || "Network error", index };
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);

      // Count successes and failures
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      // Ensure progress is 100% after all uploads complete
      setUploadProgress(100);

      for (const result of successful) {
        if (result.success && result.data) {
          // Backend returns FileID in the response
          const fileId = result.data.FileID || result.data.fileId || result.data.file_id || result.data.id;
          if (fileId) {
            await notifyAutomationLead(Number(fileId));
          } else {
            console.warn("⚠️ FileID not found in upload response:", result.data);
          }
        }
      }

      if (successful.length > 0) {
        // Trigger a refetch of files
        if (!selectedProcessIdLocal) {
          return;
        }

        try {
          // Find the onboarding process to get botId
          const onboardingProcess = onboardingProcesses.find(
            (p) => (p.botId ? p.botId.toString() : p.id) === selectedProcessIdLocal
          );

          // Get botId from the selected onboarding process
          const botId = onboardingProcess
            ? (onboardingProcess.botId || onboardingProcess.id)
            : selectedProcessIdLocal;

          if (!botId) {
            return;
          }

          const queryParams = new URLSearchParams({ fileType: typeFilter });

          // Use botId in the URL path
          const res = await fetch(`${getFilesUrl(botId)}?${queryParams.toString()}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.files)) {
              const normalizedFiles = data.files.map((f: any) => normalizeFile(f));
              setFiles(normalizedFiles);
              // Update file count for the selected onboarding process
              if (onboardingProcess) {
                setFileCounts(prev => ({
                  ...prev,
                  [selectedProcessIdLocal]: normalizedFiles.length
                }));
              }
            }
          }
        } catch (err) {
          console.error("Error refreshing file list:", err);
        }
      }

      // Reset form state and turn off loading state FIRST
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFiles([]);
      setUploadFileType("");
      setUploadDescription("");
      setSelectedTags([]);
      setIsAddingNewProcess(false);
      setNewProcessName("");

      // Wait a moment for UI to update (button loading state to turn off)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Show summary toast AFTER button loading state has turned off
      if (successful.length > 0 && failed.length === 0) {
        toast({
          title: "Upload successful",
          description: `${successful.length} file(s) uploaded successfully.`,
        });
      } else if (successful.length > 0 && failed.length > 0) {
        toast({
          title: "Partial upload",
          description: `${successful.length} succeeded, ${failed.length} failed. Automation Leads notified for successful uploads.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "All files failed to upload",
          variant: "destructive",
        });
      }

      // Emit a UI-only event so interested components (e.g. notification UI)
      // can react to newly uploaded files. This is frontend-only and does
      // not require any backend changes.
      try {
        const uploadedFileNames = successful
          .map((r) => r.data?.fileName || r.data?.FileName || selectedFiles[r.index]?.name)
          .filter(Boolean);
        (window as any).dispatchEvent(
          new CustomEvent("file-uploaded", {
            detail: {
              count: successful.length,
              files: uploadedFileNames,
            },
          })
        );
      } catch (e) {
        // non-fatal for UI-only behavior
        console.warn("file-uploaded event dispatch failed", e);
      }
    }, [
    selectedFiles,
    uploadFileType,
    uploadProcessId,
    uploadDescription,
    selectedTags,
    typeFilter,
    subject,
    onboardingProcesses,
    selectedProcessIdLocal,
  ]
  );

  const handleFileDelete = async (fileId: string | number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Login required", description: "Please log in." });
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch(deleteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ FileID: Number(fileId) }),
      });

      const data = await res.json();

      // ✅ Check success
      if (!res.ok || !data.Success) {
        toast({
          title: "Delete failed",
          description: data.Message || `HTTP ${res.status}`,
        });
        return;
      }

      // ✅ Remove deleted file from state immediately
      setFiles((prev) => {
        const updated = prev.filter((f) => Number(f.id) !== Number(fileId));

        // Update file count for the selected onboarding process
        if (selectedProcessIdLocal) {
          const isOnboarding = onboardingProcesses.some(
            (p) => (p.botId ? p.botId.toString() : p.id) === selectedProcessIdLocal
          );
          if (isOnboarding) {
            setFileCounts(prevCounts => ({
              ...prevCounts,
              [selectedProcessIdLocal]: updated.length
            }));
          }
        }

        return updated;
      });

      toast({
        title: "File deleted",
        description: data.Message || "The file has been removed.",
      });
    } catch (err) {
      console.error("Delete error:", err);
      toast({ title: "Delete failed", description: "Network/server error" });
    }
  };

  const handleDownload = async (file) => {
    const fileId = file.FileID || file.id;

    if (!fileId) {
      console.error("FileID missing:", file);
      toast({
        title: "Download Failed",
        description: "File ID is missing!",
        variant: "destructive",
      });
      return;
    }

    // Set loading state
    setDownloadingFileIds((prev) => new Set(prev).add(fileId));

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/download-file/${fileId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name || "download"}.${file.format || "bin"}`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "File download has started.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Error downloading file. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Clear loading state
      setDownloadingFileIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  // Simple drag and drop handlers
  const handleDragStart = (e: React.DragEvent, fileId: string | number) => {
    setDraggedFileId(fileId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedFileId === null) return;

    const draggedIndex = filteredFiles.findIndex((f) => f.id === draggedFileId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedFileId(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder files in the filtered list
    const newFilteredFiles = [...filteredFiles];
    const [draggedFile] = newFilteredFiles.splice(draggedIndex, 1);
    newFilteredFiles.splice(dropIndex, 0, draggedFile);

    // Update the main files array to match the new order
    setFiles((prev) => {
      // Create a map of file IDs to their objects
      const fileMap = new Map(prev.map((f) => [f.id, f]));
      // Return files in the new order
      return newFilteredFiles.map((f) => fileMap.get(f.id) || f);
    });

    setDraggedFileId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedFileId(null);
    setDragOverIndex(null);
  };

  const handleTrigger = async (file: FileUpload, e: React.MouseEvent) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Login required", description: "Please log in." });
      window.location.href = "/login";
      return;
    }

    if (file.isTriggered || file.triggerStatus === "Triggered") {
      toast({
        title: "Already triggered",
        description: "This file has already been triggered.",
      });
      return;
    }

    // Get botId from the selected process or file's processId
    const botId = selectedProcessIdLocal || file.processId;
    if (!botId) {
      toast({
        title: "Missing process",
        description: "Please select a process before triggering the file.",
      });
      return;
    }

    try {
      const triggerUrl = getTriggerUrl(botId, file.id);
      const response = await fetch(triggerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast({
          title: "Trigger failed",
          description: data.message || "Failed to trigger file",
        });
        return;
      }

      // Update the file in state
      const updatedFile = {
        ...file,
        isTriggered: true,
        triggerStatus: "Triggered",
        triggeredAt: new Date().toISOString(),
      };

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? updatedFile : f
        )
      );

      // Also update selectedFile if it's the same file (for dialog)
      if (selectedFile && selectedFile.id === file.id) {
        setSelectedFile(updatedFile);
      }

      toast({
        title: "File triggered",
        description: "The process has been triggered successfully.",
      });

    } catch (err) {
      console.error("Trigger error:", err);
      toast({
        title: "Trigger failed",
        description: "Network or server error",
      });
    }
  };

  const getStatusIcon = (status: FileUpload["status"]) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "processing":
        return <Loader className="w-4 h-4 text-primary animate-spin" />;
      case "uploading":
        return <Upload className="w-4 h-4 text-warning animate-pulse" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusColor = (status: FileUpload["status"]) => {
    switch (status) {
      case "ready":
        return "text-success";
      case "processing":
        return "text-primary";
      case "uploading":
        return "text-warning";
      case "error":
        return "text-destructive";
    }
  };

  // Helper function to get review status badge
  const getReviewStatusBadge = (reviewStatus: string | null | undefined) => {
    if (!reviewStatus) return null;

    const status = String(reviewStatus).trim().toLowerCase();

    // Handle various status formats from backend
    if (status === "review_pending" || status === "review pending" || status === "pending") {
      return (
        <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
          Pending Review
        </Badge>
      );
    } else if (status === "reviewed" || status === "approved" || status === "rejected") {
      // Backend sets Status to "Reviewed" when Decision is APPROVED or REJECTED
      return (
        <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
          Reviewed
        </Badge>
      );
    } else if (status === "reupload_required" || status === "reupload required" || status === "reupload") {
      return (
        <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/30">
          Rejected – Reupload Required
        </Badge>
      );
    }

    return null;
  };


  // Helper function to check if current user is RPA Engineer (RoleId === 3)
  const isRpaEngineer = () => {
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

    const isEngineer = allRoleIds.some(id => {
      const numId = Number(id);
      return numId === 3 || id === "3" || id === 3;
    });

    const directCheck =
      roleIdFromStorage === "3" ||
      Number(roleIdFromStorage) === 3 ||
      roleIdFromUser === 3 ||
      roleIdFromUser === "3" ||
      Number(roleIdFromUser) === 3;

    return isEngineer || directCheck;
  };

  // Helper function to check if current user is automation lead (RoleId === 14)
  const isAutomationLead = () => {
    // Check multiple possible locations for RoleId
    const roleIdFromUser = user?.RoleId || user?.roleId || user?.role?.RoleId || user?.role?.roleId;
    const roleIdFromStorage = localStorage.getItem("roleId");

    // Try to parse user from localStorage if user object is not available
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

    // Check all possible sources
    const allRoleIds = [roleIdFromUser, roleIdFromStorage, roleIdFromLocalStorage].filter(Boolean);

    // Check if any RoleId is 14 (Automation Lead)
    const isLead = allRoleIds.some(id => {
      const numId = Number(id);
      return numId === 14 || id === "14" || id === 14;
    });

    // Also check directly from localStorage as string/number
    const directCheck =
      roleIdFromStorage === "14" ||
      Number(roleIdFromStorage) === 14 ||
      roleIdFromUser === 14 ||
      roleIdFromUser === "14" ||
      Number(roleIdFromUser) === 14;

    const finalResult = isLead || directCheck;

    // Debug logging (log once when component renders)
    console.log("🔍 isAutomationLead Check:", {
      user,
      roleIdFromUser,
      roleIdFromStorage,
      roleIdFromLocalStorage,
      allRoleIds,
      directCheck,
      isLead,
      finalResult,
      localStorageRoleId: localStorage.getItem("roleId"),
      localStorageUser: localStorage.getItem("user")
    });

    return finalResult;
  };

  const humanizeFileType = (
    rawType: string | undefined,
    format: string | undefined
  ): string => {
    if (!rawType) return format ? format.toUpperCase() : "Unknown";
    const simple = ["document", "video", "flowchart", "image"];
    if (simple.includes(rawType))
      return rawType.charAt(0).toUpperCase() + rawType.slice(1);

    if (rawType.includes("/")) {
      const parts = rawType.split("/");
      const subtype = parts[1] || parts[0];
      const cleaned = subtype.replace(/[.+-]/g, " ");
      const words = cleaned
        .split(" ")
        .filter(Boolean)
        .slice(0, 4)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return words || (format ? format.toUpperCase() : rawType);
    }
    return rawType;
  };

  return (
    <div className="space-y-6">
      {/* Upload Modal (restored original UI/UX) */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Process Files</DialogTitle>
            <DialogDescription>
              Upload documents, videos, flowcharts, and other process-related
              files
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/20 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

              {selectedFiles.length === 0 ? (
                <>
                  <h4 className="font-medium mb-2">
                    Drop files here or click to browse
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports PDF, Word, Excel, PowerPoint, Images, and Videos
                    (Max 50MB)
                  </p>
                </>
              ) : (
                <div className="text-base text-muted-foreground mb-4">
                  {selectedFiles.map((f) => f.name).join(", ")}
                </div>
              )}

              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose Files
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,video/*"
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files);
                    setSelectedFiles(files);
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file-type">File Type</Label>
                <Select
                  value={uploadFileType}
                  onValueChange={setUploadFileType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="flowchart">Flowchart</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/*<div className="space-y-2">
                <Label className="inline-flex items-center">
                  Processes <span className="text-red-500 ml-1">*</span>
                </Label>

                <Select
                  value={uploadProcessId}
                  onValueChange={setUploadProcessId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Process" />
                  </SelectTrigger>
                  <SelectContent>
                    {processes.length > 0 ? (
                      processes.map((p) => (
                        <SelectItem
                          key={p.CompanyId}
                          value={p.CompanyId.toString()}
                        >
                          {p.Name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No processes available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>*/}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                placeholder="Brief description of the file contents and purpose..."
                className="min-h-20"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Files"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Header with Upload Button and Process Onboarding Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">File Management</h3>
          <p className="text-muted-foreground">
            Upload and manage process documentation
          </p>
        </div>
        <button
          className="ml-auto px-5 py-2 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
          onClick={() => {
            setIsOnboardingOpen(true);
            setOnboardingStep(0);
          }}
        >
          Process Onboarding
        </button>
      </div>

      {/* Process Onboarding Wizard Dialog */}
      <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
        <DialogContent className="max-w-4xl min-w-[720px] p-0 overflow-visible bg-gradient-to-br from-white via-blue-50 to-indigo-50 shadow-2xl rounded-3xl border-0">
          <div className="flex flex-col gap-0">
            {/* Stepper */}
            <div className="flex items-center justify-between px-14 pt-12 pb-4">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Process Onboarding
              </h2>
              <div className="flex items-center gap-2">
                {onboardingSteps.map((step, idx) => (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${onboardingStep === idx
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                        : "bg-white border-gray-300 text-gray-400"
                        } font-bold text-base`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-xs mt-1 ${onboardingStep === idx
                        ? "text-indigo-700 font-semibold"
                        : "text-gray-400"
                        }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full px-14">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${((onboardingStep + 1) / onboardingSteps.length) * 100
                      }%`,
                  }}
                />
              </div>
            </div>
            {/* Wizard Steps */}
            <div className="px-14 py-10 min-h-[340px] transition-all duration-300">
              {onboardingStep === 0 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                      Basic Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Process Name
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all shadow-lg"
                        value={onboardingData.processName}
                        onChange={(e) =>
                          setOnboardingData((d) => ({
                            ...d,
                            processName: e.target.value,
                          }))
                        }
                        placeholder="Enter process name"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Owned By
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all shadow-lg"
                        value={onboardingData.ownedBy}
                        onChange={(e) =>
                          setOnboardingData((d) => ({
                            ...d,
                            ownedBy: e.target.value,
                          }))
                        }
                        placeholder="Owner name or team"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all shadow-lg"
                        value={onboardingData.department}
                        onChange={(e) =>
                          setOnboardingData((d) => ({
                            ...d,
                            department: e.target.value,
                          }))
                        }
                        placeholder="Department name"
                      />
                    </div>
                  </div>
                </div>
              )}
              {onboardingStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                      Additional Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description{" "}
                        <span className="text-gray-400 text-xs">
                          (optional)
                        </span>
                      </label>
                      <textarea
                        className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all shadow-lg min-h-[90px]"
                        value={onboardingData.description}
                        onChange={(e) =>
                          setOnboardingData((d) => ({
                            ...d,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Describe the process"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags{" "}
                        <span className="text-gray-400 text-xs">
                          (comma separated)
                        </span>
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all shadow-lg"
                        value={onboardingData.tags}
                        onChange={(e) =>
                          setOnboardingData((d) => ({
                            ...d,
                            tags: e.target.value,
                          }))
                        }
                        placeholder="e.g. finance, hr, automation"
                      />
                    </div>
                  </div>
                </div>
              )}
              {onboardingStep === 2 && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-800 mb-4 tracking-wide">
                      Review & Submit
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl p-8 border border-indigo-200 shadow-lg">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-lg">
                      <div className="flex flex-col">
                        <dt className="font-semibold text-gray-700 mb-1">
                          Process Name
                        </dt>
                        <dd className="text-gray-900 pl-1">
                          {onboardingData.processName || (
                            <span className="italic text-gray-400">N/A</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="font-semibold text-gray-700 mb-1">
                          Owned By
                        </dt>
                        <dd className="text-gray-900 pl-1">
                          {onboardingData.ownedBy || (
                            <span className="italic text-gray-400">N/A</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="font-semibold text-gray-700 mb-1">
                          Department
                        </dt>
                        <dd className="text-gray-900 pl-1">
                          {onboardingData.department || (
                            <span className="italic text-gray-400">N/A</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="font-semibold text-gray-700 mb-1">
                          Tags
                        </dt>
                        <dd className="text-gray-700 pl-1">
                          {onboardingData.tags ? (
                            onboardingData.tags
                          ) : (
                            <span className="italic text-gray-400">N/A</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="font-semibold text-gray-700 mb-1">
                          Description
                        </dt>
                        <dd className="text-gray-700 pl-1">
                          {onboardingData.description ? (
                            onboardingData.description
                          ) : (
                            <span className="italic text-gray-400">N/A</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="text-sm text-gray-500 font-medium mt-2">
                    Please review the details above before submitting. You can
                    go back to edit if needed.
                  </div>
                </div>
              )}
            </div>
            {/* Wizard Navigation */}
            <div className="flex justify-between items-center px-14 pb-10 pt-4">
              <button
                className="px-7 py-3 rounded-xl bg-gray-100 text-gray-700 text-lg font-semibold hover:bg-gray-200 transition-all border border-gray-200 shadow-lg disabled:opacity-60"
                disabled={onboardingStep === 0}
                onClick={() => setOnboardingStep((s) => Math.max(0, s - 1))}
              >
                Back
              </button>
              {onboardingStep < onboardingSteps.length - 1 ? (
                <button
                  className="px-10 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-lg font-bold shadow-xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-60"
                  onClick={() => setOnboardingStep((s) => s + 1)}
                  disabled={
                    onboardingStep === 0 &&
                    (!onboardingData.processName ||
                      !onboardingData.ownedBy ||
                      !onboardingData.department)
                  }
                >
                  Next
                </button>
              ) : (
                <button
                  className="px-7 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isSubmittingOnboarding}
                  onClick={async () => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      toast({
                        title: "Authentication required",
                        description: "Please log in to submit onboarding.",
                        variant: "destructive",
                      });
                      return;
                    }

                    const payload = {
                      Name: onboardingData.processName,
                      OwnedBy: onboardingData.ownedBy,
                      Department: onboardingData.department,
                      Description: onboardingData.description,
                      Tag: onboardingData.tags,
                    };

                    try {
                      setIsSubmittingOnboarding(true);
                      await createProcessOnboarding(payload, token);

                      toast({
                        title: "Process Onboarding Submitted",
                        description: `Process "${onboardingData.processName}" has been submitted for onboarding!`,
                        variant: "default",
                      });

                      // Reset form data
                      setOnboardingData({
                        processName: "",
                        ownedBy: "",
                        department: "",
                        description: "",
                        tags: "",
                      });
                      setOnboardingStep(0);
                      setIsOnboardingOpen(false);

                      // Refresh the onboarding processes list
                      await fetchOnboarding();
                    } catch (error: any) {
                      toast({
                        title: "Submission failed",
                        description:
                          error.message ||
                          "An error occurred while submitting onboarding.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSubmittingOnboarding(false);
                    }
                  }}
                >
                  {isSubmittingOnboarding ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fixed Process Folders (user must select one before uploading) */}
      {/* Show full grid when no selection; when selected, hide other folders and show selected + back button */}
      {selectedProcessIdLocal ? (
        <div className="pt-4">
          <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-md border border-gray-200">
            <div className="flex items-center gap-4">
              <Button
                className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                size="sm"
                onClick={() => {
                  setSelectedProcessIdLocal(null);
                  setSelectedProcessNameLocal(null);
                  setUploadProcessId("");
                }}
              >
                ← Back
              </Button>
              <h4 className="text-lg font-semibold m-0">
                {selectedProcessNameLocal}
              </h4>
            </div>
            <Button
              className="bg-gradient-primary text-primary-foreground hover:shadow-glow"
              onClick={() => {
                setUploadProcessId(selectedProcessIdLocal);
                setIsUploadOpen(true);
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8 py-8 bg-white px-4 rounded-xl">
          {isLoadingOnboarding ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading processes...</p>
              </div>
            </div>
          ) : onboardingProcesses.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold text-lg mb-2">No processes found</h4>
                <p className="text-muted-foreground">
                  No process onboarding entries have been created yet.
                </p>
              </div>
            </div>
          ) : (
            onboardingProcesses.map((p: any, idx: number) => {
              // Process data from DB - SP returns Bot_Id AS botId
              const id = p.botId ? p.botId.toString() : p.id;
              const name = p.name || p.Name;

              // Pick a style from the static templates using index for styling only
              const styleSource = processTemplates[idx % processTemplates.length];
              const selected = selectedProcessIdLocal === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    // When clicking an onboarding folder, remember its Bot_id locally,
                    // but DO NOT overwrite uploadProcessId (companyId used for uploads).
                    setSelectedProcessIdLocal(id);   // holds onboarding Bot_id (or Oid for backward compatibility)
                    setSelectedProcessNameLocal(name);
                  }}
                  className={`w-full relative px-8 pt-4 pb-3 h-64 rounded-xl transition-all duration-300 border ${selected
                    ? "ring-2 ring-primary/30 shadow-lg border-primary scale-[1.02]"
                    : "border-border hover:shadow-lg hover:scale-[1.01] hover:border-primary/30"
                    } ${styleSource.bgClass}`}
                >
                  {/* <div
                  className={`absolute top-3 left-3 w-8 h-8 rounded-md flex items-center justify-center z-30 ${styleSource.iconBgClass}`}
                >
                  <Folder className="w-4 h-4" />
                </div> */}

                  {/* Badge moved to top-right - Modern Design */}
                  {(p.tag || p.Tag || p.tag === 0 || p.Tag === 0) && (
                    <div className="absolute top-3 right-3 z-30">
                      <div className="text-xs text-indigo-700 bg-gradient-to-br from-white/90 to-indigo-50/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-indigo-200/50 font-semibold shadow-md">
                        {p.tag || p.Tag}
                      </div>
                    </div>
                  )}

                  {/* File Count Badge - Bottom Right Corner - Modern Design */}
                  <div className="absolute bottom-3 right-3 z-30">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-white via-white to-gray-50/90 backdrop-blur-sm rounded-lg border border-gray-200/60 shadow-md hover:shadow-lg transition-all duration-200 group">
                      <div className="p-1 rounded-md bg-gradient-to-br from-indigo-500/10 to-blue-500/10 group-hover:from-indigo-500/20 group-hover:to-blue-500/20 transition-colors">
                        <File className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-indigo-700 tabular-nums">
                        {fileCounts[id] !== undefined ? fileCounts[id] : 0}
                      </span>
                    </div>
                  </div>

                  <div className={`flex-1 text-left flex flex-col h-full ${(p.Tag || p.Tag === 0) ? 'pt-2' : 'pt-0'}`}>
                    {/* Title */}
                    <div className="mb-2">
                      <div className={`font-semibold text-2xl ${styleSource.titleClass} line-clamp-1`}>
                        {name}
                      </div>
                    </div>

                    {/* Metadata Section - Consistent alignment */}
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-start gap-2 text-sm">
                        <span className="font-semibold text-gray-700 min-w-[90px]">Owned By:</span>
                        <span className="text-gray-600 flex-1">{p.ownedBy || p.OwnedBy || p.OwnedByName || "N/A"}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="font-semibold text-gray-700 min-w-[90px]">Department:</span>
                        <span className="text-gray-600 flex-1">{p.department || p.Department || "N/A"}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-sm text-gray-700 mb-2 line-clamp-2 flex-1">
                      {p.description || p.Description || "No description provided."}
                    </div>

                    {/* Footer Section */}
                    <div className="mt-auto space-y-3">
                      {/* Created info */}
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>Created by:</span>
                          <span className="font-medium text-gray-600">
                            {p.createdBy || p.CreatedBy || "-"}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            {(p.createdTime || p.Created_Time || p.CreatedAt) ? new Date(p.createdTime || p.Created_Time || p.CreatedAt).toLocaleString() : "-"}
                          </span>
                        </div>
                        {(p.updatedBy || p.UpdatedBy) && (
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span>Updated by:</span>
                            <span className="font-medium text-gray-600">
                              {p.updatedBy || p.UpdatedBy}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">
                              {(p.updatedTime || p.Updated_Time || p.UpdatedAt) ? new Date(p.updatedTime || p.Updated_Time || p.UpdatedAt).toLocaleString() : "-"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action text */}
                      <div className="text-center pt-2 border-t border-gray-200/50">
                        <div className="text-xs text-gray-600 font-medium">
                          Click to open card folder to view all files
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* (Quick-action tiles removed as requested) */}

      {/* Show file search/filters and file list only after a process tile is selected */}
      {selectedProcessIdLocal ? (
        <>
          {/* Filters and Search */}
          <Card className="bg-transparent shadow-none">
            <CardContent className="p-1">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-muted border-border"
                    />
                  </div>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40 bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      {fileTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === "all"
                            ? "All Types"
                            : type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Grid/List (flat files, no folders) */}
          {(() => {
            const params = new URLSearchParams(location.search);
            const onboardingIdFromUrl = params.get("onboardingId");
            const isWaitingForFolder = onboardingIdFromUrl && isLoadingOnboarding;
            return isWaitingForFolder || isLoading;
          })() ? (
            <Card className="bg-transparent shadow-none">
              <CardContent className="p-12 text-center">
                <Loader className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading files...</p>
              </CardContent>
            </Card>
          ) : selectedProcessIdLocal === "2" ? (
            <div className="animate-in fade-in duration-500">
              <AirlineDetailsTable botId={selectedProcessIdLocal} />
            </div>
          ) : filteredFiles.length === 0 ? (
            <Card className="bg-transparent shadow-none min-h-[50vh] flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center w-full">
                <File className="w-16 h-16 text-muted-foreground mb-4" />
                <h4 className="font-semibold text-lg mb-2">No files found</h4>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || typeFilter !== "all"
                    ? "Try adjusting your search filters."
                    : "No files have been uploaded yet. Start by uploading your first process file!"}
                </p>
                <Button
                  className="mt-2"
                  onClick={() => {
                    if (selectedProcessIdLocal) {
                      setUploadProcessId(selectedProcessIdLocal);
                      setIsUploadOpen(true);
                    } else {
                      toast({
                        title: "Select a folder first",
                        description:
                          "Please select a process folder before uploading files.",
                      });
                    }
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div
              className={`${viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
                } w-full overflow-hidden`}
            >
              {filteredFiles.map((file, index) => (
                // Reuse the existing Card rendering from selectedFolderFiles mapping
                <Card
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, file.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`bg-gradient-card hover:shadow-elevated transition-all duration-300 group overflow-hidden ${draggedFileId === file.id
                    ? "cursor-grabbing opacity-50"
                    : "cursor-grab"
                    } ${dragOverIndex === index && draggedFileId !== file.id
                      ? "border-primary border-2 scale-105 cursor-pointer"
                      : ""
                    }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <CardContent
                    className={`${viewMode === "grid" ? "p-6" : "p-4"
                      } overflow-hidden relative`}
                  >


                    {/* reuse inner content as-is */}
                    <div
                      className={`${viewMode === "grid"
                        ? "space-y-4"
                        : "flex items-center gap-4"
                        } overflow-hidden`}
                    >
                      {/* File Icon and Info - Better organized layout */}
                      <div
                        className={`${viewMode === "grid"
                          ? "space-y-3 w-full"
                          : "flex items-center gap-3 flex-1"
                          } overflow-hidden`}
                      >
                        {/* File Icon */}
                        {viewMode === "grid" ? (
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center flex-shrink-0">
                              {getFileIcon(file.format, "w-6 h-6")}
                            </div>
                            {/* Morgan Stanley Status Badge - Top Right Corner for Grid */}
                            {file.morganStanleyStatus && file.morganStanleyStatus !== null && file.morganStanleyStatus !== '' && (
                              <div className="absolute top-3 right-3 z-10">
                                <Badge variant="outline" className={`text-xs shadow-sm ${String(file.morganStanleyStatus).toLowerCase() === 'done'
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : String(file.morganStanleyStatus).toLowerCase() === 'received'
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}>
                                  {String(file.morganStanleyStatus).toLowerCase() === 'done'
                                    ? "Success"
                                    : String(file.morganStanleyStatus).toLowerCase() === 'received'
                                      ? "Queued"
                                      : String(file.morganStanleyStatus)}
                                </Badge>
                              </div>
                            )}
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <h4
                                          className={`font-semibold text-base group-hover:text-primary transition-colors break-words ${file.name.length > 50
                                            ? "line-clamp-2"
                                            : "truncate"
                                            }`}
                                          title={file.name}
                                        >
                                          {file.name}
                                        </h4>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs break-words">
                                          {file.name}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                {/* Status icon - only show if no Morgan Stanley status badge to avoid overlap */}
                                {!file.morganStanleyStatus && (
                                  <div className="flex-shrink-0 pt-0.5 ml-2">
                                    {getStatusIcon(file.status)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-center flex-shrink-0">
                              {getFileIcon(file.format, "w-5 h-5")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <h4
                                          className={`font-semibold group-hover:text-primary transition-colors break-words truncate`}
                                          title={file.name}
                                        >
                                          {file.name}
                                        </h4>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs break-words">
                                          {file.name}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {/* House Bill Badge - Next to file name */}
                                  {file.houseBill && file.houseBill !== null && file.houseBill !== '' && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 shadow-sm whitespace-nowrap flex-shrink-0">
                                      {String(file.houseBill)}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2 pt-0.5 ml-2">
                                  {getStatusIcon(file.status)}
                                  {file.morganStanleyStatus && file.morganStanleyStatus !== null && file.morganStanleyStatus !== '' && (
                                    <Badge variant="outline" className={`text-xs shadow-sm ${String(file.morganStanleyStatus).toLowerCase() === 'done'
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : String(file.morganStanleyStatus).toLowerCase() === 'received'
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                      }`}>
                                      {String(file.morganStanleyStatus).toLowerCase() === 'done'
                                        ? "Success"
                                        : String(file.morganStanleyStatus).toLowerCase() === 'received'
                                          ? "Queued"
                                          : String(file.morganStanleyStatus)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* File Details */}
                        <div
                          className={`${viewMode === "grid" ? "w-full" : "flex-1"
                            } overflow-hidden`}
                        >
                          {/* House Bill Badge - Next to file name */}
                          {viewMode === "grid" && file.houseBill && file.houseBill !== null && file.houseBill !== '' && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-green-700 whitespace-nowrap">
                                House Bill:
                              </span>
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 shadow-sm whitespace-nowrap flex-shrink-0">
                                {String(file.houseBill)}
                              </Badge>
                            </div>
                          )}

                          {viewMode === "grid" && file.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {file.description}
                            </p>
                          )}


                          {/* Metadata Row - Better organized with visual separators */}
                          <div
                            className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground ${viewMode === "list" ? "" : "mt-3 pt-3 border-t border-border/50"
                              }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                              <span className="font-medium text-foreground/80">{file.uploadedBy || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                              {file.uploadedAt ? (
                                <span className="text-foreground/70">
                                  {new Date(file.uploadedAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      timeZone: "UTC",
                                    }
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <File className="w-3.5 h-3.5 text-muted-foreground/70" />
                              <span className="font-medium text-foreground/80">{formatFileSize(file.size)}</span>
                            </div>
                            {file.version > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                v{file.version}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {viewMode === "grid" && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              <Tag className="w-2 h-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{file.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div
                        className={`flex items-center ${viewMode === "grid" ? "justify-between" : "gap-2"
                          }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUploading || downloadingFileIds.has(file.id)}
                            onClick={() => handleDownload(file)}
                          >
                            {downloadingFileIds.has(file.id) ? (
                              <>
                                <Loader className="w-3 h-3 mr-1 animate-spin" />
                                {viewMode === "list" ? "" : "Downloading..."}
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-1" />
                                {viewMode === "list" ? "" : "Download"}
                              </>
                            )}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-popover border-border"
                            >
                              <DropdownMenuItem
                                onClick={() => handleFileDelete(file.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                                Delete File
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setSelectedFile(file)}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2">
                          {file.isTriggered || file.triggerStatus === "Triggered" ? (
                            <Badge 
                              variant="outline" 
                              className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-md font-medium"
                            >
                              Triggered
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={isUploading}
                              onClick={(e) => handleTrigger(file, e)}
                            >
                              {viewMode === "list" ? "" : "Trigger"}
                            </Button>
                          )}
                        </div>

                        {/* <div className="flex items-center gap-2">
                          {file.isTriggered || file.triggerStatus === "Triggered" ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-md font-medium"
                            >
                              Triggered
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-gray-400 hover:bg-gray-400 text-white cursor-not-allowed"
                              disabled={true}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              {viewMode === "list" ? "" : "Trigger"}
                            </Button>
                          )}
                        </div> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}

      {/* File Details Dialog */}
      <Dialog
        open={!!selectedFile}
        onOpenChange={(open) => {
          if (!open) setSelectedFile(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>File Details</span>
              {selectedFile?.id && (
                <span className="text-muted-foreground text-sm font-normal">
                  ID: {selectedFile.id}
                </span>
              )}
            </DialogTitle>
            {selectedFile && (
              <div className="mt-2 mb-1 p-5 rounded-lg flex items-center gap-3 bg-green-100">
                <p className="text-base font-semibold text-foreground truncate flex-1" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedFile) {
                      handleDownload(selectedFile);
                    }
                  }}
                  disabled={isUploading || (selectedFile && downloadingFileIds.has(selectedFile.id))}
                >
                  {selectedFile && downloadingFileIds.has(selectedFile.id) ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            )}
            <DialogDescription className="flex flex-wrap gap-2 items-center">
              {selectedFile && (
                <>
                  <span className="text-xs uppercase tracking-wide">
                    {selectedFile.format}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs">
                    {formatFileSize(selectedFile.size)}
                  </span>
                  {selectedFile.version > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      v{selectedFile.version}
                    </Badge>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-300 p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p
                    className="font-medium truncate"
                    title={String(selectedFile.type)}
                  >
                    {humanizeFileType(
                      selectedFile.type as any,
                      selectedFile.format
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-300 p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Process</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="font-medium truncate"
                        title={String(selectedFile.processName)}
                      >
                        {selectedFile.processName || "—"}
                      </p>
                      {/* <p className="text-xs text-muted-foreground truncate">
                        ID: {selectedFile.processId || "—"}
                      </p> */}
                    </div>
                    {/* <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            String(selectedFile.processId || "")
                          );
                          toast({
                            title: "Copied",
                            description: "Process ID copied to clipboard",
                          });
                        } catch {
                          toast({
                            title: "Copy failed",
                            description: "Could not copy Process ID",
                          });
                        }
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button> */}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-300 p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">
                    Uploaded By
                  </p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedFile.uploadedBy}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-300 p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">
                    Uploaded At
                  </p>
                  <div className="font-medium flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5" />
                    <div className="min-w-0">
                      <div>
                        {selectedFile.uploadedAt
                          ? getTimeAgo(selectedFile.uploadedAt)
                          : "Recently"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {new Date(selectedFile.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedFile.description && selectedFile.description.trim() && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Description
                  </p>
                  <div className="rounded-lg border border p-4 bg-background/50">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedFile.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex items-center justify-end gap-2">
            {/* Trigger button or badge */}
            {selectedFile && (
              selectedFile.isTriggered || selectedFile.triggerStatus === "Triggered" ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50 px-4 py-2 rounded-md font-medium text-sm"
                >
                  Triggered
                </Badge>
              ) : (
                <Button
                  size="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedFile) {
                      handleTrigger(selectedFile, e);
                    }
                  }}
                  disabled={isUploading}
                >
                  Trigger
                </Button>

                // <Button
                //   size="default"
                //   className="bg-blue-600 hover:bg-blue-700 text-white"
                //   onClick={(e) => {
                //     e.stopPropagation();
                //     if (selectedFile) {
                //       handleTrigger(selectedFile, e);
                //     }
                //   }}
                //   disabled={true}
                // >
                //   Trigger
                // </Button>
              )
            )}

            <Button variant="outline" onClick={() => setSelectedFile(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
