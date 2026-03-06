import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Calendar,
  Clock,
  Target,
  Bell,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Zap,
  Badge as BadgeIcon,
  Settings,
  MoreHorizontal,
  Plus,
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
  Link,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  Assignment,
  Milestone,
  TeamMember,
  Notification,
  mockTeamMembers,
  generateNotification,
} from "@/utils/collaborationUtils";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface TeamAssignmentsProps {
  /** Numeric process ID e.g. "73" – passed from the approval redirect */
  processId?: string;
  /** Human-readable process title from ProcessRegistration.Title */
  processName?: string;
  /** Department from ProcessRegistration.Department */
  processDepartment?: string;
}

// ─────────────────────────────────────────────
// API URLs
// ─────────────────────────────────────────────
const INSERT_ASSIGNMENT_URL = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/insert-team-assignment";
const GET_ASSIGNMENTS_URL = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/get-team-assignments";
const UPDATE_MILESTONE_STATUS_URL = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/update-milestone-status";
const GET_USERS_URL = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/users?assignable=true";

// ─────────────────────────────────────────────
// Dummy notifications (kept as-is)
// ─────────────────────────────────────────────
const dummyNotifications: Notification[] = [
  {
    id: "n1",
    type: "assignment",
    title: "New Assignment",
    message: "You have been assigned to work on Invoice Processing Automation",
    recipient: "Sarah Chen",
    sender: "Lisa Wang",
    createdAt: "2024-01-20T09:00:00Z",
    read: false,
    actionUrl: "/center-of-excellence",
  },
  {
    id: "n2",
    type: "milestone",
    title: "Milestone Completed",
    message: "Requirements Analysis milestone has been completed",
    recipient: "Lisa Wang",
    sender: "Sarah Chen",
    createdAt: "2024-01-26T14:30:00Z",
    read: true,
  },
  {
    id: "n3",
    type: "assignment",
    title: "Assignment Overdue",
    message: "Data reconciliation fix is overdue and needs immediate attention",
    recipient: "Emma Thompson",
    sender: "System",
    createdAt: "2024-02-01T09:00:00Z",
    read: false,
  },
];

// ─────────────────────────────────────────────
// Colour helpers
// ─────────────────────────────────────────────
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "low": return "bg-muted text-muted-foreground";
    case "medium": return "bg-warning/20 text-warning-foreground border-warning/30";
    case "high": return "bg-destructive/20 text-destructive-foreground border-destructive/30";
    case "urgent": return "bg-gradient-danger text-white border-destructive shadow-glow";
    default: return "bg-muted text-muted-foreground";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "assigned": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "in-progress": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "completed": return "bg-success/20 text-success-foreground border-success/30";
    case "overdue": return "bg-destructive/20 text-destructive-foreground border-destructive/30";
    default: return "bg-muted text-muted-foreground";
  }
};

// ─────────────────────────────────────────────
// Extended assignment shape (adds process fields)
// ─────────────────────────────────────────────
interface EnrichedAssignment extends Assignment {
  processName?: string;
  processDepartment?: string;
  processPriority?: string;
  progressPercent?: number;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function TeamAssignments({
  processId,
  processName,
  processDepartment,
}: TeamAssignmentsProps) {
  const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications);
  const [isNewAssignmentOpen, setIsNewAssignmentOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [newAssignment, setNewAssignment] = useState({
    assignedTo: [] as string[],
    assignedToIds: [] as number[],
    description: "",
    priority: "medium" as Assignment["priority"],
    dueDate: "",
    estimatedHours: 0,
    milestones: [] as Partial<Milestone>[],
  });
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<{
    assignmentId: string;
    milestoneId: string;
  } | null>(null);
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // ── Status mapping helpers ──────────────────
  const mapStatusFilterToAPI = (filter: string): string | null => {
    if (filter === "all") return null;
    if (filter === "assigned") return "Assigned";
    if (filter === "in-progress") return "In Process";
    if (filter === "completed") return "Completed";
    return null; // "overdue" is client-side only
  };

  const mapStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("process") || s.includes("progress")) return "in-progress";
    if (s.includes("complete")) return "completed";
    if (s.includes("overdue")) return "overdue";
    if (s.includes("assign")) return "assigned";
    return "assigned";
  };

  const mapPriority = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "high") return "high";
    if (p === "medium") return "medium";
    if (p === "low") return "low";
    if (p === "urgent") return "urgent";
    return "medium";
  };

  // ── Fetch assignments ───────────────────────
  const fetchAssignments = async (statusFilterParam?: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { setIsLoading(false); return; }

      let url = GET_ASSIGNMENTS_URL;
      const apiStatusFilter = statusFilterParam
        ? mapStatusFilterToAPI(statusFilterParam)
        : mapStatusFilterToAPI(statusFilter);
      if (apiStatusFilter) {
        url += `?statusFilter=${encodeURIComponent(apiStatusFilter)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch assignments");

      const data = await response.json();
      if (data.success && data.data) {
        const mapped: EnrichedAssignment[] = data.data.map((api: any) => {
          const assignedToNames: string[] = api.AssignedToNames
            ? api.AssignedToNames.split(", ").filter((n: string) => n.trim())
            : [];

          const milestones: Milestone[] = (api.Milestones || []).map((m: any) => ({
            id: `m${m.MilestoneId}`,
            title: m.Title || "",
            description: m.Description || "",
            dueDate: m.DueDate || "",
            status: mapStatus(m.Status || "Assigned"),
            completedAt: m.CompletedById
              ? (m.UpdatedDate || m.CreatedDate)
              : undefined,
            completedBy: m.CompletedByName || undefined,
          }));

          return {
            id: `a${api.AssignmentId}`,
            // ── Process context from SP ──────────────────────────────────────
            // Only use what the DB actually returned via the JOIN.
            // Never fall back to nav-state props here — that would cause ALL
            // old assignments (no Process_Id in DB) to inherit the current
            // navigation context and show the wrong process pill.
            processId: api.Process_Id
              ? `P${String(api.Process_Id).padStart(3, "0")}`
              : undefined,
            processName: api.Title || undefined,
            processDepartment: api.Department || undefined,
            processPriority: api.Process_Priority || undefined,
            // ── Assignment fields ────────────────────────────────────────────
            assignedTo: assignedToNames,
            assignedBy: api.AssignedByUserName || "Unknown",
            assignedAt: api.CreatedDate || new Date().toISOString(),
            dueDate: api.Due_Date || "",
            priority: mapPriority(api.Priority || "Medium"),
            status: mapStatus(api.Status || "Assigned"),
            description: api.Assignment_Name || "",
            estimatedHours: api.Estimated_Hours || 0,
            actualHours: undefined,
            milestones,
            progressPercent: api.ProgressPercent || 0,
          } as EnrichedAssignment;
        });
        setAssignments(mapped);
      }
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      toast({ title: "Error", description: error.message || "Failed to fetch assignments", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Filtered list ───────────────────────────
  const filteredAssignments = assignments.filter((a) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "overdue" && a.status === "overdue") ||
      (statusFilter !== "overdue" && a.status === statusFilter);
    const matchesPriority = priorityFilter === "all" || a.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  // ── Create assignment ───────────────────────
  const handleCreateAssignment = async () => {
    if (!newAssignment.description || newAssignment.assignedToIds.length === 0) {
      toast({ title: "Validation Error", description: "Please fill in all required fields and assign at least one team member.", variant: "destructive" });
      return;
    }
    const incomplete = newAssignment.milestones.filter(
      (m) => !m.title || !m.dueDate || !m.description
    );
    if (incomplete.length > 0) {
      toast({ title: "Validation Error", description: "Please fill in all milestone fields (Title, Due Date, and Description).", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "Authentication Error", description: "Please login to create assignments.", variant: "destructive" });
        return;
      }

      const mapPriorityToAPI = (p: string) =>
        p.charAt(0).toUpperCase() + p.slice(1);

      const formatDateForAPI = (d: string) => {
        if (!d) return new Date().toISOString().split("T")[0];
        if (d.match(/^\d{4}-\d{2}-\d{2}$/)) return d;
        return new Date(d).toISOString().split("T")[0];
      };

      const formattedMilestones = newAssignment.milestones.map((m) => {
        let due = m.dueDate || new Date().toISOString().split("T")[0];
        if (!due.match(/^\d{4}-\d{2}-\d{2}$/)) due = new Date(due).toISOString().split("T")[0];
        return {
          Title: m.title || "",
          Description: m.description || "",
          DueDate: due,
          Status: "Assigned",
          Progress: "0%",
        };
      });

      // ── Key change: send Process_Id as integer to backend ──────────────────
      // processId prop is e.g. "73" or "P073" – strip the "P" prefix if present
      const numericProcessId = processId
        ? parseInt(processId.replace(/^P0*/i, ""), 10) || null
        : null;

      const requestBody = {
        Assignment_Name: newAssignment.description,
        Priority: mapPriorityToAPI(newAssignment.priority),
        Due_Date: formatDateForAPI(newAssignment.dueDate),
        Estimated_Hours: newAssignment.estimatedHours || 0,
        AssignedToIds: newAssignment.assignedToIds,
        Status: "Assigned",
        ProgressPercent: 0.0,
        Milestones: formattedMilestones,
        // ── Process link ──────────────────────────────────────────────────────
        Process_Id: numericProcessId,   // maps to @Process_Id in SP
      };

      const response = await fetch(INSERT_ASSIGNMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to create assignment");

      // Generate notifications for assigned members
      newAssignment.assignedTo.forEach((member) => {
        const notification = generateNotification("assignment", {
          recipient: member,
          sender: localStorage.getItem("userName") || "Current User",
          title: "New Assignment",
          message: `You have been assigned to work on: ${newAssignment.description}${processName ? ` (Process: ${processId} — ${processName})` : ""
            }`,
          actionUrl: "/center-of-excellence",
        });
        setNotifications((prev) => [...prev, notification]);
      });

      setIsNewAssignmentOpen(false);
      setNewAssignment({ assignedTo: [], assignedToIds: [], description: "", priority: "medium", dueDate: "", estimatedHours: 0, milestones: [] });
      await fetchAssignments();

      toast({ title: "Assignment created! 👥", description: `${newAssignment.assignedTo.length} team member(s) have been notified.` });
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      toast({ title: "Error", description: error.message || "Failed to create assignment", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Milestone handlers ──────────────────────
  const handleMilestoneInProcess = async (assignmentId: string, milestoneId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" }); return; }

      const numericMilestoneId = parseInt(milestoneId.replace("m", ""));
      const response = await fetch(UPDATE_MILESTONE_STATUS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ MilestoneId: numericMilestoneId, Status: "In Process" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to update milestone status");

      await fetchAssignments();
      toast({ title: "Task in process! 🚀", description: "The milestone has been marked as in progress." });
    } catch (error: any) {
      console.error("Error updating milestone status:", error);
      toast({ title: "Error", description: error.message || "Failed to update milestone status", variant: "destructive" });
    }
  };

  const handleMilestoneComplete = async (assignmentId: string, milestoneId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" }); return; }

      const current = assignments.find((a) => a.id === assignmentId);
      const milestone = current?.milestones.find((m) => m.id === milestoneId);
      const wasCompleted = milestone?.status === "completed";
      const numericMilestoneId = parseInt(milestoneId.replace("m", ""));
      const newStatus = wasCompleted ? "In Process" : "Completed";

      const response = await fetch(UPDATE_MILESTONE_STATUS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ MilestoneId: numericMilestoneId, Status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to update milestone status");

      await fetchAssignments();
      toast({
        title: wasCompleted ? "Milestone marked incomplete! 🔄" : "Milestone completed! ✅",
        description: wasCompleted ? "The milestone has been marked as in-progress." : "Great progress!",
      });
    } catch (error: any) {
      console.error("Error updating milestone status:", error);
      toast({ title: "Error", description: error.message || "Failed to update milestone status", variant: "destructive" });
    }
  };

  const handleAssignmentComplete = (assignmentId: string) => {
    const current = assignments.find((a) => a.id === assignmentId);
    const wasCompleted = current?.status === "completed";
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? { ...a, status: wasCompleted ? ("assigned" as const) : ("completed" as const) }
          : a
      )
    );
    toast({
      title: wasCompleted ? "Assignment marked incomplete! 🔄" : "Assignment completed! ✅",
      description: wasCompleted ? "The assignment has been marked as assigned." : "Great work!",
    });
  };

  // ── Milestone CRUD helpers ──────────────────
  const addMilestone = () =>
    setNewAssignment((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { title: "", description: "", dueDate: "", status: "assigned" as const }],
    }));

  const updateMilestone = (index: number, field: string, value: any) =>
    setNewAssignment((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));

  const removeMilestone = (index: number) =>
    setNewAssignment((prev) => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== index) }));

  // ── Fetch users ─────────────────────────────
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(GET_USERS_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      if (data.success && data.data) setUsers(data.data);
    } catch (error: any) {
      console.error("Error fetching users:", error);
    }
  };

  // ── Effects ─────────────────────────────────
  useEffect(() => {
    fetchAssignments();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (statusFilter !== "overdue") fetchAssignments();
  }, [statusFilter]);

  // ── Auto-open Create Assignment modal when redirected from an approval ──
  // processId + processName props are only set when CenterOfExcellence
  // receives location.state from RPALeadProfile after triage approval.
  // Fires once on mount since props are stable from the parent render.
  useEffect(() => {
    if (processId && processName) {
      setIsNewAssignmentOpen(true);
    }
  }, [processId, processName]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Team Assignments</h3>
          <p className="text-muted-foreground">Manage team assignments and track progress</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="relative">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground min-w-5 h-5 text-xs flex items-center justify-center p-0">
                {unreadNotifications}
              </Badge>
            )}
          </Button>

          {/* ── Create Assignment Dialog ── */}
          <Dialog open={isNewAssignmentOpen} onOpenChange={setIsNewAssignmentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create Team Assignment</DialogTitle>
                <DialogDescription>
                  Assign team members to work on automation tasks and milestones
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* ── Linked Process Banner (shown when opened from an approval) ── */}
                {processId && processName && (
                  <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <Link className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Linked Process</p>
                      <p className="text-sm font-semibold text-purple-300">
                        {processId} — {processName}
                        {processDepartment && (
                          <span className="text-muted-foreground font-normal ml-1">
                            · {processDepartment}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Basic fields ── */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assignment Description</Label>
                    <Textarea
                      placeholder="Describe what needs to be done..."
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={newAssignment.priority}
                        onValueChange={(value: Assignment["priority"]) =>
                          setNewAssignment((prev) => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={newAssignment.dueDate}
                        onChange={(e) => setNewAssignment((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Estimated Hours</Label>
                      <Input
                        type="number"
                        placeholder="40"
                        value={newAssignment.estimatedHours}
                        onChange={(e) =>
                          setNewAssignment((prev) => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  </div>

                  {/* ── Team member selection ── */}
                  <div className="space-y-2">
                    <Label>Assign to Team Members</Label>
                    <Select
                      onValueChange={(value) => {
                        const userId = parseInt(value);
                        const user = users.find((u) => u.UserId === userId);
                        if (user && !newAssignment.assignedToIds.includes(userId)) {
                          setNewAssignment((prev) => ({
                            ...prev,
                            assignedTo: [...prev.assignedTo, `${user.FirstName} ${user.LastName}`.trim()],
                            assignedToIds: [...prev.assignedToIds, userId],
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team members..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.length > 0 ? (
                          users.map((user) => {
                            const fullName = `${user.FirstName} ${user.LastName}`.trim();
                            return (
                              <SelectItem key={user.UserId} value={user.UserId.toString()}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5">
                                    <AvatarFallback className="text-xs">
                                      {fullName.split(" ").map((n: string) => n[0]).join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{fullName}</span>
                                  {user.RoleName && (
                                    <span className="text-xs text-muted-foreground ml-1">· {user.RoleName}</span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="loading" disabled>Loading users...</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {newAssignment.assignedTo.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newAssignment.assignedTo.map((member, index) => (
                          <Badge key={`${member}-${index}`} variant="secondary" className="text-sm">
                            {member}
                            <button
                              className="ml-1 hover:text-destructive"
                              onClick={() =>
                                setNewAssignment((prev) => ({
                                  ...prev,
                                  assignedTo: prev.assignedTo.filter((_, i) => i !== index),
                                  assignedToIds: prev.assignedToIds.filter((_, i) => i !== index),
                                }))
                              }
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Milestones ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      Milestones
                    </Label>
                    <Button size="sm" onClick={addMilestone}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Milestone
                    </Button>
                  </div>

                  {newAssignment.milestones.map((milestone, index) => (
                    <Card key={index} className="bg-muted/20 border-border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Milestone {index + 1}</h4>
                          <Button size="sm" variant="ghost" onClick={() => removeMilestone(index)}>×</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title </Label>
                            <Input
                              placeholder="e.g., Requirements Analysis"
                              value={milestone.title || ""}
                              onChange={(e) => updateMilestone(index, "title", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Due Date </Label>
                            <Input
                              type="date"
                              value={milestone.dueDate || ""}
                              onChange={(e) => updateMilestone(index, "dueDate", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description </Label>
                          <Input
                            placeholder="What needs to be accomplished in this milestone?"
                            value={milestone.description || ""}
                            onChange={(e) => updateMilestone(index, "description", e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {newAssignment.milestones.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm mt-1">No milestones added. Click "Add Milestone" to add milestones (optional)</p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewAssignmentOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreateAssignment}
                  disabled={
                    !newAssignment.description ||
                    newAssignment.assignedTo.length === 0 ||
                    isLoading ||
                    newAssignment.milestones.some((m) => !m.title || !m.dueDate || !m.description)
                  }
                >
                  {isLoading ? "Creating..." : "Create Assignment"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Filters ── */}
      <Card className="bg-card border-border shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Assignment list ── */}
      {isLoading ? (
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">Loading assignments...</div>
          </CardContent>
        </Card>
      ) : filteredAssignments.length === 0 ? (
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No assignments found</h4>
            <p className="text-muted-foreground mb-4">Create your first team assignment to get started</p>
            <Button onClick={() => setIsNewAssignmentOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredAssignments.map((assignment) => {
            const completedMilestones = assignment.milestones.filter((m) => m.status === "completed").length;
            const progressPercentage =
              assignment.progressPercent !== undefined
                ? assignment.progressPercent
                : assignment.milestones.length > 0
                  ? (completedMilestones / assignment.milestones.length) * 100
                  : 0;
            const isExpanded = expandedAssignment === assignment.id;

            return (
              <Card key={assignment.id} className="bg-gradient-card border-border shadow-card">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedAssignment(isExpanded ? null : assignment.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* ── Badges row ── */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
                        </Badge>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status === "in-progress"
                            ? "In Progress"
                            : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg flex-1">{assignment.description}</CardTitle>
                      </div>

                      {/* ── Process context (from SP: Title + Department) ── */}
                      {assignment.processName && (
                        <div className="mb-2 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Process</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-sm font-semibold text-foreground">
                              {assignment.processId} — {assignment.processName}
                            </span>
                            {assignment.processDepartment && (
                              <span className="text-sm text-muted-foreground ml-2">
                                · {assignment.processDepartment}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {assignment.assignedTo.length} member(s)
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(assignment.dueDate || "").toLocaleDateString("en-US", { timeZone: "UTC" })}
                        </div>
                        {assignment.estimatedHours ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {assignment.estimatedHours}h estimated
                            {assignment.actualHours && ` (${assignment.actualHours}h actual)`}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right flex items-start gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Progress</div>
                        <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedAssignment(isExpanded ? null : assignment.id);
                        }}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* ── Expanded details ── */}
                  {isExpanded && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg border border-border">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Assigned Date</p>
                        </div>
                        <p className="text-sm font-medium">
                          {assignment.assignedAt
                            ? new Date(assignment.assignedAt).toLocaleDateString("en-US", { timeZone: "UTC" })
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Assigned By</p>
                        </div>
                        <p className="text-sm font-medium">{assignment.assignedBy}</p>
                      </div>

                      {/* ── Process detail in expanded view ── */}
                      {assignment.processName && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Process</p>
                          <p className="text-sm font-semibold text-foreground">
                            {assignment.processId} — {assignment.processName}
                            {assignment.processDepartment && (
                              <span className="text-muted-foreground ml-2">
                                · {assignment.processDepartment}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {assignment.processPriority && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Process Priority</p>
                          </div>
                          <Badge className={getPriorityColor(assignment.processPriority.toLowerCase())}>
                            {assignment.processPriority}
                          </Badge>
                        </div>
                      )}

                      {assignment.estimatedHours ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Estimated Hours</p>
                          </div>
                          <p className="text-sm font-medium">{assignment.estimatedHours}h</p>
                        </div>
                      ) : null}
                      {assignment.actualHours ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Actual Hours</p>
                          </div>
                          <p className="text-sm font-medium">{assignment.actualHours}h</p>
                        </div>
                      ) : null}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Total Milestones</p>
                        </div>
                        <p className="text-sm font-medium">{assignment.milestones.length}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Completed Milestones</p>
                        </div>
                        <p className="text-sm font-medium">{completedMilestones}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Progress</p>
                        </div>
                        <p className="text-sm font-medium">{Math.round(progressPercentage)}%</p>
                      </div>
                      {assignment.estimatedHours && assignment.actualHours ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Time Efficiency</p>
                          </div>
                          <p className="text-sm font-medium">
                            {Math.round((assignment.estimatedHours / assignment.actualHours) * 100)}%
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* ── Progress bar ── */}
                  <div className="space-y-2">
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{completedMilestones} of {assignment.milestones.length} milestones completed</span>
                      <span>Assigned by {assignment.assignedBy}</span>
                    </div>
                  </div>

                  {/* ── Team members ── */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Assigned Team</Label>
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {assignment.assignedTo.map((member) => {
                          const memberData = mockTeamMembers.find((m) => m.name === member);
                          return (
                            <div key={member} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {member.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium">{member}</div>
                                <div className="text-xs text-muted-foreground">{memberData?.role}</div>
                              </div>
                              <div
                                className={`w-2 h-2 rounded-full ${memberData?.availability === "available"
                                    ? "bg-success"
                                    : memberData?.availability === "busy"
                                      ? "bg-warning"
                                      : "bg-muted"
                                  }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      {assignment.milestones.length === 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground mx-2">
                            {assignment.status === "completed" ? "Completed" : "Mark as Complete"}
                          </span>
                          <Button
                            size="sm"
                            variant={assignment.status === "completed" ? "default" : "outline"}
                            className={
                              assignment.status === "completed"
                                ? "h-8 w-8 p-0 bg-success text-success-foreground hover:bg-success/90"
                                : "h-8 w-8 p-0 bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30"
                            }
                            onClick={(e) => { e.stopPropagation(); handleAssignmentComplete(assignment.id); }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Milestones ── */}
                  {assignment.milestones.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Milestones</Label>
                      <div className="space-y-2">
                        {assignment.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="flex items-center justify-between p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => {
                              setSelectedMilestone({ assignmentId: assignment.id, milestoneId: milestone.id });
                              setIsMilestoneDialogOpen(true);
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Button
                                size="sm"
                                variant={milestone.status === "completed" ? "default" : "outline"}
                                className={
                                  milestone.status === "completed"
                                    ? "bg-success text-success-foreground hover:bg-success/90"
                                    : "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30"
                                }
                                onClick={(e) => { e.stopPropagation(); handleMilestoneComplete(assignment.id, milestone.id); }}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
                              <div className="flex-1">
                                <h4 className={`font-medium ${milestone.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                  {milestone.title}
                                </h4>
                                <p className="text-xs text-muted-foreground">{milestone.description}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Calendar className="w-3 h-3" />
                                  Due: {new Date(milestone.dueDate).toLocaleDateString("en-US", { timeZone: "UTC" })}
                                  {milestone.status === "completed" && milestone.completedBy && (
                                    <> • Completed by {milestone.completedBy}</>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge className={getStatusColor(milestone.status)}>
                              {milestone.status === "in-progress"
                                ? "In Progress"
                                : milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Milestone details dialog ── */}
      <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedMilestone &&
            (() => {
              const assignment = assignments.find((a) => a.id === selectedMilestone.assignmentId);
              const milestone = assignment?.milestones.find((m) => m.id === selectedMilestone.milestoneId);
              if (!milestone || !assignment) return null;

              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {milestone.title}
                    </DialogTitle>
                    <DialogDescription>{milestone.description}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Status + due date */}
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <Badge className={getStatusColor(milestone.status)}>
                          {milestone.status === "in-progress"
                            ? "In Progress"
                            : milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                        <p className="text-sm font-medium">
                          {milestone.dueDate
                            ? new Date(milestone.dueDate).toLocaleDateString("en-US", { timeZone: "UTC" })
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Assignment context – includes process info */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Assignment Context</Label>
                      <div className="grid grid-cols-2 gap-4 p-3 bg-muted/20 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Assignment</p>
                          <p className="text-sm font-medium">{assignment.description}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Priority</p>
                          <Badge className={getPriorityColor(assignment.priority)}>
                            {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
                          </Badge>
                        </div>
                        {/* ── Process info visible to developer in milestone dialog ── */}
                        {assignment.processName && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Process</p>
                            <p className="text-sm font-medium text-foreground">
                              {assignment.processId} — {assignment.processName}
                              {assignment.processDepartment && (
                                <span className="text-muted-foreground ml-1">
                                  · {assignment.processDepartment}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        {assignment.processDepartment && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Department</p>
                            <p className="text-sm font-medium">{assignment.processDepartment}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Assigned Team</p>
                          <p className="text-sm font-medium">{assignment.assignedTo.join(", ")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Assignment Due</p>
                          <p className="text-sm font-medium">
                            {assignment.dueDate
                              ? new Date(assignment.dueDate).toLocaleDateString("en-US", { timeZone: "UTC" })
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress info */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Progress Information</Label>
                      <div className="p-3 bg-muted/20 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Milestone Progress</span>
                          <span className="text-sm font-medium">
                            {milestone.status === "completed" ? "100%" : milestone.status === "in-progress" ? "In Progress" : "0%"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Assignment Progress</span>
                          <span className="text-sm font-medium">
                            {Math.round(
                              assignment.progressPercent !== undefined
                                ? assignment.progressPercent
                                : assignment.milestones.length > 0
                                  ? (assignment.milestones.filter((m) => m.status === "completed").length /
                                    assignment.milestones.length) *
                                  100
                                  : 0
                            )}%
                          </span>
                        </div>
                        {milestone.status === "completed" && milestone.completedBy && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Completed By</span>
                            <span className="text-sm font-medium">{milestone.completedBy}</span>
                          </div>
                        )}
                        {milestone.status === "completed" && milestone.completedAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Completed On</span>
                            <span className="text-sm font-medium">
                              {new Date(milestone.completedAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {milestone.status === "assigned" || milestone.status === "overdue" ? (
                        <Button
                          className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMilestoneDialogOpen(false);
                            handleMilestoneInProcess(assignment.id, milestone.id);
                          }}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Task in process
                        </Button>
                      ) : milestone.status === "in-progress" ? (
                        <Button
                          className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMilestoneDialogOpen(false);
                            handleMilestoneComplete(assignment.id, milestone.id);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark as Complete
                        </Button>
                      ) : milestone.status === "completed" ? (
                        <Button
                          className="flex-1 bg-warning text-warning-foreground hover:bg-warning/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMilestoneDialogOpen(false);
                            handleMilestoneComplete(assignment.id, milestone.id);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark as Incomplete
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMilestoneDialogOpen(false);
                            handleMilestoneInProcess(assignment.id, milestone.id);
                          }}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Task in process
                        </Button>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsMilestoneDialogOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}