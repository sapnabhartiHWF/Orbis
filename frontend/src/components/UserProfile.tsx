import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  User,
  Building2,
  Users,
  FileText,
  AlertCircle,
  TrendingUp,
  Settings,
  Shield,
  Bot,
  Upload,
  Download,
  MessageSquare,
  Calendar,
  Globe,
  Award,
  Activity,
  BarChart3,
  Eye,
  Edit,
  XCircle,
  CheckCircle2,
  FileCheck,
  Zap,
  Target,
  Bell,
  Mail as MailIcon,
  Bell as BellIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { apiGet, parseJsonResponse } from "@/services/api";
import { toast } from "@/hooks/use-toast";

type UserRole = "Business Owner" | "RPA Engineer" | "Admin" | "QA" | "Automation Lead";

interface UserProfileProps {
  role?: UserRole;
}

function UserProfile({ role: propRole }: UserProfileProps) {
  const params = useParams();

  // Map URL slug to display role
  const roleSlugMap: Record<string, UserRole> = {
    "rpa-engineer": "RPA Engineer",
    client: "Business Owner",
    admin: "Admin",
    qa: "QA",
    "automation-lead": "Automation Lead",
  };

  const paramRole = params.role ? roleSlugMap[params.role.toLowerCase()] : undefined;
  const storedRole = localStorage.getItem("userRole") as UserRole | null;

  // Get role from URL params (slug), props, or localStorage, default to "RPA Engineer"
  const role: UserRole = paramRole || propRole || storedRole || "RPA Engineer";
  
  // Mock data - will be replaced with API calls later
  const [userProfile] = useState({
    userId: "550e8400-e29b-41d4-a716-446655440000",
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    role: role,
    companyName: "Acme Corporation",
    department: "Accounts Payable",
    status: "Active",
    timeZone: "America/New_York",
    lastLogin: "2026-01-05T14:30:00Z",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2025-12-20T09:15:00Z",
    location: "London, UK",
    experience: "4 years",
  });

  // Pending reviews / feasibility queue
  const [pendingReviews, setPendingReviews] = useState(0);

  // Recent activities
  const [activities] = useState([
    { id: 1, text: "Reviewed SOP for Invoice Processing", time: "2 days ago" },
    { id: 2, text: "Requested clarifications on flowchart", time: "5 days ago" },
    { id: 3, text: "Signed off on Credit Card process", time: "2 weeks ago" },
  ]);

  // Role-specific data - initialize with empty object to prevent errors
  const [roleSpecificData, setRoleSpecificData] = useState<any>({});

  // Automation Lead – feasibility files & decisions
  const [feasibilityFiles, setFeasibilityFiles] = useState<any[]>([]);
  const [feasibilityDecisions, setFeasibilityDecisions] = useState<Record<string, "approved" | "rejected">>({});
  const [isLoadingFeasibility, setIsLoadingFeasibility] = useState(false);

  useEffect(() => {
    // Initialize role-specific data based on role
    switch (role) {
      case "Business Owner":
        setRoleSpecificData({
          clientId: "CLI-001",
          industry: "Logistics",
          processesOwned: ["AP Invoices", "Credit Cards", "Expense Claims"],
          slaPriority: "High",
          preferredNotificationMode: "Both",
          uploadHistory: [
            { fileName: "invoice_001.pdf", uploadTime: "2026-01-05T10:00:00Z", status: "Completed" },
            { fileName: "invoice_002.pdf", uploadTime: "2026-01-04T14:30:00Z", status: "In Progress" },
            { fileName: "invoice_003.pdf", uploadTime: "2026-01-03T09:15:00Z", status: "Received" },
          ],
          ticketCount: 5,
          exceptionsRaised: 2,
          assignedEngineer: "Jane Smith",
          botName: "InvoiceBot-Prod",
        });
        break;
      case "RPA Engineer":
        setRoleSpecificData({
          employeeId: "EMP-12345",
          skillSet: ["UiPath", "Automation Anywhere", "Power Automate", "ABBYY", "Tesseract"],
          experienceLevel: "Senior",
          certifications: ["UiPath Advanced RPA Developer", "AA Master RPA Developer"],
          assignedClients: ["Acme Corp", "Tech Solutions Inc", "Global Logistics"],
          assignedProcesses: ["AP Invoices", "AR Processing", "Credit Card Reconciliation"],
          activeBots: 8,
          ticketsInQueue: 12,
          exceptionsPending: 5,
          slaTimers: [
            { process: "AP Invoices", timeRemaining: "2h 15m", status: "On Track" },
            { process: "Credit Cards", timeRemaining: "45m", status: "Urgent" },
          ],
        });
        break;
      case "Admin":
        setRoleSpecificData({
          totalUsers: 45,
          totalClients: 12,
          totalBots: 25,
          invoicesProcessed: 1250,
          exceptionRate: "3.2%",
          botSuccessRate: "96.8%",
          slaCompliance: "94.5%",
          recentActions: [
            { action: "Created new user", user: "Alice Johnson", time: "2 hours ago" },
            { action: "Assigned bot to client", client: "Acme Corp", time: "5 hours ago" },
            { action: "Updated SLA configuration", time: "1 day ago" },
          ],
        });
        break;
      case "QA":
        setRoleSpecificData({
          reviewsPending: 8,
          reviewsCompleted: 142,
          approvalRate: "95.2%",
          rejectionRate: "4.8%",
          recentReviews: [
            { file: "invoice_001.pdf", action: "Approved", time: "1 hour ago" },
            { file: "invoice_002.pdf", action: "Rejected", reason: "Missing signature", time: "3 hours ago" },
          ],
        });
        break;
      case "Automation Lead":
        setRoleSpecificData({
          title: "Automation Lead",
          checklist: [
            "Is it rule-based?",
            "Are systems accessible?",
            "Are exceptions manageable?",
            "Any compliance risks?",
          ],
        });
        break;
    }
  }, [role]);

  // Load feasibility queue for Automation Lead
  useEffect(() => {
    if (role !== "Automation Lead") return;

    const fetchFeasibilityFiles = async () => {
      setIsLoadingFeasibility(true);
      try {
        const res = await apiGet("/api/uploaded-details");
        const data = await parseJsonResponse<any>(res);

        if (data?.success && Array.isArray(data.files)) {
          setFeasibilityFiles(data.files);
          setPendingReviews(data.files.length || 0);
        } else {
          setFeasibilityFiles([]);
          setPendingReviews(0);
        }
      } catch (error: any) {
        console.error("Failed to load feasibility files", error);
        setFeasibilityFiles([]);
        setPendingReviews(0);
      } finally {
        setIsLoadingFeasibility(false);
      }
    };

    fetchFeasibilityFiles();
  }, [role]);

  const handleFeasibilityDecision = (fileId: string, decision: "approved" | "rejected") => {
    setFeasibilityDecisions((prev) => ({ ...prev, [fileId]: decision }));

    toast({
      title: decision === "approved" ? "Feasibility approved" : "Feasibility rejected",
      description:
        decision === "approved"
          ? "This file has passed the initial feasibility check."
          : "This file has been marked as not feasible for automation right now.",
    });
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "Business Owner":
        return "from-blue-500 to-cyan-500";
      case "RPA Engineer":
        return "from-indigo-500 to-purple-500";
      case "Admin":
        return "from-orange-500 to-red-500";
      case "QA":
        return "from-green-500 to-emerald-500";
      case "Automation Lead":
        return "from-sky-500 to-indigo-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "Business Owner":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "RPA Engineer":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Admin":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "QA":
        return "bg-green-100 text-green-700 border-green-200";
      case "Automation Lead":
        return "bg-sky-100 text-sky-700 border-sky-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Profile Header Card */}
        <div className={`w-full bg-gradient-to-r ${getRoleColor(role)} rounded-xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 shadow-lg border border-border`}>
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <div className={`rounded-full bg-gradient-to-br ${getRoleColor(role)} p-1`}>
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 text-white bg-transparent shadow-xl">
                  <AvatarFallback className="bg-transparent text-white text-2xl font-bold">
                    {userProfile.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Profile Info Section */}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="w-full sm:w-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                      {userProfile.fullName}
                    </h1>
                    <Badge className={`${getRoleBadgeColor(role)} border font-semibold`}>
                      {role}
                    </Badge>
                  </div>
                  <div className="text-sm sm:text-base text-white/90 mt-1">
                    {userProfile.companyName} • {userProfile.department}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button variant="secondary" className="px-3 w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Link to="/collaboration-hub" className="w-full sm:w-auto">
                    <Button className="px-4 w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100">
                      <FileText className="w-4 h-4 mr-2" />
                      Open File Manager
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 sm:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {role === "Business Owner" && (
                  <>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Uploads</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.uploadHistory?.length || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Tickets</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.ticketCount || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Exceptions</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.exceptionsRaised || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">SLA Priority</div>
                      <div className="text-sm sm:text-base font-bold text-white">{roleSpecificData.slaPriority || "N/A"}</div>
                    </div>
                  </>
                )}
                {role === "RPA Engineer" && (
                  <>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Active Bots</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.activeBots || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Tickets</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.ticketsInQueue || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Exceptions</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.exceptionsPending || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Clients</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.assignedClients?.length || 0}</div>
                    </div>
                  </>
                )}
                {role === "Admin" && (
                  <>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Total Users</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.totalUsers || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Clients</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.totalClients || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Bots</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.totalBots || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">SLA Compliance</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.slaCompliance || "0%"}%</div>
                    </div>
                  </>
                )}
                {role === "QA" && (
                  <>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Pending</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.reviewsPending || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Completed</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.reviewsCompleted || 0}</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Approval Rate</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.approvalRate || "0%"}%</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <div className="text-xs text-white/80">Rejection Rate</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{roleSpecificData.rejectionRate || "0%"}%</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Common Profile Info - All Users */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Identity & Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-muted-foreground">Email</div>
                        <div className="font-medium">{userProfile.email}</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-muted-foreground">Phone</div>
                        <div className="font-medium">{userProfile.phone}</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-muted-foreground">Company</div>
                        <div className="font-medium">{userProfile.companyName}</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-muted-foreground">Department</div>
                        <div className="font-medium">{userProfile.department}</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-muted-foreground">Time Zone</div>
                        <div className="font-medium">{userProfile.timeZone}</div>
                      </div>
                    </div>
                    <Separator />
                    {(userProfile.location || userProfile.experience) && (
                      <>
                        {userProfile.location && (
                          <>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1">
                                <div className="text-muted-foreground">Location</div>
                                <div className="font-medium">{userProfile.location}</div>
                              </div>
                            </div>
                            <Separator />
                          </>
                        )}
                        {userProfile.experience && (
                          <>
                            <div className="flex items-start gap-2">
                              <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1">
                                <div className="text-muted-foreground">Experience</div>
                                <div className="font-medium">{userProfile.experience}</div>
                              </div>
                            </div>
                            <Separator />
                          </>
                        )}
                      </>
                    )}
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-muted-foreground">Last Login</div>
                        <div className="font-medium">{new Date(userProfile.lastLogin).toLocaleString()}</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Badge variant={userProfile.status === "Active" ? "default" : "destructive"}>
                        {userProfile.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row gap-2">
                    <Button asChild className="flex-1">
                      <Link to="/collaboration-hub">
                        <FileText className="w-4 h-4 mr-2" />
                        Review Files
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Role-Specific Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {role === "Business Owner" && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="w-5 h-5" />
                          Upload History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {roleSpecificData.uploadHistory?.map((upload: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{upload.fileName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(upload.uploadTime).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={
                                upload.status === "Completed" ? "default" :
                                upload.status === "In Progress" ? "secondary" :
                                "outline"
                              }>
                                {upload.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bot className="w-5 h-5" />
                          Assigned Resources
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">RPA Engineer</div>
                          <div className="font-medium">{roleSpecificData.assignedEngineer}</div>
                        </div>
                        <Separator />
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Bot Name</div>
                          <div className="font-medium">{roleSpecificData.botName}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {role === "RPA Engineer" && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Skills & Certifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <div className="text-sm text-muted-foreground mb-2">Skill Set</div>
                          <div className="flex flex-wrap gap-2">
                            {roleSpecificData.skillSet?.map((skill: string, idx: number) => (
                              <Badge key={idx} className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <FileCheck className="w-5 h-5" />
                              Pending Reviews
                            </CardTitle>
                            <div className="text-sm text-muted-foreground mt-1">Files that require your attention</div>
                          </div>
                          <Button variant="ghost" size="sm">Manage</Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="p-3 sm:p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border shadow-sm">
                            <div className="text-xs text-muted-foreground">To Review</div>
                            <div className="text-2xl sm:text-3xl font-extrabold">{pendingReviews}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Awaiting your approval</div>
                          </div>
                          <div className="p-3 sm:p-4 bg-white rounded-lg border shadow-sm">
                            <div className="text-xs text-muted-foreground">In Progress</div>
                            <div className="text-2xl sm:text-3xl font-extrabold">3</div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Under review by team</div>
                          </div>
                          <div className="p-3 sm:p-4 bg-white rounded-lg border shadow-sm">
                            <div className="text-xs text-muted-foreground">Recently Reviewed</div>
                            <div className="text-2xl sm:text-3xl font-extrabold">8</div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Last 30 days</div>
                          </div>
                        </div>

                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          SLA Timers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {roleSpecificData.slaTimers?.map((timer: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div>
                                <div className="font-medium">{timer.process}</div>
                                <div className="text-sm text-muted-foreground">Time Remaining: {timer.timeRemaining}</div>
                              </div>
                              <Badge variant={timer.status === "Urgent" ? "destructive" : "default"}>
                                {timer.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {role === "Automation Lead" && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Initial Feasibility Check
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Quick check to decide if a request is automatable before it enters full delivery.
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {roleSpecificData.checklist?.map((item: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div className="text-sm">{item}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5" />
                            Files awaiting feasibility
                          </div>
                          <Badge variant="secondary">
                            {isLoadingFeasibility ? "Loading..." : `${pendingReviews} pending`}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {isLoadingFeasibility && (
                          <div className="text-sm text-muted-foreground">
                            Loading uploaded files...
                          </div>
                        )}
                        {!isLoadingFeasibility && feasibilityFiles.length === 0 && (
                          <div className="text-sm text-muted-foreground">
                            No files waiting for feasibility review.
                          </div>
                        )}
                        {!isLoadingFeasibility &&
                          feasibilityFiles.map((file: any) => {
                            const decision = feasibilityDecisions[file.FileID ?? file.id];
                            return (
                              <div
                                key={file.FileID ?? file.id}
                                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-3 bg-muted rounded-lg"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <div className="font-medium text-sm">
                                      {file.FileName ?? file.name}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                                    {file.UploadedByName && (
                                      <span>Uploaded by {file.UploadedByName}</span>
                                    )}
                                    {file.UploadedDate && (
                                      <span>
                                        ·{" "}
                                        {new Date(file.UploadedDate).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {decision && (
                                    <Badge
                                      className={
                                        decision === "approved"
                                          ? "bg-green-100 text-green-700 border-green-200"
                                          : "bg-red-100 text-red-700 border-red-200"
                                      }
                                    >
                                      {decision === "approved" ? "Go" : "No-Go"}
                                    </Badge>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleFeasibilityDecision(
                                        String(file.FileID ?? file.id),
                                        "approved"
                                      )
                                    }
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Go
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() =>
                                      handleFeasibilityDecision(
                                        String(file.FileID ?? file.id),
                                        "rejected"
                                      )
                                    }
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    No-Go
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </CardContent>
                    </Card>
                  </>
                )}

                {role === "Admin" && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          System Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Invoices Processed</div>
                            <div className="text-2xl font-bold">{roleSpecificData.invoicesProcessed}</div>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Exception Rate</div>
                            <div className="text-2xl font-bold">{roleSpecificData.exceptionRate}</div>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Bot Success Rate</div>
                            <div className="text-2xl font-bold">{roleSpecificData.botSuccessRate}</div>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">SLA Compliance</div>
                            <div className="text-2xl font-bold">{roleSpecificData.slaCompliance}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Recent Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {roleSpecificData.recentActions?.map((action: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div className="flex-1">
                                <div className="font-medium">{action.action}</div>
                                <div className="text-sm text-muted-foreground">{action.time}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {role === "QA" && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5" />
                          Review Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Pending Reviews</div>
                            <div className="text-2xl font-bold">{roleSpecificData.reviewsPending}</div>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Completed</div>
                            <div className="text-2xl font-bold">{roleSpecificData.reviewsCompleted}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Recent Reviews
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {roleSpecificData.recentReviews?.map((review: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                {review.action === "Approved" ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <div>
                                  <div className="font-medium">{review.file}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {review.action} {review.reason && `- ${review.reason}`}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">{review.time}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Common Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">User ID</div>
                      <div className="font-medium">{userProfile.userId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Created At</div>
                      <div className="font-medium">{new Date(userProfile.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Updated At</div>
                      <div className="font-medium">{new Date(userProfile.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <Separator />
                {role === "Business Owner" && (
                  <div>
                    <h3 className="font-semibold mb-3">Business Context</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Client ID</div>
                        <div className="font-medium">{roleSpecificData.clientId}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Industry</div>
                        <div className="font-medium">{roleSpecificData.industry}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">SLA Priority</div>
                        <div className="font-medium">{roleSpecificData.slaPriority}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Notification Mode</div>
                        <div className="font-medium">{roleSpecificData.preferredNotificationMode}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-medium truncate">{a.text}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{a.time}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-medium truncate">File uploaded</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">1 day ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-medium truncate">Profile updated</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">2 hours ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">In-App Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive notifications in the app</div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default UserProfile;

