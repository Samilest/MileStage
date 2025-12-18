import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const PoweredBy = lazy(() => import('./pages/PoweredBy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const Dashboard = lazy(() => import('./pages/DashboardNew'));
const Settings = lazy(() => import('./pages/Settings'));
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

// Helper to get session from localStorage (fallback when Supabase client hangs)
function getSessionFromStorage() {
  try {
    const storageKey = 'sb-pkubmisamfhmtirhsyqv-auth-token';
    const sessionStr = localStorage.getItem(storageKey);
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session?.user && session?.access_token) {
        // Check if token is expired
        const expiresAt = session.expires_at;
        if (expiresAt && Date.now() / 1000 < expiresAt) {
          return session;
        }
      }
    }
  } catch (e) {
    console.error('[App] Error reading session from storage:', e);
  }
  return null;
}

function AuthHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);

  useEffect(() => {
    // Handle OAuth callback - check for access_token in hash
    if (location.hash.includes('access_token') && !location.hash.includes('type=recovery')) {
      console.log('[AuthHandler] OAuth callback detected');
      
      // Parse tokens from hash and store manually (don't rely on Supabase client)
      const params = new URLSearchParams(location.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresIn = params.get('expires_in');
      const expiresAt = params.get('expires_at');
      
      if (accessToken) {
        // Decode user from JWT (basic decode, not verification)
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const userId = payload.sub;
          const userEmail = payload.email || '';
          
          // Store session manually
          const storageKey = 'sb-pkubmisamfhmtirhsyqv-auth-token';
          localStorage.setItem(storageKey, JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: parseInt(expiresIn || '3600'),
            expires_at: parseInt(expiresAt || String(Math.floor(Date.now() / 1000) + 3600)),
            token_type: 'bearer',
            user: {
              id: userId,
              email: userEmail,
              user_metadata: payload.user_metadata || {},
            },
          }));

          const userName = payload.user_metadata?.name || 
                          payload.user_metadata?.full_name || 
                          userEmail?.split('@')[0] || 'User';

          setUser({ id: userId, email: userEmail, name: userName });
          
          // Create user profile if needed (use fetch to avoid hanging)
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}`, {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${accessToken}`,
            },
          }).then(res => res.json()).then(data => {
            if (!data || data.length === 0) {
              fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_profiles`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  id: userId,
                  email: userEmail,
                  name: userName,
                  subscription_tier: 'free',
                }),
              });
            }
          });
          
          // Clear hash and go to dashboard
          window.history.replaceState(null, '', '/dashboard');
          navigate('/dashboard', { replace: true });
        } catch (e) {
          console.error('[AuthHandler] Error processing OAuth callback:', e);
        }
      }
    }
  }, [location.hash, navigate, setUser]);

  return null;
}

function App() {
  const setUser = useStore((state) => state.setUser);
  const clearUser = useStore((state) => state.clearUser);

  useEffect(() => {
    // First, check localStorage immediately (this never hangs)
    const storedSession = getSessionFromStorage();
    if (storedSession?.user) {
      console.log('[App] Found session in localStorage');
      setUser({
        id: storedSession.user.id,
        email: storedSession.user.email || '',
        name: storedSession.user.user_metadata?.name || storedSession.user.email?.split('@')[0] || 'User',
      });
    }

    // Listen for auth changes (this may or may not fire depending on Supabase client state)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[App] Auth event:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userId = session.user.id;
          const userEmail = session.user.email || '';
          const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';

          // Store in localStorage for future page loads
          const storageKey = 'sb-pkubmisamfhmtirhsyqv-auth-token';
          localStorage.setItem(storageKey, JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_in: session.expires_in,
            expires_at: session.expires_at,
            token_type: session.token_type,
            user: session.user,
          }));

          // Ensure user profile exists (use fetch to avoid hanging)
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}`,
              {
                headers: {
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${session.access_token}`,
                },
              }
            );
            const data = await response.json();
            
            if (!data || data.length === 0) {
              await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_profiles`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${session.access_token}`,
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                  id: userId,
                  email: userEmail,
                  name: userName,
                  subscription_tier: 'free',
                }),
              });
            }
          } catch (e) {
            console.error('[App] Error ensuring user profile:', e);
          }

          setUser({ id: userId, email: userEmail, name: userName });
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('sb-pkubmisamfhmtirhsyqv-auth-token');
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
          <Route path="/powered-by" element={<PoweredBy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
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
