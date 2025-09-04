import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "@/pages/Landing";
import CandidateLogin from "@/pages/CandidateLogin";
import AdminLogin from "@/pages/AdminLogin";

// Système de notification simple (remplace Toaster)
function SimpleNotification({ message, type = "info" }: { message?: string; type?: "info" | "success" | "error" }) {
  if (!message) return null;
  
  const colors = {
    info: { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
    success: { bg: '#e8f5e8', border: '#4caf50', text: '#2e7d32' },
    error: { bg: '#ffebee', border: '#f44336', text: '#c62828' }
  };
  
  const style = colors[type];
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem',
      backgroundColor: style.bg,
      border: `2px solid ${style.border}`,
      borderRadius: '8px',
      color: style.text,
      zIndex: 1000,
      maxWidth: '300px'
    }}>
      {message}
    </div>
  );
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Chargement...
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={CandidateLogin} />
          <Route path="/admin/login" component={AdminLogin} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div id="simple-notifications"></div>
        <Router />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
