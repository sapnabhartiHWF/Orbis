import { useEffect, useState } from "react";
import { getProcessOnboardingList } from "@/services/processOnboardingApi";
import { Badge } from "@/components/ui/badge";
import { Loader, Folder, File } from "lucide-react";
import { API_BASE_URL } from "@/services/api";

// Process template styles for visual variety
const processTemplates = [
  {
    bgClass: "bg-gradient-to-r from-indigo-50 to-indigo-100",
    titleClass: "text-indigo-800",
  },
  {
    bgClass: "bg-gradient-to-r from-emerald-50 to-emerald-100",
    titleClass: "text-emerald-800",
  },
  {
    bgClass: "bg-gradient-to-r from-amber-50 to-amber-100",
    titleClass: "text-amber-800",
  },
  {
    bgClass: "bg-gradient-to-r from-rose-50 to-rose-100",
    titleClass: "text-rose-800",
  },
];

type ProcessOnboarding = {
  Bot_Id?: number | string;
  Bot_id?: number | string;
  botId?: number | string;
  Oid?: number | string;
  Name?: string;
  name?: string;
  Status?: string;
  status?: string;
  OwnedBy?: string;
  ownedBy?: string;
  OwnedByName?: string;
  Department?: string;
  department?: string;
  Description?: string;
  description?: string;
  Tag?: string;
  tag?: string;
  CreatedBy?: string;
  createdBy?: string;
  CreatedAt?: string;
  createdAt?: string;
  Created_Time?: string;
  createdTime?: string;
  UpdatedBy?: string;
  updatedBy?: string;
  UpdatedAt?: string;
  updatedAt?: string;
  Updated_Time?: string;
  updatedTime?: string;
};

interface ProcessOnboardingCardsProps {
  onSelectProcess?: (id: string, name: string) => void;
  selectedProcessId?: string | null;
}

export default function ProcessOnboardingCards({
  onSelectProcess,
}: ProcessOnboardingCardsProps) {
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        const data = await getProcessOnboardingList(token);
        const list = (data.processes || []) as ProcessOnboarding[];
        setProcesses(list);

        // Fetch counts for all processes in parallel
        const counts: Record<string, number> = {};
        await Promise.all(
          list.map(async (proc) => {
            const id = proc.botId || proc.Bot_id || proc.Bot_Id || proc.Oid;
            if (id == null) return;
            const idStr = String(id);

            try {
              // Special case for BWI (BotId 2): count airline details
              if (idStr === "2") {
                const res = await fetch(
                  `${API_BASE_URL}/api/operations/airline-details?bot_id=2`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                  }
                );
                if (res.ok) {
                  const json = await res.json();
                  counts[idStr] =
                    json.success && Array.isArray(json.data) ? json.data.length : 0;
                } else {
                  counts[idStr] = 0;
                }
                return;
              }

              // Default: count file-management files
              const res = await fetch(
                `${API_BASE_URL}/api/process/${idStr}/file-management?fileType=all`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  credentials: "include",
                }
              );
              if (!res.ok) {
                counts[idStr] = 0;
                return;
              }
              const json = await res.json();
              counts[idStr] =
                json.success && Array.isArray(json.files) ? json.files.length : 0;
            } catch {
              counts[idStr] = 0;
            }
          })
        );
        setFileCounts(counts);
      } catch (err: any) {
        setError(err.message || "Failed to fetch onboarding data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Allow other components (e.g. FileManager) to request a refresh after creating a process
    const onRefresh = () => fetchData();
    window.addEventListener("process-onboarding-updated", onRefresh as any);
    return () => {
      window.removeEventListener("process-onboarding-updated", onRefresh as any);
    };
  }, []);

  if (loading) {
    return (
      <div className="col-span-full flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading processes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-2">Error loading processes</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <div className="col-span-full flex items-center justify-center py-12">
        <div className="text-center">
          <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-semibold text-lg mb-2">No processes found</h4>
          <p className="text-muted-foreground">
            No process onboarding entries have been created yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
      {processes.map((proc: ProcessOnboarding, idx: number) => {
        // Get process data - handle both camelCase and PascalCase
        const id = proc.botId || proc.Bot_id || proc.Bot_Id || proc.Oid;
        const name = proc.name || proc.Name;
        const status = proc.status || proc.Status;
        const ownedBy = proc.ownedBy || proc.OwnedBy || proc.OwnedByName;
        const department = proc.department || proc.Department;
        const description = proc.description || proc.Description;
        const tag = proc.tag || proc.Tag;
        const createdBy = proc.createdBy || proc.CreatedBy;
        const createdAt =
          proc.createdAt || proc.CreatedAt || proc.createdTime || proc.Created_Time;
        const updatedBy = proc.updatedBy || proc.UpdatedBy;
        const updatedAt =
          proc.updatedAt || proc.UpdatedAt || proc.updatedTime || proc.Updated_Time;

        // Pick a style from the templates
        const styleSource = processTemplates[idx % processTemplates.length];

        const idStr = id != null ? String(id) : "";
        const nameStr = name != null ? String(name) : "";

        return (
          <button
            key={idStr}
            type="button"
            className={`w-full relative px-8 pt-4 pb-3 h-64 rounded-xl transition-all duration-300 border border-border hover:shadow-lg hover:scale-[1.01] hover:border-primary/30 ${styleSource.bgClass}`}
            onClick={() => {
              if (onSelectProcess && idStr) onSelectProcess(idStr, nameStr);
            }}
          >
            {/* File Count Badge - Bottom Right Corner */}
            <div className="absolute bottom-3 right-3 z-30">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-white via-white to-gray-50/90 backdrop-blur-sm rounded-lg border border-gray-200/60 shadow-md">
                <div className="p-1 rounded-md bg-gradient-to-br from-indigo-500/10 to-blue-500/10">
                  <File className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-indigo-700 tabular-nums">
                  {fileCounts[idStr] ?? 0}
                </span>
              </div>
            </div>
            {/* Status Badge - Top Left Corner */}
            {status && (
              <div className="absolute top-3 left-3 z-30">
                <Badge
                  variant="outline"
                  className={`text-xs px-3 py-1.5 font-semibold shadow-md ${
                    status.toLowerCase() === "active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : status.toLowerCase() === "inactive"
                      ? "bg-gray-50 text-gray-700 border-gray-200"
                      : status.toLowerCase() === "on hold"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {status}
                </Badge>
              </div>
            )}

            {/* Tag Badge - Top Right Corner */}
            {tag != null && String(tag).trim() !== "" && (
              <div className="absolute top-3 right-3 z-30">
                <div className="text-xs text-indigo-700 bg-gradient-to-br from-white/90 to-indigo-50/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-indigo-200/50 font-semibold shadow-md">
                  {tag}
                </div>
              </div>
            )}

            <div
              className={`flex-1 text-left flex flex-col h-full ${
                status ? "pt-12" : tag != null && String(tag).trim() !== "" ? "pt-2" : "pt-0"
              }`}
            >
              {/* Title */}
              <div className="mb-2">
                <div className={`font-semibold text-2xl ${styleSource.titleClass} line-clamp-1`}>
                  {name}
                </div>
              </div>

              {/* Metadata Section */}
              <div className="space-y-1.5 mb-2">
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-semibold text-gray-700 min-w-[90px]">Owned By:</span>
                  <span className="text-gray-600 flex-1">{ownedBy || "N/A"}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-semibold text-gray-700 min-w-[90px]">Department:</span>
                  <span className="text-gray-600 flex-1">{department || "N/A"}</span>
                </div>
              </div>

              {/* Description */}
              <div className="text-sm text-gray-700 mb-2 line-clamp-2 flex-1">
                {description || "No description provided."}
              </div>

              {/* Footer Section */}
              <div className="mt-auto space-y-3">
                {/* Created info */}
                <div className="text-xs text-gray-500">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>Created by:</span>
                    <span className="font-medium text-gray-600">
                      {createdBy || "-"}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">
                      {createdAt ? new Date(createdAt).toLocaleString() : "-"}
                    </span>
                  </div>
                  {updatedBy && (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span>Updated by:</span>
                      <span className="font-medium text-gray-600">
                        {updatedBy}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">
                        {updatedAt ? new Date(updatedAt).toLocaleString() : "-"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action text */}
                <div className="text-center pt-2 border-t border-gray-200/50">
                  <div className="text-xs text-gray-600 font-medium">
                    Click to view process details
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
} 