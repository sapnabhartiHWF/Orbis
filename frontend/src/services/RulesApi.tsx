export interface Rule {
    rule: string;
    rule_description: string;
    rule_id: string;
    rule_process_name: string;
    rule_process_owner: string;
    rule_stage: string;
    rule_status: string;
    rule_subject: string;
    rule_version: string;
  }
  
  const url = "https://santova.onrender.com/rulebook/";
  
  export const fetchRulesData = async () => {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok)
        throw new Error(`Failed to fetch rules: ${response.status}`);
      const data = await response.json();
      console.log("rules:", data);
      return data;
    } catch (error) {
      console.error("Error fetching rules details:", error);
      throw error;
    }
  };