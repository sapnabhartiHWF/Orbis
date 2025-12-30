import { 
  ClipboardList,
  CheckCircle,
  Check,
  Link2,
  AlertTriangle,
  FileText,
  TrendingUp,
  TestTube,
  Lock,
  DraftingCompass,
  Map,
  Upload,
  Building,
  Users,
  Target,
  CheckSquare,
  Plus,
  Save,
  RotateCw
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"

export type ProcessStage = 
  | "Process Registration"
  | "Initial Triage"
  | "System Integration"
  | "To-Be Design"
  | "Approval"
  | "Development"
  | "User Acceptance Testing (HWF)"
  | "Go-Live & Deployment (HWF)"
  | "Hypercare & Stabilization (HWF)"
  | "Handover to BAU Support"

export interface Process {
  id: string
  title: string
  description: string
  department: string
  priority: "Low" | "Medium" | "High" | "Critical"
  expectedROI: number
  status: ProcessStage
  submittedBy: string
  submittedDate: string
  estimatedSavings: number
  complexity: "Low" | "Medium" | "High"
  dependencies: string[]
  tags: string[]
  stakeholders: string[]
  triageData?: {
    isRuleBased: boolean
    isStable: boolean
    volumes: string
    systemsInvolved: string[]
    applicationsCount: number
    blockers: string[]
    estimatedAutomationPercent: number
    initialROI: string
    feasibilityStatus: "Feasible" | "Not Feasible" | "Review Required"
    triageNotes: string
  }
  approvalData?: {
    businessOwnerApproval: "Approved" | "Rejected" | "Pending"
    rpaCoEApproval: "Approved" | "Rejected" | "Pending"
    comments?: {
      businessOwner: string
      rpaCoE: string
    }
    approvalNeedsReview?: boolean
  }
  toBeDesignData?: {
    workflowDiagram: string
    workflowDiagramFile?: File // File object for upload
    exceptionHandlingPlan: string
    exceptionHandlingPlanFile?: File // File object for upload
    retryMechanismRequired: boolean
    retryMechanismDetails: string
    credentialRequirements: string
    vmInfraNeeded: string
    orchestratorQueuesRequired: boolean
    loggingRequirements: string
    sddDocument: string
    sddApprovalStatus: "Approved" | "Pending"
  }
  sitData?: {
    testNotes: string
    credentialRequirements: string
  }
}

interface ProcessStageFormsProps {
  selectedProcess: Process
  triageData: {
    isRuleBased: boolean
    isStable: boolean
    volumes: string
    volumesCaptured: boolean
    systemsInvolved: string[]
    systemsIdentified: boolean
    applicationsCount: number
    blockers: string[]
    blockersIdentified: boolean
    estimatedAutomationPercent: number
    initialROI: string
    roiEstimated: boolean
    feasibilityStatus: "Feasible" | "Not Feasible" | "Review Required"
    feasibilityApproved: boolean
    triageNotes: string
  }
  setTriageData: React.Dispatch<React.SetStateAction<any>>
  sitData: {
    testNotes: string
    credentialRequirements: string
  }
  setSitData: React.Dispatch<React.SetStateAction<any>>
  toBeDesignData: {
    workflowDiagram: string
    workflowDiagramFile?: File // File object for upload
    exceptionHandlingPlan: string
    exceptionHandlingPlanFile?: File // File object for upload
    retryMechanismRequired: boolean
    retryMechanismDetails: string
    credentialRequirements: string
    vmInfraNeeded: string
    orchestratorQueuesRequired: boolean
    loggingRequirements: string
    sddDocument: string
    sddApprovalStatus: "Approved" | "Pending"
  }
  setToBeDesignData: React.Dispatch<React.SetStateAction<any>>
  approvalData: {
    businessOwnerApproval: "Approved" | "Rejected" | "Pending"
    rpaCoEApproval: "Approved" | "Rejected" | "Pending"
  }
  setOpenApprovalDialog: (dialog: string | null) => void
  getPriorityColor: (priority: string) => string
  onSaveApprovals?: () => void
  isSavingApprovals?: boolean
}

export function ProcessStageForms({
  selectedProcess,
  triageData,
  setTriageData,
  sitData,
  setSitData,
  toBeDesignData,
  setToBeDesignData,
  approvalData,
  setOpenApprovalDialog,
  getPriorityColor,
  onSaveApprovals,
  isSavingApprovals = false,
}: ProcessStageFormsProps) {
  return (
    <>
      {selectedProcess.status === "Initial Triage" && (
        <TabsContent value="triage" className="space-y-6 mt-6">
          <Card className="bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 via-card to-card border-2 border-blue-200/50 dark:border-blue-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 dark:from-blue-950/20 to-transparent border-b border-blue-200/50 dark:border-blue-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10">
                  <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                Initial Triage
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Complete all assessments to determine RPA feasibility and move to the next stage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Process Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    triageData.isRuleBased 
                      ? 'bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border-green-300/50 dark:border-green-700/50 shadow-md' 
                      : 'bg-gradient-to-br from-card to-muted/30 border-border hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:shadow-sm'
                  }`}
                  onClick={() => setTriageData({...triageData, isRuleBased: !triageData.isRuleBased})}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    triageData.isRuleBased 
                      ? 'bg-green-500 border-green-600' 
                      : 'bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600'
                  }`}>
                    {triageData.isRuleBased && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </div>
                  <Label htmlFor="rule-based" className="cursor-pointer flex-1 text-base font-semibold">
                    Rule-based process?
                  </Label>
                  <Checkbox 
                    id="rule-based"
                    checked={triageData.isRuleBased}
                    onCheckedChange={(checked) => setTriageData({...triageData, isRuleBased: checked as boolean})}
                    className="sr-only"
                  />
                </div>
                <div 
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    triageData.isStable 
                      ? 'bg-gradient-to-br from-green-50/50 dark:from-green-950/20 to-muted/30 border-green-300/50 dark:border-green-700/50 shadow-md' 
                      : 'bg-gradient-to-br from-card to-muted/30 border-border hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:shadow-sm'
                  }`}
                  onClick={() => setTriageData({...triageData, isStable: !triageData.isStable})}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    triageData.isStable 
                      ? 'bg-green-500 border-green-600' 
                      : 'bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600'
                  }`}>
                    {triageData.isStable && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </div>
                  <Label htmlFor="stable" className="cursor-pointer flex-1 text-base font-semibold">
                    Stable process?
                  </Label>
                  <Checkbox 
                    id="stable"
                    checked={triageData.isStable}
                    onCheckedChange={(checked) => setTriageData({...triageData, isStable: checked as boolean})}
                    className="sr-only"
                  />
                </div>
              </div>

              {/* Triage Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 to-muted/20 border border-purple-200/50 dark:border-purple-800/30">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <Label htmlFor="automation-percent" className="text-base font-bold">Estimated Automation %</Label>
                  </div>
                  <div className="relative">
                    <Input 
                      id="automation-percent"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={triageData.estimatedAutomationPercent}
                      onChange={(e) => setTriageData({
                        ...triageData, 
                        estimatedAutomationPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                      })}
                      className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-lg font-semibold h-12 pl-4 pr-12 text-foreground placeholder:text-muted-foreground/70 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 shadow-sm"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground font-semibold">%</span>
                  </div>
                  <Progress value={triageData.estimatedAutomationPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">Percentage of process that can be automated (0-100%)</p>
                </div>
                
                <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 to-muted/20 border border-blue-200/50 dark:border-blue-800/30">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <Label className="text-base font-bold">Systems Involved</Label>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 rounded-md bg-blue-50/20 dark:bg-blue-950/10">
                    {triageData.systemsInvolved && triageData.systemsInvolved.length > 0 ? (
                      triageData.systemsInvolved.map((system, index) => (
                        <Badge key={index} variant="secondary" className="gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 text-sm font-medium">
                          <Link2 className="w-3 h-3" />
                          {system}
                          <button
                            onClick={() => {
                              const newSystems = triageData.systemsInvolved.filter((_, i) => i !== index)
                              setTriageData({
                                ...triageData,
                                systemsInvolved: newSystems,
                                systemsIdentified: newSystems.length > 0 ? triageData.systemsIdentified : false
                              })
                            }}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            ×
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No systems added yet. Type and press Enter to add.</span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="systems-input"
                      placeholder="Add system (e.g., SAP ERP, CRM)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setTriageData({
                            ...triageData,
                            systemsInvolved: [...triageData.systemsInvolved, e.currentTarget.value.trim()],
                            systemsIdentified: true
                          })
                          e.currentTarget.value = ''
                        }
                      }}
                      className="w-full pr-12 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('systems-input') as HTMLInputElement
                        if (input && input.value.trim()) {
                          setTriageData({
                            ...triageData,
                            systemsInvolved: [...triageData.systemsInvolved, input.value.trim()],
                            systemsIdentified: true
                          })
                          input.value = ''
                          input.focus()
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-red-50/30 dark:from-red-950/10 to-muted/20 border border-red-200/50 dark:border-red-800/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <Label className="text-base font-bold">Blockers / Risks Identified</Label>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 rounded-md bg-red-50/20 dark:bg-red-950/10">
                  {triageData.blockers && triageData.blockers.length > 0 ? (
                    triageData.blockers.map((blocker, index) => (
                      <Badge key={index} variant="outline" className="gap-1.5 px-3 py-1.5 border-destructive/50 bg-destructive/5 text-destructive text-sm font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        {blocker}
                        <button
                          onClick={() => setTriageData({
                            ...triageData,
                            blockers: triageData.blockers.filter((_, i) => i !== index)
                          })}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          ×
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No blockers added yet. Type and press Enter or click Add.</span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="blockers-input"
                    placeholder="Add blocker or risk (e.g., Legacy system, Security concerns)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        setTriageData({
                          ...triageData,
                          blockers: [...triageData.blockers, e.currentTarget.value.trim()]
                        })
                        e.currentTarget.value = ''
                      }
                    }}
                    className="w-full pr-12 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-red-500 dark:focus:border-red-400 focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/30 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('blockers-input') as HTMLInputElement
                      if (input && input.value.trim()) {
                        setTriageData({
                          ...triageData,
                          blockers: [...triageData.blockers, input.value.trim()]
                        })
                        input.value = ''
                        input.focus()
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-indigo-50/30 dark:from-indigo-950/10 to-muted/20 border border-indigo-200/50 dark:border-indigo-800/30">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <Label htmlFor="triage-notes" className="text-base font-bold">Triage Notes</Label>
                </div>
                <Textarea
                  id="triage-notes"
                  placeholder="Add analyst comments, observations, or additional notes about the triage assessment..."
                  value={triageData.triageNotes}
                  onChange={(e) => setTriageData({
                    ...triageData,
                    triageNotes: e.target.value
                  })}
                  className="min-h-32 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/30 text-sm leading-relaxed shadow-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Add any additional comments or observations from the triage assessment
                </p>
              </div>

              <div className="pt-6 border-t-2 border-border">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/50 dark:from-blue-950/20 to-muted/30 border border-blue-200/50 dark:border-blue-800/30">
                  <p className="text-sm font-semibold text-center mb-4 text-foreground">
                    All required fields must be completed to proceed
                  </p>
                  <div className="flex items-center justify-center gap-6">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      triageData.isRuleBased 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {triageData.isRuleBased ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className="font-medium">Rule-based process</span>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      triageData.isStable 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {triageData.isStable ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className="font-medium">Stable process</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {selectedProcess.status === "System Integration" && (
        <TabsContent value="sit" className="space-y-6 mt-6">
          <Card className="bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 via-card to-card border-2 border-purple-200/50 dark:border-purple-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50/50 dark:from-purple-950/20 to-transparent border-b border-purple-200/50 dark:border-purple-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10">
                  <TestTube className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                System Integration
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Document test execution results, integration testing outcomes, and any issues identified during SIT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Credential Requirements */}
              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-indigo-50/30 dark:from-indigo-950/10 to-muted/20 border border-indigo-200/50 dark:border-indigo-800/30">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <Label htmlFor="credential-requirements" className="text-base font-bold">
                    Credential Requirements <span className="text-destructive">*</span>
                  </Label>
                  {sitData.credentialRequirements.trim() !== "" && (
                    <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <Textarea
                  id="credential-requirements"
                  placeholder="Example:&#10;- Bot Account: RPA_BOT_ACCOUNT&#10;- AD Login: domain\service_account&#10;- Service Accounts: SAP_SERVICE, CRM_SERVICE&#10;- Authentication: OAuth 2.0, API Keys"
                  value={sitData.credentialRequirements}
                  onChange={(e) => setSitData({
                    ...sitData,
                    credentialRequirements: e.target.value
                  })}
                  className="min-h-40 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/30 text-sm leading-relaxed font-mono shadow-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Specify bot account, AD login, service accounts, and all authentication methods needed
                </p>
              </div>

              {/* Test Notes */}
              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-teal-50/30 dark:from-teal-950/10 to-muted/20 border border-teal-200/50 dark:border-teal-800/30">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <Label htmlFor="test-notes" className="text-base font-bold">Test Notes</Label>
                </div>
                <Textarea
                  id="test-notes"
                  placeholder="Add any additional notes, observations, or comments about the testing process..."
                  value={sitData.testNotes}
                  onChange={(e) => setSitData({
                    ...sitData,
                    testNotes: e.target.value
                  })}
                  className="min-h-32 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-400/30 text-sm leading-relaxed shadow-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Add any additional comments or observations from the SIT process
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {selectedProcess.status === "To-Be Design" && (
        <TabsContent value="to-be-design" className="space-y-6 mt-6">
          {/* Header with Progress */}
          <Card className="bg-gradient-to-br from-orange-50/30 dark:from-orange-950/10 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50/50 dark:from-orange-950/20 to-transparent border-b border-orange-200/50 dark:border-orange-800/30 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center border border-orange-300/30 dark:border-orange-700/30">
                    <DraftingCompass className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      To-Be Design
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      Complete all design requirements to finalize the solution blueprint and move to development
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Document Uploads Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workflow Diagram */}
            <Card className={`border-2 transition-all shadow-md hover:shadow-lg ${
              toBeDesignData.workflowDiagram !== "" 
                ? "border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20" 
                : "border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/30 dark:from-blue-950/10 to-muted/20 hover:border-blue-400/50 dark:hover:border-blue-600/50"
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                      toBeDesignData.workflowDiagram !== "" 
                        ? "bg-green-500/10 border-green-300/50 dark:border-green-700/50" 
                        : "bg-blue-500/10 border-blue-300/50 dark:border-blue-700/50"
                    }`}>
                      <Map className={`w-6 h-6 ${
                        toBeDesignData.workflowDiagram !== "" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-blue-600 dark:text-blue-400"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        Workflow Diagram <span className="text-destructive">*</span>
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        TO-BE Flow
                      </CardDescription>
                    </div>
                  </div>
                  {toBeDesignData.workflowDiagram !== "" && (
                    <Badge className="bg-success text-success-foreground border-success shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Uploaded
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    toBeDesignData.workflowDiagram !== ""
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/50"
                      : "bg-muted/30 border-border hover:bg-muted/50 hover:border-blue-400/50 dark:hover:border-blue-600/50"
                  }`}
                  onClick={() => document.getElementById('workflow-diagram')?.click()}
                >
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                    toBeDesignData.workflowDiagram !== ""
                      ? "bg-green-100/50 dark:bg-green-900/20"
                      : "bg-blue-100/50 dark:bg-blue-900/20"
                  }`}>
                    <Upload className={`w-8 h-8 ${
                      toBeDesignData.workflowDiagram !== ""
                        ? "text-green-600 dark:text-green-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`} />
                  </div>
                  <div className="text-base font-semibold text-foreground mb-1">
                    {toBeDesignData.workflowDiagram || "Click to upload or drag & drop"}
                  </div>
                  <Input 
                    id="workflow-diagram" 
                    type="file" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        setToBeDesignData((prev) => ({
                          ...prev,
                          workflowDiagram: file.name, // Store filename for display
                          workflowDiagramFile: file // Store File object for API call
                        }))
                        toast({
                          title: "File Selected",
                          description: "Workflow Diagram file selected. It will be uploaded when you proceed to the next stage.",
                        })
                      }
                    }}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.vsd,.vsdx"
                  />
                  {toBeDesignData.workflowDiagram && (
                    <div className="mt-4 p-3 bg-card rounded-lg border-2 border-green-300/50 dark:border-green-700/50 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="truncate">{toBeDesignData.workflowDiagram}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    PDF, DOC, image, or Visio
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Exception Handling Plan */}
            <Card className={`border-2 transition-all shadow-md hover:shadow-lg ${
              toBeDesignData.exceptionHandlingPlan !== "" 
                ? "border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20" 
                : "border-yellow-200/50 dark:border-yellow-800/30 bg-gradient-to-br from-yellow-50/30 dark:from-yellow-950/10 to-muted/20 hover:border-yellow-400/50 dark:hover:border-yellow-600/50"
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                      toBeDesignData.exceptionHandlingPlan !== "" 
                        ? "bg-green-500/10 border-green-300/50 dark:border-green-700/50" 
                        : "bg-yellow-500/10 border-yellow-300/50 dark:border-yellow-700/50"
                    }`}>
                      <AlertTriangle className={`w-6 h-6 ${
                        toBeDesignData.exceptionHandlingPlan !== "" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-yellow-600 dark:text-yellow-400"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        Exception Handling Plan <span className="text-destructive">*</span>
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Document
                      </CardDescription>
                    </div>
                  </div>
                  {toBeDesignData.exceptionHandlingPlan !== "" && (
                    <Badge className="bg-success text-success-foreground border-success shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Uploaded
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    toBeDesignData.exceptionHandlingPlan !== ""
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/50"
                      : "bg-muted/30 border-border hover:bg-muted/50 hover:border-yellow-400/50 dark:hover:border-yellow-600/50"
                  }`}
                  onClick={() => document.getElementById('exception-handling-plan')?.click()}
                >
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                    toBeDesignData.exceptionHandlingPlan !== ""
                      ? "bg-green-100/50 dark:bg-green-900/20"
                      : "bg-yellow-100/50 dark:bg-yellow-900/20"
                  }`}>
                    <Upload className={`w-8 h-8 ${
                      toBeDesignData.exceptionHandlingPlan !== ""
                        ? "text-green-600 dark:text-green-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`} />
                  </div>
                  <div className="text-base font-semibold text-foreground mb-1">
                    {toBeDesignData.exceptionHandlingPlan || "Click to upload or drag & drop"}
                  </div>
                  <Input 
                    id="exception-handling-plan" 
                    type="file" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        setToBeDesignData((prev) => ({
                          ...prev,
                          exceptionHandlingPlan: file.name, // Store filename for display
                          exceptionHandlingPlanFile: file // Store File object for API call
                        }))
                        toast({
                          title: "File Selected",
                          description: "Exception Handling Plan file selected. It will be uploaded when you proceed to the next stage.",
                        })
                      }
                    }}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  {toBeDesignData.exceptionHandlingPlan && (
                    <div className="mt-4 p-3 bg-card rounded-lg border-2 border-green-300/50 dark:border-green-700/50 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="truncate">{toBeDesignData.exceptionHandlingPlan}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    PDF, DOC, or DOCX
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requirements Section */}
          <div className="space-y-6">
            {/* Credential Requirements */}
            <Card className={`border-2 transition-all shadow-md hover:shadow-lg ${
              toBeDesignData.credentialRequirements.trim() !== "" 
                ? "border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20" 
                : "border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/30 dark:from-purple-950/10 to-muted/20 hover:border-purple-400/50 dark:hover:border-purple-600/50"
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                      toBeDesignData.credentialRequirements.trim() !== "" 
                        ? "bg-green-500/10 border-green-300/50 dark:border-green-700/50" 
                        : "bg-purple-500/10 border-purple-300/50 dark:border-purple-700/50"
                    }`}>
                      <Lock className={`w-6 h-6 ${
                        toBeDesignData.credentialRequirements.trim() !== "" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-purple-600 dark:text-purple-400"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        Credential Requirements <span className="text-destructive">*</span>
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Specify bot account, AD login, service accounts, and all authentication methods needed
                      </CardDescription>
                    </div>
                  </div>
                  {toBeDesignData.credentialRequirements.trim() !== "" && (
                    <Badge className="bg-success text-success-foreground border-success shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Completed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="credential-requirements"
                  placeholder="Example:&#10;- Bot Account: RPA_BOT_ACCOUNT&#10;- AD Login: domain\service_account&#10;- Service Accounts: SAP_SERVICE, CRM_SERVICE&#10;- Authentication: OAuth 2.0, API Keys"
                  value={toBeDesignData.credentialRequirements}
                  onChange={(e) => setToBeDesignData({
                    ...toBeDesignData,
                    credentialRequirements: e.target.value
                  })}
                  className="min-h-40 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 text-sm leading-relaxed font-mono shadow-sm"
                />
              </CardContent>
            </Card>

            {/* VM/Infrastructure Needed */}
            <Card className={`border-2 transition-all shadow-md hover:shadow-lg ${
              toBeDesignData.vmInfraNeeded.trim() !== "" 
                ? "border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20" 
                : "border-green-200/50 dark:border-green-800/30 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20 hover:border-green-400/50 dark:hover:border-green-600/50"
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                      toBeDesignData.vmInfraNeeded.trim() !== "" 
                        ? "bg-green-500/10 border-green-300/50 dark:border-green-700/50" 
                        : "bg-green-500/10 border-green-300/50 dark:border-green-700/50"
                    }`}>
                      <Building className={`w-6 h-6 ${
                        toBeDesignData.vmInfraNeeded.trim() !== "" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-green-600 dark:text-green-400"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        VM/Infrastructure Needed <span className="text-destructive">*</span>
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Document CPU, RAM, VM count, storage, network requirements, and infrastructure dependencies
                      </CardDescription>
                    </div>
                  </div>
                  {toBeDesignData.vmInfraNeeded.trim() !== "" && (
                    <Badge className="bg-success text-success-foreground border-success shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Completed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="vm-infra-needed"
                  placeholder="Example:&#10;- CPU: 4 vCPU&#10;- RAM: 8 GB&#10;- VM Count: 2 (Primary + Backup)&#10;- Storage: 100 GB SSD&#10;- Network: VPN access required&#10;- Dependencies: Database server, File share"
                  value={toBeDesignData.vmInfraNeeded}
                  onChange={(e) => setToBeDesignData({
                    ...toBeDesignData,
                    vmInfraNeeded: e.target.value
                  })}
                  className="min-h-40 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/30 dark:focus:ring-green-400/30 text-sm leading-relaxed shadow-sm"
                />
              </CardContent>
            </Card>

            {/* Logging Requirements */}
            <Card className={`border-2 transition-all shadow-md hover:shadow-lg ${
              toBeDesignData.loggingRequirements.trim() !== "" 
                ? "border-green-300/50 dark:border-green-700/50 bg-gradient-to-br from-green-50/30 dark:from-green-950/10 to-muted/20" 
                : "border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50/30 dark:from-indigo-950/10 to-muted/20 hover:border-indigo-400/50 dark:hover:border-indigo-600/50"
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                      toBeDesignData.loggingRequirements.trim() !== "" 
                        ? "bg-green-500/10 border-green-300/50 dark:border-green-700/50" 
                        : "bg-indigo-500/10 border-indigo-300/50 dark:border-indigo-700/50"
                    }`}>
                      <TrendingUp className={`w-6 h-6 ${
                        toBeDesignData.loggingRequirements.trim() !== "" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-indigo-600 dark:text-indigo-400"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        Logging Requirements <span className="text-destructive">*</span>
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Define logging levels (Info/Warn/Error), monitoring tools, alert mechanisms, and performance metrics
                      </CardDescription>
                    </div>
                  </div>
                  {toBeDesignData.loggingRequirements.trim() !== "" && (
                    <Badge className="bg-success text-success-foreground border-success shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Completed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="logging-requirements"
                  placeholder="Example:&#10;- Logging Levels: Info, Warning, Error&#10;- Monitoring: Application Insights, Splunk&#10;- Alerts: Email notifications for errors, SMS for critical failures&#10;- Performance Metrics: Execution time, success rate, error rate"
                  value={toBeDesignData.loggingRequirements}
                  onChange={(e) => setToBeDesignData({
                    ...toBeDesignData,
                    loggingRequirements: e.target.value
                  })}
                  className="min-h-40 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-foreground placeholder:text-muted-foreground/70 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/30 text-sm leading-relaxed shadow-sm"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      )}

      {(() => {
        // Show approvals tab content if:
        // 1. Status is "Approval" OR
        // 2. approvalNeedsReview is true OR
        // 3. approvalData exists and not both approvals are completed
        const approvalNeedsReview = selectedProcess.approvalData?.approvalNeedsReview;
        const showApprovalsTab = 
          selectedProcess.status === "Approval" ||
          approvalNeedsReview === true ||
          Boolean(approvalNeedsReview) ||
          (selectedProcess.approvalData && 
           !(selectedProcess.approvalData.businessOwnerApproval === "Approved" && 
             selectedProcess.approvalData.rpaCoEApproval === "Approved"));
        console.log("🔔 Approvals Tab Visibility Check:", {
          status: selectedProcess.status,
          approvalNeedsReview,
          approvalNeedsReviewType: typeof approvalNeedsReview,
          showApprovalsTab,
          approvalData: selectedProcess.approvalData,
        });
        return showApprovalsTab;
      })() && (
        <TabsContent value="approvals" className="space-y-6 mt-6">
          {/* Notification Banner for Review Required */}
          {(() => {
            const approvalNeedsReview = selectedProcess.approvalData?.approvalNeedsReview;
            // Check if approvalNeedsReview is truthy (handles boolean true, number 1, etc.)
            const needsReview = Boolean(approvalNeedsReview);
            console.log("🔔 Approval Tab - Checking notification:", {
              approvalData: selectedProcess.approvalData,
              approvalNeedsReview: approvalNeedsReview,
              needsReview,
              willShow: needsReview,
            });
            return needsReview;
          })() && (
            <Card className="bg-gradient-to-r from-orange-50/50 dark:from-orange-950/20 to-muted/30 border-2 border-orange-200/50 dark:border-orange-800/30 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Review Required ⚠️
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Data has been updated in previous stages. Please review the updated data and approve again.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Process Details for Review */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Process Details for Review
              </CardTitle>
              <CardDescription>
                Review all process information before providing your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{selectedProcess.department}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge className={getPriorityColor(selectedProcess.priority)}>
                      {selectedProcess.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected ROI:</span>
                    <span className="font-medium text-success">
                      {selectedProcess.expectedROI > 0 
                        ? `$${selectedProcess.expectedROI.toLocaleString()}` 
                        : "$0"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Submitted By:</span>
                    <span className="font-medium">{selectedProcess.submittedBy}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Submitted Date:</span>
                    <span className="font-medium">{new Date(selectedProcess.submittedDate).toLocaleDateString()}</span>
                  </div>
                  {selectedProcess.stakeholders && selectedProcess.stakeholders.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stakeholders:</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {selectedProcess.stakeholders.slice(0, 2).map((stakeholder, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Checklist */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Approvals & Prioritization
              </CardTitle>
              <CardDescription>
                Each approval must be completed by the respective stakeholder. Once all approvals are received, the process will proceed to the next stage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    Approval Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Business Owner Approval</p>
                          <p className="text-xs text-muted-foreground">Review and approve from business perspective</p>
                        </div>
                        {approvalData.businessOwnerApproval === "Approved" && !selectedProcess.approvalData?.approvalNeedsReview ? (
                          <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setOpenApprovalDialog("business-owner")
                            }}
                            className="bg-primary text-primary-foreground"
                          >
                            {selectedProcess.approvalData?.approvalNeedsReview && approvalData.businessOwnerApproval === "Approved" 
                              ? "Review & Approve Again" 
                              : "Review & Approve"}
                          </Button>
                          
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">RPA CoE Approval</p>
                          <p className="text-xs text-muted-foreground">Center of Excellence review and approval</p>
                        </div>
                        {approvalData.rpaCoEApproval === "Approved" && !selectedProcess.approvalData?.approvalNeedsReview ? (
                          <Badge variant="outline" className="text-xs bg-success/20 text-success border-success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setOpenApprovalDialog("rpa-coe")
                            }}
                            className="bg-primary text-primary-foreground"
                          >
                            {selectedProcess.approvalData?.approvalNeedsReview && approvalData.rpaCoEApproval === "Approved" 
                              ? "Review & Approve Again" 
                              : "Review & Approve"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Approval Status:</p>
                  <Badge variant={
                    approvalData.businessOwnerApproval === "Approved" && 
                    approvalData.rpaCoEApproval === "Approved"
                      ? "default" 
                      : "outline"
                  } className={
                    approvalData.businessOwnerApproval === "Approved" && 
                    approvalData.rpaCoEApproval === "Approved"
                      ? "bg-success text-success-foreground" 
                      : ""
                  }>
                    {[
                      approvalData.businessOwnerApproval === "Approved",
                      approvalData.rpaCoEApproval === "Approved"
                    ].filter(v => v).length} of 2 Approved
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground text-center mb-3">
                  All approvals must be completed before the process can proceed to the next stage. Each stakeholder can approve independently.
                </p>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold">Required approvals:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li className={approvalData.businessOwnerApproval === "Approved" ? "text-success" : ""}>
                      {approvalData.businessOwnerApproval === "Approved" ? "✓" : "○"} Business owner approval
                    </li>
                    <li className={approvalData.rpaCoEApproval === "Approved" ? "text-success" : ""}>
                      {approvalData.rpaCoEApproval === "Approved" ? "✓" : "○"} RPA CoE approval
                    </li>
                  </ul>
                </div>
                
                {/* Save Button - Only show when both approvals are completed AND it's a re-approval (update) operation */}
                {(() => {
                  const bothApproved = approvalData.businessOwnerApproval === "Approved" && 
                                       approvalData.rpaCoEApproval === "Approved";
                  // Check if it's a re-approval scenario:
                  // Only show button if approvalNeedsReview is explicitly true (re-approval flag)
                  // This ensures the button doesn't show during initial process insertion
                  const approvalNeedsReview = selectedProcess.approvalData?.approvalNeedsReview;
                  const isReApproval = Boolean(approvalNeedsReview);
                  const shouldShow = bothApproved && isReApproval && onSaveApprovals;
                  
                  console.log("🔔 Save Button Visibility Check:", {
                    bothApproved,
                    isReApproval,
                    approvalNeedsReview,
                    approvalNeedsReviewType: typeof approvalNeedsReview,
                    processStatus: selectedProcess.status,
                    onSaveApprovals: !!onSaveApprovals,
                    shouldShow,
                    businessOwnerApproval: approvalData.businessOwnerApproval,
                    rpaCoEApproval: approvalData.rpaCoEApproval,
                  });
                  
                  return shouldShow;
                })() && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-center">
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onSaveApprovals) {
                            onSaveApprovals();
                          }
                        }}
                        disabled={isSavingApprovals}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                        size="sm"
                        type="button"
                      >
                        {isSavingApprovals ? (
                          <>
                            <RotateCw className="w-3 h-3 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Click "Save" to finalize the approval process and proceed to the next stage.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </>
  )
}

