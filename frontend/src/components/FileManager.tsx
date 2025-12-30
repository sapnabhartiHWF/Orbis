import { useState, useEffect, useCallback, useRef } from "react";
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

interface FileManagerProps {
  processId?: string;
}

const fileTypes = ["all", "document", "video", "flowchart", "image"];
const staticTags = ["demo", "current-state", "training"];
const url = "http://127.0.0.1:8000/api/processes";
const uploadUrl =
  "http://127.0.0.1:8000/api/file-management";
const dataUrl =
  "http://127.0.0.1:8000/api/uploaded-details";
const folderStructureUrl =
  "http://127.0.0.1:8000/api/files-folder-structure";
const deleteUrl =
  "http://127.0.0.1:8000/api/delete-uploaded-file";
const triggerUrl =
  "http://127.0.0.1:8000/api/trigger-file";
const insertProcessUrl =
  "http://127.0.0.1:8000/api/insert_process";

interface FolderStructure {
  processName: string;
  processId: string | number | null;
  files: FileUpload[];
}

export function FileManager({ processId }: FileManagerProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [folderStructure, setFolderStructure] = useState<FolderStructure[]>([]);
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
  const [selectedFolder, setSelectedFolder] = useState<FolderStructure | null>(
    null
  );
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
  const [selectedProcessIdLocal, setSelectedProcessIdLocal] = useState<string | null>(null);
  const [selectedProcessNameLocal, setSelectedProcessNameLocal] = useState<string | null>(null);

  // Drag and drop state
  const [draggedFileId, setDraggedFileId] = useState<string | number | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // Normalize file data helper
  const normalizeFile = (f: any): FileUpload => ({
    id: f.id || Number(f.FileID),
    name: f.name || f.FileName,
    type: f.type || f.FileType,
    format: f.format || f.FileFormat,
    size: f.size || f.FileSize,
    uploadedBy: f.uploadedBy || f.UploadedByName,
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
    status: f.status || "ready",
    isTriggered:
      f.isTriggered ||
      f.IsTriggered ||
      f.triggerStatus === "Triggered" ||
      false,
    triggerStatus:
      f.triggerStatus ||
      (f.isTriggered || f.IsTriggered ? "Triggered" : "Not Triggered"),
  });

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);

      try {
        const token = localStorage.getItem("token");

        const folderRes = await fetch(`${folderStructureUrl}?fileType=${typeFilter}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (folderRes.ok) {
          const folderData = await folderRes.json();
          const fileList = Array.isArray(folderData.files)
            ? folderData.files
            : Array.isArray(folderData.folderStructure)
            ? folderData.folderStructure.flatMap((g: any) => g.files || [])
            : [];

          if (fileList.length > 0) {
            const normalizedFiles = fileList.map((f: any) => normalizeFile(f));
            setFiles(normalizedFiles);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to regular endpoint
        const res = await fetch(dataUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch files");

        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          const normalizedFiles = data.files.map((f: any) => normalizeFile(f));
          setFiles(normalizedFiles);
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
  }, [typeFilter]);

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesType = typeFilter === "all" || file.type === typeFilter;
    // If the user selected a process tile locally, prefer that filter
    const matchesProcess = selectedProcessIdLocal
      ? // allow matching by processId or processName if available
        (file.processId?.toString() === selectedProcessIdLocal ||
          (selectedProcessNameLocal &&
            file.processName === selectedProcessNameLocal))
      : !processId || file.processId?.toString() === processId;
    return matchesSearch && matchesType && matchesProcess;
  });

  // Filter folder structure - ensure files belong to the folder's process
  const filteredFolderStructure = folderStructure
    .map((folder) => {
      // Filter files that belong to this specific process
      const processFiles = folder.files.filter((file) => {
        // Ensure file belongs to this folder's process
        const fileMatchesProcess =
          (folder.processId &&
            file.processId?.toString() === folder.processId?.toString()) ||
          (!folder.processId && !file.processId) ||
          folder.processName === file.processName;

        if (!fileMatchesProcess) return false;

        // Apply search and type filters
        const matchesSearch =
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          );
        const matchesType = typeFilter === "all" || file.type === typeFilter;
        const matchesProcess =
          !processId || file.processId?.toString() === processId;
        return matchesSearch && matchesType && matchesProcess;
      });

      return {
        ...folder,
        files: processFiles,
      };
    })
    .filter((folder) => folder.files.length > 0);

  const openFolder = (folder: FolderStructure) => {
    setSelectedFolder(folder);
  };

  const closeFolder = () => {
    setSelectedFolder(null);
  };

  // Get files for selected folder
  const selectedFolderFiles = selectedFolder
    ? selectedFolder.files.filter((file) => {
        const matchesSearch =
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          );
        const matchesType = typeFilter === "all" || file.type === typeFilter;
        return matchesSearch && matchesType;
      })
    : [];

  // Helper function to refresh folder structure
  const refreshFolderStructure = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const folderRes = await fetch(
        `${folderStructureUrl}?fileType=${typeFilter}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (folderRes.ok) {
        const folderData = await folderRes.json();
        if (folderData.success && folderData.folderStructure) {
          // ...existing code...
          const normalizedFolders = folderData.folderStructure
            .map((folder: any) => {
              const processName = folder.processName || "Unassigned";
              const processId = folder.processId;

              // Filter files to ensure they belong to this process
              const processFiles = folder.files
                .map((f: any) => normalizeFile(f))
                .filter((file: FileUpload) => {
                  // Ensure file belongs to this folder's process
                  return (
                    (processId &&
                      file.processId?.toString() === processId?.toString()) ||
                    (!processId && !file.processId) ||
                    processName === file.processName
                  );
                });

              return {
                processName,
                processId,
                files: processFiles,
              };
            })
            .filter((folder: FolderStructure) => folder.files.length > 0);

          setFolderStructure(normalizedFolders);
          // ...existing code...
          const allFiles = normalizedFolders.flatMap(
            (folder: FolderStructure) => folder.files
          );
          setFiles(allFiles);
        }
      }
    } catch (err) {
      console.error("Error refreshing folder structure:", err);
    }
  };

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

  const handleFileUpload = useCallback(async () => {
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

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("ProcessID", uploadProcessId);
        formData.append("FileType", uploadFileType);
        formData.append("Description", uploadDescription || "");
        formData.append("UploadedBy", userId);
        formData.append("Subject", subject || "");

        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          toast({
            title: "Upload failed",
            description: data.message || "Unknown error",
          });
          continue;
        }

        const selectedProcess = processes.find(
          (p) => p.CompanyId.toString() === uploadProcessId
        );

        const newFileId = data.NewFileID;

        const newFile: FileUpload = {
          id: newFileId,
          name: file.name,
          type: uploadFileType as "document" | "video" | "flowchart" | "image",
          format: file.name.split(".").pop()?.toLowerCase() || "unknown",
          size: file.size,
          uploadedBy: data.UploadedByName || "Unknown User",
          uploadedAt: new Date().toISOString(),
          version: 1,
          processId: uploadProcessId,
          processName: selectedProcess?.Name || "",
          description: uploadDescription,
          tags: selectedTags,
          status: "ready",
        };

        // Update files state
        setFiles((prev) => [...prev, newFile]);

        // Update folder structure immediately so file appears right away
        setFolderStructure((prev) => {
          const processName = selectedProcess?.Name || "Unassigned";
          const processIdStr = uploadProcessId?.toString();

          // Find existing folder for this process
          const existingFolderIndex = prev.findIndex(
            (folder) =>
              folder.processId?.toString() === processIdStr ||
              (folder.processName === processName &&
                !folder.processId &&
                !processIdStr)
          );

          if (existingFolderIndex >= 0) {
            // Add file to existing folder
            const updated = [...prev];
            updated[existingFolderIndex] = {
              ...updated[existingFolderIndex],
              files: [...updated[existingFolderIndex].files, newFile],
            };
            return updated;
          } else {
            // Create new folder for this process
            return [
              ...prev,
              {
                processName,
                processId: uploadProcessId || null,
                files: [newFile],
              },
            ];
          }
        });

        toast({
          title: "Upload successful",
          description: `File ID: ${data.NewFileID}`,
        });

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      } catch (err) {
        console.error("Upload error:", err);
        toast({
          title: "Upload failed",
          description: "Network or server error",
        });
      }
    }

    setIsUploading(false);
    setSelectedFiles([]);
    setUploadFileType("");
    setUploadProcessId("");
    setUploadDescription("");
    setSelectedTags([]);
    setIsAddingNewProcess(false);
    setNewProcessName("");

    // Refresh folder structure after upload
    await refreshFolderStructure();
  }, [
    selectedFiles,
    uploadFileType,
    uploadProcessId,
    uploadDescription,
    selectedTags,
    processes,
    typeFilter,
    subject,
  ]);

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
      setFiles((prev) => prev.filter((f) => Number(f.id) !== Number(fileId)));

      // Update folder structure
      setFolderStructure((prev) =>
        prev
          .map((folder) => ({
            ...folder,
            files: folder.files.filter((f) => Number(f.id) !== Number(fileId)),
          }))
          .filter((folder) => folder.files.length > 0)
      );

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
    try {
      const token = localStorage.getItem("token"); // or however you store it

      if (!file.FileID && !file.id) {
        console.error("FileID missing:", file);
        alert("File ID is missing!");
        return;
      }

      // Use FileID or id (depending on your backend response)
      const fileId = file.FileID || file.id;

      const response = await fetch(
        `http://127.0.0.1:8000/api/download-file/${fileId}`,
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
    } catch (error) {
      console.error("Download error:", error);
      alert("Error downloading file. Please try again.");
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

    try {
      const response = await fetch(`${triggerUrl}/${file.id}`, {
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
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                isTriggered: true,
                triggerStatus: "Triggered",
                triggeredAt: new Date().toISOString(),
              }
            : f
        )
      );

      toast({
        title: "File triggered",
        description: "The process has been triggered successfully.",
      });

      // Refresh folder structure
      await refreshFolderStructure();
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
      {/* Header with Upload Button */}
      <div className="flex items-center">
        <div>
          <h3 className="text-2xl font-semibold">File Management</h3>
          <p className="text-muted-foreground">
            Upload and manage process documentation
          </p>
        </div>
      </div>

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
              <h4 className="text-lg font-semibold m-0">{selectedProcessNameLocal}</h4>
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
          {processTemplates.map((p) => {
            const selected = selectedProcessIdLocal === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedProcessIdLocal(p.id);
                  setSelectedProcessNameLocal(p.name);
                  setUploadProcessId(p.id);
                }}
                className={`w-full flex items-center gap-6 p-10 h-64 rounded-lg transition-shadow border ${
                  selected
                    ? "ring-2 ring-primary/30 shadow-md border-primary"
                    : "border-border hover:shadow-sm"
                } ${p.bgClass}`}
              >
                <div className={`w-20 h-20 rounded-md flex items-center justify-center shrink-0 ${p.iconBgClass}`}>
                  <Folder className="w-10 h-10" />
                </div>
                <div className="text-left">
                  <div className={`font-semibold text-2xl ${p.titleClass}`}>{p.name}</div>
                  <div className="text-sm text-muted-foreground">Click to select</div>
                </div>
              </button>
            );
          })}
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
          {isLoading ? (
            <Card className="bg-transparent shadow-none">
              <CardContent className="p-12 text-center">
                <Loader className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading files...</p>
              </CardContent>
            </Card>
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
              className={`${
                viewMode === "grid"
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
                  className={`bg-gradient-card hover:shadow-elevated transition-all duration-300 group overflow-hidden ${
                    draggedFileId === file.id
                      ? "cursor-grabbing opacity-50"
                      : "cursor-grab"
                  } ${
                    dragOverIndex === index && draggedFileId !== file.id
                      ? "border-primary border-2 scale-105 cursor-pointer"
                      : ""
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <CardContent className={`${viewMode === "grid" ? "p-6" : "p-4"} overflow-hidden`}>
                    {/* reuse inner content as-is */}
                    <div
                      className={`${
                        viewMode === "grid"
                          ? "space-y-4"
                          : "flex items-center gap-4"
                      } overflow-hidden`}
                    >
                      {/* File Icon and Info */}
                      <div
                        className={`${
                          viewMode === "grid"
                            ? "space-y-3 w-full"
                            : "flex items-center gap-3 flex-1"
                        } overflow-hidden`}
                      >
                        {viewMode === "grid" ? (
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0"
                            >
                              {getFileTypeIcon(file.format)}
                            </div>
                            <Button
                              size="sm"
                              className={`flex-shrink-0 ${
                                file.isTriggered || file.triggerStatus === "Triggered"
                                  ? "bg-success/20 text-success border-success/30 hover:bg-success/30"
                                  : "bg-gradient-primary text-primary-foreground hover:shadow-glow"
                              }`}
                              onClick={(e) => handleTrigger(file, e)}
                              disabled={isUploading || file.isTriggered || file.triggerStatus === "Triggered"}
                            >
                              {file.isTriggered || file.triggerStatus === "Triggered" ? "Triggered" : "Trigger"}
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0"
                          >
                            {getFileTypeIcon(file.format)}
                          </div>
                        )}

                        <div
                          className={`${viewMode === "grid" ? "w-full" : "flex-1"} overflow-hidden`}
                        >
                          <div className="flex items-start gap-2 mb-1 w-full overflow-hidden">
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <h4
                                      className={`font-medium group-hover:text-primary transition-colors w-full break-words ${
                                        file.name.length > 50 
                                          ? "line-clamp-2" 
                                          : "truncate"
                                      }`}
                                      title={file.name}
                                    >
                                      {file.name}
                                    </h4>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs break-words">{file.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="flex-shrink-0 pt-0.5">
                              {getStatusIcon(file.status)}
                            </div>
                          </div>

                          {viewMode === "grid" && file.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {file.description}
                            </p>
                          )}

                          <div
                            className={`flex items-center gap-4 text-xs text-muted-foreground ${
                              viewMode === "list" ? "" : "mb-3"
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {file.uploadedBy}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {file.uploadedAt ? (
                                <span className="text-xs">
                                  {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    timeZone: 'UTC'
                                  })}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                            <span>{formatFileSize(file.size)}</span>
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
                        className={`flex items-center ${
                          viewMode === "grid" ? "justify-between" : "gap-2"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUploading}
                            onClick={() => setSelectedFile(file)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {viewMode === "list" ? "" : "View"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUploading}
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {viewMode === "list" ? "" : "Download"}
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          {viewMode === "list" && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="default"
                                    className={
                                      file.isTriggered || file.triggerStatus === "Triggered"
                                        ? "bg-success/20 text-success border-success/30 hover:bg-success/30"
                                        : "bg-gradient-primary text-primary-foreground hover:shadow-glow"
                                    }
                                    onClick={(e) => handleTrigger(file, e)}
                                    disabled={isUploading || file.isTriggered || file.triggerStatus === "Triggered"}
                                  >
                                    {file.isTriggered || file.triggerStatus === "Triggered" ? (
                                      <CheckCircle className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{file.isTriggered || file.triggerStatus === "Triggered" ? "Already Triggered" : "Trigger Process"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

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
                              <DropdownMenuItem onClick={() => setSelectedFile(file)}>
                                <FileText className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
            <DialogTitle>
              File Details
              <span className="text-muted-foreground text-sm">
                {/* File ID display */}
                {selectedFile?.id && (
                  <span className="ml-2">ID: {selectedFile.id}</span>
                )}
              </span>
            </DialogTitle>
            <DialogDescription className="flex flex-wrap gap-2 items-center">
              {selectedFile && (
                <>
                  <span className="inline-flex items-center gap-2 text-xs">
                    {getStatusIcon(selectedFile.status)}
                    <span className={getStatusColor(selectedFile.status)}>
                      {selectedFile.status.charAt(0).toUpperCase() +
                        selectedFile.status.slice(1)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">•</span>
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
                      <p className="text-xs text-muted-foreground truncate">
                        ID: {selectedFile.processId || "—"}
                      </p>
                    </div>
                    <Button
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
                    </Button>
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

              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Description
                </p>
                <div className="rounded-lg border border p-4 bg-background/50">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {selectedFile.description || "No description provided"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFile.tags.length > 0 ? (
                    selectedFile.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="inline-flex items-center"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFile(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
