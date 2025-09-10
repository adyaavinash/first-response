import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import OtpPage from "./pages/OtpPage";
import DashboardLayout from "./components/DashboardLayout";
import HomePage from "./pages/dashboard/HomePage";
import FirstAidPage from "./pages/dashboard/FirstAidPage";
import RationingPage from "./pages/dashboard/RationingPage";
import SafeRoutePage from "./pages/dashboard/SafeRoutePage";
import FlyerScannerPage from "./pages/dashboard/FlyerScannerPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/otp" element={<OtpPage />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<HomePage />} />
            <Route path="first-aid" element={<FirstAidPage />} />
            <Route path="rationing" element={<RationingPage />} />
            <Route path="safe-route" element={<SafeRoutePage />} />
            <Route path="flyer-scanner" element={<FlyerScannerPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
