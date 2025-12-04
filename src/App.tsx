import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const setUser = useStore((state) => state.setUser);
  const clearUser = useStore((state) => state.clearUser);
  const user = useStore((state) => state.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let handled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[App] Auth event:', event);
        
        if (session?.user) {
          const { id, email, user_metadata } = session.user;
          
          setUser({
            id,
            email: email || '',
            name: user_metadata?.name || user_metadata?.full_name || email?.split('@')[0] || 'User',
          });

          if (event === 'SIGNED_IN') {
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
          }
        } else if (event === 'SIGNED_OUT') {
          clearUser();
        }
        
        if (!handled) {
          handled = true;
          setReady(true);
        }
      }
    );

    // Fallback: if no auth event fires within 2 seconds, set ready anyway
    const timeout = setTimeout(() => {
      if (!handled) {
        handled = true;
        console.log('[App] Timeout - setting ready');
        setReady(true);
      }
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (!ready) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
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
