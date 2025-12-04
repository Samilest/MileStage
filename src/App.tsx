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

// Auth callback handler component
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useStore((state) => state.setUser);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('[AuthCallback] Processing auth callback...');
      console.log('[AuthCallback] Hash:', location.hash);
      console.log('[AuthCallback] Search:', location.search);

      try {
        // Check for recovery token (password reset)
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const type = hashParams.get('type');
        
        if (type === 'recovery') {
          console.log('[AuthCallback] Recovery token detected, redirecting to reset-password');
          // Keep the hash fragment for the reset password page
          navigate('/reset-password' + location.hash, { replace: true });
          return;
        }

        // For OAuth callbacks, get the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthCallback] Error getting session:', error);
          navigate('/login', { replace: true });
          return;
        }

        if (session?.user) {
          console.log('[AuthCallback] Session found, user:', session.user.email);
          
          // Ensure user profile exists
          const userId = session.user.id;
          const userEmail = session.user.email || '';
          const userName = session.user.user_metadata?.name || 
                          session.user.user_metadata?.full_name || 
                          session.user.email?.split('@')[0] || 'User';

          // Check/create user profile
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

          // Set user in store
          setUser({
            id: userId,
            email: userEmail,
            name: userName,
          });

          console.log('[AuthCallback] Redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('[AuthCallback] No session found');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        navigate('/login', { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [location, navigate, setUser]);

  if (isProcessing) {
    return <LoadingFallback />;
  }

  return null;
}

function AppRoutes() {
  const setUser = useStore((state) => state.setUser);
  const clearUser = useStore((state) => state.clearUser);
  const user = useStore((state) => state.user);
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[App] Initializing auth...');
      console.log('[App] Current path:', location.pathname);
      console.log('[App] Hash:', location.hash);

      // Check for recovery token in hash (password reset link)
      if (location.hash.includes('type=recovery')) {
        console.log('[App] Recovery token detected in hash');
        navigate('/reset-password' + location.hash, { replace: true });
        setIsInitialized(true);
        return;
      }

      // Check for access_token in hash (OAuth callback)
      if (location.hash.includes('access_token')) {
        console.log('[App] Access token detected in hash, processing OAuth callback...');
        
        // Let Supabase process the hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[App] OAuth callback error:', error);
          setIsInitialized(true);
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

          setUser({
            id: userId,
            email: userEmail,
            name: userName,
          });

          // Clear the hash and redirect to dashboard
          window.history.replaceState(null, '', location.pathname);
          navigate('/dashboard', { replace: true });
          setIsInitialized(true);
          return;
        }
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

        setUser({
          id: userId,
          email: userEmail,
          name: userName,
        });
      } else {
        console.log('[App] No existing session');
      }

      setIsInitialized(true);
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

          setUser({
            id: userId,
            email: userEmail,
            name: userName,
          });
        } else if (event === 'SIGNED_OUT') {
          // Don't clear user if we're on reset-password page (password recovery flow)
          if (!window.location.pathname.includes('reset-password')) {
            clearUser();
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('[App] Password recovery event - user is resetting password');
          // Don't redirect - user should already be on /reset-password
          // Just log for debugging
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading while initializing auth
  if (!isInitialized) {
    return <LoadingFallback />;
  }

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

        {/* Auth callback route */}
        <Route path="/auth/callback" element={<AuthCallback />} />

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
