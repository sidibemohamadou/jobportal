import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import CandidateLogin from "@/pages/CandidateLogin";
import CandidateDashboard from "@/pages/CandidateDashboard";
import Profile from "@/pages/Profile";
import Applications from "@/pages/Applications";
import AdminDashboard from "@/pages/AdminDashboard";
import JobManagement from "@/pages/JobManagement";
import ApplicationManagement from "@/pages/ApplicationManagement";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/candidate-login" component={CandidateLogin} />
        </>
      ) : (
        <>
          {/* Routes pour candidats */}
          {user?.role === "candidate" && (
            <>
              <Route path="/" component={CandidateDashboard} />
              <Route path="/profile" component={Profile} />
              <Route path="/applications" component={Applications} />
              <Route path="/jobs" component={Landing} />
            </>
          )}
          
          {/* Routes pour recruteurs, RH et admins */}
          {(user?.role === "recruiter" || user?.role === "hr" || user?.role === "admin") && (
            <>
              <Route path="/" component={AdminDashboard} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/jobs" component={JobManagement} />
              <Route path="/admin/applications" component={ApplicationManagement} />
              {user?.role === "admin" && (
                <Route path="/admin/users" component={AdminDashboard} />
              )}
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
