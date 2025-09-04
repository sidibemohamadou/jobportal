import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Test simple pour identifier le problème
function SimpleTestApp() {
  console.log('SimpleTestApp rendering...');
  
  return (
    <div className="min-h-screen p-8" style={{backgroundColor: '#f0f0f0', color: '#333'}}>
      <h1 style={{fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem'}}>
        Application de Test Simple
      </h1>
      <p style={{fontSize: '1.2rem', marginBottom: '1rem'}}>
        Si vous voyez cette page, le problème est résolu !
      </p>
      <div style={{padding: '1rem', backgroundColor: '#e0f7fa', borderRadius: '8px'}}>
        <p>Tests en cours : React ✓, Styles ✓, ErrorBoundary ✓</p>
      </div>
    </div>
  );
}

function App() {
  console.log('App rendering...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SimpleTestApp />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
