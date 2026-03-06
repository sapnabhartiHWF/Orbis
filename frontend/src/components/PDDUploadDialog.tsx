import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader, Upload, Download, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PDDInfo {
  PDDId: number;
  FileID: number;
  FileName: string;
  FilePath: string;
  FileSize: number;
  FormattedFileSize?: string;
  FileFormat: string;
  MimeType: string;
  CreatedDate: string;
  UpdatedDate: string;
  Status: string;
  UploadedBy: string;
}

interface PDDUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: number | string;
  fileName: string;
  userRoleId?: number;
  canUpload?: boolean;
  onPDDUploaded?: () => void;
}

export function PDDUploadDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
  userRoleId,
  canUpload = false,
  onPDDUploaded,
}: PDDUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pddInfo, setPddInfo] = useState<PDDInfo | null>(null);
  const isRpaEngineer = userRoleId === 3;
  const canUploadPDD = isRpaEngineer && canUpload;

  useEffect(() => {
    if (open && fileId) {
      loadPDDInfo();
    }
  }, [open, fileId]);

  const loadPDDInfo = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/pdd/${fileId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setPddInfo(data.data);
        } else {
          setPddInfo(null);
        }
      } else if (response.status !== 404) {
        const errorData = await response.json();
        toast({
          title: "Error Loading PDD",
          description: errorData.message || "Failed to load PDD information.",
          variant: "destructive",
        });
      } else {
        setPddInfo(null);
      }
    } catch (error: any) {
      console.error("Error loading PDD info:", error);
      setPddInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const extension = file.name.split(".").pop()?.toLowerCase();
      const allowedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];

      if (!extension || !allowedExtensions.includes(extension)) {
        toast({
          title: "Invalid File Type",
          description: `Allowed file types: ${allowedExtensions.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 50MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileId", fileId.toString());

      const response = await fetch(
        "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/pdd/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "PDD Uploaded Successfully",
          description: data.message || "PDD file has been uploaded.",
        });
        setSelectedFile(null);
        loadPDDInfo();
        if (onPDDUploaded) {
          onPDDUploaded();
        }
      } else {
        toast({
          title: "Upload Failed",
          description: data.message || "Failed to upload PDD file.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error uploading PDD:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred while uploading the file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/pdd/${fileId}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = pddInfo?.FileName || "PDD_Document";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download Started",
          description: "PDD file download has started.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Download Failed",
          description: errorData.message || "Failed to download PDD file.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error downloading PDD:", error);
      toast({
        title: "Download Failed",
        description: error.message || "An error occurred while downloading the file.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Process Design Document (PDD)
          </DialogTitle>
          <DialogDescription>
            PDD for: <strong>{fileName}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {pddInfo ? (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{pddInfo.FileName}</span>
                      <Badge variant="secondary">{pddInfo.Status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Size:</strong> {pddInfo.FormattedFileSize || formatFileSize(pddInfo.FileSize)}
                      </p>
                      <p>
                        <strong>Format:</strong> {pddInfo.FileFormat.toUpperCase()}
                      </p>
                      {pddInfo.UploadedBy && (
                        <p>
                          <strong>Uploaded by:</strong> {pddInfo.UploadedBy}
                        </p>
                      )}
                      {pddInfo.CreatedDate && (
                        <p>
                          <strong>Uploaded on:</strong>{" "}
                          {new Date(pddInfo.CreatedDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="ml-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-muted/30 text-center text-muted-foreground">
                No PDD document uploaded yet.
              </div>
            )}

            {canUploadPDD && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label htmlFor="pdd-file" className="text-base font-semibold">
                    {pddInfo ? "Replace PDD Document" : "Upload PDD Document"}
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV (Max 50MB)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      id="pdd-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                      onChange={handleFileSelect}
                      className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      disabled={isUploading}
                    />
                    {selectedFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Close
          </Button>
          {canUploadPDD && selectedFile && (
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {pddInfo ? "Replace" : "Upload"} PDD
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
