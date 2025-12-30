/**
 * Centralized API utility with automatic token expiration handling
 * This ensures seamless user experience when tokens expire
 */

import { toast } from "sonner";

// API Base URL
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://basic-vivyan-vivek1902-64809d2b.koyeb.app";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Global logout callback - will be set by AuthContext
let globalLogoutCallback: (() => void) | null = null;

/**
 * Set the global logout callback from AuthContext
 * This allows the API utility to trigger logout without direct dependency
 */
export const setLogoutCallback = (callback: () => void) => {
  globalLogoutCallback = callback;
};

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

/**
 * Handle 401 Unauthorized responses
 * Automatically logs out user and redirects to login
 */
const handleUnauthorized = () => {
  // Clear all auth-related data
  localStorage.removeItem("token");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("roleId");
  localStorage.removeItem("companyIds");
  localStorage.removeItem("companyNames");

  // Trigger logout callback if available (from AuthContext)
  if (globalLogoutCallback) {
    globalLogoutCallback();
  } else {
    // Fallback: redirect to login (but prefer AuthContext logout for better UX)
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
};

/**
 * Centralized API call function with automatic error handling
 * 
 * @param endpoint - API endpoint (e.g., '/api/bots')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise<Response>
 * 
 * @example
 * ```ts
 * const response = await apiCall('/api/bots', { method: 'GET' });
 * const data = await response.json();
 * ```
 */
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Merge existing headers if provided
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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    // Handle 401 Unauthorized (token expired or invalid)
    if (response.status === 401) {
      // Try to get error message from response
      let errorMessage = "Your session has expired. Please log in again to continue.";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use default message
      }

      // Show polite notification instead of error
      toast.info("Session Expired", {
        description: errorMessage,
        duration: 4000,
      });

      // Automatically handle logout and redirect
      handleUnauthorized();

      // Throw error so calling code can handle it if needed
      throw new Error(errorMessage);
    }

    // Return response for other status codes (caller can handle them)
    return response;
  } catch (error) {
    // Re-throw if it's already an Error (like from 401 handling)
    if (error instanceof Error) {
      // Check for connection refused errors
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message.includes('NetworkError')) {
        throw new Error(
          `Cannot connect to backend server at ${API_BASE_URL}. ` +
          `Please ensure the backend server is running. ` +
          `Error: ${error.message}`
        );
      }
      throw error;
    }

    // Handle network errors
    throw new Error(`Network error: ${error}`);
  }
};

/**
 * Convenience method for GET requests
 */
export const apiGet = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  return apiCall(endpoint, { ...options, method: 'GET' });
};

/**
 * Convenience method for POST requests
 */
export const apiPost = async (endpoint: string, body?: any, options?: RequestInit): Promise<Response> => {
  return apiCall(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * Convenience method for PUT requests
 */
export const apiPut = async (endpoint: string, body?: any, options?: RequestInit): Promise<Response> => {
  return apiCall(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * Convenience method for DELETE requests
 */
export const apiDelete = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  return apiCall(endpoint, { ...options, method: 'DELETE' });
};

/**
 * Helper to parse JSON response with error handling
 * Handles 400 errors gracefully (returns empty data structure)
 */
export const parseJsonResponse = async <T = any>(response: Response): Promise<T> => {
  if (!response.ok) {
    // Handle 400 Bad Request gracefully (e.g., data not available for current schema)
    if (response.status === 400) {
      try {
        const errorData = await response.json();
        // Return empty structure based on expected type
        // Components can handle empty data gracefully
        return {} as T;
      } catch (e) {
        return {} as T;
      }
    }
    
    // For other errors, throw to be handled by caller
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(errorData.message || `API call failed: ${response.statusText}`);
  }
  return response.json();
};

// Export API base URL for direct use if needed
export { API_BASE_URL };

