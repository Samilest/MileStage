// src/components/landing/Pricing.tsx
// Updated pricing page with Stripe integration

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UpgradeButton from '../UpgradeButton';
import { useStore } from '../../store/useStore';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();
  const user = useStore((state) => state.user);

  const monthlyPrice = 19;
  const annualPrice = 144; // $12/month billed annually
  const monthlyEquivalent = 12;

  const features = [
    'Unlimited projects',
    'Automated payment reminders',
    'Stage locking (prevent scope creep)',
    'Real-time Stripe sync',
    'Client portal',
    'Revision tracking',
    'Priority support',
    'Zero transaction fees',
  ];

  // Stripe Price IDs (you'll get these from Stripe Dashboard)
  const STRIPE_PRICE_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_monthly_xxx';
  const STRIPE_PRICE_ANNUAL = import.meta.env.VITE_STRIPE_PRICE_ANNUAL || 'price_annual_xxx';

  const handleGetStarted = () => {
    if (user) {
      // User logged in - show upgrade options
      return;
    } else {
      // Not logged in - go to signup
      navigate('/signup');
    }
  };

  return (
    <section className="py-24 lg:py-32 bg-gray-50" id="pricing">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-black mb-4">
            Simple Pricing. Zero Transaction Fees.
          </h2>
          <p className="text-xl text-gray-600">
            Try free for 14 days. No credit card required.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-lg font-medium ${!isAnnual ? 'text-black' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-16 h-8 bg-gray-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            style={{ backgroundColor: isAnnual ? '#10B981' : '#D1D5DB' }}
          >
            <span
              className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200"
              style={{ transform: isAnnual ? 'translateX(32px)' : 'translateX(0)' }}
            />
          </button>
          <span className={`text-lg font-medium ${isAnnual ? 'text-black' : 'text-gray-500'}`}>
            Annual
            <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
              Save 37%
            </span>
          </span>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 lg:p-10">
          
          {/* Price */}
          <div className="text-center mb-8">
            {isAnnual ? (
              <>
                <div className="text-5xl font-bold text-black mb-2">
                  ${monthlyEquivalent}
                  <span className="text-2xl text-gray-600 font-normal">/month</span>
                </div>
                <p className="text-gray-600">
                  Billed annually at ${annualPrice}/year
                </p>
              </>
            ) : (
              <div className="text-5xl font-bold text-black mb-2">
                ${monthlyPrice}
                <span className="text-2xl text-gray-600 font-normal">/month</span>
              </div>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-lg text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="text-center">
            {user ? (
              <UpgradeButton
                priceId={isAnnual ? STRIPE_PRICE_ANNUAL : STRIPE_PRICE_MONTHLY}
                label="Upgrade Now"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
              />
            ) : (
              <button
                onClick={handleGetStarted}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
              >
                Start Free Trial
              </button>
            )}
            <p className="text-sm text-gray-600 mt-4">
              14-day free trial. No credit card needed. Cancel anytime.
            </p>
          </div>

        </div>

        {/* Fine print */}
        <p className="text-center text-sm text-gray-500 mt-8">
          All plans include unlimited projects and zero transaction fees. 
          Manage your subscription anytime through your settings.
        </p>

      </div>
    </section>
  );
}
