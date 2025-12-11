import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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

function AuthHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);

  useEffect(() => {
    const hash = location.hash;
    
    // Only handle OAuth callback (not recovery - that's handled by ResetPassword page)
    if (hash.includes('access_token') && !hash.includes('type=recovery')) {
      console.log('[AuthHandler] OAuth callback detected, waiting for auth state...');
      
      // Supabase will auto-process the hash, just wait for the session
      const checkSession = async () => {
        // Small delay to let Supabase process the hash
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('[AuthHandler] Session found:', session.user.email);
          
          const { id, email, user_metadata } = session.user;
          const userName = user_metadata?.name || user_metadata?.full_name || email?.split('@')[0] || 'User';

          // Ensure user profile exists
          const { data: existing } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', id)
            .maybeSingle();

          if (!existing) {
            await supabase.from('user_profiles').insert({
              id,
              email: email || '',
              name: userName,
              subscription_tier: 'free',
            });
          }

          setUser({ id, email: email || '', name: userName });
          
          // Clear hash and navigate
          window.history.replaceState(null, '', '/dashboard');
          navigate('/dashboard', { replace: true });
        }
      };
      
      checkSession();
    }
  }, [location.hash, navigate, setUser]);

  return null;
}

function App() {
  const setUser = useStore((state) => state.setUser);
  const clearUser = useStore((state) => state.clearUser);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[App] Auth event:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const { id, email, user_metadata } = session.user;

          // Ensure user profile exists
          const { data: existing } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', id)
            .maybeSingle();

          if (!existing) {
            await supabase.from('user_profiles').insert({
              id,
              email: email || '',
              name: user_metadata?.name || user_metadata?.full_name || email?.split('@')[0] || 'User',
              subscription_tier: 'free',
            });
          }

          setUser({
            id,
            email: email || '',
            name: user_metadata?.name || user_metadata?.full_name || email?.split('@')[0] || 'User',
          });
        } else if (event === 'SIGNED_OUT') {
          clearUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, clearUser]);

  return (
    <BrowserRouter>
      <AuthHandler />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/portal/:shareCode" element={<ClientPortal />} />
          <Route path="/project/:shareCode" element={<ClientPortal />} />
          <Route path="/client/:shareCode" element={<ClientPortal />} />
          <Route path="/projects/:shareCode/client" element={<ClientView />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><TemplateSelection /></ProtectedRoute>} />
          <Route path="/new-project" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
          <Route path="/projects/:id/overview" element={<ProtectedRoute><ProjectOverview /></ProtectedRoute>} />
          <Route path="/projects/:id/detail" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
