import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Survey from "@/pages/survey";
import Report from "@/pages/report";
import { AuthProvider } from "@/lib/auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/survey/:inviteCode" component={Survey} />
      <Route path="/report/:reportId" component={Report} />
      <Route path="/organizations" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Organizations</h1><p>Organizations management coming soon...</p></div>} />
      <Route path="/surveys" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Survey Management</h1><p>Survey creation and management coming soon...</p></div>} />
      <Route path="/reports" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Reports</h1><p>Report management coming soon...</p></div>} />
      <Route path="/users" component={() => <div className="p-8"><h1 className="text-2xl font-bold">User Management</h1><p>User management coming soon...</p></div>} />
      <Route path="/compliance" component={() => <div className="p-8"><h1 className="text-2xl font-bold">GDPR Compliance</h1><p>Compliance tools coming soon...</p></div>} />
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
