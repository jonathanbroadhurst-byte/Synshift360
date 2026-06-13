import { createContext, useContext, ReactNode } from "react";
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
  is_active?: boolean;
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

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const res = await fetch("/api/auth/me", { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) { localStorage.removeItem('token'); return null; }
        if (!res.ok) throw new Error("Failed to load user session.");
        const data = await res.json();
        return data.user ? data.user : data;
      } catch (err) { return null; }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", {
        username: credentials.email,
        password: credentials.password
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Invalid credentials provided.");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.token) localStorage.setItem('token', data.token);
      const userProfile = data.user ? data.user : data;

      if (userProfile.is_active === false) {
        toast({ title: "Access Denied", description: "This account is disabled.", variant: "destructive" });
        return;
      }

      queryClient.setQueryData(["/api/auth/me"], userProfile);

      // Redirect based on roles
      if (userProfile.role === 'owner') {
        window.location.href = '/admin/owner-dashboard';
      } else if (userProfile.role === 'admin' || userProfile.role === 'org_admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem('token');
      await apiRequest("POST", "/api/logout").catch(() => {});
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      setLocation("/login");
      toast({ title: "Logged Out", description: "Your session has been securely closed." });
    }
  });

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    return result.user ? result.user : result;
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
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) { setTimeout(() => setLocation("/login"), 0); return null; }
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'owner' || user.role === 'admin' || user.role === 'org_admin') setTimeout(() => setLocation("/admin"), 0);
    else setTimeout(() => setLocation("/dashboard"), 0);
    return null;
  }
  return <>{children}</>;
}
