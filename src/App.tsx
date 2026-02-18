import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";

// Lazy load heavy pages for better performance
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const ClientPortalSettings = lazy(() => import("./pages/ClientPortalSettings"));
const ClientPortalDocs = lazy(() => import("./pages/ClientPortalDocs"));
const ClientPortalAnalytics = lazy(() => import("./pages/ClientPortalAnalytics"));
const ClientPortalOnboarding = lazy(() => import("./pages/ClientPortalOnboarding"));
const ClientPortalProducts = lazy(() => import("./pages/ClientPortalProducts"));
const AdminRequests = lazy(() => import("./pages/AdminRequests"));
const ClientStore = lazy(() => import("./pages/ClientStore"));

// Loading fallback for lazy-loaded components
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Cargando...</div>
  </div>
);

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={redirectPath || "/"} replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public store route - no auth required */}
          <Route path="/tienda/:slug" element={
            <Suspense fallback={<PageLoader />}>
              <ClientStore />
            </Suspense>
          } />
          
          {/* Protected routes with layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Index />} />
            <Route path="/client-portal" element={
              <Suspense fallback={<PageLoader />}>
                <ClientPortal />
              </Suspense>
            } />
            <Route path="/client-portal/settings/:clientId" element={
              <Suspense fallback={<PageLoader />}>
                <ClientPortalSettings />
              </Suspense>
            } />
            <Route path="/client-portal/docs/:clientId" element={
              <Suspense fallback={<PageLoader />}>
                <ClientPortalDocs />
              </Suspense>
            } />
            <Route path="/client-portal/analytics/:clientId" element={
              <Suspense fallback={<PageLoader />}>
                <ClientPortalAnalytics />
              </Suspense>
            } />
            <Route path="/client-portal/onboarding/:clientId" element={
              <Suspense fallback={<PageLoader />}>
                <ClientPortalOnboarding />
              </Suspense>
            } />
            <Route path="/client-portal/products/:clientId" element={
              <Suspense fallback={<PageLoader />}>
                <ClientPortalProducts />
              </Suspense>
            } />
            <Route path="/admin/requests" element={
              <Suspense fallback={<PageLoader />}>
                <AdminRequests />
              </Suspense>
            } />
          </Route>
          
          {/* Auth routes */}
          <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
