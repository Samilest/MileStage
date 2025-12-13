import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function Pricing() {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const features = [
    'Unlimited projects',
    'Automated payment reminders',
    'Stage locking (prevent scope creep)',
    'Real-time Stripe sync',
    'Client portal',
    'Smart dashboard',
    'Priority support',
    'Zero transaction fees',
  ];

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-gray-50 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-black mb-4">
            Simple Pricing.
            <br className="sm:hidden" /> Zero Transaction Fees.
          </h2>
          <p className="text-xl text-gray-600 mt-4">
            Try free for 14 days. No credit card required.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 lg:p-12">
            
            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <button
                onClick={() => setIsAnnual(false)}
                className={`text-lg font-medium transition-colors ${
                  !isAnnual ? 'text-black' : 'text-gray-400'
                }`}
              >
                Monthly
              </button>
              
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isAnnual ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    isAnnual ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
              
              <button
                onClick={() => setIsAnnual(true)}
                className={`text-lg font-medium transition-colors ${
                  isAnnual ? 'text-black' : 'text-gray-400'
                }`}
              >
                Annual
                {isAnnual && (
                  <span className="ml-2 text-green-600 text-sm font-semibold">
                    Save 37%
                  </span>
                )}
              </button>
            </div>

            {/* Price */}
            <div className="text-center mb-10">
              {!isAnnual ? (
                <div>
                  <div className="text-6xl font-bold text-black mb-2">
                    $19
                    <span className="text-2xl text-gray-600 font-normal">/month</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-6xl font-bold text-black mb-2">
                    $12
                    <span className="text-2xl text-gray-600 font-normal">/month</span>
                  </div>
                  <p className="text-gray-600 text-lg">
                    Billed annually at $144/year
                  </p>
                </div>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-10">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-lg text-gray-700">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl mb-4"
            >
              Start Free Trial
            </button>

            <p className="text-center text-gray-600 text-sm">
              14-day free trial · No credit card needed · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
