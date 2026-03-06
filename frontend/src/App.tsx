import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingAIAgent } from "@/components/FloatingAIAgent";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { setLogoutCallback } from "@/services/api";
import Index from "./pages/Index";
import CenterOfExcellence from "./pages/CenterOfExcellence";
import CollaborationHub from "./pages/CollaborationHub";
import Success from "./pages/Success";
import ROIAssessmentEngine from "./pages/ROIAssessmentEngine";
import Rules from "./pages/Rules";
import Exceptions from "./pages/Exceptions";
import Tickets from "./pages/Tickets";
import TeamChat from "./pages/TeamChat";
import Agile from "./pages/Agile";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import Notifications from "./pages/Notifications";
import SLA from "./pages/SLA";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/login";
import { RPALeadProfile } from "./pages/Profiles/Rpaleadprofile";
import { BusinessOwnerProfile } from "./pages/Profiles/Businessownerprofile";
import { AutomationEngineerProfile } from "./pages/Profiles/Automationengineerprofile";
import { QAEngineerProfile } from "./pages/Profiles/Qaengineerprofile";
import { BusinessAnalystProfile } from "./pages/Profiles/Businessanalystprofile";
import Demo from "./pages/demo";

// Configure React Query with optimized defaults for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds - data is considered fresh
      gcTime: 300000, // 5 minutes - keep in cache
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch if data is fresh
      retry: 1, // Retry once on failure
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});

// Inner component that can use useAuth hook
const allowedProfileRoles = ["rpa-engineer", "client", "qa", "admin", "automation-lead"];

const RoleProfileRoute = () => {
  const { role } = useParams();
  if (!role || !allowedProfileRoles.includes(role)) {
    return <Navigate to="/profile" replace />;
  }
  // Default to Automation Engineer profile for other roles
  return <AutomationEngineerProfile />;
};

// Profile route component that shows the appropriate profile based on user role
const ProfileRoute = () => {
  const { user } = useAuth();
  const roleId = user?.RoleId || parseInt(localStorage.getItem('roleId') || '0');
  
  // Route to specific profile based on role
  if (roleId === 3) {
    // Automation Engineer / RPA Engineer
    return <AutomationEngineerProfile />;
  } else if (roleId === 16) {
    // QA Engineer
    return <QAEngineerProfile />;
  } else if (roleId === 17) {
    // Business Analyst
    return <BusinessAnalystProfile />;
  } else if (roleId === 14) {
    // RPA Lead / COE Manager
    return <RPALeadProfile />;
  } else if (roleId === 15) {
    // Business Owner
    return <BusinessOwnerProfile />;
  }
  
  // Default to Automation Engineer profile for other roles
  return <AutomationEngineerProfile />;
};

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
            <NotificationBell />
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
              <Route path="/success" element={<Success />} />
              <Route path="/roi-assessment-engine" element={<ROIAssessmentEngine />} />
              <Route path="/sla" element={<SLA />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/exceptions" element={<Exceptions />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/team-chat" element={<TeamChat />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/agile" element={<Agile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile/:role" element={<RoleProfileRoute />} />
              <Route path="/profile" element={<ProfileRoute />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/demo" element={<Demo />} />
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
