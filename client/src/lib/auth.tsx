import { createContext, useContext, ReactNode, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  organizationId?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // 1. Fetch current user context session from database
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user");
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Failed to load user session.");
        return res.json();
      } catch (err) {
        return null;
      }
    },
    retry: false,
  });

  // 2. Secure Login Mutation Handler
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Invalid credentials provided.");
      }
      return res.json();
    },
    onSuccess: (data: { user: User }) => {
      // Seed query client cache immediately to reflect live authenticated user status
      queryClient.setQueryData(["/api/user"], data.user);

      // ⚡ SMART REDIRECT MATRIX: Only route if user is explicitly logging in or on root path
      const userRole = data.user?.role;
      const currentPath = window.location.pathname;

      if (currentPath === '/login' || currentPath === '/') {
        if (userRole === 'owner' || userRole === 'admin' || userRole === 'org_admin') {
          window.location.href = '/admin'; // Unified corporate environment
        } else if (userRole === 'leader') {
          window.location.href = '/dashboard'; // Leader view portal
        }
      }
    }
  });

  // 3. Clear Session Logout Mutation Handler
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/login");
      toast({
        title: "Logged Out",
        description: "Your session has been securely closed.",
      });
    }
  });

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    return result.user;
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider schema context.");
  }
  return context;
}

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    setTimeout(() => setLocation("/login"), 0);
    return null;
  }

  if (roles && !roles.includes(user.role)) {
    // If authenticated user attempts to access an unauthorized route, deflect safely based on tier
    if (user.role === 'owner' || user.role === 'admin' || user.role === 'org_admin') {
      setTimeout(() => setLocation("/admin"), 0);
    } else {
      setTimeout(() => setLocation("/dashboard"), 0);
    }
    return null;
  }

  return <>{children}</>;
}
