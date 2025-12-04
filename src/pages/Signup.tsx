import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import Button from '../components/Button';
import { retryOperation } from '../lib/errorHandling';

export default function Signup() {
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error('Failed to sign in with Google');
      console.error('Google sign-in error:', err);
      setOauthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await retryOperation(
        async () => {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: fullName,
              },
            },
          });

          if (signUpError) throw signUpError;
          return data;
        },
        3,
        'signup'
      );

      if (result?.user) {
        setUser({
          id: result.user.id,
          email: email,
          name: fullName,
        });

        setSuccess('Account created! Redirecting...');
        toast.success('Welcome! Account created.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setError('This email is already registered');
      } else if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setError('Connection error. Please check your internet and try again.');
        toast.error('Connection lost. Retrying...');
      } else {
        setError('Unable to create account. Please try again.');
        console.error('Signup error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-bg flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="max-w-2xl w-full space-y-6 sm:space-y-8">
        <div className="animate-fade-in">
          <h2 className="text-center text-3xl sm:text-4xl lg:text-6xl font-bold text-text-primary leading-tight">
            Create your account
          </h2>
          <p className="mt-4 sm:mt-6 text-center text-sm sm:text-base lg:text-lg text-text-secondary leading-relaxed">
            Start tracking your project payments
          </p>
        </div>
        
        <div className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 lg:p-8 shadow rounded-lg animate-fade-in animate-stagger-1">
          {/* Social Sign-In Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || oauthLoading || success !== ''}
              className="w-full min-h-[48px] flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full min-h-[44px] h-12 px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="John Doe"
                disabled={loading || oauthLoading || success !== ''}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] h-12 px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="you@example.com"
                disabled={loading || oauthLoading || success !== ''}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[44px] h-12 px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="••••••••"
                disabled={loading || oauthLoading || success !== ''}
              />
              <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full min-h-[44px] h-12 px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="••••••••"
                disabled={loading || oauthLoading || success !== ''}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || oauthLoading || success !== ''}
              className="w-full min-h-[44px]"
            >
              {loading ? 'Creating Account...' : success ? 'Success!' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-primary hover:text-primary-hover transition-colors text-sm sm:text-base min-h-[44px] inline-flex items-center">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
