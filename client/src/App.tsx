import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ContactForm from "@/pages/contact-form";
import CreateSurvey from "@/pages/create-survey";
import SurveyAccess from "@/pages/survey-access";
import Dashboard from "@/pages/dashboard";
import OwnerDashboard from "@/pages/owner-dashboard";
import Login from "@/pages/login";
import Survey from "@/pages/survey";
import Report from "@/pages/report";
import Organizations from "@/pages/organizations";
import Surveys from "@/pages/surveys";
import Quantum360 from "@/pages/quantum360";
import Quantum360Start from "@/pages/quantum360-start";
import MacroReportsDashboard from "@/pages/admin/MacroReports"; // 📊 Added the Analytics Import
import { AuthProvider, RequireAuth } from "@/lib/auth";
import LeaderDashboard from "@/pages/leader-dashboard";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/contact-form" component={ContactForm} />
      <Route path="/survey-access" component={SurveyAccess} />
      <Route path="/survey/:inviteCode" component={Survey} />
      <Route path="/login" component={Login} />

      {/* Platform Owner / Super Admin Workspace Guard */}
      <Route path="/admin/owner-dashboard">
        <RequireAuth roles={["owner", "super_admin"]}>
          <OwnerDashboard />
        </RequireAuth>
      </Route>
      <Route path="/owner">
        <RequireAuth roles={["owner", "super_admin"]}>
          <OwnerDashboard />
        </RequireAuth>
      </Route>

      {/* Tenant / Corporate Admin Workspace Guard (e.g., ignite-me admins) */}
      <Route path="/dashboard">
        <RequireAuth roles={["org_admin", "admin", "company_admin", "owner", "super_admin"]}>
          <LeaderDashboard />
        </RequireAuth>
      </Route>
      <Route path="/admin">
        <RequireAuth roles={["org_admin", "admin", "company_admin", "owner", "super_admin"]}>
          <Dashboard />
        </RequireAuth>
      </Route>
      
      {/* 📊 Added the Hierarchical Systemic Alignment Delta Dashboard Route */}
      <Route path="/admin/macro-reports">
        <RequireAuth roles={["org_admin", "admin", "company_admin", "owner", "super_admin"]}>
          <MacroReportsDashboard />
        </RequireAuth>
      </Route>

      <Route path="/organizations">
        <RequireAuth roles={["org_admin", "admin", "company_admin", "owner", "super_admin"]}>
          <Organizations />
        </RequireAuth>
      </Route>
      <Route path="/surveys">
        <RequireAuth roles={["org_admin", "admin", "company_admin", "owner", "super_admin"]}>
          <Surveys />
        </RequireAuth>
      </Route>

      {/* Assessment Engine / Survey Lifecycle Routes */}
      <Route path="/create-survey">
        <RequireAuth roles={["org_admin", "admin", "owner", "super_admin"]}>
          <CreateSurvey />
        </RequireAuth>
      </Route>
      <Route path="/quantum360">
        <RequireAuth>
          <Quantum360 />
        </RequireAuth>
      </Route>
      <Route path="/quantum360/start">
        <RequireAuth>
          <Quantum360Start />
        </RequireAuth>
      </Route>
      <Route path="/report/:reportId">
        <RequireAuth>
          <Report />
        </RequireAuth>
      </Route>

      {/* Shared Internal Modules */}
      <Route path="/reports">
        <RequireAuth>
          <div className="p-8 bg-gray-950 min-h-screen text-white">
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-gray-400 mt-2">Report management coming soon...</p>
          </div>
        </RequireAuth>
      </Route>
      <Route path="/users">
        <RequireAuth roles={["org_admin", "admin", "owner", "super_admin"]}>
          <div className="p-8 bg-gray-950 min-h-screen text-white">
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-gray-400 mt-2">User management coming soon...</p>
          </div>
        </RequireAuth>
      </Route>
      <Route path="/compliance">
        <RequireAuth roles={["org_admin", "admin", "owner", "super_admin"]}>
          <div className="p-8 bg-gray-950 min-h-screen text-white">
            <h1 className="text-2xl font-bold">GDPR Compliance</h1>
            <p className="text-gray-400 mt-2">Compliance tools coming soon...</p>
          </div>
        </RequireAuth>
      </Route>

      {/* 404 Fallback Exception */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
