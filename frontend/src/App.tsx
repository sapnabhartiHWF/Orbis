import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingAIAgent } from "@/components/FloatingAIAgent";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { setLogoutCallback } from "@/services/api";
import Index from "./pages/Index";
import CenterOfExcellence from "./pages/CenterOfExcellence";
import CollaborationHub from "./pages/CollaborationHub";
import ROIAssessmentEngine from "./pages/ROIAssessmentEngine";
import Rules from "./pages/Rules";
import Exceptions from "./pages/Exceptions";
import Tickets from "./pages/Tickets";
import Agile from "./pages/Agile";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import SLA from "./pages/SLA";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/login";

const queryClient = new QueryClient();

// Inner component that can use useAuth hook
const AppContent = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();

  // Set up logout callback for API utility
  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 flex items-center border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger className="ml-4" />
            <div className="flex-1" />
            <ThemeToggle />
            <div className="mr-4 text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/center-of-excellence" element={<CenterOfExcellence />} />
              <Route path="/collaboration-hub" element={<CollaborationHub />} />
              <Route path="/roi-assessment-engine" element={<ROIAssessmentEngine />} />
              <Route path="/sla" element={<SLA />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/exceptions" element={<Exceptions />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/agile" element={<Agile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
        <FloatingAIAgent />
      </div>
    </SidebarProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <AppContent />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
