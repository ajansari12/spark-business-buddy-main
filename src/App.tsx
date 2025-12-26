import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ExperimentsProvider } from "@/hooks/useExperiments";
import { AnalyticsProvider } from "@/hooks/useEnhancedAnalytics";

// Layouts
import { PublicLayout } from "@/layouts/PublicLayout";
import { AppLayout } from "@/layouts/AppLayout";

// Lazy load all pages for better performance
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingFallback } from "@/components/LoadingFallback";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

// Public Pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Pricing = lazy(() => import("./pages/Pricing"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdvancedAnalytics = lazy(() => import("./pages/app/AdvancedAnalytics"));
const Social = lazy(() => import("./pages/app/Social"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));

// App Pages
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Trends = lazy(() => import("./pages/app/Trends"));
const Sessions = lazy(() => import("./pages/app/Sessions"));
const Ideas = lazy(() => import("./pages/app/Ideas"));
const Documents = lazy(() => import("./pages/app/Documents"));
const Settings = lazy(() => import("./pages/app/Settings"));
const Referrals = lazy(() => import("./pages/app/Referrals"));
const Registration = lazy(() => import("./pages/app/Registration"));
const Orders = lazy(() => import("./pages/app/Orders"));
const AdminGrants = lazy(() => import("./pages/app/AdminGrants"));
const AdminAnalytics = lazy(() => import("./pages/app/AdminAnalytics"));
const ABTestingDashboard = lazy(() => import("./pages/app/ABTestingDashboard"));

// Standalone Pages
const Chat = lazy(() => import("./pages/Chat"));
const Results = lazy(() => import("./pages/Results"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CheckoutSuccess = lazy(() => import("./pages/checkout/Success"));
const VisualWizard = lazy(() => import("./pages/VisualWizard"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ExperimentsProvider>
            <AnalyticsProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <KeyboardShortcuts />
                  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        {/* Public routes with PublicLayout */}
                        <Route element={<PublicLayout />}>
                          <Route path="/" element={<Index />} />
                          <Route path="/pricing" element={<Pricing />} />
                          <Route path="/faq" element={<FAQ />} />
                          <Route path="/blog" element={<Blog />} />
                          <Route path="/blog/:slug" element={<BlogPost />} />
                          <Route path="/legal/terms" element={<Terms />} />
                          <Route path="/legal/privacy" element={<Privacy />} />
                          <Route path="/legal/disclaimer" element={<Disclaimer />} />
                          <Route path="/auth" element={<Auth />} />
                        </Route>

                    {/* Protected app routes with AppLayout */}
                    <Route
                      path="/app"
                      element={
                        <ProtectedRoute>
                          <AppLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="/app/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="trends" element={<Trends />} />
                      <Route path="sessions" element={<Sessions />} />
                      <Route path="ideas" element={<Ideas />} />
                      <Route path="documents" element={<Documents />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="referrals" element={<Referrals />} />
                      <Route path="orders" element={<Orders />} />
                      <Route path="registration/:ideaId" element={<Registration />} />
                      <Route path="admin/grants" element={<AdminGrants />} />
                      <Route path="admin/analytics" element={<AdminAnalytics />} />
                      <Route path="admin/ab-tests" element={<ABTestingDashboard />} />
                      <Route path="analytics" element={<AdvancedAnalytics />} />
                      <Route path="social" element={<Social />} />
                    </Route>

                        {/* Standalone protected routes */}
                        <Route
                          path="/wizard"
                          element={
                            <ProtectedRoute>
                              <VisualWizard />
                            </ProtectedRoute>
                          }
                        />
                    <Route
                      path="/chat"
                      element={
                        <ProtectedRoute>
                          <Chat />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/results"
                      element={
                        <ProtectedRoute>
                          <Results />
                        </ProtectedRoute>
                      }
                    />

                    {/* Checkout routes */}
                    <Route
                      path="/checkout/success"
                      element={
                        <ProtectedRoute>
                          <CheckoutSuccess />
                        </ProtectedRoute>
                      }
                    />

                        {/* Catch-all */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </TooltipProvider>
            </AnalyticsProvider>
          </ExperimentsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
