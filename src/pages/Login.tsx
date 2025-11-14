import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import Button from '../components/Button';
import { retryOperation } from '../lib/errorHandling';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      toast.error(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await retryOperation(
        async () => {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) throw signInError;
          return data;
        },
        3,
        'login'
      );

      if (result?.user) {
        setUser({
          id: result.user.id,
          email: result.user.email || '',
          name: result.user.user_metadata?.name || result.user.email?.split('@')[0] || 'User',
        });
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setError('Connection error. Please check your internet and try again.');
        toast.error('Connection lost. Please try again.');
      } else {
        setError('Unable to sign in. Please try again.');
        console.error('Login error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-bg flex items-center justify-center px-4 sm:px-6 lg:px-8 page-enter">
      <div className="max-w-2xl w-full space-y-6 sm:space-y-8">
        <div className="animate-fade-in">
          <h2 className="text-center text-3xl sm:text-4xl lg:text-6xl font-bold text-text-primary leading-tight">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 lg:p-8 shadow rounded-lg animate-fade-in animate-stagger-1">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[44px] h-12 px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px]"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/signup" className="text-primary hover:text-primary-hover transition-colors text-sm sm:text-base min-h-[44px] inline-flex items-center">
              Don't have an account? Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
