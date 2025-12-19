import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import Card from '../components/Card';
import Button from '../components/Button';
import ManageBillingButton from '../components/ManageBillingButton';
import { User, Mail, CreditCard, Check, Loader2 } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [stripeConnected, setStripeConnected] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('');
  const [errors, setErrors] = useState({
    fullName: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setLoadingProfile(true);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('name, email, stripe_account_id, stripe_customer_id, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.name || '');
        setEmail(data.email || user.email || '');
        setStripeConnected(!!data.stripe_account_id);
        setSubscriptionStatus(data.subscription_status || 'trialing');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      fullName: '',
    };

    if (!fullName || fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return !newErrors.fullName;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Saving changes...');

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: fullName.trim(),
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast.success('Profile updated successfully!', { id: loadingToast });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    navigate('/reset-password');
  };

  if (!user) return null;

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors({ ...errors, fullName: '' });
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="John Smith"
                  disabled={loading}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              {/* Stripe Status (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe for Project Payments
                </label>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  stripeConnected 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <CreditCard className={`w-5 h-5 ${
                    stripeConnected ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <span className={`font-medium ${
                    stripeConnected ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {stripeConnected ? (
                      <>
                        <Check className="w-4 h-4 inline mr-1" />
                        Connected
                      </>
                    ) : (
                      'Not Connected'
                    )}
                  </span>
                </div>
                {!stripeConnected && (
                  <p className="mt-1 text-xs text-gray-500">
                    Connect Stripe when you create your first project to receive client payments.
                  </p>
                )}
                {stripeConnected && (
                  <p className="mt-1 text-xs text-gray-500">
                    You can receive project payments from clients via Stripe.
                  </p>
                )}
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Subscription Management Card */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {subscriptionStatus === 'active' && '✅ Active'}
                      {subscriptionStatus === 'trialing' && '🔄 Trial'}
                      {subscriptionStatus === 'past_due' && '⚠️ Past Due'}
                      {subscriptionStatus === 'canceled' && '❌ Canceled'}
                      {!subscriptionStatus && '🔄 Trial'}
                    </p>
                  </div>
                  {subscriptionStatus === 'active' && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Plan</p>
                      <p className="text-lg font-semibold text-gray-900">Pro</p>
                    </div>
                  )}
                </div>

                {subscriptionStatus === 'active' ? (
                  <>
                    <ManageBillingButton 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                    />
                    <p className="mt-3 text-xs text-gray-500">
                      Manage your subscription, update payment method, view invoices, or cancel.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <p className="text-sm text-blue-800">
                        {subscriptionStatus === 'trialing' 
                          ? 'You\'re currently on a free trial. Upgrade to continue using MileStage after your trial ends.'
                          : 'Upgrade to Pro to continue using MileStage.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Navigate to landing page with pricing hash
                        navigate('/#pricing');
                        // Force scroll after brief delay
                        setTimeout(() => {
                          const pricingSection = document.getElementById('pricing');
                          if (pricingSection) {
                            pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 300);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                    >
                      Upgrade to Pro
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Security Card */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Security</h2>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Change your password to keep your account secure
                </p>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Change Password
                </button>
              </div>
            </div>
          </Card>
        </form>
      </main>
    </div>
  );
}
