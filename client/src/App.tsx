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
import CandidateAssignment from "@/pages/CandidateAssignment";
import CandidateScoring from "@/pages/CandidateScoring";
import FinalResults from "@/pages/FinalResults";
import ProfileCompletion from "@/pages/ProfileCompletion";
import ContractManagement from "@/pages/ContractManagement";
import HRManagement from "@/pages/HRManagement";
import UserManagement from "@/pages/UserManagement";
import PayrollManagement from "@/pages/PayrollManagement";
import OnboardingManagement from "@/pages/OnboardingManagement";
import CandidateOnboarding from "@/pages/CandidateOnboarding";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  // Redirect to profile completion if user is a candidate and profile is not complete
  if (isAuthenticated && (user as any)?.role === "candidate" && !(user as any)?.profileCompleted) {
    return <ProfileCompletion />;
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
          {(user as any)?.role === "candidate" && (
            <>
              <Route path="/" component={CandidateDashboard} />
              <Route path="/profile" component={Profile} />
              <Route path="/applications" component={Applications} />
              <Route path="/jobs" component={Landing} />
              <Route path="/onboarding" component={CandidateOnboarding} />
            </>
          )}
          
          {/* Routes pour recruteurs, RH et admins */}
          {((user as any)?.role === "recruiter" || (user as any)?.role === "hr" || (user as any)?.role === "admin") && (
            <>
              <Route path="/" component={AdminDashboard} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/jobs" component={JobManagement} />
              <Route path="/admin/applications" component={ApplicationManagement} />
              <Route path="/admin/assignment" component={CandidateAssignment} />
              <Route path="/admin/scoring" component={CandidateScoring} />
              <Route path="/admin/final-results" component={FinalResults} />
              <Route path="/contracts" component={ContractManagement} />
              <Route path="/hr" component={HRManagement} />
              <Route path="/admin/payroll" component={PayrollManagement} />
              <Route path="/admin/onboarding" component={OnboardingManagement} />
              {(user as any)?.role === "admin" && (
                <Route path="/admin/users" component={UserManagement} />
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
