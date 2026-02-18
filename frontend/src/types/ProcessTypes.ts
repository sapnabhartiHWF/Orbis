export type ProcessStage = string;

export interface Process {
    id: string;
    title: string;
    description: string;
    department: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    expectedROI: number;
    status: ProcessStage; // Now accepts any string (stage name from database)
    stageStatus?: string; 
    submittedBy: string;
    submittedDate: string;
    estimatedSavings: number;
    complexity: "Low" | "Medium" | "High";
    dependencies: string[];
    tags: string[];
    stakeholders: string[];
    registrationDocuments?: {
        dataSamples?: string; 
        sopDocument?: string; 
    };
    triageData?: {
        isRuleBased: boolean;
        isStable: boolean;
        volumes: string;
        systemsInvolved: string[];
        applicationsCount: number;
        blockers: string[];
        estimatedAutomationPercent: number;
        initialROI: string;
        feasibilityStatus: "Feasible" | "Not Feasible" | "Review Required";
        triageNotes: string;
    };
    approvalData?: {
        businessOwnerApproval: "Approved" | "Rejected" | "Pending";
        rpaCoEApproval: "Approved" | "Rejected" | "Pending";
        comments?: {
            businessOwner: string;
            rpaCoE: string;
        };
        approvalNeedsReview?: boolean;
    };
    securityAssessment?: {
        securityReviewCompleted: boolean;
        dataPrivacyCompliant: boolean;
        systemAccessApproved: boolean;
        networkSecurityVerified: boolean;
        complianceRequirementsMet: boolean;
        riskAssessmentCompleted: boolean;
    };
    risks?: Array<{
        id: string;
        riskName: string;
        mitigation: string;
        riskLevel: "Low" | "Medium" | "High";
    }>;
    timelineDates?: {
        discoveryStartDate: string;
        developmentStartDate: string;
        testingStartDate: string;
        uatStartDate: string;
        goLiveDate: string;
        stabilizationDate: string;
    };
    toBeDesignData?: {
        workflowDiagram: string;
        workflowDiagramFile?: File;
        exceptionHandlingPlan: string;
        exceptionHandlingPlanFile?: File;
        retryMechanismRequired: boolean;
        retryMechanismDetails: string;
        credentialRequirements: string;
        vmInfraNeeded: string;
        orchestratorQueuesRequired: boolean;
        loggingRequirements: string;
        sddDocument: string;
        sddApprovalStatus: "Approved" | "Pending";
    };
    developmentData?: {
        developmentStartDate: string;
        devVmAccessProvided: boolean;
        applicationsAccessCompleted: boolean;
        workflowDevelopmentStatus: number;
        configFileProvided: boolean;
        exceptionHandlingImplemented: boolean;
        loggingImplemented: boolean;
        unitTestingCompleted: boolean;
        codeReviewStatus: "Approved" | "Pending";
        gitRepoOrBotPackage: string;
        developerNotes: string;
    };
    sitData?: {
        testNotes: string;
        credentialRequirements: string;
    };
}