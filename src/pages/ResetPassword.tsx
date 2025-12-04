import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRecoveryToken = async () => {
      console.log('[ResetPassword] Checking for recovery token...');
      console.log('[ResetPassword] Hash:', location.hash);

      // Check for recovery token in hash
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      console.log('[ResetPassword] Token type:', type);
      console.log('[ResetPassword] Has access token:', !!accessToken);

      if (type === 'recovery' && accessToken) {
        console.log('[ResetPassword] Valid recovery token found');
        
        // Set the session from the recovery token
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (error) {
            console.error('[ResetPassword] Error setting session:', error);
            setError('Invalid or expired reset link. Please request a new one.');
            setIsValidToken(false);
            return;
          }

          if (data.session) {
            console.log('[ResetPassword] Session set successfully');
            setIsValidToken(true);
            // Clear the hash from URL for cleaner look
            window.history.replaceState(null, '', location.pathname);
          } else {
            setError('Invalid or expired reset link. Please request a new one.');
            setIsValidToken(false);
          }
        } catch (err) {
          console.error('[ResetPassword] Error:', err);
          setError('Invalid or expired reset link. Please request a new one.');
          setIsValidToken(false);
        }
      } else {
        // No token in hash, check if we have an active session (from PASSWORD_RECOVERY event)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('[ResetPassword] Existing session found');
          setIsValidToken(true);
        } else {
          console.log('[ResetPassword] No session or token');
          setError('Invalid or expired reset link. Please request a new one.');
          setIsValidToken(false);
        }
      }
    };

    checkRecoveryToken();
  }, [location]);

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
      console.log('[ResetPassword] Updating password...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      console.log('[ResetPassword] Update result:', { data, error });

      if (error) {
        console.error('[ResetPassword] Update error:', error);
        throw error;
      }

      console.log('[ResetPassword] Password updated successfully');
      
      // Sign out after password reset
      try {
        await supabase.auth.signOut();
        console.log('[ResetPassword] Signed out');
      } catch (signOutError) {
        console.log('[ResetPassword] Sign out error (non-critical):', signOutError);
        // Continue even if sign out fails
      }
      
      setIsSuccess(true);
    } catch (err: any) {
      console.error('[ResetPassword] Password update error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
      setIsLoading(false);
    }
  };

  // Still checking token validity
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-black mb-4">Invalid Reset Link</h1>
          
          <p className="text-gray-600 mb-6">
            {error || 'This password reset link is invalid or has expired.'}
          </p>

          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Request New Reset Link
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full mt-3 bg-white text-gray-700 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-black mb-4">Password Updated!</h1>
          
          <p className="text-gray-600 mb-6">
            Your password has been successfully updated. You can now log in with your new password.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Set New Password</h1>
          <p className="text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
