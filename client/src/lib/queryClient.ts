import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Custom API request wrapper for mutation calls and imperative fetch operations.
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Handle unauthorized or expired sessions silently without window.alert
  if (res.status === 401) {
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return res;
}

/**
 * Default Query Function for React Query fetching queryKey URLs.
 */
const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(queryKey[0] as string, { headers });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error("Session expired or unauthorized");
  }

  if (!res.ok) {
    throw new Error(`API Request failed with status ${res.status}`);
  }

  return res.json();
};

/**
 * Global React Query Client Configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
