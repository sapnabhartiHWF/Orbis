export interface Rule {
  RuleId: string;
  Subject: string;
  Description: string;
  CreatedOn: string;
  UpdatedOn: string;
  BotId: string;
  BotName: string;
  RuleLogic: string;
}

const url = "http://127.0.0.1:8000/api/rulebook";

export const fetchRulesData = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(url, {
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