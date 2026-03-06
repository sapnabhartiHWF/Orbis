import { useState, useEffect } from "react";
import {
  CheckCircle,
  FileText,
  Package,
  User,
  Building2,
  Download,
  Loader,
  Video,
  Image,
  GitBranch,
  File,
  Plane,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { formatFileSize } from "@/utils/collaborationUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CompletedFile {
  FileID: number;
  FileName: string;
  FileFormat: string;
  FileSize: number;
  FileType: string;
  Description?: string;
  ProcessID?: number;
  OnboardingId?: number;
  ProcessName?: string;
  HouseBill?: string;
  CreatedByName?: string;
}

interface CompletedProcess {
  ProcessId: number;
  ProcessName: string;
  CompanyName?: string;
  Department?: string;
  CreatedDate: string;
  UpdatedDate: string;
  CreatedBy?: string;
  TotalStages: number;
  CompletedStages: number;
}

interface AirlineDetail {
  "Flight Number": string;
  "Flight Status": string;
  "Airline Status": string;
  BotId?: number | string;
}

const demoCompletedProcesses: CompletedProcess[] = [
  {
    ProcessId: 1,
    ProcessName: "Invoice Processing Automation",
    CompanyName: "Fedex SA",
    Department: "Finance",
    CreatedDate: "2025-01-10T09:00:00Z",
    UpdatedDate: "2025-01-16T14:20:00Z",
    CreatedBy: "Sapna Bharti",
    TotalStages: 5,
    CompletedStages: 5,
  },
  {
    ProcessId: 2,
    ProcessName: "Account Payable Automation",
    CompanyName: "Santova Logistics BV",
    Department: "Accounting",
    CreatedDate: "2025-01-08T10:30:00Z",
    UpdatedDate: "2025-01-15T16:45:00Z",
    CreatedBy: "John Doe",
    TotalStages: 6,
    CompletedStages: 6,
  },
  {
    ProcessId: 3,
    ProcessName: "Document Processing Workflow",
    CompanyName: "Santova Commercial UK",
    Department: "Operations",
    CreatedDate: "2025-01-05T11:15:00Z",
    UpdatedDate: "2025-01-14T13:30:00Z",
    CreatedBy: "Jane Smith",
    TotalStages: 4,
    CompletedStages: 4,
  },
  {
    ProcessId: 4,
    ProcessName: "Invoice Validation System",
    CompanyName: "Santova Logistics GmbH",
    Department: "Finance",
    CreatedDate: "2025-01-03T08:45:00Z",
    UpdatedDate: "2025-01-13T15:10:00Z",
    CreatedBy: "Mike Johnson",
    TotalStages: 5,
    CompletedStages: 5,
  },
];

export default function Success() {
  const [completedFiles, setCompletedFiles] = useState<CompletedFile[]>([]);
  const [completedProcesses, setCompletedProcesses] = useState<CompletedProcess[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);
  const [activeTab, setActiveTab] = useState("files");
  const [bots, setBots] = useState<any[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>("1"); // Default to bot 1
  const [isLoadingBots, setIsLoadingBots] = useState(false);
  const [completedFlights, setCompletedFlights] = useState<AirlineDetail[]>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);

  useEffect(() => {
    const fetchCompletedFiles = async () => {
      // BotId 2 (BWI) uses airline-details API, not file-management
      if (String(selectedBotId) === "2") {
        setCompletedFiles([]);
        return;
      }

      try {
        setIsLoadingFiles(true);

        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(
          `https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/process/${selectedBotId}/file-management?status=Done`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch files");
        }

        setCompletedFiles(result.files || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load completed files",
          variant: "destructive",
        });
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchCompletedFiles();
  }, [selectedBotId]);

  useEffect(() => {
    const fetchCompletedFlights = async () => {
      if (String(selectedBotId) !== "2") {
        setCompletedFlights([]);
        return;
      }

      try {
        setIsLoadingFlights(true);

        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(
          `https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/operations/airline-details?bot_id=2`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!result?.success || !Array.isArray(result?.data)) {
          throw new Error(result?.message || "Failed to fetch flight details");
        }

        // Success dashboard: show only completed/done flights
        const done = result.data.filter((row: any) => {
          const status = String(row?.["Flight Status"] ?? "")
            .trim()
            .toLowerCase();
          return status === "done" || status === "success" || status === "completed";
        });

        setCompletedFlights(done);
      } catch (error: any) {
        console.error("Error fetching flight details:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load flight details",
          variant: "destructive",
        });
        setCompletedFlights([]);
      } finally {
        setIsLoadingFlights(false);
      }
    };

    fetchCompletedFlights();
  }, [selectedBotId]);

  const getFlightStatusBadge = (status: string) => {
    const s = String(status || "").trim().toLowerCase();
    if (s === "done" || s === "success" || s === "completed") {
      return (
        <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/30">
          {status || "Done"}
        </Badge>
      );
    }
    if (s === "exception" || s === "failed" || s === "error") {
      return (
        <Badge
          variant="destructive"
          className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30"
        >
          {status}
        </Badge>
      );
    }
    return <Badge variant="secondary">{status || "—"}</Badge>;
  };



  useEffect(() => {
    const fetchBots = async () => {
      try {
        setIsLoadingBots(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/bots", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        // Add debug logging
        console.log("🤖 Bots API Response:", result);
        console.log("🤖 Bots array:", result.data);

        if (result.success && Array.isArray(result.data)) {
          setBots(result.data);
          
          // Set default bot if available
          if (result.data.length > 0 && !selectedBotId) {
            const firstBotId = result.data[0].Bot_Id || result.data[0].bot_id || result.data[0].BotId || result.data[0].id || result.data[0].ID;
            setSelectedBotId(String(firstBotId));
          }
        } else if (Array.isArray(result)) {
          // Sometimes API returns array directly
          setBots(result);
          
          // Set default bot if available
          if (result.length > 0 && !selectedBotId) {
            const firstBotId = result[0].Bot_Id || result[0].bot_id || result[0].BotId || result[0].id || result[0].ID;
            setSelectedBotId(String(firstBotId));
          }
        }
      } catch (error) {
        console.error("Error fetching bots:", error);
        toast({
          title: "Error",
          description: "Failed to load bots",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBots(false);
      }
    };

    fetchBots();
  }, []);

  const handleDownload = async (file: CompletedFile) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/download-file/${file.FileID}`,
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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.FileName}.${file.FileFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: "File download has started.",
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download file.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section with Gradient Background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/10 border border-primary/20 p-8 shadow-lg">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Success Dashboard</h1>
                <p className="text-lg text-muted-foreground">Track completed file processes & automation invoices</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center md:text-right bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 shadow-md">
                <div className="text-4xl font-bold text-primary mb-1">
                  {completedFiles.length + completedProcesses.length}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Total Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Files and Processes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50 p-1 rounded-lg">
              <TabsTrigger
                value="files"
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md px-6 py-2"
              >
                <FileText className="w-4 h-4" />
                {String(selectedBotId) === "2"
                  ? `Completed Flights (${completedFlights.length})`
                  : `Completed Files (${completedFiles.length})`}
              </TabsTrigger>
            </TabsList>

            {/* Bot Selection Dropdown */}
            <Select value={selectedBotId} onValueChange={setSelectedBotId}>
              <SelectTrigger className="w-[250px] bg-background border-2">
                <SelectValue placeholder="Select a bot" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingBots ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Loading bots...
                    </div>
                  </SelectItem>
                ) : bots.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No bots available
                  </SelectItem>
                ) : (
                  bots.map((bot) => {
                    // Try different possible field names for ID
                    const botId = bot.Bot_Id || bot.bot_id || bot.BotId || bot.id || bot.ID;
                    // Try different possible field names for Name
                    const botName = bot.Bot_Name || bot.bot_name || bot.BotName || bot.name || bot.Name || `Bot ${botId}`;

                    console.log("🤖 Rendering bot:", { botId, botName, rawBot: bot }); // Debug log

                    return (
                      <SelectItem key={botId} value={String(botId)}>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" />
                          {botName}
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Completed Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <Card className="border-2 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {String(selectedBotId) === "2" ? (
                      <Plane className="w-5 h-5 text-primary" />
                    ) : (
                      <FileText className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {String(selectedBotId) === "2"
                        ? "Completed Flight Details"
                        : "Completed File Processes"}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {String(selectedBotId) === "2"
                        ? "All flights that have been successfully processed (Done)"
                        : "All files that have been successfully triggered and processed"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {String(selectedBotId) === "2" ? (
                  isLoadingFlights ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader className="w-10 h-10 animate-spin text-primary" />
                    </div>
                  ) : completedFlights.length === 0 ? (
                    <div className="text-center py-20">
                      <Plane className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-30" />
                      <p className="text-lg text-muted-foreground">
                        No completed flights found
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <Table className="w-full">
                        <TableHeader className="bg-muted/30 text-center">
                          <TableRow className="hover:bg-muted/30">
                            <TableHead className="font-semibold text-base">
                              Flight Number
                            </TableHead>
                            <TableHead className="font-semibold text-base">
                              Flight Status
                            </TableHead>
                            <TableHead className="font-semibold text-base">
                              Airline Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {completedFlights.map((row, idx) => (
                            <TableRow
                              key={idx}
                              className="hover:bg-muted/20 transition-colors border-b"
                            >
                              <TableCell className="font-medium py-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <Plane className="w-4 h-4 text-primary" />
                                  </div>
                                  <span
                                    className="truncate"
                                    title={row["Flight Number"]}
                                  >
                                    {row["Flight Number"] || "—"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                {getFlightStatusBadge(row["Flight Status"])}
                              </TableCell>
                              <TableCell className="py-4 text-muted-foreground font-medium">
                                {row["Airline Status"] || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                ) : isLoadingFiles ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader className="w-10 h-10 animate-spin text-primary" />
                  </div>
                ) : completedFiles.length === 0 ? (
                  <div className="text-center py-20">
                    <FileText className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="text-lg text-muted-foreground">No completed files found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <Table className="w-full">
                      <TableHeader className="bg-muted/30 text-center">
                        <TableRow className="hover:bg-muted/30">
                          <TableHead className="font-semibold text-base w-[280px]">File Name</TableHead>
                          <TableHead className="font-semibold text-base w-[220px]">Process</TableHead>
                          <TableHead className="font-semibold text-base w-[120px]">Type</TableHead>
                          <TableHead className="font-semibold text-base w-[100px]">Size</TableHead>
                          <TableHead className="font-semibold text-base w-[160px]">Uploaded By</TableHead>
                          <TableHead className="font-semibold text-base w-[150px]">HouseBill Number</TableHead>
                          <TableHead className="text-right font-semibold text-base w-[140px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedFiles.map((file, index) => (
                          <TableRow
                            key={file.FileID}
                            className="hover:bg-muted/20 transition-colors border-b"
                          >
                            <TableCell className="font-medium py-4 w-[280px]">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <FileText className="w-4 h-4 text-primary" />
                                </div>
                                <span className="truncate max-w-[200px]" title={file.FileName}>
                                  {file.FileName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 w-[220px]">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span className="truncate max-w-[160px]" title={file.ProcessName}>
                                  {file.ProcessName || "N/A"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="py-4 w-[80px] text-center">
                              <div className="flex items-center justify-center">
                                {(() => {
                                  const fileType = (file.FileType || "document").toLowerCase();

                                  if (fileType === "document") {
                                    return <FileText className="w-5 h-5 text-blue-600 mx-auto" />;
                                  } else if (fileType === "video") {
                                    return <Video className="w-5 h-5 text-purple-600 mx-auto" />;
                                  } else if (fileType === "image") {
                                    return <Image className="w-5 h-5 text-green-600 mx-auto" />;
                                  } else if (fileType === "flowchart") {
                                    return <GitBranch className="w-5 h-5 text-orange-600 mx-auto" />;
                                  } else {
                                    return <File className="w-5 h-5 text-gray-600 mx-auto" />;
                                  }
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground py-4 font-medium w-[100px]">
                              {formatFileSize(file.FileSize)}
                            </TableCell>
                            <TableCell className="py-4 w-[160px]">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-muted">
                                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <span className="font-medium truncate max-w-[100px]">{file.CreatedByName || "-"}</span>
                              </div>
                            </TableCell>

                            <TableCell className="py-4 w-[150px]">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{file.HouseBill || "-"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-4 w-[140px]">
                              <button
                                onClick={() => handleDownload(file)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 text-sm font-medium transition-all shadow-md hover:shadow-lg"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}