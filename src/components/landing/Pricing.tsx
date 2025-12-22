import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            One plan. All features. No hidden fees.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-lg font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              isAnnual ? 'bg-green-600' : 'bg-gray-300'
            }`}
            aria-label="Toggle pricing"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isAnnual ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-lg font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Annual
            <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
              Save 37%
            </span>
          </span>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-8 relative">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                Everything Included
              </span>
            </div>

            <div className="text-center mb-8 mt-4">
              {isAnnual ? (
                <>
                  <div className="text-6xl font-bold text-gray-900 mb-2">
                    $12<span className="text-2xl text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600">Billed annually at $144/year</p>
                  <p className="text-sm text-green-600 font-semibold mt-1">Save $84/year</p>
                </>
              ) : (
                <div className="text-6xl font-bold text-gray-900 mb-2">
                  $19<span className="text-2xl text-gray-600">/month</span>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 text-center">What's included:</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 flex-shrink-0 text-xl">✓</span>
                  <div>
                    <span className="text-gray-900 font-medium">Unlimited projects & clients</span>
                    <p className="text-sm text-gray-600">No limits on scale</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 flex-shrink-0 text-xl">✓</span>
                  <div>
                    <span className="text-gray-900 font-medium">Zero transaction fees</span>
                    <p className="text-sm text-gray-600">Keep 100% of your payments</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 flex-shrink-0 text-xl">✓</span>
                  <div>
                    <span className="text-gray-900 font-medium">Stage locking & scope protection</span>
                    <p className="text-sm text-gray-600">Prevent scope creep automatically</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 flex-shrink-0 text-xl">✓</span>
                  <div>
                    <span className="text-gray-900 font-medium">Revision tracking</span>
                    <p className="text-sm text-gray-600">Clients can purchase extra revisions</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 flex-shrink-0 text-xl">✓</span>
                  <div>
                    <span className="text-gray-900 font-medium">Clean client portal</span>
                    <p className="text-sm text-gray-600">Professional, no MileStage branding</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 flex-shrink-0 text-xl">✓</span>
                  <div>
                    <span className="text-gray-900 font-medium">Automated payment reminders</span>
                    <p className="text-sm text-gray-600">Stop chasing payments</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 flex-shrink-0 text-xl">✓</span>
                  <div>
                    <span className="text-gray-900 font-medium">Multi-currency support</span>
                    <p className="text-sm text-gray-600">USD, EUR, GBP, CAD, AUD & more</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 flex-shrink-0 text-xl">✓</span>
                  <div>
                    <span className="text-gray-900 font-medium">Real-time Stripe sync</span>
                    <p className="text-sm text-gray-600">Instant payment updates</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 flex-shrink-0 text-xl">✓</span>
                  <div>
                    <span className="text-gray-900 font-medium">Priority support</span>
                    <p className="text-sm text-gray-600">Email support within 24 hours</p>
                  </div>
                </li>
              </ul>
            </div>

            <Link
              to="/signup"
              className="block w-full text-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30 mb-4 text-lg"
            >
              Start Free Trial
            </Link>

            <p className="text-center text-sm text-gray-600">
              14-day free trial • No credit card needed • Cancel anytime
            </p>

            {/* 30-Day Guarantee */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  30-Day Money-Back Guarantee
                </p>
                <p className="text-sm text-gray-600">
                  Not happy? Email us for a full refund.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-gray-600">
            Questions about pricing? Email us at{' '}
            <a href="mailto:support@milestage.com" className="text-green-600 hover:text-green-700 font-medium">
              support@milestage.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
