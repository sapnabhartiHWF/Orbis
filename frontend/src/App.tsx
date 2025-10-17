import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingAIAgent } from "@/components/FloatingAIAgent";
import { ThemeToggle } from "@/components/ThemeToggle";
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

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }
  
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
)
};

export default App;
