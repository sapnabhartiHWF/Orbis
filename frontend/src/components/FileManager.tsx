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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
const url = "https://orbis-backend-usfo.onrender.com/api/processes";
const uploadUrl = "https://orbis-backend-usfo.onrender.com/api/file-management";
const dataUrl = "https://orbis-backend-usfo.onrender.com/api/uploaded-details";
const deleteUrl ="https://orbis-backend-usfo.onrender.com/api/delete-uploaded-file";

export function FileManager({ processId }: FileManagerProps) {
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

  // Fetch uploaded files
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);

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
          const normalizedFiles = data.files.map((f: any) => ({
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
          }));
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
  }, []);

  const filteredFiles = files.filter((file) => {
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

        setFiles((prev) => [
          ...prev,
          {
            id: newFileId,
            name: file.name,
            type: uploadFileType as
              | "document"
              | "video"
              | "flowchart"
              | "image",
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
          },
        ]);

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
  }, [
    selectedFiles,
    uploadFileType,
    uploadProcessId,
    uploadDescription,
    selectedTags,
    processes,
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
        `https://orbis-backend-usfo.onrender.com/api/download-file/${fileId}`,
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">File Management</h3>
          <p className="text-muted-foreground">
            Upload and manage process documentation
          </p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow">
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Process Files</DialogTitle>
              <DialogDescription>
                Upload documents, videos, flowcharts, and other process-related
                files
              </DialogDescription>
            </DialogHeader>

            {/* ✅ Upload Area */}
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

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
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
                </div>
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
                <Label>Tags</Label>
                <div className="flex gap-4">
                  {staticTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={tag}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={(checked) => {
                          setSelectedTags((prev) =>
                            checked
                              ? [...prev, tag]
                              : prev.filter((t) => t !== tag)
                          );
                        }}
                      />
                      <label
                        htmlFor={tag}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
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
      </div>

      {/* Filters and Search */}
      <Card className="bg-card border-border shadow-card">
        <CardContent className="p-6">
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

      {/* File Grid/List */}
      {isLoading ? (
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-12 text-center">
            <Loader className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading files...</p>
          </CardContent>
        </Card>
      ) : filteredFiles.length === 0 ? (
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-12 text-center">
            <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No files found</h4>
            <p className="text-muted-foreground">
              {searchTerm || typeFilter !== "all"
                ? "Try adjusting your search filters"
                : "Upload your first process file to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className="bg-gradient-card border-border shadow-card hover:shadow-elevated transition-all duration-300 group cursor-pointer"
              onClick={() => setSelectedFile(file)}
            >
              <CardContent className={viewMode === "grid" ? "p-6" : "p-4"}>
                <div
                  className={
                    viewMode === "grid"
                      ? "space-y-4"
                      : "flex items-center gap-4"
                  }
                >
                  {/* File Icon and Info */}
                  <div
                    className={
                      viewMode === "grid"
                        ? "space-y-3"
                        : "flex items-center gap-3 flex-1"
                    }
                  >
                    <div
                      className={`${
                        viewMode === "grid" ? "w-12 h-12" : "w-8 h-8"
                      } rounded-lg bg-primary/10 flex items-center justify-center text-2xl`}
                    >
                      {getFileTypeIcon(file.format)}
                    </div>

                    <div
                      className={viewMode === "grid" ? "" : "flex-1 min-w-0"}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`font-medium ${
                            viewMode === "list" ? "truncate" : ""
                          } group-hover:text-primary transition-colors`}
                        >
                          {file.name}
                        </h4>
                        {getStatusIcon(file.status)}
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
                          {getTimeAgo(file.uploadedAt)}
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
                        // disabled={file.status !== "ready"}
                        disabled={isUploading}
                        onClick={() => setSelectedFile(file)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {viewMode === "list" ? "" : "View"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        // disabled={file.status !== "ready"}
                        disabled={isUploading}
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        {viewMode === "list" ? "" : "Download"}
                      </Button>
                    </div>

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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* File Details Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="inline-flex w-9 h-9 rounded-md bg-primary/10 items-center justify-center text-xl">
                {selectedFile && getFileTypeIcon(selectedFile.format)}
              </span>
              <span className="truncate" title={selectedFile?.name}>
                {selectedFile?.name}
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
                  <span className="text-xs">{formatFileSize(selectedFile.size)}</span>
                  {selectedFile.version > 1 && (
                    <Badge variant="secondary" className="text-xs">v{selectedFile.version}</Badge>
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
                  <p className="font-medium truncate" title={String(selectedFile.type)}>
                    {humanizeFileType(selectedFile.type as any, selectedFile.format)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-300 p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Process</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate" title={String(selectedFile.processName)}>
                        {selectedFile.processName || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">ID: {selectedFile.processId || "—"}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(String(selectedFile.processId || ""));
                          toast({ title: "Copied", description: "Process ID copied to clipboard" });
                        } catch {
                          toast({ title: "Copy failed", description: "Could not copy Process ID" });
                        }
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-300 p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Uploaded By</p>
                  <p className="font-medium flex items-center gap-2"><User className="w-4 h-4" />{selectedFile.uploadedBy}</p>
                </div>
                <div className="rounded-lg border border-gray-300 p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Uploaded At</p>
                  <div className="font-medium flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5" />
                    <div className="min-w-0">
                      <div>{getTimeAgo(selectedFile.uploadedAt)}</div>
                      <div className="text-xs text-muted-foreground truncate">{new Date(selectedFile.uploadedAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Description</p>
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
                      <Badge key={tag} variant="secondary" className="inline-flex items-center">
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
