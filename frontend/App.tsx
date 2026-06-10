import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Evaluations from "./pages/Evaluations";
import KPIs from "./pages/KPIs";
import PDI from "./pages/PDI";
import Calendar from "./pages/Calendar";
import History from "./pages/History";
import Admin from "./pages/Admin";
import SmartForms from "./pages/SmartForms";
import Profile from "./pages/Profile";
import Feedback from "./pages/Feedback";
import Content from "./pages/Content";
import OneOnOnes from "./pages/OneOnOnes";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <ViewModeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/auth" element={<Auth />} />
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/evaluations" element={<Evaluations />} />
                  <Route path="/one-on-ones" element={<OneOnOnes />} />
                  <Route path="/kpis" element={<KPIs />} />
                  <Route path="/pdi" element={<PDI />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/smartforms"
                    element={
                      <ProtectedRoute requiredRole={["admin", "gestor"]}>
                        <SmartForms />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forms"
                    element={<Navigate to="/smartforms" replace />}
                  />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/content" element={<Content />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ViewModeProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
