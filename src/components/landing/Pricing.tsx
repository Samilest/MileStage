import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const features = [
    { title: 'Unlimited projects & clients', desc: 'No limits on scale' },
    { title: 'Zero transaction fees', desc: 'Keep 100% of payments' },
    { title: 'Stage locking', desc: 'Prevent scope creep automatically' },
    { title: 'Revision tracking', desc: 'Clients can purchase extras' },
    { title: 'Professional client portal', desc: 'Clean, minimal interface' },
    { title: 'Automated reminders', desc: 'Stop chasing payments' },
    { title: 'Multi-currency support', desc: 'USD, EUR, GBP & more' },
    { title: 'Real-time Stripe sync', desc: 'Instant payment updates' },
    { title: 'Quote & Invoice PDFs', desc: 'Professional documents' },
    { title: 'Priority support', desc: 'Email support within 24h' },
  ];

  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Simple Pricing
          </h2>
          <p className="text-gray-600">
            One plan. All features. No hidden fees.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAnnual ? 'bg-green-600' : 'bg-gray-300'
            }`}
            aria-label="Toggle pricing"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAnnual ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Annual
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
              Save 37%
            </span>
          </span>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 sm:p-8 relative">
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-green-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
              Everything Included
            </span>
          </div>

          {/* Price */}
          <div className="text-center mb-6 mt-4">
            {isAnnual ? (
              <>
                <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-1">
                  $12<span className="text-lg text-gray-500">/mo</span>
                </div>
                <p className="text-sm text-gray-500">Billed annually at $144/year</p>
                <p className="text-xs text-green-600 font-medium mt-1">Save $84/year</p>
              </>
            ) : (
              <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-1">
                $19<span className="text-lg text-gray-500">/mo</span>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="mb-6">
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="text-gray-900 text-sm font-medium">{feature.title}</span>
                    <p className="text-xs text-gray-500">{feature.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <Link
            to="/signup"
            className="block w-full text-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors mb-3"
          >
            Start Free Trial
          </Link>

          <p className="text-center text-xs text-gray-500">
            14-day free trial • No credit card • Cancel anytime
          </p>

          {/* Guarantee */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs font-semibold text-gray-900 mb-1">
              30-Day Money-Back Guarantee
            </p>
            <p className="text-xs text-gray-500">
              Not happy? Full refund, no questions.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Questions?{' '}
            <a href="mailto:support@milestage.com" className="text-green-600 hover:text-green-700 font-medium">
              support@milestage.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
