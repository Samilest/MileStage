import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      // Method 1: Check for token_hash in query params (PKCE flow - recommended)
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      
      if (tokenHash && type === 'recovery') {
        console.log('[ResetPassword] Using verifyOtp with token_hash');
        const { data, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        
        if (otpError) {
          console.error('[ResetPassword] verifyOtp error:', otpError.message);
          setError(otpError.message || 'Invalid or expired reset link.');
        } else {
          console.log('[ResetPassword] verifyOtp success');
          
          // CRITICAL: Store session in localStorage for password update
          // verifyOtp returns the session, but it may not persist to localStorage
          if (data.session) {
            console.log('[ResetPassword] Storing session in localStorage');
            const storageKey = 'sb-pkubmisamfhmtirhsyqv-auth-token';
            localStorage.setItem(storageKey, JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in,
              expires_at: data.session.expires_at,
              token_type: data.session.token_type,
              user: data.session.user,
            }));
          } else {
            // Fallback: try to get session from Supabase client
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              console.log('[ResetPassword] Got session from getSession, storing...');
              const storageKey = 'sb-pkubmisamfhmtirhsyqv-auth-token';
              localStorage.setItem(storageKey, JSON.stringify({
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                expires_in: sessionData.session.expires_in,
                expires_at: sessionData.session.expires_at,
                token_type: sessionData.session.token_type,
                user: sessionData.session.user,
              }));
            }
          }
          
          window.history.replaceState(null, '', window.location.pathname);
          setIsReady(true);
        }
        setInitializing(false);
        return;
      }

      // Method 2: Check for access_token in hash (Implicit flow - legacy)
      const hash = window.location.hash;
      
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1));
        const errorDesc = params.get('error_description');
        setError(errorDesc?.replace(/\+/g, ' ') || 'Invalid or expired reset link.');
        setInitializing(false);
        return;
      }

      if (hash.includes('access_token') && hash.includes('type=recovery')) {
        console.log('[ResetPassword] Using setSession with hash tokens');
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          try {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('[ResetPassword] setSession error:', sessionError.message);
              setError(sessionError.message || 'Failed to verify reset link.');
            } else {
              console.log('[ResetPassword] setSession success');
              window.history.replaceState(null, '', window.location.pathname);
              setIsReady(true);
            }
          } catch (err: any) {
            console.error('[ResetPassword] setSession exception:', err);
            // Fallback: check if session exists anyway (might have been set by another listener)
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              window.history.replaceState(null, '', window.location.pathname);
              setIsReady(true);
            } else {
              setError('Failed to verify reset link. Please try again.');
            }
          }
          setInitializing(false);
          return;
        }
      }

      // Method 3: Check for existing session (user might already be authenticated)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('[ResetPassword] Existing session found');
        setIsReady(true);
      } else {
        console.log('[ResetPassword] No valid tokens found');
        setError('Invalid or expired reset link. Please request a new one.');
      }
      setInitializing(false);
    };

    verifyToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Get session from localStorage
      const sessionStr = localStorage.getItem('sb-pkubmisamfhmtirhsyqv-auth-token');
      if (!sessionStr) {
        throw new Error('Session expired. Please request a new reset link.');
      }
      
      const session = JSON.parse(sessionStr);
      
      // Use fetch directly because supabase.auth.updateUser() hangs
      const response = await fetch('https://pkubmisamfhmtirhsyqv.supabase.co/auth/v1/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + session.access_token
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific error codes
        if (errorData.error_code === 'same_password') {
          throw new Error('New password must be different from your current password');
        }
        throw new Error(errorData.msg || errorData.message || 'Failed to update password');
      }

      // Clear session and redirect to login
      localStorage.removeItem('sb-pkubmisamfhmtirhsyqv-auth-token');
      await supabase.auth.signOut();
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (error && !isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-4">Link Expired</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-4">Password Updated!</h1>
          <p className="text-gray-600 mb-6">You can now log in with your new password.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Set New Password</h1>
          <p className="text-gray-600">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
