export interface Rule {
  RuleId: string;
  Subject: string;
  Description: string;
  CreatedOn: string;
  UpdatedOn: string;
  BotId: string;
  BotName: string;
  RuleLogic: string;
  ProcessOwner: string;
  CurrentVersionNumber:number;
}

export interface RuleChangeRequest {
  rule_id: number;
  proposed_subject: string;
  proposed_description: string;
  proposed_rule_logic: string;
  proposed_bot_id: number;
  change_summary: string;
}

export interface ChangeRequest {
  RequestId: number;
  RuleId: number;
  CurrentSubject: string;
  CurrentDescription: string;
  ProposedSubject: string;
  ProposedDescription: string;
  ProposedRuleLogic: string;
  ChangeSummary: string;
  Status: string;
  RequestedById: number;
  RequestedByName: string;
  RequestedOn: string;
}


const url = "https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/rulebook";


export const fetchRulesData = async (botId?: number | string) => {   // ✅ Accept botId
  try {
    const token = localStorage.getItem("token");

    // Build URL with optional bot_id query param
    const fetchUrl = botId ? `${url}?bot_id=${botId}` : url;

    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok)
      throw new Error(`Failed to fetch rules: ${response.status}`);

    const data = await response.json();
    return data.rulebooks || [];
  } catch (error) {
    console.error("Error fetching rules details:", error);
    throw error;
  }
};

export const createRuleChangeRequest = async (
  requestData: RuleChangeRequest
) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${url}/request-change`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create change request");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating rule change request:", error);
    throw error;
  }
};

// Fetch change requests for a specific rule (or all)
export const fetchRuleChangeRequests = async (
  status?: string,
  ruleId?: number
): Promise<ChangeRequest[]> => {
  try {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (ruleId) params.append("rule_id", String(ruleId));

    const response = await fetch(`${url}/change-requests?${params.toString()}`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch change requests");
    }

    const data = await response.json();
    return data.requests || [];
  } catch (error) {
    console.error("Error fetching change requests:", error);
    return [];
  }
};


export const reviewRuleChange = async (
  requestId: number,
  action: "Approve" | "Reject",
  comments?: string
) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${url}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        request_id: requestId,
        action,
        comments,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to review change request");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error reviewing rule change:", error);
    throw error;
  }
};

export const fetchRuleVersions = async (ruleId: number) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${url}/${ruleId}/versions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok)
      throw new Error(`Failed to fetch rule versions: ${response.status}`);

    const data = await response.json();
    return data.versions || [];
  } catch (error) {
    console.error("Error fetching rule versions:", error);
    throw error;
  }
};