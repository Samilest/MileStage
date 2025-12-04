import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/DashboardNew'));
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

function AppRoutes() {
  const setUser = useStore((state) => state.setUser);
  const clearUser = useStore((state) => state.clearUser);
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      console.log('[App] Initializing auth...');
      console.log('[App] Current path:', location.pathname);
      console.log('[App] Hash:', location.hash);

      try {
        // Check for recovery token in hash (password reset link)
        if (location.hash.includes('type=recovery')) {
          console.log('[App] Recovery token detected, redirecting to reset-password');
          if (isMounted) {
            setIsInitialized(true);
            navigate('/reset-password' + location.hash, { replace: true });
          }
          return;
        }

        // Check for access_token in hash (OAuth callback)
        if (location.hash.includes('access_token')) {
          console.log('[App] Access token detected, processing OAuth...');
          
          // Give Supabase a moment to process the hash
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[App] OAuth error:', error);
            if (isMounted) setIsInitialized(true);
            return;
          }

          if (session?.user) {
            console.log('[App] OAuth session found:', session.user.email);
            
            const userId = session.user.id;
            const userEmail = session.user.email || '';
            const userName = session.user.user_metadata?.name || 
                            session.user.user_metadata?.full_name || 
                            session.user.email?.split('@')[0] || 'User';

            // Ensure user profile exists
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
            } catch (profileError) {
              console.error('[App] Profile error:', profileError);
            }

            if (isMounted) {
              setUser({
                id: userId,
                email: userEmail,
                name: userName,
              });

              // Clear hash and redirect
              window.history.replaceState(null, '', '/dashboard');
              navigate('/dashboard', { replace: true });
            }
          }
          
          if (isMounted) setIsInitialized(true);
          return;
        }

        // Normal session check
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('[App] Existing session found:', session.user.email);
          
          const userId = session.user.id;
          const userEmail = session.user.email || '';
          const userName = session.user.user_metadata?.name || 
                          session.user.user_metadata?.full_name || 
                          session.user.email?.split('@')[0] || 'User';

          if (isMounted) {
            setUser({
              id: userId,
              email: userEmail,
              name: userName,
            });
          }
        } else {
          console.log('[App] No existing session');
        }

      } catch (error) {
        console.error('[App] Init error:', error);
      } finally {
        // ALWAYS set initialized to true
        if (isMounted) {
          console.log('[App] Setting initialized to true');
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[App] Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userId = session.user.id;
          const userEmail = session.user.email || '';
          const userName = session.user.user_metadata?.name || 
                          session.user.user_metadata?.full_name ||
                          session.user.email?.split('@')[0] || 'User';

          // Ensure user profile exists
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
          } catch (err) {
            console.error('[App] Profile creation error:', err);
          }

          if (isMounted) {
            setUser({
              id: userId,
              email: userEmail,
              name: userName,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          // Don't clear user if on reset-password page
          const isOnResetPage = window.location.pathname.includes('reset-password');
          if (!isOnResetPage && isMounted) {
            clearUser();
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('[App] Password recovery event');
          // Don't navigate - user handles this on ResetPassword page
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - run once on mount

  // Show loading while initializing auth
  if (!isInitialized) {
    console.log('[App] Not initialized yet, showing loading...');
    return <LoadingFallback />;
  }

  console.log('[App] Rendering routes');

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes - no auth required */}
        <Route path="/portal/:shareCode" element={<ClientPortal />} />
        <Route path="/project/:shareCode" element={<ClientPortal />} />
        <Route path="/client/:shareCode" element={<ClientPortal />} />
        <Route path="/projects/:shareCode/client" element={<ClientView />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* Password reset routes - accessible without login */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public routes - redirect to dashboard if logged in */}
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

        {/* Protected routes - require auth */}
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
  );
}

function App() {
  console.log('🟢 APP COMPONENT RENDERING');
  
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
