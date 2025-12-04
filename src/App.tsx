import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/DashboardNew')); // USING NEW FILE!
const TemplateSelection = lazy(() => import('./pages/TemplateSelection'));
const NewProject = lazy(() => import('./pages/NewProject'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ProjectOverview = lazy(() => import('./pages/ProjectOverview'));
const ClientView = lazy(() => import('./pages/ClientView'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));
const Payment = lazy(() => import('./pages/Payment'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-secondary-bg flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  console.log('🟢 APP COMPONENT RENDERING');
  console.log('🟢 Current URL:', window.location.pathname);

  const setUser = useStore((state) => state.setUser);
  const clearUser = useStore((state) => state.clearUser);

  useEffect(() => {
    const ensureUserProfile = async (userId: string, userEmail: string, userName: string) => {
      try {
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!existingProfile) {
          await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              email: userEmail,
              name: userName,
              subscription_tier: 'free',
            });
        }
      } catch (error) {
        console.error('Error ensuring user profile:', error);
      }
    };

    // Check for existing session on mount (handles OAuth callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userId = session.user.id;
        const userEmail = session.user.email || '';
        const userName = session.user.user_metadata?.name || 
                         session.user.user_metadata?.full_name || 
                         session.user.email?.split('@')[0] || 
                         'User';

        ensureUserProfile(userId, userEmail, userName).then(() => {
          setUser({
            id: userId,
            email: userEmail,
            name: userName,
          });
        });
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (event === 'SIGNED_IN' && session?.user) {
            const userId = session.user.id;
            const userEmail = session.user.email || '';
            const userName = session.user.user_metadata?.name || 
                             session.user.user_metadata?.full_name || 
                             session.user.email?.split('@')[0] || 
                             'User';

            await ensureUserProfile(userId, userEmail, userName);

            setUser({
              id: userId,
              email: userEmail,
              name: userName,
            });
          } else if (event === 'SIGNED_OUT') {
            clearUser();
          }
        })();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, clearUser]);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes MUST come first to avoid auth redirects */}
          <Route path="/portal/:shareCode" element={<ClientPortal />} />
          <Route path="/project/:shareCode" element={<ClientPortal />} />
          <Route path="/client/:shareCode" element={<ClientPortal />} />
          <Route path="/projects/:shareCode/client" element={<ClientView />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />

          {/* Password reset routes (public) */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <TemplateSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-project"
            element={
              <ProtectedRoute>
                <NewProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/overview"
            element={
              <ProtectedRoute>
                <ProjectOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/detail"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
