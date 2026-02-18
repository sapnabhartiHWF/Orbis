import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  createInitialTriage,
  createSystemIntegration,
  createToBeDesign,
  createApprovalStage,
  createDevelopmentStage,
  createUATStage,
  createGoLiveStage,
  createHypercareStage,
  createHandoverStage,
  completeStage,
  mapFrontendStageToBackend,
  getAllProcessesSummary,
  getProcessDetail,
  getNextStage,
} from "@/services/processRegistrationApi";
import { Process, ProcessStage } from "@/types/ProcessTypes";

// Process stages array
export const processStages: ProcessStage[] = [
  "Process Registration",
  "Initial Triage",
  "System Integration",
  "To-Be Design",
  "Approval",
  "Development",
  "User Acceptance Testing (HWF)",
  "Go-Live & Deployment (HWF)",
  "Hypercare & Stabilization (HWF)",
  "Handover to BAU Support",
];

// Helper function to check if a stage has been completed
export const isStageCompleted = (
  currentStatus: ProcessStage,
  stageToCheck: ProcessStage
): boolean => {
  const currentIndex = processStages.indexOf(currentStatus);
  const checkIndex = processStages.indexOf(stageToCheck);

  if (currentIndex === -1 || checkIndex === -1) return false;
  return currentIndex > checkIndex;
};

// Helper function to format stage name for pipeline display
export const getStageDisplayName = (stage: ProcessStage): string => {
  if (stage === "Development") {
    return "Development (HWF)";
  }
  return stage;
};

// Helper function to abbreviate stage name for display (shows first 2 words)
export const getAbbreviatedStageName = (stage: ProcessStage): string => {
  const fullName = getStageDisplayName(stage);
  const words = fullName.split(" ");
  if (words.length <= 2) {
    return fullName;
  }
  return words.slice(0, 2).join(" ");
};

// Helper function to get stage message
export const getStageMessage = (
  stage: ProcessStage
): { title: string; description: string; icon: any } => {
  switch (stage) {
    case "Development":
      return {
        title: "Process is now in the Development phase.",
        description: "The bot is currently being developed and configured",
        icon: "Code",
      };
    case "User Acceptance Testing (HWF)":
      return {
        title: "Process is now in the User Acceptance Testing phase.",
        description: "The bot is currently undergoing user acceptance testing",
        icon: "UserCheck",
      };
    case "Go-Live & Deployment (HWF)":
      return {
        title: "Process is now in the Go-Live & Deployment phase.",
        description: "The bot is being deployed and prepared for go-live",
        icon: "Rocket",
      };
    case "Hypercare & Stabilization (HWF)":
      return {
        title: "Process is now in the Hypercare & Stabilization phase.",
        description:
          "The bot is in hypercare period with intensive monitoring and support",
        icon: "Heart",
      };
    case "Handover to BAU Support":
      return {
        title: "Process is now in the Handover to BAU Support phase.",
        description:
          "The bot is being handed over to Business As Usual support",
        icon: "Handshake",
      };
    default:
      return {
        title: `Process is now in the ${stage} phase.`,
        description: `The process is currently in ${stage}`,
        icon: "FileText",
      };
  }
};

// Helper function to get stage progress
export const getStageProgress = (status: ProcessStage): number => {
  if (!status) return 0;
  const stageIndex = processStages.indexOf(status);
  if (stageIndex === -1) {
    return 0;
  }
  return ((stageIndex + 1) / processStages.length) * 100;
};

interface MoveToNextStageParams {
  processId: string;
  selectedProcess: Process;
  triageData: any;
  sitData: any;
  toBeDesignData: any;
  setIsMovingToNextStage: (value: boolean) => void;
  setSelectedProcess: (process: Process | null) => void;
  setProcesses: (updater: (prev: Process[]) => Process[]) => void;
  setNextStage: (stage: string | null) => void;
  setActiveDetailsTab: (tab: string) => void;
  setActiveOverviewTab: (tab: string) => void;
  setTriageData: (data: any) => void;
  setSitData: (data: any) => void;
  setToBeDesignData: (data: any) => void;
  setDevelopmentData: (data: any) => void;
  options?: { skipTriageSave?: boolean };
}

export const moveToNextStage = async ({
  processId,
  selectedProcess,
  triageData,
  sitData,
  toBeDesignData,
  setIsMovingToNextStage,
  setSelectedProcess,
  setProcesses,
  setNextStage,
  setActiveDetailsTab,
  setActiveOverviewTab,
  setTriageData,
  setSitData,
  setToBeDesignData,
  setDevelopmentData,
  options,
}: MoveToNextStageParams) => {
  setIsMovingToNextStage(true);

  let stageMessage: string | null = null;

  const currentIndex = processStages.indexOf(selectedProcess.status);
  if (currentIndex >= processStages.length - 1) {
    toast({
      title: "Already at Final Stage",
      description: "Process is already at the final stage.",
    });
    setIsMovingToNextStage(false);
    return;
  }

  const numericProcessId = parseInt(processId.replace("P", ""));
  if (!numericProcessId) {
    throw new Error("Invalid process ID");
  }

  // Save stage data to backend before moving
  if (
    selectedProcess.status === "Initial Triage" &&
    triageData &&
    !options?.skipTriageSave
  ) {
    if (
      triageData.isRuleBased === undefined ||
      triageData.isStable === undefined
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please complete the required assessments (Rule-based and Stable process) before moving to the next stage.",
        variant: "destructive",
      });
      setIsMovingToNextStage(false);
      return;
    }

    const triageApiData = {
      ProcessId: numericProcessId,
      IsRuleBased: !!triageData.isRuleBased,
      IsStable: !!triageData.isStable,
      AreExceptionsManageable: !!triageData.areExceptionsManageable,
      ComplianceRisk: !!triageData.complianceRisk,
      ComplianceRiskSummary: triageData.complianceRiskSummary || undefined,
      SystemsInvolved:
        triageData.systemsInvolved.length > 0
          ? triageData.systemsInvolved.join(", ")
          : undefined,
      Blockers:
        triageData.blockers.length > 0
          ? triageData.blockers.join(", ")
          : undefined,
      EstimatedAutomationPercent:
        triageData.estimatedAutomationPercent || undefined,
      ApprovalStatus: "Approved" as const,
      RejectionReason: undefined,
    };

    try {
      await createInitialTriage(triageApiData);
    } catch (error) {
      throw error;
    }
  } else if (selectedProcess.status === "System Integration" && sitData) {
    const sitApiData = {
      ProcessId: numericProcessId,
      Credentials: sitData.credentialRequirements?.trim() || undefined,
      Notes: sitData.testNotes?.trim() || undefined,
    };

    try {
      await createSystemIntegration(sitApiData);
    } catch (error) {
      throw error;
    }
  } else if (selectedProcess.status === "To-Be Design" && toBeDesignData) {
    if (!toBeDesignData.workflowDiagramFile) {
      toast({
        title: "Validation Error",
        description: "Workflow Diagram file is required. Please select a file.",
        variant: "destructive",
      });
      throw new Error("Workflow Diagram file is required");
    }

    const toBeDesignApiData = {
      ProcessId: numericProcessId,
      WorkflowFile: toBeDesignData.workflowDiagramFile,
      ExceptionFile: toBeDesignData.exceptionHandlingPlanFile || undefined,
      Credentials: toBeDesignData.credentialRequirements?.trim() || undefined,
      VirtualMachine: toBeDesignData.vmInfraNeeded?.trim() || undefined,
      LoggingRequirements: toBeDesignData.loggingRequirements?.trim() || undefined,
    };

    try {
      await createToBeDesign(toBeDesignApiData);
    } catch (error) {
      throw error;
    }
  } else if (selectedProcess.status === "Approval") {
    // Check if backend has already moved to Development
    let actualCurrentStage: string | null = null;
    try {
      const currentStageResponse = await getProcessDetail(numericProcessId);
      if (currentStageResponse.success && currentStageResponse.process) {
        actualCurrentStage = currentStageResponse.currentStage
          ? currentStageResponse.currentStage
          : currentStageResponse.process.CurrentStage;
      }
    } catch (error) {
      // Continue with local state
    }

    if (actualCurrentStage && actualCurrentStage !== "Approval") {
      toast({
        title: "Stage Already Moved",
        description: `Process has already moved to "${actualCurrentStage}" stage. Refreshing...`,
      });
      setIsMovingToNextStage(false);
      return;
    }

    const boApproved =
      selectedProcess?.approvalData?.businessOwnerApproval === "Approved";
    const rpaApproved =
      selectedProcess?.approvalData?.rpaCoEApproval === "Approved";
    const bothApproved = boApproved && rpaApproved;

    if (!bothApproved) {
      toast({
        title: "Approvals Required",
        description:
          "Both Business Owner and RPA CoE approvals must be completed before moving to the next stage.",
        variant: "destructive",
      });
      setIsMovingToNextStage(false);
      return;
    }

    // Get next stage from database
    let nextStageName: string | null = null;
    try {
      const nextStageResponse = await getNextStage(numericProcessId);
      if (nextStageResponse.success && nextStageResponse.nextStage) {
        nextStageName = nextStageResponse.nextStage;
      }
    } catch (error) {
      const currentIndex = processStages.indexOf(selectedProcess.status);
      nextStageName = processStages[currentIndex + 1] || null;
    }

    if (!nextStageName) {
      const currentIndex = processStages.indexOf(selectedProcess.status);
      nextStageName = processStages[currentIndex + 1] || null;
    }

    if (nextStageName === "Development") {
      try {
        const response = await createDevelopmentStage(numericProcessId);
        if (response.success && response.message) {
          stageMessage = response.message;
        }
      } catch (error) {
        throw error;
      }
    } else if (nextStageName === "User Acceptance Testing (HWF)") {
      try {
        const response = await createUATStage(numericProcessId);
        if (response.success && response.message) {
          stageMessage = response.message;
        }
      } catch (error) {
        throw error;
      }
    } else if (nextStageName === "Go-Live & Deployment (HWF)") {
      try {
        const response = await createGoLiveStage(numericProcessId);
        if (response.success && response.message) {
          stageMessage = response.message;
        }
      } catch (error) {
        throw error;
      }
    } else if (nextStageName === "Hypercare & Stabilization (HWF)") {
      try {
        const response = await createHypercareStage(numericProcessId);
        if (response.success && response.message) {
          stageMessage = response.message;
        }
      } catch (error) {
        throw error;
      }
    } else if (nextStageName === "Handover to BAU Support") {
      try {
        const response = await createHandoverStage(numericProcessId);
        if (response.success && response.message) {
          stageMessage = response.message;
        }
      } catch (error) {
        throw error;
      }
    }
  }

  // Update stage tracking to mark current stage as completed
  const backendStageName = mapFrontendStageToBackend(selectedProcess.status);
  try {
    await completeStage({
      ProcessId: numericProcessId,
      StageName: backendStageName,
    });
  } catch (error) {
    throw error;
  }

  // Get the next stage
  const nextStage = processStages[currentIndex + 1];

  setProcesses((prevProcesses) =>
    prevProcesses.map((p) => {
      if (p.id === processId) {
        if (p.status === "Initial Triage" && triageData) {
          return {
            ...p,
            status: nextStage,
            triageData: {
              isRuleBased: triageData.isRuleBased,
              isStable: triageData.isStable,
              volumes: triageData.volumes,
              systemsInvolved: triageData.systemsInvolved,
              applicationsCount: triageData.applicationsCount,
              blockers: triageData.blockers,
              estimatedAutomationPercent: triageData.estimatedAutomationPercent,
              initialROI: triageData.initialROI,
              feasibilityStatus: triageData.feasibilityStatus,
              triageNotes: triageData.triageNotes,
            },
          };
        }
        return { ...p, status: nextStage };
      }
      return p;
    })
  );

  toast({
    title: "Stage Updated! ✅",
    description: `Process ${processId} has been moved to "${nextStage}"`,
  });

  // Update selected process
  const newStatus = processStages[currentIndex + 1] as ProcessStage;
  setSelectedProcess({
    ...selectedProcess,
    status: newStatus,
  });

  // Update active tab based on new stage
  if (newStatus === "Initial Triage") {
    setActiveDetailsTab("triage");
  } else if (newStatus === "System Integration") {
    setActiveDetailsTab("sit");
  } else if (newStatus === "Approval") {
    setActiveDetailsTab("approvals");
  } else if (newStatus === "To-Be Design") {
    setActiveDetailsTab("to-be-design");
  } else {
    setActiveDetailsTab("overview");
    const developmentIndex = processStages.indexOf("Development");
    const newStageIndex = processStages.indexOf(newStatus);
    if (newStageIndex >= developmentIndex) {
      setActiveOverviewTab("development");
    } else {
      setActiveOverviewTab("basic-info");
    }
  }

  // Clear all form data
  setTriageData({
    isRuleBased: undefined,
    isStable: undefined,
    areExceptionsManageable: undefined,
    complianceRisk: undefined,
    complianceRiskSummary: "",
    volumes: "",
    volumesCaptured: false,
    systemsInvolved: [],
    systemsIdentified: false,
    applicationsCount: 0,
    blockers: [],
    blockersIdentified: false,
    estimatedAutomationPercent: 0,
    initialROI: "",
    roiEstimated: false,
    feasibilityStatus: undefined,
    feasibilityApproved: false,
    triageNotes: "",
  });
  setSitData({
    testNotes: "",
    credentialRequirements: "",
  });
  setToBeDesignData({
    workflowDiagram: "",
    workflowDiagramFile: undefined,
    exceptionHandlingPlan: "",
    exceptionHandlingPlanFile: undefined,
    retryMechanismRequired: false,
    retryMechanismDetails: "",
    credentialRequirements: "",
    vmInfraNeeded: "",
    orchestratorQueuesRequired: false,
    loggingRequirements: "",
    sddDocument: "",
    sddApprovalStatus: undefined,
  });
  setDevelopmentData({
    developmentStartDate: "",
    devVmAccessProvided: false,
    applicationsAccessCompleted: false,
    workflowDevelopmentStatus: 0,
    configFileProvided: false,
    exceptionHandlingImplemented: false,
    loggingImplemented: false,
    unitTestingCompleted: false,
    codeReviewStatus: undefined,
    gitRepoOrBotPackage: "",
    developerNotes: "",
  });

  setIsMovingToNextStage(false);
};

interface StageActionButtonProps {
  selectedProcess: Process;
  nextStage: string | null;
  isMovingToNextStage: boolean;
  onMoveToNextStage: () => void;
}

export const StageActionButton: React.FC<StageActionButtonProps> = ({
  selectedProcess,
  nextStage,
  isMovingToNextStage,
  onMoveToNextStage,
}) => {
  let displayNextStage = nextStage;

  if (!displayNextStage) {
    const currentIndex = processStages.indexOf(selectedProcess.status);
    if (currentIndex >= 0 && currentIndex < processStages.length - 1) {
      displayNextStage = processStages[currentIndex + 1];
    }
  }

  if (displayNextStage === selectedProcess.status) {
    const currentIndex = processStages.indexOf(selectedProcess.status);
    if (currentIndex >= 0 && currentIndex < processStages.length - 1) {
      displayNextStage = processStages[currentIndex + 1];
    } else {
      displayNextStage = null;
    }
  }

  const boApproved =
    selectedProcess.approvalData?.businessOwnerApproval === "Approved";
  const rpaApproved =
    selectedProcess.approvalData?.rpaCoEApproval === "Approved";
  const bothApproved = boApproved && rpaApproved;
  const isReApproval = Boolean(
    selectedProcess.approvalData?.approvalNeedsReview
  );
  const isApprovalStage = selectedProcess.status === "Approval";

  if (isApprovalStage && bothApproved && !isReApproval) {
    return (
      <Button
        className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold"
        disabled={isMovingToNextStage}
        onClick={onMoveToNextStage}
        type="button"
      >
        {isMovingToNextStage ? (
          <>
            <RotateCw className="w-4 h-4 mr-2 animate-spin" />
            Moving to {displayNextStage || "Development"}...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Move to {displayNextStage || "Development"}
          </>
        )}
      </Button>
    );
  } else if (isApprovalStage && !bothApproved) {
    const waitingFor: string[] = [];
    if (!boApproved) waitingFor.push("Business Owner");
    if (!rpaApproved) waitingFor.push("RPA CoE");
    const waitingMessage =
      waitingFor.length > 0
        ? `Waiting for ${waitingFor.join(" and ")} Approval${
            waitingFor.length > 1 ? "s" : ""
          }`
        : "Waiting for Approval";

    return (
      <Button
        className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold"
        disabled
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        {waitingMessage}
      </Button>
    );
  }

  if (displayNextStage && selectedProcess.status !== "Handover to BAU Support") {
    return (
      <Button
        className="bg-gradient-primary text-primary-foreground"
        onClick={onMoveToNextStage}
        disabled={isMovingToNextStage}
      >
        {isMovingToNextStage ? (
          <>
            <RotateCw className="w-4 h-4 mr-2 animate-spin" />
            Moving to {displayNextStage}...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Move to {displayNextStage}
          </>
        )}
      </Button>
    );
  } else if (selectedProcess.status === "Handover to BAU Support") {
    return (
      <Button
        className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 font-semibold shadow-md"
        disabled
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Process Completed
      </Button>
    );
  }

  return null;
};