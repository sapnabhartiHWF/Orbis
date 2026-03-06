/**
 * Centralized API utility with automatic token expiration handling
 * Supports JSON and FormData requests properly
 * Handles 401 Unauthorized → auto logout + toast notification
 */

import { toast } from "sonner";

// API Base URL from environment (fallback to local dev)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://basic-vivyan-vivek1902-64809d2b.koyeb.app";

// Global logout callback - set from AuthContext
let globalLogoutCallback: (() => void) | null = null;

/**
 * Register the logout function from your AuthContext
 */
export const setLogoutCallback = (callback: () => void) => {
  globalLogoutCallback = callback;
};

/**
 * Retrieve current auth token
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

/**
 * Handle 401 Unauthorized → clear auth data and trigger logout
 */
const handleUnauthorized = () => {
  // Clear all known auth-related storage keys
  const authKeys = [
    "token",
    "auth_token",
    "user",
    "userId",
    "userName",
    "roleId",
    "companyIds",
    "companyNames",
  ];
  authKeys.forEach((key) => localStorage.removeItem(key));

  // Trigger logout flow (preferred way)
  if (globalLogoutCallback) {
    globalLogoutCallback();
  } else {
    // Fallback: direct redirect
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }
};

/**
 * Centralized fetch wrapper
 * - Automatically adds Authorization header when token exists
 * - Handles FormData correctly (no forced Content-Type)
 * - Auto-handles 401 → logout + toast
 * - Better network error messages
 */
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();

  // ────────────────────────────────────────────────
  // Headers logic – only set Content-Type for JSON
  const headers: Record<string, string> = {};

  // Only apply JSON content-type when body is present and NOT FormData
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  // Add auth token if available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Merge any custom headers from caller
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }
  // ────────────────────────────────────────────────

  // Optional: log requests in development mode
  if (import.meta.env.DEV) {
    // console.log(`API → ${options.method || "GET"} ${endpoint}`, {
    //   hasToken: !!token,
    //   isFormData: options.body instanceof FormData,
    //   customHeaders: Object.keys(headers).length > 0 ? headers : undefined,
    // });
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    // Handle token expiration / unauthorized
    if (response.status === 401) {
      let message = "Your session has expired. Please log in again.";

      try {
        const errorData = await response.json();
        message = errorData.message || message;
      } catch {
        // ignore – use default message
      }

      toast.info("Session Expired", {
        description: message,
        duration: 5000,
      });

      handleUnauthorized();

      throw new Error(message);
    }

    return response;
  } catch (err) {
    // Improve network/connection error messages
    if (err instanceof Error) {
      const msg = err.message;

      if (
        msg.includes("Failed to fetch") ||
        msg.includes("ERR_CONNECTION_REFUSED") ||
        msg.includes("NetworkError") ||
        msg.includes("abort")
      ) {
        throw new Error(
          `Cannot reach backend server (${API_BASE_URL}). ` +
            `Is the server running? (${msg})`
        );
      }

      throw err;
    }

    // Fallback for unknown errors
    throw new Error(`Network request failed: ${String(err)}`);
  }
};

/* ────────────────────────────────────────────────
   Convenience wrappers
───────────────────────────────────────────────── */

export const apiGet = (endpoint: string, options?: RequestInit) =>
  apiCall(endpoint, { ...options, method: "GET" });

export const apiPost = (endpoint: string, body?: any, options?: RequestInit) =>
  apiCall(endpoint, {
    ...options,
    method: "POST",
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

export const apiPut = (endpoint: string, body?: any, options?: RequestInit) =>
  apiCall(endpoint, {
    ...options,
    method: "PUT",
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

export const apiDelete = (endpoint: string, options?: RequestInit) =>
  apiCall(endpoint, { ...options, method: "DELETE" });

/* ────────────────────────────────────────────────
   JSON parsing with graceful handling
───────────────────────────────────────────────── */

/**
 * Parse JSON response and handle common error cases
 * Returns empty object for 400 responses (useful when no data is expected)
 */
export const parseJsonResponse = async <T = any>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status === 400) {
      // Graceful empty response for "no data" cases
      try {
        const err = await response.json();
        console.warn("400 response:", err.message || "Bad Request");
        return {} as T;
      } catch {
        return {} as T;
      }
    }

    // Other error statuses → throw
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText || "Request failed" };
    }
    throw new Error(errorData.message || `API error (${response.status})`);
  }

  return response.json();
};

// Export base URL if needed elsewhere
export { API_BASE_URL };