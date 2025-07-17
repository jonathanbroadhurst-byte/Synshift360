import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SurveyAccess from "@/pages/survey-access";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Survey from "@/pages/survey";
import Report from "@/pages/report";
import Organizations from "@/pages/organizations";
import Surveys from "@/pages/surveys";
import { AuthProvider } from "@/lib/auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/survey-access" component={SurveyAccess} />
      <Route path="/survey/:inviteCode" component={Survey} />
      <Route path="/admin" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/report/:reportId" component={Report} />
      <Route path="/organizations" component={Organizations} />
      <Route path="/surveys" component={Surveys} />
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
