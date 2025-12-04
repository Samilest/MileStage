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
    
    // Safety timeout - initialize after 3 seconds no matter what
    const timeout = setTimeout(() => {
      if (isMounted && !isInitialized) {
        console.log('[App] Timeout reached, forcing initialization');
        setIsInitialized(true);
      }
    }, 3000);

    const initializeAuth = async () => {
      console.log('[App] Initializing auth...');
      console.log('[App] Current path:', location.pathname);
      console.log('[App] Hash:', location.hash);

      // Check for recovery token in hash (password reset link)
      if (location.hash.includes('type=recovery')) {
        console.log('[App] Recovery token detected');
        setIsInitialized(true);
        navigate('/reset-password' + location.hash, { replace: true });
        return;
      }

      // Check for access_token in hash (OAuth callback)
      if (location.hash.includes('access_token')) {
        console.log('[App] Access token detected, processing OAuth...');
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (!error && session?.user) {
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
              await supabase.from('user_profiles').insert({
                id: userId,
                email: userEmail,
                name: userName,
                subscription_tier: 'free',
              });
            }

            setUser({ id: userId, email: userEmail, name: userName });
            window.history.replaceState(null, '', '/dashboard');
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          console.error('[App] OAuth error:', err);
        }
        
        if (isMounted) setIsInitialized(true);
        return;
      }

      // Normal session check
      try {
        console.log('[App] Checking existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[App] Session check complete:', session ? 'found' : 'none');
        
        if (session?.user && isMounted) {
          console.log('[App] User found:', session.user.email);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 
                  session.user.user_metadata?.full_name || 
                  session.user.email?.split('@')[0] || 'User',
          });
        }
      } catch (error) {
        console.error('[App] Session check error:', error);
      }

      if (isMounted) {
        console.log('[App] Initialization complete');
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[App] Auth event:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const { id, email, user_metadata } = session.user;
          
          // Ensure profile exists
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', id)
            .maybeSingle();

          if (!profile) {
            await supabase.from('user_profiles').insert({
              id,
              email: email || '',
              name: user_metadata?.name || email?.split('@')[0] || 'User',
              subscription_tier: 'free',
            });
          }

          setUser({
            id,
            email: email || '',
            name: user_metadata?.name || user_metadata?.full_name || email?.split('@')[0] || 'User',
          });
        } else if (event === 'SIGNED_OUT') {
          if (!window.location.pathname.includes('reset-password')) {
            clearUser();
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

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

        {/* Password reset routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Auth routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><TemplateSelection /></ProtectedRoute>} />
        <Route path="/new-project" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
        <Route path="/projects/:id/overview" element={<ProtectedRoute><ProjectOverview /></ProtectedRoute>} />
        <Route path="/projects/:id/detail" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
