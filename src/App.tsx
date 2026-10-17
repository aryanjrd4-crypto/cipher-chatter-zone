import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatPage from "./pages/ChatPage";
import ActivityPage from "./pages/ActivityPage";
import VoiceRoomsPage from "./pages/VoiceRoomsPage";
import VideoRoomsPage from "./pages/VideoRoomsPage";
import VoiceCallPage from "./pages/VoiceCallPage";
import VideoCallPage from "./pages/VideoCallPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSetPassword from "./pages/AdminSetPassword";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdentityStore } from "@/stores/useIdentityStore";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function SiteVisitTracker() {
  const location = useLocation();
  const anonymousId = useIdentityStore((state) => state.anonymousId);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (lastPath.current === path || path.startsWith('/admin')) return;
    lastPath.current = path;
    void supabase.rpc('record_site_visit', { p_anonymous_id: anonymousId, p_path: path });
  }, [location.pathname, anonymousId]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
          <SiteVisitTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/admin/analytics" element={<AdminDashboard />} />
          <Route path="/admin/set-password" element={<AdminSetPassword />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/voice" element={<VoiceRoomsPage />} />
          <Route path="/voice/:id" element={<VoiceCallPage />} />
          <Route path="/video" element={<VideoRoomsPage />} />
          <Route path="/video/:id" element={<VideoCallPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
