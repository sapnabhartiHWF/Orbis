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
import { fetchRulesData, Rule } from "@/RuleBook/RulesApi";
// Mock data for rules
const mockRules = [
  {
    id: "RULE-001",
    name: "Invoice Processing Validation",
    process: "Invoice Processing",
    version: "v2.3",
    status: "active",
    lastUpdated: "2024-01-15",
    owner: "Sarah Chen",
    department: "Finance",
    criticality: "high",
    exceptions: 12,
    slaImpact: "85%",
    description:
      "Validates invoice format, vendor information, and approval limits before processing",
    category: "Validation",
    versions: [
      {
        version: "v2.3",
        date: "2024-01-15",
        author: "Sarah Chen",
        changes: "Added currency validation",
        status: "active",
      },
      {
        version: "v2.2",
        date: "2024-01-10",
        author: "Mike Johnson",
        changes: "Updated approval thresholds",
        status: "archived",
      },
      {
        version: "v2.1",
        date: "2024-01-05",
        author: "Sarah Chen",
        changes: "Fixed validation logic",
        status: "archived",
      },
    ],
  },
  {
    id: "RULE-002",
    name: "Customer Data Enrichment",
    process: "Customer Onboarding",
    version: "v1.5",
    status: "active",
    lastUpdated: "2024-01-12",
    owner: "David Liu",
    department: "Sales",
    criticality: "medium",
    exceptions: 3,
    slaImpact: "92%",
    description:
      "Enriches customer data from external sources and validates completeness",
    category: "Data Processing",
    versions: [
      {
        version: "v1.5",
        date: "2024-01-12",
        author: "David Liu",
        changes: "Added LinkedIn integration",
        status: "active",
      },
      {
        version: "v1.4",
        date: "2024-01-08",
        author: "Anna Smith",
        changes: "Improved data matching",
        status: "archived",
      },
    ],
  },
  {
    id: "RULE-003",
    name: "Report Generation Logic",
    process: "Report Generation",
    version: "v3.1",
    status: "deprecated",
    lastUpdated: "2024-01-08",
    owner: "Mike Johnson",
    department: "Operations",
    criticality: "low",
    exceptions: 28,
    slaImpact: "67%",
    description:
      "Generates monthly financial reports with automated data aggregation",
    category: "Reporting",
    versions: [
      {
        version: "v3.1",
        date: "2024-01-08",
        author: "Mike Johnson",
        changes: "Performance optimizations",
        status: "deprecated",
      },
      {
        version: "v3.0",
        date: "2024-01-01",
        author: "Mike Johnson",
        changes: "Major refactor",
        status: "archived",
      },
    ],
  },
];

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

  useEffect(() => {
    const loadRules = async () => {
      setLoading(true);
      try {
        const data = await fetchRulesData();
        // console.log("API Rules loaded:", data);
        // console.log("Data type:", typeof data);
        // console.log(
        //   "Data length:",
        //   Array.isArray(data) ? data.length : "Not an array"
        // );
        // Extract the rules array from the response object
        const rulesArray = data.message || [];
        console.log("Rules array:", rulesArray);
        setRules(rulesArray);

        // Set the first rule as default selected rule
        if (rulesArray.length > 0) {
          setSelectedRule(rulesArray[0]);
        }
      } catch (error) {
        console.error("Failed to load rules from API:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  const filteredRules = Rules.filter((rule) => {
    const matchesSearch =
      rule.rule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.rule_process_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      filterDepartment === "all" || rule.rule_stage === filterDepartment;
    const matchesStatus =
      filterStatus === "all" || rule.rule_status === filterStatus;
    const matchesCompany =
      filterCompany === "all" || rule.rule_process_name === filterCompany;
    const matchesCountry =
      filterCountry === "all" || rule.rule_process_name.includes(filterCountry);
    return matchesSearch && matchesDepartment && matchesStatus && matchesCompany && matchesCountry;
  });

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

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
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
            <Button className="bg-gradient-primary gap-2">
              <Plus className="w-4 h-4" />
              New Rule
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules List Panel */}
          <Card className="lg:col-span-1 bg-gradient-card shadow-card">
            <CardHeader className="pb-4 pt-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5" />
                Process Rules
              </CardTitle>

              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                                {/* Desktop Filters */}
                <div className="hidden lg:flex gap-2">
                  <Select
                    value={filterDepartment}
                    onValueChange={setFilterDepartment}
                  >
                    <SelectTrigger className="flex-1 min-w-0 group relative">
                      <SelectValue className="truncate">
                        {filterDepartment === "all" ? "All..." : 
                         filterDepartment.length > 8 ? filterDepartment.substring(0, 8) + "..." : filterDepartment}
                      </SelectValue>
                      <div className="absolute top-full left-0 mt-1 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                        All Stages
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="Invoice">Invoice</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="flex-1 min-w-0 group relative">
                      <SelectValue className="truncate">
                        {filterStatus === "all" ? "All..." : 
                         filterStatus.length > 8 ? filterStatus.substring(0, 8) + "..." : filterStatus}
                      </SelectValue>
                      <div className="absolute top-full left-0 mt-1 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                        All Status
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Rule Applied">Rule Applied</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCompany} onValueChange={setFilterCompany}>
                    <SelectTrigger className="flex-1 min-w-0 group relative">
                      <SelectValue className="truncate">
                        {filterCompany === "all" ? "All..." : 
                         filterCompany.length > 8 ? filterCompany.substring(0, 8) + "..." : filterCompany}
                      </SelectValue>
                      <div className="absolute top-full left-0 mt-1 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                        All Companies
                      </div>
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="all">All Companies</SelectItem>
                      <SelectItem value="Santova Logistics SA">Santova Logistics SA</SelectItem>
                      <SelectItem value="Santova Logistics UK">Santova Logistics UK</SelectItem>
                      <SelectItem value="Santova Logistics US">Santova Logistics US</SelectItem>
                      <SelectItem value="Santova Logistics AU">Santova Logistics AU</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCountry} onValueChange={setFilterCountry}>
                    <SelectTrigger className="flex-1 min-w-0 group relative">
                      <SelectValue className="truncate">
                        {filterCountry === "all" ? "All..." : 
                         filterCountry.length > 8 ? filterCountry.substring(0, 8) + "..." : filterCountry}
                      </SelectValue>
                      <div className="absolute top-full left-0 mt-1 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                        All Countries
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="South Africa">South Africa</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mobile Filter Menu */}
                <div className="lg:hidden">
                  <Button variant="outline" className="w-full justify-between" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <span>Filters</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                  
                  {mobileMenuOpen && (
                    <div className="mt-2 p-4 bg-card border rounded-lg space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Department</label>
                        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Stages" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Stages</SelectItem>
                            <SelectItem value="Invoice">Invoice</SelectItem>
                            <SelectItem value="Billing">Billing</SelectItem>
                            <SelectItem value="Processing">Processing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Status</label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Rule Applied">Rule Applied</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Company</label>
                        <Select value={filterCompany} onValueChange={setFilterCompany}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Companies" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Companies</SelectItem>
                            <SelectItem value="Santova Logistics SA">Santova Logistics SA</SelectItem>
                            <SelectItem value="Santova Logistics UK">Santova Logistics UK</SelectItem>
                            <SelectItem value="Santova Logistics US">Santova Logistics US</SelectItem>
                            <SelectItem value="Santova Logistics AU">Santova Logistics AU</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Country</label>
                        <Select value={filterCountry} onValueChange={setFilterCountry}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Countries" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                            <SelectItem value="South Africa">South Africa</SelectItem>
                            <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                            <SelectItem value="Germany">Germany</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[600px] pr-4">
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
                    filteredRules.map((rule) => (
                      <div
                        key={rule.rule_id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedRule?.rule_id === rule.rule_id
                            ? "border-primary bg-primary/5 shadow-glow"
                            : "border-border hover:border-primary/50 hover:bg-muted/30"
                        }`}
                        onClick={() => setSelectedRule(rule)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground truncate">
                              {rule.rule_process_name}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(rule.rule_status)}>
                            {rule.rule_status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {rule.rule_version}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {rule.rule_process_owner}
                          </span>
                          {/* <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {rule.rule_stage}
                          </span> */}
                        </div>

                        <div className="flex items-center justify-between mt-2 text-xs min-w-0">
                          <span className="flex items-center gap-1 text-muted-foreground flex-1 truncate">
                            <FileText className="w-3 h-3" />
                            {rule.rule_subject}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Rule Details Panel */}
          <Card className="lg:col-span-2 bg-gradient-card shadow-card">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {/* <GitBranch className="w-5 h-5" /> */}
                    {/* {selectedRule?.rule || "Select a rule"} */}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={getStatusColor(
                        selectedRule?.rule_status || ""
                      )}
                    >
                      {selectedRule?.rule_status || ""}
                    </Badge>
                    <Badge variant="outline">
                      {selectedRule?.rule_version || ""}
                    </Badge>
                    <Badge variant="outline">
                      {selectedRule?.rule_stage || ""}
                    </Badge>
                  </div>
                </div>

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
                  <Button size="sm" className="bg-gradient-primary gap-2">
                    <Edit className="w-4 h-4" />
                    Request Change
                  </Button>
                </div>

                {/* Mobile Action Buttons */}
                <div className="lg:hidden">
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <Sparkles className="w-3 h-3" />
                      <span className="hidden sm:inline">AI</span>
                    </Button>
                    <Button size="sm" className="bg-gradient-primary gap-1 text-xs">
                      <Edit className="w-3 h-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Desktop Tabs */}
              <div className="hidden lg:block">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="versions">Version History</TabsTrigger>
                    <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
                    <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Mobile Tab Menu */}
              <div className="lg:hidden">
                <Button variant="outline" className="w-full justify-between" onClick={() => setMobileTabMenuOpen(!mobileTabMenuOpen)}>
                  <span>{activeTab === "details" ? "Details" : activeTab === "versions" ? "Version History" : activeTab === "impact" ? "Impact Analysis" : "AI Insights"}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                
                {mobileTabMenuOpen && (
                  <div className="mt-2 p-4 bg-card border rounded-lg space-y-2">
                    <Button 
                      variant={activeTab === "details" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab("details");
                        setMobileTabMenuOpen(false);
                      }}
                    >
                      Details
                    </Button>
                    <Button 
                      variant={activeTab === "versions" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab("versions");
                        setMobileTabMenuOpen(false);
                      }}
                    >
                      Version History
                    </Button>
                    <Button 
                      variant={activeTab === "impact" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab("impact");
                        setMobileTabMenuOpen(false);
                      }}
                    >
                      Impact Analysis
                    </Button>
                    <Button 
                      variant={activeTab === "recommendations" ? "default" : "ghost"} 
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab("recommendations");
                        setMobileTabMenuOpen(false);
                      }}
                    >
                      AI Insights
                    </Button>
                  </div>
                )}
              </div>

              <Tabs value={activeTab} className="space-y-4">

                <TabsContent value="details" className="space-y-4">
                  <div className="grid gap-4 ">
                    <Card >
                      <CardHeader className="pb-3 pt-3 border solid">
                        <CardTitle className="text-base">
                          Rule Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between pt-3">
                          <span className="text-muted-foreground">
                            Rule ID:
                          </span>
                          <span className="font-mono">
                            {selectedRule?.rule_id || ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Process:
                          </span>
                          <span>{selectedRule?.rule_process_name || ""}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stage:</span>
                          <span>{selectedRule?.rule_stage || ""}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Owner:</span>
                          <span>{selectedRule?.rule_process_owner || ""}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Performance Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Version:
                          </span>
                          <span className="font-semibold text-success">
                            {selectedRule?.rule_version || ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-semibold text-primary">
                            {selectedRule?.rule_status || ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stage:</span>
                          <Badge variant="outline" className="text-primary">
                            {selectedRule?.rule_stage || ""}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Success Rate:
                          </span>
                          <span className="font-semibold text-success">
                            94.2%
                          </span>
                        </div>
                      </CardContent>
                    </Card> */}
                  </div>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-4 pt-3">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-base font-semibold">Rule</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedRule?.rule || "Select a rule"}
                          </p>
                        </div>

                        <Separator />
                        
                        {/* <div className="space-y-2">
                          <CardTitle className="text-base">Rule Description</CardTitle>
                          <p className="text-muted-foreground leading-relaxed text-sm">
                            {selectedRule?.rule_description || ""}
                          </p>
                        </div> */}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* <Separator className="mb-4" /> */}
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-base font-semibold">Subject</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedRule?.rule_subject || ""}
                          </p>
                        </div>

                        {/* <Separator /> */}

                        {/* <div className="space-y-2">
                          <h4 className="text-base font-semibold">Rule Logic</h4>
                          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm border">
                            <div className="space-y-1">
                              <div>IF invoice.amount {">"} 10000 AND vendor.approved = true</div>
                              <div>THEN require_approval = true</div>
                              <div>ELSE auto_approve = true</div>
                            </div>
                          </div>
                        </div> */}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="versions" className="space-y-4">
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <GitBranch className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {selectedRule?.rule_version || ""}
                                </span>
                                <Badge className="bg-success text-success-foreground">
                                  Current
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Latest version of the rule
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              {selectedRule?.rule_process_owner || ""}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              Current
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="impact" className="space-y-4">
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
                          <span className="font-semibold">3</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Avg Processing Time:
                          </span>
                          <span className="font-semibold">2.4 min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Daily Volume:
                          </span>
                          <span className="font-semibold">
                            1,247 transactions
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
                            +2.3%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Exception Trend:
                          </span>
                          <span className="font-semibold text-destructive">
                            +15%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            SLA Compliance:
                          </span>
                          <span className="font-semibold text-warning">
                            -3.2%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
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
                              High Exception Rate Detected
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              The current validation logic is causing a 15%
                              increase in exceptions. Consider updating the
                              approval threshold from $10,000 to $12,000 based
                              on recent patterns.
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
                              Performance Optimization
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Adding a vendor whitelist check could reduce
                              processing time by 23% and improve SLA compliance
                              to 92%.
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
