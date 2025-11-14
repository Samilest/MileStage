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
                disabled={loading || success !== ''}
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
                disabled={loading || success !== ''}
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
                disabled={loading || success !== ''}
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
                disabled={loading || success !== ''}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || success !== ''}
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
