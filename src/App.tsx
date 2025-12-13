import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { RoleProvider } from "@/contexts/RoleContext";

import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Record from "./pages/Record";
import Auth from "./pages/Auth";
import VoiceSetup from "./pages/VoiceSetup";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Insights from "./pages/Insights";
import Progress from "./pages/Progress";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CheckoutSuccess from "./pages/CheckoutSuccess";

// App shell and pages
import { AppLayout } from "./components/app/AppLayout";
import AppHome from "./pages/app/AppHome";
import AppRecord from "./pages/app/AppRecord";
import AppInsights from "./pages/app/AppInsights";
import AppProgress from "./pages/app/AppProgress";
import AppSettings from "./pages/app/AppSettings";
import AppLogin from "./pages/app/AppLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <RoleProvider>
              <Routes>
                {/* Marketing Website */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                
                {/* App Routes */}
                <Route path="/app/login" element={<AppLogin />} />
                <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route index element={<AppHome />} />
                  <Route path="record" element={<AppRecord />} />
                  <Route path="insights" element={<AppInsights />} />
                  <Route path="progress" element={<AppProgress />} />
                  <Route path="settings" element={<AppSettings />} />
                </Route>

                {/* Legacy website routes */}
                <Route path="/checkout-success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
                <Route path="/voice-setup" element={<ProtectedRoute><VoiceSetup /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                <Route path="/scope" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/record" element={<ProtectedRoute><Record /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RoleProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;