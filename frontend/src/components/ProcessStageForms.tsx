import { useState } from "react"
import {
  ClipboardList,
  CheckCircle,
  Check,
  AlertTriangle,
  FileText,
  Upload,
  Building,
  Rocket,
  Brain,
  Save,
  X,
  TrendingUp,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import {
  createInitialTriage,
  createProcessRegistration,
  uploadProcessRegistrationFile,
  approveStage,
  rejectStage,
  getStageIdByName,
  createDetailedAnalysis,
  createTechnicalAssessment,
  createBusinessCase
} from "@/services/processRegistrationApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Process } from "@/types/ProcessTypes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowRight } from "lucide-react"

interface ProcessStageFormsProps {
  selectedProcess: Process | null
  triageData: {
    isRuleBased: boolean
    isStable: boolean
    areExceptionsManageable: boolean
    complianceRisk: boolean
    complianceRiskSummary: string
  }
  setTriageData: React.Dispatch<React.SetStateAction<any>>
  rejectionReason: string
  setRejectionReason: React.Dispatch<React.SetStateAction<string>>
  isSubmitting: boolean
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>
  sitData: {
    testNotes: string
    credentialRequirements: string
  }
  setSitData: React.Dispatch<React.SetStateAction<any>>
  toBeDesignData: {
    workflowDiagram: string
    workflowDiagramFile?: File
    exceptionHandlingPlan: string
    exceptionHandlingPlanFile?: File
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
  getPriorityColor: (priority: string) => string
  formData: {
    title: string
    department: string
    description: string
    priority: "Low" | "Medium" | "High" | "Critical" | ""
    expectedROI: string
    stakeholders: string[]
    tags: string[]
  }
  setFormData: React.Dispatch<React.SetStateAction<any>>
  currentStakeholder: string
  setCurrentStakeholder: React.Dispatch<React.SetStateAction<string>>
  currentTag: string
  setCurrentTag: React.Dispatch<React.SetStateAction<string>>
  dataSamplesUploaded: boolean
  setDataSamplesUploaded: React.Dispatch<React.SetStateAction<boolean>>
  sopDocumentUploaded: boolean
  setSopDocumentUploaded: React.Dispatch<React.SetStateAction<boolean>>
  departments: string[]
  isNewProcessOpen: boolean
  setIsNewProcessOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function ProcessStageForms({
  selectedProcess,
  triageData,
  setTriageData,
  rejectionReason,
  setRejectionReason,
  isSubmitting,
  setIsSubmitting,
  sitData,
  setSitData,
  toBeDesignData,
  setToBeDesignData,
  getPriorityColor,
  formData,
  setFormData,
  currentStakeholder,
  setCurrentStakeholder,
  currentTag,
  setCurrentTag,
  dataSamplesUploaded,
  setDataSamplesUploaded,
  sopDocumentUploaded,
  setSopDocumentUploaded,
  departments,
  isNewProcessOpen,
  setIsNewProcessOpen,
}: ProcessStageFormsProps) {

  // Local state for uploaded file metadata
  const [sampleDataMeta, setSampleDataMeta] = useState<{ filePath: string; mimeType: string } | null>(null)
  const [sopDocMeta, setSopDocMeta] = useState<{ filePath: string; mimeType: string } | null>(null)
  const [isUploadingSampleData, setIsUploadingSampleData] = useState(false)
  const [isUploadingSopDoc, setIsUploadingSopDoc] = useState(false)
  // Add to your component state
  const [businessCaseData, setBusinessCaseData] = useState({
    fteSavings: '',
    costSavings: '',
    implementationCost: '',
    paybackMonths: '',
    roiPercent: '',
  });

  const [technicalAssessmentData, setTechnicalAssessmentData] = useState({
    infrastructureReady: false,
    botHostingType: '',
    credentialVaultRequired: false,
    externalSystemDependencies: '',
    licensingImpact: '',
    riskLevel: '',
    technicalComments: '',
  });

  const [pddMeta, setPddMeta] = useState<{ filePath: string; mimeType: string } | null>(null);
  const [isUploadingPDD, setIsUploadingPDD] = useState(false);

  // ────────────────────────────────────────────────
  // FILE UPLOAD HANDLERS
  // ────────────────────────────────────────────────

  const handleSampleDataFileChange = async (e: any) => {
    const file = e?.target?.files?.[0]
    if (!file) {
      return
    }

    try {
      setIsUploadingSampleData(true)

      const response = await uploadProcessRegistrationFile(file, "sampledata")

      if (response?.success && response.filePath) {
        setSampleDataMeta({
          filePath: response.filePath,
          mimeType: response.mimeType || file.type || "application/octet-stream",
        })
        setDataSamplesUploaded(true)

        toast({
          title: "Sample data uploaded",
          description: `${file.name} uploaded successfully.`,
        })
      } else {
        throw new Error(response?.message || "Failed to upload sample data")
      }
    } catch (error: any) {
      console.error("Error uploading sample data:", error)
      setDataSamplesUploaded(false)
      toast({
        title: "Sample data upload failed",
        description: error?.message || "Unable to upload initial data samples.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingSampleData(false)
    }
  }

  const handleSopFileChange = async (e: any) => {
    const file = e?.target?.files?.[0]
    if (!file) {
      return
    }

    try {
      setIsUploadingSopDoc(true)

      const response = await uploadProcessRegistrationFile(file, "sopdoc")

      if (response?.success && response.filePath) {
        setSopDocMeta({
          filePath: response.filePath,
          mimeType: response.mimeType || file.type || "application/octet-stream",
        })
        setSopDocumentUploaded(true)

        toast({
          title: "SOP document uploaded",
          description: `${file.name} uploaded successfully.`,
        })
      } else {
        throw new Error(response?.message || "Failed to upload SOP document")
      }
    } catch (error: any) {
      console.error("Error uploading SOP document:", error)
      setSopDocumentUploaded(false)
      toast({
        title: "SOP upload failed",
        description: error?.message || "Unable to upload SOP document.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingSopDoc(false)
    }
  }

  // ────────────────────────────────────────────────
  // PROCESS REGISTRATION SUBMIT
  // ────────────────────────────────────────────────

  const handleProcessRegistrationSubmit = async () => {
    if (!formData.title || !formData.department || !formData.description || !formData.priority) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const payload: any = {
        Title: formData.title,
        Department: formData.department,
      }

      if (formData.description && formData.description.trim()) {
        payload.Description = formData.description.trim()
      }

      if (formData.priority && formData.priority.trim()) {
        payload.Priority = formData.priority.trim()
      }

      if (formData.expectedROI && formData.expectedROI.trim()) {
        const roiValue = Number(formData.expectedROI)
        if (!isNaN(roiValue)) {
          payload.ExpectedROI = roiValue
        }
      }

      const allStakeholders = [
        ...(formData.stakeholders || []),
        ...(currentStakeholder && currentStakeholder.trim() ? [currentStakeholder.trim()] : []),
      ]
      if (allStakeholders.length > 0) {
        const stakeholderStr = allStakeholders.filter(s => s.trim()).join(", ")
        if (stakeholderStr) {
          payload.Stakeholder = stakeholderStr
        }
      }

      const allTags = [
        ...(formData.tags || []),
        ...(currentTag && currentTag.trim() ? [currentTag.trim()] : []),
      ]
      if (allTags.length > 0) {
        const tagStr = allTags.filter(t => t.trim()).join(", ")
        if (tagStr) {
          payload.Tag = tagStr
        }
      }

      if (sampleDataMeta?.filePath) {
        payload.SampledataPath = sampleDataMeta.filePath
      }
      if (sampleDataMeta?.mimeType) {
        payload.MimeType = sampleDataMeta.mimeType
      }

      if (sopDocMeta?.filePath) {
        payload.SopDoc = sopDocMeta.filePath
      }
      if (sopDocMeta?.mimeType) {
        payload.SopMimetype = sopDocMeta.mimeType
      }

      const response = await createProcessRegistration(payload)

      if (response?.success) {
        toast({
          title: "Process Registered ✅",
          description: "Process has been registered successfully.",
        })

        setIsNewProcessOpen(false)
        window.location.reload()
      } else {
        toast({
          title: "Registration Failed",
          description: response?.message || "Unable to register process. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error creating process registration:", error)
      toast({
        title: "Registration Error",
        description: error?.message || "Something went wrong while registering the process.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  // Business Case Save
  const handleBusinessCaseSave = async () => {
    if (!selectedProcess) {
      toast({
        title: "Error",
        description: "No process selected.",
        variant: "destructive",
      });
      return;
    }

    // Extract ProcessId from selectedProcess.id (format: "P054" -> 54)
    const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
    if (isNaN(numericId)) {
      toast({
        title: "Invalid Process ID",
        description: "Unable to determine process ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Convert string values to numbers, handling empty strings
      const parseNumber = (value: string): number | undefined => {
        if (!value || value.trim() === "") return undefined;
        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
      };

      const payload = {
        ProcessId: numericId,
        FteSavings: parseNumber(businessCaseData.fteSavings),
        CostSavings: parseNumber(businessCaseData.costSavings),
        ImplementationCost: parseNumber(businessCaseData.implementationCost),
        PaybackMonths: parseNumber(businessCaseData.paybackMonths),
        RoiPercent: parseNumber(businessCaseData.roiPercent),
      };

      const response = await createBusinessCase(payload);

      if (response?.success) {
        toast({
          title: "Business Case Saved ✅",
          description: response.message || "Financial analysis saved successfully. Awaiting approval.",
        });
      } else {
        throw new Error(response?.message || "Failed to save business case");
      }
    } catch (error: any) {
      console.error("Error saving business case:", error);
      toast({
        title: "Save Failed",
        description: error?.message || "Unable to save business case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Technical Assessment Save
  const handleTechnicalAssessmentSave = async () => {
    if (!selectedProcess) {
      toast({
        title: "Error",
        description: "No process selected.",
        variant: "destructive",
      });
      return;
    }

    // Extract ProcessId from selectedProcess.id (format: "P054" -> 54)
    const numericId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);
    if (isNaN(numericId)) {
      toast({
        title: "Invalid Process ID",
        description: "Unable to determine process ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        ProcessId: numericId,
        InfrastructureReady: technicalAssessmentData.infrastructureReady || false,
        BotHostingType: technicalAssessmentData.botHostingType || undefined,
        CredentialVaultRequired: technicalAssessmentData.credentialVaultRequired || false,
        ExternalSystemDependencies: technicalAssessmentData.externalSystemDependencies?.trim() || undefined,
        LicensingImpact: technicalAssessmentData.licensingImpact?.trim() || undefined,
        RiskLevel: technicalAssessmentData.riskLevel || undefined,
        TechnicalComments: technicalAssessmentData.technicalComments?.trim() || undefined,
      };

      const response = await createTechnicalAssessment(payload);

      if (response?.success) {
        toast({
          title: "Technical Assessment Saved ✅",
          description: response.message || "Technical evaluation saved successfully. Awaiting approval.",
        });
      } else {
        throw new Error(response?.message || "Failed to save technical assessment");
      }
    } catch (error: any) {
      console.error("Error saving technical assessment:", error);
      toast({
        title: "Save Failed",
        description: error?.message || "Unable to save technical assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDD File Upload - Using sampledata type as workaround
  const handlePDDFileChange = async (e: any) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPDD(true);
      // Note: Using "sampledata" type as PDD upload endpoint may need separate implementation
      const response = await uploadProcessRegistrationFile(file, "sampledata");

      if (response?.success && response.filePath) {
        setPddMeta({
          filePath: response.filePath,
          mimeType: response.mimeType || file.type,
        });

        toast({
          title: "PDD Uploaded ✅",
          description: `${file.name} uploaded successfully.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error?.message || "Unable to upload PDD.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPDD(false);
    }
  };

  // Detailed Analysis Save
  const handleDetailedAnalysisSave = async () => {
    if (!selectedProcess || !pddMeta?.filePath) {
      toast({
        title: "Missing Information",
        description: "Please upload a PDD file before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Extract numeric ProcessId from formatted string (e.g., "P055" -> 55)
      const numericProcessId = parseInt(selectedProcess.id.replace(/\D/g, ""), 10);

      if (isNaN(numericProcessId)) {
        toast({
          title: "Invalid Process ID",
          description: "Unable to extract process ID. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const response = await createDetailedAnalysis({
        ProcessId: numericProcessId,
        PddPath: pddMeta.filePath,
        MimeType: pddMeta.mimeType,
      });

      if (response.success) {
        toast({
          title: "PDD Saved ✅",
          description: response.message || "Process Definition Document saved successfully.",
        });
      } else {
        toast({
          title: "Save Failed",
          description: response.message || "Failed to save PDD. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "An error occurred while saving the PDD.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>

      {!selectedProcess && (
        <Dialog open={isNewProcessOpen} onOpenChange={setIsNewProcessOpen}>
          <DialogContent className="max-w-4xl bg-gradient-to-br from-card via-card to-muted/20 border-2 border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-bold">
                  Process Registration
                </DialogTitle>
              </div>
              <DialogDescription className="text-base text-muted-foreground">
                Complete all required fields to register your process in the RPA pipeline
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Basic Information */}
              <Card className="border border-border shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-normal">
                        Process Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="e.g., Invoice Processing Automation"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-normal">
                        Department <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => setFormData({ ...formData, department: value })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-normal">
                      Process Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the current manual process, pain points, and expected outcomes..."
                      className="min-h-28 resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-normal">
                        Priority / Criticality Level <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          setFormData({ ...formData, priority: value as any })
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedROI" className="text-sm font-normal flex items-center gap-1">
                        Expected ROI ($)
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      </Label>
                      <Input
                        id="expectedROI"
                        type="number"
                        placeholder="250000"
                        value={formData.expectedROI}
                        onChange={(e) =>
                          setFormData({ ...formData, expectedROI: e.target.value })
                        }
                        className="h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stakeholders & Tags */}
              <Card className="border border-border shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Stakeholders & Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm font-normal">Project Stakeholders</Label>
                    </div>

                    {formData.stakeholders.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                        {formData.stakeholders.map((stakeholder, index) => (
                          <Badge key={index} variant="secondary" className="gap-1.5 px-3 py-1">
                            {stakeholder}
                            <button
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  stakeholders: formData.stakeholders.filter((_, i) => i !== index),
                                })
                              }
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Add stakeholder name (e.g., John Doe)"
                        value={currentStakeholder}
                        onChange={(e) => setCurrentStakeholder(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && currentStakeholder.trim()) {
                            e.preventDefault();
                            setFormData({
                              ...formData,
                              stakeholders: [...formData.stakeholders, currentStakeholder.trim()],
                            });
                            setCurrentStakeholder("");
                          }
                        }}
                        className="h-10 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (currentStakeholder.trim()) {
                            setFormData({
                              ...formData,
                              stakeholders: [...formData.stakeholders, currentStakeholder.trim()],
                            });
                            setCurrentStakeholder("");
                          }
                        }}
                        className="h-10"
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Type stakeholder name and press Enter or click Add
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-normal">Process Tags</Label>
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="gap-1.5 px-3 py-1">
                            {tag}
                            <button
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  tags: formData.tags.filter((_, i) => i !== index),
                                })
                              }
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag (e.g., Finance, OCR, Automation)"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && currentTag.trim()) {
                            e.preventDefault();
                            setFormData({
                              ...formData,
                              tags: [...formData.tags, currentTag.trim()],
                            });
                            setCurrentTag("");
                          }
                        }}
                        className="h-10 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (currentTag.trim()) {
                            setFormData({
                              ...formData,
                              tags: [...formData.tags, currentTag.trim()],
                            });
                            setCurrentTag("");
                          }
                        }}
                        className="h-10"
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Press Enter to add tags for categorizing this process
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Supporting Documents */}
              <Card className="border border-border shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Supporting Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <Label htmlFor="dataSamples" className="text-sm font-normal">
                        Upload Initial Data Samples
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('dataSamples')?.click()}
                        className="h-10"
                        disabled={isUploadingSampleData}
                      >
                        {isUploadingSampleData ? "Uploading..." : "Choose Files"}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {sampleDataMeta?.filePath ?
                          sampleDataMeta.filePath.split(/[/\\]/).pop() || "No file chosen"
                          : "No file chosen"}
                      </span>
                      <Input
                        id="dataSamples"
                        type="file"
                        onChange={handleSampleDataFileChange}
                        accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload sample data files (Excel, CSV, PDF, Word) to help assess automation feasibility
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <Label htmlFor="sopDocument" className="text-sm font-normal">
                        Upload SOP Document
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('sopDocument')?.click()}
                        className="h-10"
                        disabled={isUploadingSopDoc}
                      >
                        {isUploadingSopDoc ? "Uploading..." : "Choose File"}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {sopDocMeta?.filePath ?
                          sopDocMeta.filePath.split(/[/\\]/).pop() || "No file chosen"
                          : "No file chosen"}
                      </span>
                      <Input
                        id="sopDocument"
                        type="file"
                        onChange={handleSopFileChange}
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload Standard Operating Procedure (SOP) document (PDF, Word) to help understand the process workflow
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewProcessOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleProcessRegistrationSubmit}
                disabled={isSubmitting || isUploadingSampleData || isUploadingSopDoc}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Register Process
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* BUSINESS CASE STAGE - Not in current pipeline */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && (selectedProcess.status as any) === "Business Case" && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-50/30 dark:from-emerald-950/10 via-card to-card border-2 border-emerald-200/50 dark:border-emerald-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50/50 dark:from-emerald-950/20 to-transparent border-b border-emerald-200/50 dark:border-emerald-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                Business Case
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Financial analysis and ROI calculations for automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* FTE Savings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="fte-savings" className="text-base font-semibold">
                    FTE Savings
                  </Label>
                  <Input
                    id="fte-savings"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 2.5"
                    value={businessCaseData.fteSavings || ''}
                    onChange={(e) => setBusinessCaseData({
                      ...businessCaseData,
                      fteSavings: e.target.value
                    })}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Full-Time Equivalent employees saved through automation
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="cost-savings" className="text-base font-semibold">
                    Cost Savings ($)
                  </Label>
                  <Input
                    id="cost-savings"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 150000"
                    value={businessCaseData.costSavings || ''}
                    onChange={(e) => setBusinessCaseData({
                      ...businessCaseData,
                      costSavings: e.target.value
                    })}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Annual cost savings from automation
                  </p>
                </div>
              </div>

              {/* Implementation Cost */}
              <div className="space-y-3">
                <Label htmlFor="implementation-cost" className="text-base font-semibold">
                  Implementation Cost ($)
                </Label>
                <Input
                  id="implementation-cost"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 50000"
                  value={businessCaseData.implementationCost || ''}
                  onChange={(e) => setBusinessCaseData({
                    ...businessCaseData,
                    implementationCost: e.target.value
                  })}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Total cost to implement automation (development, infrastructure, licensing)
                </p>
              </div>

              {/* Payback Period & ROI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="payback-months" className="text-base font-semibold">
                    Payback Period (Months)
                  </Label>
                  <Input
                    id="payback-months"
                    type="number"
                    placeholder="e.g., 12"
                    value={businessCaseData.paybackMonths || ''}
                    onChange={(e) => setBusinessCaseData({
                      ...businessCaseData,
                      paybackMonths: e.target.value
                    })}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Months to recover implementation investment
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="roi-percent" className="text-base font-semibold">
                    ROI (%)
                  </Label>
                  <Input
                    id="roi-percent"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 250"
                    value={businessCaseData.roiPercent || ''}
                    onChange={(e) => setBusinessCaseData({
                      ...businessCaseData,
                      roiPercent: e.target.value
                    })}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Return on Investment percentage
                  </p>
                </div>
              </div>

              {/* Summary Card */}
              <Card className="bg-gradient-to-br from-emerald-50 dark:from-emerald-950/30 to-transparent border-2 border-emerald-200 dark:border-emerald-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Business Case Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Annual Savings:</span>
                    <span className="font-bold text-success">
                      ${businessCaseData.costSavings ? Number(businessCaseData.costSavings).toLocaleString() : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Implementation Cost:</span>
                    <span className="font-bold">
                      ${businessCaseData.implementationCost ? Number(businessCaseData.implementationCost).toLocaleString() : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Net Benefit (Year 1):</span>
                    <span className="font-bold text-primary">
                      ${businessCaseData.costSavings && businessCaseData.implementationCost
                        ? (Number(businessCaseData.costSavings) - Number(businessCaseData.implementationCost)).toLocaleString()
                        : '0'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/20">
            <CardContent className="pt-6">
              <div className="flex justify-end gap-3">
                <Button
                  size="lg"
                  onClick={handleBusinessCaseSave}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Business Case
                    </>

                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedProcess && (selectedProcess.status as any) === "Technical Assessment" && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-cyan-50/30 dark:from-cyan-950/10 via-card to-card border-2 border-cyan-200/50 dark:border-cyan-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50/50 dark:from-cyan-950/20 to-transparent border-b border-cyan-200/50 dark:border-cyan-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10">
                  <Rocket className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                Technical Assessment
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Evaluate technical feasibility and infrastructure requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Infrastructure Ready */}
              <div className="space-y-3">
                <div
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${technicalAssessmentData.infrastructureReady
                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-300/50'
                    : 'bg-card border-border hover:border-primary/50'
                    }`}
                  onClick={() => setTechnicalAssessmentData({
                    ...technicalAssessmentData,
                    infrastructureReady: !technicalAssessmentData.infrastructureReady
                  })}
                >
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${technicalAssessmentData.infrastructureReady
                    ? 'bg-green-500 border-green-600'
                    : 'bg-white dark:bg-gray-900 border-gray-400'
                    }`}>
                    {technicalAssessmentData.infrastructureReady && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </div>
                  <Label className="cursor-pointer flex-1 text-base font-semibold">
                    Infrastructure Ready?
                  </Label>
                </div>
              </div>

              {/* Bot Hosting Type */}
              <div className="space-y-3">
                <Label htmlFor="bot-hosting-type" className="text-base font-semibold">
                  Bot Hosting Type
                </Label>
                <Select
                  value={technicalAssessmentData.botHostingType}
                  onValueChange={(value) =>
                    setTechnicalAssessmentData({ ...technicalAssessmentData, botHostingType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hosting type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On-Premise">On-Premise</SelectItem>
                    <SelectItem value="Cloud">Cloud (Azure/AWS)</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Virtual Desktop">Virtual Desktop (VDI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Credential Vault Required */}
              <div className="space-y-3">
                <div
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${technicalAssessmentData.credentialVaultRequired
                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-300/50'
                    : 'bg-card border-border hover:border-primary/50'
                    }`}
                  onClick={() => setTechnicalAssessmentData({
                    ...technicalAssessmentData,
                    credentialVaultRequired: !technicalAssessmentData.credentialVaultRequired
                  })}
                >
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${technicalAssessmentData.credentialVaultRequired
                    ? 'bg-green-500 border-green-600'
                    : 'bg-white dark:bg-gray-900 border-gray-400'
                    }`}>
                    {technicalAssessmentData.credentialVaultRequired && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </div>
                  <Label className="cursor-pointer flex-1 text-base font-semibold">
                    Credential Vault Required?
                  </Label>
                </div>
              </div>

              {/* External System Dependencies */}
              <div className="space-y-3">
                <Label htmlFor="external-dependencies" className="text-base font-semibold">
                  External System Dependencies
                </Label>
                <Textarea
                  id="external-dependencies"
                  placeholder="List all external systems, APIs, and dependencies..."
                  value={technicalAssessmentData.externalSystemDependencies}
                  onChange={(e) => setTechnicalAssessmentData({
                    ...technicalAssessmentData,
                    externalSystemDependencies: e.target.value
                  })}
                  className="min-h-24"
                />
              </div>

              {/* Licensing Impact */}
              <div className="space-y-3">
                <Label htmlFor="licensing-impact" className="text-base font-semibold">
                  Licensing Impact
                </Label>
                <Input
                  id="licensing-impact"
                  placeholder="e.g., 2 Unattended Bot licenses required"
                  value={technicalAssessmentData.licensingImpact}
                  onChange={(e) => setTechnicalAssessmentData({
                    ...technicalAssessmentData,
                    licensingImpact: e.target.value
                  })}
                />
              </div>

              {/* Risk Level */}
              <div className="space-y-3">
                <Label htmlFor="risk-level" className="text-base font-semibold">
                  Technical Risk Level
                </Label>
                <Select
                  value={technicalAssessmentData.riskLevel}
                  onValueChange={(value) =>
                    setTechnicalAssessmentData({ ...technicalAssessmentData, riskLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Technical Comments */}
              <div className="space-y-3">
                <Label htmlFor="technical-comments" className="text-base font-semibold">
                  Technical Comments & Recommendations
                </Label>
                <Textarea
                  id="technical-comments"
                  placeholder="Additional technical notes, concerns, or recommendations..."
                  value={technicalAssessmentData.technicalComments}
                  onChange={(e) => setTechnicalAssessmentData({
                    ...technicalAssessmentData,
                    technicalComments: e.target.value
                  })}
                  className="min-h-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/20">
            <CardContent className="pt-6">
              <div className="flex justify-end gap-3">
                <Button
                  size="lg"
                  onClick={handleTechnicalAssessmentSave}
                  disabled={isSubmitting}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Technical Assessment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedProcess && (selectedProcess.status as any) === "Detailed Analysis" && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-amber-50/30 dark:from-amber-950/10 via-card to-card border-2 border-amber-200/50 dark:border-amber-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50/50 dark:from-amber-950/20 to-transparent border-b border-amber-200/50 dark:border-amber-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10">
                  <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                Detailed Analysis
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Upload Process Definition Document (PDD)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* PDD Upload */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Process Definition Document (PDD) <span className="text-destructive">*</span>
                </Label>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('pdd-upload')?.click()}
                    disabled={isUploadingPDD}
                    className="h-12"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingPDD ? "Uploading..." : "Upload PDD"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {pddMeta?.filePath
                      ? pddMeta.filePath.split(/[/\\]/).pop() || "No file chosen"
                      : "No file chosen"}
                  </span>
                  <Input
                    id="pdd-upload"
                    type="file"
                    onChange={handlePDDFileChange}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                </div>

                {pddMeta?.filePath && (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <div className="flex-1">
                        <p className="font-medium text-success">PDD Uploaded Successfully</p>
                        <p className="text-sm text-muted-foreground">
                          {pddMeta.filePath.split(/[/\\]/).pop()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>PDD should include:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Detailed process steps and workflow</li>
                    <li>Business rules and decision logic</li>
                    <li>Input/output data specifications</li>
                    <li>Exception handling scenarios</li>
                    <li>System integration details</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="border-2 border-border bg-gradient-to-br from-card to-muted/20">
            <CardContent className="pt-6">
              <div className="flex justify-end gap-3">
                <Button
                  size="lg"
                  onClick={handleDetailedAnalysisSave}
                  disabled={isSubmitting || !pddMeta?.filePath}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save PDD
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* DEVELOPMENT STAGE */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && selectedProcess.status === "Development" && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-violet-50/30 dark:from-violet-950/10 via-card to-card border-2 border-violet-200/50 dark:border-violet-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-violet-50/50 dark:from-violet-950/20 to-transparent border-b border-violet-200/50 dark:border-violet-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-violet-500/10">
                  <Rocket className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                Development
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Bot development and code implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="p-8 rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 text-center">
                <Rocket className="w-16 h-16 mx-auto mb-4 text-violet-600 dark:text-violet-400 opacity-50" />
                <p className="text-muted-foreground mb-2 font-semibold">Development In Progress</p>
                <p className="text-sm text-muted-foreground">
                  Development team is currently building the automation bot
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* USER ACCEPTANCE TESTING (UAT) */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && selectedProcess.status === "User Acceptance Testing (HWF)" && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-pink-50/30 dark:from-pink-950/10 via-card to-card border-2 border-pink-200/50 dark:border-pink-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-pink-50/50 dark:from-pink-950/20 to-transparent border-b border-pink-200/50 dark:border-pink-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-pink-500/10">
                  <CheckCircle className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                User Acceptance Testing (UAT)
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Business users validate automation functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="p-8 rounded-lg bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/50 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-pink-600 dark:text-pink-400 opacity-50" />
                <p className="text-muted-foreground mb-2 font-semibold">UAT In Progress</p>
                <p className="text-sm text-muted-foreground">
                  Business users are testing the automation
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* GO-LIVE & DEPLOYMENT */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && selectedProcess.status === "Go-Live & Deployment (HWF)" && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-orange-50/30 dark:from-orange-950/10 via-card to-card border-2 border-orange-200/50 dark:border-orange-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50/50 dark:from-orange-950/20 to-transparent border-b border-orange-200/50 dark:border-orange-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-orange-500/10">
                  <Rocket className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                Go-Live & Deployment
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Deploy automation to production environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="p-8 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 text-center">
                <Rocket className="w-16 h-16 mx-auto mb-4 text-orange-600 dark:text-orange-400 opacity-50" />
                <p className="text-muted-foreground mb-2 font-semibold">Deployment In Progress</p>
                <p className="text-sm text-muted-foreground">
                  Automation is being deployed to production
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* HYPERCARE & STABILIZATION */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && selectedProcess.status === "Hypercare & Stabilization (HWF)" && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-teal-50/30 dark:from-teal-950/10 via-card to-card border-2 border-teal-200/50 dark:border-teal-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50/50 dark:from-teal-950/20 to-transparent border-b border-teal-200/50 dark:border-teal-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-teal-500/10">
                  <AlertTriangle className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                Hypercare & Stabilization
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Monitor and stabilize automation in production
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="p-8 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 text-center">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-teal-600 dark:text-teal-400 opacity-50" />
                <p className="text-muted-foreground mb-2 font-semibold">Hypercare Period</p>
                <p className="text-sm text-muted-foreground">
                  Intensive monitoring and support during initial production period
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* HANDOVER TO BAU SUPPORT */}
      {/* ═══════════════════════════════════════════════ */}
      {selectedProcess && selectedProcess.status === "Handover to BAU Support" && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50/30 dark:from-green-950/10 via-card to-card border-2 border-green-200/50 dark:border-green-800/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50/50 dark:from-green-950/20 to-transparent border-b border-green-200/50 dark:border-green-800/30 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                Handover to BAU Support
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Transition to Business-As-Usual support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="p-8 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
                <p className="text-muted-foreground mb-2 font-semibold text-lg">Process Completed! 🎉</p>
                <p className="text-sm text-muted-foreground">
                  Automation has been successfully handed over to BAU support team
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}