import { API_BASE_URL } from "./api";

export async function createProcessOnboarding(data: any, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/process_onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to create process onboarding");
  }
  return response.json();
}

export async function getProcessOnboardingList(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/process-onboarding_details`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to fetch onboarding list");
  }
  return response.json();
}
