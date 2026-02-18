import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  GitBranch,
  Clock,
  User,
  AlertTriangle,
  TrendingUp,
  FileText,
  Edit,
  Eye,
  Sparkles,
  ChevronRight,
  Calendar,
  Tag,
  Activity,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchRulesData,
  Rule,
  createRuleChangeRequest,
  fetchRuleChangeRequests,
  ChangeRequest,
  reviewRuleChange,
  fetchRuleVersions,
} from "@/components/RuleBook/RulesApi";
import { apiGet, parseJsonResponse } from "@/services/api";
import RequestChangeDialog from "@/components/RuleBook/Requestchangedialog";
import ViewChangeRequestDialog from "@/components/RuleBook/Viewchangerequestdialog";
import { useToast } from "@/hooks/use-toast";

export default function Rules() {
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTabMenuOpen, setMobileTabMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [Rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [botNames, setBotNames] = useState<
    Array<{ Bot_Id: number; Name: string }>
  >([]);
  const [requestChangeDialogOpen, setRequestChangeDialogOpen] = useState(false);
  const [viewChangeRequestDialogOpen, setViewChangeRequestDialogOpen] = useState(false);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<ChangeRequest | null>(null);
  const { toast } = useToast();
  const [currentRuleChangeRequests, setCurrentRuleChangeRequests] = useState<
    ChangeRequest[]
  >([]);
  const [allPendingChangeRequests, setAllPendingChangeRequests] = useState<
    ChangeRequest[]
  >([]);

  const [ruleVersions, setRuleVersions] = useState<any[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [ruleVersionMap, setRuleVersionMap] = useState<Record<string, any>>({});
  const [impactData, setImpactData] = useState<any>(null);
  const [recommendationsData, setRecommendationsData] = useState<any>(null);
  const [dataPreloaded, setDataPreloaded] = useState(false);


  const getBotIdFromFilter = () => {
    if (filterCompany === "all") return undefined;
    return botNames.find((b) => b.Name === filterCompany)?.Bot_Id;
  };

  useEffect(() => {
    const loadRules = async () => {
      setLoading(true);
      try {
        const rulesArray = await fetchRulesData();
        setRules(rulesArray);

        if (rulesArray.length > 0) {
          setSelectedRule(rulesArray[0]);
        }
      } catch (error) {
        console.error("Failed to load rules from API:", error);
        toast({
          title: "Error",
          description: "Failed to load rules. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  // Load all pending change requests for badge display
  useEffect(() => {
    const loadAllPendingRequests = async () => {
      try {
        const requests = await fetchRuleChangeRequests("Pending");
        setAllPendingChangeRequests(requests || []);
      } catch (error) {
        console.error("Failed to load pending change requests:", error);
      }
    };

    loadAllPendingRequests();
  }, []);

  // Fetch bot / company list for filters
  useEffect(() => {
    const fetchBotNames = async () => {
      try {
        const response = await apiGet("/api/bots");
        const data = await parseJsonResponse(response);

        if (data.success && Array.isArray(data.data)) {
          setBotNames(data.data);
        } else {
          console.warn("Bots API response missing or invalid data:", data);
          setBotNames([]);
        }
      } catch (error) {
        console.error("Error fetching bot names:", error);
        setBotNames([]);
      }
    };

    fetchBotNames();
  }, []);

  useEffect(() => {
    const loadFilteredRules = async () => {
      setLoading(true);
      try {
        const botId = getBotIdFromFilter();
        const rulesArray = await fetchRulesData(botId);
        setRules(rulesArray);

        if (rulesArray.length > 0) {
          setSelectedRule(rulesArray[0]);
        } else {
          setSelectedRule(null);
        }
      } catch (error) {
        console.error("Failed to filter rules:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFilteredRules();
  }, [filterCompany]);

  // Load version data for all rules to display in list
  useEffect(() => {
    const loadAllRuleVersions = async () => {
      if (Rules.length === 0) return;

      const versionMap: Record<string, any> = {};

      for (const rule of Rules) {
        try {
          const versions = await fetchRuleVersions(Number(rule.RuleId));
          if (versions && versions.length > 0) {
            // Store the latest (active) version for this rule
            versionMap[rule.RuleId] = versions[0];
          }
        } catch (error) {
          console.error(`Failed to load versions for rule ${rule.RuleId}:`, error);
        }
      }

      setRuleVersionMap(versionMap);
    };

    loadAllRuleVersions();
  }, [Rules]);

  useEffect(() => {
    const loadVersions = async () => {
      if (!selectedRule) {
        return;
      }

      setVersionsLoading(true);
      try {
        const versions = await fetchRuleVersions(Number(selectedRule.RuleId));
        setRuleVersions(versions || []);
      } catch (error) {
        console.error("Failed to load rule versions:", error);
        setRuleVersions([]);
      } finally {
        setVersionsLoading(false);
      }
    };

    loadVersions();
  }, [selectedRule]); // Removed activeTab dependency - load immediately when rule is selected

  // Preload all tab data in background when rule is selected
  useEffect(() => {
    const preloadAllTabData = async () => {
      if (!selectedRule) {
        setDataPreloaded(false);
        setImpactData(null);
        setRecommendationsData(null);
        return;
      }

      // Mark as loading
      setDataPreloaded(false);

      try {
        // You can add actual API calls here when you have them
        // For now, setting placeholder data structure

        // Simulate loading impact data
        // const impact = await fetchImpactData(selectedRule.RuleId);
        setImpactData({
          processesAffected: 3,
          avgProcessingTime: "2.4 min",
          dailyVolume: "1,247 transactions",
          successRateTrend: "+2.3%",
          exceptionTrend: "+15%",
          slaCompliance: "-3.2%",
        });

        // Simulate loading recommendations data
        // const recommendations = await fetchRecommendations(selectedRule.RuleId);
        setRecommendationsData({
          highPriority: {
            title: "High Exception Rate Detected",
            description: "The current validation logic is causing a 15% increase in exceptions. Consider updating the approval threshold from $10,000 to $12,000 based on recent patterns.",
          },
          optimization: {
            title: "Performance Optimization",
            description: "Adding a vendor whitelist check could reduce processing time by 23% and improve SLA compliance to 92%.",
          },
        });

        setDataPreloaded(true);
      } catch (error) {
        console.error("Failed to preload tab data:", error);
        setDataPreloaded(true); // Still mark as done even if failed
      }
    };

    preloadAllTabData();
  }, [selectedRule]);


  const filteredRules = Rules.filter((rule) => {
    const matchesSearch =
      rule.Subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.Description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Rule Applied":
        return "bg-success text-success-foreground";
      case "Pending":
        return "bg-warning text-warning-foreground";
      case "Draft":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-warning";
      case "low":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  const handleRequestChange = () => {
    if (!selectedRule) {
      toast({
        title: "No Rule Selected",
        description: "Please select a rule to request changes.",
        variant: "destructive",
      });
      return;
    }
    setRequestChangeDialogOpen(true);
  };

  const handleSubmitChangeRequest = async (data: any) => {
    try {
      const response = await createRuleChangeRequest(data);

      toast({
        title: "Success",
        description: "Change request submitted successfully. It will be reviewed by the approval team.",
      });

      // Reload all pending change requests to update badges on all rule cards
      try {
        const allPending = await fetchRuleChangeRequests("Pending");
        setAllPendingChangeRequests(allPending || []);
      } catch (e) {
        console.error("Failed to refresh all pending change requests:", e);
      }

      // Reload change requests for the current rule so UI reflects new pending request
      if (selectedRule) {
        try {
          const updated = await fetchRuleChangeRequests(
            "Pending",
            Number(selectedRule.RuleId)
          );
          setCurrentRuleChangeRequests(updated || []);
        } catch (e) {
          console.error("Failed to refresh change requests:", e);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit change request",
        variant: "destructive",
      });
      throw error; // Re-throw to let dialog handle it
    }
  };

  const handleReviewChange = async (requestId: number, action: "Approve" | "Reject") => {
    try {
      await reviewRuleChange(requestId, action);
      toast({
        title: "Success",
        description: `Request ${action.toLowerCase()}ed successfully.`,
      });

      // Refresh all pending change requests for badge display
      try {
        const allPending = await fetchRuleChangeRequests("Pending");
        setAllPendingChangeRequests(allPending || []);
      } catch (e) {
        console.error("Failed to refresh all pending change requests:", e);
      }

      // Refresh change requests for the current rule
      if (selectedRule) {
        try {
          const updated = await fetchRuleChangeRequests(
            "Pending",
            Number(selectedRule.RuleId)
          );
          setCurrentRuleChangeRequests(updated || []);
        } catch (e) {
          console.error("Failed to refresh change requests:", e);
        }
      }

      // If approved, refresh the rules list and version data to show updated version
      if (action === "Approve") {
        try {
          const botId = getBotIdFromFilter();
          const rulesArray = await fetchRulesData(botId);
          setRules(rulesArray);

          // Refresh version map for all rules
          const versionMap: Record<string, any> = {};
          for (const rule of rulesArray) {
            try {
              const versions = await fetchRuleVersions(Number(rule.RuleId));
              if (versions && versions.length > 0) {
                versionMap[rule.RuleId] = versions[0];
              }
            } catch (error) {
              console.error(`Failed to load versions for rule ${rule.RuleId}:`, error);
            }
          }
          setRuleVersionMap(versionMap);

          // If we're viewing the versions tab, refresh those too
          if (selectedRule && activeTab === "versions") {
            const versions = await fetchRuleVersions(Number(selectedRule.RuleId));
            setRuleVersions(versions || []);
          }
        } catch (error) {
          console.error("Failed to refresh rules after approval:", error);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action.toLowerCase()} request`,
        variant: "destructive",
      });
    }
  };


  useEffect(() => {
    const loadForRule = async () => {
      if (!selectedRule) {
        setCurrentRuleChangeRequests([]);
        return;
      }
      try {
        const list = await fetchRuleChangeRequests(
          "Pending",               // Fetch only pending requests (optional)
          Number(selectedRule.RuleId)  // Current rule ID
        );
        setCurrentRuleChangeRequests(list || []);
      } catch (error) {
        console.error("Failed to load change requests for rule:", error);
        setCurrentRuleChangeRequests([]);
      }
    };

    loadForRule();
  }, [selectedRule]);


  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="p-6 flex-none">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-0 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Digital Rule Book
            </h1>
            <p className="text-base lg:text-base text-muted-foreground">
              Version-controlled process rules and governance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Insights
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Rules List Panel */}
          <Card className="lg:col-span-1 bg-gradient-card shadow-card flex flex-col h-full overflow-hidden">
            <CardHeader className="pb-4 pt-4 flex-none">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5" />
                Process Rules
              </CardTitle>

              {/* Search and Filters */}
              <div className="space-y-3">
                {/* Search + desktop filter on one line (desktop), stacked on mobile */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Desktop Process filter (hidden on mobile) */}
                  <div className="hidden lg:block lg:w-32 xl:w-48">
                    <Select
                      value={filterCompany}
                      onValueChange={setFilterCompany}
                    >
                      <SelectTrigger className="w-full group relative">
                        <SelectValue className="truncate">
                          {filterCompany === "all"
                            ? "All Processes"
                            : filterCompany.length > 16
                              ? filterCompany.substring(0, 16) + "..."
                              : filterCompany}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="all">Process</SelectItem>
                        {botNames.map((bot) => (
                          <SelectItem key={bot.Bot_Id} value={bot.Name}>
                            {bot.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Mobile Filter Menu */}
                <div className="lg:hidden">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    <span>Filters</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Button>

                  {mobileMenuOpen && (
                    <div className="mt-2 p-4 bg-card border rounded-lg space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Company
                        </label>
                        <Select
                          value={filterCompany}
                          onValueChange={setFilterCompany}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Processes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Processes</SelectItem>
                            {botNames.map((bot) => (
                              <SelectItem key={bot.Bot_Id} value={bot.Name}>
                                {bot.Name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-hidden min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-3 p-4">
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading rules...
                    </div>
                  ) : filteredRules.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No rules found
                    </div>
                  ) : (
                    filteredRules.map((rule) => {
                      const hasPendingChange = !!allPendingChangeRequests.find(
                        (req) => String(req.RuleId) === String(rule.RuleId)
                      );

                      // Get version data for this rule
                      // const versionNumber = rule.CurrentVersionNumber || 1;
                      const isActive = true;
                      const exceptionCount = hasPendingChange ? 1 : 0; // Placeholder - can be enhanced with actual exception data

                      return (
                        <div
                          key={rule.RuleId}
                          onClick={() => setSelectedRule(rule)}
                          className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 shadow-sm ${selectedRule?.RuleId === rule.RuleId
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50 hover:bg-muted/30"
                            }`}
                        >
                          {/* Header Row */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                              {/* Title */}
                              <h3 className="text-sm font-bold text-foreground truncate mb-1">
                                {rule.Subject}
                              </h3>
                              {/* Subtitle */}
                              <p className="text-xs text-muted-foreground truncate">
                                {rule.BotName}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                          </div>

                          {/* Badges Row */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {isActive ? (
                              <Badge className="bg-success/20 text-success border-success/30 text-[10px] px-2 py-0.5">
                                active
                              </Badge>
                            ) : (
                              <Badge className="bg-muted/50 text-muted-foreground border-muted text-[10px] px-2 py-0.5">
                                inactive
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary">
                              v{rule.CurrentVersionNumber}.0
                            </Badge>
                            {hasPendingChange && (
                              <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px] px-2 py-0.5">
                                Change Requested
                              </Badge>
                            )}
                          </div>

                          {/* Meta Information Row */}
                          <div className="space-y-2 text-xs">
                            {/* Owner */}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span className="truncate">
                                {rule.ProcessOwner || "Unassigned"}
                              </span>
                            </div>

                            {/* Exceptions */}
                            {/* <div className="flex items-center gap-2">
                              <AlertTriangle
                                className={`w-3 h-3 ${
                                  exceptionCount > 10
                                    ? "text-destructive"
                                    : exceptionCount > 0
                                    ? "text-warning"
                                    : "text-success"
                                }`}
                              />
                              <span
                                className={
                                  exceptionCount > 10
                                    ? "text-destructive"
                                    : exceptionCount > 0
                                    ? "text-warning"
                                    : "text-success"
                                }
                              >
                                {exceptionCount} exceptions
                              </span>
                            </div> */}

                            {/* Date and SLA Row */}
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {rule.CreatedOn ? formatDate(rule.CreatedOn) : "—"}
                                </span>
                              </div>
                              {/* <div className="flex items-center gap-1 text-success">
                                <TrendingUp className="w-3 h-3" />
                                <span>85% SLA</span>
                              </div> */}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Rule Details Panel */}
          <Card className="lg:col-span-2 bg-gradient-card shadow-card flex flex-col h-full overflow-hidden">
            <CardHeader className="pb-4 flex-none">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Desktop Action Buttons */}
                <div className="hidden lg:flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View Exceptions
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Optimize
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-primary gap-2"
                    onClick={handleRequestChange}
                    disabled={!selectedRule}
                  >
                    <Edit className="w-4 h-4" />
                    Request Change
                  </Button>
                </div>

                {/* Mobile Action Buttons */}
                <div className="lg:hidden">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                    >
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span className="hidden sm:inline">AI</span>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-primary gap-1 text-xs"
                      onClick={handleRequestChange}
                      disabled={!selectedRule}
                    >
                      <Edit className="w-3 h-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Desktop Tabs */}
              <div className="hidden lg:block flex-none">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="space-y-4 h-full flex flex-col"
                >
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="versions">Version History</TabsTrigger>
                    <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
                    <TabsTrigger value="recommendations">
                      AI Insights
                    </TabsTrigger>
                  </TabsList>

                  {/* Scrollable Content Area for Tabs */}
                  <ScrollArea className="flex-1 -mr-4 pr-4">
                    <TabsContent value="details" className="mt-4 space-y-4">
                      <div className="grid gap-4">
                        <Card className="border-border/70 shadow-sm bg-gradient-to-br from-white via-slate-50 to-slate-100/60 rounded-xl">
                          <CardHeader className="pb-3 pt-3 border-b border-border/60 bg-white/70 backdrop-blur-sm rounded-t-xl">
                            <CardTitle className="text-base font-semibold tracking-wide">
                              Rule Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm px-6 py-4">
                            <div className="flex justify-between pt-1">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Rule ID:
                              </span>
                              <span className="font-mono text-foreground">
                                {selectedRule?.RuleId ? selectedRule.RuleId : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Process:
                              </span>
                              <span className="font-medium">
                                {selectedRule?.BotName ? selectedRule.BotName : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Created On
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {selectedRule?.CreatedOn
                                  ? formatDate(selectedRule.CreatedOn)
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Process Owner
                              </span>
                              <span className="font-medium">
                                {selectedRule?.ProcessOwner
                                  ? selectedRule.ProcessOwner
                                  : "—"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="shadow-md border-border/70 rounded-xl">
                        <CardHeader className="pb-4 pt-3 bg-white/70 backdrop-blur-sm rounded-t-xl border-b border-border/60">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <h4 className="text-base font-semibold">Rule</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {selectedRule?.Description || "Select a rule"}
                              </p>
                            </div>

                            <Separator />
                          </div>
                        </CardHeader>

                        <CardContent className="pt-4 pb-5 px-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <h4 className="text-base font-semibold">Subject</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {selectedRule?.Subject || ""}
                              </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <h4 className="text-base font-semibold">
                                Description
                              </h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {selectedRule?.Description || ""}
                              </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <h4 className="text-base font-semibold">
                                Rule Logic
                              </h4>
                              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm border">
                                <div className="space-y-1">
                                  {selectedRule?.RuleLogic ||
                                    "No rule logic available"}
                                </div>
                              </div>
                            </div>

                            {/* Change Requests for this Rule */}
                            {currentRuleChangeRequests.length > 0 && (
                              <>
                                <Separator />
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-base font-semibold">Pending Change Requests</h4>
                                    <Badge className="bg-warning/20 text-warning border-warning/30">
                                      {currentRuleChangeRequests.length} Pending
                                    </Badge>
                                  </div>
                                  <div className="space-y-2">
                                    {currentRuleChangeRequests.map((req) => (
                                      <Card
                                        key={req.RequestId}
                                        className="border-warning/30 bg-gradient-to-r from-warning/5 to-transparent hover:shadow-md transition-shadow"
                                      >
                                        <CardContent className="p-4 space-y-3">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                              <h5 className="font-semibold text-sm mb-1">
                                                {req.ProposedSubject || req.ChangeSummary || "Change Request"}
                                              </h5>
                                              <p className="text-xs text-muted-foreground line-clamp-2">
                                                {req.ChangeSummary}
                                              </p>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 flex-shrink-0">
                                              {req.Status}
                                            </Badge>
                                          </div>

                                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <User className="w-3 h-3" />
                                              <span>{req.RequestedByName}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              <span>
                                                {new Date(req.RequestedOn).toLocaleDateString("en-IN", {
                                                  day: "2-digit",
                                                  month: "short",
                                                  year: "numeric",
                                                })}
                                              </span>
                                            </div>
                                          </div>

                                          {req.Status === "Pending" && (
                                            <div className="flex items-center gap-2 pt-2">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 h-8"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedChangeRequest(req);
                                                  setViewChangeRequestDialogOpen(true);
                                                }}
                                              >
                                                <Eye className="w-3.5 h-3.5 mr-1" />
                                                View Details
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 px-3 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleReviewChange(req.RequestId, "Reject");
                                                }}
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                className="h-8 px-3 bg-success hover:bg-success/90 text-white"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleReviewChange(req.RequestId, "Approve");
                                                }}
                                              >
                                                <Check className="w-3.5 h-3.5" />
                                              </Button>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}

                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="versions" className="mt-4 space-y-4">
                      {versionsLoading ? (
                        <div className="text-sm text-muted-foreground">Loading versions...</div>
                      ) : ruleVersions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No version history found.</div>
                      ) : (
                        <div className="space-y-3">
                          {ruleVersions.map((version: any, index: number) => {
                            const isCurrent = version.IsActive || index === 0;

                            return (
                              <Card key={version.VersionId || index}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <GitBranch className="w-4 h-4 text-primary" />
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">
                                            v{version.VersionNumber || index + 1}
                                          </span>
                                          {isCurrent && (
                                            <Badge className="bg-success text-success-foreground">
                                              Active
                                            </Badge>
                                          )}
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                          {version.ChangeSummary || "Rule updated"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="text-right flex flex-col gap-1">
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <User className="w-3 h-3" />
                                        {version.CreatedByName || "System"}
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        {version.CreatedOn
                                          ? new Date(version.CreatedOn).toLocaleDateString("en-IN")
                                          : "—"}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="impact" className="mt-4 space-y-4">
                      {!dataPreloaded ? (
                        <div className="text-sm text-muted-foreground">Loading impact analysis...</div>
                      ) : impactData ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Process Impact
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Processes Affected:
                                </span>
                                <span className="font-semibold">{impactData.processesAffected}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Avg Processing Time:
                                </span>
                                <span className="font-semibold">{impactData.avgProcessingTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Daily Volume:
                                </span>
                                <span className="font-semibold">
                                  {impactData.dailyVolume}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Performance Trends
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Success Rate Trend:
                                </span>
                                <span className="font-semibold text-success">
                                  {impactData.successRateTrend}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Exception Trend:
                                </span>
                                <span className="font-semibold text-destructive">
                                  {impactData.exceptionTrend}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  SLA Compliance:
                                </span>
                                <span className="font-semibold text-warning">
                                  {impactData.slaCompliance}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No impact data available.</div>
                      )}
                    </TabsContent>

                    <TabsContent value="recommendations" className="mt-4 space-y-4">
                      {!dataPreloaded ? (
                        <div className="text-sm text-muted-foreground">Loading AI insights...</div>
                      ) : recommendationsData ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              AI-Generated Recommendations
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-4 border border-warning/20 bg-warning/5 rounded-lg">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-warning">
                                    {recommendationsData.highPriority.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {recommendationsData.highPriority.description}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-3"
                                  >
                                    Apply Recommendation
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                              <div className="flex items-start gap-3">
                                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-primary">
                                    {recommendationsData.optimization.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {recommendationsData.optimization.description}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-3"
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="text-sm text-muted-foreground">No recommendations available.</div>
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </div>

              {/* Mobile Tab Menu */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setMobileTabMenuOpen(!mobileTabMenuOpen)}
                >
                  <span>
                    {activeTab === "details"
                      ? "Details"
                      : activeTab === "versions"
                        ? "Version History"
                        : activeTab === "impact"
                          ? "Impact Analysis"
                          : "AI Insights"}
                  </span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Button>

                {mobileTabMenuOpen && (
                  <div className="mt-2 p-4 bg-card border rounded-lg space-y-2">
                    <Button variant={activeTab === "details" ? "default" : "ghost"} onClick={() => { setActiveTab("details"); setMobileTabMenuOpen(false); }} className="w-full justify-start">Details</Button>
                    <Button variant={activeTab === "versions" ? "default" : "ghost"} onClick={() => { setActiveTab("versions"); setMobileTabMenuOpen(false); }} className="w-full justify-start">Version History</Button>
                    <Button variant={activeTab === "impact" ? "default" : "ghost"} onClick={() => { setActiveTab("impact"); setMobileTabMenuOpen(false); }} className="w-full justify-start">Impact Analysis</Button>
                    <Button variant={activeTab === "recommendations" ? "default" : "ghost"} onClick={() => { setActiveTab("recommendations"); setMobileTabMenuOpen(false); }} className="w-full justify-start">AI Insights</Button>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      <RequestChangeDialog
        open={requestChangeDialogOpen}
        onOpenChange={setRequestChangeDialogOpen}
        rule={selectedRule}
        onSubmit={handleSubmitChangeRequest}
      />

      <ViewChangeRequestDialog
        open={viewChangeRequestDialogOpen}
        onOpenChange={setViewChangeRequestDialogOpen}
        changeRequest={selectedChangeRequest}
        onApprove={
          selectedChangeRequest
            ? () => handleReviewChange(selectedChangeRequest.RequestId, "Approve")
            : undefined
        }
        onReject={
          selectedChangeRequest
            ? () => handleReviewChange(selectedChangeRequest.RequestId, "Reject")
            : undefined
        }
      />
    </div>
  );
}