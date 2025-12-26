import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Shield, Zap, Clock } from 'lucide-react';
import Navigation from '../components/Navigation';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import toast from 'react-hot-toast';

export default function Upgrade() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const { subscription } = useSubscription();
  const [isAnnual, setIsAnnual] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan: 'monthly' | 'annual') => {
    if (!user?.id) {
      toast.error('Please log in to upgrade');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          plan: plan,
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const features = [
    { title: 'Unlimited projects & clients', desc: 'No limits on scale' },
    { title: 'Zero transaction fees', desc: 'Keep 100% of your payments' },
    { title: 'Stage locking & scope protection', desc: 'Prevent scope creep automatically' },
    { title: 'Revision tracking', desc: 'Clients can purchase extra revisions' },
    { title: 'Professional client portal', desc: 'Clean interface with minimal branding' },
    { title: 'Automated payment reminders', desc: 'Stop chasing payments' },
    { title: 'Multi-currency support', desc: 'USD, EUR, GBP, CAD, AUD & more' },
    { title: 'Real-time Stripe sync', desc: 'Instant payment updates' },
    { title: 'Priority support', desc: 'Email support within 24 hours' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-md mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Upgrade to MileStage Pro
          </h1>
          <p className="text-gray-600">
            {subscription.isTrialExpired 
              ? 'Your trial has ended. Upgrade to continue.'
              : `You have ${subscription.daysRemaining} days left in your trial.`
            }
          </p>
        </div>

        {/* Trial expired alert */}
        {subscription.isTrialExpired && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>Your existing projects are safe.</strong> Upgrade to create new projects.
              </p>
            </div>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAnnual ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                isAnnual ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Annual
            <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
              Save 37%
            </span>
          </span>
        </div>

        {/* Pricing Card - Narrow like landing page */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          {/* Badge */}
          <div className="flex justify-center mb-4">
            <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Everything Included
            </span>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            {isAnnual ? (
              <>
                <div className="text-5xl font-bold text-gray-900 mb-1">
                  $12<span className="text-xl text-gray-500 font-normal">/month</span>
                </div>
                <p className="text-sm text-gray-500">Billed annually at $144/year</p>
                <p className="text-sm text-green-600 font-medium">Save $84/year</p>
              </>
            ) : (
              <>
                <div className="text-5xl font-bold text-gray-900 mb-1">
                  $19<span className="text-xl text-gray-500 font-normal">/month</span>
                </div>
                <p className="text-sm text-gray-500">Billed monthly</p>
              </>
            )}
          </div>

          {/* What's included label */}
          <p className="text-center text-sm font-semibold text-gray-900 mb-4">What's included:</p>

          {/* Features list - single column */}
          <div className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-900 text-sm">{feature.title}</span>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={() => handleUpgrade(isAnnual ? 'annual' : 'monthly')}
            disabled={loading}
            className="w-full py-3.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              `Upgrade Now — ${isAnnual ? '$144/year' : '$19/month'}`
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-3">
            Secure payment via Stripe • Cancel anytime
          </p>
        </div>

        {/* 30-day guarantee */}
        <div className="text-center mb-6">
          <p className="font-semibold text-gray-900 text-sm">30-Day Money-Back Guarantee</p>
          <p className="text-xs text-gray-500">Not happy? Email us for a full refund.</p>
        </div>

        {/* Support note */}
        <p className="text-center text-xs text-gray-500">
          Questions?{' '}
          <a href="mailto:support@milestage.com" className="text-green-600 hover:underline">
            support@milestage.com
          </a>
        </p>
      </main>
    </div>
  );
}
